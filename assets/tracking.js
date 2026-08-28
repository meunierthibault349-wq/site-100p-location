/* ══════════════════════════════════════════════════════════════════
   100P Location — Mesure d'audience et pixel publicitaire
   GA4 + Meta Pixel, charges UNIQUEMENT apres consentement (RGPD/CNIL).

   CONFIGURATION — renseigner les deux identifiants ci-dessous :
   - GA4_ID        : Google Analytics 4, format "G-XXXXXXXXXX"
                     (analytics.google.com → Admin → Flux de donnees)
   - META_PIXEL_ID : Meta Pixel, format numerique "1234567890"
                     (business.facebook.com → Gestionnaire d'evenements)

   Tant que les deux sont vides, ce script ne fait RIEN :
   pas de bandeau, pas de cookie, pas de requete.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var GA4_ID        = 'G-BNJ9TQJEHV';
  var META_PIXEL_ID = '1442777971245421';   // dataset "100P Location — Site web" (portefeuille Meta Lumi)

  /* ── Conversion pour les formulaires envoyes en AJAX ────────────
     Les 4 formulaires du site sont interceptes en JavaScript et affichent
     leur confirmation sur place : la redirection vers /merci n'a JAMAIS lieu,
     donc le generate_lead declenche plus bas sur IS_LEAD_PAGE ne partait pas.
     Chaque formulaire appelle cette fonction dans sa branche succes.
     Elle ne fait rien si le visiteur a refuse les cookies (gtag/fbq absents),
     ce qui respecte le consentement. */
  window.trackLead = function (formName) {
    var nom = formName || 'inconnu';
    try { if (window.gtag) window.gtag('event', 'generate_lead', { form_name: nom }); } catch (e) {}
    try { if (window.fbq)  window.fbq('track', 'Lead', { content_name: nom }); } catch (e) {}
  };

  if (!GA4_ID && !META_PIXEL_ID) return;

  var KEY = '100p-consent';           // 'granted' | 'denied'
  var choice = null;
  try { choice = localStorage.getItem(KEY); } catch (e) {}

  /* ── Chargement des traceurs (apres consentement uniquement) ─── */
  /* La page merci.html = demande de reservation aboutie : comptee
     comme conversion (generate_lead cote GA4, Lead cote Meta). */
  var IS_LEAD_PAGE = /\/merci(\.html)?$/.test(location.pathname);

  function loadTrackers() {
    if (GA4_ID) {
      var s = document.createElement('script');
      s.async = true;
      s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4_ID;
      document.head.appendChild(s);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { dataLayer.push(arguments); };
      gtag('js', new Date());
      gtag('config', GA4_ID, { anonymize_ip: true });
      if (IS_LEAD_PAGE) gtag('event', 'generate_lead');
    }
    if (META_PIXEL_ID) {
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
      n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
      document,'script','https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', META_PIXEL_ID);
      fbq('track', 'PageView');
      if (IS_LEAD_PAGE) fbq('track', 'Lead');
    }
  }

  if (choice === 'granted') { loadTrackers(); return; }
  if (choice === 'denied') return;

  /* ── Bandeau de consentement ───────────────────────────────────── */
  function showBanner() {
    var css =
      '#consent-100p{position:fixed;left:16px;right:16px;bottom:16px;z-index:99999;' +
      'max-width:520px;margin:0 auto;background:#111;color:#f5f5f4;border-radius:14px;' +
      'padding:20px 22px;box-shadow:0 12px 40px rgba(0,0,0,.35);' +
      'font-family:"Geist",system-ui,sans-serif;font-size:14px;line-height:1.55}' +
      '#consent-100p p{margin:0 0 14px}' +
      '#consent-100p a{color:#f5f5f4;text-decoration:underline}' +
      '#consent-100p .c-actions{display:flex;gap:10px;flex-wrap:wrap}' +
      '#consent-100p button{cursor:pointer;border:0;border-radius:9px;' +
      'padding:10px 18px;font:inherit;font-weight:600}' +
      '#consent-100p .c-ok{background:#E8640A;color:#fff}' +
      '#consent-100p .c-no{background:transparent;color:#d6d3d1;' +
      'border:1px solid rgba(255,255,255,.25)}' +
      /* Mobile : en haut, pour ne pas recouvrir le moteur de reservation. */
      '@media(max-width:600px){#consent-100p{top:12px;bottom:auto;padding:16px 18px;font-size:13px}' +
      '#consent-100p p{margin:0 0 12px}}';
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    var box = document.createElement('div');
    box.id = 'consent-100p';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', 'Consentement cookies');
    box.innerHTML =
      '<p>On aimerait mesurer l’audience du site et l’efficacité de nos ' +
      'publicités (Google Analytics, Meta). Aucune donnée n’est collectée ' +
      'sans votre accord. <a href="confidentialite.html">En savoir plus</a></p>' +
      '<div class="c-actions">' +
      '<button type="button" class="c-ok">Accepter</button>' +
      '<button type="button" class="c-no">Continuer sans accepter</button>' +
      '</div>';

    box.querySelector('.c-ok').addEventListener('click', function () {
      try { localStorage.setItem(KEY, 'granted'); } catch (e) {}
      box.remove();
      loadTrackers();
    });
    box.querySelector('.c-no').addEventListener('click', function () {
      try { localStorage.setItem(KEY, 'denied'); } catch (e) {}
      box.remove();
    });

    document.body.appendChild(box);

    /* Ancre en haut, le bandeau ne bloquait plus le champ de date mais il
       recouvrait l'en-tete et coupait le titre : au premier chargement le
       visiteur ne voyait ni le logo, ni le menu, ni le debut de l'accroche
       (releve du 28/08/2026, iPhone 390x844). On DECALE donc la page de la
       hauteur du bandeau au lieu de la recouvrir. L'en-tete etant en
       position sticky, il faut aussi repousser son point d'accroche, sinon
       il repasse sous le bandeau des le premier defilement. */
    var decale = null;
    function decaler() {
      if (!matchMedia('(max-width: 600px)').matches) return;
      /* Mesurer le BAS reel du bandeau, pas sa hauteur supposee : le texte
         se recompose quand la police de la page finit de charger, et un
         calcul fait trop tot laissait l'en-tete passer dessous de 8px
         (constate au test du 28/08). L'observateur ci-dessous rejoue le
         calcul a chaque changement de hauteur. */
      var h = box.getBoundingClientRect().bottom + 12;
      document.documentElement.style.setProperty('--bandeau-h', h + 'px');
      if (!decale) {
        decale = document.createElement('style');
        // !important necessaire : index.html impose .topnav{top:0 !important}
        // dans ses styles en ligne, une regle normale ne passerait pas.
        decale.textContent =
          '@media(max-width:600px){' +
          'body{padding-top:var(--bandeau-h) !important}' +
          '.topnav{top:var(--bandeau-h) !important}}';
        document.head.appendChild(decale);
      }
    }
    var observateur = null;
    function retablirDecalage() {
      if (observateur) { observateur.disconnect(); observateur = null; }
      if (decale) { decale.remove(); decale = null; }
      document.documentElement.style.removeProperty('--bandeau-h');
    }
    decaler();
    addEventListener('resize', decaler);
    if (window.ResizeObserver) {
      observateur = new ResizeObserver(decaler);
      observateur.observe(box);
    } else {
      // Repli pour les navigateurs sans ResizeObserver : on recalcule une fois
      // les polices chargees, moment ou la hauteur du bandeau se fige.
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(decaler);
      setTimeout(decaler, 1200);
    }
    box.querySelector('.c-ok').addEventListener('click', retablirDecalage);
    box.querySelector('.c-no').addEventListener('click', retablirDecalage);

    /* Sur mobile le bandeau (~184 px) tombait exactement sur le moteur de
       reservation : un tap sur « Date de depart » atterrissait sur le bouton
       « Continuer sans accepter ». Un padding sur le body ne resout rien, le
       moteur est en milieu de page et ne bouge pas. Le bandeau est donc
       ancre EN HAUT sous 600 px (regle CSS ci-dessus), ou il ne recouvre que
       l'en-tete. On masque aussi le bouton de chat flottant, qui occupe la
       meme bande basse. */
    var chat = document.querySelector('.chatbot-toggle');
    if (chat) chat.style.visibility = 'hidden';
    function retablir() { if (chat) chat.style.visibility = ''; }
    box.querySelector('.c-ok').addEventListener('click', retablir);
    box.querySelector('.c-no').addEventListener('click', retablir);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showBanner);
  } else {
    showBanner();
  }
})();
