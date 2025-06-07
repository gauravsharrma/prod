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
  const md = sections[index] || '';
  htmlOutput.innerHTML = marked.parse(md);
  prevBtn.disabled = index <= 0;
  nextBtn.disabled = index >= sections.length - 1;
    // <-- NEW: show “current/total”
  progressIndicator.textContent = `${index + 1}/${sections.length}`;
}

convertBtn.addEventListener('click', () => {
  const raw = textarea.value;
  const mode = splitOption.value;

  // Determine split logic based on dropdown
  switch (mode) {
    case 'dash':
      // Split on lines that are exactly `---`
      sections = raw
        .split(/^---$/m)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      break;

    case 'h1':
      // Split at every level‐1 heading (keep the heading on its own section)
      // Use lookahead so that each section begins with "# "
      sections = raw.split(/(?=^#\s.*$)/m).map((s) => s.trim()).filter((s) => s.length > 0);
      break;

    case 'h2':
      // Split at every level‐2 heading
      sections = raw.split(/(?=^##\s.*$)/m).map((s) => s.trim()).filter((s) => s.length > 0);
      break;

    case 'para':
      // Split paragraphs at blank‐line boundaries
      // (two or more consecutive newlines)
      sections = raw.split(/\n{2,}/).map((s) => s.trim()).filter((s) => s.length > 0);
      break;

    case 'sentence':
      // split on a full-stop followed by whitespace, keeping the “.” at end of each sentence
      sections = raw
      .split(/(?<=\.)\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
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
document.addEventListener('keydown', (event) => {
  const activeEl = document.activeElement;
  const newNoteDiv = document.getElementById('newNote');
  if (activeEl === newNoteDiv || newNoteDiv.contains(activeEl)) {
    return; // allow normal typing inside notes
  }
  const key = event.key;
  if (!sections.length) return;
  if (key === ' ' || key === 'Spacebar' || key === 'ArrowRight') {
    event.preventDefault();
    if (currentIndex < sections.length - 1) {
      currentIndex++;
      renderSection(currentIndex);
    }
  }
  if (key === 'ArrowLeft') {
    if (currentIndex > 0) {
      currentIndex--;
      renderSection(currentIndex);
    }
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

// Default types
const DEFAULT_TYPES = ['Note', 'Query'];

// Retrieve types or initialize defaults
function getStoredTypes() {
  const saved = localStorage.getItem(TYPES_KEY);
  try {
    const arr = saved ? JSON.parse(saved) : null;
    if (Array.isArray(arr) && arr.length > 0) {
      return arr;
    }
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
  types.forEach((type) => {
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
  types.forEach((type, index) => {
    const li = document.createElement('li');
    const span = document.createElement('span');
    span.textContent = type;
    const delBtn = document.createElement('button');
    delBtn.className = 'delete-type';
    delBtn.title = 'Delete this type';
    delBtn.innerHTML = '🗑️';
    delBtn.addEventListener('click', () => deleteType(index));
    li.appendChild(span);
    li.appendChild(delBtn);
    typesList.appendChild(li);
  });
  populateTypeSelect();
}
function addNewType() {
  const newType = newTypeInput.value.trim();
  if (!newType) return;
  let types = getStoredTypes();
  if (types.includes(newType)) {
    alert('This type already exists.');
    return;
  }
  types.push(newType);
  saveTypesToStorage(types);
  newTypeInput.value = '';
  addTypeBtn.disabled = true;
  populateTypeSelect();
  renderTypesList();
  renderNotes();
}
function deleteType(index) {
  let types = getStoredTypes();
  if (types.length <= 1) {
    alert('At least one type must remain.');
    return;
  }
  types.splice(index, 1);
  saveTypesToStorage(types);
  populateTypeSelect();
  renderTypesList();
  renderNotes();
}

function getStoredNotes() {
  const saved = localStorage.getItem(NOTES_KEY);
  try {
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}
function saveNotesToStorage(notes) {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}
// Convert HTML (from contentEditable) to Markdown
function htmlToMarkdown(html) {
  let md = html;
  // Bold (<strong>, <b>)
  md = md.replace(/<strong>([\s\S]*?)<\/strong>/gi, '**$1**');
  md = md.replace(/<b>([\s\S]*?)<\/b>/gi, '**$1**');
  // Italic (<em>, <i>)
  md = md.replace(/<em>([\s\S]*?)<\/em>/gi, '*$1*');
  md = md.replace(/<i>([\s\S]*?)<\/i>/gi, '*$1*');
  // Line breaks
  md = md.replace(/<br\s*\/?>/gi, '\n');
  md = md.replace(/<\/div>/gi, '\n');
  md = md.replace(/<div>/gi, '');
  md = md.replace(/<\/p>/gi, '\n\n');
  md = md.replace(/<p>/gi, '');
  // Strip any other HTML tags
  md = md.replace(/<[^>]+>/g, '');
  return md.trim();
}
function safeToMarkdown(text) {
  if (/<[^>]+>/.test(text)) {
    return htmlToMarkdown(text);
  }
  return text;
}

function renderNotes() {
  const notes = getStoredNotes();
  notesGrid.innerHTML = '';
  downloadBtn.disabled = notes.length === 0;

  // Filter & search
  const searchQuery = searchInput.value.trim().toLowerCase();
  const filterType = filterTypeSelect.value;
  const filtered = notes.filter((note) => {
    const matchesType = filterType === '' || note.type === filterType;
    const matchesSearch = searchQuery === '' || note.text.toLowerCase().includes(searchQuery);
    return matchesType && matchesSearch;
  });

  if (filtered.length === 0) {
    const emptyMsg = document.createElement('p');
    emptyMsg.style.textAlign = 'center';
    emptyMsg.style.color = '#666';
    emptyMsg.textContent = 'No notes found.';
    notesGrid.appendChild(emptyMsg);
    return;
  }

  filtered.forEach((noteObj) => {
    const originalIndex = notes.indexOf(noteObj);
    const card = document.createElement('div');
    card.className = 'note-card';

    const headerDiv = document.createElement('div');
    headerDiv.className = 'note-header';

    const typeBadge = document.createElement('div');
    typeBadge.className = 'note-type';
    typeBadge.textContent = noteObj.type;

    const timestampDiv = document.createElement('div');
    timestampDiv.className = 'note-timestamp';
    const date = new Date(noteObj.timestamp);
    timestampDiv.textContent = date.toLocaleString();

    headerDiv.appendChild(typeBadge);
    headerDiv.appendChild(timestampDiv);

    const textDiv = document.createElement('div');
    textDiv.className = 'note-text';
    textDiv.innerHTML = marked.parse(noteObj.text);

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'note-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'edit';
    editBtn.title = 'Edit Note';
    editBtn.innerHTML = '✏️';
    editBtn.addEventListener('click', () => startEditNote(originalIndex));

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete';
    deleteBtn.title = 'Delete Note';
    deleteBtn.innerHTML = '🗑️';
    deleteBtn.addEventListener('click', () => deleteNote(originalIndex));

    actionsDiv.append(editBtn, deleteBtn);

    card.appendChild(headerDiv);
    card.appendChild(textDiv);
    card.appendChild(actionsDiv);
    notesGrid.appendChild(card);
  });
}

function saveNote() {
  const rawHTML = newNoteDiv.innerHTML.trim();
  if (!rawHTML) return;
  const markdownText = htmlToMarkdown(rawHTML);
  const selectedType = typeSelect.value;
  let notes = getStoredNotes();

  if (newNoteDiv.dataset.editIndex != null) {
    const idx = parseInt(newNoteDiv.dataset.editIndex, 10);
    notes[idx].text = markdownText;
    notes[idx].type = selectedType;
    notes[idx].timestamp = Date.now();
    delete newNoteDiv.dataset.editIndex;
  } else {
    notes.push({
      text: markdownText,
      timestamp: Date.now(),
      type: selectedType
    });
  }

  saveNotesToStorage(notes);
  newNoteDiv.innerHTML = '';
  saveBtn.disabled = true;
  saveBtn.textContent = 'Save Note';
  renderNotes();
}

function deleteNote(index) {
  let notes = getStoredNotes();
  notes.splice(index, 1);
  saveNotesToStorage(notes);
  renderNotes();
}

function startEditNote(index) {
  const notes = getStoredNotes();
  const markdownText = notes[index].text;
  newNoteDiv.innerHTML = marked.parse(markdownText);
  typeSelect.value = notes[index].type;
  newNoteDiv.focus();
  newNoteDiv.dataset.editIndex = index;
  saveBtn.disabled = false;
  saveBtn.textContent = 'Update Note';
}

function downloadNotesAsExcel() {
  const notes = getStoredNotes();
  if (notes.length === 0) return;
  const worksheetData = notes.map((note) => {
    const mdText = safeToMarkdown(note.text);
    return {
      Type: note.type,
      Timestamp: new Date(note.timestamp).toLocaleString(),
      Text: mdText
    };
  });
  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Notes');
  XLSX.writeFile(workbook, 'notes.xlsx');
}

function uploadNotesFromExcel(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
    const parsedNotes = rows.map((row) => {
      let ts = Date.parse(row.Timestamp);
      if (isNaN(ts)) ts = Date.now();
      return {
        type: row.Type || '',
        timestamp: ts,
        text: row.Text || ''
      };
    });
    saveNotesToStorage(parsedNotes);
    renderNotes();
    alert('Notes loaded from Excel successfully.');
  };
  reader.readAsArrayBuffer(file);
}

// ─── DARK MODE TOGGLE ─────────────────────────────────────────────
modeToggleBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  if (document.body.classList.contains('dark-mode')) {
    modeToggleBtn.textContent = 'Toggle Light Mode';
  } else {
    modeToggleBtn.textContent = 'Toggle Dark Mode';
  }
});

// ─── SWITCH VIEWS: Settings ↔ Main ─────────────────────────────────
function showSettings() {
  mainView.classList.add('hidden');
  settingsView.classList.remove('hidden');
}
function showMain() {
  settingsView.classList.add('hidden');
  mainView.classList.remove('hidden');
}

// ─── INITIALIZATION ON PAGE LOAD ────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  populateTypeSelect();
  renderTypesList();
  renderNotes();

  toSettingsBtn.addEventListener('click', showSettings);
  backBtn.addEventListener('click', showMain);

  newNoteDiv.addEventListener('input', () => {
    const hasText = newNoteDiv.innerText.trim().length > 0;
    saveBtn.disabled = !hasText;
    if (!newNoteDiv.dataset.editIndex) {
      saveBtn.textContent = 'Save Note';
    }
  });
  saveBtn.addEventListener('click', saveNote);

  downloadBtn.addEventListener('click', downloadNotesAsExcel);

  uploadInput.addEventListener('change', () => {
    uploadBtn.disabled = !uploadInput.files.length;
  });
  uploadBtn.addEventListener('click', () => {
    if (uploadInput.files.length) {
      uploadNotesFromExcel(uploadInput.files[0]);
      uploadInput.value = '';
      uploadBtn.disabled = true;
    }
  });

  searchInput.addEventListener('input', renderNotes);
  filterTypeSelect.addEventListener('change', renderNotes);

  newTypeInput.addEventListener('input', () => {
    const val = newTypeInput.value.trim();
    addTypeBtn.disabled = val.length === 0;
  });
  addTypeBtn.addEventListener('click', addNewType);
});
