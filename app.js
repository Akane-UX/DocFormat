const DEFAULT_PRESETS = [
  {
    id: 'makalah',
    name: 'Makalah Akademik',
    badge: 'Populer',
    description: 'Standar makalah perkuliahan & seminar: Margin 4-4-3-3, Times New Roman 12pt, spasi 1.5, Heading 1/2/3 resmi.',
    config: {
      paper_size: 'A4',
      margin_top_cm: 4.0,
      margin_left_cm: 4.0,
      margin_bottom_cm: 3.0,
      margin_right_cm: 3.0,
      font_name: 'Times New Roman',
      font_size_body: 12,
      font_size_h1: 14,
      font_size_h2: 12,
      font_size_h3: 12,
      font_size_table: 10,
      alignment_body: 'both',
      alignment_h1: 'center',
      alignment_h2: 'left',
      line_spacing: 1.5,
      space_before_pt: 0,
      space_after_pt: 6,
      first_line_indent_cm: 1.27,
      page_break_bab: true,
      uppercase_bab: true,
      force_black_text: true,
      page_number_position: 'bottom_right',
      bab_layout: 'single_line',
      heading_mode: 'Heading123',
      whitespace_cleanup_mode: 'aggressive'
    }
  },
  {
    id: 'laporan_praktikum',
    name: 'Laporan Praktikum / Resmi',
    badge: 'Standar Lab',
    description: 'Format laporan praktikum & proyek teknis: Margin 4-4-3-3, Times New Roman 12pt, spasi 1.5, tabel rapi.',
    config: {
      paper_size: 'A4',
      margin_top_cm: 4.0,
      margin_left_cm: 4.0,
      margin_bottom_cm: 3.0,
      margin_right_cm: 3.0,
      font_name: 'Times New Roman',
      font_size_body: 12,
      font_size_h1: 14,
      font_size_h2: 12,
      font_size_h3: 12,
      font_size_table: 10,
      alignment_body: 'both',
      alignment_h1: 'center',
      alignment_h2: 'left',
      line_spacing: 1.5,
      space_before_pt: 0,
      space_after_pt: 6,
      first_line_indent_cm: 1.27,
      page_break_bab: true,
      uppercase_bab: true,
      force_black_text: true,
      page_number_position: 'bottom_center',
      bab_layout: 'single_line',
      heading_mode: 'Heading123',
      whitespace_cleanup_mode: 'aggressive'
    }
  },
  {
    id: 'skripsi_tesis',
    name: 'Skripsi / Tugas Akhir / Tesis',
    badge: 'Akademik Ketat',
    description: 'Format tugas akhir perguruan tinggi: Margin 4-4-3-3, TNR 12pt, spasi 2.0, BAB 2 baris (BAB I ↵ PENDAHULUAN).',
    config: {
      paper_size: 'A4',
      margin_top_cm: 4.0,
      margin_left_cm: 4.0,
      margin_bottom_cm: 3.0,
      margin_right_cm: 3.0,
      font_name: 'Times New Roman',
      font_size_body: 12,
      font_size_h1: 14,
      font_size_h2: 12,
      font_size_h3: 12,
      font_size_table: 10,
      alignment_body: 'both',
      alignment_h1: 'center',
      alignment_h2: 'left',
      line_spacing: 2.0,
      space_before_pt: 0,
      space_after_pt: 0,
      first_line_indent_cm: 1.27,
      page_break_bab: true,
      uppercase_bab: true,
      force_black_text: true,
      page_number_position: 'top_right',
      bab_layout: 'split_line',
      heading_mode: 'Heading123',
      whitespace_cleanup_mode: 'aggressive'
    }
  },
  {
    id: 'proposal',
    name: 'Proposal Penelitian / PKM',
    badge: 'Ringkas',
    description: 'Standar proposal kegiatan atau PKM: Margin 3-4-3-3 (Atas 3, Kiri 4, Bawah 3, Kanan 3), spasi 1.15.',
    config: {
      paper_size: 'A4',
      margin_top_cm: 3.0,
      margin_left_cm: 4.0,
      margin_bottom_cm: 3.0,
      margin_right_cm: 3.0,
      font_name: 'Times New Roman',
      font_size_body: 12,
      font_size_h1: 13,
      font_size_h2: 12,
      font_size_h3: 12,
      font_size_table: 10,
      alignment_body: 'both',
      alignment_h1: 'center',
      alignment_h2: 'left',
      line_spacing: 1.15,
      space_before_pt: 0,
      space_after_pt: 6,
      first_line_indent_cm: 1.27,
      page_break_bab: false,
      uppercase_bab: true,
      force_black_text: true,
      page_number_position: 'bottom_right',
      bab_layout: 'single_line',
      heading_mode: 'Heading123',
      whitespace_cleanup_mode: 'aggressive'
    }
  },
  {
    id: 'jurnal_artikel',
    name: 'Artikel Ilmiah / Paper',
    badge: 'Modern',
    description: 'Tata letak paper ilmiah padat: Margin merata 2.54 cm (Normal), spasi 1.15, Times New Roman 11pt.',
    config: {
      paper_size: 'A4',
      margin_top_cm: 2.54,
      margin_left_cm: 2.54,
      margin_bottom_cm: 2.54,
      margin_right_cm: 2.54,
      font_name: 'Times New Roman',
      font_size_body: 11,
      font_size_h1: 12,
      font_size_h2: 11,
      font_size_h3: 11,
      font_size_table: 9,
      alignment_body: 'both',
      alignment_h1: 'left',
      alignment_h2: 'left',
      line_spacing: 1.15,
      space_before_pt: 0,
      space_after_pt: 4,
      first_line_indent_cm: 1.0,
      page_break_bab: false,
      uppercase_bab: true,
      force_black_text: true,
      page_number_position: 'bottom_center',
      bab_layout: 'single_line',
      heading_mode: 'Heading123',
      whitespace_cleanup_mode: 'aggressive'
    }
  },
  {
    id: 'laporan_kantor',
    name: 'Laporan Korporat / Dinas',
    badge: 'Bisnis',
    description: 'Format dokumen bisnis & instansi modern: Font Arial 11pt, margin 3-3-3-3 cm, spasi 1.15.',
    config: {
      paper_size: 'A4',
      margin_top_cm: 3.0,
      margin_left_cm: 3.0,
      margin_bottom_cm: 3.0,
      margin_right_cm: 3.0,
      font_name: 'Arial',
      font_size_body: 11,
      font_size_h1: 13,
      font_size_h2: 12,
      font_size_h3: 11,
      font_size_table: 10,
      alignment_body: 'both',
      alignment_h1: 'left',
      alignment_h2: 'left',
      line_spacing: 1.15,
      space_before_pt: 0,
      space_after_pt: 6,
      first_line_indent_cm: 0.0,
      page_break_bab: true,
      uppercase_bab: true,
      force_black_text: true,
      page_number_position: 'bottom_right',
      bab_layout: 'single_line',
      heading_mode: 'Heading123',
      whitespace_cleanup_mode: 'aggressive'
    }
  }
];

