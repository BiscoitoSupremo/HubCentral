/* Diário híbrido — fixed spreads + notas dinâmicas salvas no localStorage
   funcionalidades:
   - páginas fixas (índice inicial)
   - notas dinâmicas (criar, editar, apagar, listar)
   - navegar entre "páginas" (prev/next)
   - renderiza nota como spread (left/right)
*/

const fixedPages = [
  {
    id: 'cover',
    title: 'Capa',
    left: `<div class="h-title">Diário — Lab.Z</div><div class="h-sub">Arquivo pessoal · edição experimental</div><div class="media">
    <img src="1.png" alt="Capa do diário">
    </div><div class="block">v0.1 · modo laboratório</div>`,
    right: `<div class="chapter">Sumário</div><div class="block"><ol><li>Introdução</li><li>Dossiês</li><li>Notas</li></ol></div>`
  },
  {
    id: 'dossie',
    title: 'Dossiê: Projetos',
    left: `<div class="chapter">Dossiê — Projetos</div><div class="h-sub">Compilado de projetos significativos</div>`,
    right: `<div class="block">Projeto: ENEM HUB — notas e recursos</div><div class="media">[screenshot]</div>`
  },
  {
    id: 'guide',
    title: 'Guia Rápido',
    left: `<div class="chapter">Guia</div><div class="h-sub">Como usar o diário</div><ul><li>Criar nota → botão +</li><li>Editar → clicar nota</li><li>Exportar/Importar → rodapé</li></ul>`,
    right: `<div class="block">Dica: Use títulos curtos e subtítulos para organização.</div>`
  }
];

// DOM refs
const pageLeft = document.getElementById('pageLeft');
const pageRight = document.getElementById('pageRight');
const prevBtn = document.getElementById('prevPage');
const nextBtn = document.getElementById('nextPage');
const newNoteBtn = document.getElementById('newNote');
const fixedList = document.getElementById('fixedList');
const notesList = document.getElementById('notesList');

const modal = document.getElementById('editorModal');
const modalTitle = document.getElementById('modalTitle');
const noteTitleInput = document.getElementById('noteTitle');
const noteSubtitleInput = document.getElementById('noteSubtitle');
const noteContentInput = document.getElementById('noteContent');
const saveNoteBtn = document.getElementById('saveNote');
const closeModal = document.getElementById('closeModal');
const deleteNoteBtn = document.getElementById('deleteNote');

let notes = JSON.parse(localStorage.getItem('labz_diario')) || [];
let currentIndex = 0; // index across combined sequence (fixedPages then notes)

// build combined index helper
function combinedCount(){ return fixedPages.length + notes.length; }
function isFixedIndex(i){ return i < fixedPages.length; }

// render sidebar fixed pages
function renderFixedList(){
  fixedList.innerHTML = '';
  fixedPages.forEach((p, idx)=>{
    const li = document.createElement('li');
    li.innerHTML = `<div class="notes-meta"><div><div class="note-title">${p.title}</div></div></div>`;
    li.onclick = ()=>{ currentIndex = idx; renderSpread(); };
    fixedList.appendChild(li);
  });
}

// render notes list
function renderNotesList(){
  notesList.innerHTML = '';
  notes.forEach((n, idx)=>{
    const li = document.createElement('li');
    li.innerHTML = `<div class="notes-meta"><div><div class="note-title">${n.title||'Sem título'}</div><div class="note-sub">${n.subtitle||''}</div></div></div>`;
    li.onclick = ()=>{ currentIndex = fixedPages.length + idx; renderSpread(); };
    li.oncontextmenu = (e)=>{ e.preventDefault(); openEditor(idx); };
    notesList.appendChild(li);
  });
}

// render current spread (left/right)
function renderSpread(){
  // boundary clamp
  if(currentIndex < 0) currentIndex = 0;
  if(currentIndex >= combinedCount()) currentIndex = combinedCount()-1;

  if(isFixedIndex(currentIndex)){
    const p = fixedPages[currentIndex];
    pageLeft.innerHTML = p.left || '';
    pageRight.innerHTML = p.right || '';
  } else {
    // show a note as a two-page spread:
    const noteIdx = currentIndex - fixedPages.length;
    const note = notes[noteIdx];
    // left: metadata + subtitle, right: content
    pageLeft.innerHTML = `<div class="chapter">${note.title||'Sem título'}</div><div class="h-sub">${note.subtitle||''}</div><div class="block">Criado: ${new Date(note.created||Date.now()).toLocaleString()}</div>`;
    // content render (basic line breaks)
    const contentHTML = `<div style="white-space:pre-wrap;line-height:1.6;color:#dcdcdc">${sanitize(note.content||'')}</div>`;
    pageRight.innerHTML = `${contentHTML}`;
  }

  // update sidebar highlight (simple)
  [...fixedList.children].forEach((li,i)=>li.style.opacity = i===currentIndex? '1':'0.75');
  [...notesList.children].forEach((li,i)=> li.style.opacity = (fixedPages.length + i)===currentIndex? '1':'0.85');
}

