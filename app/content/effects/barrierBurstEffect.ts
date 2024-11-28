import { addBurstParticle } from 'app/content/effects/animationEffect';
import { FRAME_LENGTH } from 'app/gameConstants';
import { playAreaSound } from 'app/musicController';
import { renderLightningCircle } from 'app/render/renderLightning';
import { isUnderwater } from 'app/utils/actor';
import { createAnimation, getFrame, drawFrameCenteredAt } from 'app/utils/animations';
import { removeEffectFromArea } from 'app/utils/effects';
import { hitTargets } from 'app/utils/field';


const burstAnimation = createAnimation('gfx/effects/45radiusburst.png', {w: 90, h: 90}, {cols: 9, duration: 2});

const frameRadii = [15, 20, 28, 30, 35, 40, 45, 50];

interface Props {
    x?: number
    y?: number
    element: MagicElement
    level: number
    source: Hero
}

const duration = burstAnimation.duration;

export class BarrierBurstEffect implements EffectInstance {
    area: AreaInstance;
    animationTime: number;
    drawPriority: DrawPriority = 'foreground';
    destroyedObjects: boolean = false;
    element: MagicElement;
    level: number;
    isEffect = <const>true;
    x: number;
    y: number;
    z: number;
    isPlayerAttack = true;
    source: Hero;
    // These flags allow an active barrier burst to transition between areas.
    updateDuringTransition = true;
    changesAreas = true;
    constructor({x = 0, y = 0, element, level, source }: Props) {
        this.animationTime = 0;
        this.x = source.x + 8;
        this.y = source.y + 8;
        this.z = source.z;
        this.element = element;
        this.level = level;
        this.source = source;
    }
    getRadius() {
        const frameIndex = Math.floor(this.animationTime / burstAnimation.frameDuration / FRAME_LENGTH);
        return frameRadii[frameIndex] ?? 0;
    }
    update(state: GameState) {
        if (this.animationTime === 0) {
            playAreaSound(state, this.area, 'enemyDeath');
        }
        this.x = this.source.x + 8;
        this.y = this.source.y + 8;
        this.z = this.source.z;
        // Elemental effects can linger after the burst if the player remains invisible.
        const shouldLinger =
            // Only elemental effects linger from barrier bursts
            this.element
            // Cleanup the burst if it is no longer in the same area for some reason, unless during a transition
            && (state.transitionState || this.area === this.source.area)
            // The effect lingers only as long as the hero is still invisible.
            && this.source.isInvisible
            // Barrier burst effect is removed on entering deep water
            && !this.source.swimming
            && !isUnderwater(state, this.source);
        this.animationTime += FRAME_LENGTH;
        const r = this.getRadius();
        const damage = 2 * this.level;
        if (r > 0) {
            if (this.element === 'lightning') {
                hitTargets(state, this.area, {
                    damage,
                    hitEnemies: true,
                    hitCircle: {x: this.x, y: this.y, r: 72},
                    hitObjects: true,
                    hitTiles: true,
                    element: this.element,
                    source: this.source,
                });
            }
            hitTargets(state, this.area, {
                damage,
                canPush: true,
                cutsGround: true,
                knockAwayFromHit: true,
                hitEnemies: true,
                hitCircle: {x: this.x, y: this.y, r},
                hitObjects: true,
                hitTiles: true,
                element: this.element,
                source: this.source,
            });
            let theta = 2 * Math.PI * Math.random();
            for (let i = 0; i < 4; i++) {
                addBurstParticle(state, this.area,
                    this.x + r * Math.cos(theta),
                    this.y + r * Math.sin(theta),
                    i, this.element);
                theta += 2 * Math.PI / 4;
            }
        } else if (shouldLinger) {
            let r = 24;
            if (this.element === 'lightning') {
                r = 36;
            }
            hitTargets(state, this.area, {
                damage: damage / 2,
                hitEnemies: true,
                hitCircle: {x: this.x, y: this.y, r},
                hitObjects: true,
                hitTiles: true,
                element: this.element,
                source: this.source,
            });
            if (this.element !== 'lightning') {
                let theta = 2 * Math.PI * Math.random();
                for (let i = 0; i < 4; i++) {
                    addBurstParticle(state, this.area,
                        this.x + r * Math.cos(theta),
                        this.y + r * Math.sin(theta),
                        i, this.element);
                    theta += 2 * Math.PI / 4;
                }
            }
        }
        if (this.animationTime >= duration && !shouldLinger) {
            removeEffectFromArea(state, this);
            if (this.source.activeBarrierBurst === this) {
                delete this.source.activeBarrierBurst;
            }
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        // Debug code for viewing the hitCircle
        /*const r = this.getRadius();
        if (r > 0) {
            context.save();
                context.globalAlpha *= 0.5;
                context.beginPath();
                context.arc(this.x, this.y, r, 0, 2 * Math.PI);
                context.fillStyle = 'red';
                context.fill();
            context.restore();
        }*/
        const y = this.y - this.z;
        // The burst animation is only rendered initially.
        if (this.animationTime < duration) {
            const frame = getFrame(burstAnimation, this.animationTime);
            drawFrameCenteredAt(context, frame, {
                ...frame,
                x: this.x - frame.w / 2,
                y: y - frame.h / 2,
            });
        }
        if (this.element === 'lightning') {
            const r = (this.animationTime > 100) ? 36 : 72;
            if (r > 50) {
                // For such a large circle the algorithm requires more and larger branches
                // to fill the space.
                renderLightningCircle(context, {x: this.x, y, r}, 6, 60);
            } else {
                renderLightningCircle(context, {x: this.x, y, r}, 4);
            }
        }
    }
}

