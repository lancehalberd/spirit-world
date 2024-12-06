import {dialogueHash} from 'app/content/dialogue/dialogueHash';
import {FRAME_LENGTH} from 'app/gameConstants';
import {moveActorTowardsLocation} from 'app/movement/moveActor';
import {playAreaSound} from 'app/musicController';
import {appendCallback, appendScript, runPlayerBlockingCallback, hideHUD, showHUD} from 'app/scriptEvents';
import {saveGame} from 'app/utils/saveGame';
import {moveNPCToTargetLocation} from 'app/utils/npc';
import {findObjectInstanceById} from 'app/utils/findObjectInstanceById';
import {hitTargets} from 'app/utils/field';
import {removeObjectFromArea} from 'app/utils/objects';


dialogueHash.jadeChampionStaffTower = {
    key: 'jadeChampionStaffTower',
    mappedOptions: {
        top: (state: GameState) => {
            // hide HUD to show that player isn't controllable
            hideHUD(state);
            // add Jade Champion to the screen
            const jadeChampion = findObjectInstanceById(state.hero.area, 'jadeChampion') as NPC;
            jadeChampion.speed = 1.75;
            runPlayerBlockingCallback(state, (state: GameState) => {
                state.hero.action = 'walking';
                state.hero.d = 'down';
                state.hero.animationTime += FRAME_LENGTH;
                const heroIsMoving = moveActorTowardsLocation(state, state.hero, {x: 320, y: 524}, 1.5) > 0;
                if (heroIsMoving) {
                    return true;
                }
                delete state.hero.action;
                state.hero.d = 'down';
            });
            appendScript(state, '{wait:200}');
            appendScript(state, `This is it, I can sense the Storm Beast just above us!`);
            runPlayerBlockingCallback(state, (state: GameState) => {
                jadeChampion.animationTime += FRAME_LENGTH;

                const jadeChampionIsMoving = moveNPCToTargetLocation(state, jadeChampion, 472, 536, 'move') > 0;
                let heroIsMoving = false;
                if (jadeChampion.x > 380) {
                    heroIsMoving = moveActorTowardsLocation(state, state.hero, {x: 420, y: 528}, 1.5) > 0;
                }
                if (jadeChampion.x > 360) {
                    state.hero.d = 'right';
                }
                if (heroIsMoving) {
                    state.hero.animationTime += FRAME_LENGTH;
                    state.hero.action = 'walking';
                } else {
                    delete state.hero.action;
                }
                if (!jadeChampionIsMoving) {
                    jadeChampion.setAnimation('idle', 'left');
                }
                if (jadeChampionIsMoving || heroIsMoving) {
                    return true;
                }
            });
            // Approach the first wall.
            runPlayerBlockingCallback(state, (state: GameState) => {
                jadeChampion.animationTime += FRAME_LENGTH;
                if (moveNPCToTargetLocation(state, jadeChampion, 472, 488, 'move')) {
                    return true;
                }
                state.hero.d = 'up';
            });
            // The jade champion should become transparent at this point.
            runPlayerBlockingCallback(state, (state: GameState) => {
                jadeChampion.alpha = 0.3 + 0.2 * Math.cos(jadeChampion.animationTime / 100);
                jadeChampion.animationTime += FRAME_LENGTH;
                if (moveNPCToTargetLocation(state, jadeChampion, 472, 436, 'move', {canPassWalls: true})) {
                    return true;
                }
            });
            // Jade champion stops flickering once she moves past the wall.
            runPlayerBlockingCallback(state, (state: GameState) => {
                jadeChampion.alpha = 1
                jadeChampion.animationTime += FRAME_LENGTH;
                if (moveNPCToTargetLocation(state, jadeChampion, 472, 300, 'move', {canPassWalls: true})) {
                    return true;
                }
            });
            appendCallback(state, (state: GameState) => {
                // Destroy the rock that was in her way.
                hitTargets(state, jadeChampion.area.alternateArea, {
                    hitCircle: {x: 472, y: 276, r: 16},
                    hitTiles: true,
                    crushingPower: 2,
                    source: jadeChampion,
                });
                playAreaSound(state, state.areaInstance, 'rockShatter');
                removeObjectFromArea(state, jadeChampion);
                state.savedState.objectFlags.jadeChampionStaffTowerTop = true;
                saveGame(state);
            })
            showHUD(state);
            return ``;
        },
    },
    options: [
        {
            text: [
                /*{
                    dialogueIndex: undefined,
                    text: `Speak to the Grand Priest.`,
                },
                {
                    dialogueIndex: undefined,
                    text: `Something seems terribly wrong, and you are involved somehow.
                    {|}We will get to the bottom of this.`,
                },*/
            ],
        },
    ],
};
