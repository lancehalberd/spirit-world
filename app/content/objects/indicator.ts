import { objectHash } from 'app/content/objects/objectHash';
import { editingState } from 'app/development/editingState';
import { FRAME_LENGTH } from 'app/gameConstants';

import {
    AreaInstance, GameState, ObjectInstance,
    ObjectStatus, IndicatorDefinition, Rect,
} from 'app/types';

export class Indicator implements ObjectInstance {
    area: AreaInstance;
    drawPriority: 'foreground' = 'foreground';
    definition: IndicatorDefinition = null;
    isObject = <const>true;
    x: number;
    y: number;
    charge = 1;
    chargeStage = 0;
    status: ObjectStatus = 'normal';
    animationTime = 0;
    target?: ObjectInstance;
    constructor(state: GameState, definition: IndicatorDefinition) {
        this.definition = definition;
        this.x = this.definition.x;
        this.y = this.definition.y;
    }
    getHitbox(): Rect {
        return { x: this.x, y: this.y, w: 16, h: 16 };
    }
    update(state: GameState) {
        if (this.status !== 'normal') {
            return;
        }
        if (this.target) {
            // If the target is removed then the indicator should disappear as well.
            if (!this.target.area || this.target.status === 'hidden' || this.target.status === 'gone') {
                this.status = 'hidden';
                return;
            }
            const targetHitbox = this.target.getHitbox();
            const hitbox = this.getHitbox();
            this.x = targetHitbox.x + (targetHitbox.w - hitbox.w) / 2;
            this.y = targetHitbox.y + (targetHitbox.h - hitbox.h) / 2;
        } else if (this.definition.targetObjectId) {
            // If no target is assigned yet, but a targetObjectId is defined, attach this to the first object in this area or the alternate area
            // with matching id.
            const targetObject = [...this.area.objects, ...this.area.alternateArea.objects].find(o => o.definition?.id === this.definition.targetObjectId);
            if (!targetObject) {
                this.status = 'hidden';
            } else {
                this.target = targetObject;
            }
        }
        this.animationTime += FRAME_LENGTH;
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        // Indicators will be wrong the first frame they appear for certain randomized target objects, so wait 1 frame before rendering them.
        if (this.definition.targetObjectId && this.animationTime <= 20) {
            return;
        }
        if (this.status !== 'normal' || !(state.hero.passiveTools.trueSight || editingState.isEditing)) {
            return;
        }
        renderIndicator(context, this.getHitbox(), this.animationTime);
    }
}
objectHash.indicator = Indicator;

export function renderIndicator(context: CanvasRenderingContext2D, target: Rect, animationTime: number): void {
    const pBase = 1 - (animationTime % 2000) / 2000;
    //const pBase = 0.5 + 0.3 * Math.cos(this.animationTime / 1000);
    for (let i = 0; i < 3; i++) {
        const p = (pBase + i * 0.25) % 1;
        const r = 16 - 16 * p;
        context.fillStyle = '#d838ff';
        context.save();
            context.globalAlpha *= 0.6 * p;
            context.beginPath();
            context.arc(target.x + target.w / 2, target.y + target.h / 2, r, 0, 2 * Math.PI);
            context.fill();
        context.restore();
    }
}
