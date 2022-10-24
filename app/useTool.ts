import { addObjectToArea, addEffectToArea, playAreaSound } from 'app/content/areas';
import {
    isGameKeyDown,
} from 'app/keyCommands';
import { Arrow } from 'app/content/effects/arrow';
import { Clone }  from 'app/content/objects/clone';
import { GAME_KEY } from 'app/gameConstants';
import { directionMap, getDirection } from 'app/utils/field';

import { ActiveTool, GameState, Hero, MagicElement } from 'app/types'

export function getChargeLevelAndElement(state: GameState, hero: Hero, tool: ActiveTool = null) {
    if (state.hero.magic <= 0) {
        return { chargeLevel: 0, element: null };
    }
    let chargeLevel = 0;
    let element: MagicElement = null;
    if (state.hero.passiveTools.charge >= 2) {
        if (hero.chargeTime >= 1200) {
            chargeLevel = 2;
        } else if (hero.chargeTime >= 600) {
            chargeLevel = 1;
        }
    } else if (state.hero.passiveTools.charge >= 1 && hero.chargeTime >= 800) {
        chargeLevel = 1;
    }
    if (chargeLevel >= 1) {
        element = state.hero.element;
    }
    return { chargeLevel, element};
}

export function useTool(
    state: GameState,
    hero: Hero,
    tool: ActiveTool,
    dx: number,
    dy: number,
): void {
    const { chargeLevel, element } = getChargeLevelAndElement(state, hero, tool);
    switch (tool) {
        case 'bow':
            if (state.hero.magic <= 0) {
                return;
            }
            let speed = 4;
            state.hero.magic -= 5;
            if (chargeLevel === 1) {
                speed = 6;
                state.hero.magic -= 5;
            }
            if (state.hero.element && chargeLevel > 0) {
                state.hero.magic -= 10;
            }
            hero.toolCooldown = 200;
            hero.toolOnCooldown = 'bow';
            let direction = hero.d;
            if (dx || dy) {
                direction = getDirection(dx, dy, true);
            }
            const arrow = new Arrow({
                chargeLevel,
                damage: 2 ** chargeLevel,
                element,
                x: hero.x + 8 + 8 * directionMap[direction][0],
                y: hero.y + 8 * directionMap[direction][1] + 6,
                vx: speed * directionMap[direction][0],
                vy: speed * directionMap[direction][1],
                style: 'spirit',
            });
            addEffectToArea(state, state.areaInstance, arrow);
            return;
        case 'cloak':
            if (state.hero.isInvisible || state.hero.hasBarrier) {
                state.hero.shatterBarrier(state);
                state.hero.isInvisible = false;
                hero.toolCooldown = 0;
                hero.toolOnCooldown = null;
                return;
            }
            let cost = 5;
            if (chargeLevel === 1) {
                cost += 5;
            }
            if (state.hero.magic < cost) {
                return;
            }
            state.hero.magic -= cost;
            hero.toolOnCooldown = 'cloak';
            // This is based on the length of the animation for activating the cloak which is 20ms * 2 * 10
            hero.toolCooldown = 400;
            state.hero.barrierLevel = chargeLevel;
            if (chargeLevel === 1) {
                state.hero.barrierElement = element;
            }
            state.hero.hasBarrier = true;
            return;
        case 'clone':
            if (state.hero.magic <= 0 || state.hero.life <= 1) {
                return;
            }
            if (isGameKeyDown(state, GAME_KEY.PASSIVE_TOOL)
                && state.hero.clones.length < state.hero.activeTools.clone
            ) {
                state.hero.magic -= 10;
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
                state.hero.magic -= 10;
                hero.toolCooldown = 100;
                hero.toolOnCooldown = 'clone';
                hero.cloneToolReleased = false;
                for (let i = 0; i < state.hero.activeTools.clone && i < state.hero.life - 1; i++) {
                    const clone = new Clone(state.hero);
                    state.hero.clones.push(clone);
                    addObjectToArea(state, state.areaInstance, clone);
                }
            }
            return;
        case 'staff':
            if (state.activeStaff?.area && !state.activeStaff.recalling) {
                state.activeStaff.recall(state);
                hero.toolCooldown = 0;
                hero.toolOnCooldown = null;
                playAreaSound(state, state.areaInstance, 'menuTick');
                return;
            }
            if (state.activeStaff?.area || state.hero.magic <= 0) {
                return;
            }
            state.hero.magic -= 10;
            hero.toolCooldown = 200;
            hero.toolOnCooldown = 'staff';
            hero.action = 'usingStaff';
            hero.animationTime = 0;
            return;
    }
}
