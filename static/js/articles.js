
document.addEventListener("DOMContentLoaded", () => {
    const carousels = document.querySelectorAll("[data-articles-carousel]");

    carousels.forEach((carousel) => {
        const section = carousel.closest(".articles-section");
        const viewport = carousel.querySelector(".articles-viewport");
        const track = carousel.querySelector(".articles-track");
        const cards = Array.from(
            carousel.querySelectorAll(".article-card")
        );
        const dotsContainer = carousel.querySelector(".articles-dots");

        const filterButtons = section
            ? Array.from(
                section.querySelectorAll(
                    ".article-tags-filter [data-filter]"
                )
            )
            : [];

        if (
            !viewport ||
            !track ||
            !cards.length ||
            !dotsContainer
        ) {
            return;
        }

        let visibleCards = [...cards];
        let dots = [];
        let slidesPerPage = 1;
        let activeFilter = "all";
        let scrollFrame = null;
        let resizeTimer = null;

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
            if (!visibleCards.length) {
                return 0;
            }

            return Math.ceil(
                visibleCards.length / slidesPerPage
            );
        };

        const getPageWidth = () => {
            return viewport.clientWidth;
        };

        const setActiveDot = (index) => {
            dots.forEach((dot, dotIndex) => {
                const isActive = dotIndex === index;

                dot.classList.toggle(
                    "is-active",
                    isActive
                );

                dot.setAttribute(
                    "aria-current",
                    isActive ? "true" : "false"
                );
            });
        };

        const scrollToPage = (
            index,
            behavior = "smooth"
        ) => {
            const pageCount = getPageCount();

            if (!pageCount) {
                return;
            }

            const safeIndex = Math.max(
                0,
                Math.min(index, pageCount - 1)
            );

            viewport.scrollTo({
                left: getPageWidth() * safeIndex,
                behavior,
            });

            setActiveDot(safeIndex);
        };

        const buildDots = () => {
            slidesPerPage = getSlidesPerPage();

            const pageCount = getPageCount();

            dotsContainer.innerHTML = "";

            if (pageCount <= 1) {
                dots = [];
                return;
            }

            dots = Array.from(
                { length: pageCount },
                (_, index) => {
                    const dot =
                        document.createElement("button");

                    dot.type = "button";
                    dot.className = "articles-dot carousel-dot";

                    dot.setAttribute(
                        "aria-label",
                        `Go to articles page ${index + 1}`
                    );

                    dot.setAttribute(
                        "aria-current",
                        index === 0 ? "true" : "false"
                    );

                    if (index === 0) {
                        dot.classList.add("is-active");
                    }

                    dot.addEventListener("click", () => {
                        scrollToPage(index);
                    });

                    dotsContainer.appendChild(dot);

                    return dot;
                }
            );
        };

        const updateActiveDot = () => {
            if (!dots.length) {
                return;
            }

            const pageWidth = getPageWidth();

            if (!pageWidth) {
                return;
            }

            const currentPage = Math.round(
                viewport.scrollLeft / pageWidth
            );

            const safePage = Math.max(
                0,
                Math.min(
                    currentPage,
                    dots.length - 1
                )
            );

            setActiveDot(safePage);
        };

        const matchesFilter = (
            card,
            filter
        ) => {
            if (filter === "all") {
                return true;
            }

            const tags = (
                card.dataset.tags || ""
            )
                .split(/\s+/)
                .filter(Boolean);

            return tags.includes(filter);
        };

        const updateFilterButtons = (
            filter
        ) => {
            filterButtons.forEach((button) => {
                const isActive =
                    button.dataset.filter === filter;

                button.classList.toggle(
                    "is-active",
                    isActive
                );

                button.setAttribute(
                    "aria-pressed",
                    isActive ? "true" : "false"
                );
            });
        };

        const applyFilter = (filter) => {
            activeFilter = filter;

            cards.forEach((card) => {
                const isVisible =
                    matchesFilter(card, filter);

                card.classList.toggle(
                    "is-hidden",
                    !isVisible
                );

                card.setAttribute(
                    "aria-hidden",
                    isVisible ? "false" : "true"
                );
            });

            visibleCards = cards.filter(
                (card) =>
                    matchesFilter(card, filter)
            );

            updateFilterButtons(filter);

            viewport.scrollTo({
                left: 0,
                behavior: "auto",
            });

            buildDots();
            setActiveDot(0);
        };

        filterButtons.forEach((button) => {
            button.addEventListener(
                "click",
                () => {
                    const filter =
                        button.dataset.filter || "all";

                    applyFilter(filter);
                }
            );
        });

        viewport.addEventListener(
            "scroll",
            () => {
                if (scrollFrame) {
                    cancelAnimationFrame(
                        scrollFrame
                    );
                }

                scrollFrame =
                    requestAnimationFrame(
                        updateActiveDot
                    );
            },
            { passive: true }
        );

        window.addEventListener(
            "resize",
            () => {
                clearTimeout(resizeTimer);

                resizeTimer = setTimeout(
                    () => {
                        const nextSlidesPerPage =
                            getSlidesPerPage();

                        if (
                            nextSlidesPerPage !==
                            slidesPerPage
                        ) {
                            viewport.scrollTo({
                                left: 0,
                                behavior: "auto",
                            });

                            buildDots();
                            setActiveDot(0);
                        }
                    },
                    150
                );
            }
        );

        applyFilter(activeFilter);
    });
});
