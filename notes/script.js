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
    if (currentIndex > 0) renderSection(--currentIndex);
  });

  nextBtn.addEventListener('click', () => {
    if (currentIndex < sections.length - 1) renderSection(++currentIndex);
  });

  increaseFontBtn.addEventListener('click', () => {
    fontSize += 2;
    htmlOutput.style.fontSize = fontSize + 'px';
  });

  decreaseFontBtn.addEventListener('click', () => {
    if (fontSize > 8) htmlOutput.style.fontSize = (fontSize -= 2) + 'px';
  });

  // ─── IGNORE SPACE/ARROWS WHEN FOCUS IN #newNote ──────────────────────────
  document.addEventListener('keydown', (e) => {
    const newNoteDiv = document.getElementById('newNote');
    if (newNoteDiv.contains(document.activeElement) || !sections.length) return;
    if ([' ', 'Spacebar', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      if (currentIndex < sections.length - 1) renderSection(++currentIndex);
    }
    if (e.key === 'ArrowLeft' && currentIndex > 0) renderSection(--currentIndex);
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

  const NOTES_KEY = 'localNotesApp_notes';
  const TYPES_KEY = 'localNotesApp_types';
  const DEFAULT_TYPES = ['Note', 'Query'];

  function getStoredTypes() {
    const saved = localStorage.getItem(TYPES_KEY);
    try { const arr = saved && JSON.parse(saved); if (Array.isArray(arr) && arr.length) return arr; } catch {};
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
    types.forEach(t => {
      const o = document.createElement('option'); o.value = o.textContent = t; typeSelect.appendChild(o);
      const f = document.createElement('option'); f.value = f.textContent = t; filterTypeSelect.appendChild(f);
    });
  }

  function renderTypesList() {
    typesList.innerHTML = '';
    getStoredTypes().forEach((t, i) => {
      const li = document.createElement('li');
      const span = document.createElement('span'); span.textContent = t;
      const btn = document.createElement('button'); btn.className='delete-type'; btn.textContent='🗑️'; btn.title='Delete';
      btn.onclick = () => deleteType(i);
      li.append(span, btn);
      typesList.appendChild(li);
    });
  }

  function addNewType() {
    const t=newTypeInput.value.trim(); if (!t) return;
    const types=getStoredTypes(); if (types.includes(t)) return alert('Type exists');
    types.push(t); saveTypesToStorage(types);
    newTypeInput.value=''; addTypeBtn.disabled=true;
    populateTypeSelect(); renderTypesList(); renderNotes();
  }

  function deleteType(idx) {
    const types=getStoredTypes(); if (types.length<=1) return alert('Need one type');
    types.splice(idx,1); saveTypesToStorage(types);
    populateTypeSelect(); renderTypesList(); renderNotes();
  }

  function getStoredNotes() {
    try { return JSON.parse(localStorage.getItem(NOTES_KEY))||[]; } catch { return []; }
  }

  function saveNotesToStorage(n) { localStorage.setItem(NOTES_KEY, JSON.stringify(n)); }

  function htmlToMarkdown(html) {
    return html.replace(/<strong>([\s\S]*?)<\/strong>/gi,'**$1**')
      .replace(/<b>([\s\S]*?)<\/b>/gi,'**$1**')
      .replace(/<em>([\s\S]*?)<\/em>/gi,'*$1*')
      .replace(/<i>([\s\S]*?)<\/i>/gi,'*$1*')
      .replace(/<br\s*\/>/gi,'\n')
      .replace(/<div>/gi,'')
      .replace(/<\/div>/gi,'\n')
      .replace(/<p>/gi,'')
      .replace(/<\/p>/gi,'\n\n')
      .replace(/<[^>]+>/g,'').trim();
  }

  function safeToMarkdown(txt) { return /<[^>]+>/.test(txt) ? htmlToMarkdown(txt) : txt; }

  function renderNotes() {
    const all=getStoredNotes(); notesGrid.innerHTML=''; downloadBtn.disabled=!all.length;
    const sq=searchInput.value.trim().toLowerCase(); const ft=filterTypeSelect.value;
    const f=all.filter(n=>(!ft||n.type===ft)&&(!sq||n.text.toLowerCase().includes(sq)));
    if(!f.length){ const p=document.createElement('p'); p.style.textAlign='center'; p.style.color='#666'; p.textContent='No notes'; notesGrid.appendChild(p); return; }
    f.forEach(n=>{
      const idx=all.indexOf(n);
      const card=document.createElement('div'); card.className='note-card';
      const h=document.createElement('div'); h.className='note-header';
      const badge=document.createElement('div'); badge.className='note-type'; badge.textContent=n.type;
      const ts=document.createElement('div'); ts.className='note-timestamp'; ts.textContent=new Date(n.timestamp).toLocaleString();
      h.append(badge,ts);
      const txt=document.createElement('div'); txt.className='note-text'; txt.innerHTML=marked.parse(n.text);
      const act=document.createElement('div'); act.className='note-actions';
      const ebtn=document.createElement('button'); ebtn.className='edit'; ebtn.title='Edit'; ebtn.textContent='✏️'; ebtn.onclick=() => startEditNote(idx);
      const dbtn=document.createElement('button'); dbtn.className='delete'; dbtn.title='Delete'; dbtn.textContent='🗑️'; dbtn.onclick=() => deleteNote(idx);
      act.append(ebtn,dbtn);
      card.append(h,txt,act);
      notesGrid.appendChild(card);
    });
  }

  function saveNote() {
    const html=newNoteDiv.innerHTML.trim(); if(!html) return;
    const md=htmlToMarkdown(html); const typ=typeSelect.value;
    const arr=getStoredNotes();
    if(newNoteDiv.dataset.editIndex!=null){ const i=+newNoteDiv.dataset.editIndex; arr[i]={text:md,timestamp:Date.now(),type:typ}; delete newNoteDiv.dataset.editIndex;
    } else arr.push({text:md,timestamp:Date.now(),type:typ});
    saveNotesToStorage(arr); newNoteDiv.innerHTML=''; saveBtn.disabled=true; saveBtn.textContent='Save Note'; renderNotes();
  }

  function deleteNote(i){ const arr=getStoredNotes(); arr.splice(i,1); saveNotesToStorage(arr); renderNotes(); }

  function startEditNote(i){ const arr=getStoredNotes(); newNoteDiv.innerHTML=marked.parse(arr[i].text); typeSelect.value=arr[i].type; newNoteDiv.dataset.editIndex=i; saveBtn.disabled=false; saveBtn.textContent='Update Note'; newNoteDiv.focus(); }

  function downloadNotesAsExcel(){ const arr=getStoredNotes(); if(!arr.length)return; const data=arr.map(n=>({Type:n.type,Timestamp:new Date(n.timestamp).toLocaleString(),Text:safeToMarkdown(n.text)})); const ws=XLSX.utils.json_to_sheet(data); const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,'Notes'); XLSX.writeFile(wb,'notes.xlsx'); }

  function uploadNotesFromExcel(file){ const reader=new FileReader(); reader.onload=e=>{ const wb=XLSX.read(new Uint8Array(e.target.result),{type:'array'}); const ws=wb.Sheets[wb.SheetNames[0]]; const rows=XLSX.utils.sheet_to_json(ws,{defval:''}); const parsed=rows.map(r=>({type:r.Type||'',timestamp:isNaN(Date.parse(r.Timestamp))?Date.now():Date.parse(r.Timestamp),text:r.Text||''})); saveNotesToStorage(parsed); renderNotes(); alert('Notes loaded from Excel'); }; reader.readAsArrayBuffer(file); }

  modeToggleBtn.addEventListener('click',()=>{ document.body.classList.toggle('dark-mode'); modeToggleBtn.textContent=document.body.classList.contains('dark-mode')?'Toggle Light Mode':'Toggle Dark Mode'; });

  function showSettings(){ mainView.classList.add('hidden'); settingsView.classList.remove('hidden'); }
  function showMain(){ settingsView.classList.add('hidden'); mainView.classList.remove('hidden'); }

  // INITIALIZATION
  progressIndicator.textContent='0/0';
  populateTypeSelect();
  renderTypesList();
  renderNotes();
  toSettingsBtn.addEventListener('click',showSettings);
  backBtn.addEventListener('click',showMain);
  newNoteDiv.addEventListener('input',()=>{ saveBtn.disabled=newNoteDiv.innerText.trim().length===0; if(!newNoteDiv.dataset.editIndex) saveBtn.textContent='Save Note'; });
  saveBtn.addEventListener('click',saveNote);
  downloadBtn.addEventListener('click',downloadNotesAsExcel);
  uploadInput.addEventListener('change',()=>uploadBtn.disabled=!uploadInput.files.length);
  uploadBtn.addEventListener('click',()=>{ if(uploadInput.files.length)uploadNotesFromExcel(uploadInput.files[0]); uploadInput.value=''; uploadBtn.disabled=true; });
  searchInput.addEventListener('input',renderNotes);
  filterTypeSelect.addEventListener('change',renderNotes);
  newTypeInput.addEventListener('input',()=>addTypeBtn.disabled=newTypeInput.value.trim().length===0);
  addTypeBtn.addEventListener('click',addNewType);
});