// helpers
function sanitize(str){
  // minimal sanitization — escape angle brackets
  return (str||'').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// navigation
prevBtn.onclick = ()=>{ currentIndex--; if(currentIndex<0) currentIndex=0; renderSpread(); }
nextBtn.onclick = ()=>{ currentIndex++; if(currentIndex>=combinedCount()) currentIndex = combinedCount()-1; renderSpread(); }

// modal open / create new note
newNoteBtn.onclick = ()=> openEditor(null);
function openEditor(noteIdx){
  modal.setAttribute('aria-hidden','false');
  modalTitle.textContent = noteIdx===null? 'Nova nota':'Editar nota';
  deleteNoteBtn.style.display = noteIdx===null? 'none':'inline-block';
  // fill if editing
  if(noteIdx!==null){
    const n = notes[noteIdx];
    noteTitleInput.value = n.title||'';
    noteSubtitleInput.value = n.subtitle||'';
    noteContentInput.value = n.content||'';
    saveNoteBtn.dataset.editIndex = noteIdx;
  } else {
    noteTitleInput.value = '';
    noteSubtitleInput.value = '';
    noteContentInput.value = '';
    saveNoteBtn.removeAttribute('data-edit-index');
  }
}
closeModal.onclick = ()=>{ modal.setAttribute('aria-hidden','true'); }

// save note
saveNoteBtn.onclick = ()=>{
  const t = noteTitleInput.value.trim();
  const s = noteSubtitleInput.value.trim();
  const c = noteContentInput.value;
  const editIndex = saveNoteBtn.dataset.editIndex;
  if(editIndex !== undefined){
    notes[editIndex] = { ...notes[editIndex], title:t, subtitle:s, content:c, updated:Date.now() };
  } else {
    notes.push({ title:t, subtitle:s, content:c, created: Date.now() });
    currentIndex = fixedPages.length + notes.length - 1; // jump to new note
  }
  localStorage.setItem('labz_diario', JSON.stringify(notes));
  renderNotesList();
  renderSpread();
  modal.setAttribute('aria-hidden','true');
};

// delete note
deleteNoteBtn.onclick = ()=>{
  const idx = parseInt(saveNoteBtn.dataset.editIndex,10);
  if(!isNaN(idx)){
    if(confirm('Deletar esta nota?')) {
      notes.splice(idx,1);
      localStorage.setItem('labz_diario', JSON.stringify(notes));
      renderNotesList();
      // clamp current index
      if(currentIndex > fixedPages.length + notes.length -1) currentIndex = fixedPages.length + notes.length -1;
      renderSpread();
      modal.setAttribute('aria-hidden','true');
    }
  }
};

// export / import rudimentar
const exportBtn = document.getElementById('exportAll');
const importBtn = document.getElementById('importJson');
const fileInput = document.getElementById('fileInput');

exportBtn.onclick = ()=>{
  const payload = { notes, meta:{ exportedAt:Date.now() } };
  const blob = new Blob([JSON.stringify(payload, null, 2)],{type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'labz_diario_export.json'; a.click();
  URL.revokeObjectURL(url);
};
importBtn.onclick = ()=> fileInput.click();
fileInput.onchange = (e)=>{
  const f = e.target.files[0];
  if(!f) return;
  const reader = new FileReader();
  reader.onload = ()=> {
    try {
      const parsed = JSON.parse(reader.result);
      if(parsed && Array.isArray(parsed.notes)) {
        notes = parsed.notes;
        localStorage.setItem('labz_diario', JSON.stringify(notes));
        renderNotesList();
        renderSpread();
        alert('Importado com sucesso.');
      } else alert('Arquivo inválido.');
    } catch(err){ alert('Erro ao importar.'); }
  };
  reader.readAsText(f);
};

// initial render
renderFixedList();
renderNotesList();
renderSpread();

// keyboard shortcuts (n = new, ←/→ nav)
document.addEventListener('keydown', (e)=>{
  if(e.key==='n') openEditor(null);
  if(e.key==='ArrowLeft') prevBtn.click();
  if(e.key==='ArrowRight') nextBtn.click();
});
