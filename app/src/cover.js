// GTA 6 Style Poster Cover Art Renderer
export async function renderCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Clear background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  // 1. Define Layout Panels based on layout type
  const layout = state.layout || 'hero-2';
  const panels = getLayoutPanels(layout, width, height);

  // 2. Draw each panel
  for (let i = 0; i < panels.length; i++) {
    const p = panels[i];
    const photoData = state.photos[i] || state.photos[0]; // fallback to first photo
    const transform = state.transforms[i] || { zoom: 1, panX: 0, panY: 0, fit: 'cover' };

    ctx.save();
    // Clip panel area for gutter separation
    ctx.beginPath();
    const gutter = Math.max(4, Math.round(width * 0.008));
    const bx = p.x + gutter / 2;
    const by = p.y + gutter / 2;
    const bw = p.w - gutter;
    const bh = p.h - gutter;
    ctx.rect(bx, by, bw, bh);
    ctx.clip();

    if (photoData && photoData.img) {
      drawImageInPanel(ctx, photoData.img, bx, by, bw, bh, transform);
    } else {
      // Placeholder color
      ctx.fillStyle = '#1a0826';
      ctx.fillRect(bx, by, bw, bh);
    }

    // Apply color grade tint per panel
    applyGradeTint(ctx, bx, by, bw, bh, state.grade || 'sunset');

    ctx.restore();
  }

  // 3. Global post-processing overlay (Vignette + Halftone Grain)
  applyPostProcessing(ctx, width, height, state.grade || 'sunset');

  // 4. Draw Caption & Tagline Lettering
  drawLettering(ctx, width, height, state);
}

function getLayoutPanels(layout, w, h) {
  if (layout === 'triptych') {
    // 3 vertical columns
    const pw = w / 3;
    return [
      { x: 0, y: 0, w: pw, h: h },
      { x: pw, y: 0, w: pw, h: h },
      { x: pw * 2, y: 0, w: pw, h: h }
    ];
  } else if (layout === 'quad') {
    // 2x2 grid
    const pw = w / 2;
    const ph = h / 2;
    return [
      { x: 0, y: 0, w: pw, h: ph },
      { x: pw, y: 0, w: pw, h: ph },
      { x: 0, y: ph, w: pw, h: ph },
      { x: pw, y: ph, w: pw, h: ph }
    ];
  } else if (layout === 'portrait-stack') {
    // Hero top (60%), 2 strips below (40% split in two)
    const topH = Math.round(h * 0.58);
    const botH = h - topH;
    const halfW = w / 2;
    return [
      { x: 0, y: 0, w: w, h: topH },
      { x: 0, y: topH, w: halfW, h: botH },
      { x: halfW, y: topH, w: halfW, h: botH }
    ];
  } else {
    // 'hero-2' (Default landscape style: large left panel + 2 stacked right panels)
    const leftW = Math.round(w * 0.58);
    const rightW = w - leftW;
    const halfH = h / 2;
    return [
      { x: 0, y: 0, w: leftW, h: h },
      { x: leftW, y: 0, w: rightW, h: halfH },
      { x: leftW, y: halfH, w: rightW, h: halfH }
    ];
  }
}

function drawImageInPanel(ctx, img, x, y, w, h, t) {
  const imgW = img.width;
  const imgH = img.height;
  const imgAspect = imgW / imgH;
  const panelAspect = w / h;

  let drawW, drawH;
  if (t.fit === 'contain') {
    if (imgAspect > panelAspect) {
      drawW = w;
      drawH = w / imgAspect;
    } else {
      drawH = h;
      drawW = h * imgAspect;
    }
  } else {
    // cover
    if (imgAspect > panelAspect) {
      drawH = h;
      drawW = h * imgAspect;
    } else {
      drawW = w;
      drawH = w / imgAspect;
    }
  }

  drawW *= (t.zoom || 1);
  drawH *= (t.zoom || 1);

  const dx = x + (w - drawW) / 2 + (t.panX || 0);
  const dy = y + (h - drawH) / 2 + (t.panY || 0);

  ctx.drawImage(img, dx, dy, drawW, drawH);
}

function applyGradeTint(ctx, x, y, w, h, grade) {
  ctx.save();
  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  if (grade === 'neon-night') {
    grad.addColorStop(0, 'rgba(0, 240, 255, 0.25)');
    grad.addColorStop(0.5, 'rgba(147, 51, 234, 0.2)');
    grad.addColorStop(1, 'rgba(217, 70, 239, 0.3)');
  } else if (grade === 'vice-gold') {
    grad.addColorStop(0, 'rgba(245, 158, 11, 0.25)');
    grad.addColorStop(0.5, 'rgba(13, 148, 136, 0.25)');
    grad.addColorStop(1, 'rgba(180, 83, 9, 0.3)');
  } else {
    // sunset
    grad.addColorStop(0, 'rgba(255, 94, 0, 0.25)');
    grad.addColorStop(0.5, 'rgba(217, 20, 141, 0.25)');
    grad.addColorStop(1, 'rgba(43, 15, 59, 0.35)');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

function applyPostProcessing(ctx, w, h, grade) {
  ctx.save();
  // Subtle Vignette
  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.4, w / 2, h / 2, Math.max(w, h) * 0.8);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.65)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  // Fine Grain / Halftone dots overlay
  ctx.fillStyle = grade === 'neon-night' ? 'rgba(0, 240, 255, 0.03)' : 'rgba(255, 183, 0, 0.03)';
  for (let i = 0; i < w; i += 6) {
    for (let j = 0; j < h; j += 6) {
      if ((i + j) % 12 === 0) {
        ctx.fillRect(i, j, 2, 2);
      }
    }
  }
  ctx.restore();
}

function drawLettering(ctx, w, h, state) {
  ctx.save();
  const caption = (state.caption || 'VICE SUNSET').toUpperCase();
  const tagline = (state.tagline || '').toUpperCase();
  const pos = state.captionPos || 'bottom';

  const isLandscape = w >= h;
  const baseFontSize = Math.round(w * (isLandscape ? 0.085 : 0.095));
  
  ctx.font = `normal ${baseFontSize}px "Anton", sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  let x = Math.round(w * 0.06);
  let y = pos === 'top' ? Math.round(h * 0.12) : Math.round(h * (tagline ? 0.86 : 0.90));

  // Color grade palette for text
  let textColor = '#fffbeb';
  let glowColor = '#ffb700';
  if (state.grade === 'neon-night') {
    textColor = '#e0f2fe';
    glowColor = '#00f0ff';
  } else if (state.grade === 'vice-gold') {
    textColor = '#fef3c7';
    glowColor = '#f59e0b';
  }

  // Draw Main Caption with thick outline and drop shadow
  ctx.lineWidth = Math.max(6, Math.round(baseFontSize * 0.12));
  ctx.strokeStyle = '#000000';
  ctx.fillStyle = textColor;

  // Drop shadow
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 18;
  ctx.shadowOffsetX = 4;
  ctx.shadowOffsetY = 4;

  ctx.strokeText(caption, x, y);
  ctx.fillText(caption, x, y);

  // Draw Tagline if present
  if (tagline) {
    const subFontSize = Math.round(baseFontSize * 0.38);
    ctx.font = `bold ${subFontSize}px system-ui, sans-serif`;
    ctx.lineWidth = 3;
    const subY = pos === 'top' ? y + subFontSize + 12 : y + subFontSize + 16;
    
    ctx.shadowBlur = 8;
    ctx.strokeText(tagline, x, subY);
    ctx.fillStyle = '#ffb700';
    ctx.fillText(tagline, x, subY);
  }

  ctx.restore();
}
