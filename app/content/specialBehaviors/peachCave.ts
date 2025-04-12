import { specialBehaviorsHash } from 'app/content/specialBehaviors/specialBehaviorsHash';
import { FRAME_LENGTH, isRandomizer } from 'app/gameConstants';
import { appendCallback, appendScript, hideHUD, runBlockingCallback, showHUD } from 'app/scriptEvents';
import { updateCamera } from 'app/updateCamera';
import { directionMap, hitTargets } from 'app/utils/field';


specialBehaviorsHash.peachCave = {
    type: 'area',
    apply(state: GameState, area: AreaInstance) {
        this.onRefreshLogic(state, area);
    },
    onRefreshLogic(state: GameState, area: AreaInstance) {
        const caveIsDark = !!state.savedState.objectFlags.peachCaveTree;
        if (caveIsDark) {
            area.dark = Math.max(area.definition.dark, 90);
        } else if (state.savedState.objectFlags.peachCaveBoss) {
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
                runBlockingCallback(state, (state: GameState) => {
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
                    updateCamera(state);
                    return true;
                });
                appendScript(state, '(Thank you for saving me.)');
                appendCallback(state, (state: GameState) => {
                    state.hero.action = 'knocked';
                    state.hero.vx = -0.5 * directionMap[state.hero.d][0];
                    state.hero.vy = -0.5 * directionMap[state.hero.d][1];
                    state.hero.vz = 2;
                });
                appendScript(state, '{wait:500}');
                appendScript(state, `
                    "Woah, is this a magic tree?"
                    {|}(I'm sorry, but I don't have much time left, those creatures...
                    [-]Please warn the Vanara, the Spirit Tree may be in danger.)
                    {|}"Wait, who are you? What-"
                    {|}(Please take...[-][-][-][-]...last of my strength...[-][-][-][-]...The Fruit of Life.)[-][-]`
                );
                appendScript(state, '{flag:peachCaveTree}{stopTrack}');
                appendScript(state, '{wait:100');
                showHUD(state);
            }
        }
    },
};
