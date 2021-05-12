import { enterZoneByTarget } from 'app/content/areas';
import { CANVAS_HEIGHT } from 'app/gameConstants';
import { throwHeldObject } from 'app/updateActor';
import { createAnimation, drawFrame } from 'app/utils/animations';
import { isObjectInsideTarget, pad } from 'app/utils/index';

import {
    AreaInstance, DrawPriority, GameState, ObjectInstance,
    ObjectStatus, ShortRectangle, EntranceDefinition,
} from 'app/types';

const pitFrame = createAnimation('gfx/tiles/pit.png', {w: 16, h: 16}).frames[0];

export class PitEntrance implements ObjectInstance {
    area: AreaInstance;
    drawPriority: DrawPriority = 'background';
    definition: EntranceDefinition = null;
    x: number;
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
    render(context: CanvasRenderingContext2D, state: GameState) {
        drawFrame(context, pitFrame, this.getHitbox(state));
    }
}
