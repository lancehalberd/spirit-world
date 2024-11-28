import { LightningAnimationEffect } from 'app/content/effects/lightningAnimationEffect';
import { FRAME_LENGTH } from 'app/gameConstants';
import { renderDamageWarning } from 'app/render/renderDamageWarning';
import { addEffectToArea, removeEffectFromArea } from 'app/utils/effects';
import { hitTargets } from 'app/utils/field';


interface Props {
    x: number
    y: number,
    damage?: number
    radius?: number
    boundSource?: Enemy
    tellDuration?: number
    hitEnemies?: boolean
    source: Actor
}

export class LightningDischarge implements EffectInstance {
    area: AreaInstance;
    animationTime: number = 0;
    isEffect = <const>true;
    isEnemyAttack = true;
    x = this.props.x || 0;
    y = this.props.y || 0;
    damage = this.props.damage ?? 2;
    r = this.props.radius || 48;
    boundSource = this.props.boundSource;
    source = this.props.source;
    tellDuration = this.props.tellDuration ?? 1000;
    // {x = 0, y = 0, damage = 2, radius = 48, source, tellDuration = 1000}
    constructor(public props: Props) {}
    update(state: GameState) {
        this.animationTime += FRAME_LENGTH;
        // If this effect has an enemy as a boundSource, remove it if the boundSource disappears during the tell duration.
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
        if (this.animationTime >= this.tellDuration) {
            hitTargets(state, this.area, {
                damage: 4,
                element: 'lightning',
                hitCircle: this,
                hitAllies: true,
                hitObjects: true,
                hitTiles: true,
                hitEnemies: this.props.hitEnemies ?? true,
                knockAwayFrom: {x: this.x, y: this.y},
                source: this.source,
            });
            addEffectToArea(state, this.area, new LightningAnimationEffect({
                circle: this,
                duration: 200,
            }));
            removeEffectFromArea(state, this);
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        if (this.animationTime < this.tellDuration) {
            renderDamageWarning(context, {
                circle: this,
                duration: this.tellDuration,
                time: this.animationTime,
            });
        }
    }
}
