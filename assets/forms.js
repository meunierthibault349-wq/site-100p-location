/* ══════════════════════════════════════════════════════════════════
   100P Location — Anti double-envoi des formulaires

   POURQUOI : les 4 formulaires du site sont envoyes en AJAX. Entre le
   tap et la reponse de Netlify, rien ne changeait a l'ecran : le bouton
   restait actif et le formulaire visible. Un visiteur qui retape (reflexe
   normal sur mobile, ou la connexion est lente) envoyait 2, 3, 8 fois la
   meme demande.

   CE N'EST PAS COSMETIQUE. Verifie le 28/08/2026 sur les donnees Netlify :
   une demande du 06/08 enregistree 3 fois, une du 10/08 2 fois, et une
   salve de 8 copies identiques du 28/05 que Netlify a classee EN SPAM.
   Le risque reel n'est donc pas le doublon, c'est qu'une vraie cliente
   qui insiste voie sa demande partir au spam et ne soit jamais rappelee.

   COMMENT : chaque handler verrouille son formulaire juste avant le fetch
   et le deverrouille si l'envoi echoue (en cas de succes le formulaire est
   masque, il n'y a rien a rouvrir). Un ecouteur en phase de capture sert
   de filet : tant qu'un formulaire est verrouille, aucun second envoi
   n'atteint le handler de la page, y compris par la touche Entree.
   Un delai de securite deverrouille au bout de 20 s pour qu'un incident
   reseau ne laisse jamais un visiteur devant un bouton mort.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var VERROU  = 'data-envoi-en-cours';
  var SECURITE = 20000;

  /* Aucun style :disabled n'existe dans site.css, et index.html ne charge
     meme pas cette feuille : le bouton verrouille paraitrait cliquable.
     On injecte donc le retour visuel ici, le script reste autonome. */
  var style = document.createElement('style');
  style.textContent =
    'form[' + VERROU + '] button[type="submit"],' +
    'form[' + VERROU + '] input[type="submit"]' +
    '{opacity:.6;cursor:progress;pointer-events:none}';
  document.head.appendChild(style);

  function boutonDe(form) {
    return form.querySelector('button[type="submit"], input[type="submit"]');
  }

  /* Renvoie false si un envoi est deja en cours : l'appelant doit alors
     abandonner son fetch. */
  function verrouiller(form) {
    if (!form || form.hasAttribute(VERROU)) return false;
    form.setAttribute(VERROU, '1');

    var b = boutonDe(form);
    if (b) {
      b._libelleInitial = b.innerHTML;
      b.disabled = true;
      b.textContent = 'Envoi en cours…';
    }
    form._delaiSecurite = setTimeout(function () { deverrouiller(form); }, SECURITE);
    return true;
  }

  function deverrouiller(form) {
    if (!form) return;
    clearTimeout(form._delaiSecurite);
    form.removeAttribute(VERROU);

    var b = boutonDe(form);
    if (b) {
      b.disabled = false;
      if (b._libelleInitial != null) b.innerHTML = b._libelleInitial;
    }
  }

  /* Filet de securite, en phase de capture donc AVANT le handler de la page. */
  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (form instanceof HTMLFormElement && form.hasAttribute(VERROU)) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }, true);

  window.formGuard = { verrouiller: verrouiller, deverrouiller: deverrouiller };
})();
