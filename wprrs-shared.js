// ============================================================
// WPRRS — Shared nav + reveal + helpers
// ============================================================
(function () {
  const nav = document.getElementById('nav');
  const hamburger = document.getElementById('hamburger');
  const mobilePanel = document.getElementById('panel-mobile');

  let navTicking = false;
  function updateNav() {
    if (!nav) return;
    nav.classList.toggle('scrolled', window.scrollY > 40);
    navTicking = false;
  }
  window.addEventListener('scroll', () => {
    if (!navTicking) {
      requestAnimationFrame(updateNav);
      navTicking = true;
    }
  }, { passive: true });
  updateNav();

  function syncPanelTop() {
    if (!mobilePanel || !nav) return;
    const h = nav.offsetHeight;
    mobilePanel.style.top = h + 'px';
    mobilePanel.style.height = 'calc(100dvh - ' + h + 'px)';
  }
  syncPanelTop();
  window.addEventListener('resize', syncPanelTop, { passive: true });

  function closeMobilePanel() {
    if (!mobilePanel) return;
    mobilePanel.classList.remove('open');
    if (hamburger) hamburger.classList.remove('open');
    if (nav) nav.classList.remove('menu-open');
    if (hamburger) hamburger.setAttribute('aria-expanded', 'false');
    // Collapse all open accordions on close
    mobilePanel.querySelectorAll('.panel-section__toggle[aria-expanded="true"]').forEach(t => {
      t.setAttribute('aria-expanded', 'false');
      if (t.nextElementSibling) t.nextElementSibling.classList.remove('is-open');
    });
  }

  if (hamburger && mobilePanel) {
    hamburger.addEventListener('click', (e) => {
      e.stopPropagation();
      syncPanelTop();
      const isOpen = mobilePanel.classList.toggle('open');
      hamburger.classList.toggle('open', isOpen);
      if (nav) nav.classList.toggle('menu-open', isOpen);
      hamburger.setAttribute('aria-expanded', String(isOpen));
    });
    mobilePanel.querySelectorAll('.panel-link').forEach(link => {
      link.addEventListener('click', closeMobilePanel);
    });
    // Close on footer CTA tap
    mobilePanel.querySelectorAll('.panel-footer__btn').forEach(btn => {
      btn.addEventListener('click', closeMobilePanel);
    });
    // Accordion sections — one open at a time
    mobilePanel.querySelectorAll('.panel-section__toggle').forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const links = toggle.nextElementSibling;
        const isOpen = links.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', String(isOpen));
        mobilePanel.querySelectorAll('.panel-section__toggle').forEach(other => {
          if (other !== toggle) {
            other.setAttribute('aria-expanded', 'false');
            if (other.nextElementSibling) other.nextElementSibling.classList.remove('is-open');
          }
        });
      });
    });
    mobilePanel.querySelectorAll('.panel-sub-link').forEach(link => {
      link.addEventListener('click', closeMobilePanel);
    });
    document.addEventListener('click', (e) => {
      if (nav && !nav.contains(e.target) && !mobilePanel.contains(e.target)) closeMobilePanel();
    });
  }

  // ============================================================
  // ACTIVE PAGE INDICATOR — adds .is-current to the nav link
  // whose href matches the current URL filename. For dropdown
  // items, also marks the parent .has-drop and its trigger
  // button so the active section reads at a glance.
  // ============================================================
  (function () {
    let path = (window.location.pathname.split('/').pop() || '').toLowerCase();
    if (!path || path === 'index.html') path = 'wprrs-homepage-v2.html';

    function hrefMatchesPath(href) {
      if (!href || href.startsWith('#') || href.startsWith('http')) return false;
      const file = href.split('#')[0].split('/').pop().toLowerCase();
      return file === path;
    }

    // Top-level direct links + mobile drawer
    document.querySelectorAll('.nav__links > li > a, .panel-link').forEach(link => {
      if (hrefMatchesPath(link.getAttribute('href'))) link.classList.add('is-current');
    });

    // Dropdown items — mark item AND its trigger
    document.querySelectorAll('.nav__links .has-drop').forEach(li => {
      let active = false;
      li.querySelectorAll('.dropdown-link').forEach(link => {
        if (hrefMatchesPath(link.getAttribute('href'))) {
          link.classList.add('is-current');
          active = true;
        }
      });
      if (active) {
        li.classList.add('is-current');
        const trig = li.querySelector(':scope > .nav__trigger');
        if (trig) trig.classList.add('is-current');
      }
    });
  })();

  // ============================================================
  // NAV DROPDOWNS — click-to-toggle (replaces hover open).
  // Top-level dropdown triggers (About / Referees / Resources) are
  // <button class="nav__trigger">. Clicking toggles .is-open on the
  // parent .has-drop. Outside-click and Escape close them.
  // ============================================================
  (function () {
    const triggers = document.querySelectorAll('.has-drop > .nav__trigger');
    if (!triggers.length) return;

    function closeAll(exceptLi) {
      document.querySelectorAll('.has-drop.is-open').forEach(li => {
        if (li === exceptLi) return;
        li.classList.remove('is-open');
        const t = li.querySelector(':scope > .nav__trigger');
        if (t) t.setAttribute('aria-expanded', 'false');
      });
    }

    triggers.forEach(trigger => {
      trigger.setAttribute('aria-expanded', 'false');
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const li = trigger.closest('.has-drop');
        const opening = !li.classList.contains('is-open');
        closeAll(li);
        li.classList.toggle('is-open', opening);
        trigger.setAttribute('aria-expanded', String(opening));
      });
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.has-drop')) closeAll();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      const openLi = document.querySelector('.has-drop.is-open');
      if (!openLi) return;
      const trigger = openLi.querySelector(':scope > .nav__trigger');
      closeAll();
      if (trigger) trigger.focus();
    });
  })();

  // Smooth in-page anchor scroll
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    });
  });

  // ============================================================
  // QUOTE TEXT SPLITTER — per-line fade-in, top to bottom.
  // Step 1: wrap every word in .quote p and .quote__body in a
  //          <span class="quote-word">. Preserves nested elements
  //          like <span class="ed-em">…</span> via recursion.
  // Step 2: after layout, group words by their offsetTop. Each
  //          group is a visual line; words in that line share the
  //          same animation-delay so the whole line fades in
  //          together. Lines stagger top → bottom.
  // Step 3: pair lead → body. The body's first line index is
  //          offset by (lead line count + duration + buffer) so
  //          the body cascade only starts once the lead's last
  //          line has finished. The reveal observer below also
  //          fires the paired body in sync with the lead.
  // ============================================================
  (function splitQuoteText() {
    const LINE_DELAY_MS = 180;          // gap between line entries
    const DURATION_MS   = 700;          // matches @keyframes quoteLineIn
    const BUFFER_MS     = 200;          // breath between lead and body
    const HOLD_LINES    = Math.ceil((DURATION_MS + BUFFER_MS) / LINE_DELAY_MS);

    function wrapWords(el) {
      function processNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
          const text  = node.textContent;
          const parts = text.split(/(\s+)/);
          const frag  = document.createDocumentFragment();
          for (const part of parts) {
            if (!part.length) continue;
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(part));
            } else {
              const w = document.createElement('span');
              w.className = 'quote-word';
              w.textContent = part;
              frag.appendChild(w);
            }
          }
          node.parentNode.replaceChild(frag, node);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          Array.from(node.childNodes).forEach(processNode);
        }
      }
      Array.from(el.childNodes).forEach(processNode);
    }

    const all = Array.from(document.querySelectorAll('.quote p, .quote__body'));
    if (!all.length) return;
    all.forEach(wrapWords);

    function applyLineDelays() {
      let prevLeadLines = 0;
      let prevWasLead   = false;
      all.forEach(el => {
        const isBody    = el.matches('.quote__body');
        const baseLine  = (isBody && prevWasLead) ? prevLeadLines + HOLD_LINES : 0;
        const words     = el.querySelectorAll('.quote-word');
        let currentTop  = null;
        let lineIdx     = -1;
        words.forEach(word => {
          const top = word.offsetTop;
          if (currentTop === null || top > currentTop + 4) {
            lineIdx++;
            currentTop = top;
          }
          word.style.animationDelay = ((baseLine + lineIdx) * LINE_DELAY_MS / 1000).toFixed(3) + 's';
        });
        const lineCount = lineIdx + 1;
        if (!isBody) {
          prevLeadLines = lineCount;
          prevWasLead   = true;
        } else {
          prevWasLead   = false;
        }
      });
    }

    if (document.readyState === 'complete') {
      requestAnimationFrame(applyLineDelays);
    } else {
      window.addEventListener('load', () => requestAnimationFrame(applyLineDelays));
    }
  })();

  // SCROLL REVEAL
  // When a .quote.reveal (lead) becomes visible, also reveal its paired
  // .quote__body.reveal in the same container — so the per-letter offsets
  // baked in by the splitter resolve against a single wall-clock origin.
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduced && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-visible');
        if (e.target.matches('.quote.reveal')) {
          const ctx  = e.target.closest('.container') || e.target.parentElement;
          const body = ctx && ctx.querySelector('.quote__body.reveal:not(.is-visible)');
          if (body) {
            body.classList.add('is-visible');
            io.unobserve(body);
          }
        }
        io.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.reveal, .stagger-parent').forEach(el => io.observe(el));
  } else {
    document.querySelectorAll('.reveal, .stagger-parent').forEach(el => el.classList.add('is-visible'));
  }

  // STATS COUNTERS (only fires when .stat__num exists)
  function animateCounter(el) {
    const target = parseFloat(el.dataset.target);
    const decimals = parseInt(el.dataset.decimal || '0', 10);
    const duration = 1800;
    const start = performance.now();
    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const val = target * eased;
      el.textContent = decimals ? val.toFixed(decimals) : Math.floor(val).toLocaleString();
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = decimals ? target.toFixed(decimals) : Math.floor(target).toLocaleString();
    }
    requestAnimationFrame(tick);
  }
  if ('IntersectionObserver' in window) {
    const statIO = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { animateCounter(e.target); statIO.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    document.querySelectorAll('.stat__num').forEach(n => statIO.observe(n));
  }

  // ============================================================
  // ADD-TO-CALENDAR — generates .ics download per .event-row__ics
  // button. Each containing .event-row supplies data-event-title,
  // data-event-date (YYYY-MM-DD), and data-event-location. Default
  // duration is 09:00–11:00 local. Works on any page that uses the
  // events component (homepage, events page, virtual-meetings,
  // resource-library, etc.).
  // ============================================================
  (function () {
    const buttons = document.querySelectorAll('.event-row__ics');
    if (!buttons.length) return;
    function pad(n) { return String(n).padStart(2, '0'); }
    function toIcsDate(d) {
      return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) +
             'T' + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + '00Z';
    }
    buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const row = btn.closest('.event-row');
        if (!row) return;
        const title    = row.dataset.eventTitle || row.querySelector('h3')?.textContent || 'WPRRS event';
        const dateStr  = row.dataset.eventDate;
        const location = row.dataset.eventLocation || 'Western Province';
        const summary  = row.querySelector('.event-row__info p')?.textContent || '';
        if (!dateStr) return;
        const startHour = row.dataset.eventStart || '09:00';
        const endHour   = row.dataset.eventEnd   || '11:00';
        const start = new Date(dateStr + 'T' + startHour + ':00');
        const end   = new Date(dateStr + 'T' + endHour   + ':00');
        const uid   = 'wprrs-' + dateStr + '-' + title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const dtstamp = toIcsDate(new Date());
        const ics = [
          'BEGIN:VCALENDAR',
          'VERSION:2.0',
          'PRODID:-//WPRRS//Events//EN',
          'CALSCALE:GREGORIAN',
          'METHOD:PUBLISH',
          'BEGIN:VEVENT',
          'UID:' + uid + '@wprrs.co.za',
          'DTSTAMP:' + dtstamp,
          'DTSTART:' + toIcsDate(start),
          'DTEND:'   + toIcsDate(end),
          'SUMMARY:' + title.replace(/\n/g, ' '),
          'DESCRIPTION:' + summary.replace(/\n/g, ' '),
          'LOCATION:' + location,
          'END:VEVENT',
          'END:VCALENDAR'
        ].join('\r\n');
        const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = uid + '.ics';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1500);
      });
    });
  })();

  // ============================================================
  // WHISTLE PROMO — pinned-scroll stage controller.
  // 4 invisible triggers at 100vh increments; whichever crosses
  // the viewport mid-line is the active stage. Swaps the active
  // copy panel, the active phone iframe (via CSS), the CTA
  // overlay (stage 3), and the dot indicator. Mirrored from the
  // homepage v2 inline controller so the same component drops
  // straight onto the platform/app page.
  // ============================================================
  (function () {
    const pin = document.getElementById('whistle-pin');
    if (!pin) return;
    const section = pin.closest('.whistle-promo');
    if (!section) return;
    const triggers = section.querySelectorAll('.whistle-trigger');
    const copies   = pin.querySelectorAll('.whistle-stage-copy');
    const dots     = pin.querySelectorAll('.whistle-promo__dot');
    if (!triggers.length) return;

    const TOTAL_STAGES = triggers.length;
    const CTA_STAGE    = TOTAL_STAGES - 1;
    let current = -1;

    function setStage(next) {
      if (next === current) return;
      current = Math.max(0, Math.min(TOTAL_STAGES - 1, next));
      pin.classList.remove('is-stage-0','is-stage-1','is-stage-2','is-stage-3');
      pin.classList.add('is-stage-' + current);
      pin.classList.toggle('is-cta', current === CTA_STAGE);
      copies.forEach((c, i) => c.classList.toggle('is-active', i === current));
      dots.forEach((d, i) => d.classList.toggle('is-active', i === current));
    }

    setStage(0);

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            const idx = parseInt(e.target.dataset.stage, 10);
            if (!isNaN(idx)) setStage(idx);
          }
        });
      }, { rootMargin: '-50% 0px -50% 0px', threshold: 0 });
      triggers.forEach(t => io.observe(t));
    }

    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        const target = parseInt(dot.dataset.stage, 10);
        if (isNaN(target)) return;
        const trig = triggers[target];
        if (!trig) return;
        const rect = trig.getBoundingClientRect();
        const targetY = window.scrollY + rect.top - (window.innerHeight / 2) + (rect.height / 2);
        window.scrollTo({ top: targetY, behavior: 'smooth' });
      });
    });

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) setStage(0);
  })();

  // ============================================================
  // APP DEMO toggle — flips between desktop (browser frame) and
  // mobile (phone frame) iframes inside any .app-demo section.
  // ============================================================
  document.querySelectorAll('.app-demo').forEach(demo => {
    const buttons = demo.querySelectorAll('.app-demo__toggle-btn');
    const devices = demo.querySelectorAll('.app-demo__device');
    if (!buttons.length || !devices.length) return;
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        buttons.forEach(b => {
          const active = b === btn;
          b.classList.toggle('is-active', active);
          b.setAttribute('aria-pressed', String(active));
        });
        devices.forEach(d => d.classList.toggle('is-active', d.dataset.view === view));
      });
    });
  });

  // CHIP FILTER (events page) — assumes data-chip on chips and data-cat on rows
  document.querySelectorAll('[data-chip-group]').forEach(group => {
    const chips = group.querySelectorAll('.chip');
    const targetSel = group.dataset.chipGroup;
    const rows = document.querySelectorAll(targetSel);
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('is-active'));
        chip.classList.add('is-active');
        const cat = chip.dataset.chip;
        rows.forEach(row => {
          const match = cat === 'all' || row.dataset.cat === cat;
          row.style.display = match ? '' : 'none';
        });
      });
    });
  });
})();
