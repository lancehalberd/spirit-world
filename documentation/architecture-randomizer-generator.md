# Randomizer & generator architecture

Companion to [CLAUDE.md](../CLAUDE.md). Covers `app/randomizer/` and `app/generator/`.

Both systems are **fully integrated into the main game**, not separate entry points. `GameMode = 'normal' | 'randomizer' | 'test'` (`app/types/state.d.ts`) lives on `state.savedGameMode`; `GameState.randomizerState?: RandomizerState` and `SavedState.savedRandomizerData?` are first-class optional state fields alongside the normal-mode ones. `setSaveFileToState` (`app/scenes/fileSelect/setSaveFileToState.ts`) branches spawn location and starting magic when `gameMode === 'randomizer'`. There's a dedicated `app/scenes/randomizer/randomizerScene.ts` registered in `sceneHash.randomizer`.

## Randomizer (`app/randomizer/`) — item/entrance placement solver

This is the "assumed fill" placement logic used to generate a randomized seed, plus the in-game logic used to validate/track it:
- `allNodes.ts` — builds the full `LogicNode` graph across every zone (`NodesByZoneKey` / `NodesById` in `state.d.ts`)
- `reverseFill.ts` — the classic randomizer "assumed fill" algorithm
- `entranceRandomizer.ts` — entrance shuffling (`RandomizerEntrances` / `DoorLocation`)
- `calculateKeyLogic.ts` — dungeon key logic (small/big keys must be reachable before the doors they open)
- `checks.ts` — the set of locations that can hold randomized items
- `goal.ts` — victory-condition / boss-point logic (`RandomizerGoal`)
- `getAllReachableContent.ts` / `find.ts` / `utils.ts` — reachability queries used by the fill algorithm
- `showRandomizerSolution.ts` — a dev tool exposed globally via `app/client.ts`, prints/visualizes a solve path

`RandomizerItems` / `RandomizerState` (`app/types/state.d.ts`) track loot/entrance assignment progress. Both this system and normal-mode gameplay read the **same** `LogicNode` / `LogicDefinition` graph (`app/content/logic.ts`, `app/types/logic.d.ts`) that governs conditional doors/objects — the randomizer doesn't have its own parallel notion of "what's reachable," it reuses the puzzle-gating logic that already exists for normal mode.

## Generator (`app/generator/`) — procedural room generation

Narrower in scope than the name suggests: currently used for specific optional content rather than general level authoring (the primary level-authoring path is still the hand-authored `app/content/zones/*.ts` files). `generateZoneVariations.ts` currently generates one room (`generateWarPalaceWestRoom`), resetting `state.generatedLogicNodes = []` each time it runs.

Sub-directories:
- `chunks/`, `rooms/`, `skeletons/`, `slots/`, `styles/` — building blocks for procedurally assembling a room from pieces
- `content/` — specific generated-room implementations (e.g. the War Palace west room)
- `doors.ts`, `enemies.ts`, `tiles.ts` — generator-side placement helpers for those object types
- `nineSlice.ts` — 9-slice wall tiling for generated geometry
- `delveGauntlet.ts` — related "delve"/gauntlet content
- `treeGraphs.ts` — exported globally via `client.ts`; likely a dev/graph-visualization tool for generated layouts

Like the randomizer, generated content produces/consumes `LogicNode`s so generated rooms plug into the same reachability graph as hand-authored ones.

## When touching this code
- Changes to `app/content/logic.ts` or the `LogicNode`/`LogicDefinition` shape affect normal-mode puzzle gating, the randomizer solver, and the generator simultaneously — check all three before assuming a change is scoped to one mode.
- The randomizer's correctness depends on the logic graph accurately reflecting what's actually reachable in `app/content/zones/*.ts` — a zone change that adds/removes a requirement without updating its logic can silently break seed generation rather than erroring.
