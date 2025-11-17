// import {addSparkleAnimation} from 'app/content/effects/animationEffect';
import {Blast} from 'app/content/effects/blast';
import {FRAME_LENGTH} from 'app/gameConstants';
import {createAnimation, drawFrameCenteredAt, getFrame, frameAnimation} from 'app/utils/animations';
import {addEffectToArea, removeEffectFromArea} from 'app/utils/effects';
import {requireFrame} from 'app/utils/packedImages';

const seedFrame = requireFrame('gfx/tiles/crops.png', {x: 147, y: 28, w: 12, h: 20, content:{x: 1, y: 10, w: 9, h: 9}});

const explosionGeometry: FrameDimensions = {w: 32, h: 32};
const explosionAnimation = createAnimation('gfx/effects/explosion.png', explosionGeometry, { cols: 6, duration: 4}, { loop: false });

interface Props {
    x: number
    y: number
    z?: number
    damage?: number
    radius?: number
    vx: number
    vy: number
    vz?: number
    az?: number
    source: Enemy
    animation: FrameAnimation
    auraColor?: string
    shadowColor?: string
    activate?: (state: GameState, grenade: Grenade) => void
}

export class Grenade implements EffectInstance, Props {
    area: AreaInstance = null;
    isEffect = <const>true;
    isEnemyAttack = true;
    frame: Frame;
    damage: number = this.props.damage ?? 1;
    x: number = this.props.x;
    y: number = this.props.y;
    z: number = this.props.z ?? 0;
    vz: number = this.props.vz ?? 4;
    vx: number = this.props.vx;
    vy: number = this.props.vy;
    az: number = this.props.az ?? -0.3;
    w: number = 12;
    h: number = 12;
    radius: number = this.props.radius ?? 32;
    animationTime = 0;
    speed = 0;
    auraColor = this.props.auraColor;
    shadowColor = this.props.shadowColor ?? this.props.auraColor ?? 'red';
    animation = this.props.animation;
    source: Enemy = this.props.source;
    activate = this.props.activate;
    constructor(public props: Props) {}
    update(state: GameState) {
        this.x += this.vx;
        this.y += this.vy;
        this.z += this.vz;
        this.vz += this.az;
        this.animationTime += FRAME_LENGTH;
        if (this.z <= 0) {
            if (this.activate) {
                this.activate(state, this);
            } else {
                this.defaultActivate(state);
            }
            removeEffectFromArea(state, this);
        } else {
            /*if (this.animationTime % 200 === 0) {
                addSparkleAnimation(state, this.area, this, { element: 'ice' });
            }*/
        }
    }
    // The default behavior is to just create a blast.
    defaultActivate(state: GameState) {
        const blast = new Blast({
            x: this.x,
            y: this.y,
            radius: this.radius,
            damage: this.damage,
            // The trajectory of the grenade gives enough warning.
            tellDuration: 0,
            animation: explosionAnimation,
            source: this.source,
        });
        addEffectToArea(state, this.area, blast);
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        // Animate a transparent orb growing in the air
        if (this.auraColor) {
            context.fillStyle = this.auraColor;
            context.save();
                context.globalAlpha *= 0.3;
                context.beginPath();
                let r = this.w / 2 + Math.sin(this.animationTime / 60) * this.w / 8;
                context.arc(this.x, this.y - this.z, r, 0, 2 * Math.PI);
                context.fill();
            context.restore();
        }
        const frame = getFrame(this.animation, this.animationTime);
        drawFrameCenteredAt(context, frame, {x: this.x, y: this.y - this.z, w: 0, h: 0});
    }
    renderShadow(context: CanvasRenderingContext2D) {
        const shadowRadius = Math.max(3, 6 - this.z / 2);
        context.save();
            context.globalAlpha = 0.3;
            context.fillStyle = this.shadowColor;
            context.translate(this.x, this.y);
            context.scale(this.w / 12, this.h / 18);
            context.beginPath();
            context.arc(0, 0, shadowRadius, 0, 2 * Math.PI);
            context.fill();
        context.restore();
    }
}

interface ThrowGrenadeProps {
    damage?: number
    radius?: number
    x?: number
    y?: number
    z?: number
    az?: number
    source: Enemy
    activate?: (state: GameState, grenade: Grenade) => void
}

// damage = 1, z = 8,
export function throwSeedBombAtLocation(state: GameState, enemy: Enemy, {tx, ty}: {tx: number, ty: number},  props: ThrowGrenadeProps): void {
    const hitbox = enemy.getHitbox(state);
    const x = props.x ?? (hitbox.x + hitbox.w / 2);
    const y = props.y ?? hitbox.y + hitbox.h / 2;
    const vz = 4;
    const az = props.az ?? -0.2;
    const duration = -2 * vz / az;
    const seedBomb = new Grenade({
        // Default props.
        auraColor: 'brown',
        animation: frameAnimation(seedFrame),
        radius: 16,
        damage: 1,
        z: 8,
        ...props,
        x,
        y,
        vx: (tx - x) / duration,
        vy: (ty - y) / duration,
        vz,
        az,
    });
    addEffectToArea(state, enemy.area, seedBomb);
}
