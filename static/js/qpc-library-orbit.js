/* =========================================================
   WEB-59.4 — HOMEPAGE QPC LIBRARY / ORBIT TRAIL

   C05 contract: WEB26-D017/D020; WEB25-D082/D083.
   Progressive enhancement: no JS => all genuine cards in CSS grid.
   No synthetic articles, autoplay, infinite loop or global carousel state.
   ========================================================= */

(() => {
  "use strict";

  const BREAKPOINT_MOBILE = 768;
  const BREAKPOINT_DESKTOP = 900;
  const SWIPE_THRESHOLD = 40;
  const DRAG_THRESHOLD = 10;
  const ORBIT_STEP = 44;

  const messages = {
    uk: {
      navigation: "Навігація статтями",
      one: (start, total) => `Показати статтю ${start} з ${total}`,
      range: (start, end, total) =>
        `Показати статті ${start}–${end} з ${total}`,
    },
    en: {
      navigation: "Article navigation",
      one: (start, total) => `Show article ${start} of ${total}`,
      range: (start, end, total) =>
        `Show articles ${start}–${end} of ${total}`,
    },
  };

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function visibleCount() {
    if (window.innerWidth < BREAKPOINT_MOBILE) return 1;
    if (window.innerWidth < BREAKPOINT_DESKTOP) return 2;
    return 3;
  }

  function setupCarousel(strip) {
    const viewport = strip.querySelector(".qpc-library-preview__viewport");
    const track = strip.querySelector(".qpc-library-preview__track");
    const orbit = strip.querySelector("[data-qpc-library-orbit]");

    if (!viewport || !track || !orbit) return;

    const cards = Array.from(track.children).filter((element) =>
      element.matches(".qpc-library-preview__card")
    );

    if (cards.length < 2) return;

    const anchors = cards.map((card) =>
      card.querySelector(".qpc-library-preview__card-link[href]")
    );

    // A broken source card must never become an inaccessible carousel slide.
    if (anchors.some((anchor) => !anchor)) return;

    const originalTabindex = anchors.map((anchor) =>
      anchor.getAttribute("tabindex")
    );

    const lang = document.documentElement.lang.toLowerCase().startsWith("uk")
      ? "uk"
      : "en";
    const copy = messages[lang];

    let index = 0;
    let visible = 0;
    let positions = 1;
    let step = 0;
    let buttons = [];
    let activePointer = null;
    let dragging = false;
    let suppressClickUntil = 0;
    let resizeFrame = 0;

    function setCardAccess(fromIndex) {
      cards.forEach((card, cardIndex) => {
        const inView =
          positions === 1 ||
          (cardIndex >= fromIndex && cardIndex < fromIndex + visible);

        card.inert = !inView;

        if (inView) {
          card.removeAttribute("aria-hidden");
          if (originalTabindex[cardIndex] === null) {
            anchors[cardIndex].removeAttribute("tabindex");
          } else {
            anchors[cardIndex].setAttribute(
              "tabindex",
              originalTabindex[cardIndex]
            );
          }
        } else {
          card.setAttribute("aria-hidden", "true");
          anchors[cardIndex].setAttribute("tabindex", "-1");
        }
      });
    }

    function makeOrbitButtons(count) {
      const focusedButton = buttons.indexOf(document.activeElement);
      const capsule = document.createElement("span");
      capsule.className = "qpc-library-preview__orbit-capsule";
      capsule.setAttribute("aria-hidden", "true");

      const nextButtons = [];
      for (let position = 0; position < count; position += 1) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "qpc-library-preview__orbit-button";
        button.dataset.position = String(position);

        const focus = document.createElement("span");
        focus.className = "qpc-library-preview__orbit-focus";
        focus.setAttribute("aria-hidden", "true");

        const dot = document.createElement("span");
        dot.className = "qpc-library-preview__orbit-dot";
        focus.append(dot);
        button.append(focus);

        button.addEventListener("click", () => goTo(position));
        nextButtons.push(button);
      }

      orbit.replaceChildren(capsule, ...nextButtons);
      orbit.setAttribute("role", "group");
      orbit.setAttribute("aria-label", copy.navigation);
      buttons = nextButtons;

      // An existing keyboard focus should survive a breakpoint reducing P.
      if (focusedButton !== -1) {
        buttons[clamp(focusedButton, 0, buttons.length - 1)].focus({
          preventScroll: true,
        });
      }
    }

    function paint() {
      if (positions <= 1) return;

      const shift = -index * step;
      strip.style.setProperty("--qpc-library-shift", `${shift}px`);
      orbit.style.setProperty(
        "--qpc-library-orbit-offset",
        `${index * ORBIT_STEP}px`
      );

      buttons.forEach((button, position) => {
        const first = position + 1;
        const last = Math.min(cards.length, position + visible);

        button.setAttribute(
          "aria-label",
          visible === 1
            ? copy.one(first, cards.length)
            : copy.range(first, last, cards.length)
        );

        if (position === index) {
          button.setAttribute("aria-current", "true");
        } else {
          button.removeAttribute("aria-current");
        }
      });

      setCardAccess(index);
    }

    function goTo(position) {
      if (positions <= 1) return;
      index = clamp(position, 0, positions - 1);
      paint();
      // No focus() call here: clicks keep their native button focus,
      // while pointer swipes never programmatically steal focus.
    }

    function renderLayout() {
      if (dragging) return;

      const nextVisible = visibleCount();
      const nextPositions = Math.max(1, cards.length - nextVisible + 1);
      const activeElement = document.activeElement;
      const focusedCard = cards.findIndex((card) =>
        card.contains(activeElement)
      );
      const focusedOrbitButton = buttons.includes(activeElement);

      visible = nextVisible;
      positions = nextPositions;

      if (positions === 1) {
        strip.classList.remove("is-enhanced");
        strip.style.removeProperty("--qpc-library-shift");
        orbit.style.removeProperty("--qpc-library-orbit-offset");
        orbit.hidden = true;
        index = 0;
        setCardAccess(0);

        // Do not leave keyboard focus on a button that is now hidden.
        if (focusedOrbitButton) {
          anchors[0].focus({ preventScroll: true });
        }

        orbit.replaceChildren();
        buttons = [];
        return;
      }

      // Keep the currently focused article visible after a viewport resize.
      index = clamp(index, 0, positions - 1);
      if (focusedCard !== -1) {
        if (focusedCard < index) index = focusedCard;
        if (focusedCard >= index + visible) {
          index = focusedCard - visible + 1;
        }
        index = clamp(index, 0, positions - 1);
      }

      strip.classList.add("is-enhanced");
      orbit.hidden = false;
      if (buttons.length !== positions) makeOrbitButtons(positions);

      // offsetLeft excludes CSS transforms and includes responsive flex gap.
      step = cards[1].offsetLeft - cards[0].offsetLeft;
      paint();
    }

    function scheduleLayout() {
      if (resizeFrame) return;
      resizeFrame = window.requestAnimationFrame(() => {
        resizeFrame = 0;
        renderLayout();
      });
    }

    // Suppress the synthetic anchor click following a real drag, but do not
    // suppress keyboard activation (click.detail === 0) or later clicks.
    viewport.addEventListener(
      "click",
      (event) => {
        if (event.detail !== 0 && performance.now() < suppressClickUntil) {
          event.preventDefault();
          event.stopImmediatePropagation();
          suppressClickUntil = 0;
        }
      },
      true
    );

    viewport.addEventListener("dragstart", (event) => {
      if (strip.classList.contains("is-enhanced")) event.preventDefault();
    });

    viewport.addEventListener("pointerdown", (event) => {
      if (!strip.classList.contains("is-enhanced")) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;

      suppressClickUntil = 0;
      activePointer = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        dx: 0,
      };
      dragging = false;
    });

    viewport.addEventListener("pointermove", (event) => {
      if (!activePointer || event.pointerId !== activePointer.id) return;

      const dx = event.clientX - activePointer.x;
      const dy = event.clientY - activePointer.y;
      activePointer.dx = dx;

      if (!dragging) {
        if (Math.abs(dx) < DRAG_THRESHOLD) return;
        if (Math.abs(dx) <= Math.abs(dy)) return;

        dragging = true;
        viewport.classList.add("is-dragging");
        if (viewport.setPointerCapture) {
          viewport.setPointerCapture(event.pointerId);
        }
      }

      event.preventDefault();
      const distance = clamp(dx, -step, step);
      const boundedDistance =
        (index === 0 && distance > 0) ||
        (index === positions - 1 && distance < 0)
          ? 0
          : distance;

      strip.style.setProperty(
        "--qpc-library-shift",
        `${-index * step + boundedDistance}px`
      );
    });

    function finishPointer(event, cancelled = false) {
      if (!activePointer || event.pointerId !== activePointer.id) return;

      const dx = event.clientX - activePointer.x;
      const wasDragging = dragging;
      activePointer = null;
      dragging = false;
      viewport.classList.remove("is-dragging");

      if (viewport.hasPointerCapture?.(event.pointerId)) {
        viewport.releasePointerCapture(event.pointerId);
      }

      if (!wasDragging) return;

      suppressClickUntil = performance.now() + 500;
      if (!cancelled && Math.abs(dx) >= SWIPE_THRESHOLD) {
        goTo(index + (dx < 0 ? 1 : -1));
      } else {
        paint();
      }
    }

    viewport.addEventListener("pointerup", (event) => finishPointer(event));
    viewport.addEventListener("pointercancel", (event) =>
      finishPointer(event, true)
    );

    window.addEventListener("resize", scheduleLayout, { passive: true });
    if ("ResizeObserver" in window) {
      new ResizeObserver(scheduleLayout).observe(viewport);
    }

    renderLayout();
  }

  function start() {
    document
      .querySelectorAll("[data-qpc-library-carousel]")
      .forEach(setupCarousel);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
