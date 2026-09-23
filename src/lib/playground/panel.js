/* The detail sheet. One instance, shared by the homepage list and the
   playground — clicking a piece in either place opens the same thing. */

const $ = (id) => document.getElementById(id);

const panel = $('panel');
const scrim = $('scrim');

function sync() {
  document.body.classList.toggle('sheet-open', panel.classList.contains('open'));
}

export function openDetail(item) {
  $('panel-meta').textContent = [item.tag, item.year].filter(Boolean).join(' · ');
  $('panel-title').textContent = item.title;

  // role and link are optional — a photograph usually has neither
  const role = $('panel-role');
  role.textContent = item.role || '';
  role.hidden = !item.role;

  $('panel-desc').textContent = item.desc || '';

  const hero = $('panel-hero');
  const metaGrid = $('panel-meta-grid');
  const content = $('panel-content');

  // Clear previous content
  hero.innerHTML = '';
  metaGrid.innerHTML = '';
  content.innerHTML = '';

  if (item.detail) {
    // Hero Image
    if (item.detail.hero) {
      // Root-relative paths have to include the site's base (/portfolio/).
      const src = item.detail.hero.startsWith('/') ? import.meta.env.BASE_URL + item.detail.hero.slice(1) : item.detail.hero;
      hero.innerHTML = `<img src="${src}" alt="${item.title}" style="width: 100%; height: auto; border-radius: var(--radius-sm); margin-top: 24px; border: 1px solid var(--ink);" />`;
      hero.hidden = false;
    } else {
      hero.hidden = true;
    }

    // Meta Grid
    if (item.detail.meta) {
      const metaHTML = item.detail.meta.map(m => `
        <div class="meta-item">
          <strong>${m.label}</strong>
          <span>${m.value}</span>
        </div>
      `).join('');
      metaGrid.innerHTML = metaHTML;
      metaGrid.hidden = false;
    } else {
      metaGrid.hidden = true;
    }

    // Sections
    if (item.detail.sections) {
      const sectionsHTML = item.detail.sections.map(sec => {
        if (sec.type === 'text') {
          return `
            <div class="panel-section">
              <h3>${sec.heading}</h3>
              <p>${sec.body}</p>
            </div>
          `;
        }
        if (sec.type === 'stats') {
          const stats = sec.items.map(stat => `
            <div class="stat-item">
              <h4>${stat.value}</h4>
              <span>${stat.label}</span>
            </div>
          `).join('');
          return `<div class="panel-stats">${stats}</div>`;
        }
        if (sec.type === 'image') {
          return `
            <div class="panel-section" style="margin-top: 32px;">
              <img src="${sec.src}" alt="Case study image" style="width: 100%; height: auto; border-radius: var(--radius-sm);" />
            </div>
          `;
        }
        return '';
      }).join('');
      content.innerHTML = sectionsHTML;
      content.hidden = false;
    } else {
      content.hidden = true;
    }
  } else {
    hero.hidden = true;
    metaGrid.hidden = true;
    content.hidden = true;
  }

  const link = $('panel-link');
  if (item.url) {
    link.href = item.url;
    link.textContent = item.linkLabel || 'Visit project';
    link.classList.remove('hidden');
  } else {
    link.classList.add('hidden');
  }

  panel.classList.add('open');
  panel.setAttribute('aria-hidden', 'false');
  sync();
}

export function closeDetail() {
  panel.classList.remove('open');
  panel.setAttribute('aria-hidden', 'true');
  sync();
}

export const detailOpen = () => panel.classList.contains('open');

$('panel-close').addEventListener('click', closeDetail);
scrim.addEventListener('click', closeDetail);
