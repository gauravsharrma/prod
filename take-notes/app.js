// == Rich Notes Manager App.js ==
// Dependencies: xlsx.full.min.js, turndown.min.js

// Data and state
let notes = [], tagsSet = new Set();
let currentNoteId = null, editMode = false;
const notesKey = 'rich_notes_app';
const notesList = document.getElementById('notesList');
const editor = document.getElementById('editor');
const noteTitle = document.getElementById('noteTitle');
const noteTags = document.getElementById('noteTags');
const tagList = document.getElementById('tagList');
const datesInfo = document.getElementById('datesInfo');
const panel = document.getElementById('notesPanel');
const mainContainer = document.getElementById('mainContainer');
const saveNoteBtn = document.getElementById('saveNoteBtn');
const cancelBtn = document.getElementById('cancelBtn');
let autosaveTimer = null;

// ===== AUTOSAVE every minute =====
function autoSave(){
  if(notes.length > 0) {
    localStorage.setItem(notesKey, JSON.stringify(notes));
  }
}
setInterval(autoSave, 60*1000);

// ===== EXCEL LOADING =====
document.getElementById('fileExcel').addEventListener('change', handleExcel, false);
function handleExcel(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(evt) {
    const data = new Uint8Array(evt.target.result);
    const workbook = XLSX.read(data, {type: 'array'});
    // Assumption: Notes in first sheet
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, {header:1});
    notes = [];
    tagsSet.clear();
    for(let i=1; i<rows.length; ++i){
      const [id, title, tagsStr, content, created, modified] = rows[i];
      const tags = (tagsStr||'').split(',').map(x=>x.trim()).filter(x=>x);
      tags.forEach(t=>tagsSet.add(t));
      notes.push({ id:id||genId(), title:title||'', tags, content:content||'', created:created||new Date().toISOString(), modified:modified||new Date().toISOString() });
    }
    localStorage.setItem(notesKey, JSON.stringify(notes));
    showUI();
  };
  reader.readAsArrayBuffer(file);
}

// ===== INITIAL LOAD (localStorage) =====
window.onload = function(){
  const saved = localStorage.getItem(notesKey);
  if(saved){
    notes = JSON.parse(saved);
    notes.forEach(n => (n.tags||[]).forEach(t=>tagsSet.add(t)));
    showUI();
  } else {
    hideUI();
  }
};
function showUI(){ mainContainer.style.display='flex'; renderList(); }
function hideUI(){ mainContainer.style.display='none'; }

// ===== NOTES LIST & VIEW =====
function renderList(){
  notesList.innerHTML = `<button onclick="startNewNote()" class="export-btn" style="margin-bottom:11px;">+ New Note</button>` +
    notes.map((note,i)=>`<div class="note-row${note.id===currentNoteId?' selected':''}">
        <span class="note-title" onclick="viewNote('${note.id}')">${note.title||'Untitled'}</span>
        <span class="note-tags">${(note.tags||[]).map(t=>`<span class='tag-item'>${t}</span>`).join(' ')}</span>
        <span class="note-icons">
          <i class="bi bi-eye" title="View" onclick="viewNote('${note.id}')"></i>
          <i class="bi bi-pencil-square" title="Edit" onclick="editNote('${note.id}')"></i>
          <i class="bi bi-trash" title="Delete" onclick="deleteNote('${note.id}')"></i>
        </span>
      </div>`).join('');
}

