import { addBurstParticle } from 'app/content/effects/animationEffect';
import { FRAME_LENGTH, getElementColor } from 'app/gameConstants';
import { renderDamageWarning } from 'app/render/renderDamageWarning';
import { renderLightningCircle } from 'app/render/renderLightning';
import { removeEffectFromArea } from 'app/utils/effects';
import { hitTargets } from 'app/utils/field';
import Random from 'app/utils/Random';


export interface BlastProps {
    x: number
    y: number,
    damage?: number
    element?: MagicElement
    radius?: number
    minRadius?: number
    // This can be set to make this blast follow a source.
    boundSource?: Enemy
    // This source just tracks which enemy created the blast.
    source: Actor
    tellDuration?: number
    expansionDuration?: number
    persistDuration?: number
}

export class Blast implements EffectInstance {
    area: AreaInstance;
    animationTime: number = 0;
    isEffect = <const>true;
    isEnemyAttack = true;
    x: number = this.props.x ?? 0;
    y: number = this.props.y ?? 0;
    damage: number = this.props.damage ?? 2;
    element: MagicElement = this.props.element ?? null;
    radius: number = this.props.radius ?? 32;
    minRadius: number = this.props.minRadius ?? 4;
    boundSource: Enemy = this.props.boundSource;
    source: Actor = this.props.source;
    hitTargets: Set<EffectInstance | ObjectInstance> = new Set([this.boundSource, this.source]);
    tellDuration: number = this.props.tellDuration ?? 1000;
    expansionDuration: number = this.props.expansionDuration ?? 140;
    persistDuration: number = this.props.persistDuration ?? 60;
    constructor(public props: BlastProps) {}
    update(state: GameState) {
        this.animationTime += FRAME_LENGTH;
        // If this effect has an enemy as a source, remove it if the source disappears during the tell duration.
        if (this.animationTime < this.tellDuration && this.boundSource) {
            if (this.area !== this.boundSource.area || this.boundSource.status === 'gone' || !this.area.objects.includes(this.boundSource)) {
                removeEffectFromArea(state, this);
                return;
            }
        }
        if (this.boundSource) {
            const enemyHitbox = this.boundSource.getHitbox(state);
            this.x = enemyHitbox.x + enemyHitbox.w / 2;
            this.y = enemyHitbox.y + enemyHitbox.h / 2;
        }
        const circle = this.getHitCircle();
        if (circle) {
            const hitResult = hitTargets(state, this.area, {
                damage: this.damage,
                element: this.element,
                hitCircle: circle,
                hitAllies: true,
                hitObjects: true,
                hitTiles: true,
                hitEnemies: true,
                ignoreTargets: this.hitTargets,
                knockAwayFromHit: true,
                source: this.source,
            });
            this.hitTargets = new Set([...this.hitTargets, ...hitResult.hitTargets]);
            // Lightning effects will be rendered as part of the render function.
            if (this.element !== 'lightning') {
                if ((this.animationTime - this.tellDuration) % 40 === 20) {
                    const theta = Math.random() * 2 * Math.PI;
                    const count = Random.range(4, 7);
                    for (let i = 0; i < count; i++) {
                        addBurstParticle(state, this.area,
                            circle.x + circle.r * Math.cos(theta + i * 2 * Math.PI / count),
                            circle.y + circle.r * Math.sin(theta + i * 2 * Math.PI / count),
                            0,
                            this.element
                        );
                    }
                }
            }
        }
        if (this.animationTime >=  this.tellDuration + this.expansionDuration + this.persistDuration) {
            removeEffectFromArea(state, this);
        }
    }
    getHitCircle(): Circle | null {
        if (this.animationTime < this.tellDuration) {
            return null;
        }
        const time = this.animationTime - this.tellDuration;
        const p = Math.min(1, time / this.expansionDuration);
        return {x: this.x, y: this.y, r: this.minRadius + p * (this.radius - this.minRadius)};
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        const circle = this.getHitCircle();
        if (circle) {
            const persistTime = this.animationTime - this.tellDuration - this.expansionDuration;
            context.save();
                context.globalAlpha *= (0.2 - 0.15 * persistTime / this.persistDuration);
                context.beginPath();
                context.fillStyle = getElementColor(this.element);
                context.arc(circle.x, circle.y, circle.r, 0, 2 * Math.PI);
                context.fill();
            context.restore();
            if (this.element === 'lightning') {
                renderLightningCircle(context, circle, 4, Math.min(100, Math.max(40, circle.r | 0)));
            }
        } else if (this.animationTime <= this.tellDuration) {
            renderDamageWarning(context, {
                circle: {x: this.x, y: this.y, r: this.radius},
                duration: this.tellDuration,
                time: this.animationTime,
            });
        }
    }
}
