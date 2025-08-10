import {HotaHero} from 'app/arGames/hota/hero';
import {Tower} from 'app/arGames/hota/tower';
import {addUnitToLane, fieldHeight, fieldWidth, rowHeight} from 'app/arGames/hota/utils';

import {FRAME_LENGTH, GAME_KEY} from 'app/gameConstants';
import {heroAnimations} from 'app/render/heroAnimations';
import {wasGameKeyPressed} from 'app/userInput';
import {getAreaSize} from 'app/utils/getAreaSize';

/**
Add hero that scales with player progress, starts strong but is only strong at higher difficulties if player has high progression in the base game.
Add hero with ability to freeze ALL other units when summoned.
    Synnergy/Counter: Freeze immune units.
Add hero with ability to prevent opponent from summoning units for a brief period. Good for preventing counters briefly.
    Upgrade path prevent either player from summoning units for a longer period. Good for locking in an advantageous position.
*/

const battleScene: HotaScene = {
    start(state: GameState, gameState: HotaState, savedState: HotaSavedState) {
        gameState.scene = 'battle';
        for (let i = 0; i < 3; i++) {
            const rowY = gameState.battleField.y + rowHeight * i;
            gameState.lanes[i].objects.push(new Tower({
                lane: gameState.lanes[i],
                x: gameState.lanes[i].left,
                y: rowY + rowHeight / 2,
            }));
            gameState.lanes[i].objects.push(new Tower({
                lane: gameState.lanes[i],
                x: gameState.lanes[i].right,
                y: rowY + rowHeight / 2,
                isEnemy: true,
            }));
        }
    },
    update(state: GameState, gameState: HotaState, savedState: HotaSavedState) {
        gameState.sceneTime += FRAME_LENGTH;
        /*for (let i = 0; i < gameState.objects.length; i++) {
            gameState.objects[i].update(state, gameState, savedState);
        }*/
        for (let i = 0; i < gameState.lanes.length; i++) {
            const lane = gameState.lanes[i];
            lane.effects = lane.effects.filter(effect => !effect.done);
            for (let j = 0; j < lane.effects.length; j++) {
                lane.effects[j].update(state, gameState, savedState);
            }
            lane.objects = lane.objects.filter(object => !object.done);
            for (let j = 0; j < lane.objects.length; j++) {
                lane.objects[j].update(state, gameState, savedState);
            }
            // Clear everything but the winning tower 3 seconds after victory.
            if (lane.winner && lane.winTime + 3000 <= gameState.sceneTime) {
                lane.effects = [];
                for (let j = 0; j < lane.objects.length; j++) {
                    const object = lane.objects[j];
                    if (object.unitType === 'tower') {
                        continue;
                    }
                    object.onLeave?.(state, gameState, savedState);
                    lane.objects.splice(j--, 1);
                }
            }
        }
        // Open Summon Hero window when the player presses the passive tool button getAvatarHeroDefinition
        if (wasGameKeyPressed(state, GAME_KEY.PASSIVE_TOOL)) {
            const hitbox = state.hero.getMovementHitbox();
            const y = hitbox.y + hitbox.h / 2;
            const laneIndex = Math.floor((y - gameState.battleField.y) / rowHeight);
            const lane = gameState.lanes[laneIndex];
            if (lane) {
                let x = hitbox.x + hitbox.w / 2;
                let mode: HotaHeroMode = 'guard';
                if (x > lane.left + 40) {
                    mode = 'attack';
                    x = lane.left + 48;
                } else if (x > lane.left + 20) {
                    mode = 'support';
                    x = lane.left + 32;
                } else {
                    x = lane.left + 16;
                }
                const hero = new HotaHero({
                    x,
                    y: gameState.battleField.y + rowHeight * laneIndex + rowHeight / 2,
                    lane,
                    mode,
                    definition: getAvatarHeroDefinition(state),
                });
                addUnitToLane(state, gameState, savedState, lane, hero);
            }
        }
    },
    render(context: CanvasRenderingContext2D, state: GameState, gameState: HotaState, savedState: HotaSavedState) {
        /*for (let i = 0; i < gameState.objects.length; i++) {
            gameState.objects[i].render(context, state, gameState, savedState);
        }*/
        // TODO: Order objects/effects by y value before rendering.
        for (let i = 0; i < gameState.lanes.length; i++) {
            const lane = gameState.lanes[i];
            const sortedObjects = [...lane.objects, ...lane.effects];
            sortedObjects.sort((a, b) => a.y - b.y);
            for (const o of sortedObjects) {
                o.render(context, state, gameState, savedState);
            }
        }
    },
    renderHUD(context: CanvasRenderingContext2D, state: GameState, gameState: HotaState, savedState: HotaSavedState) {
    },
}

