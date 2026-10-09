# Visual assets

## Rover model and loading image

NASA/JPL, Perseverance rover. Official source: https://science.nasa.gov/3d-resources/mars-2020-perseverance-rover/

The original GLB and its preview image are included locally. NASA's 3D resource repository describes these assets as free and without copyright: https://github.com/nasa/NASA-3D-Resources/blob/master/README.md

NASA media guidance: https://www.nasa.gov/nasa-brand-center/images-and-media/

No NASA endorsement is implied. The workshop adds its own terrain, lighting, wheel pivots and arm motion. Motion is illustrative and accelerated; it is not a NASA command sequence, engineering simulation or operating procedure.

## Mars soil

`mars-soil.png` is an AI-generated seamless illustration made with the built-in image generation tool, not a Mars photograph or scientific dataset. No source reference image was used. Generated October 8, 2026, in generate mode.

Prompt: Photorealistic fine rust-red ochre Martian regolith with tiny basalt gravel and subtle wind ripples. Square seamless PBR-style albedo ground texture for tiling beneath a NASA 3D rover scene at human/rover scale. Directly top-down orthographic surface texture, fills entire square, seamless repeating edges in both directions, consistent fine-grained scale. Uniform flat diffuse lighting suitable for albedo mapping, no directional highlights, no shadows baked from large objects. Medium dark burnt sienna brown, natural muted Mars soil, not neon orange. Crisp small-grain detail, fine dusty mineral soil, scattered tiny basalt gravel, subtle low wind ripples. No horizon, rover, text, watermark, large boulders, craters, aerial planet appearance, perspective or vignette.

## Renderer

Three.js 0.186.1 and its official loaders are bundled under `vendor/three`. License: `vendor/three/LICENSE`. No model or renderer CDN is needed when participants load the site.
