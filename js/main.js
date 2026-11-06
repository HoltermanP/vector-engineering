const header = document.querySelector('[data-header]');
const menuToggle = document.querySelector('[data-menu-toggle]');
const mobilePanel = document.querySelector('[data-mobile-panel]');
const mobileLinks = document.querySelectorAll('[data-mobile-panel] a');
const contactForm = document.querySelector('#contactForm');
const formNote = document.querySelector('[data-form-note]');

function syncHeader() {
  header.classList.toggle('is-scrolled', window.scrollY > 24);
}

syncHeader();
window.addEventListener('scroll', syncHeader, { passive: true });

menuToggle.addEventListener('click', () => {
  const isOpen = mobilePanel.classList.toggle('is-open');
  document.body.classList.toggle('menu-open', isOpen);
  menuToggle.setAttribute('aria-expanded', String(isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? 'Menu sluiten' : 'Menu openen');
});

mobileLinks.forEach((link) => {
  link.addEventListener('click', () => {
    mobilePanel.classList.remove('is-open');
    document.body.classList.remove('menu-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Menu openen');
  });
});

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

if (contactForm) {
  const submitButton = contactForm.querySelector('button[type="submit"]');
  const endpoint = contactForm.getAttribute('action') || '/api/contact';

  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!formNote || !submitButton) return;

    formNote.textContent = '';
    formNote.classList.remove('is-error');
    submitButton.disabled = true;
    submitButton.textContent = 'Versturen...';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(new FormData(contactForm))),
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Het verzenden is mislukt.');
      }

      formNote.textContent = result.message;
      contactForm.reset();
    } catch (error) {
      formNote.textContent = error.message || 'Het verzenden is mislukt. Probeer het later opnieuw.';
      formNote.classList.add('is-error');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Verstuur bericht';
    }
  });
}

const gantts = document.querySelectorAll('[data-gantt]');

if (gantts.length && 'IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.remove('is-pending');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.25 });
  gantts.forEach((gantt) => {
    gantt.classList.add('is-pending');
    observer.observe(gantt);
  });
}

document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });


const studyMap = document.querySelector('[data-study-map]');

