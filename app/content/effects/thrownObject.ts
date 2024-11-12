import { addParticleAnimations, addObjectFallAnimation, addSplashAnimation } from 'app/content/effects/animationEffect';
import { playAreaSound } from 'app/musicController';
import { drawFrame } from 'app/utils/animations';
import { getDirection } from 'app/utils/direction';
import { removeEffectFromArea } from 'app/utils/effects';
import { hitTargets } from 'app/utils/field';
import {getCompositeBehaviors} from 'app/utils/getBehaviors';



interface Props {
    frame: Frame
    behaviors: TileBehaviors
    x?: number
    y?: number
    z?: number
    vx?: number
    vy?: number
    vz?: number
    damage?: number
}

export class ThrownObject implements EffectInstance {
    area: AreaInstance;
    behaviors: TileBehaviors;
    isEffect = <const>true;
    linkedObject: ThrownObject;
    type = 'thrownObject' as 'thrownObject';
    frame: Frame;
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    damage;
    broken = false;
    constructor({frame, behaviors, x = 0, y = 0, z = 17, vx = 0, vy = 0, vz = 0, damage = 1 }: Props) {
        this.frame = frame;
        this.x = x;
        this.y = y;
        this.z = z;
        this.vx = vx;
        this.vy = vy;
        this.vz = vz;
        this.behaviors = behaviors ?? {};
        this.damage = this.behaviors.throwDamage ?? damage;
    }
    getHitbox() {
        // Technically it is unrealistic to use the z-component in the hitbox, but practically
        // it seems to work a bit better to include it.
        return { ...this.frame, x: this.x | 0, y: (this.y | 0) - (this.z | 0) };
    }
    update(state: GameState) {
        this.x += this.vx;
        this.y += this.vy;
        this.z += this.vz;
        this.vz -= 0.5;
        // To prevent hitting tiles north of you when throwing south,
        // do not hit targets for the first few frames when throwing south.
        if (this.vy > 0 && this.vz > 0) {
            return;
        }
        const hitbox = this.getHitbox();
        const hitResult = hitTargets(state, this.area, {
            canPush: true,
            damage: this.damage,
            isThrownObject: true,
            hitbox,
            knockback: { vx: this.vx, vy: this.vy, vz: 0},
            vx: this.vx,
            vy: this.vy,
            direction: getDirection(this.vx, this.vy),
            hitEnemies: true,
            hitObjects: true,
            // Break the ground the object lands on in the last frame.
            breaksGround: (this.z <= 0),
        });
        if (hitResult.hit || hitResult.blocked) {
            this.breakOnImpact(state);
        } else if (this.z <= 0) {
            const x = hitbox.x + hitbox.w / 2;
            const y = hitbox.y + hitbox.h / 2;
            const behaviors = getCompositeBehaviors(state, this.area, {x, y}, null, this);
            const tx = (x / 16) | 0;
            const ty = (y / 16) | 0;
            if (behaviors.pit) {
                addObjectFallAnimation(state, this.area, {
                    x: tx * 16 + 8,
                    y: ty * 16 + 8,
                });
                removeEffectFromArea(state, this);
            } else if (behaviors.water) {
                addSplashAnimation(state, this.area, {
                    x: tx * 16 + 8,
                    y: ty * 16 + 8,
                });
                removeEffectFromArea(state, this);
            } else {
                this.breakOnImpact(state);
            }
        }
    }
    breakOnImpact(state: GameState) {
        if (!this.broken) {
            this.broken = true;
            playAreaSound(state, this.area, this.behaviors.breakSound);
            addParticleAnimations(state, this.area,
                this.x + this.frame.w / 2, 
                this.y + this.frame.h / 2,
                this.z, this.behaviors.particles, this.behaviors);
            if (this.linkedObject && this.linkedObject.area && !this.linkedObject.broken) {
                this.linkedObject.breakOnImpact(state);
            }
            removeEffectFromArea(state, this);
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        drawFrame(context, this.frame, { ...this.frame, x: this.x, y: this.y - this.z });
        /*const hitbox = this.getHitbox();
        context.fillStyle = 'red';
        context.fillRect(hitbox.x, hitbox.y, hitbox.w, hitbox.h);*/
    }
}
