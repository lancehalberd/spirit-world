import { resetTileBehavior } from 'app/content/areas';
import { BITMAP_BOTTOM, BITMAP_LEFT, BITMAP_RIGHT, BITMAP_TOP } from 'app/content/palettes';
import { isBoxInBox } from 'app/utils/index';

import {
    AreaInstance, DrawPriority, GameState, ObjectInstance,
    ObjectStatus, SimpleObjectDefinition,
} from 'app/types';


export class Door implements ObjectInstance {
    area: AreaInstance;
    drawPriority: DrawPriority = 'background';
    definition: SimpleObjectDefinition = null;
    x: number;
    y: number;
    status: ObjectStatus = 'normal';
    constructor(state: GameState, definition: SimpleObjectDefinition) {
        this.definition = definition;
        this.x = definition.x;
        this.y = definition.y;
        this.status = definition.status || 'normal';
    }
    changeStatus(state: GameState, status: ObjectStatus): void {
        this.status = status;
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
    // This is probably only needed by the editor since doors are not removed during gameplay.
    remove(state: GameState, area: AreaInstance) {
        const y = Math.floor(this.y / 16);
        const x = Math.floor(this.x / 16);
        resetTileBehavior(area, {x, y});
        resetTileBehavior(area, {x: x + 1, y});
        resetTileBehavior(area, {x, y: y + 1});
        resetTileBehavior(area, {x: x + 1, y: y + 1});
        const index = area.objects.indexOf(this);
        if (index >= 0) {
            area.objects.splice(index, 1);
        }
    }
    update(state: GameState) {
        const hero = state.hero.activeClone || state.hero;
        if (isBoxInBox(hero, { x: this.x, y: this.y, w: 32, h: 32})) {
            if (hero.action !== 'beingMoved') {
                hero.action = 'beingMoved';
                hero.actionTarget = this;
                hero.actionDx = 0;
                hero.actionDy = 0;
                if (this.definition.d === 'up' || this.definition.d === 'down') {
                    hero.actionDy = (hero.y + hero.h / 2 < this.y + 16) ? 1 : -1;
                } else {
                    hero.actionDx = (hero.x + hero.w / 2 < this.x + 16) ? 1 : -1;
                }
            }
            hero.x += 2 * hero.actionDx;
            hero.y += 2 * hero.actionDy;
        } else if (hero.actionTarget === this) {
            hero.action = null;
            hero.actionTarget = null;
            hero.actionDx = 0;
            hero.actionDy = 0;
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
