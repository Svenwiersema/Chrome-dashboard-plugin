const DEFAULT_TOOLS = [
  {naam:'Tegelcalculator', icoon:'icons/tegelcalculator.svg', darkIcoon:'icons/tegelcalculator-dark.svg', omschrijving:'Bereken tegels en voeg.', url:'tegelcalculator.html'},
  {naam:'Prijscalculator', icoon:'icons/prijscalculator.svg', darkIcoon:'icons/prijscalculator-dark.svg', omschrijving:'Bereken verkoopprijzen.', url:'prijscalculator.html'}
];
const DEFAULT_WEBSITES = [];
const DEFAULT_WEB_GROUPS = [];

const K = {
  tools:'mijnDashboardToolsV4',
  websites:'mijnDashboardWebsitesV4',
  favorites:'mijnDashboardFavorietenV4',
  logo:'mijnDashboardLogoV1',
  webGroups:'mijnDashboardWebsiteGroupsV1'
};

const load = (k,d) => {
  try {
    const x = JSON.parse(localStorage.getItem(k));
    return Array.isArray(x) ? x : d;
  } catch {
    return d;
  }
};

let tools = load(K.tools, DEFAULT_TOOLS);
let websites = load(K.websites, DEFAULT_WEBSITES);
let favorites = load(K.favorites, []);
let webGroups = load(K.webGroups, DEFAULT_WEB_GROUPS);

tools = tools.map(item => {
  const standard = DEFAULT_TOOLS.find(x => x.url === item.url || x.naam === item.naam);
  return standard ? {...standard, ...item, darkIcoon: standard.darkIcoon} : item;
});

webGroups = [...new Set(webGroups.map(x => String(x).trim()).filter(Boolean))];

// "Algemeen" is no longer a submap. Existing websites that used it are treated
// as ungrouped, while user-created submaps remain available.
webGroups = webGroups.filter(x => x.toLowerCase() !== 'algemeen');
websites = websites.map(x => ({
  ...x,
  subkopje: String(x.subkopje || '').trim()
}));
websites.forEach(x => {
  if (x.subkopje && x.subkopje.toLowerCase() !== 'algemeen' && !webGroups.includes(x.subkopje)) {
    webGroups.push(x.subkopje);
  }
});

const $ = id => document.getElementById(id);

function save() {
  localStorage.setItem(K.tools, JSON.stringify(tools));
  localStorage.setItem(K.websites, JSON.stringify(websites));
  localStorage.setItem(K.favorites, JSON.stringify(favorites));
  localStorage.setItem(K.webGroups, JSON.stringify(webGroups));
}

function applyDashboardLogo() {
  const mark = document.querySelector('.brand .brand-mark');
  if (!mark) return;
  let logo = '';
  try { logo = localStorage.getItem(K.logo) || ''; } catch {}
  if (logo) {
    mark.classList.add('custom-brand-logo');
    mark.innerHTML = '';
    const img = document.createElement('img');
    img.src = logo;
    img.alt = 'Dashboard logo';
    mark.appendChild(img);
  } else {
    mark.classList.remove('custom-brand-logo');
    mark.innerHTML = '<span></span><span></span><span></span><span></span>';
  }
}

