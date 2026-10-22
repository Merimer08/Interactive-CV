document.addEventListener('DOMContentLoaded', () => {
    const root = document.documentElement;
    const themeButtons = [
        document.getElementById('theme-toggle'),
        document.getElementById('mobile-theme-toggle')
    ].filter(Boolean);
    const themeColor = document.querySelector('meta[name="theme-color"]');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function readStoredTheme() {
        try {
            return localStorage.getItem('color-theme');
        } catch {
            return null;
        }
    }

    function storeTheme(theme) {
        try {
            localStorage.setItem('color-theme', theme);
        } catch {
            // The selected theme still applies when storage is unavailable.
        }
    }

    function applyTheme(theme) {
        const isDark = theme === 'dark';
        root.setAttribute('data-bs-theme', isDark ? 'dark' : 'light');
        themeColor?.setAttribute('content', isDark ? '#050505' : '#f7f3eb');

        themeButtons.forEach((button) => {
            button.setAttribute('aria-label', isDark ? 'Activar modo claro' : 'Activar modo oscuro');
            button.setAttribute('title', isDark ? 'Activar modo claro' : 'Activar modo oscuro');
        });
    }

    const preferredTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const requestedTheme = new URLSearchParams(window.location.search).get('theme');
    const previewTheme = ['light', 'dark'].includes(requestedTheme) ? requestedTheme : null;
    applyTheme(previewTheme || readStoredTheme() || preferredTheme);

    themeButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const nextTheme = root.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark';
            applyTheme(nextTheme);
            storeTheme(nextTheme);
        });
    });

    document.querySelectorAll('[data-image-candidates]').forEach((slot) => {
        const candidates = slot.dataset.imageCandidates
            .split(',')
            .map((candidate) => candidate.trim())
            .filter(Boolean);

        function tryCandidate(index) {
            if (index >= candidates.length) return;

            const image = new Image();
            image.onload = () => {
                slot.style.backgroundImage = `url("${candidates[index]}")`;
                slot.classList.add('has-image');
            };
            image.onerror = () => tryCandidate(index + 1);
            image.src = candidates[index];
        }

        tryCandidate(0);
    });

    document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener('click', (event) => {
            const targetId = link.getAttribute('href');
            if (!targetId || targetId === '#') return;

            const target = document.querySelector(targetId);
            if (!target) return;

            event.preventDefault();
            target.scrollIntoView({
                behavior: prefersReducedMotion ? 'auto' : 'smooth',
                block: 'start'
            });

            if (targetId !== '#inicio') {
                window.history.replaceState(null, '', targetId);
            } else {
                window.history.replaceState(null, '', window.location.pathname + window.location.search);
            }
        });
    });

    if (window.location.hash) {
        const initialTarget = document.querySelector(window.location.hash);
        window.requestAnimationFrame(() => {
            const previousScrollBehavior = root.style.scrollBehavior;
            root.style.scrollBehavior = 'auto';
            initialTarget?.scrollIntoView({ behavior: 'auto', block: 'start' });
            window.requestAnimationFrame(() => {
                root.style.scrollBehavior = previousScrollBehavior;
            });
        });
    }

    const revealItems = document.querySelectorAll('.reveal');

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
        revealItems.forEach((item) => item.classList.add('is-visible'));
    } else {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            });
        }, {
            rootMargin: '0px 0px -8% 0px',
            threshold: 0.08
        });

        revealItems.forEach((item) => revealObserver.observe(item));
    }

    const navigationLinks = [...document.querySelectorAll('.rail-nav a[data-section]')];
    const observedSections = navigationLinks
        .map((link) => document.getElementById(link.dataset.section))
        .filter(Boolean);

    if ('IntersectionObserver' in window && observedSections.length) {
        const sectionObserver = new IntersectionObserver((entries) => {
            const visibleSection = entries
                .filter((entry) => entry.isIntersecting)
                .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];

            if (!visibleSection) return;

            navigationLinks.forEach((link) => {
                link.classList.toggle('is-active', link.dataset.section === visibleSection.target.id);
            });
        }, {
            rootMargin: '-24% 0px -55% 0px',
            threshold: [0, 0.15, 0.4]
        });

        observedSections.forEach((section) => sectionObserver.observe(section));
    }
});
