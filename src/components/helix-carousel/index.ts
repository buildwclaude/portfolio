import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const DEFAULT_IMAGES: string[] = Array.from(
  { length: 20 },
  (_, i) => `https://picsum.photos/seed/helix${i}/440/280`,
);

export type HelixOptions = {
  images?: string[];
  radius?: number;
  angleStep?: number;
  rise?: number;
  speed?: number;
  cardWidth?: number;
  cardHeight?: number;
  height?: number;
  perspective?: number;
  alt?: (index: number) => string;
  label?: string;
};

export function createHelixCarousel(options: HelixOptions = {}) {
  const {
    images = DEFAULT_IMAGES,
    radius = 350, // Increased to prevent overlap
    angleStep = 35, // Adjust step for wider radius
    rise = 50,
    speed = 1,
    cardWidth = 220,
    cardHeight = 140,
    height = 600,
    label = '',
  } = options;

  const count = images.length;
  
  const element = document.createElement('div');
  element.className = 'helix';
  element.style.height = `${height}px`;
  element.style.position = 'relative';
  element.style.overflow = 'hidden';
  element.style.cursor = 'grab';
  element.setAttribute('data-lenis-prevent', 'true');
  
  // Soften the hard rectangular edges of the container
  element.style.webkitMaskImage = 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)';
  element.style.maskImage = 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)';

  if (label) {
    element.setAttribute('role', 'group');
    element.setAttribute('aria-label', label);
  }

  const canvas = document.createElement('canvas');
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.pointerEvents = 'none'; 
  element.appendChild(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 2000);
  camera.position.z = radius + 450; 

  const textureLoader = new THREE.TextureLoader();
  const meshes: THREE.Mesh[] = [];

  const geometry = new THREE.PlaneGeometry(cardWidth, cardHeight, 32, 16); 

  const vertexShader = `
    uniform float uRadius;
    uniform float uVelocity;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      vec3 pos = position;
      
      // "Pushed inside" concave effect
      float pushInside = sin(uv.x * 3.14159265) * sin(uv.y * 3.14159265);
      pos.z -= pushInside * 15.0; // curve center inwards
      
      // Dynamic scroll bending effect
      pos.y += pushInside * uVelocity * 0.15;
      
      float angle = pos.x / uRadius;
      pos.x = sin(angle) * uRadius;
      pos.z += cos(angle) * uRadius - uRadius;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `;

  const fragmentShader = `
    uniform sampler2D uTexture;
    uniform float uOpacity;
    uniform vec2 uResolution;
    uniform float uBorderRadius;
    varying vec2 vUv;
    void main() {
      vec4 texColor = texture2D(uTexture, vUv);
      vec3 finalColor = mix(texColor.rgb * 0.5, texColor.rgb, uOpacity);
      
      vec2 pixelPos = vUv * uResolution;
      vec2 halfRes = uResolution * 0.5;
      vec2 d = abs(pixelPos - halfRes) - (halfRes - uBorderRadius);
      float dist = min(max(d.x, d.y), 0.0) + length(max(d, vec2(0.0))) - uBorderRadius;
      
      float alphaMask = 1.0 - smoothstep(0.0, 1.5, dist);
      
      gl_FragColor = vec4(finalColor, texColor.a * uOpacity * alphaMask);
    }
  `;

  const group = new THREE.Group();
  scene.add(group);

  images.forEach((src) => {
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTexture: { value: null },
        uRadius: { value: radius },
        uOpacity: { value: 1.0 },
        uVelocity: { value: 0.0 }, // Dynamic scroll velocity
        uResolution: { value: new THREE.Vector2(cardWidth, cardHeight) },
        uBorderRadius: { value: 12.0 } 
      },
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    
    textureLoader.load(src, (tex) => {
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      material.uniforms.uTexture!.value = tex;
    });

    const mesh = new THREE.Mesh(geometry, material);
    meshes.push(mesh);
    group.add(mesh);
  });

  let t = 0;

  function render() {
    for (let i = 0; i < count; i++) {
      const p = ((((i - t) % count) + count) % count) - count / 2;
      const angle = p * angleStep * (Math.PI / 180);

      const mesh = meshes[i];
      if (!mesh) continue;

      mesh.position.x = Math.sin(angle) * radius;
      mesh.position.z = Math.cos(angle) * radius;
      mesh.position.y = -p * rise;
      mesh.rotation.y = angle;

      const endFade = Math.max(0, Math.min(1, (count / 2 - Math.abs(p)) / (count * 0.3)));
      
      // Fully opaque background cards (100% opacity always, only fade out at top/bottom edges)
      const backDim = 1.0; 
      
      const mat = mesh.material as THREE.ShaderMaterial;
      mat.uniforms.uOpacity!.value = endFade * backDim;
    }
    renderer.render(scene, camera);
  }



  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      render();
    }
  });
  resizeObserver.observe(element);

  let isDragging = false;
  let lastX = 0;
  let dragDelta = 0;

  // Faster base speed (increased by ~30%)
  const autoPlayVelocity = speed * 0.115;
  let velocity = autoPlayVelocity;

  const onPointerDown = (e: PointerEvent) => {
    isDragging = true;
    lastX = e.clientX;
    dragDelta = 0;
    element.style.cursor = 'grabbing';
  };
  
  const onPointerMove = (e: PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    dragDelta = -dx * 0.002;
    t += dragDelta; // instant follow
  };

  const onPointerUp = () => {
    if (!isDragging) return;
    isDragging = false;
    element.style.cursor = 'grab';
    // Throw with momentum (rough 60fps equivalent)
    velocity = dragDelta * 60; 
  };

  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    // Inject velocity directly for scroll momentum
    velocity += e.deltaY * 0.005; 
  };

  element.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  element.addEventListener('wheel', onWheel, { passive: false });

  let isVisible = false;

  const observer = new IntersectionObserver(([entry]) => {
    isVisible = entry?.isIntersecting ?? false;
    if (isVisible && !frame) {
      lastTime = performance.now();
      frame = requestAnimationFrame(tick);
    }
  });
  observer.observe(element);

  let frame = 0;
  let lastTime = performance.now();

  function tick(now: number) {
    if (!isVisible) {
      frame = 0;
      return;
    }
    
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    if (!isDragging) {
      // Smoothly decay injected velocity back to autoplay speed for beautiful inertia
      velocity += (autoPlayVelocity - velocity) * (1 - Math.exp(-1.5 * dt));
      t += velocity * dt;
    }
    
    // Pass velocity to shader for dynamic bending
    meshes.forEach((mesh) => {
      const mat = mesh.material as THREE.ShaderMaterial;
      mat.uniforms.uVelocity!.value = velocity;
    });

    render();
    frame = requestAnimationFrame(tick);
  }
  frame = requestAnimationFrame(tick);

  return {
    element,
    destroy() {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      renderer.dispose();
      meshes.forEach(m => {
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
      });
      element.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      element.removeEventListener('wheel', onWheel);
      element.remove();
    },
  };
}
