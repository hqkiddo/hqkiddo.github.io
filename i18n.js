/**
 * HQ Kiddo - Simple language/i18n support
 */
(function () {
  "use strict";

  const STORAGE_KEY = "hqkiddo-lang";

  const translations = {
    en: {
      langName: "English",
      langDefault: "English (default)",
      menu: "Menu",
      pickApp: "Pick an app to use.",
      bgColor: "Background Color",
      changeBg: "Change Background color",
      night: "Night",
      ocean: "Ocean",
      purple: "Purple",
      forest: "Forest",
      desert: "Desert",
      magnifyingQuest: "Magnifying Quest",
      magnifyingDesc: "Find hidden objects with your magnifier and earn gems.",
      penguinMiner: "Penguin Miner",
      penguinDesc: "Mine gold, sell it, upgrade your pickaxe, and find fish.",
      handwrittenNotes: "Handwritten Notes",
      notesDesc: "Snap photos of your notes and keep them all in one searchable place.",
      play: "Play",
      open: "Open",
      login: "Login",
      logout: "Log out",
      backMenu: "← Menu",
      addNote: "Add a note",
      snapNotes: "Snap your handwritten notes",
      snapNotesDesc: "Use your camera or pick a photo. The app will read your handwriting and save it.",
      camera: "Camera",
      choosePhoto: "Choose photo",
      searchNotes: "Search notes",
      searchPlaceholder: "Search by text or date…",
      yourNotes: "Your notes",
      noNotes: "No notes yet.",
      noNotesHint: "Take a photo of your handwritten notes to get started.",
      notes: "notes",
      note: "note",
      noMatch: "No notes match your search.",
    },
    es: {
      langName: "Español",
      langDefault: "Español",
      menu: "Menú",
      pickApp: "Elige una aplicación.",
      bgColor: "Color de fondo",
      changeBg: "Cambiar color de fondo",
      night: "Noche",
      ocean: "Océano",
      purple: "Morado",
      forest: "Bosque",
      desert: "Desierto",
      magnifyingQuest: "Búsqueda con lupa",
      magnifyingDesc: "Encuentra objetos ocultos con tu lupa y gana gemas.",
      penguinMiner: "Minería del pingüino",
      penguinDesc: "Extrae oro, véndelo, mejora tu pico y encuentra peces.",
      handwrittenNotes: "Notas manuscritas",
      notesDesc: "Toma fotos de tus notas y guárdalas en un solo lugar.",
      play: "Jugar",
      open: "Abrir",
      login: "Iniciar sesión",
      logout: "Cerrar sesión",
      backMenu: "← Menú",
      addNote: "Añadir nota",
      snapNotes: "Toma fotos de tus notas",
      snapNotesDesc: "Usa tu cámara o elige una foto. La app leerá tu escritura y la guardará.",
      camera: "Cámara",
      choosePhoto: "Elegir foto",
      searchNotes: "Buscar notas",
      searchPlaceholder: "Buscar por texto o fecha…",
      yourNotes: "Tus notas",
      noNotes: "Aún no hay notas.",
      noNotesHint: "Toma una foto de tus notas manuscritas para empezar.",
      notes: "notas",
      note: "nota",
      noMatch: "No hay notas que coincidan con tu búsqueda.",
    },
    fr: {
      langName: "Français",
      langDefault: "Français",
      menu: "Menu",
      pickApp: "Choisissez une application.",
      bgColor: "Couleur de fond",
      changeBg: "Changer la couleur de fond",
      night: "Nuit",
      ocean: "Océan",
      purple: "Violet",
      forest: "Forêt",
      desert: "Désert",
      magnifyingQuest: "Quête à la loupe",
      magnifyingDesc: "Trouvez des objets cachés avec votre loupe et gagnez des gemmes.",
      penguinMiner: "Mineur pingouin",
      penguinDesc: "Minez de l'or, vendez-le, améliorez votre pioche et trouvez des poissons.",
      handwrittenNotes: "Notes manuscrites",
      notesDesc: "Prenez des photos de vos notes et gardez-les toutes au même endroit.",
      play: "Jouer",
      open: "Ouvrir",
      login: "Connexion",
      logout: "Déconnexion",
      backMenu: "← Menu",
      addNote: "Ajouter une note",
      snapNotes: "Prenez vos notes en photo",
      snapNotesDesc: "Utilisez votre appareil photo ou choisissez une photo. L'app lira votre écriture et la sauvegardera.",
      camera: "Appareil photo",
      choosePhoto: "Choisir une photo",
      searchNotes: "Rechercher des notes",
      searchPlaceholder: "Rechercher par texte ou date…",
      yourNotes: "Vos notes",
      noNotes: "Pas encore de notes.",
      noNotesHint: "Prenez une photo de vos notes manuscrites pour commencer.",
      notes: "notes",
      note: "note",
      noMatch: "Aucune note ne correspond à votre recherche.",
    },
  };

  let currentLang = "en";

  function getStored() {
    try {
      return localStorage.getItem(STORAGE_KEY) || "en";
    } catch (e) {
      return "en";
    }
  }

  function setStored(lang) {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {}
  }

  window.HQi18n = {
    t(key) {
      const t = translations[currentLang] || translations.en;
      return t[key] ?? translations.en[key] ?? key;
    },

    getLang() {
      return currentLang;
    },

    setLang(lang) {
      if (!translations[lang]) return;
      currentLang = lang;
      setStored(lang);
      this.apply();
      if (this.onChange) this.onChange(lang);
    },

    getOptions() {
      return Object.entries(translations).map(([code, t]) => ({
        code,
        label: code === "en" ? t.langDefault : t.langName,
      }));
    },

    apply() {
      document.querySelectorAll("[data-i18n]").forEach((el) => {
        const key = el.getAttribute("data-i18n");
        const text = this.t(key);
        if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
          if (el.hasAttribute("placeholder") || el.placeholder !== undefined) {
            el.placeholder = text;
          } else {
            el.value = text;
          }
        } else {
          el.textContent = text;
        }
      });
      const label = document.getElementById("langSelectorLabel");
      if (label) label.textContent = this.t(currentLang === "en" ? "langDefault" : "langName");
      document.documentElement.lang = currentLang === "en" ? "en" : currentLang;
    },

    onChange: null,

    init() {
      currentLang = getStored();
      this.apply();
      this.bindSelector();
    },

    bindSelector() {
      const btn = document.getElementById("langSelectorBtn");
      const dropdown = document.getElementById("langDropdown");
      if (!btn || !dropdown) return;

      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdown.classList.toggle("open");
      });

      document.addEventListener("click", () => dropdown.classList.remove("open"));

      dropdown.querySelectorAll("[data-lang]").forEach((opt) => {
        opt.addEventListener("click", (e) => {
          e.stopPropagation();
          this.setLang(opt.dataset.lang);
          dropdown.classList.remove("open");
        });
      });
    },
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => HQi18n.init());
  } else {
    HQi18n.init();
  }
})();
