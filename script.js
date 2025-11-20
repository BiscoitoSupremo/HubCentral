document.addEventListener("DOMContentLoaded", () => {
  // ================================
  // 1. Ano automático no footer
  // ================================
  const yearSpan = document.getElementById("year");
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  // ================================
  // 2. Menu mobile (hambúrguer)
  // ================================
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      navLinks.classList.toggle("open");
    });

    // Fecha o menu ao clicar em um link
    navLinks.addEventListener("click", (event) => {
      const target = event.target;
      if (target.tagName === "A") {
        navLinks.classList.remove("open");
      }
    });
  }

  // ================================
  // 3. Scroll suave para links internos
  // ================================
  function smoothScrollTo(selector) {
    const target = document.querySelector(selector);
    if (!target) return;

    if ("scrollIntoView" in target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    } else {
      // fallback tosco, mas funciona
      const top = target.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo(0, top);
    }
  }

  const internalLinks = document.querySelectorAll('a[href^="#"]');
  internalLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      if (!href || href === "#") return;

      event.preventDefault();
      smoothScrollTo(href);
    });
  });

  // ================================
  // 4. Reveal on scroll (IntersectionObserver)
  // ================================
  const revealElements = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            obs.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.16
      }
    );

    revealElements.forEach((el) => observer.observe(el));
  } else {
    // Sem suporte? Mostra tudo de uma vez
    revealElements.forEach((el) => el.classList.add("in-view"));
  }

  // ================================
  // 5. Toggle densidade (.compact)
  // ================================
  const densityButton = document.getElementById("toggle-density");

  if (densityButton) {
    const defaultLabel = densityButton.textContent.trim();

    densityButton.addEventListener("click", () => {
      document.body.classList.toggle("compact");
      const compactOn = document.body.classList.contains("compact");

      densityButton.textContent = compactOn
        ? "modo compacto ativo"
        : defaultLabel;
    });
  }

  // ================================
  // 6. Command Palette (Ctrl+K / ⌘+K)
  // ================================
  const palette = document.getElementById("commandPalette");
  const commandInput = document.getElementById("commandInput");
  const commandResults = document.getElementById("commandResults");
  const closePaletteBtn = document.getElementById("closePalette");
  const chipButton = document.querySelector(".chip"); // "configurar atalhos"

  let allResultItems = [];
  let filteredItems = [];
  let activeIndex = -1;
  let lastFocusedElement = null;

  if (palette && commandInput && commandResults) {
    allResultItems = Array.from(commandResults.querySelectorAll("li"));

    function isPaletteOpen() {
      return palette.classList.contains("active");
    }

    function openPalette() {
      if (isPaletteOpen()) return;

      palette.classList.add("active");
      palette.setAttribute("aria-hidden", "false");
      lastFocusedElement = document.activeElement;

      // Limpa input e atualiza lista
      commandInput.value = "";
      filterResults("");
      setActiveIndex(filteredItems.length ? 0 : -1);

      commandInput.focus();
      document.body.style.overflow = "hidden"; // trava o scroll de fundo
    }

    function closePalette() {
      if (!isPaletteOpen()) return;

      palette.classList.remove("active");
      palette.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";

      if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
        lastFocusedElement.focus();
      }
    }

    function filterResults(term) {
      const value = term.trim().toLowerCase();
      filteredItems = [];

      allResultItems.forEach((item) => {
        const text = item.textContent.toLowerCase();
        const match = !value || text.includes(value);
        item.style.display = match ? "" : "none";
        item.classList.remove("active");
        if (match) filteredItems.push(item);
      });
    }

    function setActiveIndex(index) {
      filteredItems.forEach((item) => item.classList.remove("active"));
      activeIndex = index;

      if (activeIndex >= 0 && filteredItems[activeIndex]) {
        const current = filteredItems[activeIndex];
        current.classList.add("active");
        current.scrollIntoView({ block: "nearest" });
      }
    }

    function navigateToItem(item) {
      if (!item) return;
      const targetSelector = item.getAttribute("data-target");
      if (!targetSelector) return;

      const target = document.querySelector(targetSelector);
      if (target) {
        closePalette();
        smoothScrollTo(targetSelector);
      }
    }

    // Atalhos globais: Ctrl+K / Cmd+K / ESC
    document.addEventListener("keydown", (event) => {
      const key = event.key.toLowerCase();

      // Ctrl+K ou Cmd+K -> abre/fecha palette
      if ((event.ctrlKey || event.metaKey) && key === "k") {
        event.preventDefault();
        if (isPaletteOpen()) {
          closePalette();
        } else {
          openPalette();
        }
        return;
      }

      // ESC fecha se estiver aberta
      if (key === "escape" && isPaletteOpen()) {
        event.preventDefault();
        closePalette();
        return;
      }
    });

    // Input: filtra e navega ↑ ↓ Enter
    commandInput.addEventListener("input", () => {
      filterResults(commandInput.value);
      setActiveIndex(filteredItems.length ? 0 : -1);
    });

    commandInput.addEventListener("keydown", (event) => {
      if (!filteredItems.length) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        const nextIndex =
          activeIndex + 1 >= filteredItems.length ? 0 : activeIndex + 1;
        setActiveIndex(nextIndex);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        const prevIndex =
          activeIndex - 1 < 0 ? filteredItems.length - 1 : activeIndex - 1;
        setActiveIndex(prevIndex);
      } else if (event.key === "Enter") {
        event.preventDefault();
        if (activeIndex >= 0) {
          navigateToItem(filteredItems[activeIndex]);
        }
      }
    });

    // Clique em resultado
    allResultItems.forEach((item) => {
      item.addEventListener("click", () => {
        navigateToItem(item);
      });
    });

    // Botão "esc" dentro da palette
    if (closePaletteBtn) {
      closePaletteBtn.addEventListener("click", () => {
        closePalette();
      });
    }

    // Clique fora do box interno fecha
    palette.addEventListener("click", (event) => {
      if (event.target === palette) {
        closePalette();
      }
    });

    // Botão "configurar atalhos" abre a palette
    if (chipButton) {
      chipButton.addEventListener("click", () => {
        openPalette();
      });
    }
  }
});
