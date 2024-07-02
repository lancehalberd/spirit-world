import { FRAME_LENGTH } from 'app/gameConstants';
import { addEffectToArea, removeEffectFromArea } from 'app/utils/effects';
import { getTileBehaviors, hitTargets } from 'app/utils/field';
import { createAnimation, drawFrame, getFrame } from 'app/utils/animations';


interface Props {
    x?: number
    y?: number
    damage?: number
    delay?: number
    tellDuration?: number
}

const warningAnimation = createAnimation('gfx/effects/eyespike.png', {w: 24, h: 48},
    {cols: 4, duration: 5}, {loop: false});
const damageAnimation = createAnimation('gfx/effects/eyespike.png', {w: 24, h: 48},
    {x: 4, cols: 3, duration: 5}, {loop: false});
const fadeAnimation = createAnimation('gfx/effects/eyespike.png', {w: 24, h: 48},
    {x: 7, cols: 3, duration: 5}, {loop: false});

const animationDuration = damageAnimation.duration;
const fadeDuration = fadeAnimation.duration;

export class GroundSpike implements EffectInstance, Props {
    drawPriority: DrawPriority = 'sprites';
    area: AreaInstance = null;
    isEffect = <const>true;
    isEnemyAttack = true;
    behaviors: TileBehaviors = {groundHeight: 3};
    frame: Frame;
    damage: number;
    x: number;
    y: number;
    z: number = 0;
    vz: number = 0;
    vx: number;
    vy: number;
    w: number = 16;
    h: number = 16;
    delay: number;
    tellDuration: number;
    animationTime = 0;
    constructor({x = 0, y = 0, damage = 2, delay = 0, tellDuration = 1000}: Props) {
        this.x = x - this.w / 2;
        this.y = y - this.h / 2;
        this.delay = delay;
        this.tellDuration = tellDuration;
        this.damage = damage;
    }
    update(state: GameState) {
        if (this.delay >= 0) {
            this.delay -= FRAME_LENGTH;
            return;
        }
        this.animationTime += FRAME_LENGTH;
        if (this.animationTime >= this.tellDuration + 60 && this.animationTime <= this.tellDuration + animationDuration) {
            hitTargets(state, this.area, {
                damage: this.damage,
                hitbox: this.getHitbox(),
                knockAwayFrom: {x: this.x + this.w / 2, y: this.y + this.h / 2},
                hitAllies: true,
                hitTiles: true,
                cutsGround: true,
            });
        } else if (this.animationTime < this.tellDuration) {
            hitTargets(state, this.area, {
                damage: this.damage,
                hitbox: this.getHitbox(),
                hitAllies: false,
                hitTiles: true,
                cutsGround: true,
            });
        }
        if (this.animationTime >= this.tellDuration + animationDuration + fadeDuration) {
            removeEffectFromArea(state, this);
        }
    }
    getHitbox() {
        // The animation for the ground crack is a bit shorter than a full tile
        // so the hitbox is reduced to make it a bit easier to dodge.
        return {x: this.x, y: this.y + 2, w: 16, h: 12};
    }
    getFrameTarget() {
        return {x: this.x - 4, y: this.y - 32, w: 24, h: 48};
    }

    render(context: CanvasRenderingContext2D, state: GameState) {
        let time = this.animationTime - this.tellDuration;
        if (time <= 0) {
            return;
        }
        let animation = damageAnimation;
        if (time > animationDuration) {
            time -= animationDuration;
            animation = fadeAnimation;
        }
        const frame = getFrame(animation, time);
        drawFrame(context, frame, this.getFrameTarget());
    }
    renderShadow(context: CanvasRenderingContext2D, state: GameState) {
        // Since this has a tell, render nothing until the delay is over.
        if (this.delay >= 0 || this.animationTime > this.tellDuration) {
            return;
        }
        // Uncomment this to see how the warningAnimation tracks with the hitbox.
        // context.fillStyle = 'red';
        // const hitbox = this.getHitbox();
        // context.fillRect(hitbox.x, hitbox.y, hitbox.w, hitbox.h);
        // This draws the ground cracking with a small spike protruding
        // indicating where the spike will damage the player.
        const frame = getFrame(warningAnimation, this.animationTime);
        drawFrame(context, frame, this.getFrameTarget());
    }
}

interface LineProps {
    state: GameState
    area: AreaInstance
    source: Coords
    target: Coords
    spacing?: number
    length?: number
    spikeProps?: Props
}
export function addLineOfSpikes(this: void, {
    state, area, source, target, spacing = 20, length = 256, spikeProps = {}
}: LineProps): void {
    const theta = Math.atan2(target[1] - source[1], target[0] - source[0]);
    const dx = spacing * Math.cos(theta), dy = spacing * Math.sin(theta);
    const count = Math.ceil(length / spacing);
    for (let i = 1; i < count; i++) {
        const x = source[0] + i * dx, y = source[1] + i * dy;
        // Solid tiles/pits stop the line of spikes
        const { tileBehavior } = getTileBehaviors(state, area, {x: x + 8, y: y + 8});
        if ((tileBehavior?.solid && !tileBehavior?.low) || tileBehavior?.pit || tileBehavior?.pitMap) {
            return;
        }
        const groundSpike = new GroundSpike({
            ...spikeProps,
            delay: (spikeProps.delay || 0) + i * 40,
            tellDuration: 1000 - i * 40,
            x, y,
        });
        addEffectToArea(state, area, groundSpike);
        // Do an additional check for a barrier when spacing is greater than 16px to avoid skipping over barriers.
        if (spacing > 16) {
            const { tileBehavior } = getTileBehaviors(state, area, {x: x + 8 + spacing / 2, y: y + 8 + spacing / 2});
            if ((tileBehavior?.solid && !tileBehavior?.low) || tileBehavior?.pit || tileBehavior?.pitMap) {
                return;
            }
        }
    }
}
