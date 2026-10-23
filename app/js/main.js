(function () {
    'use strict';

    var COLUMNS = 5;
    var VISIBLE_ROWS = 2;
    var ROW_STEP = 220 + 44; // tile height + row gap (px)

    var KEY = { LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40, ENTER: 13, BACK: 10009, ESC: 27 };

    var grid = document.getElementById('grid');
    var tiles = [];
    var apps = [];
    var focusIndex = 0;
    var scrollRow = 0;

    function hasTizen() {
        return typeof tizen !== 'undefined' && tizen.application;
    }

    function colorFor(name) {
        var h = 0;
        for (var i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
        return TILE_PALETTE[h % TILE_PALETTE.length];
    }

    function isHidden(appId) {
        return HIDDEN_APP_PATTERNS.some(function (re) { return re.test(appId); });
    }

    /* ---------- Clock ---------- */

    var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
                  'August', 'September', 'October', 'November', 'December'];

    function pad(n) { return n < 10 ? '0' + n : '' + n; }

    function updateClock() {
        var now = new Date();
        var h = now.getHours();
        document.getElementById('time').textContent = pad(h) + ':' + pad(now.getMinutes());
        document.getElementById('date').textContent =
            DAYS[now.getDay()] + ', ' + now.getDate() + ' ' + MONTHS[now.getMonth()] + ' ' + now.getFullYear();
        document.getElementById('greeting').textContent =
            h < 5 ? 'Good night' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    }

    function startClock() {
        updateClock();
        // Align ticks to the start of each minute.
        setTimeout(function () {
            updateClock();
            setInterval(updateClock, 60000);
        }, 60000 - (Date.now() % 60000) + 50);
    }

    /* ---------- App list ---------- */

    function loadApps(done) {
        if (!hasTizen()) {
            done(FAVORITE_APPS.slice());
            return;
        }
        tizen.application.getAppsInfo(function (infos) {
            var installed = {};
            infos.forEach(function (info) { installed[info.id] = info; });

            var list = [];
            FAVORITE_APPS.forEach(function (fav) {
                if (installed[fav.id]) {
                    list.push({ id: fav.id, name: fav.name, color: fav.color, icon: installed[fav.id].iconPath });
                    delete installed[fav.id];
                }
            });

            Object.keys(installed).map(function (id) { return installed[id]; })
                .filter(function (info) { return info.show && !isHidden(info.id); })
                .sort(function (a, b) { return a.name.localeCompare(b.name); })
                .forEach(function (info) {
                    list.push({ id: info.id, name: info.name, color: colorFor(info.name), icon: info.iconPath });
                });

            done(list.length ? list : FAVORITE_APPS.slice());
        }, function (err) {
            console.error('getAppsInfo failed', err);
            done(FAVORITE_APPS.slice());
        });
    }

    function renderTiles() {
        grid.innerHTML = '';
        tiles = apps.map(function (app) {
            var tile = document.createElement('div');
            tile.className = 'tile';
            tile.style.setProperty('--tile', app.color);

            var icon = document.createElement('div');
            icon.className = 'icon';
            icon.textContent = app.name.charAt(0).toUpperCase();
            if (app.icon) {
                var img = new Image();
                img.onload = function () { icon.textContent = ''; icon.appendChild(img); };
                img.src = app.icon.indexOf('://') > 0 ? app.icon : 'file://' + app.icon;
            }

            var label = document.createElement('div');
            label.className = 'label';
            label.textContent = app.name;

            tile.appendChild(icon);
            tile.appendChild(label);
            grid.appendChild(tile);
            return tile;
        });
    }

    /* ---------- Focus & navigation ---------- */

    function setFocus(index) {
        if (!tiles.length) return;
        index = Math.max(0, Math.min(tiles.length - 1, index));
        if (tiles[focusIndex]) tiles[focusIndex].classList.remove('focused');
        focusIndex = index;
        tiles[focusIndex].classList.add('focused');

        var row = Math.floor(focusIndex / COLUMNS);
        if (row < scrollRow) scrollRow = row;
        if (row >= scrollRow + VISIBLE_ROWS) scrollRow = row - VISIBLE_ROWS + 1;
        grid.style.transform = 'translateY(' + (-scrollRow * ROW_STEP) + 'px)';
    }

    function move(dx, dy) {
        var next = focusIndex;
        if (dx) {
            next = focusIndex + dx;
            // Stay within the current row.
            if (Math.floor(next / COLUMNS) !== Math.floor(focusIndex / COLUMNS) || next < 0) return;
        }
        if (dy) {
            next = focusIndex + dy * COLUMNS;
            if (next < 0) return;
            if (next >= tiles.length) {
                // Moving down into a shorter last row: land on its last tile.
                var lastRowStart = Math.floor((tiles.length - 1) / COLUMNS) * COLUMNS;
                if (Math.floor(focusIndex / COLUMNS) * COLUMNS === lastRowStart) return;
                next = tiles.length - 1;
            }
        }
        if (next !== focusIndex && next < tiles.length) setFocus(next);
    }

    var toastTimer;
    function toast(msg) {
        var el = document.getElementById('toast');
        el.textContent = msg;
        el.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2500);
    }

    function launch() {
        var tile = tiles[focusIndex];
        var app = apps[focusIndex];
        if (!tile || !app) return;
        tile.classList.add('pressed');
        setTimeout(function () { tile.classList.remove('pressed'); }, 140);

        if (!hasTizen()) {
            toast('Would launch ' + app.name);
            return;
        }
        tizen.application.launch(app.id, null, function (err) {
            toast('Could not open ' + app.name);
            console.error('launch failed', app.id, err);
        });
    }

    function exitApp() {
        if (hasTizen()) {
            try { tizen.application.getCurrentApplication().exit(); } catch (e) { console.error(e); }
        }
    }

    document.addEventListener('keydown', function (e) {
        switch (e.keyCode) {
            case KEY.LEFT:  move(-1, 0); break;
            case KEY.RIGHT: move(1, 0); break;
            case KEY.UP:    move(0, -1); break;
            case KEY.DOWN:  move(0, 1); break;
            case KEY.ENTER: launch(); break;
            case KEY.BACK:
            case KEY.ESC:   exitApp(); break;
            default: return;
        }
        e.preventDefault();
    });

    // Re-scan apps when we come back to the foreground (e.g. after installing one).
    document.addEventListener('visibilitychange', function () {
        if (!document.hidden) refresh();
    });

    function refresh() {
        loadApps(function (list) {
            var focusedId = apps[focusIndex] && apps[focusIndex].id;
            apps = list;
            renderTiles();
            var idx = 0;
            for (var i = 0; i < apps.length; i++) if (apps[i].id === focusedId) idx = i;
            focusIndex = 0;
            setFocus(idx);
        });
    }

    window.onload = function () {
        startClock();
        refresh();
    };
})();
