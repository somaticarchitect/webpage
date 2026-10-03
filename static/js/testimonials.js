document.addEventListener("DOMContentLoaded", () => {
  const carousels = document.querySelectorAll(".testimonials-carousel");

  carousels.forEach((carousel) => {
    const viewport = carousel.querySelector(".testimonials-viewport");
    const track = carousel.querySelector(".testimonials-track");
    const cards = Array.from(
      carousel.querySelectorAll(".testimonial-card")
    );
    const dotsContainer = carousel.querySelector(".testimonials-dots");

    if (!viewport || !track || !cards.length || !dotsContainer) {
      return;
    }

    let dots = [];
    let slidesPerPage = 1;

    const getSlidesPerPage = () => {
      if (window.innerWidth <= 640) {
        return 1;
      }

      if (window.innerWidth <= 1024) {
        return 2;
      }

      return 3;
    };

    const getPageCount = () => {
      return Math.ceil(cards.length / slidesPerPage);
    };

    const getPageWidth = () => {
      return viewport.clientWidth;
    };

    const setActiveDot = (index) => {
      dots.forEach((dot, dotIndex) => {
        const active = dotIndex === index;

        dot.classList.toggle("is-active", active);

        dot.setAttribute(
          "aria-current",
          active ? "true" : "false"
        );
      });
    };

    const scrollToPage = (index) => {
      viewport.scrollTo({
        left: getPageWidth() * index,
        behavior: "smooth",
      });
    };

    const buildDots = () => {
      slidesPerPage = getSlidesPerPage();

      const pageCount = getPageCount();

      dotsContainer.innerHTML = "";

      dots = Array.from({ length: pageCount }, (_, index) => {
        const dot = document.createElement("button");

        dot.type = "button";
        dot.className = "testimonials-dot";

        dot.setAttribute(
          "aria-label",
          `Go to testimonials page ${index + 1}`
        );

        dot.addEventListener("click", () => {
          scrollToPage(index);
        });

        dotsContainer.appendChild(dot);

        return dot;
      });

      setActiveDot(0);
    };

    const updateActiveDot = () => {
      const pageWidth = getPageWidth();

      if (!pageWidth) {
        return;
      }

      const currentPage = Math.round(
        viewport.scrollLeft / pageWidth
      );

      const safePage = Math.min(
        currentPage,
        dots.length - 1
      );

      setActiveDot(Math.max(0, safePage));
    };

    let scrollFrame = null;

    viewport.addEventListener(
      "scroll",
      () => {
        if (scrollFrame) {
          cancelAnimationFrame(scrollFrame);
        }

        scrollFrame = requestAnimationFrame(
          updateActiveDot
        );
      },
      { passive: true }
    );

    let resizeTimer = null;

    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);

      resizeTimer = setTimeout(() => {
        buildDots();

        viewport.scrollTo({
          left: 0,
          behavior: "auto",
        });
      }, 150);
    });

    buildDots();
  });
});