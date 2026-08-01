# Rendering architecture

Companion to [CLAUDE.md](../CLAUDE.md). Covers how a frame actually gets drawn, beyond the game-loop overview in the main file.

## Orchestration vs. actual drawing
- `app/render.ts` is orchestration only: it skips redraw if `state.time` hasn't advanced since the last render, then splits `state.sceneStack` into paused scenes (redrawn from a cached `CanvasBuffer` on the scene, if present) and active scenes (redrawn every frame), painting bottom-to-top.
- `app/renderActor.ts` is hero/enemy-specific render support: animation-frame selection (`getHeroFrame`, a switch on `hero.action`), `renderHeroBarrier`, `renderHeroShadow`, `renderEnemyShadow`. Rendering of arbitrary objects/effects goes through each object's own `.render()` method, not a central dispatcher.
- The gameplay scene's actual area drawing lives in `app/scenes/field/renderField.ts` (`renderStandardFieldStack`, `renderTransition`, `renderMutation`, `translateContextForAreaAndCamera`), not in the top-level `render.ts`.

## Canvas & layers
- Single logical canvas at `CANVAS_WIDTH`/`CANVAS_HEIGHT` = 256×224 (`app/gameConstants.ts`), matching SNES-Zelda-style low-res pixel art. `app/utils/canvas.ts` (`createCanvasAndContext`, `drawCanvas`) manages the actual `CanvasRenderingContext2D`.
- Tile layers are drawn in a fixed order, `layersInOrder` (`app/gameConstants.ts`): `water, floor, floor2, field, field2, foreground, foreground2, foreground3, behaviors`. `foreground3` is rarely needed (only for certain tree combinations). `AreaDefinition.layers` (in zone files) supplies the raw tile-index grid per layer.
- After tile layers, objects/effects are drawn sorted by draw priority (`'background' | 'foreground' | 'sprites' | 'hud' | ...`, `app/types/objects.d.ts`).

## Camera
- `app/updateCamera.ts` eases `state.camera.x/y` toward the target area during scroll transitions. Normal scroll speed is `cameraSpeed = 10`; while the in-game editor is active it's faster (`20`) so content edits feel responsive.
- Once a scroll transition finishes, "changes areas" objects (e.g. a held chakram) are swapped into the new `AreaInstance`.
- `app/scenes/field/renderField.ts`'s `translateContextForAreaAndCamera` applies the current camera offset before drawing an area.

## Lighting & effects
- `app/render/areaLighting.ts` and `app/render/fog.ts` handle darkness/lighting overlays, tied to `LightSource`/`LightColor` (`app/types/objects.d.ts`) and `state.hotLevel`/`fadeLevel`.
- `app/render/renderLightning.ts`, `app/render/renderDamageWarning.ts` — specific effect renderers.
- `app/render/heroAnimations.ts`, `app/render/npcAnimations.ts`, `app/render/astralProjectionAnimations.ts` — animation-frame data consumed by `renderActor.ts` and NPC objects.

## UI chrome
Since `app/ui/` is empty (see main CLAUDE.md), menu/HUD chrome rendering lives here instead:
- `app/render/renderMenuFrame.ts` — menu box/frame drawing
- `app/render/spiritBar.ts` — magic/HP bar rendering plus `updateHeroMagicStats`

## Gotchas
- If a screen looks wrong only during scroll transitions, check `updateCamera.ts` and `renderField.ts`'s transition/mutation branches before the per-object `render()` methods — a lot of transition-specific drawing happens outside the normal per-frame path.
- Paused scenes render from a cached `CanvasBuffer`; if a paused scene isn't reflecting a state change, check whether its buffer needs to be invalidated rather than assuming the `render()` method itself is wrong.
