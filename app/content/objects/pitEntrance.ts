import { applyBehaviorToTile, enterZoneByTarget, resetTileBehavior } from 'app/content/areas';
import { CANVAS_HEIGHT } from 'app/gameConstants';
import { throwHeldObject } from 'app/updateActor';
import { createAnimation, drawFrame } from 'app/utils/animations';
import { isObjectInsideTarget, pad } from 'app/utils/index';

import {
    AreaInstance, DrawPriority, GameState, ObjectInstance,
    ObjectStatus, ShortRectangle, EntranceDefinition, TileBehaviors,
} from 'app/types';

const pitFrame = createAnimation('gfx/tiles/pit.png', {w: 16, h: 16}).frames[0];

export class PitEntrance implements ObjectInstance {
    area: AreaInstance;
    drawPriority: DrawPriority = 'background';
    definition: EntranceDefinition = null;
    x: number;
    ignorePits = true;
    y: number;
    status: ObjectStatus = 'normal';
    constructor(definition: EntranceDefinition) {
        this.definition = definition;
        this.x = definition.x;
        this.y = definition.y;
    }
    getHitbox(state: GameState): ShortRectangle {
        return { x: this.x, y: this.y, w: 32, h: 32 };
    }
    update(state: GameState) {
        const hero = state.hero.activeClone || state.hero;
        if (this.area === hero.area && isObjectInsideTarget(hero, pad(this.getHitbox(state), 2))) {
            if (hero.action === 'fallen') {
                if (enterZoneByTarget(state, this.definition.targetZone, this.definition.targetObjectId, this.definition, false)) {
                    hero.action = 'knocked';
                    hero.animationTime = 0;
                    hero.z = CANVAS_HEIGHT;
                    hero.vx = hero.vy = 0;
                    hero.vz = -1;
                    hero.safeD = hero.d;
                    hero.safeX = hero.x;
                    hero.safeY = hero.y;
                }
            } else if (hero.action !== 'falling') {
                throwHeldObject(state, hero);
                hero.action = 'falling';
                hero.animationTime = 0;
            }
        }
    }
    add(state: GameState, area: AreaInstance) {
        this.area = area;
        area.objects.push(this);
        const y = Math.floor(this.y / 16);
        const x = Math.floor(this.x / 16);
        const pitBehaviors: TileBehaviors = {solid: false, solidMap: null, pit: true };
        applyBehaviorToTile(this.area, x, y, pitBehaviors);
        applyBehaviorToTile(this.area, x, y + 1, pitBehaviors);
        applyBehaviorToTile(this.area, x + 1, y, pitBehaviors);
        applyBehaviorToTile(this.area, x + 1, y + 1, pitBehaviors);
    }
    remove(state: GameState) {
        const index = this.area.objects.indexOf(this);
        if (index >= 0) {
            this.area.objects.splice(index, 1);
        }
        const y = Math.floor(this.y / 16);
        const x = Math.floor(this.x / 16);
        resetTileBehavior(this.area, {x, y});
        resetTileBehavior(this.area, {x: x + 1, y});
        resetTileBehavior(this.area, {x: x, y: y + 1});
        resetTileBehavior(this.area, {x: x + 1, y: y + 1});
        this.area = null;
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        drawFrame(context, pitFrame, this.getHitbox(state));
    }
}
