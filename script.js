/**
 * STUDIO VEDANA — CLIENT SCRIPT
 * Handles: mobile navigation, accessible modal dialog, focus trap,
 * dialog tab switching, scroll reveal (IntersectionObserver), copyright year.
 */

document.addEventListener('DOMContentLoaded', () => {

  // Mark document as JS-ready to safely enable scroll reveal animations
  document.documentElement.classList.add('js-ready');

  /* ------------------------------------------------------------------------
     1. DYNAMIC COPYRIGHT YEAR
     ------------------------------------------------------------------------ */
  const yearEl = document.getElementById('current-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ------------------------------------------------------------------------
     2. ACCESSIBLE MOBILE NAVIGATION DRAWER
     ------------------------------------------------------------------------ */
  const mobileToggle = document.getElementById('mobile-nav-toggle');
  const mobileDrawer = document.getElementById('mobile-nav-drawer');

  function openMobileNav() {
    if (!mobileToggle || !mobileDrawer) return;
    mobileToggle.setAttribute('aria-expanded', 'true');
    mobileToggle.setAttribute('aria-label', 'Close navigation menu');
    mobileDrawer.classList.add('is-open');
    const firstLink = mobileDrawer.querySelector('a');
    if (firstLink) firstLink.focus();
  }

  function closeMobileNav() {
    if (!mobileToggle || !mobileDrawer) return;
    mobileToggle.setAttribute('aria-expanded', 'false');
    mobileToggle.setAttribute('aria-label', 'Open navigation menu');
    mobileDrawer.classList.remove('is-open');
  }

  if (mobileToggle && mobileDrawer) {
    mobileToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      mobileToggle.getAttribute('aria-expanded') === 'true'
        ? closeMobileNav()
        : openMobileNav();
    });

    mobileDrawer.querySelectorAll('.nav-link, .nav-cta-btn').forEach(link => {
      link.addEventListener('click', closeMobileNav);
    });

    document.addEventListener('click', (e) => {
      if (
        mobileDrawer.classList.contains('is-open') &&
        !mobileDrawer.contains(e.target) &&
        !mobileToggle.contains(e.target)
      ) closeMobileNav();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileDrawer.classList.contains('is-open')) {
        closeMobileNav();
        mobileToggle.focus();
      }
    });
  }

  /* ------------------------------------------------------------------------
     3. ACCESSIBLE PENANCE CASE FILE DIALOG
     ------------------------------------------------------------------------ */
  const dialog      = document.getElementById('penance-modal');
  const openButtons = document.querySelectorAll('.open-penance-modal-btn');
  const closeButton = document.getElementById('close-penance-modal');
  let lastActiveElement = null;

  function openDialog(trigger) {
    if (!dialog) return;
    lastActiveElement = trigger || document.activeElement;

    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }

    document.body.style.overflow = 'hidden';

    // Reset to first tab whenever the dialog opens
    switchTab('overview');

    // Focus the close button for keyboard users
    if (closeButton) closeButton.focus();
  }

  function closeDialog() {
    if (!dialog) return;
    if (typeof dialog.close === 'function') {
      dialog.close();
    } else {
      dialog.removeAttribute('open');
    }
    document.body.style.overflow = '';
    if (lastActiveElement && typeof lastActiveElement.focus === 'function') {
      lastActiveElement.focus();
    }
  }

  openButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openDialog(btn);
    });
  });

  if (closeButton) {
    closeButton.addEventListener('click', (e) => {
      e.preventDefault();
      closeDialog();
    });
  }

  if (dialog) {
    // Close on backdrop click
    dialog.addEventListener('click', (e) => {
      const rect = dialog.getBoundingClientRect();
      const inDialog = (
        rect.top  <= e.clientY && e.clientY <= rect.top  + rect.height &&
        rect.left <= e.clientX && e.clientX <= rect.left + rect.width
      );
      if (!inDialog) closeDialog();
    });

    // Handle native cancel (Escape key fires this on <dialog>)
    dialog.addEventListener('cancel', (e) => {
      e.preventDefault();
      closeDialog();
    });

    // Focus trap inside dialog
    dialog.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      const focusable = Array.from(dialog.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), ' +
        'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ------------------------------------------------------------------------
     4. DIALOG TAB SWITCHING
     ------------------------------------------------------------------------ */
  const tabButtons = document.querySelectorAll('.dialog-tab');
  const tabPanels  = document.querySelectorAll('.dialog-tab-panel');

  function switchTab(targetId) {
    tabButtons.forEach(btn => {
      const active = btn.dataset.tab === targetId;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', active);
    });
    tabPanels.forEach(panel => {
      const active = panel.id === `tab-${targetId}`;
      panel.hidden = !active;
      panel.classList.toggle('is-active', active);
    });
  }

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Keyboard navigation within tabs (arrow keys)
  const tabNav = document.querySelector('.dialog-section-tabs');
  if (tabNav) {
    tabNav.addEventListener('keydown', (e) => {
      if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      const tabs = Array.from(tabButtons);
      const idx  = tabs.indexOf(document.activeElement);
      if (idx === -1) return;
      const next = e.key === 'ArrowRight'
        ? (idx + 1) % tabs.length
        : (idx - 1 + tabs.length) % tabs.length;
      tabs[next].focus();
      switchTab(tabs[next].dataset.tab);
    });
  }

  /* ------------------------------------------------------------------------
     5. SCROLL REVEAL (IntersectionObserver)
     ------------------------------------------------------------------------ */
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!prefersReduced) {
    const revealEls = document.querySelectorAll('.js-reveal');

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            obs.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin: '0px 0px -8% 0px',
        threshold: 0.06
      }
    );

    revealEls.forEach((el, i) => {
      // Stagger delay for sibling elements within the same container
      el.style.setProperty('--reveal-delay', `${i * 0.04}s`);
      observer.observe(el);
    });
  } else {
    // Reduced motion: reveal everything immediately
    document.querySelectorAll('.js-reveal').forEach(el => {
      el.classList.add('is-revealed');
    });
  }

  /* ------------------------------------------------------------------------
     6. HEADER SCROLL POLISH
     ------------------------------------------------------------------------ */
  const header = document.querySelector('.site-header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.style.borderBottomColor = window.scrollY > 40
        ? 'var(--color-border-brass)'
        : 'var(--color-border-dark)';
    }, { passive: true });
  }

});
