import { removeEffectFromArea } from 'app/content/areas';
import { FRAME_LENGTH } from 'app/gameConstants';
import { spiritBarrierBreakingAnimation } from 'app/renderActor';
import { getFrame, drawFrame } from 'app/utils/animations';
import { hitTargets } from 'app/utils/field';

import { AreaInstance, DrawPriority, GameState, EffectInstance } from 'app/types';


interface Props {
    x?: number
    y?: number,
}

const duration = 200;

const minRadius = 15, maxRadius = 45;

export class BarrierBurstEffect implements EffectInstance {
    area: AreaInstance;
    animationTime: number;
    drawPriority: DrawPriority = 'sprites';
    destroyedObjects: boolean = false;
    isEffect = <const>true;
    x: number;
    y: number;
    isPlayerAttack = true;
    constructor({x = 0, y = 0 }: Props) {
        this.animationTime = 0;
        this.x = x;
        this.y = y;
    }
    getRadius() {
        return minRadius + (maxRadius - minRadius) * this.animationTime / duration;
    }
    update(state: GameState) {
        this.animationTime += FRAME_LENGTH;
        const r = this.getRadius();
        if (this.animationTime <= duration) {
            hitTargets(state, this.area, {
                damage: 2,
                canPush: true,
                cutsGround: true,
                knockAwayFromHit: true,
                hitEnemies: true,
                hitCircle: {x: this.x, y: this.y, r},
                hitObjects: true,
                hitTiles: true,
            });
        }
        if (this.animationTime > duration) {
            removeEffectFromArea(state, this);
        }
    }
    render(context, state: GameState) {
        const r = this.getRadius();
        const frame = getFrame(spiritBarrierBreakingAnimation, this.animationTime);
        // Debug code for viewing the hitCircle
        /*context.save();
            context.globalAlpha *= 0.5;
            context.beginPath();
            context.arc(this.x, this.y, r, 0, 2 * Math.PI);
            context.fillStyle = 'red';
            context.fill();
        context.restore();*/
        // This has been adjusted 2 pixels left and 5 pixels up by hand to look correct.
        const scale = r / minRadius;
        drawFrame(context, frame, {
            x: this.x - r - 1 * scale,
            y: this.y - r - 3 * scale,
            w: frame.w * scale,
            h: frame.w * scale
        });
    }
}

