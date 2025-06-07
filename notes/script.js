// ─── Wait for the DOM first ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // ─── JAVASCRIPT FOR MARKDOWN → HTML (Columns 1 & 2) ─────────────────────────
  let sections = [];
  let currentIndex = 0;
  let fontSize = 16;

  const textarea = document.getElementById('markdownInput');
  const convertBtn = document.getElementById('convertBtn');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const htmlOutput = document.getElementById('htmlOutput');
  const increaseFontBtn = document.getElementById('increaseFontBtn');
  const decreaseFontBtn = document.getElementById('decreaseFontBtn');
  const splitOption = document.getElementById('splitOption');
  const progressIndicator = document.getElementById('progressIndicator');

  function renderSection(index) {
    if (!sections.length) return;
    htmlOutput.innerHTML = marked.parse(sections[index]);
    prevBtn.disabled = index <= 0;
    nextBtn.disabled = index >= sections.length - 1;
    progressIndicator.textContent = `${index + 1}/${sections.length}`;
  }

  convertBtn.addEventListener('click', () => {
    const raw = textarea.value;
    const mode = splitOption.value;
    switch (mode) {
      case 'dash':
        sections = raw.split(/^---$/m).map(s => s.trim()).filter(Boolean);
        break;
      case 'h1':
        sections = raw.split(/(?=^#\s)/m).map(s => s.trim()).filter(Boolean);
        break;
      case 'h2':
        sections = raw.split(/(?=^##\s)/m).map(s => s.trim()).filter(Boolean);
        break;
      case 'para':
        sections = raw.split(/\n{2,}/).map(s => s.trim()).filter(Boolean);
        break;
      case 'sentence':
        sections = raw.split(/(?<=\.)\s+/).map(s => s.trim()).filter(Boolean);
        break;
      default:
        sections = [raw];
    }
    currentIndex = 0;
    if (sections.length) {
      renderSection(0);
    } else {
      htmlOutput.innerHTML = '<em>No content to display.</em>';
      prevBtn.disabled = true;
      nextBtn.disabled = true;
      progressIndicator.textContent = '0/0';
    }
  });

  prevBtn.addEventListener('click', () => {
    if (currentIndex > 0) {
      currentIndex--;
      renderSection(currentIndex);
    }
  });

  nextBtn.addEventListener('click', () => {
    if (currentIndex < sections.length - 1) {
      currentIndex++;
      renderSection(currentIndex);
    }
  });

  increaseFontBtn.addEventListener('click', () => {
    fontSize += 2;
    htmlOutput.style.fontSize = fontSize + 'px';
  });

  decreaseFontBtn.addEventListener('click', () => {
    if (fontSize > 8) {
      fontSize -= 2;
      htmlOutput.style.fontSize = fontSize + 'px';
    }
  });

  // ─── IGNORE SPACE/ARROWS WHEN FOCUS IN #newNote ──────────────────────────
  document.addEventListener('keydown', event => {
    const newNoteDiv = document.getElementById('newNote');
    if (newNoteDiv.contains(document.activeElement)) return;
    if (!sections.length) return;
    if ([' ', 'Spacebar', 'ArrowRight'].includes(event.key)) {
      event.preventDefault();
      if (currentIndex < sections.length - 1) renderSection(++currentIndex);
    }
    if (event.key === 'ArrowLeft' && currentIndex > 0) {
      renderSection(--currentIndex);
    }
  });

  // ─── JAVASCRIPT FOR NOTES APP (Column 3) ────────────────────────────
  const toSettingsBtn = document.getElementById('toSettingsBtn');
  const backBtn = document.getElementById('backBtn');
  const mainView = document.getElementById('mainView');
  const settingsView = document.getElementById('settingsView');
  const newNoteDiv = document.getElementById('newNote');
  const saveBtn = document.getElementById('saveBtn');
  const typeSelect = document.getElementById('typeSelect');
  const notesGrid = document.getElementById('notesGrid');
  const downloadBtn = document.getElementById('downloadBtn');
  const uploadInput = document.getElementById('uploadInput');
  const uploadBtn = document.getElementById('uploadBtn');
  const typesList = document.getElementById('typesList');
  const newTypeInput = document.getElementById('newTypeInput');
  const addTypeBtn = document.getElementById('addTypeBtn');
  const searchInput = document.getElementById('searchInput');
  const filterTypeSelect = document.getElementById('filterTypeSelect');
  const modeToggleBtn = document.getElementById('modeToggleBtn');

  // Storage keys
  const NOTES_KEY = 'localNotesApp_notes';
  const TYPES_KEY = 'localNotesApp_types';
  const DEFAULT_TYPES = ['Note', 'Query'];

  function getStoredTypes() {
    const saved = localStorage.getItem(TYPES_KEY);
    try {
      const arr = saved ? JSON.parse(saved) : null;
      if (Array.isArray(arr) && arr.length > 0) return arr;
    } catch {}
    localStorage.setItem(TYPES_KEY, JSON.stringify(DEFAULT_TYPES));
    return DEFAULT_TYPES;
  }

  function saveTypesToStorage(types) {
    localStorage.setItem(TYPES_KEY, JSON.stringify(types));
  }

  function populateTypeSelect() {
    const types = getStoredTypes();
    typeSelect.innerHTML = '';
    filterTypeSelect.innerHTML = '<option value="">All Types</option>';
    types.forEach(type => {
      const opt = document.createElement('option');
      opt.value = type;
      opt.textContent = type;
      typeSelect.appendChild(opt);
      const filtOpt = document.createElement('option');
      filtOpt.value = type;
      filtOpt.textContent = type;
      filterTypeSelect.appendChild(filtOpt);
    });
  }

  function renderTypesList() {
    const types = getStoredTypes();
    typesList.innerHTML = '';
    types.forEach((type, i) => {
      const li = document.createElement('li');
      const span = document.createElement('span');
      span.textContent = type;
      const delBtn = document.createElement('button');
      delBtn.className = 'delete-type';
      delBtn.title = 'Delete this type';
      delBtn.textContent = '🗑️';
      delBtn.addEventListener('click', () => deleteType(i));
      li.append(span, delBtn);
      typesList.appendChild(li);
    });
  }

  function addNewType() {
    const t = newTypeInput.value.trim();
    if (!t) return;
    let types = getStoredTypes();
    if (types.includes(t)) return alert('Type exists');
    types.push(t);
    saveTypesToStorage(types);
    newTypeInput.value = '';
    addTypeBtn.disabled = true;
    populateTypeSelect();
    renderTypesList();
    renderNotes();
  }

  function deleteType(idx) {
    let types = getStoredTypes();
    if (types.length <= 1) return alert('At least one type');
    types.splice(idx, 1);
    saveTypesToStorage(types);
    populateTypeSelect();
    renderTypesList();
    renderNotes();
  }

  function getStoredNotes() {
    const saved = localStorage.getItem(NOTES_KEY);
    try { return saved ? JSON.parse(saved) : []; } catch { return []; }
  }

  function saveNotesToStorage(notes) {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  }

  function htmlToMarkdown(html) {
    let md = html
      .replace(/<strong>([\s\S]*?)<\/strong>/gi, '**$1**')
      .replace(/<b>([\s\S]*?)<\/b>/gi, '**$1**')
      .replace(/<em>([\s\S]*?)<\/em>/gi, '*$1*')
      .replace(/<i>([\s\S]*?)<\/i>/gi, '*$1*')
      .replace(/<br\s*\/>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<div>/gi, '')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<p>/gi, '')
      .replace(/<[^>]+>/g, '');
    return md.trim();
  }

  function safeToMarkdown(text) {
    return /<[^>]+>/.test(text) ? htmlToMarkdown(text) : text;
  }

  function renderNotes() {
    const notes = getStoredNotes();
    notesGrid.innerHTML = '';
    downloadBtn.disabled = !notes.length;

    const sq = searchInput.value.trim().toLowerCase();
    const ft = filterTypeSelect.value;
    const filtered = notes.filter(n => {
      const mt = !ft || n.type === ft;
      const ms = !sq || n.text.toLowerCase().includes(sq);
      return mt && ms;
    });

    if (!filtered.length) {
      const p = document.createElement('p');
      p.style.textAlign = 'center';
      p.style.color = '#666';
      p.textContent = 'No notes';
      notesGrid.appendChild(p);
      return;
    }

    filtered.forEach(n => {
      const idx = getStoredNotes().indexOf(n);
      const card = document.createElement('div'); card.className = 'note-card';
      const header = document.createElement('div'); header.className = 'note-header';
      const badge = document.createElement('div'); badge.className = 'note-type'; badge.textContent = n.type;
      const time = document.createElement('div'); time.className='note-timestamp'; time.textContent=new Date(n.timestamp).toLocaleString();
      header.append(badge, time);
      const text = document.createElement('div'); text.className='note-text'; text.innerHTML=marked.parse(n.text);
      const actions = document.createElement('div'); actions.className='note-actions';
      const editBtn = document.createElement('button'); editBtn.className='edit'; editBtn.title='Edit'; editBtn.textContent='✏️';
      editBtn.addEventListener('click',()=>startEditNote(idx));
      const delBtn = document.createElement('button'); delBtn.className='delete'; delBtn.title='Delete'; delBtn.textContent='🗑️';
      delBtn.addEventListener('click',()=>deleteNote(idx));
      actions.append(editBtn, delBtn);
      card.append(header, text, actions);
      notesGrid.appendChild(card);
    });
  }

  function saveNote() {
    const html = newNoteDiv.innerHTML.trim();
    if (!html) return;
    const mdText = htmlToMarkdown(html);
    const type = typeSelect.value;
    let notes = getStoredNotes();
    if (newNoteDiv.dataset.editIndex!=null) {
      const i = +newNoteDiv.dataset.editIndex;
      notes[i]={ text:mdText, timestamp:Date.now(), type };
      delete newNoteDiv.dataset.editIndex;
    } else { notes.push({ text:mdText, timestamp:Date.now(), type }); }
    saveNotesToStorage(notes);
    newNoteDiv.innerHTML=''; saveBtn.disabled=true; saveBtn.textContent='Save Note'; renderNotes();
  }

  function deleteNote(i){ let ns=getStoredNotes(); ns.splice(i,1); saveNotesToStorage(ns); renderNotes(); }

  function startEditNote(i) {
    const ns = getStoredNotes();
    newNoteDiv.innerHTML = marked.parse(ns[i].text);
    typeSelect.value = ns[i].type;
    newNoteDiv.dataset.editIndex = i;
    saveBtn.disabled = false;
    saveBtn.textContent = 'Update Note';
    newNoteDiv.focus();
  }

  function downloadNotesAsExcel() {
    const ns = getStoredNotes(); if (!ns.length) return;
    const data = ns.map(n=>({ Type:n.type, Timestamp:new Date(n.timestamp).toLocaleString(), Text:safeToMarkdown(n.text) }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Notes');
    XLSX.writeFile(wb, 'notes.xlsx');
  }

  function uploadNotesFromExcel(file) {
    const reader = new FileReader();
    reader.onload = e => {
      const wb = XLSX.read(new Uint8Array(e.target.result), { type:'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval:'' });
      const parsed = rows.map(r=>({ type:r.Type||'', timestamp:isNaN(Date.parse(r.Timestamp))?Date.now():Date.parse(r.Timestamp), text:r.Text||'' }));
      saveNotesToStorage(parsed);
      renderNotes();
      alert('Notes loaded from Excel.');
    }; reader.readAsArrayBuffer(file);
  }

  // Dark mode toggle
  modeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    modeToggleBtn.textContent = document.body.classList.contains('dark-mode')
      ? 'Toggle Light Mode' : 'Toggle Dark Mode';
  });

  function showSettings(){ mainView.classList.add('hidden'); settingsView.classList.remove('hidden'); }
  function showMain(){ settingsView.classList.add('hidden'); mainView.classList.remove('hidden'); }

  // Initialization
  progressIndicator.textContent = '0/0';
  populateTypeSelect();
  renderTypesList();
  renderNotes();
  toSettingsBtn.addEventListener('click', showSettings);
  backBtn.addEventListener('click', showMain);
  newNoteDiv.addEventListener('input', () => {
    const has = newNoteDiv.innerText.trim().length>0;
    saveBtn.disabled = !has;
    if (!newNoteDiv.dataset.editIndex) saveBtn.textContent='Save Note';
  });
  saveBtn.addEventListener('click', saveNote);
  downloadBtn.addEventListener('click', downloadNotesAsExcel);
  uploadInput.addEventListener('change', () => uploadBtn.disabled = !uploadInput.files.length);
  uploadBtn.addEventListener('click', () => upload
