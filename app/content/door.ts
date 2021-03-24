import _ from 'lodash';

import { enterZoneByTarget, resetTileBehavior } from 'app/content/areas';
import { findObjectInstanceById } from 'app/content/objects';
import { BITMAP_BOTTOM, BITMAP_LEFT, BITMAP_RIGHT, BITMAP_TOP } from 'app/content/palettes';
import { directionMap, getDirection } from 'app/utils/field';
import { boxesIntersect, isPointInShortRect } from 'app/utils/index';

import {
    AreaInstance, DrawPriority, GameState, ObjectInstance,
    ObjectStatus, EntranceDefinition, ShortRectangle, TileBehaviors
} from 'app/types';


export const doorStyles = {
    normal: {
        w: 32,
        h: 32,
    },
    wideEntrance: {
        w: 64,
        h: 16,
    },
};

function applyBehaviorToTile(area: AreaInstance, x: number, y: number, behavior: TileBehaviors): void {
    if (!area.behaviorGrid[y]) {
        area.behaviorGrid[y] = [];
    }
    if (!area.behaviorGrid[y][x]) {
        area.behaviorGrid[y][x] = {};
    }
    area.behaviorGrid[y][x] = {...area.behaviorGrid[y][x], ...behavior};
}

export class Door implements ObjectInstance {
    linkedObject: Door;
    alwaysReset = true;
    updateDuringTransition = true;
    area: AreaInstance;
    drawPriority: DrawPriority = 'background';
    definition: EntranceDefinition = null;
    x: number;
    y: number;
    status: ObjectStatus = 'normal';
    style: string = 'normal';
    constructor(state: GameState, definition: EntranceDefinition) {
        this.definition = definition;
        this.x = definition.x;
        this.y = definition.y;
        this.status = definition.status || 'normal';
        this.style = definition.style || 'normal';
    }
    changeStatus(state: GameState, status: ObjectStatus): void {
        this.status = status;
        if (this.linkedObject && this.linkedObject.status !== status) {
            this.linkedObject.changeStatus(state, status);
        }
        const y = Math.floor(this.y / 16);
        const x = Math.floor(this.x / 16);
        if (this.style === 'wideEntrance') {
            const behaviors = this.status === 'normal' ? { solid: false } : { solid: true};
            if (this.definition.d === 'up' || this.definition.d === 'down') {
                applyBehaviorToTile(this.area, x, y, behaviors);
                applyBehaviorToTile(this.area, x + 1, y, behaviors);
                applyBehaviorToTile(this.area, x + 2, y, behaviors);
                applyBehaviorToTile(this.area, x + 3, y, behaviors);
            } else {
                applyBehaviorToTile(this.area, x, y, behaviors);
                applyBehaviorToTile(this.area, x, y + 1, behaviors);
                applyBehaviorToTile(this.area, x, y + 2, behaviors);
                applyBehaviorToTile(this.area, x, y + 3, behaviors);
            }
        } else if (this.style === 'normal') {
            if (this.status === 'normal') {
                if (this.definition.d === 'left' || this.definition.d === 'right') {
                    applyBehaviorToTile(this.area, x, y, { solidMap: BITMAP_TOP });
                    applyBehaviorToTile(this.area, x + 1, y, { solidMap: BITMAP_TOP });
                    applyBehaviorToTile(this.area, x, y + 1, { solidMap: BITMAP_BOTTOM });
                    applyBehaviorToTile(this.area, x + 1, y + 1, { solidMap: BITMAP_BOTTOM });
                } else {
                    applyBehaviorToTile(this.area, x, y, { solidMap: BITMAP_LEFT });
                    applyBehaviorToTile(this.area, x + 1, y, { solidMap: BITMAP_RIGHT });
                    applyBehaviorToTile(this.area, x, y + 1, { solidMap: BITMAP_LEFT });
                    applyBehaviorToTile(this.area, x + 1, y + 1, { solidMap: BITMAP_RIGHT });
                }
            } else {
                const behaviors = { solid: true};
                applyBehaviorToTile(this.area, x, y, behaviors);
                applyBehaviorToTile(this.area, x + 1, y, behaviors);
                applyBehaviorToTile(this.area, x, y + 1, behaviors);
                applyBehaviorToTile(this.area, x + 1, y + 1, behaviors);
            }
        }
    }
    add(state: GameState, area: AreaInstance) {
        this.area = area;
        area.objects.push(this);
        this.changeStatus(state, this.status);
    }
    getHitbox(state: GameState): ShortRectangle {
        if (this.definition.d === 'up' || this.definition.d === 'down') {
            return { x: this.x, y: this.y, w: doorStyles[this.style].w, h: doorStyles[this.style].h};
        }
        return { x: this.x, y: this.y, w: doorStyles[this.style].h, h: doorStyles[this.style].w};
    }
    // This is probably only needed by the editor since doors are not removed during gameplay.
    remove(state: GameState) {
        const y = Math.floor(this.y / 16);
        const x = Math.floor(this.x / 16);
        if (this.style === 'wideEntrance') {
            if (this.definition.d === 'up' || this.definition.d === 'down') {
                resetTileBehavior(this.area, {x, y});
                resetTileBehavior(this.area, {x: x + 1, y});
                resetTileBehavior(this.area, {x: x + 2, y});
                resetTileBehavior(this.area, {x: x + 3, y});
            } else {
                resetTileBehavior(this.area, {x, y});
                resetTileBehavior(this.area, {x, y: y + 1});
                resetTileBehavior(this.area, {x, y: y + 2});
                resetTileBehavior(this.area, {x, y: y + 3});
            }
        } else if (this.style === 'normal') {
            resetTileBehavior(this.area, {x, y});
            resetTileBehavior(this.area, {x: x + 1, y});
            resetTileBehavior(this.area, {x, y: y + 1});
            resetTileBehavior(this.area, {x: x + 1, y: y + 1});
        }
        const index = this.area.objects.indexOf(this);
        if (index >= 0) {
            this.area.objects.splice(index, 1);
        }
    }
    update(state: GameState) {
        let hero = state.hero.activeClone || state.hero;
        // Nothing to update if the hero isn't in the same world as this door.
        if (hero.area !== this.area) {
            return;
        }
        const heroIsTouchingDoor = boxesIntersect(hero, this.getHitbox(state));
        if ((!hero.actionTarget || hero.actionTarget === this) && heroIsTouchingDoor) {
            let shouldEnterDoor = (hero.action !== 'entering' && hero.action !== 'exiting');
            if (!shouldEnterDoor && hero.actionTarget !== this) {
                const direction = getDirection(-hero.actionDx, -hero.actionDy);
                // If the hero is moving in the direction opposite this door, then we should take over the movement,
                // as this happens when the hero is passed from an entrance to an exit.
                if (direction === this.definition.d) {
                    shouldEnterDoor = true;
                }
            }
            if (shouldEnterDoor && hero.actionTarget !== this) {
                hero.action = 'entering';
                hero.actionFrame = 0;
                hero.actionTarget = this;
                hero.actionDx = 0;
                hero.actionDy = 0;
                if (this.definition.d === 'up' || this.definition.d === 'down') {
                    hero.actionDy = (hero.y + hero.h / 2 < this.y + 16) ? 1 : -1;
                } else {
                    hero.actionDx = (hero.x + hero.w / 2 < this.x + 16) ? 1 : -1;
                }
            }
            if (hero.actionTarget !== this) {
                return;
            }
            // Reduce speed to the regular screen transition speed if the player transitions screens while
            // moving through the door.
            const speed = state.nextAreaInstance ? 0.75 : 2;
            hero.x += speed * hero.actionDx;
            hero.y += speed * hero.actionDy;
        }
        if (hero.actionTarget === this) {
            const x = hero.x + hero.w / 2 + hero.actionDx * hero.w / 2;
            const y = hero.y + hero.h / 2 + hero.actionDy * hero.h / 2;
            const changedZones = !isPointInShortRect(x, y, this.getHitbox(state)) && this.travelToZone(state);
            if (!changedZones && !heroIsTouchingDoor) {
                hero.action = null;
                hero.actionTarget = null;
                hero.actionDx = 0;
                hero.actionDy = 0;
                hero.safeD = hero.d;
                hero.safeX = hero.x;
                hero.safeY = hero.y;
            }
        }
    }
    travelToZone(state: GameState) {
        let hero = state.hero.activeClone || state.hero;
        if (hero.action !== 'entering' || !this.definition.targetZone || !this.definition.targetObjectId) {
            return false;
        }
        return enterZoneByTarget(state, this.definition.targetZone, this.definition.targetObjectId, false, () => {
            // We need to reassign hero after calling `enterZoneByTarget` because the active hero may change
            // from one clone to another when changing zones.
            hero = state.hero.activeClone || state.hero;
            hero.action = 'exiting';
            const target = findObjectInstanceById(state.areaInstance, this.definition.targetObjectId) as Door;
            if (!target){
                console.error(state.areaInstance.objects);
                console.error(this.definition.targetObjectId);
                debugger;
            }
            hero.actionTarget = target;
            // Make sure the hero is coming *out* of the target door.
            hero.actionDx = -directionMap[target.definition.d][0];
            hero.actionDy = -directionMap[target.definition.d][1];
            // This will be the opposite direction of the door they are coming out of.
            hero.d = getDirection(hero.actionDx, hero.actionDy);
        });
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        context.fillStyle = '#888';
        if (this.style === 'wideEntrance') {
            if (this.status !== 'normal' && state.hero.actionTarget !== this) {
                const hitbox = this.getHitbox(state);
                context.fillRect(hitbox.x, hitbox.y, hitbox.w, hitbox.h);
            } else {
                // Display nothing when this entrance is open.
            }
        } else if (this.style === 'normal') {
            if (this.status === 'normal' || state.hero.actionTarget === this) {
                if (this.definition.d === 'left' || this.definition.d === 'right') {
                    context.fillRect(this.x, this.y, 32, 8);
                    context.fillRect(this.x, this.y + 24, 32, 8);
                } else {
                    context.fillRect(this.x, this.y, 8, 32);
                    context.fillRect(this.x + 24, this.y, 8, 32);
                }
            } else {
                context.fillRect(this.x, this.y, 32, 32);
            }
        }
    }
}