const state = {
  currentFile: null,
  inspectedInfo: null,
  activePresetId: 'makalah',
  previewTab: 'body',
  scopeMode: 'all',
  authorMode: 'single',
  groupMembers: [
    { name: '', nim: '' },
    { name: '', nim: '' }
  ],
  presets: [...DEFAULT_PRESETS],
  enabledModules: {
    margin: true,
    font: true,
    font_size: true,
    alignment: true,
    line_spacing: true,
    paragraph_spacing: true,
    indentation: true,
    headings: true,
    page_numbers: true,
    tables: true
  },
  config: {
    ...DEFAULT_PRESETS[0].config,
    cover_mode: 'auto_if_missing',
    toc_mode: 'auto_if_missing'
  }
};

const PAPER_DIMS_CM = {
  A4: { w: 21.0, h: 29.7 },
  F4: { w: 21.5, h: 33.0 },
  Letter: { w: 21.59, h: 27.94 },
  Legal: { w: 21.59, h: 35.56 }
};

function showToast(msg) {
  const banner = document.getElementById('toastBanner');
  const txt = document.getElementById('toastText');
  txt.textContent = msg;
  banner.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => {
    banner.classList.remove('show');
  }, 3800);
}

async function initApp() {
  renderPresetButtons();
  renderGroupMembersList();
  bindUIEvents();
  syncControlsFromState();
  renderLivePaper();
  fetchPresetsIfBackendUp();
}

