# Kept out of the build

Originals and retired work — nothing in here ships.

`kodama-source.mp4` — the original clip (1280×720, 10s, 24fps, with an audio
track). It is **not** shipped; the files in `public/kodama/` were cut from it.

Two things had to be handled:

1. **It does not loop.** The clip starts with the head turned and ends facing
   forward, so playing it on repeat snapped every ten seconds. Comparing every
   frame against every other found a pair that matches almost exactly —
   **2.583s → 7.667s** — so the shipped loop is that span of the original
   animation, untouched, just with better in and out points.
2. **The creature occupies a small part of a 16:9 frame.** Cropped to
   `340×500` at `456,126`, which is the subject's bounding box across the whole
   clip plus breathing room, then scaled to 256px tall.

To regenerate:

```bash
SRC=assets-source/kodama-source.mp4
VF="crop=340:500:456:126,scale=-2:256"
ffmpeg -y -ss 2.583333 -i $SRC -frames:v 122 -an -vf "$VF" \
  -c:v libvpx-vp9 -crf 32 -b:v 0 -row-mt 1 -cpu-used 1 public/kodama/kodama.webm
ffmpeg -y -ss 2.583333 -i $SRC -frames:v 122 -an -vf "$VF" \
  -c:v libx264 -crf 24 -preset slow -pix_fmt yuv420p -movflags +faststart public/kodama/kodama.mp4
ffmpeg -y -ss 2.583333 -i $SRC -frames:v 1 -vf "$VF" -quality 88 public/kodama/kodama.webp
```

The audio track is dropped at the encode (`-an`), so the shipped files have no
sound at all — muted playback is enforced in the markup and in `lib/kodama.ts`
as well.
