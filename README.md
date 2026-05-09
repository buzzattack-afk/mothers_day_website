# Mothers Make It Happen

A cinematic Mother's Day tribute — bilingual spoken word in English and Tagalog over five animated scenes.

> *All glory to God. Thank You, Jesus.*

## What this is

A static single-page website. Click **Begin Tribute**, the spoken-word audio plays, and five scenes cross-fade through with subtle camera moves, light, and on-screen captions in both English and Tagalog.

The five scenes:

1. **Mother praying over her family** — slow push-in, warm glow pulse
2. **Mother holding a child's hand** — forward push, growing sunrise flare
3. **Three generations** — gentle camera rise, light shimmer
4. **Mother as the heart of the home** — slow pan, candle flicker
5. **Faith-filled mother near her Bible** — slow zoom, sweeping light rays

## Run locally

The site needs to be served over HTTP (some browsers won't autoplay audio loaded via `file://`).

```powershell
# from this folder
python -m http.server 8000
# then open http://localhost:8000
```

Or with Node:

```powershell
npx serve .
```

## Project layout

```
index.html       Hero + scene stage + closing card
styles.css       Per-scene keyframe animations + captions + layout
script.js        Audio-driven cue advancement (timeupdate)
cues.js          Caption + scene cue list — edit this to tune timing
assets/
  audio/tribute.mp3              ~8 MB, ~6:30 spoken word
  images/scene-{1..5}-*.png      The five tribute photos
```

## Tuning caption timing

If a caption appears too early or late, edit the `time` (in seconds) of the matching entry in [`cues.js`](cues.js). The audio file is ~389.8 seconds (6:29.80) total. Reload the page after editing.

## Keyboard shortcuts (during playback)

- **Space** — pause / resume
- **M** — mute / unmute

## Credits

- Spoken-word script and audio: the project owner
- Photography: AI-generated tribute imagery
- Typography: Cormorant Garamond + Inter (Google Fonts)

To God be the glory.
