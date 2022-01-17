import { addObjectToArea, addEffectToArea } from 'app/content/areas';
import { Arrow } from 'app/content/effects/arrow';
import { Clone }  from 'app/content/clone';
import { Staff } from 'app/content/staff';
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
            if (state.hero.element) {
                state.hero.magic -= 10;
            }
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
                state.hero.hasBarrier = false;
                state.hero.isInvisible = false;
                state.hero.toolCooldown = 0;
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
            state.hero.barrierLevel = chargeLevel;
            if (chargeLevel === 1) {
                state.hero.barrierElement = element;
            }
            state.hero.hasBarrier = true;
            if (state.hero.activeTools.cloak >= 2) {
                state.hero.isInvisible = true;
            }
            return;
        case 'clone':
            if (!state.hero.clones.length) {
                if (state.hero.magic <= 0 || state.hero.life < 2) {
                    return;
                }
                state.hero.magic -= 10;
                hero.toolOnCooldown = 'clone';
                for (let i = 0; i < state.hero.activeTools.clone && i < state.hero.life - 1; i++) {
                    const clone = new Clone(state.hero);
                    //state.hero.activeClone = clone;
                    state.hero.clones.push(clone);
                    addObjectToArea(state, state.areaInstance, clone);
                }
            }
            return;
        case 'staff':
            if (state.activeStaff) {
                state.activeStaff.remove(state);
                state.hero.toolCooldown = 0;
                hero.toolOnCooldown = null;
                return;
            }
            if (state.hero.magic <= 0) {
                return;
            }
            const staffLevel = state.hero.activeTools.staff
            const maxLength = staffLevel > 1 ? 64 : 4;
            const staff = new Staff(state, {
                x: hero.x + 8 + 12 * directionMap[hero.d][0],
                y: hero.y + 8 + 12 * directionMap[hero.d][1],
                damage: 4 * staffLevel,
                direction: hero.d,
                element: hero.element,
                maxLength,
            });
            if (staff.invalid) {
                return;
            }
            state.activeStaff = staff;
            addObjectToArea(state, state.areaInstance, staff);
            // A staff that takes up a single tile is also an invalid use, but we remove it after adding it.
            if (staff.topRow === staff.bottomRow && staff.leftColumn === staff.rightColumn) {
                staff.remove(state);
            } else {
                state.hero.magic -= 10;
                hero.toolOnCooldown = 'staff';
            }
            return;
    }
}
