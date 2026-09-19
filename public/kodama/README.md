# Kodama

    kodama.webm    the loop — VP9, no audio track
    kodama.mp4     the same loop in h264, for Safari
    kodama.webp    poster frame

These were cut from `assets-source/kodama-source.mp4`; that folder's README has
the exact ffmpeg commands and explains the two decisions behind them (the loop
point, and the crop).

The paths are set in `src/content/site.ts` under `kodama`, and the element
removes itself silently if the files go missing — so an empty folder is a valid
state.

The clip is drawn on white rather than with an alpha channel, so the element is
composited with `mix-blend-mode: multiply` (in `styles/components/kodama.css`),
which keys the white out against the paper. If you ever replace it with a clip
that *does* have alpha, set `--kodama-blend: normal` there.

Playback is always muted — the audio track is stripped from the files
themselves — and it holds on the first frame for visitors who have asked for
reduced motion.