function renderGroupMembersList() {
  const container = document.getElementById('groupMembersList');
  if (!container) return;
  container.innerHTML = '';

  const sampleNamePlaceholders = ['Ahmad Fauzan', 'Budi Santoso', 'Citra Lestari', 'Dian Pratama', 'Eka Putri'];
  const sampleNimPlaceholders = ['2201040089', '2201040092', '2201040105', '2201040118', '2201040124'];

  state.groupMembers.forEach((m, idx) => {
    const row = document.createElement('div');
    row.className = 'member-row';
    const phName = sampleNamePlaceholders[idx % sampleNamePlaceholders.length];
    const phNim = sampleNimPlaceholders[idx % sampleNimPlaceholders.length];
    row.innerHTML = `
      <span class="member-idx tnum">${idx + 1}.</span>
      <input type="text" class="input-control member-name-input" placeholder="Contoh: ${phName}" value="${escapeHtml(m.name)}" />
      <input type="text" class="input-control tnum member-nim-input" placeholder="Contoh: ${phNim}" value="${escapeHtml(m.nim)}" />
      <button type="button" class="btn-icon-remove" title="Hapus anggota" ${state.groupMembers.length <= 1 ? 'disabled style="opacity:0.35;pointer-events:none;"' : ''}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;

    const nameInp = row.querySelector('.member-name-input');
    const nimInp = row.querySelector('.member-nim-input');
    const delBtn = row.querySelector('.btn-icon-remove');

    nameInp.addEventListener('input', (e) => {
      state.groupMembers[idx].name = e.target.value;
      if (state.previewTab === 'cover') renderLivePaper();
    });

    nimInp.addEventListener('input', (e) => {
      state.groupMembers[idx].nim = e.target.value;
      if (state.previewTab === 'cover') renderLivePaper();
    });

    delBtn.addEventListener('click', () => {
      if (state.groupMembers.length > 1) {
        state.groupMembers.splice(idx, 1);
        renderGroupMembersList();
        if (state.previewTab === 'cover') renderLivePaper();
      }
    });

    container.appendChild(row);
  });
}

async function fetchPresetsIfBackendUp() {
  try {
    const res = await fetch('/api/presets');
    if (res.ok) {
      const data = await res.json();
      if (data.presets && data.presets.length) {
        state.presets = data.presets.map((p, idx) => ({
          ...DEFAULT_PRESETS[idx],
          ...p,
          config: { ...(DEFAULT_PRESETS[idx] ? DEFAULT_PRESETS[idx].config : {}), ...p.config }
        }));
        renderPresetButtons();
      }
    }
  } catch (_) {}
}

function renderPresetButtons() {
  const container = document.getElementById('presetList');
  if (!container) return;
  container.innerHTML = '';
  state.presets.forEach((p) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `preset-btn ${p.id === state.activePresetId ? 'active' : ''}`;
    btn.innerHTML = `
      <div class="preset-top">
        <span class="preset-name">${p.name}</span>
        <span class="preset-badge">${p.badge}</span>
      </div>
      <div class="preset-desc">${p.description}</div>
    `;
    btn.addEventListener('click', () => {
      state.activePresetId = p.id;
      Object.assign(state.config, p.config);
      const labelMap = {
        makalah: 'MAKALAH',
        laporan_praktikum: 'LAPORAN PRAKTIKUM',
        skripsi_tesis: 'SKRIPSI / TUGAS AKHIR',
        proposal: 'PROPOSAL PENELITIAN',
        jurnal_artikel: 'ARTIKEL ILMIAH',
        laporan_kantor: 'LAPORAN KINERJA & DINAS'
      };
      document.getElementById('covDocLabel').placeholder = `Contoh: ${labelMap[p.id] || 'LAPORAN'}`;
      renderPresetButtons();
      syncControlsFromState();
      renderLivePaper();
      showToast(`Preset "${p.name}" diterapkan`);
    });
    container.appendChild(btn);
  });
}

function applyScopePreset(mode) {
  state.scopeMode = mode;
  if (mode === 'all') {
    Object.keys(state.enabledModules).forEach((k) => { state.enabledModules[k] = true; });
    state.config.heading_mode = 'Heading123';
    state.config.whitespace_cleanup_mode = 'aggressive';
  } else if (mode === 'text_and_headings') {
    state.enabledModules = {
      margin: false,
      font: true,
      font_size: true,
      alignment: true,
      line_spacing: true,
      paragraph_spacing: true,
      indentation: true,
      headings: true,
      page_numbers: false,
      tables: true
    };
    state.config.heading_mode = 'Heading123';
    state.config.whitespace_cleanup_mode = 'aggressive';
  } else if (mode === 'layout_only') {
    state.enabledModules = {
      margin: true,
      font: false,
      font_size: false,
      alignment: false,
      line_spacing: false,
      paragraph_spacing: false,
      indentation: false,
      headings: false,
      page_numbers: true,
      tables: false
    };
    state.config.heading_mode = 'skip';
  }
  syncControlsFromState();
  renderLivePaper();
}

function syncControlsFromState() {
  const c = state.config;
  document.getElementById('selScopeMode').value = state.scopeMode;
  document.getElementById('selWhitespaceMode').value = c.whitespace_cleanup_mode || 'aggressive';
  document.getElementById('selHeadingMode').value = c.heading_mode || 'Heading123';
  document.getElementById('selCoverMode').value = c.cover_mode || 'auto_if_missing';
  document.getElementById('selTocMode').value = c.toc_mode || 'auto_if_missing';

  document.getElementById('paperSize').value = c.paper_size;
  document.getElementById('marginTop').value = c.margin_top_cm;
  document.getElementById('marginLeft').value = c.margin_left_cm;
  document.getElementById('marginBottom').value = c.margin_bottom_cm;
  document.getElementById('marginRight').value = c.margin_right_cm;

  const marginKey = `${c.margin_top_cm},${c.margin_left_cm},${c.margin_bottom_cm},${c.margin_right_cm}`;
  document.querySelectorAll('#marginPresetGroup .seg-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.margin === marginKey);
  });

  document.getElementById('fontName').value = c.font_name;
  document.getElementById('fontSizeBody').value = String(c.font_size_body);
  document.getElementById('fontSizeH1').value = String(c.font_size_h1);
  document.getElementById('fontSizeH2').value = String(c.font_size_h2);
  document.getElementById('fontSizeH3').value = String(c.font_size_h3 || 12);
  document.getElementById('fontSizeTable').value = String(c.font_size_table);

  document.querySelectorAll('#alignBodyGroup .seg-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.align === c.alignment_body);
  });

  document.querySelectorAll('#lineSpacingGroup .seg-btn').forEach((b) => {
    b.classList.toggle('active', parseFloat(b.dataset.spacing) === parseFloat(c.line_spacing));
  });

  document.getElementById('firstLineIndent').value = String(c.first_line_indent_cm);
  document.getElementById('spaceBefore').value = String(c.space_before_pt);
  document.getElementById('spaceAfter').value = String(c.space_after_pt);

  document.getElementById('babLayout').value = c.bab_layout || 'single_line';
  document.getElementById('alignH1').value = c.alignment_h1;
  document.getElementById('pageNumPos').value = c.page_number_position;

  setSwitchVisual('swPageBreakBab', c.page_break_bab);
  setSwitchVisual('swUppercaseBab', c.uppercase_bab);
  setSwitchVisual('swForceBlack', c.force_black_text);

  document.querySelectorAll('#targetPillGroup .target-pill').forEach((pill) => {
    const mod = pill.dataset.mod;
    pill.classList.toggle('active', !!state.enabledModules[mod]);
  });

  document.getElementById('groupMargin').classList.toggle('disabled-module', !state.enabledModules.margin);
  document.getElementById('groupCover').classList.toggle('disabled-module', c.cover_mode === 'skip');

  document.querySelectorAll('#authorModeGroup .seg-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.mode === state.authorMode);
  });
  document.getElementById('singleAuthorSection').style.display = state.authorMode === 'single' ? 'grid' : 'none';
  document.getElementById('groupAuthorSection').style.display = state.authorMode === 'group' ? 'block' : 'none';
}

function setSwitchVisual(id, isOn) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle('on', !!isOn);
  el.setAttribute('aria-checked', isOn ? 'true' : 'false');
}

function bindUIEvents() {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');

  dropzone.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  });
  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  });

  document.getElementById('btnLoadSample').addEventListener('click', loadSampleMessyDocx);
  document.getElementById('btnProcessDoc').addEventListener('click', processAndDownloadDocx);

  document.getElementById('selScopeMode').addEventListener('change', (e) => {
    applyScopePreset(e.target.value);
  });

  document.getElementById('selWhitespaceMode').addEventListener('change', (e) => {
    state.config.whitespace_cleanup_mode = e.target.value;
    renderLivePaper();
  });

  document.getElementById('selHeadingMode').addEventListener('change', (e) => {
    state.config.heading_mode = e.target.value;
    state.enabledModules.headings = e.target.value !== 'skip';
    renderLivePaper();
  });

  document.getElementById('selCoverMode').addEventListener('change', (e) => {
    state.config.cover_mode = e.target.value;
    if (e.target.value !== 'skip') setPreviewTab('cover');
    syncControlsFromState();
    renderLivePaper();
  });

  document.getElementById('selTocMode').addEventListener('change', (e) => {
    state.config.toc_mode = e.target.value;
    if (e.target.value !== 'skip') setPreviewTab('toc');
    syncControlsFromState();
    renderLivePaper();
  });

  document.querySelectorAll('#targetPillGroup .target-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      const mod = pill.dataset.mod;
      state.enabledModules[mod] = !state.enabledModules[mod];
      state.scopeMode = 'custom';
      syncControlsFromState();
      renderLivePaper();
    });
  });

  document.getElementById('paperSize').addEventListener('change', (e) => {
    state.config.paper_size = e.target.value;
    renderLivePaper();
  });

  document.querySelectorAll('#marginPresetGroup .seg-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const [t, l, b, r] = btn.dataset.margin.split(',').map(Number);
      state.config.margin_top_cm = t;
      state.config.margin_left_cm = l;
      state.config.margin_bottom_cm = b;
      state.config.margin_right_cm = r;
      syncControlsFromState();
      renderLivePaper();
    });
  });

  ['marginTop', 'marginLeft', 'marginBottom', 'marginRight'].forEach((id) => {
    document.getElementById(id).addEventListener('input', () => {
      state.config.margin_top_cm = parseFloat(document.getElementById('marginTop').value) || 3;
      state.config.margin_left_cm = parseFloat(document.getElementById('marginLeft').value) || 3;
      state.config.margin_bottom_cm = parseFloat(document.getElementById('marginBottom').value) || 3;
      state.config.margin_right_cm = parseFloat(document.getElementById('marginRight').value) || 3;
      syncControlsFromState();
      renderLivePaper();
    });
  });

  document.getElementById('fontName').addEventListener('change', (e) => {
    state.config.font_name = e.target.value;
    renderLivePaper();
  });

  ['fontSizeBody', 'fontSizeH1', 'fontSizeH2', 'fontSizeH3', 'fontSizeTable'].forEach((id) => {
    document.getElementById(id).addEventListener('change', () => {
      state.config.font_size_body = parseFloat(document.getElementById('fontSizeBody').value);
      state.config.font_size_h1 = parseFloat(document.getElementById('fontSizeH1').value);
      state.config.font_size_h2 = parseFloat(document.getElementById('fontSizeH2').value);
      state.config.font_size_h3 = parseFloat(document.getElementById('fontSizeH3').value);
      state.config.font_size_table = parseFloat(document.getElementById('fontSizeTable').value);
      renderLivePaper();
    });
  });

  document.querySelectorAll('#alignBodyGroup .seg-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.config.alignment_body = btn.dataset.align;
      syncControlsFromState();
      renderLivePaper();
    });
  });

  document.querySelectorAll('#lineSpacingGroup .seg-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.config.line_spacing = parseFloat(btn.dataset.spacing);
      syncControlsFromState();
      renderLivePaper();
    });
  });

  document.getElementById('firstLineIndent').addEventListener('change', (e) => {
    state.config.first_line_indent_cm = parseFloat(e.target.value);
    renderLivePaper();
  });

  document.getElementById('spaceBefore').addEventListener('change', (e) => {
    state.config.space_before_pt = parseFloat(e.target.value);
    renderLivePaper();
  });

  document.getElementById('spaceAfter').addEventListener('change', (e) => {
    state.config.space_after_pt = parseFloat(e.target.value);
    renderLivePaper();
  });

  document.getElementById('babLayout').addEventListener('change', (e) => {
    state.config.bab_layout = e.target.value;
    renderLivePaper();
  });

  document.getElementById('alignH1').addEventListener('change', (e) => {
    state.config.alignment_h1 = e.target.value;
    renderLivePaper();
  });

  document.getElementById('pageNumPos').addEventListener('change', (e) => {
    state.config.page_number_position = e.target.value;
    renderLivePaper();
  });

  document.getElementById('swPageBreakBab').addEventListener('click', () => {
    state.config.page_break_bab = !state.config.page_break_bab;
    syncControlsFromState();
    renderLivePaper();
  });

  document.getElementById('swUppercaseBab').addEventListener('click', () => {
    state.config.uppercase_bab = !state.config.uppercase_bab;
    syncControlsFromState();
    renderLivePaper();
  });

  document.getElementById('swForceBlack').addEventListener('click', () => {
    state.config.force_black_text = !state.config.force_black_text;
    syncControlsFromState();
    renderLivePaper();
  });

  ['covDocLabel', 'covCourse', 'covTitle', 'covAuthor', 'covNim', 'covGroupName', 'covLecturer', 'covFaculty', 'covInstitution', 'covYear'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => {
        if (state.previewTab === 'cover') {
          renderLivePaper();
        }
      });
    }
  });

  document.querySelectorAll('#authorModeGroup .seg-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.authorMode = btn.dataset.mode;
      syncControlsFromState();
      setPreviewTab('cover');
    });
  });

  const btnAddMember = document.getElementById('btnAddMember');
  if (btnAddMember) {
    btnAddMember.addEventListener('click', () => {
      state.groupMembers.push({ name: '', nim: '' });
      renderGroupMembersList();
      if (state.previewTab === 'cover') renderLivePaper();
    });
  }

  document.querySelectorAll('#previewTabs .preview-tab').forEach((tabBtn) => {
    tabBtn.addEventListener('click', () => {
      setPreviewTab(tabBtn.dataset.tab);
    });
  });
}

function setPreviewTab(tabName) {
  state.previewTab = tabName;
  document.querySelectorAll('#previewTabs .preview-tab').forEach((b) => {
    b.classList.toggle('active', b.dataset.tab === tabName);
  });
  renderLivePaper();
}

async function loadSampleMessyDocx() {
  try {
    let blob = null;
    try {
      const res = await fetch('/api/sample');
      if (res.ok) blob = await res.blob();
    } catch (_) {}

    if (!blob && window.ClientDocxEngine) {
      blob = await window.ClientDocxEngine.generateSampleMessyDocxBlob();
    }

    const sampleFile = new File([blob], 'Contoh_Draft_Laporan_Berantakan.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });
    await handleFileSelected(sampleFile);
    showToast('Contoh draf dokumen berantakan berhasil dimuat!');
  } catch (err) {
    showToast('Gagal memuat contoh dokumen: ' + err.message);
  }
}

async function handleFileSelected(file) {
  if (!file.name.toLowerCase().endsWith('.docx')) {
    showToast('Harap pilih file berformat .DOCX');
    return;
  }
  state.currentFile = file;
  document.getElementById('dropzoneTitle').textContent = file.name;
  const sizeBadge = document.getElementById('fileSizeBadge');
  sizeBadge.style.display = 'inline-block';
  sizeBadge.textContent = `${(file.size / 1024).toFixed(1)} KB`;

  let info = null;
  try {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/inspect', { method: 'POST', body: formData });
    if (res.ok) {
      info = await res.json();
    }
  } catch (_) {}

  if (!info && window.ClientDocxEngine) {
    try {
      const ab = await file.arrayBuffer();
      info = await window.ClientDocxEngine.inspectDocxArrayBuffer(ab, file.name, file.size);
    } catch (clientErr) {
      showToast('File DOCX tidak valid: ' + clientErr.message);
      return;
    }
  }

  if (info) {
    state.inspectedInfo = info;
    if (info.has_cover) {
      state.config.cover_mode = 'skip';
    } else {
      state.config.cover_mode = 'auto_if_missing';
    }
    if (info.has_toc) {
      state.config.toc_mode = 'skip';
    } else {
      state.config.toc_mode = 'auto_if_missing';
    }
    renderInspectionSummary(info);
    syncControlsFromState();
    renderLivePaper();
    showToast(`Dokumen "${file.name}" siap dirapikan (${info.paragraph_count} paragraf, ${info.heading_count} heading)`);
  }
}

function renderInspectionSummary(info) {
  const box = document.getElementById('fileStatusBox');
  box.classList.add('visible');
  document.getElementById('inspectedFilename').textContent = info.filename;

  const badges = document.getElementById('inspectedBadges');
  const m = info.current_margins_cm || { top: 2.54, left: 2.54, bottom: 2.54, right: 2.54 };
  badges.innerHTML = `
    <span class="meta-tag tnum">${info.paragraph_count} Paragraf</span>
    <span class="meta-tag tnum">${info.word_count} Kata</span>
    <span class="meta-tag tnum">${info.heading_count} Heading Bab/Sub</span>
    <span class="meta-tag tnum">${info.table_count} Tabel</span>
    <span class="meta-tag tnum">Margin Asal: ${m.top}-${m.left}-${m.bottom}-${m.right}cm</span>
    <span class="meta-tag ${info.has_cover ? 'ok' : 'warn'}">${info.has_cover ? `Cover Asli Terdeteksi (${info.cover_paragraphs || ''} Baris Dilindungi)` : 'Belum Ada Cover'}</span>
    <span class="meta-tag ${info.has_toc ? 'ok' : 'warn'}">${info.has_toc ? 'Sudah Ada Daftar Isi' : 'Belum Ada Daftar Isi'}</span>
  `;

  document.getElementById('stParaCount').textContent = `${info.paragraph_count} Paragraf • ${info.heading_count} Bab`;
}

function renderLivePaper() {
  const c = state.config;
  const dims = PAPER_DIMS_CM[c.paper_size] || PAPER_DIMS_CM.A4;
  const stage = document.getElementById('paperStage');
  stage.style.aspectRatio = `${dims.w} / ${dims.h}`;

  const topPct = ((c.margin_top_cm / dims.h) * 100).toFixed(2);
  const bottomPct = ((c.margin_bottom_cm / dims.h) * 100).toFixed(2);
  const leftPct = ((c.margin_left_cm / dims.w) * 100).toFixed(2);
  const rightPct = ((c.margin_right_cm / dims.w) * 100).toFixed(2);

  document.getElementById('mbTop').textContent = `${c.margin_top_cm} cm`;
  document.getElementById('mbLeft').textContent = `${c.margin_left_cm} cm`;
  document.getElementById('mbBottom').textContent = `${c.margin_bottom_cm} cm`;
  document.getElementById('mbRight').textContent = `${c.margin_right_cm} cm`;

  const guide = document.getElementById('paperMarginBox');
  const content = document.getElementById('paperContent');

  guide.style.top = `${topPct}%`;
  guide.style.bottom = `${bottomPct}%`;
  guide.style.left = `${leftPct}%`;
  guide.style.right = `${rightPct}%`;

  content.style.top = `${topPct}%`;
  content.style.bottom = `${bottomPct}%`;
  content.style.left = `${leftPct}%`;
  content.style.right = `${rightPct}%`;

  const fontStackMap = {
    'Times New Roman': '"Times New Roman", Times, serif',
    'Arial': 'Arial, Helvetica, sans-serif',
    'Calibri': 'Calibri, "Segoe UI", sans-serif',
    'Georgia': 'Georgia, serif',
    'Garamond': 'Garamond, serif',
    'Bookman Old Style': '"Bookman Old Style", serif',
    'Tahoma': 'Tahoma, sans-serif'
  };
  content.style.fontFamily = fontStackMap[c.font_name] || 'serif';

  const pgNum = document.getElementById('pvPageNum');
  if (!state.enabledModules.page_numbers || c.page_number_position === 'none' || state.previewTab === 'cover') {
    pgNum.style.display = 'none';
  } else {
    pgNum.style.display = 'block';
    pgNum.style.fontFamily = content.style.fontFamily;
    pgNum.style.top = '';
    pgNum.style.bottom = '';
    pgNum.style.left = '';
    pgNum.style.right = '';
    pgNum.style.transform = '';

    if (c.page_number_position === 'bottom_right') {
      pgNum.style.bottom = '3.5%';
      pgNum.style.right = `${rightPct}%`;
    } else if (c.page_number_position === 'bottom_center') {
      pgNum.style.bottom = '3.5%';
      pgNum.style.left = '50%';
      pgNum.style.transform = 'translateX(-50%)';
    } else if (c.page_number_position === 'top_right') {
      pgNum.style.top = '3.5%';
      pgNum.style.right = `${rightPct}%`;
    }
  }

  const scalePt = 0.68;
  const bodyPx = (c.font_size_body * scalePt).toFixed(1);
  const h1Px = (c.font_size_h1 * scalePt).toFixed(1);
  const h2Px = (c.font_size_h2 * scalePt).toFixed(1);
  const h3Px = ((c.font_size_h3 || 12) * scalePt).toFixed(1);
  const indentPct = ((c.first_line_indent_cm / (dims.w - c.margin_left_cm - c.margin_right_cm)) * 100).toFixed(1);
  const cssAlign = c.alignment_body === 'both' ? 'justify' : c.alignment_body;
  const lineH = (c.line_spacing * 1.15).toFixed(2);
  const paraGapPx = Math.max(2, Math.round(c.space_after_pt * 0.7));

  if (state.previewTab === 'cover') {
    const lbl = document.getElementById('covDocLabel').value || 'MAKALAH';
    const title = document.getElementById('covTitle').value || 'JUDUL DOKUMEN';
    const course = document.getElementById('covCourse').value || '';
    const author = document.getElementById('covAuthor').value || 'Nama Penyusun';
    const nim = document.getElementById('covNim').value || '';
    const groupName = (document.getElementById('covGroupName') ? document.getElementById('covGroupName').value : '') || '';
    const lecturer = document.getElementById('covLecturer').value || '';
    const fac = document.getElementById('covFaculty').value || '';
    const inst = document.getElementById('covInstitution').value || '';
    const yr = document.getElementById('covYear').value || '2026';

    let authorBlockHtml = '';
    if (state.authorMode === 'group') {
      const membersHtml = state.groupMembers
        .filter((m) => (m.name && m.name.trim()) || (m.nim && m.nim.trim()))
        .slice(0, 6)
        .map((m) => {
          const n = (m.name || '').trim();
          const idNum = (m.nim || '').trim();
          const line = (n && idNum) ? `${escapeHtml(n)} (${escapeHtml(idNum)})` : escapeHtml(n || idNum);
          return `<div style="font-weight:700;font-size:${(bodyPx * 0.94).toFixed(1)}px;">${line}</div>`;
        })
        .join('');
      authorBlockHtml = `
        <div>Disusun Oleh:</div>
        ${groupName ? `<div style="font-weight:700;margin-bottom:2px;">${escapeHtml(groupName.toUpperCase())}</div>` : ''}
        ${membersHtml || '<div style="font-weight:700;">Nama Anggota (NIM)</div>'}
      `;
    } else {
      authorBlockHtml = `
        <div>Disusun Oleh:</div>
        <div style="font-weight:700;">${escapeHtml(author)}</div>
        ${nim ? `<div style="font-size:${(bodyPx * 0.92).toFixed(1)}px;">NIM/NPM: ${escapeHtml(nim)}</div>` : ''}
      `;
    }

    content.innerHTML = `
      <div class="pv-cover-box">
        <div>
          <div style="font-weight:700;font-size:${h1Px}px;margin-bottom:6px;letter-spacing:0.04em;">${escapeHtml(lbl.toUpperCase())}</div>
          <div style="font-weight:700;font-size:${(c.font_size_h1 * 0.74).toFixed(1)}px;line-height:1.35;margin-bottom:8px;">${escapeHtml(title.toUpperCase())}</div>
          ${course ? `<div style="font-size:${(bodyPx * 0.9).toFixed(1)}px;color:#333;">Diajukan untuk Memenuhi Tugas Mata Kuliah<br/><b>${escapeHtml(course)}</b></div>` : ''}
        </div>

        <div style="width:38px;height:38px;border-radius:50%;border:1.5px solid #222;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:700;letter-spacing:0.05em;">
          LOGO
        </div>

        <div style="font-size:${bodyPx}px;line-height:1.45;">
          ${lecturer ? `<div style="margin-bottom:6px;">Dosen Pengampu:<br/><b>${escapeHtml(lecturer)}</b></div>` : ''}
          ${authorBlockHtml}
        </div>

        <div style="font-weight:700;font-size:${(h2Px * 0.96).toFixed(1)}px;line-height:1.35;">
          <div>${escapeHtml(fac.toUpperCase())}</div>
          <div>${escapeHtml(inst.toUpperCase())}</div>
          <div>${escapeHtml(yr.toUpperCase())}</div>
        </div>
      </div>
    `;
  } else if (state.previewTab === 'toc') {
    const headings = (state.inspectedInfo && state.inspectedInfo.headings && state.inspectedInfo.headings.length)
      ? state.inspectedInfo.headings.slice(0, 10)
      : [
          { level: 'heading1', text: 'KATA PENGANTAR' },
          { level: 'heading1', text: 'DAFTAR ISI' },
          { level: 'heading1', text: 'BAB I PENDAHULUAN' },
          { level: 'heading2', text: '1.1 Latar Belakang' },
          { level: 'heading2', text: '1.2 Rumusan Masalah' },
          { level: 'heading3', text: '1.2.1 Batasan Teknis' },
          { level: 'heading1', text: 'BAB II TINJAUAN PUSTAKA' },
          { level: 'heading2', text: '2.1 Landasan Teori' },
          { level: 'heading1', text: 'BAB III PENUTUP' },
          { level: 'heading1', text: 'DAFTAR PUSTAKA' }
        ];

    const rowsHtml = headings.map((h, i) => {
      const isH1 = h.level === 'heading1';
      const label = (isH1 && c.uppercase_bab) ? h.text.toUpperCase() : h.text;
      const padLeft = isH1 ? '0px' : (h.level === 'heading2' ? '10px' : '18px');
      const weight = isH1 ? '700' : '400';
      return `
        <div class="pv-toc-row" style="padding-left:${padLeft};font-weight:${weight};line-height:${lineH};">
          <span>${escapeHtml(label)}</span>
          <span class="pv-toc-dots"></span>
          <span class="tnum">${i + 1}</span>
        </div>
      `;
    }).join('');

    content.innerHTML = `
      <div class="pv-h1" style="font-size:${h1Px}px;text-align:${c.alignment_h1};margin-bottom:10px;">DAFTAR ISI</div>
      ${rowsHtml}
    `;
  } else {
    const isSplit = c.bab_layout === 'split_line';
    const babTitleHtml = isSplit
      ? (c.uppercase_bab ? 'BAB I<br/>PENDAHULUAN' : 'Bab I<br/>Pendahuluan')
      : (c.uppercase_bab ? 'BAB I PENDAHULUAN' : 'Bab I Pendahuluan');

    content.innerHTML = `
      <div class="pv-h1" style="font-size:${h1Px}px;text-align:${c.alignment_h1};line-height:${lineH};">${babTitleHtml}</div>
      <div class="pv-h2" style="font-size:${h2Px}px;text-align:left;line-height:${lineH};">1.1 Latar Belakang Masalah</div>
      <p class="pv-p" style="font-size:${bodyPx}px;text-align:${cssAlign};line-height:${lineH};text-indent:${state.enabledModules.indentation ? indentPct : 0}%;margin-bottom:${paraGapPx}px;">
        Dalam penyusunan karya tulis ilmiah seperti laporan praktikum, makalah perkuliahan, proposal penelitian, hingga skripsi, konsistensi tata letak dan tipografi merupakan indikator penilaian akademik yang sangat krusial.
      </p>
      <div class="pv-h2" style="font-size:${h3Px}px;text-align:left;line-height:${lineH};">1.1.1 Pembersihan Spasi &amp; Heading 1/2/3</div>
      <p class="pv-p" style="font-size:${bodyPx}px;text-align:${cssAlign};line-height:${lineH};text-indent:${state.enabledModules.indentation ? indentPct : 0}%;margin-bottom:${paraGapPx}px;">
        Seluruh spasi ganda, jarak paragraf liar bawaan dokumen lama, serta tabulasi tidak beraturan dihapus dan distandardisasi ke style Heading 1, Heading 2, dan Heading 3 resmi.
      </p>
      <div style="margin-top:4px;border:1px solid #444;font-size:${(c.font_size_table * scalePt).toFixed(1)}px;">
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;background:#f0f0f0;font-weight:700;text-align:center;border-bottom:1px solid #444;padding:2px;">
          <span>Style Word</span><span>Ukuran</span><span>Status</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;padding:2px 4px;">
          <span>Heading 1/2/3</span><span>${c.font_size_h1}/${c.font_size_h2}/${c.font_size_h3 || 12} pt</span><span>Aktif</span>
        </div>
      </div>
    `;
  }

  const alignLabels = { both: 'Rata Kiri-Kanan', left: 'Rata Kiri', center: 'Rata Tengah', right: 'Rata Kanan' };
  const paperEl = document.getElementById('specPaperText');
  const marginEl = document.getElementById('specMarginText');
  if (paperEl) paperEl.textContent = `Kertas ${c.paper_size}`;
  if (marginEl) marginEl.textContent = `${c.margin_top_cm} / ${c.margin_left_cm} / ${c.margin_bottom_cm} / ${c.margin_right_cm} cm`;

  document.getElementById('stFont').textContent = `${c.font_name}, ${c.font_size_body} pt`;
  document.getElementById('stSpacing').textContent = `Spasi ${c.line_spacing} • ${alignLabels[c.alignment_body]}`;

  const extras = [];
  if (c.heading_mode === 'Heading123') extras.push('Heading 1/2/3');
  if (c.cover_mode !== 'skip') extras.push(state.authorMode === 'group' ? `Cover (${state.groupMembers.length} Anggota)` : 'Cover');
  if (c.toc_mode !== 'skip') extras.push('Daftar Isi');
  document.getElementById('stExtras').textContent = extras.length ? extras.join(' • ') : 'Standar Isi';
}

async function processAndDownloadDocx() {
  if (!state.currentFile) {
    await loadSampleMessyDocx();
  }
  if (!state.currentFile) return;

  const btn = document.getElementById('btnProcessDoc');
  const lbl = document.getElementById('btnProcessLabel');
  const origText = lbl.textContent;
  lbl.textContent = 'Memproses Dokumen...';
  btn.disabled = true;

  const authorsPayload = state.authorMode === 'group'
    ? state.groupMembers.map((m) => ({ name: (m.name || '').trim(), nim: (m.nim || '').trim() })).filter((m) => m.name || m.nim)
    : [{ name: document.getElementById('covAuthor').value.trim(), nim: document.getElementById('covNim').value.trim() }];

  const payloadConfig = {
    ...state.config,
    enabled_modules: {
      ...state.enabledModules,
      headings: state.config.heading_mode !== 'skip'
    },
    cover_data: {
      author_mode: state.authorMode,
      group_name: document.getElementById('covGroupName') ? document.getElementById('covGroupName').value : '',
      authors: authorsPayload,
      doc_label: document.getElementById('covDocLabel').value,
      course: document.getElementById('covCourse').value,
      title: document.getElementById('covTitle').value,
      author: document.getElementById('covAuthor').value,
      nim: document.getElementById('covNim').value,
      lecturer: document.getElementById('covLecturer').value,
      faculty: document.getElementById('covFaculty').value,
      institution: document.getElementById('covInstitution').value,
      year: document.getElementById('covYear').value
    }
  };

  try {
    let outBlob = null;
    let stats = null;

    try {
      const formData = new FormData();
      formData.append('file', state.currentFile);
      formData.append('config', JSON.stringify(payloadConfig));
      const res = await fetch('/api/format', { method: 'POST', body: formData });
      if (res.ok) {
        const statsHeader = res.headers.get('X-Format-Stats');
        if (statsHeader) {
          try { stats = JSON.parse(statsHeader); } catch (_) {}
        }
        outBlob = await res.blob();
      }
    } catch (_) {}

    if (!outBlob && window.ClientDocxEngine) {
      const ab = await state.currentFile.arrayBuffer();
      const resClient = await window.ClientDocxEngine.formatDocxArrayBuffer(ab, payloadConfig);
      outBlob = resClient.blob;
      stats = resClient.stats;
    }

    if (!outBlob) {
      showToast('Gagal memformat dokumen DOCX');
      return;
    }

    const url = URL.createObjectURL(outBlob);
    const a = document.createElement('a');
    const baseName = state.currentFile.name.replace(/\.docx$/i, '');
    a.href = url;
    a.download = `${baseName}_Rapi_DocFormat.docx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    if (stats) {
      document.getElementById('stParaCount').textContent = `${stats.paragraphs_formatted} Paragraf • ${stats.headings_formatted} Heading Rapi`;
      showToast(`Selesai! ${stats.paragraphs_formatted} paragraf, ${stats.headings_formatted} Heading 1/2/3 & ${stats.empty_lines_removed} baris kosong dirapikan.`);
    } else {
      showToast('Dokumen DOCX berhasil dirapikan & diunduh!');
    }
  } catch (err) {
    showToast('Gagal memproses dokumen: ' + err.message);
  } finally {
    lbl.textContent = origText;
    btn.disabled = false;
  }
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

document.addEventListener('DOMContentLoaded', initApp);
