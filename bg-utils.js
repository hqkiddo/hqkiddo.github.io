/**
 * HQ Kiddo - Background color and text contrast
 * Applies saved background and ensures text is readable (black on light, white on dark).
 */
(function () {
  "use strict";

  const STORAGE_KEY = "hqkiddo-menu-bg";

  function getTextColor(color) {
    const hex = (color || "").replace("#", "");
    if (hex.length !== 6) return "#f5f6fb";
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luminance > 0.55 ? "#0f1118" : "#f5f6fb";
  }

  function applyBackground(color) {
    if (!color) return;
    const hex = color.replace("#", "");
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const textColor = luminance > 0.55 ? "#0f1118" : "#f5f6fb";
    const isLight = luminance > 0.55;

    document.documentElement.style.backgroundColor = color;
    document.body.style.backgroundColor = color;
    document.documentElement.style.color = textColor;
    document.body.style.color = textColor;
    document.documentElement.classList.add("bg-custom");

    let styleEl = document.getElementById("bg-text-style");
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "bg-text-style";
      document.head.appendChild(styleEl);
    }
    const accent = isLight ? "#b85a3d" : "#fe7a57";
    styleEl.textContent = `
      html.bg-custom, html.bg-custom body, html.bg-custom .app,
      html.bg-custom .label, html.bg-custom .eyebrow, html.bg-custom .subtitle,
      html.bg-custom .footer, html.bg-custom h1, html.bg-custom h2, html.bg-custom h3,
      html.bg-custom h4, html.bg-custom p, html.bg-custom span, html.bg-custom li,
      html.bg-custom .menu-card, html.bg-custom .menu-card p, html.bg-custom .menu-card h2,
      html.bg-custom .menu-action, html.bg-custom .card, html.bg-custom .card p,
      html.bg-custom .card h2, html.bg-custom .card ul, html.bg-custom .card-subtext,
      html.bg-custom .note-card, html.bg-custom .note-text, html.bg-custom .note-date,
      html.bg-custom .empty-state, html.bg-custom .note-count, html.bg-custom .confirm-email,
      html.bg-custom .lang-selector-btn, html.bg-custom .lang-dropdown-option,
      html.bg-custom .object-reference-item span, html.bg-custom .stats span,
      html.bg-custom .stats div span, html.bg-custom .stat-value, html.bg-custom .step-desc,
      html.bg-custom .step-panel h2, html.bg-custom .modal-subtext, html.bg-custom .modal-header h2,
      html.bg-custom .auth-label, html.bg-custom .shop-section-title, html.bg-custom .shop-item h4,
      html.bg-custom .shop-item p, html.bg-custom .status, html.bg-custom .capture-subtext,
      html.bg-custom .processing-text, html.bg-custom button, html.bg-custom .ghost,
      html.bg-custom .primary, html.bg-custom .choice-btn, html.bg-custom .upgrade-card span { color: ${textColor} !important; }
      html.bg-custom .nav-link, html.bg-custom .back-link { color: ${accent} !important; }
    `;
  }

  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) applyBackground(saved);

  window.HQBg = { getTextColor, applyBackground, STORAGE_KEY };
})();
