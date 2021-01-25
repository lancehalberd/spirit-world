import { enterZoneByTarget } from 'app/content/areas';
import { CANVAS_HEIGHT } from 'app/gameConstants';
import { createAnimation, drawFrame } from 'app/utils/animations';
import { isObjectInsideTarget } from 'app/utils/index';

import {
    DrawPriority, GameState, ObjectInstance,
    ObjectStatus, ShortRectangle, EntranceDefinition,
} from 'app/types';

const pitFrame = createAnimation('gfx/tiles/pit.png', {w: 16, h: 16}).frames[0];

export class PitEntrance implements ObjectInstance {
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
        if (isObjectInsideTarget(hero, this.getHitbox(state))) {
            if (hero.action === 'fallen') {
                if (enterZoneByTarget(state, this.definition.targetZone, this.definition.targetObjectId)) {
                    hero.action = 'knocked';
                    hero.z = CANVAS_HEIGHT;
                    hero.vx = hero.vy = 0;
                    hero.vz = -1;
                }
            } else if (hero.action !== 'falling') {
                hero.action = 'falling';
                hero.actionFrame = 0;
            }
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        drawFrame(context, pitFrame, this.getHitbox(state));
    }
}
