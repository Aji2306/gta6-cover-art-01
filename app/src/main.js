import { renderCover } from './cover.js';

const state = {
  layout: 'hero-2', // 'hero-2', 'triptych', 'quad', 'portrait-stack'
  grade: 'sunset', // 'sunset', 'neon-night', 'vice-gold'
  caption: 'VICE SUNSET',
  tagline: 'PARADISE LOST',
  captionPos: 'bottom',
  photos: [
    { img: null, name: 'Sample 1' },
    { img: null, name: 'Sample 2' },
    { img: null, name: 'Sample 3' },
    { img: null, name: 'Sample 4' }
  ],
  transforms: [
    { zoom: 1, panX: 0, panY: 0, fit: 'cover' },
    { zoom: 1, panX: 0, panY: 0, fit: 'cover' },
    { zoom: 1, panX: 0, panY: 0, fit: 'cover' },
    { zoom: 1, panX: 0, panY: 0, fit: 'cover' }
  ],
  activePanel: 0
};

async function init() {
  // Load sample image
  const sampleImg = await loadImage('./samples/boulevard.jpg');
  for (let i = 0; i < 4; i++) {
    state.photos[i].img = sampleImg;
  }

  // Parse Query Parameters
  const params = new URLSearchParams(window.location.search);
  if (params.has('shot')) {
    const shot = params.get('shot');
    if (shot === 'cover') {
      document.body.classList.add('shot-cover');
    }
  }
  if (params.has('layout')) state.layout = params.get('layout');
  if (params.has('grade')) state.grade = params.get('grade');
  if (params.has('caption')) state.caption = params.get('caption');
  if (params.has('tagline')) state.tagline = params.get('tagline');

  // Build UI controls
  buildUI();

  // Wait for Anton font to load
  try {
    await document.fonts.load('100px "Anton"');
  } catch (e) {
    console.log('Font load warning:', e);
  }

  // Initial draw
  updatePreview();

  // Mark shot ready for automated screenshots
  window.__shotReady = true;
}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      // Fallback
      const fallback = new Image();
      fallback.onload = () => resolve(fallback);
      fallback.src = './samples/pier.jpg';
    };
    img.src = src;
  });
}

function buildUI() {
  // Layout thumbnails click
  document.querySelectorAll('.layout-thumb').forEach(el => {
    if (el.dataset.layout === state.layout) el.classList.add('active');
    el.addEventListener('click', () => {
      document.querySelectorAll('.layout-thumb').forEach(t => t.classList.remove('active'));
      el.classList.add('active');
      state.layout = el.dataset.layout;
      updatePreview();
    });
  });

  // Grade swatches click
  document.querySelectorAll('.grade-thumb').forEach(el => {
    if (el.dataset.grade === state.grade) el.classList.add('active');
    el.addEventListener('click', () => {
      document.querySelectorAll('.grade-thumb').forEach(t => t.classList.remove('active'));
      el.classList.add('active');
      state.grade = el.dataset.grade;
      updatePreview();
    });
  });

  // Caption input
  const captionInput = document.getElementById('captionInput');
  if (captionInput) {
    captionInput.value = state.caption;
    captionInput.addEventListener('input', (e) => {
      state.caption = e.target.value.substring(0, 40);
      updatePreview();
    });
  }

  // Tagline input
  const taglineInput = document.getElementById('taglineInput');
  if (taglineInput) {
    taglineInput.value = state.tagline;
    taglineInput.addEventListener('input', (e) => {
      state.tagline = e.target.value.substring(0, 60);
      updatePreview();
    });
  }

  // Caption position select
  const posSelect = document.getElementById('captionPosSelect');
  if (posSelect) {
    posSelect.value = state.captionPos;
    posSelect.addEventListener('change', (e) => {
      state.captionPos = e.target.value;
      updatePreview();
    });
  }

  // Panel photo file inputs & controls
  for (let i = 0; i < 4; i++) {
    const fileInput = document.getElementById(`panelFile${i}`);
    if (fileInput) {
      fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
          const url = URL.createObjectURL(file);
          const img = await loadImage(url);
          state.photos[i].img = img;
          state.photos[i].name = file.name;
          updatePreview();
          setStatus(`Loaded photo into Panel ${i + 1}`);
        }
      });
    }

    const zoomRange = document.getElementById(`zoomRange${i}`);
    if (zoomRange) {
      zoomRange.addEventListener('input', (e) => {
        state.transforms[i].zoom = parseFloat(e.target.value);
        updatePreview();
      });
    }
  }

  // Use same photo in all panels button
  const samePhotoBtn = document.getElementById('samePhotoBtn');
  if (samePhotoBtn) {
    samePhotoBtn.addEventListener('click', () => {
      const p0 = state.photos[0];
      for (let i = 1; i < 4; i++) {
        state.photos[i].img = p0.img;
        state.photos[i].name = p0.name;
      }
      updatePreview();
      setStatus('Applied Panel 1 photo to all panels.');
    });
  }

  // Export buttons
  document.getElementById('export1080s')?.addEventListener('click', () => exportCover(1080, 1080, 'square'));
  document.getElementById('export1080p')?.addEventListener('click', () => exportCover(1080, 1350, 'portrait'));
  document.getElementById('export1920')?.addEventListener('click', () => exportCover(1920, 1080, 'landscape'));
}

function updatePreview() {
  const canvas = document.getElementById('previewCanvas');
  if (!canvas) return;

  // For preview, maintain a crisp aspect ratio based on layout or default 16:9 / 1:1
  const params = new URLSearchParams(window.location.search);
  const sizeParam = params.get('size');
  let targetW = 1200;
  let targetH = 1200;
  if (sizeParam === 'portrait') {
    targetW = 1080;
    targetH = 1350;
  } else if (sizeParam === 'landscape' || state.layout === 'hero-2') {
    targetW = 1920;
    targetH = 1080;
  }

  canvas.width = targetW;
  canvas.height = targetH;

  renderCover(canvas, state);
}

async function exportCover(w, h, label) {
  setStatus(`Rendering ${label} (${w}x{h}) cover...`);
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = w;
  exportCanvas.height = h;

  await renderCover(exportCanvas, state);

  exportCanvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gta6-cover-${label}-${w}x${h}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatus(`Successfully exported gta6-cover-${label}-${w}x${h}.png!`);
  }, 'image/png');
}

function setStatus(msg) {
  const bar = document.getElementById('statusBar');
  if (bar) bar.textContent = msg;
}

window.addEventListener('DOMContentLoaded', init);
