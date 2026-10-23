# TinkerSpace TV

Two Tizen web apps for a Samsung Smart TV at TinkerSpace Calicut:

- **`tinkerspace/` — TinkerSpace**: a full-screen display of
  [TinkerSpace Calicut](https://jasimcm.github.io/tinkerspace_digital_calicut/).
  It fetches the live site from GitHub Pages on every launch, keeps the TV's
  screen saver off, ignores the Back key, reloads every 6 hours to pick up new
  deploys, and recovers automatically when the network comes back.
- **`app/` — TV Home**: a custom launcher with big app tiles, focus animations,
  remote-control navigation (arrows + OK) and a clock with the date.

Tested on a 2025 Samsung UA75U7300 (Tizen 9.0).

## Requirements

- [Tizen Studio](https://developer.tizen.org/development/tizen-studio/download) with the
  **Samsung TV extension** and **Samsung Certificate Extension** (Package Manager →
  Extension SDK).
- TV in **Developer Mode** (Apps → type `12345` → Developer mode On, host PC IP), connected with
  `sdb connect <tv-ip>:26101`.
- A **Samsung certificate profile** created in Certificate Manager (Samsung → TV) that includes
  your TV's DUID (`sdb shell 0 getduid`).

## Build, sign and install

```sh
TIZEN=~/tizen-studio/tools/ide/bin/tizen
PROFILE=<your-certificate-profile>
TV=<tv-ip>:26101

cd tinkerspace          # or: cd app
$TIZEN build-web -e ".*" -e "*.wgt" -- .
$TIZEN package -t wgt -s $PROFILE -o ../dist -- .buildResult
$TIZEN install -n ../dist/TinkerSpace.wgt -s $TV
$TIZEN run -p TnkSpace01.TinkerSpace -s $TV
```

For TV Home use `../dist/TV Home.wgt` and app ID `TvHome0001.TvHome`.

## Notes

- **Why the site isn't in an iframe:** the site asks for a key press to enter fullscreen
  unless `document.fullscreenElement` is set, and key presses never reach a cross-origin
  iframe. The app instead loads the site's own scripts and styles into its page and
  reports the page as already full screen, since a TV app always is.
- **Content Security Policy:** Tizen blocks remote scripts and styles in packaged apps by
  default, so `tinkerspace/config.xml` declares a permissive policy. Narrow it if the app
  ever loads anything other than this site.
- **Starting at power-on:** retail Samsung TVs don't let side-loaded apps auto-start.
  *Autorun Last App* ignores them and `on-boot` web services are not allowed with a public
  certificate. Pin TinkerSpace to the first spot on the Home bar so it is **Home → OK**
  after switching on.
- **TV settings for an always-on display:** General & Privacy → Power and Energy Saving →
  Auto Power Off **Off**; System Manager → Time → Sleep Timer / Off Timer **Off**.
