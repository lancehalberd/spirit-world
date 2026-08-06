# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Spirit World is a browser-based, Zelda-like adventure game rendered on a low-res (256×224) canvas, written in TypeScript. There is no backend beyond a static file server — all game logic runs client-side.

## Commands

- Install: `nvm use && npm install` (Node version pinned in `.nvmrc`)
- Run locally: `npm start` — runs webpack (watch mode) and the express server concurrently. Visit `http://localhost:3000`; wait for the initial webpack compile to finish before the page will work.
- Run pieces separately: `npm run webpack` (watch-compiles `app/` → `public/client.js`), `npm run server` (serves `public/`, port 3000 or `$PORT`)
- `public/client.js` is webpack's compiled build output (checked in so the static server has something to serve), not hand-written source — never read, edit, or review it; the real source is under `app/`.
- Type-check without emitting: `npx tsc --noEmit` (webpack/ts-loader type-checks on build already, but this is faster for a standalone check)
- Find dead exports: `npx ts-unused-exports tsconfig.json`
- There is no test suite (`npm test` is a stub) and no configured linter/formatter.
- Debug/difficulty query params: append `?challenge=easy` or `?challenge=hard` to the local URL to apply preset `gameModifiers` (`app/gameConstants.ts`); individual modifiers can also be overridden via their own query params (e.g. `?bowDamage=2`).

## Big-picture architecture

### Entry point & game loop
`app/client.ts` is the composition root: it side-effect-imports every content/scene/registry module (so they register themselves — see "Registry pattern" below) before starting two independent loops:
- **Update loop**: `setTimeout`-driven, `FRAME_LENGTH = 20ms` (50Hz), with throttle-detection that switches to a higher-granularity catch-up mode if 20 consecutive frames run late (survives background-tab timer throttling).
- **Render loop**: `requestAnimationFrame`-driven. Calls `render()` then `updateMusic(state)` each frame.

`app/update.ts` walks `state.sceneStack` top-to-bottom calling each scene's `update()`, respecting `blocksInput`/`blocksUpdates`. `app/render.ts` renders the stack bottom-to-top, using a cached `CanvasBuffer` for paused scenes so they don't redraw every frame.

### Global mutable state
`app/state.ts` holds a single module-level `let state: GameState`, accessed via `getState()` (also exposed as `window.getState` for console debugging). Nearly every function takes `state` as its first argument rather than reading a shared import — this is the thread-through mechanism for the whole codebase.

`GameState` (`app/types/state.d.ts`) is a large global ambient interface (no import needed anywhere) with the major fields:
- `sceneStack` — the scene stack / top-level state machine (see Scenes below)
- `hero` — the player `Actor`
- `zone` / `floor` / `areaGrid` / `location` — current world position
- `areaSet` / `nextAreaSet` — current + alternate (material/spirit world) `AreaInstance`s, swapped during screen transitions
- `savedState: SavedState` — the persisted slice (inventory, flags, per-slot data — `app/savedState.ts`); up to 3 (normal) / 10 (randomizer) save slots
- `randomizerState?` / `generatedLogicNodes` — working state for the randomizer and procedural generator systems (see companion doc)

All game types live in `app/types/*.d.ts` as global ambient declarations, which is why files reference `GameState`, `Hero`, `Zone`, etc. with no `import`. One related gotcha: to avoid circular-import `instanceof` issues, a few classes (`Hero`, `Enemy`, `AstralProjection`, `Clone`, `ScriptScene`) stash themselves on `window` (`app/types/global.d.ts`) so other modules can do `instanceof window.Hero` without importing the class.

### Registry pattern (explains a lot of "how does X get wired up")
Content is wired up via **empty hash objects populated by side-effect imports**: `objectHash`, `enemyDefinitions`, `zones`, `sceneHash`, `dialogueHash`, `specialBehaviorsHash`, etc. Each content file (e.g. `app/content/zones/overworld.ts`, `app/content/enemies/snake.ts`) assigns itself into the relevant hash at module-load time (`zones.overworld = {...}`, `objectHash['npc'] = NPC`). The long list of `export * from ...` at the top of `app/client.ts` exists purely to force these modules to execute, in an order that matters in a couple of places (see the ordering comment at the top of that file). If new content isn't showing up in-game, check that its file is actually imported somewhere reachable from `client.ts`.

