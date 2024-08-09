import { playAreaSound } from 'app/musicController';
import { isGameKeyDown, wasGameKeyPressed, wasGameKeyPressedAndReleased } from 'app/userInput';
import { Arrow } from 'app/content/effects/arrow';
import { Clone }  from 'app/content/objects/clone';
import { GAME_KEY } from 'app/gameConstants';
import { directionMap, getDirection, rotateDirection } from 'app/utils/direction';
import { addEffectToArea } from 'app/utils/effects';
import { getChargeLevelAndElement, getElement } from 'app/utils/getChargeLevelAndElement';
import { addObjectToArea } from 'app/utils/objects';
import { swapHeroStates } from 'app/utils/swapHeroStates';



export function useTool(
    state: GameState,
    hero: Hero,
    tool: ActiveTool,
    dx: number,
    dy: number,
): void {
    let { chargeLevel, element } = getChargeLevelAndElement(state, hero, hero.savedData.activeTools[tool]);
    switch (tool) {
        case 'bow': {
            if (state.hero.magic <= 0) {
                return;
            }
            const isUpgradedBow = state.hero.savedData.activeTools.bow & 2;
            let speed = isUpgradedBow ? 6 : 4;
            let damage = isUpgradedBow ? 4 : 2;
            damage *= (2 ** chargeLevel);
            let magicCost = 5;
            if (chargeLevel === 1) {
                speed += 2;
                magicCost += 5;
            } else if (chargeLevel >= 2) {
                speed += 4;
                magicCost += 25;
            }
            if (isUpgradedBow && chargeLevel === 0) {
                // Upgraded bow always uses the equiped element and uses less magic to do so.
                element = getElement(state, hero);
                // Only increase the cost if an element is actually used.
                if (element) {
                    magicCost += 5;
                }
            } else if (element && chargeLevel > 0) {
                // Adding an element to a charged attack costs 10 spirit energy.
                magicCost += 10;
            }
            if (element === 'lightning') {
                speed += 2;
            }
            state.hero.spendMagic(magicCost);
            hero.toolCooldown = 200;
            hero.toolOnCooldown = 'bow';
            let direction = hero.d;
            if (dx || dy) {
                direction = getDirection(dx, dy, true);
            }
            const baseArrowProps = {
                chargeLevel,
                damage,
                element,
                z: hero.z,
                style: 'spirit',
            }
            let arrow = new Arrow({
                ...baseArrowProps,
                x: hero.x + 8 + 8 * directionMap[direction][0],
                y: hero.y + 8 * directionMap[direction][1] + 6,
                vx: speed * directionMap[direction][0],
                vy: speed * directionMap[direction][1],
            });
            addEffectToArea(state, state.areaInstance, arrow);
            if (isUpgradedBow && chargeLevel >= 1) {
                direction = rotateDirection(direction, -1/2);
                arrow = new Arrow({
                    ...baseArrowProps,
                    x: hero.x + 8 + 8 * directionMap[direction][0],
                    y: hero.y + 8 * directionMap[direction][1] + 6,
                    vx: speed * directionMap[direction][0],
                    vy: speed * directionMap[direction][1],
                });
                addEffectToArea(state, state.areaInstance, arrow);
                direction = rotateDirection(direction, 1);
                arrow = new Arrow({
                    ...baseArrowProps,
                    x: hero.x + 8 + 8 * directionMap[direction][0],
                    y: hero.y + 8 * directionMap[direction][1] + 6,
                    vx: speed * directionMap[direction][0],
                    vy: speed * directionMap[direction][1],
                });
                addEffectToArea(state, state.areaInstance, arrow);
            }
            if (chargeLevel >= 2) {
                direction = hero.d;
                if (dx || dy) {
                    direction = getDirection(dx, dy, true);
                }
                // For now level 2 charge follows up with a second slower arrow
                arrow = new Arrow({
                    ...baseArrowProps,
                    x: hero.x + 8 + 8 * directionMap[direction][0],
                    y: hero.y + 8 * directionMap[direction][1] + 6,
                    vx: 3 * directionMap[direction][0],
                    vy: 3 * directionMap[direction][1],
                    delay: 100,
                });
                addEffectToArea(state, state.areaInstance, arrow);
                if (isUpgradedBow) {
                    direction = rotateDirection(direction, -1/2);
                    arrow = new Arrow({
                        ...baseArrowProps,
                        x: hero.x + 8 + 8 * directionMap[direction][0],
                        y: hero.y + 8 * directionMap[direction][1] + 6,
                        vx: 3 * directionMap[direction][0],
                        vy: 3 * directionMap[direction][1],
                        delay: 100,
                    });
                    addEffectToArea(state, state.areaInstance, arrow);
                    direction = rotateDirection(direction, 1);
                    arrow = new Arrow({
                        ...baseArrowProps,
                        x: hero.x + 8 + 8 * directionMap[direction][0],
                        y: hero.y + 8 * directionMap[direction][1] + 6,
                        vx: 3 * directionMap[direction][0],
                        vy: 3 * directionMap[direction][1],
                        delay: 100,
                    });
                    addEffectToArea(state, state.areaInstance, arrow);
                }
            }
            return;
        }
        case 'cloak': {
            if (hero.isInvisible || hero.hasBarrier) {
                hero.shatterBarrier(state);
                hero.isInvisible = false;
                hero.toolCooldown = 0;
                hero.toolOnCooldown = null;
                return;
            }
            let magicCost = 5;
            //if (chargeLevel === 1) {
            //    magicCost += 5;
            //}
            if (state.hero.magic < magicCost) {
                return;
            }
            state.hero.spendMagic(magicCost);
            hero.toolOnCooldown = 'cloak';
            // This is based on the length of the animation for activating the cloak which is 20ms * 2 * 10
            hero.toolCooldown = 400;
            // Damage increase with cloak level.
            hero.barrierLevel = (hero.savedData.activeTools.cloak & 2) ? 2 : 1;
            // Charing the cloak has been replaced by the barrier burst functionality.
            /*
            if (chargeLevel === 1) {
                hero.barrierElement = element;
            }
            */
            hero.hasBarrier = true;
            return;
        }
        case 'clone': {
            if (state.hero.magic <= 0 || state.hero.life <= 1) {
                return;
            }
            const maxClones = (state.hero.savedData.activeTools.clone & 2) ? 2 : 1;
            if (isGameKeyDown(state, GAME_KEY.PASSIVE_TOOL)
                && state.hero.clones.length < maxClones
            ) {
                state.hero.spendMagic(10);
                hero.toolCooldown = 100;
                hero.toolOnCooldown = 'clone';
                hero.cloneToolReleased = false;
                const clone = new Clone(state.hero);
                state.hero.clones.push(clone);
                addObjectToArea(state, state.areaInstance, clone);
                clone.isUncontrollable = true;
                clone.explosionTime = 0;
                clone.onGrab(state, hero.d, hero);
                hero.grabObject = clone;
                // Set this to the end of the pickup animation so we can throw immediately.
                hero.pickUpFrame = 10;
                clone.updateCoords(state);
                hero.throwHeldObject(state);
                return;
            }
            // The normal clone tool functionality only works when no clones currently exist.
            if (!state.hero.clones.length) {
                state.hero.spendMagic(10);
                hero.toolCooldown = 100;
                hero.toolOnCooldown = 'clone';
                hero.cloneToolReleased = false;
                for (let i = 0; i < maxClones && i < state.hero.life - 1; i++) {
                    const clone = new Clone(state.hero);
                    state.hero.clones.push(clone);
                    addObjectToArea(state, state.areaInstance, clone);
                    // Switch to the new clone immediately
                    swapHeroStates(state.hero, clone);
                }
            }
            return;
        }
        case 'staff': {
            if (hero.activeStaff?.area && !hero.activeStaff.recalling) {
                hero.activeStaff.recall(state);
                hero.toolCooldown = 0;
                hero.toolOnCooldown = null;
                playAreaSound(state, state.areaInstance, 'menuTick');
                return;
            }
            if (hero.activeStaff?.area || state.hero.magic <= 0) {
                return;
            }
            state.hero.spendMagic(10);
            hero.toolCooldown = 200;
            hero.toolOnCooldown = 'staff';
            hero.canceledStaffPlacement = false;
            hero.action = 'usingStaff';
            hero.isAirborn = true;
            hero.animationTime = 0;
            return;
        }
    }
}

export function wasToolButtonPressed(state: GameState, tool: ActiveTool): boolean {
    return (state.hero.savedData.leftTool === tool && wasGameKeyPressed(state, GAME_KEY.LEFT_TOOL))
        || (state.hero.savedData.rightTool === tool && wasGameKeyPressed(state, GAME_KEY.RIGHT_TOOL));
}
export function wasToolButtonPressedAndReleased(state: GameState, tool: ActiveTool): boolean {
    return (state.hero.savedData.leftTool === tool && wasGameKeyPressedAndReleased(state, GAME_KEY.LEFT_TOOL))
        || (state.hero.savedData.rightTool === tool && wasGameKeyPressedAndReleased(state, GAME_KEY.RIGHT_TOOL));
}
export function isToolButtonPressed(state: GameState, tool: ActiveTool): boolean {
    return (state.hero.savedData.leftTool === tool && isGameKeyDown(state, GAME_KEY.LEFT_TOOL))
        || (state.hero.savedData.rightTool === tool && isGameKeyDown(state, GAME_KEY.RIGHT_TOOL));
}
