# FluidVC

**A fast, no-fuss desktop video segment editor.**  



---

## What it does

FluidVC lets you cut one video file into named segments and merge them into a single output file. The whole workflow happens in a single window.

### Workflow

1. **Open a video** — click *Open Video* or drag a file onto the import area.
2. **Mark segments** — scrub to a start point and press `I`, scrub to an end point and press `O`. Repeat for as many clips as you need.
3. **Name your segments** — expand any segment and give it a title. Named segments become chapters in the output file.
4. **Reorder** — drag segments up or down in the list to change the output order.
5. **Export** — choose stream copy (fast, lossless) or re-encode, pick an output path, done.

---

## Features

- **Non-destructive** — the source file is never modified
- **Stream copy mode** — cuts are near-instant and lossless; no quality loss, no waiting for re-encode
- **Re-encode mode** — H.264 / custom codec with adjustable quality (CRF)
- **Named chapters** — segment names are written as chapter metadata in the output (MP4, MKV)
- **Chapter-accurate timestamps** — in stream copy mode, chapter timings are snapped to actual keyframe boundaries
- **Drag-to-reorder** — live drop indicator shows exactly where a segment will land
- **Keyboard shortcuts** — `Space` play/pause, `I`/`O` mark in/out, `←`/`→` step frame
- **Timeline scrubbing** — click or drag the timeline to seek; segment ranges shown as colored overlays
- **Click-to-play** — click the video to toggle playback

---

## Download

Pre-built binaries are on the [Releases](https://github.com/boskobs/FluidVC/releases) page.

| Platform | Format |
|---|---|
| Linux | `.AppImage` (no install needed, just make executable and run) |
| Windows | Portable `.exe` (no install needed) |

---

## Building from source

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for Linux (AppImage)
npm run build:linux

# Build for Windows (portable exe, requires Wine on Linux)
npm run build:win
```

---

## Supported formats

Any container and codec that FFmpeg can read: MP4, MKV, MOV, AVI, WebM, and more.  
Output formats: MP4, MKV, WebM.

---

## License

MIT
