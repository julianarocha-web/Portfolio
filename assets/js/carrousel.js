// Carrusel horizontal draggeable con inercia
document.addEventListener("DOMContentLoaded", function () {
  const track = document.querySelector(".carrousel");
  if (!track) return;

  let isDown = false;
  let startX;
  let scrollLeft;

  let lastX;           // última posición del mouse/touch
  let lastTime;        // último timestamp
  let velocity = 0;    // px/ms
  let momentumId = null;

  const FRICTION = 0.95;      // cuanto más cercano a 1, más “larga” la inercia
  const MIN_VELOCITY = 0.02;  // umbral mínimo para cortar la animación

  function stopMomentum() {
    if (momentumId !== null) {
      cancelAnimationFrame(momentumId);
      momentumId = null;
    }
  }

  function startMomentum() {
    stopMomentum();
    let prevTime = performance.now();

    function frame(now) {
      const dt = now - prevTime;
      prevTime = now;

      // aplicar fricción
      velocity *= FRICTION;

      // si la velocidad ya es muy baja, cortamos
      if (Math.abs(velocity) < MIN_VELOCITY) {
        momentumId = null;
        return;
      }

      // mover scroll según la velocidad (px/ms * ms = px)
      track.scrollLeft -= velocity * dt;

      momentumId = requestAnimationFrame(frame);
    }

    momentumId = requestAnimationFrame(frame);
  }

  // Mouse: empezar drag
  track.addEventListener("mousedown", (e) => {
    e.preventDefault();
    isDown = true;
    track.classList.add("is-dragging");
    startX = e.pageX - track.getBoundingClientRect().left;
    scrollLeft = track.scrollLeft;

    lastX = startX;
    lastTime = performance.now();
    velocity = 0;
    stopMomentum();
  });

  // Mouse: terminar drag
  const endMouseDrag = () => {
    if (!isDown) return;
    isDown = false;
    track.classList.remove("is-dragging");
    startMomentum();
  };

  track.addEventListener("mouseleave", endMouseDrag);
  track.addEventListener("mouseup", endMouseDrag);

  // Mouse: mover mientras drag
  track.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    e.stopPropagation();

    const x = e.pageX - track.getBoundingClientRect().left;
    const walk = x - startX;
    track.scrollLeft = scrollLeft - walk;

    // calcular velocidad
    const now = performance.now();
    const dx = x - lastX;
    const dt = now - lastTime || 1; // evitar división por 0
    velocity = dx / dt;             // px/ms

    lastX = x;
    lastTime = now;
  });

  // Touch: empezar
  track.addEventListener("touchstart", (e) => {
    e.preventDefault();
    isDown = true;
    const touchX = e.touches[0].pageX - track.getBoundingClientRect().left;
    startX = touchX;
    scrollLeft = track.scrollLeft;

    lastX = touchX;
    lastTime = performance.now();
    velocity = 0;
    stopMomentum();
  }, { passive: false });

  // Touch: terminar
  const endTouchDrag = () => {
    if (!isDown) return;
    isDown = false;
    startMomentum();
  };

  track.addEventListener("touchend", endTouchDrag);
  track.addEventListener("touchcancel", endTouchDrag);

  // Touch: mover
  track.addEventListener("touchmove", (e) => {
    if (!isDown) return;
    e.preventDefault();

    const touchX = e.touches[0].pageX - track.getBoundingClientRect().left;
    const walk = touchX - startX;
    track.scrollLeft = scrollLeft - walk;

    const now = performance.now();
    const dx = touchX - lastX;
    const dt = now - lastTime || 1;
    velocity = dx / dt; // px/ms

    lastX = touchX;
    lastTime = now;
  }, { passive: false });
});

