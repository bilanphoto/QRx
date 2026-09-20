/**
 * QR Studio - Main Application Logic
 * Full-featured, offline-ready QR Code Generator with live preview, customization, and export.
 */

(function() {
  'use strict';

  // State
  const state = {
    type: 'url',
    fgColor: '#0f172a',
    bgColor: '#ffffff',
    isTransparent: false,
    size: 1024,
    margin: 2,
    ecLevel: 'H',
    logoType: 'none', // 'none' | 'link' | 'wifi' | 'promptpay' | 'star' | 'heart' | 'custom'
    customLogoImg: null,
    currentPayload: '',
    currentSummary: 'URL: https://google.com'
  };

  // DOM Elements
  const tabs = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.form-panel');
  const qrCanvas = document.getElementById('qrCanvas');
  const qrMetaSize = document.getElementById('qrMetaSize');
  const qrMetaLevel = document.getElementById('qrMetaLevel');
  const fgColorInput = document.getElementById('fgColorInput');
  const fgColorText = document.getElementById('fgColorText');
  const bgColorInput = document.getElementById('bgColorInput');
  const bgColorText = document.getElementById('bgColorText');
  const transparentBg = document.getElementById('transparentBg');
  const sizeSlider = document.getElementById('sizeSlider');
  const sizeValText = document.getElementById('sizeValText');
  const marginSlider = document.getElementById('marginSlider');
  const marginValText = document.getElementById('marginValText');
  const ecLevelSelect = document.getElementById('ecLevelSelect');
  const logoOptionBtns = document.querySelectorAll('.logo-option-btn');
  const customLogoInput = document.getElementById('customLogoInput');
  const customLogoThumb = document.getElementById('customLogoThumb');
  const customLogoName = document.getElementById('customLogoName');
  const btnRemoveLogo = document.getElementById('btnRemoveLogo');
  const paletteChips = document.querySelectorAll('.palette-chip');
  const btnDownloadPng = document.getElementById('btnDownloadPng');
  const btnDownloadJpg = document.getElementById('btnDownloadJpg');
  const btnDownloadSvg = document.getElementById('btnDownloadSvg');
  const btnCopyClipboard = document.getElementById('btnCopyClipboard');
  const btnPrintQr = document.getElementById('btnPrintQr');
  const historyGrid = document.getElementById('historyGrid');
  const btnClearHistory = document.getElementById('btnClearHistory');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeIconSun = document.getElementById('themeIconSun');
  const themeIconMoon = document.getElementById('themeIconMoon');
  const toastContainer = document.getElementById('toastContainer');

  // Built-in Logo Vector Paths
  const LOGO_VECTORS = {
    link: `<path fill="#4f46e5" d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>`,
    wifi: `<path fill="#0284c7" d="M12 4C7.31 4 3.07 5.9 0 8.98L12 21 24 8.98A16.88 16.88 0 0 0 12 4zm0 4.5c3.37 0 6.45 1.37 8.68 3.59L12 20.73 3.32 12.09C5.55 9.87 8.63 8.5 12 8.5z"/>`,
    promptpay: `<path fill="#003D6B" d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zm1 4v6h14v-6H5zm3 1h8v1H8v-1zm0 2h5v1H8v-1z"/>`,
    star: `<polygon fill="#f59e0b" points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>`,
    heart: `<path fill="#ef4444" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>`
  };

  // Toast Notification Helper
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const iconSvg = type === 'success' 
      ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>'
      : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
    
    toast.innerHTML = `${iconSvg}<span>${message}</span>`;
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  // Theme Management
  function initTheme() {
    const savedTheme = localStorage.getItem('qr_theme') || 'light';
    setTheme(savedTheme);

    themeToggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const nextTheme = current === 'dark' ? 'light' : 'dark';
      setTheme(nextTheme);
    });
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('qr_theme', theme);
    if (theme === 'dark') {
      themeIconSun.style.display = 'block';
      themeIconMoon.style.display = 'none';
    } else {
      themeIconSun.style.display = 'none';
      themeIconMoon.style.display = 'block';
    }
  }

  // Escape helper for WiFi strings
  function escapeWifi(str) {
    return (str || '').replace(/([\\;,:"])/g, '\\$1');
  }

  // Build Payload Based on Active Tab
  function buildPayload() {
    let payload = '';
    let summary = '';

    switch (state.type) {
      case 'url': {
        const val = document.getElementById('urlInput').value.trim();
        payload = val;
        summary = `URL: ${val || 'ไม่ได้ระบุ'}`;
        break;
      }
      case 'wifi': {
        const ssid = document.getElementById('wifiSsid').value.trim();
        const pwd = document.getElementById('wifiPassword').value;
        const auth = document.getElementById('wifiSecurity').value;
        const hidden = document.getElementById('wifiHidden').checked;

        if (ssid) {
          payload = `WIFI:T:${auth};S:${escapeWifi(ssid)};P:${escapeWifi(pwd)};H:${hidden ? 'true' : 'false'};;`;
          summary = `WiFi: ${ssid}`;
        }
        break;
      }
      case 'promptpay': {
        const target = document.getElementById('ppTarget').value.trim();
        const amount = document.getElementById('ppAmount').value.trim();
        if (target && window.PromptPay) {
          payload = window.PromptPay.generatePayload(target, amount);
          summary = `PromptPay: ${target}${amount ? ' (' + parseFloat(amount).toFixed(2) + ' บ.)' : ''}`;
        }
        break;
      }
      case 'text': {
        const text = document.getElementById('textInput').value;
        payload = text;
        summary = `Text: ${text.slice(0, 30)}${text.length > 30 ? '...' : ''}`;
        break;
      }
      case 'vcard': {
        const fn = document.getElementById('vcFirstName').value.trim();
        const ln = document.getElementById('vcLastName').value.trim();
        const phone = document.getElementById('vcPhone').value.trim();
        const email = document.getElementById('vcEmail').value.trim();
        const org = document.getElementById('vcOrg').value.trim();
        const title = document.getElementById('vcTitle').value.trim();
        const url = document.getElementById('vcUrl').value.trim();

        if (fn || ln || phone || email) {
          const lines = [
            'BEGIN:VCARD',
            'VERSION:3.0',
            `N:${ln};${fn};;;`,
            `FN:${fn} ${ln}`.trim()
          ];
          if (org) lines.push(`ORG:${org}`);
          if (title) lines.push(`TITLE:${title}`);
          if (phone) lines.push(`TEL;TYPE=CELL:${phone}`);
          if (email) lines.push(`EMAIL:${email}`);
          if (url) lines.push(`URL:${url}`);
          lines.push('END:VCARD');
          payload = lines.join('\n');
          summary = `Contact: ${fn} ${ln}`.trim() || phone;
        }
        break;
      }
      case 'email': {
        const target = document.getElementById('emailTarget').value.trim();
        const subject = document.getElementById('emailSubject').value.trim();
        const body = document.getElementById('emailBody').value;
        if (target) {
          const params = [];
          if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
          if (body) params.push(`body=${encodeURIComponent(body)}`);
          payload = `mailto:${target}${params.length ? '?' + params.join('&') : ''}`;
          summary = `Email: ${target}`;
        }
        break;
      }
      case 'phone': {
        const phone = document.getElementById('phoneInput').value.trim();
        if (phone) {
          payload = `tel:${phone}`;
          summary = `Tel: ${phone}`;
        }
        break;
      }
      case 'sms': {
        const phone = document.getElementById('smsPhone').value.trim();
        const msg = document.getElementById('smsMessage').value;
        if (phone) {
          payload = `smsto:${phone}:${msg}`;
          summary = `SMS: ${phone}`;
        }
        break;
      }
    }

    state.currentPayload = payload;
    state.currentSummary = summary || 'QR Code';
    return payload;
  }

  // Draw Logo on Canvas
  function drawLogo(ctx, size) {
    if (state.logoType === 'none') return Promise.resolve();

    return new Promise((resolve) => {
      const badgeSize = Math.round(size * 0.24);
      const iconSize = Math.round(size * 0.16);
      const cx = size / 2;
      const cy = size / 2;
      const x = cx - badgeSize / 2;
      const y = cy - badgeSize / 2;
      const radius = Math.round(badgeSize * 0.22);

      // Draw background cutout badge
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + badgeSize - radius, y);
      ctx.quadraticCurveTo(x + badgeSize, y, x + badgeSize, y + radius);
      ctx.lineTo(x + badgeSize, y + badgeSize - radius);
      ctx.quadraticCurveTo(x + badgeSize, y + badgeSize, x + badgeSize - radius, y + badgeSize);
      ctx.lineTo(x + radius, y + badgeSize);
      ctx.quadraticCurveTo(x, y + badgeSize, x, y + badgeSize - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();

      // Shadow & fill
      ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
      ctx.shadowBlur = Math.round(size * 0.015);
      ctx.shadowOffsetY = Math.round(size * 0.005);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.06)';
      ctx.lineWidth = Math.max(1, Math.round(size * 0.003));
      ctx.stroke();
      ctx.restore();

      if (state.logoType === 'custom' && state.customLogoImg) {
        // Draw custom uploaded image
        const img = state.customLogoImg;
        const ix = cx - iconSize / 2;
        const iy = cy - iconSize / 2;
        
        ctx.save();
        // Rounded clip for custom logo
        const clipRadius = Math.round(iconSize * 0.15);
        ctx.beginPath();
        ctx.moveTo(ix + clipRadius, iy);
        ctx.lineTo(ix + iconSize - clipRadius, iy);
        ctx.quadraticCurveTo(ix + iconSize, iy, ix + iconSize, iy + clipRadius);
        ctx.lineTo(ix + iconSize, iy + iconSize - clipRadius);
        ctx.quadraticCurveTo(ix + iconSize, iy + iconSize, ix + iconSize - clipRadius, iy + iconSize);
        ctx.lineTo(ix + clipRadius, iy + iconSize);
        ctx.quadraticCurveTo(ix, iy + iconSize, ix, iy + iconSize - clipRadius);
        ctx.lineTo(ix, iy + clipRadius);
        ctx.quadraticCurveTo(ix, iy, ix + clipRadius, iy);
        ctx.closePath();
        ctx.clip();
        
        ctx.drawImage(img, ix, iy, iconSize, iconSize);
        ctx.restore();
        resolve();
      } else if (LOGO_VECTORS[state.logoType]) {
        // Render preset SVG icon
        const svgString = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${iconSize}" height="${iconSize}">
            ${LOGO_VECTORS[state.logoType]}
          </svg>
        `;
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const iconImg = new Image();
        iconImg.onload = () => {
          ctx.drawImage(iconImg, cx - iconSize / 2, cy - iconSize / 2, iconSize, iconSize);
          URL.revokeObjectURL(url);
          resolve();
        };
        iconImg.onerror = () => {
          URL.revokeObjectURL(url);
          resolve();
        };
        iconImg.src = url;
      } else {
        resolve();
      }
    });
  }

  // Render QR Code to Canvas
  let renderDebounceTimer = null;
  function triggerRender(immediate = false) {
    if (immediate) {
      generateQRCode();
    } else {
      clearTimeout(renderDebounceTimer);
      renderDebounceTimer = setTimeout(generateQRCode, 100);
    }
  }

  async function generateQRCode() {
    const payload = buildPayload();
    const ctx = qrCanvas.getContext('2d');
    const size = parseInt(state.size, 10);
    const margin = parseInt(state.margin, 10);

    qrCanvas.width = size;
    qrCanvas.height = size;

    // Update Meta texts
    qrMetaSize.textContent = `${size} × ${size} px`;
    qrMetaLevel.textContent = `Level ${state.ecLevel} (${state.ecLevel === 'H' ? '30%' : state.ecLevel === 'Q' ? '25%' : state.ecLevel === 'M' ? '15%' : '7%'})`;

    if (!payload) {
      // Clear canvas and draw placeholder message
      ctx.clearRect(0, 0, size, size);
      if (!state.isTransparent) {
        ctx.fillStyle = state.bgColor;
        ctx.fillRect(0, 0, size, size);
      }
      ctx.fillStyle = state.fgColor;
      ctx.font = `${Math.round(size * 0.045)}px 'Prompt', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('กรุณากรอกข้อมูลเพื่อสร้าง QR Code', size / 2, size / 2);
      return;
    }

    try {
      // Map EC Level string to number
      const ecLevels = {
        'L': window.QRCodeGenerator.CorrectLevel.L,
        'M': window.QRCodeGenerator.CorrectLevel.M,
        'Q': window.QRCodeGenerator.CorrectLevel.Q,
        'H': window.QRCodeGenerator.CorrectLevel.H
      };
      
      // If logo is enabled, enforce level H for reliable scanning
      let effectiveEcLevel = state.ecLevel;
      if (state.logoType !== 'none') {
        effectiveEcLevel = 'H';
      }

      const qr = window.QRCodeGenerator.create(payload, ecLevels[effectiveEcLevel], 0);
      const moduleCount = qr.getModuleCount();
      const totalModules = moduleCount + (margin * 2);
      const moduleSize = size / totalModules;

      // Clear & Background
      ctx.clearRect(0, 0, size, size);
      if (!state.isTransparent) {
        ctx.fillStyle = state.bgColor;
        ctx.fillRect(0, 0, size, size);
      }

      // Draw modules
      ctx.fillStyle = state.fgColor;
      for (let r = 0; r < moduleCount; r++) {
        for (let c = 0; c < moduleCount; c++) {
          if (qr.isDark(r, c)) {
            const x = Math.round((c + margin) * moduleSize);
            const y = Math.round((r + margin) * moduleSize);
            const w = Math.round((c + margin + 1) * moduleSize) - x;
            const h = Math.round((r + margin + 1) * moduleSize) - y;
            ctx.fillRect(x, y, w, h);
          }
        }
      }

      // Overlay Logo
      await drawLogo(ctx, size);

    } catch (err) {
      console.error('Error generating QR:', err);
      showToast('ข้อมูลยาวเกินไปสำหรับขนาด QR Code นี้ กรุณาลดขนาดข้อความหรือปรับระดับ Error Correction', 'error');
    }
  }

  // Generate SVG Code String
  function generateSvgString() {
    const payload = state.currentPayload;
    if (!payload) return null;

    const size = parseInt(state.size, 10);
    const margin = parseInt(state.margin, 10);
    const ecLevels = {
      'L': window.QRCodeGenerator.CorrectLevel.L,
      'M': window.QRCodeGenerator.CorrectLevel.M,
      'Q': window.QRCodeGenerator.CorrectLevel.Q,
      'H': window.QRCodeGenerator.CorrectLevel.H
    };

    let effectiveEcLevel = state.ecLevel;
    if (state.logoType !== 'none') effectiveEcLevel = 'H';

    const qr = window.QRCodeGenerator.create(payload, ecLevels[effectiveEcLevel], 0);
    const moduleCount = qr.getModuleCount();
    const totalModules = moduleCount + (margin * 2);
    const moduleSize = size / totalModules;

    let pathD = '';
    for (let r = 0; r < moduleCount; r++) {
      for (let c = 0; c < moduleCount; c++) {
        if (qr.isDark(r, c)) {
          const x = (c + margin) * moduleSize;
          const y = (r + margin) * moduleSize;
          pathD += `M${x.toFixed(2)},${y.toFixed(2)}h${moduleSize.toFixed(2)}v${moduleSize.toFixed(2)}h-${moduleSize.toFixed(2)}z `;
        }
      }
    }

    let bgElement = '';
    if (!state.isTransparent) {
      bgElement = `<rect width="${size}" height="${size}" fill="${state.bgColor}" />`;
    }

    let logoSvgElement = '';
    if (state.logoType !== 'none') {
      const badgeSize = (size * 0.24).toFixed(2);
      const iconSize = (size * 0.16).toFixed(2);
      const bx = ((size - badgeSize) / 2).toFixed(2);
      const by = ((size - badgeSize) / 2).toFixed(2);
      const ix = ((size - iconSize) / 2).toFixed(2);
      const iy = ((size - iconSize) / 2).toFixed(2);
      const br = (badgeSize * 0.2).toFixed(2);

      let iconContent = '';
      if (state.logoType === 'custom' && state.customLogoDataUrl) {
        iconContent = `<image href="${state.customLogoDataUrl}" x="${ix}" y="${iy}" width="${iconSize}" height="${iconSize}" preserveAspectRatio="xMidYMid slice" />`;
      } else if (LOGO_VECTORS[state.logoType]) {
        iconContent = `<g transform="translate(${ix}, ${iy}) scale(${(iconSize / 24).toFixed(3)})">${LOGO_VECTORS[state.logoType]}</g>`;
      }

      logoSvgElement = `
        <g id="qr-logo">
          <rect x="${bx}" y="${by}" width="${badgeSize}" height="${badgeSize}" rx="${br}" fill="#ffffff" stroke="rgba(0,0,0,0.08)" stroke-width="2"/>
          ${iconContent}
        </g>
      `;
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  ${bgElement}
  <path d="${pathD}" fill="${state.fgColor}" />
  ${logoSvgElement}
</svg>`;
  }

  // File Download Helper
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // History Management
  function saveToHistory() {
    if (!state.currentPayload) return;
    try {
      const history = JSON.parse(localStorage.getItem('qr_studio_history') || '[]');
      const previewDataUrl = qrCanvas.toDataURL('image/png', 0.5);

      const newItem = {
        id: Date.now(),
        type: state.type,
        title: state.currentSummary,
        payload: state.currentPayload,
        dataUrl: previewDataUrl,
        date: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })
      };

      // Add to front, limit to 6 items
      history.unshift(newItem);
      if (history.length > 6) history.pop();

      localStorage.setItem('qr_studio_history', JSON.stringify(history));
      renderHistory();
    } catch (e) {
      console.warn('Could not save to history:', e);
    }
  }

  function renderHistory() {
    const history = JSON.parse(localStorage.getItem('qr_studio_history') || '[]');
    historyGrid.innerHTML = '';

    if (history.length === 0) {
      historyGrid.innerHTML = `<div class="empty-history-text">ยังไม่มีประวัติการสร้าง QR Code เมื่อคุณดาวน์โหลด ข้อมูลจะปรากฏที่นี่</div>`;
      return;
    }

    history.forEach(item => {
      const card = document.createElement('div');
      card.className = 'history-card';
      card.innerHTML = `
        <img class="history-thumb" src="${item.dataUrl}" alt="${item.title}">
        <div class="history-label" title="${item.title}">${item.title}</div>
        <div class="history-date">${item.date}</div>
      `;
      card.addEventListener('click', () => {
        // Quick download again
        const a = document.createElement('a');
        a.href = item.dataUrl;
        a.download = `qrcode_${item.type}_${item.id}.png`;
        a.click();
        showToast(`ดาวน์โหลด ${item.title} แล้ว!`);
      });
      historyGrid.appendChild(card);
    });
  }

  // Event Listeners Setup
  function setupEventListeners() {
    // Tab switching
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        panels.forEach(p => p.classList.remove('active'));

        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');

        const targetType = tab.getAttribute('data-type');
        state.type = targetType;
        const activePanel = document.getElementById(`panel-${targetType}`);
        if (activePanel) activePanel.classList.add('active');

        triggerRender();
      });
    });

    // Form inputs (debounced live render)
    const inputs = document.querySelectorAll('.form-input, .form-textarea, .form-select, input[type="checkbox"]');
    inputs.forEach(input => {
      input.addEventListener('input', () => triggerRender(false));
      input.addEventListener('change', () => triggerRender(false));
    });

    // Color Pickers
    fgColorInput.addEventListener('input', (e) => {
      state.fgColor = e.target.value;
      fgColorText.textContent = e.target.value.toUpperCase();
      triggerRender();
    });

    bgColorInput.addEventListener('input', (e) => {
      state.bgColor = e.target.value;
      bgColorText.textContent = e.target.value.toUpperCase();
      if (state.isTransparent) {
        transparentBg.checked = false;
        state.isTransparent = false;
      }
      triggerRender();
    });

    transparentBg.addEventListener('change', (e) => {
      state.isTransparent = e.target.checked;
      triggerRender();
    });

    // Color Presets
    paletteChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const fg = chip.getAttribute('data-fg');
        const bg = chip.getAttribute('data-bg');
        state.fgColor = fg;
        state.bgColor = bg;
        state.isTransparent = false;
        transparentBg.checked = false;

        fgColorInput.value = fg;
        fgColorText.textContent = fg.toUpperCase();
        bgColorInput.value = bg;
        bgColorText.textContent = bg.toUpperCase();

        triggerRender();
      });
    });

    // Size Slider
    sizeSlider.addEventListener('input', (e) => {
      state.size = e.target.value;
      sizeValText.textContent = `${e.target.value} × ${e.target.value} px`;
      triggerRender();
    });

    // Margin Slider
    marginSlider.addEventListener('input', (e) => {
      state.margin = e.target.value;
      marginValText.textContent = e.target.value;
      triggerRender();
    });

    // EC Level Select
    ecLevelSelect.addEventListener('change', (e) => {
      state.ecLevel = e.target.value;
      triggerRender();
    });

    // Logo Option Buttons
    logoOptionBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        logoOptionBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const logo = btn.getAttribute('data-logo');
        state.logoType = logo;

        // When logo is chosen, auto switch EC level to H
        if (logo !== 'none') {
          state.ecLevel = 'H';
          ecLevelSelect.value = 'H';
        }
        triggerRender();
      });
    });

    // Custom Logo File Upload
    customLogoInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target.result;
        state.customLogoDataUrl = dataUrl;

        const img = new Image();
        img.onload = () => {
          state.customLogoImg = img;
          state.logoType = 'custom';
          state.ecLevel = 'H';
          ecLevelSelect.value = 'H';

          logoOptionBtns.forEach(b => b.classList.remove('active'));

          customLogoThumb.src = dataUrl;
          customLogoThumb.style.display = 'block';
          customLogoName.textContent = file.name;
          btnRemoveLogo.style.display = 'inline-block';

          triggerRender(true);
          showToast('อัปโหลดโลโก้สำเร็จ');
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    });

    // Remove Custom Logo
    btnRemoveLogo.addEventListener('click', () => {
      state.customLogoImg = null;
      state.customLogoDataUrl = null;
      state.logoType = 'none';
      customLogoInput.value = '';
      customLogoThumb.style.display = 'none';
      customLogoName.textContent = 'หรืออัปโหลดรูปโลโก้ของคุณเอง';
      btnRemoveLogo.style.display = 'none';

      logoOptionBtns.forEach(b => {
        if (b.getAttribute('data-logo') === 'none') b.classList.add('active');
        else b.classList.remove('active');
      });

      triggerRender(true);
    });

    // Download PNG Action
    btnDownloadPng.addEventListener('click', () => {
      if (!state.currentPayload) {
        showToast('กรุณากรอกข้อมูลก่อนดาวน์โหลด', 'error');
        return;
      }
      qrCanvas.toBlob((blob) => {
        if (blob) {
          const filename = `qrcode_${state.type}_${Date.now()}.png`;
          downloadBlob(blob, filename);
          saveToHistory();
          showToast('ดาวน์โหลดรูปภาพ PNG สำเร็จ!');
        }
      }, 'image/png');
    });

    // Download JPG Action
    btnDownloadJpg.addEventListener('click', () => {
      if (!state.currentPayload) {
        showToast('กรุณากรอกข้อมูลก่อนดาวน์โหลด', 'error');
        return;
      }
      // JPG requires a solid background
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = qrCanvas.width;
      tempCanvas.height = qrCanvas.height;
      const tCtx = tempCanvas.getContext('2d');
      tCtx.fillStyle = state.isTransparent ? '#ffffff' : state.bgColor;
      tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      tCtx.drawImage(qrCanvas, 0, 0);

      tempCanvas.toBlob((blob) => {
        if (blob) {
          const filename = `qrcode_${state.type}_${Date.now()}.jpg`;
          downloadBlob(blob, filename);
          saveToHistory();
          showToast('ดาวน์โหลดรูปภาพ JPEG สำเร็จ!');
        }
      }, 'image/jpeg', 0.95);
    });

    // Download SVG Action
    btnDownloadSvg.addEventListener('click', () => {
      if (!state.currentPayload) {
        showToast('กรุณากรอกข้อมูลก่อนดาวน์โหลด', 'error');
        return;
      }
      const svgString = generateSvgString();
      if (svgString) {
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const filename = `qrcode_${state.type}_${Date.now()}.svg`;
        downloadBlob(blob, filename);
        saveToHistory();
        showToast('ดาวน์โหลดไฟล์เวกเตอร์ SVG สำเร็จ!');
      }
    });

    // Copy to Clipboard Action
    btnCopyClipboard.addEventListener('click', () => {
      if (!state.currentPayload) {
        showToast('กรุณากรอกข้อมูลก่อนคัดลอก', 'error');
        return;
      }
      qrCanvas.toBlob(async (blob) => {
        try {
          if (navigator.clipboard && window.ClipboardItem) {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            showToast('คัดลอกรูปภาพ QR Code ลงคลิปบอร์ดแล้ว! วางใช้งานได้ทันที');
          } else {
            showToast('เบราว์เซอร์ไม่รองรับการคัดลอกรูปภาพ กรุณาใช้ปุ่มดาวน์โหลดแทน', 'error');
          }
        } catch (err) {
          console.error('Clipboard copy failed:', err);
          showToast('ไม่สามารถคัดลอกรูปภาพได้ กรุณาใช้ปุ่มดาวน์โหลด', 'error');
        }
      }, 'image/png');
    });

    // Print Action
    btnPrintQr.addEventListener('click', () => {
      if (!state.currentPayload) {
        showToast('กรุณากรอกข้อมูลก่อนพิมพ์', 'error');
        return;
      }
      const dataUrl = qrCanvas.toDataURL('image/png');
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Print QR Code - ${state.currentSummary}</title>
              <style>
                body {
                  font-family: 'Prompt', sans-serif;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  min-height: 90vh;
                  margin: 0;
                  padding: 20px;
                }
                img {
                  max-width: 400px;
                  max-height: 400px;
                  border: 1px solid #ddd;
                  border-radius: 8px;
                  padding: 10px;
                }
                h2 { margin-bottom: 6px; font-size: 1.2rem; }
                p { color: #666; font-size: 0.9rem; margin-top: 4px; }
              </style>
            </head>
            <body>
              <h2>QR Code</h2>
              <img src="${dataUrl}" alt="QR Code">
              <p>${state.currentSummary}</p>
              <script>
                window.onload = function() {
                  window.print();
                  window.close();
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    });

    // Clear History
    btnClearHistory.addEventListener('click', () => {
      localStorage.removeItem('qr_studio_history');
      renderHistory();
      showToast('ล้างประวัติเรียบร้อยแล้ว');
    });
  }

  // App Initialization
  function init() {
    initTheme();
    setupEventListeners();
    renderHistory();
    triggerRender(true);
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