function favicon(url) {
  try {
    const u = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(u.hostname)}&sz=128`;
  } catch {
    return '';
  }
}

let dragState = null;
let dragged = false;

function enableDrag(cardEl, type, index) {
  cardEl.draggable = true;
  cardEl.classList.add('draggable-card');

  cardEl.addEventListener('dragstart', e => {
    dragState = {type, index};
    dragged = true;
    cardEl.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `${type}:${index}`);
  });

  cardEl.addEventListener('dragend', () => {
    dragState = null;
    cardEl.classList.remove('dragging');
    document.querySelectorAll('.drop-target').forEach(x => x.classList.remove('drop-target'));
    setTimeout(() => { dragged = false; }, 0);
  });

  cardEl.addEventListener('dragover', e => {
    if (!dragState || dragState.type !== type || dragState.index === index) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    cardEl.classList.add('drop-target');
  });

  cardEl.addEventListener('dragleave', e => {
    if (!cardEl.contains(e.relatedTarget)) cardEl.classList.remove('drop-target');
  });

  cardEl.addEventListener('drop', e => {
    e.preventDefault();
    e.stopPropagation();
    cardEl.classList.remove('drop-target');
    if (!dragState || dragState.type !== type || dragState.index === index) return;
    moveItem(type, dragState.index, index);
  });
}

function moveItem(type, from, to) {
  const list = type === 'tools' ? tools : websites;
  if (from < 0 || to < 0 || from >= list.length || to >= list.length) return;
  const [item] = list.splice(from, 1);
  list.splice(to, 0, item);
  save();
  render();
}

function makeIcon(item, type) {
  const icon = document.createElement('img');
  icon.className = 'app-icon';
  const isDark = document.documentElement.dataset.theme === 'dark';
  icon.src = (isDark && item.darkIcoon)
    ? item.darkIcoon
    : (item.icoon || (type === 'websites' ? favicon(item.url) : ''));
  icon.alt = '';
  icon.onerror = () => icon.style.visibility = 'hidden';
  return icon;
}

function card(item, type, index) {
  const a = document.createElement('a');
  a.className = 'app-card';
  a.href = item.url;
  a.target = '_self';
  a.rel = 'noopener';

  a.addEventListener('click', e => {
    if (dragged) e.preventDefault();
  });

  a.appendChild(makeIcon(item, type));

  const info = document.createElement('div');
  const name = document.createElement('div');
  name.className = 'app-name';
  name.textContent = item.naam;

  const desc = document.createElement('div');
  desc.className = 'app-description';
  desc.textContent = item.omschrijving || '';
  info.append(name, desc);
  a.appendChild(info);

  // Top-right actions: favorite + three dots.
  const actions = document.createElement('div');
  actions.className = 'card-actions';

  const fav = document.createElement('button');
  fav.type = 'button';
  fav.className = 'favorite' + (favorites.includes(item.naam) ? ' active' : '');
  fav.textContent = '★';
  fav.title = 'Favoriet';
  fav.setAttribute('aria-label', 'Favoriet');
  fav.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    favorites = favorites.includes(item.naam)
      ? favorites.filter(x => x !== item.naam)
      : [...favorites, item.naam];
    save();
    render();
  });

  const edit = document.createElement('button');
  edit.type = 'button';
  edit.className = 'item-menu';
  edit.textContent = '⋮';
  edit.title = 'Bewerken';
  edit.setAttribute('aria-label', 'Item bewerken');
  edit.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    openEditModal(type, index);
  });

  actions.append(fav, edit);
  a.appendChild(actions);

  enableDrag(a, type, index);
  return a;
}

function plus(type) {
  const a = document.createElement('button');
  a.type = 'button';
  a.className = 'app-card plus-card';
  a.innerHTML = '<span class="plus">+</span><strong>Toevoegen</strong>';
  a.addEventListener('click', () => openModal(type));
  return a;
}

function subheadingButton() {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'tool-back section-add-btn';
  b.textContent = '+ Submap';
  b.title = 'Website-submap toevoegen';
  b.addEventListener('click', openSubmapModal);
  return b;
}

function setupWebsiteSectionHeader() {
  const head = document.querySelector('#websitesSection .section-head');
  if (!head) return;
  let actions = head.querySelector('.section-head-actions');
  if (!actions) {
    actions = document.createElement('div');
    actions.className = 'section-head-actions';
    head.appendChild(actions);
  }
  actions.innerHTML = '';
  actions.appendChild(subheadingButton());
}

function render() {
  const q = ($('search')?.value || '').trim().toLowerCase();
  const filter = x => (x.naam + ' ' + (x.omschrijving || '') + ' ' + (x.subkopje || ''))
    .toLowerCase().includes(q);

  const tg = $('toolsGrid');
  const wg = $('websitesGrid');
  if (!tg || !wg) return;

  tg.innerHTML = '';
  wg.innerHTML = '';

  tools.filter(filter).forEach(x => tg.appendChild(card(x, 'tools', tools.indexOf(x))));
  tg.appendChild(plus('tools'));

  const visibleWebsites = websites.filter(filter);

  // 1. Websites without a submap
  const ungrouped = visibleWebsites.filter(x => !x.subkopje || x.subkopje.toLowerCase() === 'algemeen');
  const ungroupedGrid = document.createElement('div');
  ungroupedGrid.className = 'grid website-group-grid website-ungrouped-grid';
  ungrouped.forEach(x => ungroupedGrid.appendChild(card(x, 'websites', websites.indexOf(x))));
  ungroupedGrid.appendChild(plus('websites'));
  if (ungrouped.length || !q) wg.appendChild(ungroupedGrid);

  // 2. Each user-created submap below the previous row
  webGroups.forEach(group => {
    const items = visibleWebsites.filter(x =>
      (x.subkopje || '').toLowerCase() === group.toLowerCase()
    );
    if (!items.length && q) return;

    const section = document.createElement('div');
    section.className = 'website-group';
    section.dataset.group = group;

    const title = document.createElement('h3');
    title.className = 'website-group-title';
    title.textContent = group;

    const grid = document.createElement('div');
    grid.className = 'grid website-group-grid';

    items.forEach(x => grid.appendChild(card(x, 'websites', websites.indexOf(x))));
    section.append(title, grid);
    wg.appendChild(section);
  });

  $('toolsCount').textContent = `${tools.length}`;
  $('websitesCount').textContent = `${websites.length}`;

  const hasResult = !!(
    tg.querySelector('.app-card:not(.plus-card)') ||
    wg.querySelector('.app-card:not(.plus-card)')
  );
  $('noResults').classList.toggle('hidden', hasResult);
  setupWebsiteSectionHeader();
}

function openModal(type) {
  const isTool = type === 'tools';
  const groupOptions = webGroups.map(g =>
    `<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`
  ).join('');

  const m = document.createElement('div');
  m.className = 'modal';
  m.innerHTML = `
    <div class="modal-card">
      <h3>${isTool ? 'Tool toevoegen' : 'Website toevoegen'}</h3>
      <div class="field">
        <label>Naam</label>
        <input id="mName" autocomplete="off">
      </div>
      <div class="field">
        <label>${isTool ? 'Pagina / pad' : 'URL'}</label>
        <input id="mUrl" placeholder="${isTool ? 'bijv. mijn-tool.html' : 'https://voorbeeld.nl'}" autocomplete="off">
      </div>
      <div class="field">
        <label>Omschrijving</label>
        <textarea id="mDesc"></textarea>
      </div>
      ${isTool ? '<div class="field"><label>Eigen icoon (optioneel)</label><input id="mIcon" type="file" accept="image/*,.svg"></div>' : `
      <div class="field">
        <label>Submap</label>
        <select id="mGroup"><option value="">Geen submap</option>${groupOptions}</select>
      </div>`}
      <div class="modal-actions">
        <button class="secondary-btn" id="mCancel">Annuleren</button>
        <button class="primary-btn" id="mSave">Toevoegen</button>
      </div>
    </div>`;

  document.body.appendChild(m);
  $('mCancel').onclick = () => m.remove();

  $('mSave').onclick = async () => {
    const naam = $('mName').value.trim();
    const url = $('mUrl').value.trim();
    const omschrijving = $('mDesc').value.trim();
    if (!naam || !url) {
      alert('Vul minimaal naam en locatie/URL in.');
      return;
    }

    let icoon = '';
    if (isTool && $('mIcon')?.files[0]) {
      icoon = await readFileAsDataUrl($('mIcon').files[0]);
    }

    const item = {
      naam,
      url,
      omschrijving,
      icoon
    };

    if (!isTool) item.subkopje = $('mGroup').value || '';

    if (isTool) {
      tools.push(item);
    } else {
      websites.push(item);
      if (!webGroups.includes(item.subkopje)) webGroups.push(item.subkopje);
    }

    save();
    m.remove();
    render();
  };
}

function openEditModal(type, index) {
  const list = type === 'tools' ? tools : websites;
  const item = list[index];
  if (!item) return;

  const isTool = type === 'tools';
  const groupOptions = webGroups.map(g =>
    `<option value="${escapeHtml(g)}" ${g === (item.subkopje || 'Algemeen') ? 'selected' : ''}>${escapeHtml(g)}</option>`
  ).join('');

  const m = document.createElement('div');
  m.className = 'modal';
  m.innerHTML = `
    <div class="modal-card">
      <h3>${isTool ? 'Tool bewerken' : 'Website bewerken'}</h3>
      <div class="field">
        <label>Naam</label>
        <input id="eName" value="${escapeHtml(item.naam || '')}" autocomplete="off">
      </div>
      <div class="field">
        <label>${isTool ? 'Pagina / pad' : 'URL'}</label>
        <input id="eUrl" value="${escapeHtml(item.url || '')}" autocomplete="off">
      </div>
      <div class="field">
        <label>Omschrijving</label>
        <textarea id="eDesc">${escapeHtml(item.omschrijving || '')}</textarea>
      </div>
      ${isTool ? '<div class="field"><label>Eigen icoon (optioneel)</label><input id="eIcon" type="file" accept="image/*,.svg"></div>' : `
      <div class="field">
        <label>Submap</label>
        <select id="eGroup"><option value="">Geen submap</option>${groupOptions}</select>
      </div>`}
      <div class="modal-actions modal-actions-between">
        <button class="danger-btn" id="eDelete">Verwijderen</button>
        <div class="modal-actions-right">
          <button class="secondary-btn" id="eCancel">Annuleren</button>
          <button class="primary-btn" id="eSave">Opslaan</button>
        </div>
      </div>
    </div>`;

  document.body.appendChild(m);
  $('eCancel').onclick = () => m.remove();

  $('eDelete').onclick = () => {
    if (!confirm(`Weet je zeker dat je "${item.naam}" wilt verwijderen?`)) return;
    const name = item.naam;
    list.splice(index, 1);
    favorites = favorites.filter(x => x !== name);
    save();
    m.remove();
    render();
  };

  $('eSave').onclick = async () => {
    const naam = $('eName').value.trim();
    const url = $('eUrl').value.trim();
    const omschrijving = $('eDesc').value.trim();

    if (!naam || !url) {
      alert('Vul minimaal naam en locatie/URL in.');
      return;
    }

    const oldName = item.naam;
    item.naam = naam;
    item.url = url;
    item.omschrijving = omschrijving;

    if (isTool) {
      if ($('eIcon')?.files[0]) item.icoon = await readFileAsDataUrl($('eIcon').files[0]);
    } else {
      item.subkopje = $('eGroup').value || '';
      if (item.subkopje && !webGroups.includes(item.subkopje) &&
          item.subkopje.toLowerCase() !== 'algemeen') webGroups.push(item.subkopje);
    }

    // Keep favorites linked to a renamed item.
    if (oldName !== naam && favorites.includes(oldName)) {
      favorites = favorites.filter(x => x !== oldName);
      favorites.push(naam);
    }

    save();
    m.remove();
    render();
  };
}

function openSubmapModal() {
  const m = document.createElement('div');
  m.className = 'modal';
  m.innerHTML = `
    <div class="modal-card">
      <h3>Submap toevoegen</h3>
      <div class="field">
        <label>Naam submap</label>
        <input id="gName" placeholder="bijv. Leveranciers" autocomplete="off">
      </div>
      <div class="modal-actions">
        <button class="secondary-btn" id="gCancel">Annuleren</button>
        <button class="primary-btn" id="gSave">Toevoegen</button>
      </div>
    </div>`;
  document.body.appendChild(m);
  $('gCancel').onclick = () => m.remove();

  $('gSave').onclick = () => {
    const name = $('gName').value.trim();
    if (!name) return;
    if (webGroups.some(x => x.toLowerCase() === name.toLowerCase())) {
      alert('Deze submap bestaat al.');
      return;
    }
    webGroups.push(name);
    save();
    m.remove();
    render();
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function readFileAsDataUrl(file) {
  return new Promise(resolve => {
    const rd = new FileReader();
    rd.onload = () => resolve(rd.result);
    rd.readAsDataURL(file);
  });
}

$('search')?.addEventListener('input', render);
window.addEventListener('dashboard-theme-change', () => {
  applyDashboardLogo();
  render();
});
window.addEventListener('dashboard-logo-change', applyDashboardLogo);

applyDashboardLogo();
render();
