import * as THREE from 'three';
import Lenis from 'lenis';

export async function initWarpGl() {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  const canvas = document.createElement('canvas');
  canvas.classList.add('warp-canvas');
  document.body.appendChild(canvas);

  /* ---------------- shaders ---------------- */
  const vert = `
  uniform float uVelocity;
  uniform float uHover;
  uniform float uEnter;
  varying vec2 vUv;
  varying float vBow;
  const float PI = 3.14159265;
  void main(){
    vUv = uv;
    vec3 pos = position;
    float bowX = sin(uv.x * PI);
    float bowY = sin(uv.y * PI);
    float v = clamp(uVelocity, -90.0, 90.0);
    pos.z -= bowX * v * 2.2;
    pos.z -= bowY * v * 0.8;
    pos.y *= 1.0 + abs(v) * 0.0022;
    pos.z -= (1.0 - uEnter) * 240.0;
    pos.z += uHover * 26.0;
    vBow = bowX * v;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }`;

  const frag = `
  precision highp float;
  uniform sampler2D uTexture;
  uniform vec2 uCover;
  uniform float uVelocity;
  uniform float uEnter;
  uniform float uHover;
  varying vec2 vUv;
  varying float vBow;
  void main(){
    vec2 uv = (vUv - 0.5) * uCover + 0.5;
    float amt = clamp(abs(uVelocity) * 0.00035, 0.0, 0.018);
    float r = texture2D(uTexture, uv + vec2(amt, 0.0)).r;
    vec4  g = texture2D(uTexture, uv);
    float b = texture2D(uTexture, uv - vec2(amt, 0.0)).b;
    vec3 col = vec3(r, g.g, b);
    col *= 1.0 - abs(vBow) * 0.004;
    col += uHover * 0.05;
    col *= mix(0.15, 1.0, uEnter);
    gl_FragColor = vec4(col, uEnter * g.a);
  }`;

  /* ---------------- placeholder textures ---------------- */
  const PAL = ['#E5B25D','#49D4E8','#F0567F','#EDE8DE'];
  const seeded = (s: number) => () => (s = s * 16807 % 2147483647) / 2147483647;
  function generate(kind='field'){
    const w=900,h=1120,cv=document.createElement('canvas');
    cv.width=w;cv.height=h;const c=cv.getContext('2d')!;const r=seeded(kind.length*977+13);
    c.fillStyle='#14181F';c.fillRect(0,0,w,h);
    const draw: Record<string, () => void>={
      field(){c.lineWidth=1.4;for(let i=0;i<340;i++){let x=r()*w,y=r()*h;c.strokeStyle=PAL[(i*7)%4]+'55';c.beginPath();c.moveTo(x,y);for(let s=0;s<70;s++){const a=Math.sin(x*.006)*2+Math.cos(y*.005)*2;x+=Math.cos(a)*7;y+=Math.sin(a)*7;c.lineTo(x,y);}c.stroke();}},
      moire(){c.lineWidth=2;for(const[cx,cy,col]of[[w*.38,h*.45,'#EDE8DE30'],[w*.62,h*.55,'#49D4E840']] as const){c.strokeStyle=col;for(let i=1;i<110;i++){c.beginPath();c.arc(cx as number,cy as number,i*14,0,7);c.stroke();}}},
      rings(){for(let i=0;i<60;i++){c.strokeStyle=PAL[i%4]+(i%3?'40':'99');c.lineWidth=r()*5+.6;c.beginPath();c.arc(w*.5,h*1.05,60+i*(h/52),Math.PI*1.12,Math.PI*1.88);c.stroke();}},
      strata(){let y=0;while(y<h){const band=10+r()*44;c.fillStyle=PAL[Math.floor(r()*4)]+(r()>.78?'CC':'22');c.beginPath();c.moveTo(0,y);for(let x=0;x<=w;x+=24)c.lineTo(x,y+Math.sin(x*.01+y*.05)*9);c.lineTo(w,y+band);c.lineTo(0,y+band);c.fill();y+=band;}},
      dots(){const st=w/26;for(let x=st/2;x<w;x+=st)for(let y=st/2;y<h;y+=st){const d=Math.hypot(x-w*.5,y-h*.62)/w;const rad=Math.max(.6,(Math.sin(d*15-1)*.5+.5)*st*.42);c.fillStyle=r()>.93?'#F0567F':'#EDE8DEAA';c.beginPath();c.arc(x,y,rad,0,7);c.fill();}},
      grid(){c.strokeStyle='#EDE8DE22';c.lineWidth=1.5;for(let i=0;i<=16;i++){c.beginPath();c.moveTo(w/16*i,0);c.lineTo(w/16*i,h);c.stroke();c.beginPath();c.moveTo(0,h/20*i);c.lineTo(w,h/20*i);c.stroke();}c.font=`700 ${w*.32}px 'Space Mono', monospace`;c.fillStyle='#E5B25D';c.fillText('06',w*.1,h*.56);c.strokeStyle='#49D4E8';c.lineWidth=2;c.strokeText('06',w*.1+10,h*.56+12);}
    };
    (draw[kind]||draw.field)();
    return cv;
  }

  const loader = new THREE.TextureLoader();
  const loadTexture = (img: HTMLImageElement): Promise<THREE.Texture> => new Promise(res => {
    const done = (t: THREE.Texture) => { t.colorSpace = THREE.SRGBColorSpace; t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; res(t); };
    loader.load(img.getAttribute('src') || '', done, undefined,
      () => done(new THREE.CanvasTexture(generate(img.dataset.fallback || 'field'))));
  });

  const PERSPECTIVE = 1000;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha:true, antialias:true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  let vp = { w: innerWidth, h: innerHeight };
  renderer.setSize(vp.w, vp.h);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, vp.w/vp.h, 10, 4000);
  camera.position.z = PERSPECTIVE;
  const setFov = () => {
    camera.fov = 2 * Math.atan((vp.h / 2) / PERSPECTIVE) * (180 / Math.PI);
    camera.aspect = vp.w / vp.h;
    camera.updateProjectionMatrix();
  };
  setFov();

  const GEO = new THREE.PlaneGeometry(1, 1, 40, 40);
  const planes: any[] = [];

  for (const el of document.querySelectorAll('[data-gl]')) {
    const img = el.querySelector('img');
    if(!img) continue;
    const texture = await loadTexture(img);
    const im = texture.image;
    const imgAspect = (im.width || 1) / (im.height || 1);

    const material = new THREE.ShaderMaterial({
      vertexShader: vert, fragmentShader: frag, transparent: true,
      uniforms: {
        uTexture:{value:texture}, uCover:{value:new THREE.Vector2(1,1)},
        uVelocity:{value:0}, uEnter:{value:0}, uHover:{value:0}
      }
    });
    const mesh = new THREE.Mesh(GEO, material);
    const card = el.closest('.card') || el;
    const p = { el, mesh, material, imgAspect, speed:parseFloat(card.getAttribute('data-speed')||'0'), enter:0, hover:0, hoverTarget:0 };
    card.addEventListener('mouseenter', () => p.hoverTarget = 1);
    card.addEventListener('mouseleave', () => p.hoverTarget = 0);
    scene.add(mesh);
    planes.push(p);
  }
  document.body.classList.add('gl-ready');

  function sizePlanes() {
    for (const p of planes) {
      const r = p.el.getBoundingClientRect();
      if(r.width === 0) continue;
      p.mesh.scale.set(r.width, r.height, 1);
      const planeAspect = r.width / r.height;
      const cover = p.material.uniforms.uCover.value;
      if (p.imgAspect > planeAspect) cover.set(planeAspect / p.imgAspect, 1);
      else cover.set(1, p.imgAspect / planeAspect);
    }
  }
  sizePlanes();

  let rawVel = 0, velocity = 0, scroll = 0;

  window.addEventListener('resize', () => {
    vp = { w: innerWidth, h: innerHeight };
    renderer.setSize(vp.w, vp.h);
    setFov(); sizePlanes();
  });

  function raf() {
    scroll = window.scrollY;
    velocity += (rawVel - velocity) * 0.14;
    if (Math.abs(velocity) < 0.01) velocity = 0;
    const v = reduce ? 0 : velocity;

    for (const p of planes) {
      const r = p.el.getBoundingClientRect();
      p.mesh.position.x = r.left - vp.w/2 + r.width/2;
      p.mesh.position.y = -r.top + vp.h/2 - r.height/2 + scroll * p.speed;

      const visible = r.top < vp.h * 0.92 && r.bottom > 0;
      p.enter += ((visible ? 1 : 0) - p.enter) * 0.06;
      p.hover += (p.hoverTarget - p.hover) * 0.12;

      p.material.uniforms.uVelocity.value = v;
      p.material.uniforms.uEnter.value = p.enter;
      p.material.uniforms.uHover.value = p.hover;
      p.mesh.visible = r.bottom > -200 && r.top < vp.h + 200;
    }

    renderer.render(scene, camera);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  return {
    setVelocity(v: number) {
      // In original warp, velocity was raw pixels/frame. Lenis onVelocity gives roughly -1.5 to 1.5.
      // We'll scale it up to match the warp shader's expectation (which expects roughly -60 to 60).
      rawVel = v * 40.0;
    }
  };
}
