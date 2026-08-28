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

  /* Booking bar : custom calendar dropdown (date + heure) ─────── */
  (function () {
    var departField = document.getElementById('bb-depart-field');
    var retourField = document.getElementById('bb-retour-field');
    if (!departField || !retourField) return;

    var MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
    var SHORT  = ['jan.','fév.','mar.','avr.','mai','jui.','jul.','aoû.','sep.','oct.','nov.','déc.'];
    var DOW    = ['Lu','Ma','Me','Je','Ve','Sa','Di'];
    var SLOTS  = ['09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00','18:30'];

    var today = new Date(); today.setHours(0,0,0,0);
    var state = {
      depart: { date: null, time: null, month: today.getMonth(), year: today.getFullYear() },
      retour: { date: null, time: null, month: today.getMonth(), year: today.getFullYear() }
    };
    // Restore previously selected dates (from any other page in the session)
    ['depart','retour'].forEach(function (id) {
      var d = sessionStorage.getItem('bb_' + id + '_date');
      var t = sessionStorage.getItem('bb_' + id + '_time');
      if (d) {
        var dt = new Date(d);
        if (!isNaN(dt.getTime())) {
          state[id].date  = dt;
          state[id].month = dt.getMonth();
          state[id].year  = dt.getFullYear();
          state[id].time  = t || '09:00';
        }
      }
    });
    var openId = null;

    ['depart','retour'].forEach(function (id) {
      var el = document.createElement('div');
      el.className = 'bb-cal-dropdown';
      el.id = 'bb-cal-' + id;
      el.setAttribute('role', 'dialog');
      el.addEventListener('click', function (e) { e.stopPropagation(); });
      document.body.appendChild(el);
    });

    function formatDisplay(s) {
      if (!s.date) return '';
      return s.date.getDate() + ' ' + SHORT[s.date.getMonth()] + ' · ' + (s.time || '09:00');
    }

    function updateDisplay(id) {
      var el = document.getElementById('bb-' + id + '-display');
      if (!el) return;
      var txt = formatDisplay(state[id]);
      if (txt) {
        el.textContent = txt;
        el.classList.remove('placeholder');
      } else {
        el.textContent = 'Choisir une date';
        el.classList.add('placeholder');
      }
      // Persist for the next pages (vehicules / reservation)
      var s = state[id];
      if (s.date) {
        sessionStorage.setItem('bb_' + id + '_date', s.date.toISOString());
        sessionStorage.setItem('bb_' + id + '_time', s.time || '09:00');
      } else {
        sessionStorage.removeItem('bb_' + id + '_date');
        sessionStorage.removeItem('bb_' + id + '_time');
      }
    }

    function renderCal(id) {
      var s = state[id];
      var first = new Date(s.year, s.month, 1);
      var off  = (first.getDay() + 6) % 7;
      var days = new Date(s.year, s.month + 1, 0).getDate();

      var h = '';
      h += '<div class="bb-cal-header">';
      h +=   '<button class="bb-cal-nav" data-dir="-1" aria-label="Mois précédent">&#8249;</button>';
      h +=   '<span class="bb-cal-title">' + MONTHS[s.month] + ' ' + s.year + '</span>';
      h +=   '<button class="bb-cal-nav" data-dir="1" aria-label="Mois suivant">&#8250;</button>';
      h += '</div>';
      h += '<div class="bb-cal-grid">';
      DOW.forEach(function (d) { h += '<div class="bb-cal-dow">' + d + '</div>'; });
      for (var i = 0; i < off; i++) h += '<div class="bb-cal-day empty"></div>';
      for (var d = 1; d <= days; d++) {
        var dt  = new Date(s.year, s.month, d);
        var cls = 'bb-cal-day';
        if (dt < today) cls += ' disabled';
        if (s.date && dt.toDateString() === s.date.toDateString()) cls += ' selected';
        h += '<div class="' + cls + '" data-day="' + d + '">' + d + '</div>';
      }
      h += '</div>';

      if (s.date) {
        h += '<div class="bb-cal-sep"></div>';
        h += '<div class="bb-cal-time-label">Heure</div>';
        h += '<div class="bb-cal-slots">';
        SLOTS.forEach(function (slot) {
          h += '<button class="bb-cal-slot' + (s.time === slot ? ' selected' : '') + '" data-slot="' + slot + '">' + slot + '</button>';
        });
        h += '</div>';
      }

      var cal = document.getElementById('bb-cal-' + id);
      cal.innerHTML = h;

      cal.querySelectorAll('.bb-cal-nav').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          s.month += parseInt(btn.dataset.dir, 10);
          if (s.month > 11) { s.month = 0; s.year++; }
          if (s.month < 0)  { s.month = 11; s.year--; }
          renderCal(id);
        });
      });
      cal.querySelectorAll('.bb-cal-day:not(.disabled):not(.empty)').forEach(function (el) {
        el.addEventListener('click', function (e) {
          e.stopPropagation();
          s.date = new Date(s.year, s.month, parseInt(el.dataset.day, 10));
          if (!s.time) s.time = '09:00';
          renderCal(id);
          updateDisplay(id);
        });
      });
      cal.querySelectorAll('.bb-cal-slot').forEach(function (el) {
        el.addEventListener('click', function (e) {
          e.stopPropagation();
          s.time = el.dataset.slot;
          renderCal(id);
          updateDisplay(id);
        });
      });

      // Le contenu vient de changer, donc la hauteur aussi : selectionner un
      // jour ajoute 20 creneaux horaires (+288px mesures), et un mois sur
      // 6 lignes est plus haut qu'un mois sur 5. Sans ce recalcul, le bas du
      // panneau sort de la fenetre et, en position:fixed, devient
      // definitivement inatteignable.
      positionCal(id);
    }

    function positionCal(id) {
      var field = document.getElementById('bb-' + id + '-field');
      var cal   = document.getElementById('bb-cal-' + id);
      if (!field || !cal) return;
      // Fenetre etroite OU basse : la CSS prend la main, feuille ancree en bas.
      // Condition identique a celle de la feuille dans la CSS.
      if (window.matchMedia('(max-width: 600px), (max-height: 560px)').matches) return;

      var rect = field.getBoundingClientRect();
      // Borne a la hauteur reellement affichable : au-dela, max-height ecrete le
      // panneau et raisonner sur offsetHeight fausserait le calcul de place.
      var h    = Math.min(cal.offsetHeight || 360, window.innerHeight - 24);
      var sous = window.innerHeight - rect.bottom - 8;   // place disponible dessous
      // Pas la place dessous mais de la place dessus : on ouvre vers le haut.
      var top  = (sous < h && rect.top > h + 8) ? rect.top - h - 8 : rect.bottom + 8;
      // Et dans tous les cas on garde le panneau a l'interieur de l'ecran.
      top = Math.max(8, Math.min(top, window.innerHeight - h - 8));
      cal.style.top  = top + 'px';
      cal.style.left = Math.min(rect.left, window.innerWidth - 320 - 16) + 'px';
    }

    function closeAll() {
      document.querySelectorAll('.bb-cal-dropdown').forEach(function (c) { c.classList.remove('is-open'); });
      document.querySelectorAll('.bb-field').forEach(function (f) {
        f.classList.remove('is-open');
        f.setAttribute('aria-expanded', 'false');
      });
      openId = null;
    }

    function openCal(id) {
      if (openId === id) { closeAll(); return; }
      closeAll();
      var field = document.getElementById('bb-' + id + '-field');
      var cal   = document.getElementById('bb-cal-' + id);
      renderCal(id);
      // Ouvrir d'abord : tant que le panneau est en display:none, sa hauteur
      // vaut 0 et le positionnement ne peut pas savoir s'il tient a l'ecran.
      // Aucun scintillement, le navigateur ne peint pas entre deux instructions.
      cal.classList.add('is-open');
      positionCal(id);
      field.classList.add('is-open');
      field.setAttribute('aria-expanded', 'true');
      openId = id;
    }

    ['depart','retour'].forEach(function (id) {
      var field = document.getElementById('bb-' + id + '-field');
      if (!field) return;
      field.addEventListener('click', function (e) { e.stopPropagation(); openCal(id); });
      field.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCal(id); }
      });
    });

    // Display restored values immediately at load
    updateDisplay('depart');
    updateDisplay('retour');

    document.addEventListener('click', closeAll);
    window.addEventListener('resize', function () { if (openId) positionCal(openId); });
    window.addEventListener('scroll', function () { if (openId) positionCal(openId); }, { passive: true });
  })();

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
