(function () {
  function init() {
    var toggles = document.querySelectorAll('.navbar .dropdown-toggle');
    if (!toggles.length) return;

    toggles.forEach(function (toggle) {
      var parent = toggle.closest('.dropdown');
      if (!parent) return;

      toggle.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();

        var isOpen = parent.classList.contains('open');

        // fecha todos os outros
        document.querySelectorAll('.navbar .dropdown.open').forEach(function (d) {
          if (d !== parent) d.classList.remove('open');
        });

        // toggle no clicado
        parent.classList.toggle('open', !isOpen);
      });
    });

    // fecha ao clicar fora da navbar
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.navbar .dropdown')) {
        document.querySelectorAll('.navbar .dropdown.open').forEach(function (d) {
          d.classList.remove('open');
        });
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

(function () {
  function initLightbox() {
    var images = document.querySelectorAll('.crianex-figure img');
    if (!images.length) return;

    var overlay = document.createElement('div');
    overlay.className = 'crianex-lightbox';
    overlay.innerHTML = '<span class="crianex-lightbox-close">✕</span><img class="crianex-lightbox-img" alt="">';
    document.body.appendChild(overlay);

    var overlayImg = overlay.querySelector('.crianex-lightbox-img');

    function close() {
      overlay.classList.remove('open');
    }

    images.forEach(function (img) {
      img.classList.add('crianex-zoomable');
      img.addEventListener('click', function () {
        overlayImg.src = img.currentSrc || img.src;
        overlayImg.alt = img.alt || '';
        overlay.classList.add('open');
      });
    });

    overlay.addEventListener('click', function (e) {
      if (e.target === overlayImg) return;
      close();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLightbox);
  } else {
    initLightbox();
  }
})();
