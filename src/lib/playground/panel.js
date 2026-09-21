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