### Actor / object model
Three-tier interface hierarchy (`app/types/objects.d.ts`, `app/types/hero.d.ts`): `BaseFieldInstance` (lifecycle hooks: `update?`, `render`, `onHit?`, `onPush?`, ...) → `ObjectInstance` (adds flags/logic/save fields) → `Actor` (adds physical-mover fields: `vx/vy/vz`, `d`, `action`, `life`, ...). Non-solid effects (projectiles, particles) are `EffectInstance`, a sibling of `ObjectInstance`.
- **Objects** (doors, switches, NPCs, decorations, enemies): class-per-type, looked up from `objectHash[definition.type]` and instantiated by `createObjectInstance()` (`app/utils/createObjectInstance.ts`). `ObjectDefinition` is a large discriminated union on `type` (`app/types/objects.d.ts`).
- **Enemies**: one concrete `Enemy` class (`app/content/enemy.ts`) handles all generic plumbing (knockback, freeze/burn, loot, health bar); per-species behavior is a **data object** (`EnemyDefinition`, optional `update`/`onHit`/`onDeath`/`abilities[]`/stats) looked up from `enemyDefinitions[enemyType]`, defined one-per-file under `app/content/enemies/`. Attack patterns are further broken into `EnemyAbility` state machines (`getTarget`/`prepareAbility`/`updateAbility`/`useAbility`/`cleanupAbility`).
- Generic (non-hero) objects/enemies update polymorphically via their own `.update?.()` method, driven from `updateAreaObjects()` in `app/scenes/field/updateField.ts` — there's no big switch statement for object types.
- The **hero** is a special case: a single `Hero` class (`app/content/hero.ts`), driven by two large always-imported functions rather than the polymorphic pattern — `app/updateHeroStandardActions.ts` (runs every frame: input polling, screen-transition bookkeeping, tool triggers) and `app/updateHeroSpecialActions.ts` (a big `if (hero.action === 'X') {...}` dispatcher for discrete actions like `jumpingDown`, `knocked`, `getItem`, door-usage). `app/useTool.ts` handles bow/cloak/clone/staff activation. `app/userInput.ts` owns keyboard/gamepad polling and the `GAME_KEY` abstraction (`app/gameConstants.ts`).

### Scenes
`GameScene` (`app/types/scene.d.ts`) is a stack-machine node: `update?`, `render?`, `blocksInput`, `blocksUpdates?`, `updateMusic?`, optional cached `buffer`. `app/scenes/sceneHash.ts` registers all scene singletons (`field`, `hud`, `map`, `title`, `intro`, `prologue`, `fileSelect`, `mainMenu`, `bossRush`, `randomizer`, ...) — same registry pattern as content. `FieldScene` (`app/scenes/field/fieldScene.ts`) is the "gameplay" scene that's on the stack whenever the player is walking around; menus/dialogue/pause push additional scenes on top with `blocksInput`/`blocksUpdates` to pause it. Per-frame world simulation happens in `app/scenes/field/updateField.ts`; actual area rendering happens in `app/scenes/field/renderField.ts` — not the top-level `app/render.ts`, which just orchestrates the scene stack.