// ====== CRUD =====
let tempTags = [];
function startNewNote(){
  currentNoteId = null;
  editMode = true;
  noteTitle.value = '';
  editor.innerHTML = '';
  tempTags = [];
  renderTags();
  datesInfo.textContent = '';
  saveNoteBtn.textContent = 'Save';
  cancelBtn.classList.add('hidden');
  noteTitle.disabled = false;
  editor.contentEditable = true;
  noteTags.disabled = false;
}
function viewNote(id){
  const n = notes.find(x=>x.id===id);
  if(!n) return;
  editMode = false;
  currentNoteId = id;
  noteTitle.value = n.title;
  editor.innerHTML = n.content;
  tempTags = [...n.tags];
  renderTags();
  datesInfo.textContent = `Created: ${toDate(n.created)} | Modified: ${toDate(n.modified)}`;
  saveNoteBtn.textContent = 'Edit';
  cancelBtn.classList.add('hidden');
  renderList();
  noteTitle.disabled = true;
  editor.contentEditable = false;
  noteTags.disabled = true;
}
function editNote(id){
  const n = notes.find(x=>x.id===id);
  if(!n) return;
  editMode = true;
  currentNoteId = id;
  noteTitle.value = n.title;
  editor.innerHTML = n.content;
  tempTags = [...n.tags];
  renderTags();
  datesInfo.textContent = `Created: ${toDate(n.created)} | Modified: ${toDate(n.modified)}`;
  saveNoteBtn.textContent = 'Save';
  cancelBtn.classList.remove('hidden');
  renderList();
  noteTitle.disabled = false;
  editor.contentEditable = true;
  noteTags.disabled = false;
}
function saveNote(){
  let content = editor.innerHTML;
  let title = noteTitle.value.trim();
  let tags = [...tempTags];
  if(editMode && currentNoteId){
    let idx = notes.findIndex(x=>x.id===currentNoteId);
    if(idx>-1){
      notes[idx].title = title;
      notes[idx].tags = tags;
      notes[idx].content = content;
      notes[idx].modified = new Date().toISOString();
    }
  } else {
    let n = { id:genId(), title, tags, content, created:new Date().toISOString(), modified:new Date().toISOString() };
    notes.unshift(n);
    currentNoteId = n.id;
  }
  autoSave();
  viewNote(currentNoteId);
}
function deleteNote(id){
  if(!confirm('Delete this note?')) return;
  notes = notes.filter(n=>n.id!==id);
  currentNoteId = null;
  autoSave();
  renderList();
  startNewNote();
}
function cancelEdit(){
  if(currentNoteId) viewNote(currentNoteId);
  else startNewNote();
}

// ===== TAGS AUTOCOMPLETE & HANDLING =====
noteTags.addEventListener('input', function(e){
  showAutocomplete(this.value);
});
noteTags.addEventListener('keydown', function(e){
  if(e.key==='Enter'||e.key===','){
    e.preventDefault();
    addTag(this.value);
    this.value = '';
    hideAutocomplete();
  }
});
function addTag(tag){
  tag = tag.trim();
  if(tag && !tempTags.includes(tag)){
    tempTags.push(tag);
    tagsSet.add(tag);
    renderTags();
  }
}
function renderTags(){
  tagList.innerHTML = tempTags.map(t=>`<span class="tag-item">${t} <i style='font-size:0.9em;cursor:pointer;' onclick="removeTag('${t}')">×</i></span>`).join(' ');
}
function removeTag(t){ tempTags = tempTags.filter(x=>x!==t); renderTags(); }
function showAutocomplete(input){
  const autoDiv = document.getElementById('autocompleteTags');
  if(!input) { hideAutocomplete(); return; }
  const matches = Array.from(tagsSet).filter(t=>t.toLowerCase().includes(input.toLowerCase())&&!tempTags.includes(t));
  if(matches.length){
    autoDiv.innerHTML = matches.map(t=>`<div class='autocomplete-item' onclick="selectAutoTag('${t}')">${t}</div>`).join('');
    autoDiv.classList.remove('hidden');
  }else{ hideAutocomplete(); }
}
function selectAutoTag(t){ addTag(t); noteTags.value=''; hideAutocomplete(); }
function hideAutocomplete(){ document.getElementById('autocompleteTags').classList.add('hidden'); }

// ===== MARKDOWN EXPORT & EXCEL =====
function downloadExcel(){
  // Each note's content converted to markdown
  const turndownService = new window.TurndownService();
  const rows = [
    ['id','title','tags','content','created','modified'],
    ...notes.map(n=>[
      n.id,
      n.title,
      n.tags.join(', '),
      turndownService.turndown(n.content||''),
      n.created,
      n.modified
    ])
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Notes');
  XLSX.writeFile(wb, 'notes_export.xlsx');
  localStorage.removeItem(notesKey);
  setTimeout(()=>location.reload(),300);
}

// ===== UTILS =====
function genId(){ return '_' + Math.random().toString(36).substr(2, 9); }
function toDate(d){ return new Date(d).toLocaleString(); }
function format(cmd){ document.execCommand(cmd, false, null); }
