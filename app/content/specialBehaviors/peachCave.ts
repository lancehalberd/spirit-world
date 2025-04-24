import {specialBehaviorsHash} from 'app/content/specialBehaviors/specialBehaviorsHash';
import {FRAME_LENGTH, isRandomizer} from 'app/gameConstants';
import {appendCallback, appendScript, hideHUD, resetCamera, runPlayerBlockingCallback, showHUD, textCueWithInput, waitForCamera} from 'app/scriptEvents';
import {directionMap, hitTargets} from 'app/utils/field';
import {PeachTree} from 'app/content/objects/peachTree';


specialBehaviorsHash.peachCave = {
    type: 'area',
    apply(state: GameState, area: AreaInstance) {
        this.onRefreshLogic(state, area);
    },
    onRefreshLogic(state: GameState, area: AreaInstance) {
        const caveIsDark = !!state.savedState.objectFlags.peachCaveTree;
        let peachTree: PeachTree|undefined;
        for (const object of area.objects) {
            if (object instanceof PeachTree) {
                peachTree = object;
                break;
            }
        }
        if (caveIsDark) {
            area.dark = Math.max(area.definition.dark, 90);
            if (peachTree) {
                peachTree.specialStatus = 'dead';
            }
        } else if (peachTree && state.savedState.objectFlags.peachCaveBoss) {
            if (isRandomizer) {
                state.savedState.objectFlags.peachCaveTree = true;
                state.areaInstance.needsLogicRefresh = true;
            } else {
                hideHUD(state, (state: GameState) => {
                    appendScript(state, '{flag:peachCaveTree}');
                });
                appendScript(state, '{playTrack:vanaraDreamTheme}{wait:500');
                // Clear all the bushes to unblock player movement and give some extra loot before they all disappear.
                appendCallback(state, () => {
                    hitTargets(state, state.areaInstance, {
                        damage: 1,
                        hitbox: {x: 0, y: 0, w: 256, h: 256},
                        hitTiles: true,
                        source: null,
                    });
                    peachTree.specialStatus = undefined;
                });
                // Hero jumps back a bit in surprise at the bushes being destroyed
                appendCallback(state, (state: GameState) => {
                    state.hero.action = 'knocked';
                    state.hero.vx = -0.5 * directionMap[state.hero.d][0];
                    state.hero.vy = -0.5 * directionMap[state.hero.d][1];
                    state.hero.vz = 2;
                });
                appendScript(state, '{wait:800');
                // Move the player to a good y position before talking to the tree.
                runPlayerBlockingCallback(state, (state: GameState) => {
                    state.camera.speed = 1;
                    state.scriptEvents.cameraTarget = {x: 128, y: 32};
                    const hero = state.hero;
                    if (hero.y === 136) {
                        hero.d = 'up';
                        delete hero.action;
                        return false;
                    }
                    hero.action = 'walking';
                    hero.animationTime += FRAME_LENGTH;
                    if (hero.y < 136) {
                        hero.d = 'down';
                        hero.y = Math.min(hero.y + 1, 136);
                    } else {
                        hero.d = 'up';
                        hero.y = Math.max(hero.y - 1, 136);
                    }
                    return true;
                });
                waitForCamera(state);
                textCueWithInput(state, 'Thank you for saving me.');
                appendCallback(state, (state: GameState) => {
                    state.hero.action = 'knocked';
                    state.hero.vx = -0.5 * directionMap[state.hero.d][0];
                    state.hero.vy = -0.5 * directionMap[state.hero.d][1];
                    state.hero.vz = 2;
                });
                appendScript(state, '{wait:500}');
                appendScript(state, `"Woah, is this a magic tree?"`);
                textCueWithInput(state, `I don't have much time, ...those creatures...`);
                textCueWithInput(state, `Please warn the Vanara`);
                textCueWithInput(state, `The Spirit Tree [-] may be in danger.`);
                appendScript(state, `"Wait, who are you? What-"`);
                textCueWithInput(state, `You'll need...`);
                appendCallback(state, (state: GameState) => {
                    peachTree.gatherEnergy(state);
                });
                textCueWithInput(state, `...last of my strength...`);
                appendCallback(state, (state: GameState) => {
                    peachTree.growPeach(state);
                });
                runPlayerBlockingCallback(state, (state: GameState) => {
                    state.areaInstance.dark = Math.min(90, state.areaInstance.dark + 0.5);
                    if (peachTree.specialStatus === 'dead') {
                        return false;
                    }
                    return true;
                });
                textCueWithInput(state, `...the Fruit of Life.`);
                appendScript(state, '{flag:peachCaveTree}{stopTrack}');
                // Wait for the area to finish refreshing before resetting the camera and showing the HUD.
                runPlayerBlockingCallback(state, (state: GameState) => {
                    if (state.nextAreaInstance) {
                        return true;
                    }
                    return false;
                });
                resetCamera(state);
                showHUD(state);
            }
        } else if (peachTree) {
            peachTree.specialStatus = 'weak';
        }
    },
};
