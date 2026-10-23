(function () {
    'use strict';

    var SITE_URL = 'https://jasimcm.github.io/tinkerspace_digital_calicut/';
    var RELOAD_EVERY_MS = 6 * 60 * 60 * 1000;    // pick up site updates
    var SCREENSAVER_EVERY_MS = 5 * 60 * 1000;   // re-assert "no screen saver"
    var RETRY_MS = 15 * 1000;

    var offline = document.getElementById('offline');

    // A TV app is always full screen, but the site shows a "press any button to
    // enter fullscreen" overlay unless the Fullscreen API says so. Report the
    // page as already full screen so the site runs unattended.
    try {
        Object.defineProperty(document, 'fullscreenElement', {
            get: function () { return document.documentElement; }
        });
        document.documentElement.requestFullscreen = function () { return Promise.resolve(); };
    } catch (e) {
        console.error('fullscreen shim failed', e);
    }

    function keepAwake() {
        try {
            webapis.appcommon.setScreenSaver(webapis.appcommon.AppCommonScreenSaverState.SCREEN_SAVER_OFF);
        } catch (e) {
            console.error('setScreenSaver failed', e);
        }
    }

    // Mute the TV while the display is on screen and unmute when another app
    // comes to the front, so other apps always have sound.
    function setMute(muted) {
        try {
            tizen.tvaudiocontrol.setMute(muted);
        } catch (e) {
            console.error('setMute failed', e);
        }
    }

    function muteWhileShown() { setMute(true); }
    function restoreSound() { setMute(false); }

    // Fetch the live index.html and mount its stylesheets and scripts here, so
    // the site always runs its latest deploy with this page as its document.
    function loadSite() {
        fetch(SITE_URL + '?t=' + Date.now(), { cache: 'no-store' })
            .then(function (res) {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.text();
            })
            .then(function (html) {
                var doc = new DOMParser().parseFromString(html, 'text/html');

                var base = document.createElement('base');
                base.href = SITE_URL;
                document.head.insertBefore(base, document.head.firstChild);

                doc.querySelectorAll('link[rel="stylesheet"]').forEach(function (l) {
                    var link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = new URL(l.getAttribute('href'), SITE_URL).href;
                    document.head.appendChild(link);
                });
                doc.querySelectorAll('script[src]').forEach(function (s) {
                    var script = document.createElement('script');
                    script.src = new URL(s.getAttribute('src'), SITE_URL).href;
                    script.defer = true;
                    document.body.appendChild(script);
                });
                offline.classList.remove('show');
            })
            .catch(function (err) {
                console.error('site load failed', err);
                offline.classList.add('show');
                setTimeout(loadSite, RETRY_MS);
            });
    }

    window.addEventListener('online', function () {
        if (offline.classList.contains('show')) location.reload();
    });
    window.addEventListener('offline', function () {
        offline.classList.add('show');
    });

    // Stay open: swallow Back. Home is handled by the TV and still opens Smart Hub.
    document.addEventListener('keydown', function (e) {
        if (e.keyCode === 10009) e.preventDefault();
    });

    document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
            restoreSound();
        } else {
            keepAwake();
            muteWhileShown();
        }
    });

    loadSite();
    keepAwake();
    muteWhileShown();
    setInterval(keepAwake, SCREENSAVER_EVERY_MS);
    setInterval(function () { location.reload(); }, RELOAD_EVERY_MS);
})();
