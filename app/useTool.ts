import { addObjectToArea } from 'app/content/areas';
import { Arrow } from 'app/content/arrow';
import { Clone }  from 'app/content/clone';
import { Staff } from 'app/content/staff';
import { directionMap } from 'app/utils/field';

import { ActiveTool, GameState, Hero } from 'app/types'

export function useTool(
    state: GameState,
    hero: Hero,
    tool: ActiveTool,
    dx: number,
    dy: number,
): void {
    switch (tool) {
        case 'bow':
            if (state.hero.magic < 5) {
                return;
            }
            state.hero.magic -= 5;
            const arrow = new Arrow({
                x: hero.x + 8 + 8 * directionMap[hero.d][0],
                y: hero.y + 8 * directionMap[hero.d][1],
                vx: 4 * directionMap[hero.d][0],
                vy: 4 * directionMap[hero.d][1],
                direction: hero.d
            });
            addObjectToArea(state, state.areaInstance, arrow);
            return;
        case 'invisibility':
            if (state.hero.invisible) {
                state.hero.invisible = false;
                state.hero.toolCooldown = 0;
                return;
            }
            if (state.hero.magic < state.hero.invisibilityCost) {
                return;
            }
            state.hero.invisibilityCost += 4;
            state.hero.invisible = true;
            return;
        case 'clone':
            if (!state.hero.clones.length) {
                if (state.hero.magic < 10) {
                    return;
                }
                state.hero.magic -= 10;
                for (let i = 0; i < state.hero.activeTools.clone; i++) {
                    const clone = new Clone(state.hero);
                    state.hero.activeClone = clone;
                    state.hero.clones.push(clone);
                    addObjectToArea(state, state.areaInstance, clone);
                }
            } else {
                const currentIndex = state.hero.clones.indexOf(state.hero.activeClone);
                state.hero.activeClone = state.hero.clones[currentIndex + 1];
            }
            return;
        case 'staff':
            if (state.hero.activeStaff) {
                state.hero.activeStaff.remove(state, state.areaInstance);
                state.hero.toolCooldown = 0;
                return;
            }
            if (state.hero.magic < 10) {
                return;
            }
            const staffLevel = state.hero.activeTools.staff
            const maxLength = staffLevel > 1 ? 64 : 4;
            const staff = new Staff(state, {
                x: hero.x + 8 + 8 * directionMap[hero.d][0],
                y: hero.y + 8 + 8 * directionMap[hero.d][1],
                damage: 4 * staffLevel,
                direction: hero.d,
                element: hero.element,
                maxLength,
            });
            if (staff.invalid) {
                return;
            }
            state.hero.activeStaff = staff;
            addObjectToArea(state, state.areaInstance, staff);
            // A staff that takes up a single tile is also an invalid use, but we remove it after adding it.
            if (staff.topRow === staff.bottomRow && staff.leftColumn === staff.rightColumn) {
                staff.remove(state, state.areaInstance);
            } else {
                state.hero.magic -= 10;
            }
            return;
    }
}
