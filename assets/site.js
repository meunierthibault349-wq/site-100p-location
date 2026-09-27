/* =================================================================
   100P LOCATION — SHARED SCRIPTS
   - Reveal on scroll (IntersectionObserver)
   - Booking bar : sticky on scroll, no jump, size preserved
   - Contact form : confirm message
   ================================================================= */

(function () {
  /* Hamburger menu mobile : injection automatique ─────────────── */
  (function () {
    var nav = document.querySelector('.topnav__inner');
    if (!nav) return;
    var links = nav.querySelector('.topnav__links');
    if (!links) return;
    if (nav.querySelector('.topnav__burger')) return; // déjà injecté

    var burger = document.createElement('button');
    burger.className = 'topnav__burger';
    burger.type = 'button';
    burger.setAttribute('aria-label', 'Menu');
    burger.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
    burger.addEventListener('click', function (e) {
      e.stopPropagation();
      links.classList.toggle('open');
    });

    // Insère le burger dans .topnav__right (à gauche du bouton Contact)
    var right = nav.querySelector('.topnav__right');
    if (right) {
      right.insertBefore(burger, right.firstChild);
    } else {
      nav.appendChild(burger);
    }

    // Ferme le menu au clic extérieur ou sur un lien
    document.addEventListener('click', function (e) {
      if (!links.classList.contains('open')) return;
      if (!nav.contains(e.target)) links.classList.remove('open');
    });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { links.classList.remove('open'); });
    });
  })();

  /* Reveal on scroll ──────────────────────────────────────────── */
  var els = document.querySelectorAll('[data-reveal]');
  if (els.length) {
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      els.forEach(function (el) { io.observe(el); });
    }
  }

  /* Mobile header : injection + expand/collapse pour
     #booking-bar (visible quand sticky) et .results-bar (toujours) */
  function setupMobileHeader(container, opts) {
    if (!container) return;
    if (container.querySelector(':scope > .bb-mobile-header')) return;

    var insertBefore = opts && opts.insertBefore
      ? container.querySelector(opts.insertBefore)
      : container.firstChild;

    var header = document.createElement('button');
    header.type = 'button';
    header.className = 'bb-mobile-header';
    header.innerHTML =
      '<span class="bb-mobile-header__label">Réserver maintenant</span>' +
      '<svg class="bb-mobile-header__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
    container.insertBefore(header, insertBefore);

    header.addEventListener('click', function (e) {
      e.stopPropagation();
      container.classList.toggle('expanded');
      header.classList.toggle('open');
    });

    document.addEventListener('click', function (e) {
      if (!container.contains(e.target)) {
        container.classList.remove('expanded');
        header.classList.remove('open');
      }
    });
  }

  setupMobileHeader(document.getElementById('booking-bar'));
  setupMobileHeader(document.querySelector('.results-bar'), {
    insertBefore: '.results-bar__inner'
  });

  /* Booking bar sticky toggle ─────────────────────────────────── */
  var bar = document.getElementById('booking-bar');
  if (bar) {
    var STICK_TOP = 28;
    var stuck = false;
    var naturalTop = 0;
    var lockedWidth      = 0;
    var lockedLeft       = 0;
    var lockedHostHeight = 0;
    var host = bar.closest('.bb-host'); // null on index (bar dans .hero__left)

    // Placeholder invisible inséré juste après la barre — préserve
    // l'espace dans le flux quand la barre passe en position:fixed,
    // évite le saut visuel (utile surtout sur mobile)
    var placeholder = document.createElement('div');
    placeholder.className = 'bb-placeholder';
    bar.parentNode.insertBefore(placeholder, bar.nextSibling);

    function setHostHold(on) {
      // Préserve l'espace via le parent .bb-host (desktop secondaires)
      if (host) host.style.minHeight = on ? lockedHostHeight + 'px' : '';
      // Et via le placeholder universel (toutes pages, surtout mobile)
      if (on) {
        placeholder.style.height = bar.offsetHeight + 'px';
        placeholder.style.display = 'block';
      } else {
        placeholder.style.display = 'none';
        placeholder.style.height = '';
      }
    }

    function measure() {
      var wasStuck = stuck;
      if (wasStuck) {
        bar.classList.remove('is-stuck');
        bar.style.width = '';
        bar.style.left = '';
        setHostHold(false);
      }
      var rect = bar.getBoundingClientRect();
      naturalTop  = rect.top + window.scrollY;
      lockedWidth = rect.width;
      lockedLeft  = rect.left;
      // Capture the FULL host height (bar + padding-bottom) so the
      // page below doesn't shift when the bar leaves the flow.
      lockedHostHeight = host ? host.getBoundingClientRect().height : 0;
      if (wasStuck) {
        bar.style.width = lockedWidth + 'px';
        bar.style.left  = lockedLeft  + 'px';
        setHostHold(true);
        bar.classList.add('is-stuck');
      }
    }

    function update() {
      var shouldStick = window.scrollY > naturalTop - STICK_TOP;
      if (shouldStick && !stuck) {
        bar.style.width = lockedWidth + 'px';
        bar.style.left  = lockedLeft  + 'px';
        setHostHold(true);
        bar.classList.add('is-stuck');
        stuck = true;
      } else if (!shouldStick && stuck) {
        bar.classList.remove('is-stuck');
        bar.style.width = '';
        bar.style.left = '';
        setHostHold(false);
        stuck = false;
      }
    }

    var ticking = false;
    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(function () { update(); ticking = false; });
        ticking = true;
      }
    }

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { measure(); update(); }, 100);
    }, { passive: true });

    window.addEventListener('load', measure, { once: true });
  }

  /* Contact form (page contact.html) ──────────────────────────────
     Le vrai envoi est gere par le script en fin de contact.html : il poste
     vers Netlify et n'affiche la confirmation qu'apres reponse du serveur.
     Un second gestionnaire vivait ici, reliquat de maquette, qui simulait le
     succes AVANT toute reponse : il affichait « Message envoye » meme quand
     l'envoi echouait, et se doublait au vrai gestionnaire. Retire le 28/08/2026. */

  /* Booking bar : le calendrier (date + heure) vit dans assets/booking-calendar.js,
     source unique partagee avec index.html depuis le 27/09/2026. */

  /* "Agence" selects (booking bar + bandeau récap) ────────────── */
  (function () {
    var selects = document.querySelectorAll('#bb-lieu-select, #rs-lieu-select');
    if (!selects.length) return;

    var savedValue = sessionStorage.getItem('bb_lieu_value') || '';

    function applyEmptyClass(sel) {
      if (sel.value) sel.classList.remove('is-empty');
      else sel.classList.add('is-empty');
    }

    selects.forEach(function (sel) {
      if (savedValue) sel.value = savedValue;
      applyEmptyClass(sel);

      sel.addEventListener('change', function () {
        var v = sel.value;
        if (v) {
          var label = sel.options[sel.selectedIndex].text;
          sessionStorage.setItem('bb_lieu', label);
          sessionStorage.setItem('bb_lieu_value', v);
        } else {
          sessionStorage.removeItem('bb_lieu');
          sessionStorage.removeItem('bb_lieu_value');
        }
        applyEmptyClass(sel);
        // Sync between selects (if multiple on same page)
        selects.forEach(function (other) {
          if (other !== sel) {
            other.value = sel.value;
            applyEmptyClass(other);
          }
        });
      });
    });
  })();

  /* Bouton "Réserver" + modale : injectés sur toutes pages sauf accueil ── */
  (function () {
    var path = location.pathname.toLowerCase().replace(/\/+$/, '');
    var page = path.substring(path.lastIndexOf('/') + 1);
    var isHome = page === '' || page === 'index.html';
    if (isHome) return;

    var navRight = document.querySelector('.topnav__right');
    if (!navRight) return;

    // ─── Bouton dans la navbar ─────────────────────────
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'reserve-nav-btn';
    btn.setAttribute('aria-haspopup', 'dialog');
    btn.innerHTML =
      'Réserver' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="M13 5l7 7-7 7"/></svg>';
    navRight.appendChild(btn);

    // ─── Modale (structure DOM-safe) ───────────────────
    var modal = document.createElement('div');
    modal.className = 'reserve-modal';
    modal.setAttribute('aria-hidden', 'true');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-label', 'Réservation');

    var backdrop = document.createElement('div');
    backdrop.className = 'reserve-modal__backdrop';
    backdrop.setAttribute('data-close', '');
    modal.appendChild(backdrop);

    var card = document.createElement('div');
    card.className = 'reserve-modal__card';
    modal.appendChild(card);

    card.innerHTML =
      '<button type="button" class="reserve-modal__close" data-close aria-label="Fermer">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
      '</button>' +
      '<h3 class="reserve-modal__title">Réserver</h3>' +
      '<p class="reserve-modal__sub">Choisissez votre secteur, votre véhicule et vos dates.</p>' +
      '<form class="reserve-modal__form" id="reserve-form" novalidate>' +
        '<div class="reserve-modal__field">' +
          '<label class="reserve-modal__label" for="rm-secteur">Secteur</label>' +
          '<select class="reserve-modal__select" id="rm-secteur" required>' +
            '<option value="">Choisir votre secteur</option>' +
            '<option value="Clermont-Ferrand">Clermont-Ferrand</option>' +
            '<option value="Riom">Riom</option>' +
            '<option value="Vichy">Vichy</option>' +
            '<option value="Moulins">Moulins</option>' +
            '<option value="Montluçon">Montluçon</option>' +
          '</select>' +
        '</div>' +
        '<div class="reserve-modal__field">' +
          '<label class="reserve-modal__label" for="rm-vehicule">Véhicule</label>' +
          '<select class="reserve-modal__select" id="rm-vehicule">' +
            '<option value="">Tous les véhicules</option>' +
            '<option value="Aixam City Sport">Aixam City Sport</option>' +
            '<option value="Aixam Minauto">Aixam Minauto</option>' +
            '<option value="Fiat Topolino">Fiat Topolino</option>' +
          '</select>' +
        '</div>' +
        '<div class="reserve-modal__row">' +
          '<div class="reserve-modal__field">' +
            '<label class="reserve-modal__label" for="rm-depart">Départ</label>' +
            '<input type="date" class="reserve-modal__input" id="rm-depart" required />' +
          '</div>' +
          '<div class="reserve-modal__field">' +
            '<label class="reserve-modal__label" for="rm-retour">Retour</label>' +
            '<input type="date" class="reserve-modal__input" id="rm-retour" required />' +
          '</div>' +
        '</div>' +
        '<p class="reserve-modal__error" id="rm-error" role="alert"></p>' +
        '<button type="submit" class="reserve-modal__submit">Continuer</button>' +
      '</form>';

    document.body.appendChild(modal);

    // ─── Open/close ────────────────────────────────────
    function openModal() {
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      var first = modal.querySelector('#rm-secteur');
      if (first) setTimeout(function () { first.focus(); }, 50);
    }
    function closeModal() {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    btn.addEventListener('click', openModal);
    modal.addEventListener('click', function (e) {
      if (e.target.hasAttribute && e.target.hasAttribute('data-close')) closeModal();
      var closest = e.target.closest && e.target.closest('[data-close]');
      if (closest) closeModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
    });

    // Min date = aujourd'hui, retour ≥ départ
    var today = new Date().toISOString().split('T')[0];
    var departInp = modal.querySelector('#rm-depart');
    var retourInp = modal.querySelector('#rm-retour');
    if (departInp) departInp.min = today;
    if (retourInp) retourInp.min = today;
    if (departInp) departInp.addEventListener('change', function () {
      if (retourInp) retourInp.min = departInp.value || today;
    });

    // ─── Submit ────────────────────────────────────────
    var form = modal.querySelector('#reserve-form');
    var errorEl = modal.querySelector('#rm-error');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      errorEl.textContent = '';

      var agence  = form.querySelector('#rm-secteur').value;
      var vehicle = form.querySelector('#rm-vehicule').value;
      var depart  = form.querySelector('#rm-depart').value;
      var retour  = form.querySelector('#rm-retour').value;

      if (!agence) { errorEl.textContent = 'Veuillez choisir un secteur.'; return; }
      if (!depart || !retour) { errorEl.textContent = 'Veuillez renseigner les deux dates.'; return; }
      if (new Date(retour) <= new Date(depart)) {
        errorEl.textContent = 'La date de retour doit être après le départ.';
        return;
      }

      sessionStorage.setItem('bookingData', JSON.stringify({
        agence:       agence,
        date_depart:  depart,
        heure_depart: '09:00',
        date_retour:  retour,
        heure_retour: '18:00'
      }));
      if (vehicle) sessionStorage.setItem('preselectedVehicle', vehicle);
      else         sessionStorage.removeItem('preselectedVehicle');

      window.location.href = 'reservation-resultats.html';
    });
  })();

})();