const scenes = {
    battle: battleScene,
}

function getAvatarHeroDefinition(state: GameState): HotaHeroDefinition {
    return {
        heroKey: 'avatar',
        animations: heroAnimations,
        damage: 15,
        range: 40,
        movementSpeed: 12,
        attacksPerSecond: 1,
        auras: [
            // Global minion life buff scales with number of hearts the player has.
            {
                modifiers: [{statKey: 'maxLife', percentBonus: 5 * state.hero.savedData.maxLife}],
                scope: 'global',
                // If undefined will target both enemies and allies.
                isEnemy: false,
            },
            // 10% buff to most stats for minions+heroes in the same lane.
            {
                modifiers: [
                    {statKey: 'damage', percentBonus: 10},
                    {statKey: 'attacksPerSecond', percentBonus: 10},
                    {statKey: 'movementSpeed', percentBonus: 10},
                    {statKey: 'range', percentBonus: 10},
                ],
                scope: 'lane',
                // If undefined will target both enemies and allies.
                isEnemy: false,
                effectsHeroes: true,
            },
        ],
    };
}

function getNewHotaState(state: GameState): HotaState {
    const {section} = getAreaSize(state);
    const battleField = {
        x: section.x + section.w / 2 - fieldWidth / 2,
        // This is off center a bit to account for northern walls being thicker than southern walls.
        y: section.y + section.h / 2 - fieldHeight / 2 + 16,
        w: fieldWidth,
        h: fieldHeight
    }

    return {
        scene: 'battle',
        sceneTime: 0,
        lanes: [
            {objects: [], effects: [], left: battleField.x + 32, right: battleField.x + battleField.w - 32},
            {objects: [], effects: [], left: battleField.x + 16, right: battleField.x + battleField.w - 16},
            {objects: [], effects: [], left: battleField.x, right: battleField.x + battleField.w},
        ],
        modifierEffects: [],
        battleField,
    };
}

function getNewHotaSavedState(): HotaSavedState {
    return {};
}

function startHota(state: GameState) {
    const gameState = getNewHotaState(state);
    state.arState.game = gameState;
    const savedState = state.savedState.savedArData.gameData.hota || {};
    state.savedState.savedArData.gameData.hota = {...getNewHotaSavedState(), ...savedState};
    scenes[gameState.scene].start(state, gameState, savedState);
}

function updateHota(state: GameState) {
    const gameState = state.arState.game as HotaState;
    const savedState = state.savedState.savedArData.gameData.dodger;
    scenes[gameState.scene].update(state, gameState, savedState);
}


function renderHota(context: CanvasRenderingContext2D, state: GameState) {
    const gameState = state.arState.game as HotaState;
    const savedState = state.savedState.savedArData.gameData.dodger;
    scenes[gameState.scene].render(context, state, gameState, savedState);
}

function renderHotaHUD(context: CanvasRenderingContext2D, state: GameState) {
    const gameState = state.arState.game as HotaState;
    const savedState = state.savedState.savedArData.gameData.dodger;
    scenes[gameState.scene].renderHUD(context, state, gameState, savedState);
}

export const hotaGame: ARGame = {
    start: startHota,
    update: updateHota,
    render: renderHota,
    renderHUD: renderHotaHUD,
};



