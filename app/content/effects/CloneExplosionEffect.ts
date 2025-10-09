import {EXPLOSION_RADIUS, FRAME_LENGTH} from 'app/gameConstants';
import {createAnimation, drawFrame, getFrame} from 'app/utils/animations';
import {removeEffectFromArea} from 'app/utils/effects';
import {hitTargets} from 'app/utils/field';


const explosionGeometry: FrameDimensions = {w: 32, h: 32};
const explosionAnimation = createAnimation('gfx/effects/explosion.png', explosionGeometry, { cols: 6, duration: 4}, { loop: false });


interface Props {
    x?: number
    y?: number,
}

const minRadius = 16, maxRadius = EXPLOSION_RADIUS;

export class CloneExplosionEffect implements EffectInstance {
    area: AreaInstance;
    animationTime: number;
    destroyedObjects: boolean = false;
    isEffect = <const>true;
    x: number;
    y: number;
    isPlayerAttack = true;
    hitTargets: Set<EffectInstance | ObjectInstance>;
    constructor({x = 0, y = 0 }: Props) {
        this.animationTime = 0;
        this.x = x;
        this.y = y;
        this.hitTargets = new Set();
    }
    getRadius(): number {
        return minRadius + (maxRadius - minRadius) * Math.max(0, Math.min(1, 1 * (this.animationTime - 80) / (500 - 80)));
    }
    update(state: GameState) {
        this.animationTime += FRAME_LENGTH;
        const r = this.getRadius();
        if (this.animationTime >= 80 && this.animationTime < 500) {
            const hitResult = hitTargets(state, this.area, {
                damage: 4,
                canPush: true,
                cutsGround: true,
                destroysObjects: true,
                knockAwayFromHit: true,
                hitCircle: {x: this.x, y: this.y, r},
                hitEnemies: true,
                hitObjects: true,
                hitTiles: true,
                ignoreTargets: this.hitTargets,
                source: state.hero,
            });
            if (hitResult.hitTargets.size) {
                this.hitTargets = new Set([...this.hitTargets, ...hitResult.hitTargets]);
            }
        }
        if (this.animationTime >= explosionAnimation.duration) {
            removeEffectFromArea(state, this);
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        const frame = getFrame(explosionAnimation, this.animationTime);
        // Debug code to render the hitbox and makes sure it matches the animation.
        /*if (this.animationTime >= 80 && this.animationTime < 500) {
            const r = this.getRadius();
            context.beginPath();
            context.arc(this.x, this.y, r, 0, 2 * Math.PI);
            context.fillStyle = 'red';
            context.fill();
        }
        context.save();
            context.globalAlpha *= 0.6;
            drawFrame(context, frame, {w: 2 * frame.w, h: 2 * frame.h, x: this.x - frame.w, y: this.y - frame.h});
        context.restore();
        */
        drawFrame(context, frame, {w: 2 * frame.w, h: 2 * frame.h, x: this.x - frame.w, y: this.y - frame.h});
    }
}

