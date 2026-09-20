/* =========================================================
   THE BEAUTY SALON
   Main JavaScript
   File: frontend/js/main.js
   ========================================================= */

"use strict";

/* =========================================================
   DOM READY
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    initMobileMenu();
    initStickyHeader();
    initCurrentYear();
    initDailyOffer();
});


/* =========================================================
   MOBILE MENU
   ========================================================= */

function initMobileMenu() {
    const menuButton = document.querySelector(".mobile-menu-btn");
    const nav = document.querySelector(".main-nav");
    const headerActions = document.querySelector(".header-actions");
    const header = document.querySelector(".site-header");

    if (!menuButton || !nav) {
        return;
    }

    /*
     * Create mobile overlay dynamically.
     * This avoids needing an extra HTML element.
     */
    let overlay = document.querySelector(".mobile-menu-overlay");

    if (!overlay) {
        overlay = document.createElement("div");
        overlay.className = "mobile-menu-overlay";
        document.body.appendChild(overlay);
    }

    const menuIcon = menuButton.querySelector("i");

    function openMenu() {
        nav.classList.add("mobile-menu-open");
        menuButton.classList.add("active");
        overlay.classList.add("active");
        document.body.classList.add("menu-open");

        if (headerActions) {
            headerActions.classList.add("mobile-actions-open");
        }

        if (menuIcon) {
            menuIcon.classList.remove("fa-bars");
            menuIcon.classList.add("fa-xmark");
        }

        menuButton.setAttribute("aria-expanded", "true");
    }

    function closeMenu() {
        nav.classList.remove("mobile-menu-open");
        menuButton.classList.remove("active");
        overlay.classList.remove("active");
        document.body.classList.remove("menu-open");

        if (headerActions) {
            headerActions.classList.remove("mobile-actions-open");
        }

        if (menuIcon) {
            menuIcon.classList.remove("fa-xmark");
            menuIcon.classList.add("fa-bars");
        }

        menuButton.setAttribute("aria-expanded", "false");
    }

    function toggleMenu() {
        const isOpen = nav.classList.contains("mobile-menu-open");

        if (isOpen) {
            closeMenu();
        } else {
            openMenu();
        }
    }

    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Toggle navigation menu");

    menuButton.addEventListener("click", toggleMenu);

    overlay.addEventListener("click", closeMenu);

    /*
     * Close menu when navigation link is clicked.
     */
    const navLinks = nav.querySelectorAll("a");

    navLinks.forEach((link) => {
        link.addEventListener("click", () => {
            closeMenu();
        });
    });

    /*
     * Close menu using Escape key.
     */
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeMenu();
        }
    });

    /*
     * Close mobile menu automatically when screen becomes desktop.
     */
    window.addEventListener("resize", () => {
        if (window.innerWidth >= 768) {
            closeMenu();
        }
    });

    /*
     * Prevent background page scrolling while mobile menu is open.
     */
    if (header) {
        header.addEventListener("touchmove", (event) => {
            if (document.body.classList.contains("menu-open")) {
                event.stopPropagation();
            }
        });
    }
}


/* =========================================================
   STICKY HEADER
   ========================================================= */

function initStickyHeader() {
    const header = document.querySelector(".site-header");

    if (!header) {
        return;
    }

    const scrollThreshold = 40;

    function updateHeader() {
        if (window.scrollY > scrollThreshold) {
            header.classList.add("scrolled");
        } else {
            header.classList.remove("scrolled");
        }
    }

    updateHeader();

    window.addEventListener("scroll", updateHeader, {
        passive: true
    });
}


/* =========================================================
   CURRENT YEAR
   ========================================================= */

function initCurrentYear() {
    const yearElements = document.querySelectorAll("[data-current-year]");

    const currentYear = new Date().getFullYear();

    yearElements.forEach((element) => {
        element.textContent = currentYear;
    });

    /*
     * Also supports common footer IDs.
     */
    const footerYear = document.getElementById("currentYear");

    if (footerYear) {
        footerYear.textContent = currentYear;
    }
}


/* =========================================================
   DAILY OFFER
   ========================================================= */

