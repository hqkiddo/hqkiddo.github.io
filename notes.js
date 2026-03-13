(function () {
  "use strict";

  const STORAGE_KEY = "hqkiddo-notes";
  const MAX_IMAGE_WIDTH = 800;
  const JPEG_QUALITY = 0.75;

  let notes = [];
  let stream = null;

  const cameraBtn = document.getElementById("cameraBtn");
  const uploadBtn = document.getElementById("uploadBtn");
  const fileInput = document.getElementById("fileInput");
  const cameraModal = document.getElementById("cameraModal");
  const closeCameraBtn = document.getElementById("closeCameraBtn");
  const cameraVideo = document.getElementById("cameraVideo");
  const cameraCanvas = document.getElementById("cameraCanvas");
  const captureBtn = document.getElementById("captureBtn");
  const processingModal = document.getElementById("processingModal");
  const searchInput = document.getElementById("searchInput");
  const notesList = document.getElementById("notesList");
  const emptyState = document.getElementById("emptyState");
  const noteCount = document.getElementById("noteCount");

  async function loadNotes() {
    if (window.HQDb && window.HQAuth && HQAuth.isLoggedIn()) {
      try {
        const cloud = await HQDb.getNotes();
        notes = cloud || [];
      } catch (e) {
        console.warn("Cloud load failed, using local:", e);
        loadFromLocal();
      }
    } else {
      loadFromLocal();
    }
    renderNotes();
  }

  function loadFromLocal() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      notes = raw ? JSON.parse(raw) : [];
    } catch (e) {
      notes = [];
    }
  }

  async function saveNotes() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch (e) {
      console.warn("Could not save notes:", e);
    }
    if (window.HQDb && window.HQAuth && HQAuth.isLoggedIn()) {
      try {
        await HQDb.saveNotes(notes);
      } catch (e) {
        console.warn("Cloud save failed:", e);
      }
    }
    renderNotes();
  }

  function compressImage(dataUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = function () {
        const w = img.width;
        const h = img.height;
        let targetW = w;
        let targetH = h;
        if (w > MAX_IMAGE_WIDTH) {
          targetW = MAX_IMAGE_WIDTH;
          targetH = Math.round((h * MAX_IMAGE_WIDTH) / w);
        }
        const canvas = document.createElement("canvas");
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, targetW, targetH);
        const compressed = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
        resolve(compressed);
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }

  function processImage(imageDataUrl) {
    processingModal.classList.add("show");

    compressImage(imageDataUrl)
      .then((compressed) => {
        return Tesseract.recognize(compressed, "eng", {
          logger: () => {},
        }).then((result) => ({
          text: result.data.text.trim(),
          image: compressed,
        }));
      })
      .then(({ text, image }) => {
        const note = {
          id: Date.now().toString(36) + Math.random().toString(36).slice(2),
          date: new Date().toISOString(),
          text: text || "(No text detected)",
          image: image,
        };
        notes.unshift(note);
        saveNotes();
      })
      .catch((err) => {
        console.error(err);
        compressImage(imageDataUrl).then((compressed) => {
          const note = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2),
            date: new Date().toISOString(),
            text: "(Could not read handwriting)",
            image: compressed,
          };
          notes.unshift(note);
          saveNotes();
        });
      })
      .finally(() => {
        processingModal.classList.remove("show");
      });
  }

  function startCamera() {
    cameraModal.classList.add("show");
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((s) => {
        stream = s;
        cameraVideo.srcObject = s;
      })
      .catch((err) => {
        console.error(err);
        cameraModal.classList.remove("show");
        alert("Could not access camera. Try choosing a photo instead.");
      });
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      stream = null;
    }
    cameraVideo.srcObject = null;
    cameraModal.classList.remove("show");
  }

  function captureFromCamera() {
    const ctx = cameraCanvas.getContext("2d");
    cameraCanvas.width = cameraVideo.videoWidth;
    cameraCanvas.height = cameraVideo.videoHeight;
    ctx.drawImage(cameraVideo, 0, 0);
    const dataUrl = cameraCanvas.toDataURL("image/jpeg", 0.9);
    stopCamera();
    processImage(dataUrl);
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => processImage(reader.result);
    reader.readAsDataURL(file);
    fileInput.value = "";
  }

  function formatDate(iso) {
    const d = new Date(iso);
    const now = new Date();
    const diff = now - d;
    if (diff < 86400000) return "Today";
    if (diff < 172800000) return "Yesterday";
    return d.toLocaleDateString();
  }

  function filterNotes() {
    const q = searchInput.value.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter((n) => {
      if (n.text.toLowerCase().includes(q)) return true;
      const d = formatDate(n.date).toLowerCase();
      if (d.includes(q)) return true;
      const fullDate = new Date(n.date).toLocaleDateString().toLowerCase();
      return fullDate.includes(q);
    });
  }

  function deleteNote(id) {
    if (confirm("Delete this note?")) {
      notes = notes.filter((n) => n.id !== id);
      saveNotes();
    }
  }

  function renderNotes() {
    const filtered = filterNotes();
    noteCount.textContent = filtered.length + " note" + (filtered.length !== 1 ? "s" : "");

    if (notes.length === 0) {
      emptyState.classList.remove("hidden");
      notesList.innerHTML = "";
      return;
    }

    emptyState.classList.add("hidden");

    if (filtered.length === 0) {
      notesList.innerHTML = '<p class="empty-state">No notes match your search.</p>';
      return;
    }

    notesList.innerHTML = filtered
      .map(
        (n) => `
      <article class="note-card" data-id="${n.id}">
        <div class="note-card-header">
          <span class="note-date">${formatDate(n.date)}</span>
          <button class="note-delete" data-id="${n.id}" aria-label="Delete note">✕</button>
        </div>
        <div class="note-preview">
          <img class="note-thumb" src="${n.image}" alt="" />
          <p class="note-text ${n.text === "(No text detected)" ? "empty" : ""}">${escapeHtml(n.text)}</p>
        </div>
      </article>
    `
      )
      .join("");

    notesList.querySelectorAll(".note-delete").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteNote(btn.dataset.id);
      });
    });
  }

  function escapeHtml(s) {
    const div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  cameraBtn.addEventListener("click", startCamera);
  closeCameraBtn.addEventListener("click", stopCamera);
  captureBtn.addEventListener("click", captureFromCamera);
  uploadBtn.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", handleFileSelect);
  searchInput.addEventListener("input", renderNotes);

  function init() {
    if (window.FIREBASE_ENABLED && typeof firebase !== "undefined") {
      firebase.auth().onAuthStateChanged(loadNotes);
    } else {
      loadNotes();
    }
  }
  init();
})();
