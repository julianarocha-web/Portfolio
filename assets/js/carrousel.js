/**
 * carrousel-gsap.js — Reescritura completa
 * Carrusel centrado con GSAP puro, sin horizontalLoop.
 * Funciona en desktop y mobile con drag/swipe.
 */

document.addEventListener("DOMContentLoaded", function () {

  /* ============================================================
     CARRUSEL DE PROYECTOS
  ============================================================ */
  const wrapper = document.querySelector(".carrousel.wrapper");
  const items   = Array.from(document.querySelectorAll(".carrousel .item.box"));

  if (!wrapper || !items.length) return;

  const CARD_GAP           = 40;   // px entre tarjetas
  const TITLE_OFFSET_DESKTOP = 280; // alineado al título "Proyectos"
  // Cuántas cards se ven completas en desktop antes de que empiece el efecto
  const VISIBLE_CARDS_DESKTOP = 3;

  let   currentIndex  = 0;
  let   isAnimating   = false;
  let   cardWidth     = 0;
  let   wrapperWidth  = 0;

  function isMobileLayout() {
    return window.innerWidth < 1024;
  }

  // ── Medidas ──────────────────────────────────────────────────
  function measure() {
    wrapperWidth = wrapper.offsetWidth;
    cardWidth    = items[0].offsetWidth;
  }

  // ── Posición X: alineado al título en desktop, centrado en mobile ──
  function getXForIndex(itemIndex, activeIndex) {
    const offset = (itemIndex - activeIndex) * (cardWidth + CARD_GAP);
    if (isMobileLayout()) {
      return (wrapperWidth / 2) - (cardWidth / 2) + offset;
    } else {
      return TITLE_OFFSET_DESKTOP + offset;
    }
  }

  // ── Cuántas cards hacia adelante/atrás están "visibles" en desktop ──
  // Una card está visible si su borde derecho entra dentro del wrapperWidth
  function isVisibleInDesktop(itemIndex, activeIndex) {
    const x = getXForIndex(itemIndex, activeIndex);
    return x >= 0 && (x + cardWidth) <= wrapperWidth + cardWidth * 0.15; // 15% de tolerancia
  }

  // ── Render inicial sin animación ─────────────────────────────
  function init() {
    measure();

    // position:relative y overflow:visible vienen del CSS
    // Solo forzamos position en caso de que el CSS no haya aplicado aún
    wrapper.style.position = "relative";

    items.forEach((item, i) => {
      const visible = isMobileLayout() ? (i === currentIndex) : isVisibleInDesktop(i, currentIndex);
      gsap.set(item, {
        position: "absolute",
        left: 0,
        top: "50%",
        yPercent: -50,
        x: getXForIndex(i, currentIndex),
        scale:   visible ? 1    : 0.82,
        opacity: visible ? 1    : 0.38,
      });
      item.classList.toggle("active", i === currentIndex);
    });
  }

  // ── Navegar a un índice ──────────────────────────────────────
  function goTo(index, instant) {
    if (isAnimating && !instant) return;

    // Loop circular
    const total = items.length;
    index = ((index % total) + total) % total;

    isAnimating = true;
    currentIndex = index;

    const dur = instant ? 0 : 0.55;

    items.forEach((item, i) => {
      const x       = getXForIndex(i, currentIndex);
      const active  = i === currentIndex;
      const visible = isMobileLayout() ? active : isVisibleInDesktop(i, currentIndex);

      gsap.to(item, {
        x,
        scale:   visible ? 1    : 0.82,
        opacity: visible ? 1    : 0.38,
        duration: dur,
        ease:    "power2.inOut",
        onComplete: () => { if (i === 0) isAnimating = false; }
      });

      item.classList.toggle("active", active);
    });
  }

  // ── Botones ──────────────────────────────────────────────────
  const nextBtn = document.querySelector(".carrousel-actions .next");
  const prevBtn = document.querySelector(".carrousel-actions .prev");

  nextBtn && nextBtn.addEventListener("click", () => goTo(currentIndex + 1));
  prevBtn && prevBtn.addEventListener("click", () => goTo(currentIndex - 1));

  // ── Click en tarjeta → centrarla ────────────────────────────
  items.forEach((item, i) => {
    item.addEventListener("click", () => {
      if (i !== currentIndex) {
        goTo(i);
      }
    });
  });

  // ── Drag / Swipe con Draggable ───────────────────────────────
  if (typeof Draggable !== "undefined") {
    const proxy = document.createElement("div");
    let   startX = 0;

    Draggable.create(proxy, {
      type:    "x",
      trigger: wrapper,
      onPressInit: function () {
        startX = this.x;
      },
      onDragEnd: function () {
        const diff = this.x - startX;
        const threshold = cardWidth * 0.25;
        if (Math.abs(diff) > threshold) {
          goTo(diff < 0 ? currentIndex + 1 : currentIndex - 1);
        }
      }
    });
  }

  // ── Teclado ──────────────────────────────────────────────────
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") goTo(currentIndex + 1);
    if (e.key === "ArrowLeft")  goTo(currentIndex - 1);
  });

  // ── Resize ──────────────────────────────────────────────────
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      measure();
      goTo(currentIndex, true);
    }, 150);
  });

  // ── Arranque ─────────────────────────────────────────────────
  // Esperamos un frame para que el CSS haya pintado los items
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      init();
    });
  });


  /* ============================================================
     SKILLS MARQUEE — CSS puro en mobile, GSAP en desktop
  ============================================================ */
  const skillsTrack = document.querySelector(".skills-track");

  if (skillsTrack && typeof gsap !== "undefined") {

    // Inyectar keyframe CSS para mobile (una sola vez)
    if (!document.getElementById("skills-marquee-style")) {
      const style = document.createElement("style");
      style.id = "skills-marquee-style";
      style.textContent = `
        @keyframes skillsScroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `;
      document.head.appendChild(style);
    }

    let gsapMarquee = null;

    function initMarquee() {
      const mobile = window.innerWidth < 1024;

      if (mobile) {
        // Matar GSAP si existía
        if (gsapMarquee) { gsapMarquee.kill(); gsapMarquee = null; }
        gsap.set(skillsTrack.querySelectorAll(".skill-item"), { clearProps: "all" });

        // Duplicar items para loop visual (solo una vez)
        if (!skillsTrack.dataset.cloned) {
          const originals = Array.from(skillsTrack.children);
          originals.forEach(el => {
            const clone = el.cloneNode(true);
            clone.setAttribute("aria-hidden", "true");
            skillsTrack.appendChild(clone);
          });
          skillsTrack.dataset.cloned = "1";
        }

        skillsTrack.style.width     = "max-content";
        skillsTrack.style.flexWrap  = "nowrap";
        skillsTrack.style.animation = "skillsScroll 20s linear infinite";

      } else {
        // Quitar CSS animation
        skillsTrack.style.animation = "";

        const skillItems = Array.from(skillsTrack.querySelectorAll(".skill-item"));
        if (!skillItems.length) return;

        // Usar gsap.to con modifiers para marquee infinito
        const totalW = skillsTrack.scrollWidth / 2; // la mitad porque hay clones

        if (gsapMarquee) gsapMarquee.kill();

        gsapMarquee = gsap.to(skillsTrack, {
          x: -totalW,
          duration: 20,
          ease: "none",
          repeat: -1,
          modifiers: {
            x: gsap.utils.unitize(x => parseFloat(x) % totalW)
          }
        });
      }
    }

    window.addEventListener("load", initMarquee);

    let mResizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(mResizeTimer);
      mResizeTimer = setTimeout(initMarquee, 250);
    });
  }

});