if (studyMap) {
  const LAYERS = ['bodem', 'ooo', 'flora', 'archeo', 'hydro', 'stikstof'];
  const PHASES = ['so', 'vo', 'do'];
  const layerEls = studyMap.querySelectorAll('.sm-layer');
  const cards = document.querySelectorAll('.study-card[data-layer]');
  const caption = document.querySelector('[data-map-caption]');
  const controls = document.querySelector('[data-map-controls]');
  const phaseBtns = document.querySelectorAll('[data-phase-btn]');
  const replayBtn = document.querySelector('[data-map-replay]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const PHASE_TEXT = {
    so: '<strong>SO</strong> · Een zoekgebied tussen onderstation (OS) en schakelstation (SS). De bureaustudies dekken de hele strook.',
    vo: '<strong>VO</strong> · Het voorkeurstracé ligt vast. De bureaustudies laten zien waar het door gevoelig gebied gaat.',
    do: '<strong>DO</strong> · Veldonderzoek alleen op de plekken die uit de bureaustudies naar voren kwamen.',
  };
  const LAYER_TEXT = {
    bodem: ['Historisch vooronderzoek: een voormalig tankstation en een gedempte sloot langs het tracé.', 'Verkennend bodemonderzoek met boringen op de verdachte plekken en verspreid langs het tracé.'],
    ooo: ['Vooronderzoek: rond de brug over de vaart ligt een CE-verdacht gebied uit de Tweede Wereldoorlog.', 'Detectie alleen op het deel van het tracé dat door het verdachte gebied loopt.'],
    flora: ['Quickscan: watergangen en een houtwal langs de weg zijn mogelijk leefgebied van beschermde soorten.', 'Nader onderzoek bij de kruisingen met watergangen, zo nodig met ontheffing.'],
    archeo: ['Bureauonderzoek: rond de oude dorpskern geldt een hoge archeologische verwachting.', 'Booronderzoek alleen waar het tracé de zone met hoge verwachting raakt, afgestemd met de gemeente.'],
    hydro: ['Hydrologie volgt in het DO, omdat het metingen in het veld vraagt.', 'Peilbuizen geven de grondwaterstand. Daarmee bepalen we de bemaling bij de boorputten en de sleuf.'],
    stikstof: ['Eerste AERIUS-toets: het werkterrein bij het schakelstation ligt dicht bij Natura 2000.', 'Depositieberekening voor de aanleg, op basis van materieel en planning uit het DO.'],
  };
  const BADGE = { so: 'SO · zoekgebied', vo: 'VO · voorkeurstracé', do: 'DO · definitief tracé' };
  const badge = studyMap.querySelector('[data-map-badge]');
  const NAMES = { bodem: 'Bodem & Milieu', ooo: 'OOO', flora: 'Flora & Fauna', archeo: 'Archeologie', hydro: 'Hydrologie', stikstof: 'Stikstof & Natura 2000' };

  const state = { phase: 'do', shown: new Set(LAYERS), active: null, pinned: null };
  let timer = null;

  const applies = (key, phase) => phase === 'do' || key !== 'hydro';

  function render() {
    const { phase, shown, active } = state;
    studyMap.dataset.phase = phase;
    layerEls.forEach((el) => {
      const key = el.dataset.layer;
      const on = shown.has(key) && applies(key, phase);
      el.classList.toggle('is-on', on);
      el.classList.toggle('is-dim', on && !!active && active !== key);
    });
    const phaseIndex = PHASES.indexOf(phase);
    cards.forEach((card) => {
      const key = card.dataset.layer;
      card.classList.toggle('is-active', active === key);
      card.classList.toggle('is-off', !applies(key, phase));
      card.setAttribute('aria-pressed', String(state.pinned === key));
      card.querySelectorAll('.phase-bar .ph').forEach((cell, i) => cell.classList.toggle('is-now', i === phaseIndex));
    });
    phaseBtns.forEach((btn) => btn.setAttribute('aria-pressed', String(btn.dataset.phaseBtn === phase)));
    if (badge) badge.textContent = BADGE[phase];
    if (caption) {
      const label = phase.toUpperCase();
      caption.innerHTML = active
        ? `<strong>${label} · ${NAMES[active]}</strong> · ${LAYER_TEXT[active][phase === 'do' ? 1 : 0]}`
        : PHASE_TEXT[phase];
    }
  }

  function stopAutoplay() {
    if (timer) clearTimeout(timer);
    timer = null;
  }

  const STEPS = [
    { phase: 'so', shown: [], active: null },
    ...['bodem', 'ooo', 'flora', 'archeo', 'stikstof'].map((key, i, arr) => ({ phase: 'vo', shown: arr.slice(0, i + 1), active: key })),
    { phase: 'do', shown: LAYERS, active: 'hydro' },
    { phase: 'do', shown: LAYERS, active: null },
  ];

  function play(step = 0) {
    const s = STEPS[step];
    Object.assign(state, { phase: s.phase, shown: new Set(s.shown), active: s.active, pinned: null });
    render();
    if (step < STEPS.length - 1) timer = setTimeout(() => play(step + 1), step === 0 ? 2800 : 2600);
    else timer = null;
  }

  function showAll() {
    state.shown = new Set(LAYERS);
    state.active = state.pinned;
  }

  studyMap.classList.add('is-js');

  // Labels van lagen als gekleurde pills tekenen
  const makePills = () => {
    const ns = 'http://www.w3.org/2000/svg';
    studyMap.querySelectorAll('.sm-layer .sm-label, .sm-trace .sm-label, .sm-corridor .sm-label').forEach((text) => {
      if (text.previousElementSibling?.classList.contains('sm-pill')) return;
      text.classList.add('sm-pill-text');
      const box = text.getBBox();
      if (!box.width) return;
      const pill = document.createElementNS(ns, 'rect');
      const h = box.height + 5;
      pill.setAttribute('x', box.x - 6);
      pill.setAttribute('y', box.y + box.height / 2 - h / 2);
      pill.setAttribute('width', box.width + 12);
      pill.setAttribute('height', h);
      pill.setAttribute('rx', h / 2);
      pill.classList.add('sm-pill');
      text.before(pill);
    });
  };
  (document.fonts?.ready || Promise.resolve()).then(makePills);
  window.matchMedia('(max-width: 760px)').addEventListener('change', () => {
    studyMap.querySelectorAll('.sm-pill').forEach((pill) => pill.remove());
    makePills();
  });
  if (controls) controls.hidden = false;

  phaseBtns.forEach((btn) => btn.addEventListener('click', () => {
    stopAutoplay();
    state.phase = btn.dataset.phaseBtn;
    if (state.pinned && !applies(state.pinned, state.phase)) state.pinned = null;
    showAll();
    render();
  }));

  if (replayBtn) replayBtn.addEventListener('click', () => { stopAutoplay(); play(0); });

  cards.forEach((card) => {
    const key = card.dataset.layer;
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    const toggle = () => {
      stopAutoplay();
      state.pinned = state.pinned === key ? null : key;
      if (state.pinned && !applies(key, state.phase)) state.phase = 'do';
      showAll();
      render();
    };
    card.addEventListener('click', toggle);
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggle(); }
    });
    card.addEventListener('mouseenter', () => {
      if (timer || !applies(key, state.phase)) return;
      state.shown = new Set(LAYERS);
      state.active = key;
      render();
    });
    card.addEventListener('mouseleave', () => {
      if (timer) return;
      state.active = state.pinned;
      render();
    });
  });

  render();

  if (!reduceMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        observer.disconnect();
        play(0);
      }
    }, { threshold: 0.4 });
    observer.observe(studyMap);
  }
}
