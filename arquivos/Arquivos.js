let currentPath = "/";
let currentPreviewFile = null;
let currentFilter = "";
let currentTypeFilter = "all";

/* IndexedDB */

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("ameixaFilesDB", 2);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("files")) {
        const store = db.createObjectStore("files", {
          keyPath: "id",
          autoIncrement: true
        });
        store.createIndex("path", "path", { unique: false });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject("Erro ao abrir BD");
  });
}

async function saveFile(path, name, blob) {
  const db = await openDB();
  const tx = db.transaction("files", "readwrite");
  tx.objectStore("files").add({
    path,
    name,
    data: blob,
    date: Date.now()
  });
  return new Promise((res) => (tx.oncomplete = () => res(true)));
}

async function listFiles(path) {
  const db = await openDB();
  const tx = db.transaction("files", "readonly");
  return new Promise((res) => {
    const req = tx.objectStore("files").index("path").getAll(path);
    req.onsuccess = () => res(req.result);
  });
}

async function deleteFile(id) {
  const db = await openDB();
  const tx = db.transaction("files", "readwrite");
  tx.objectStore("files").delete(id);
  return new Promise((res) => (tx.oncomplete = () => res(true)));
}

/* Helpers */

function getExtension(name) {
  const parts = name.split(".");
  if (parts.length === 1) return "";
  return parts.pop().toLowerCase();
}

/**
 * Categorias que vão controlar cor do hexágono:
 *  - image
 *  - document
 *  - code
 *  - other
 *  - generic (fallback)
 */
function fileCategory(name) {
  const ext = getExtension(name);

  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext))
    return "image";

  if (
    ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "odt"].includes(ext)
  )
    return "document";

  if (["js", "ts", "css", "scss", "html", "json", "xml"].includes(ext))
    return "code";

  if (["txt", "md", "csv", "log"].includes(ext)) return "other";

  if (!ext) return "generic";

  return "other";
}

/**
 * Símbolo curto que aparece no topo do hex, para dar cara de "logo".
 */
function fileSymbolFromCategory(cat) {
  switch (cat) {
    case "image":
      return "IMG";
    case "document":
      return "DOC";
    case "code":
      return "</>";
    case "other":
      return "ARQ";
    case "generic":
    default:
      return "FILE";
  }
}

function formatMeta(file) {
  const blob = file.data;
  const ext = file.name.includes(".")
    ? file.name.split(".").pop().toUpperCase()
    : "ARQ";
  const sizeKB = blob && blob.size ? (blob.size / 1024).toFixed(1) : "?";
  const date = new Date(file.date || Date.now());
  return `${ext} • ${sizeKB} KB • ${date.toLocaleString()}`;
}

function shortenName(name, max = 22) {
  if (name.length <= max) return name;
  const [base, ext] = name.split(/(?=\.[^.]+$)/); // separa última extensão
  const cut = max - (ext ? ext.length + 3 : 3);
  return `${base.slice(0, Math.max(cut, 5))}...${ext || ""}`;
}

/* Preview */

function previewFile(file) {
  currentPreviewFile = file;

  const modal = document.getElementById("preview-modal");
  const area = document.getElementById("preview-area");
  const nameEl = document.getElementById("modal-filename");
  const metaEl = document.getElementById("modal-meta");

  nameEl.textContent = file.name;
  metaEl.textContent = formatMeta(file);

  area.innerHTML = "";

  const blob = file.data;
  const ext = getExtension(file.name);

  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) {
    const img = new Image();
    img.src = URL.createObjectURL(blob);
    img.onload = () => URL.revokeObjectURL(img.src);
    area.appendChild(img);
  } else if (ext === "pdf") {
    const iframe = document.createElement("iframe");
    iframe.src = URL.createObjectURL(blob);
    iframe.loading = "lazy";
    area.appendChild(iframe);
  } else if (
    ["txt", "md", "html", "css", "js", "json", "xml", "csv", "log"].includes(
      ext
    )
  ) {
    blob.text().then((t) => {
      const pre = document.createElement("pre");
      pre.textContent = t; // segura HTML sem executar
      area.appendChild(pre);
    });
  } else {
    const p = document.createElement("p");
    p.textContent =
      "Tipo de arquivo sem preview, mas você pode baixar normalmente.";
    area.appendChild(p);
  }

  modal.classList.remove("hidden");
}