### World content (`app/content/`)
Zones are hand-authored, not procedurally placed: each `app/content/zones/*.ts` file (some are large, e.g. `overworld.ts` is ~7.5K lines) defines `AreaDefinition` constants — one per screen/grid-cell — with raw tile-index `layers`, an inline `objects: ObjectDefinition[]` array (entity placements), and `sections` (camera/map subdivisions). This is effectively serialized level-editor output; `app/content/zones.ts` is the barrel that imports every zone file into the `zones` hash. Related: `content/logic.ts` (the flag/requirement system gating doors/objects — also the shared substrate for the randomizer's reachability graph), `content/loot.ts`/`lootTables.ts`, `content/dialogue.ts`, `content/tiles.ts`.

### Movement (`app/movement/`)
Tile/hitbox collision, not a physics engine: `canMoveUp/Down/Left/Right.ts` do per-direction collision checks; `moveActor.ts`/`moveObject.ts` step position up to 1px/axis at a time. `getLedgeDelta.ts`/`isUnderLedge.ts` implement the "can jump off a ledge, can't climb it" mechanic. `getJumpVector.ts` computes jump trajectories used by the hero's `jumpingDown` action.

### `app/development/` — in-game level editor
Gated by `editingState.isEditing`, checked throughout hot-path code (render, camera, field update) to branch into edit-mode behavior. This is a content-authoring tool built into the game itself (tile/object/zone editors, export-to-zone-file tooling), not a separate app — worth knowing when changing core update/render code, since it may need an edit-mode-aware branch.

### `app/arGames/` — mini-games
Optional but fully wired in: triggered in-world via an `arGame`-type `ObjectDefinition`, launched by pushing `[field, arScene, hud, arHudScene]` onto `state.sceneStack` (`app/scenes/arGame/arGameScene.ts`). Four games live under `dodger/`, `hota/`, `target_practice/` (including a more built-out `fps/` subsystem).

### Notably empty: `app/ui/`
This directory exists but has no tracked files. UI/menu/HUD code actually lives under `app/scenes/hud/`, `app/scenes/fieldMenu/`, `app/scenes/message/`, `app/scenes/map/`, etc., plus rendering helpers in `app/render/renderMenuFrame.ts` and `app/render/spiritBar.ts`. Don't look in `app/ui/` for anything.

### Cross-cutting systems
- **Save/load**: `app/savedState.ts` + `app/scenes/fileSelect/setSaveFileToState.ts`. Saves persist to `localStorage` (`savedGames`/`savedRandomizerGames`/`settings`); `applySavedState()` deep-merges a save slot onto a fresh default `SavedState` and constructs a new `Hero`.
- **Scripted events / cutscenes**: `app/scriptEvents.ts` + `app/scenes/script/scriptScene.ts` — a small event-queue DSL (`appendScriptEvents`, `wait`, `hideHUD`, etc.) pushed as a scene. Dialogue text uses an inline markup language (`{flag:...}`, `{addCue:...}`) parsed by `app/utils/parseMessage.ts`. Players can double-tap MENU within 2s to skip a cutscene.
- **Music**: `app/musicController.ts`, called once per render frame. Scenes can override via `GameScene.updateMusic?()`. Tracks are lazily preloaded via `requireTrack()` the first time they're needed rather than all upfront, to spread out audio bandwidth.
- **Logic/flag system**: `app/content/logic.ts` — nearly every placed object can carry conditional-presence logic evaluated against `state.savedState.objectFlags`/`zoneFlags`. This is the shared substrate between normal-mode puzzle gating and the randomizer's reachability graph.

### Deeper dives
- [documentation/architecture-randomizer-generator.md](documentation/architecture-randomizer-generator.md) — the randomizer (item/entrance placement solver) and the procedural room generator. Both are fully integrated into the main game, not separate entry points.
- [documentation/architecture-rendering.md](documentation/architecture-rendering.md) — the render pipeline in detail: layers, camera easing, lighting/fog, canvas setup.
- `documentation/` also holds design notes, playtester feedback, and randomizer/zone-design references (not code) — check here for design intent before making gameplay-affecting changes.

## Keeping this file current
This file is loaded into context automatically at the start of every session, so keep it accurate rather than complete — push subsystem-specific depth into the companion docs, which are only read when a task actually touches that subsystem. When you discover something during a task that contradicts or extends what's written here or in a companion doc (a pattern, a gotcha, a moved/renamed system), update the relevant file as part of that task rather than leaving it stale. Prefer editing the existing structure over appending an "updates" section at the bottom.
