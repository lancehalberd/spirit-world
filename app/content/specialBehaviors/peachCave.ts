import {refreshAreaLogic} from 'app/content/areas';
import {specialBehaviorsHash} from 'app/content/specialBehaviors/specialBehaviorsHash';
import {FRAME_LENGTH} from 'app/gameConstants';
import {
    appendCallback,
    appendDisableUpdatesForTargets,
    appendEnableUpdatesForTargets,
    appendInputBlockingCallback,
    appendScript,
    appendTextCueWithInput,
    hideHUD,
    appendResetAndWaitForCamera,
    showHUD,
    appendWaitForCamera,
} from 'app/scriptEvents';
import {directionMap, hitTargets} from 'app/utils/field';
import {PeachTree} from 'app/content/objects/peachTree';
// import {updateHero} from 'app/updateActor';

function appendKnockHero(state: GameState) {
    appendCallback(state, (state: GameState) => {
        state.hero.action = 'knocked';
        state.hero.vx = -0.5 * directionMap[state.hero.d][0];
        state.hero.vy = -0.5 * directionMap[state.hero.d][1];
        state.hero.vz = 2;
    });
    appendInputBlockingCallback(state, (state: GameState) => {
        //updateHero(state, state.hero, false);
        return state.hero.action === 'knocked';
    });
    appendScript(state, '{wait:400');
}

specialBehaviorsHash.peachCave = {
    type: 'area',
    apply(state: GameState, area: AreaInstance) {
        this.onRefreshLogic(state, area);
    },
    applyToSection(state: GameState, section: AreaSection) {
        const caveIsDark = !!state.savedState.objectFlags.peachCaveTreeDied;
        if (caveIsDark) {
            section.dark = Math.max(section.dark, 90);
        }
    },
    onRefreshLogic(state: GameState, area: AreaInstance) {
        // After the peach tree dies, it has the same behavior as other peach trees,
        // which are all dead when you initially find them.
        let peachTree: PeachTree|undefined;
        for (const object of area.objects) {
            if (object instanceof PeachTree) {
                peachTree = object;
                break;
            }
        }
        if (state.savedState.objectFlags.peachCaveTreeDied && !state.savedState.objectFlags.peachCaveTre) {
            if (peachTree) {
                peachTree.specialStatus = 'dead';
            }
            return;
        }
        if (state.savedState.objectFlags.peachCaveBoss) {
            if (state.randomizerState) {
                state.savedState.objectFlags.peachCaveTreeDied = true;
                state.areaInstance.needsLogicRefresh = true;
            } else {
                if (!peachTree) {
                    return;
                }
                peachTree.specialStatus = 'weak';
                hideHUD(state, (state: GameState) => {
                    state.hero.y = 136;
                    state.savedState.objectFlags.peachCaveTreeDied = true;
                    refreshAreaLogic(state, state.areaInstance, true);
                });
                state.hero.prepareForCutScene();
                appendScript(state, '{playTrack:vanaraDreamTheme}{wait:500');
                // Clear all the bushes to unblock player movement and give some extra loot before they all disappear.
                appendCallback(state, () => {
                    hitTargets(state, state.areaInstance, {
                        damage: 1,
                        hitbox: {x: 0, y: 0, w: 256, h: 256},
                        hitTiles: true,
                        source: null,
                    });
                    delete peachTree.specialStatus;
                });
                // Hero jumps back a bit in surprise at the bushes being destroyed
                appendKnockHero(state);
                // Disable updates on the hero while the script moves them.
                // TODO: Check if this needs to be for hero+clones
                appendDisableUpdatesForTargets(state, [state.hero]);
                // Move the player to a good y position before talking to the tree.
                appendInputBlockingCallback(state, (state: GameState) => {
                    state.camera.speed = 1;
                    state.cutscene.cameraTarget = {x: 128, y: 32};
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
                appendEnableUpdatesForTargets(state, [state.hero]);
                appendWaitForCamera(state);
                appendTextCueWithInput(state, 'Thank you for saving me.');
                appendKnockHero(state);
                appendScript(state, `"Woah, is this a magic tree?"`);
                appendTextCueWithInput(state, `I don't have much time, ...those creatures...`);
                appendTextCueWithInput(state, `Please warn the Vanara`);
                appendTextCueWithInput(state, `The Spirit Tree [-] may be in danger.`);
                appendScript(state, `"Wait, who are you? What-"`);
                appendTextCueWithInput(state, `You'll need...`);
                appendCallback(state, (state: GameState) => {
                    peachTree.gatherEnergy(state);
                });
                appendTextCueWithInput(state, `...last of my strength...`);
                appendCallback(state, (state: GameState) => {
                    peachTree.growPeach(state);
                });
                appendInputBlockingCallback(state, (state: GameState) => {
                    state.areaSection.dark = Math.min(90, state.areaSection.dark + 0.5);
                    //state.areaInstance.dark = Math.min(90, state.areaInstance.dark + 0.5);
                    if (peachTree.specialStatus === 'dead') {
                        return false;
                    }
                    return true;
                });
                appendTextCueWithInput(state, `...the Fruit of Life.`);
                appendScript(state, '{flag:peachCaveTreeDied}{stopTrack}');
                // Wait for the area to finish refreshing before resetting the camera and showing the HUD.
                appendInputBlockingCallback(state, (state: GameState) => {
                    if (state.nextAreaInstance || state.transitionState) {
                        return true;
                    }
                    return false;
                });
                appendResetAndWaitForCamera(state);
                showHUD(state);
            }
        } else if (peachTree) {
            peachTree.specialStatus = 'weak';
        }
    },
};