/* Render */

async function renderFiles(filter = currentFilter) {
  currentFilter = (filter || "").toLowerCase();
  const files = await listFiles(currentPath);
  const grid = document.getElementById("file-grid");

  // contador no topo
  const countEl = document.getElementById("file-count");
  if (countEl) {
    countEl.textContent = `${files.length} arquivo${
      files.length === 1 ? "" : "s"
    } armazenado${files.length === 1 ? "" : "s"}`;
  }

  const filtered = files.filter((f) => {
    const nameMatch = currentFilter
      ? f.name.toLowerCase().includes(currentFilter)
      : true;

    const cat = fileCategory(f.name);
    const typeMatch =
      currentTypeFilter === "all" ? true : cat === currentTypeFilter;

    return nameMatch && typeMatch;
  });

  if (!filtered.length) {
    grid.innerHTML =
      '<p class="empty-state">Nenhum arquivo encontrado com esse filtro. Envie algo ou ajuste os filtros.</p>';
    return;
  }

  grid.innerHTML = "";

  filtered.forEach((file) => {
    const cat = fileCategory(file.name);
    const hex = document.createElement("div");
    const extUpper = getExtension(file.name).toUpperCase() || "ARQ";
    const symbol = fileSymbolFromCategory(cat);

    const typeClass =
      cat === "image"
        ? "hex-type-image"
        : cat === "document"
        ? "hex-type-document"
        : cat === "code"
        ? "hex-type-code"
        : cat === "other"
        ? "hex-type-other"
        : "hex-type-generic";

    hex.className = `hex ${typeClass}`;
    hex.dataset.type = cat;

    hex.innerHTML = `
      <div class="hex-symbol">${symbol}</div>
      <div class="hex-name">${shortenName(file.name)}</div>
      <div class="hex-meta">${extUpper}</div>
    `;

    const blob = file.data;
    const sizeKB = blob && blob.size ? (blob.size / 1024).toFixed(1) : "?";
    hex.title = `${file.name}\n${sizeKB} KB`;

    hex.addEventListener("click", () => previewFile(file));
    grid.appendChild(hex);
  });
}

/* Eventos */

document.getElementById("upload").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  await saveFile(currentPath, file.name, file);
  e.target.value = "";
  renderFiles();
});

document.getElementById("close-modal").addEventListener("click", () => {
  document.getElementById("preview-modal").classList.add("hidden");
  currentPreviewFile = null;
});

document.getElementById("preview-modal").addEventListener("click", (e) => {
  // fechar clicando fora do conteúdo
  if (e.target.id === "preview-modal") {
    document.getElementById("preview-modal").classList.add("hidden");
    currentPreviewFile = null;
  }
});

document.getElementById("search").addEventListener("input", (e) => {
  renderFiles(e.target.value);
});

document.getElementById("download-file").addEventListener("click", () => {
  if (!currentPreviewFile) return;
  const blob = currentPreviewFile.data;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = currentPreviewFile.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

document.getElementById("delete-file").addEventListener("click", async () => {
  if (!currentPreviewFile) return;
  const ok = confirm(`Excluir "${currentPreviewFile.name}"?`);
  if (!ok) return;

  await deleteFile(currentPreviewFile.id);
  currentPreviewFile = null;
  document.getElementById("preview-modal").classList.add("hidden");
  renderFiles();
});

/* Filtro por tipo via chips */

document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    const type = chip.dataset.type || "all";
    currentTypeFilter = type;

    document
      .querySelectorAll(".chip")
      .forEach((c) => c.classList.remove("chip-active"));
    chip.classList.add("chip-active");

    renderFiles(currentFilter);
  });
});

/* Inicialização */

renderFiles();
