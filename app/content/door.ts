import _ from 'lodash';

import { enterZoneByTarget, resetTileBehavior } from 'app/content/areas';
import { findObjectInstanceById } from 'app/content/objects';
import { BITMAP_BOTTOM, BITMAP_LEFT, BITMAP_RIGHT, BITMAP_TOP } from 'app/content/palettes';
import { directionMap, getDirection } from 'app/utils/field';
import { boxesIntersect } from 'app/utils/index';

import {
    AreaInstance, DrawPriority, GameState, ObjectInstance,
    ObjectStatus, EntranceDefinition, ShortRectangle
} from 'app/types';


export class Door implements ObjectInstance {
    linkedObject: Door;
    alwaysReset = true;
    area: AreaInstance;
    drawPriority: DrawPriority = 'background';
    definition: EntranceDefinition = null;
    x: number;
    y: number;
    status: ObjectStatus = 'normal';
    constructor(state: GameState, definition: EntranceDefinition) {
        this.definition = definition;
        this.x = definition.x;
        this.y = definition.y;
        this.status = definition.status || 'normal';
    }
    changeStatus(state: GameState, status: ObjectStatus): void {
        this.status = status;
        if (this.linkedObject && this.linkedObject.status !== status) {
            this.linkedObject.changeStatus(state, status);
        }
        const y = Math.floor(this.y / 16);
        const x = Math.floor(this.x / 16);
        if (this.status === 'normal') {
            if (this.definition.d === 'left' || this.definition.d === 'right') {
                if (this.area.behaviorGrid[y]) {
                    this.area.behaviorGrid[y][x] = { solidMap: BITMAP_TOP };
                    this.area.behaviorGrid[y][x + 1] = { solidMap: BITMAP_TOP };
                }
                if (this.area.behaviorGrid[y + 1]) {
                    this.area.behaviorGrid[y + 1][x] = { solidMap: BITMAP_BOTTOM };
                    this.area.behaviorGrid[y + 1][x + 1] = { solidMap: BITMAP_BOTTOM };
                }
            } else {
                if (this.area.behaviorGrid[y]) {
                    this.area.behaviorGrid[y][x] = { solidMap: BITMAP_LEFT };
                    this.area.behaviorGrid[y][x + 1] = { solidMap: BITMAP_RIGHT };
                }
                if (this.area.behaviorGrid[y + 1]) {
                    this.area.behaviorGrid[y + 1][x] = { solidMap: BITMAP_LEFT };
                    this.area.behaviorGrid[y + 1][x + 1] = { solidMap: BITMAP_RIGHT };
                }
            }
        } else {
            if (this.area.behaviorGrid[y]) {
                this.area.behaviorGrid[y][x] = { solid: true };
                this.area.behaviorGrid[y][x + 1] = { solid: true };
            }
            if (this.area.behaviorGrid[y + 1]) {
                this.area.behaviorGrid[y + 1][x] = { solid: true };
                this.area.behaviorGrid[y + 1][x + 1] = { solid: true };
            }
        }
    }
    add(state: GameState, area: AreaInstance) {
        this.area = area;
        area.objects.push(this);
        this.changeStatus(state, this.status);
    }
    getHitbox(state: GameState): ShortRectangle {
        return { x: this.x, y: this.y, w: 32, h: 32};
    }
    // This is probably only needed by the editor since doors are not removed during gameplay.
    remove(state: GameState) {
        const y = Math.floor(this.y / 16);
        const x = Math.floor(this.x / 16);
        resetTileBehavior(this.area, {x, y});
        resetTileBehavior(this.area, {x: x + 1, y});
        resetTileBehavior(this.area, {x, y: y + 1});
        resetTileBehavior(this.area, {x: x + 1, y: y + 1});
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
        if ((!hero.actionTarget || hero.actionTarget === this) && boxesIntersect(hero, this.getHitbox(state))) {
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
            // If we are entering a door with a target zone, make sure we transition to the new zone before
            // we hit the edge of the screen and trigger the scrolling transition.
            if (hero.action === 'entering' && this.definition.targetZone && this.definition.targetObjectId) {
                if (hero.actionFrame > 8) {
                    if (hero.action === 'entering' && enterZoneByTarget(state, this.definition.targetZone, this.definition.targetObjectId)) {
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
                    }
                }
            }
        } else if (hero.actionTarget === this) {
            hero.action = null;
            hero.actionTarget = null;
            hero.actionDx = 0;
            hero.actionDy = 0;
            hero.safeD = hero.d;
            hero.safeX = hero.x;
            hero.safeY = hero.y;
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        context.fillStyle = '#888';
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