function initDailyOffer() {
    const titleElement = document.getElementById("dailyOfferTitle");
    const descriptionElement = document.getElementById("dailyOfferDescription");
    const dayElement = document.getElementById("dailyOfferDay");
    const statusElement = document.getElementById("dailyOfferStatus");

    /*
     * If the page does not contain the daily offer section,
     * stop safely without creating JavaScript errors.
     */
    if (
        !titleElement &&
        !descriptionElement &&
        !dayElement &&
        !statusElement
    ) {
        return;
    }

    /*
     * Sunday = 0
     * Monday = 1
     * Tuesday = 2
     * Wednesday = 3
     * Thursday = 4
     * Friday = 5
     * Saturday = 6
     */

    const offers = {
        0: {
            day: "Sunday",
            title: "Sunday Self-Care",
            description: "Relax and refresh with selected salon services.",
            status: "Today's Offer"
        },

        1: {
            day: "Monday",
            title: "Monday Beauty Start",
            description: "Start your week with a fresh and confident look.",
            status: "Today's Offer"
        },

        2: {
            day: "Tuesday",
            title: "Tuesday Grooming",
            description: "Enjoy selected grooming services for a stylish look.",
            status: "Today's Offer"
        },

        3: {
            day: "Wednesday",
            title: "Midweek Glow",
            description: "Take a midweek break and give yourself some care.",
            status: "Today's Offer"
        },

        4: {
            day: "Thursday",
            title: "Thursday Style Day",
            description: "Refresh your style with our professional salon services.",
            status: "Today's Offer"
        },

        5: {
            day: "Friday",
            title: "Friday Fresh Look",
            description: "Get ready for the weekend with a premium salon experience.",
            status: "Today's Offer"
        },

        6: {
            day: "Saturday",
            title: "Saturday Style",
            description: "Look your best for the weekend with The Beauty Salon.",
            status: "Today's Offer"
        }
    };

    const today = new Date().getDay();
    const offer = offers[today];

    if (!offer) {
        return;
    }

    if (titleElement) {
        titleElement.textContent = offer.title;
    }

    if (descriptionElement) {
        descriptionElement.textContent = offer.description;
    }

    if (dayElement) {
        dayElement.textContent = offer.day;
    }

    if (statusElement) {
        statusElement.textContent = offer.status;
    }
}


/* =========================================================
   SMOOTH SCROLL
   ========================================================= */

function initSmoothScroll() {
    const internalLinks = document.querySelectorAll(
        'a[href^="#"]:not([href="#"])'
    );

    internalLinks.forEach((link) => {
        link.addEventListener("click", (event) => {
            const targetId = link.getAttribute("href");

            if (!targetId) {
                return;
            }

            const target = document.querySelector(targetId);

            if (!target) {
                return;
            }

            event.preventDefault();

            target.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        });
    });
}


/* =========================================================
   ACTIVE NAVIGATION
   ========================================================= */

function initActiveNavigation() {
    const currentPage = window.location.pathname
        .split("/")
        .pop()
        .toLowerCase();

    const navLinks = document.querySelectorAll(".main-nav a");

    if (!navLinks.length) {
        return;
    }

    navLinks.forEach((link) => {
        const href = link.getAttribute("href");

        if (!href) {
            return;
        }

        const linkPage = href
            .split("/")
            .pop()
            .split("?")[0]
            .toLowerCase();

        link.classList.remove("active");

        if (
            (currentPage === "" || currentPage === "index.html") &&
            (linkPage === "" || linkPage === "index.html")
        ) {
            link.classList.add("active");
        } else if (
            currentPage &&
            currentPage !== "index.html" &&
            linkPage === currentPage
        ) {
            link.classList.add("active");
        }
    });
}


/* =========================================================
   INITIALIZE OPTIONAL FEATURES
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    initSmoothScroll();
    initActiveNavigation();
});


/* =========================================================
   GLOBAL HELPERS
   ========================================================= */

/*
 * Safe local storage getter.
 */
function getStoredData(key, fallback = null) {
    try {
        const data = localStorage.getItem(key);

        if (data === null) {
            return fallback;
        }

        return JSON.parse(data);
    } catch (error) {
        console.warn(`Unable to read localStorage key: ${key}`);
        return fallback;
    }
}


/*
 * Safe local storage setter.
 */
function setStoredData(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.warn(`Unable to save localStorage key: ${key}`);
        return false;
    }
}


/*
 * Safe local storage remover.
 */
function removeStoredData(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.warn(`Unable to remove localStorage key: ${key}`);
        return false;
    }
}


/*
 * Format date as DD/MM/YYYY.
 */
function formatDate(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
        return "";
    }

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
}


/*
 * Generate a simple unique ID.
 * Backend will later generate real database IDs.
 */
function generateTemporaryId(prefix = "BS") {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);

    return `${prefix}-${timestamp}-${random}`;
}


/* =========================================================
   CONSOLE MESSAGE
   ========================================================= */

console.log(
    "%cThe Beauty Salon",
    "color:#D4AF37;font-size:20px;font-weight:bold;"
);

console.log(
    "%cWebsite frontend loaded successfully.",
    "color:#AAAAAA;font-size:13px;"
);