/* =================================================================
   100P Location · Calendrier du booking bar (date + heure)
   -----------------------------------------------------------------
   Source unique, chargee par index.html et reservation-resultats.html
   (les deux seules pages qui portent #bb-depart-field / #bb-retour-field).
   Remplace les deux copies divergentes qui vivaient jusqu'au 27/09/2026
   dans index.html (inline) et dans assets/site.js : tout correctif
   devait etre applique deux fois.

   Comportement retenu, celui de l'accueil : deux vues, les jours puis
   les heures (le panneau garde sa hauteur au lieu de passer de 406 a
   694px), fermeture au choix de l'heure. Repris de la copie site.js :
   les dates deja choisies sur une autre page sont restaurees a
   l'ouverture (sessionStorage bb_depart_* / bb_retour_*).

   Charge en synchrone, a la place exacte des anciennes copies, pour
   garder l'ordre d'execution des scripts de page.
   ================================================================= */
(function () {
  var departField = document.getElementById('bb-depart-field');
  var retourField = document.getElementById('bb-retour-field');
  if (!departField || !retourField) return;

  // Point d'entree unique pour de vraies indisponibilites. Aucune
  // indisponibilite fictive : toutes les dates futures sont libres.
  function getBookedDates() {
    return new Set();
  }

  var MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  var SHORT  = ['jan.','fév.','mar.','avr.','mai','jui.','jul.','aoû.','sep.','oct.','nov.','déc.'];
  var DOW    = ['Lu','Ma','Me','Je','Ve','Sa','Di'];
  var SLOTS  = ['09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00','18:30'];

  var today = new Date(); today.setHours(0,0,0,0);
  var state = {
    depart: { date: null, time: null, month: today.getMonth(), year: today.getFullYear(), view: 'days' },
    retour: { date: null, time: null, month: today.getMonth(), year: today.getFullYear(), view: 'days' }
  };
  // Restaure les dates choisies sur une autre page de la session
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
    var h = '';
    var cal = document.getElementById('bb-cal-' + id);

    if (s.view === 'hours' && s.date) {
      // Vue heures : après avoir choisi une date, on demande l'heure
      var dateLabel = s.date.getDate() + ' ' + MONTHS[s.date.getMonth()] + ' ' + s.date.getFullYear();
      h += '<div class="bb-cal-header">';
      h +=   '<button class="bb-cal-back" data-back aria-label="Retour au calendrier">&#8249; Changer</button>';
      h +=   '<span class="bb-cal-title">' + dateLabel + '</span>';
      h +=   '<span style="width:32px"></span>';
      h += '</div>';
      h += '<div class="bb-cal-time-label">Choisissez une heure</div>';
      h += '<div class="bb-cal-slots">';
      SLOTS.forEach(function (slot) {
        h += '<button class="bb-cal-slot' + (s.time === slot ? ' selected' : '') + '" data-slot="' + slot + '">' + slot + '</button>';
      });
      h += '</div>';

      cal.innerHTML = h;

      cal.querySelectorAll('[data-back]').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          s.view = 'days';
          renderCal(id);
        });
      });
      cal.querySelectorAll('.bb-cal-slot').forEach(function (el) {
        el.addEventListener('click', function (e) {
          e.stopPropagation();
          s.time = el.dataset.slot;
          updateDisplay(id);
          closeAll();
        });
      });

      // Le contenu vient de changer, donc la hauteur aussi : le panneau
      // bascule entre vue jours et vue horaires. Sans ce recalcul, le bas
      // du panneau peut sortir de la fenetre et, en position:fixed,
      // devenir definitivement inatteignable.
      positionCal(id);
      return;
    }

    // Vue jours (par défaut)
    var first = new Date(s.year, s.month, 1);
    var off  = (first.getDay() + 6) % 7;
    var days = new Date(s.year, s.month + 1, 0).getDate();

    h += '<div class="bb-cal-header">';
    h +=   '<button class="bb-cal-nav" data-dir="-1" aria-label="Mois précédent">&#8249;</button>';
    h +=   '<span class="bb-cal-title">' + MONTHS[s.month] + ' ' + s.year + '</span>';
    h +=   '<button class="bb-cal-nav" data-dir="1" aria-label="Mois suivant">&#8250;</button>';
    h += '</div>';
    h += '<div class="bb-cal-grid">';
    DOW.forEach(function (d) { h += '<div class="bb-cal-dow">' + d + '</div>'; });
    for (var i = 0; i < off; i++) h += '<div class="bb-cal-day empty"></div>';
    var bookedDates = getBookedDates();
    for (var d = 1; d <= days; d++) {
      var dt  = new Date(s.year, s.month, d);
      var cls = 'bb-cal-day';
      if (dt < today) cls += ' disabled';
      else if (bookedDates.has(dt.toDateString())) cls += ' disabled booked';
      if (s.date && dt.toDateString() === s.date.toDateString()) cls += ' selected';
      h += '<div class="' + cls + '" data-day="' + d + '">' + d + '</div>';
    }
    h += '</div>';

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
        s.view = 'hours';
        updateDisplay(id);
        renderCal(id);
      });
    });

    // Meme raison : un mois sur 6 lignes est plus haut qu'un mois sur 5,
    // la place disponible doit etre recalculee a chaque rendu.
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
    state[id].view = 'days';
    renderCal(id);
    // Ouvrir d'abord : tant que le panneau est en display:none sa hauteur
    // vaut 0, et le positionnement ne peut pas savoir s'il tient a l'ecran.
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

  // Affiche tout de suite les dates restaurees
  updateDisplay('depart');
  updateDisplay('retour');

  document.addEventListener('click', closeAll);
  window.addEventListener('resize', function () { if (openId) positionCal(openId); });
  window.addEventListener('scroll', function () { if (openId) positionCal(openId); }, { passive: true });
})();
