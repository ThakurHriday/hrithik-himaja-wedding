# Hrithik & Himaja – Wedding Website (v4)

A cinematic opening for the wedding invitation: press **START**, the diyas on the
curved river ghat light one by one towards the temple, the temple glows, fireworks
rise from behind the temple roofline, and the names are revealed —
*An invitation to celebrate love · HRITHIK & HIMAJA*.

Built with TanStack Start, React, TypeScript and Tailwind CSS v4.

## Run locally

```sh
bun install        # or: npm install
bun run dev        # http://localhost:8080
bun run test       # geometry, timing and layout tests
bun run build      # production build
```

## Deploy to GitHub Pages

1. Push this project to a GitHub repository (branch `main`).
2. In the repository: **Settings → Pages → Source: GitHub Actions**.
3. Every push to `main` runs `.github/workflows/deploy-pages.yml`, which tests the
   project, builds a static prerendered site with `PAGES_BASE=/<repo-name>/`, and
   publishes `dist/client`.

To build the Pages version by hand:

```sh
PAGES_BASE=/your-repo-name/ bun run build   # output: dist/client (index.html + assets)
```

For a custom domain or a `<user>.github.io` repository use `PAGES_BASE=/`
(and change `PAGES_BASE` in the workflow to `/`).

### Upload without building

The download also contains ready-built copies next to this project:
`site-build/repo-subpath/` (for `https://<user>.github.io/hrithik-himaja-wedding/`) and
`site-build/domain-root/` (for a custom domain or `<user>.github.io` repo). Upload the
contents of the matching folder to the branch GitHub Pages serves from
(**Settings → Pages → Deploy from a branch**). Both already include `404.html` and `.nojekyll`.

All images, the logo and the music are bundled inside the project — nothing is
loaded from an external builder or CDN apart from Google Fonts.

## How the opening scene works

| File | Purpose |
| --- | --- |
| `src/components/deepotsav/ghat.ts` | Ghat geometry measured from the photo: five concentric tiers (tread lips, risers, waterline) as splines in image coordinates. |
| `src/components/deepotsav/layout.ts` | Responsive image stage (temple never distorted) and diya placement: every lamp is placed on a tread, sized by perspective, and timed so lighting travels along the curve towards the temple. |
| `src/components/deepotsav/GhatLight.tsx` | Warm light on treads, risers and water that follows the lighting sequence, clipped to the ghat. |
| `src/components/deepotsav/Fireworks.tsx` | Canvas fireworks launched from behind the temple roofline, with falling sparks and a water reflection. |
| `src/components/deepotsav/GrandNameReveal.tsx` | Picks the largest free sky area for the names on any screen ratio and plays the staged reveal. |
| `src/components/deepotsav/DeepotsavOpening.tsx` | Phases (idle → lighting → finale) and layer order: sky → fireworks → transparent temple foreground → water reflections → ghat and diyas → names. |
| `src/assets/temple-foreground.webp` | Genuinely transparent temple/treeline cut-out (RGBA WebP) so fireworks sit behind the temple. |
| `src/assets/diya-clay-centre.webp` | Diya sprite re-centred so the flame rises from the middle of the bowl. |
