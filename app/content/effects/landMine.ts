import { addSparkleAnimation } from 'app/content/effects/animationEffect';
import { Blast, BlastProps } from 'app/content/effects/blast';
import { FRAME_LENGTH } from 'app/gameConstants';
import { renderDamageWarning } from 'app/render/renderDamageWarning';
import { createAnimation, drawFrameCenteredAt } from 'app/utils/animations';
import { addEffectToArea, removeEffectFromArea } from 'app/utils/effects';
import { isTargetHit } from 'app/utils/field';


const [iceElement] = createAnimation('gfx/hud/elementhud.png', {w: 20, h: 20}, {x: 2}).frames;

interface Props {
    x: number
    y: number
    z?: number
    vx?: number
    vy?: number
    vz?: number
    az?: number
    frame?: Frame
    // How long it takes to arm the mine after it lands
    armingTime?: number
    blastProps?: Partial<BlastProps>
    duration?: number
    source: Actor
}

export class LandMine implements EffectInstance, Props {
    area: AreaInstance = null;
    isEffect = <const>true;
    isEnemyAttack = true;
    frame: Frame = this.props.frame ?? iceElement;
    x: number = this.props.x;
    y: number = this.props.y;
    z: number = this.props.z ?? 8;
    vz: number = this.props.vz ?? 4;
    vx: number = this.props.vx ?? 0;
    vy: number = this.props.vx ?? 0;
    az: number = this.props.az ?? -0.2;
    w: number = 12;
    h: number = 12;
    animationTime = 0;
    speed = 0;
    armingTime = this.props.armingTime ?? 500;
    duration = this.props.duration ?? 10000;
    triggered = false;
    source = this.props.source;
    constructor(public props: Props) {}
    update(state: GameState) {
        this.animationTime += FRAME_LENGTH;
        if (this.animationTime >= this.duration) {
            removeEffectFromArea(state, this);
            return;
        }
        if (this.animationTime % 200 === 0) {
            addSparkleAnimation(state, this.area, this, { element: this.props.blastProps.element ?? null });
        }
        if (this.z > 0) {
            this.x += this.vx;
            this.y += this.vy;
            this.z += this.vz;
            this.vz += this.az;
        } else if (this.armingTime > 0) {
            this.armingTime -= FRAME_LENGTH;
        } else  {
            // if the player walks inside the radius trigger the blast effect.
            for (const target of this.area.allyTargets) {
                if (isTargetHit(target.getHitbox(), {hitCircle: this.getCircle(), source: this.source})) {
                    const blast = new Blast({
                        x: this.x,
                        y: this.y,
                        source: this.source,
                        ...this.props.blastProps,
                    });
                    addEffectToArea(state, this.area, blast);
                    removeEffectFromArea(state, this);
                }
            }
        }
    }
    getCircle() {
        return {
            x: this.x,
            y: this.y,
            // This default should match the default used by Blast
            r: this.props.blastProps?.radius ?? 24,
        };
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        // Animate a transparent orb growing in the air
        context.fillStyle = 'white';
        context.save();
            context.globalAlpha *= 0.3;
            context.beginPath();
            let r = this.w / 2 + Math.sin(this.animationTime / 60) * this.w / 8;
            context.arc(this.x, this.y - this.z, r, 0, 2 * Math.PI);
            context.fill();
        context.restore();
        drawFrameCenteredAt(context, iceElement, {x: this.x, y: this.y - this.z, w: 0, h: 0});
        if (this.z <= 0) {
            renderDamageWarning(context, {circle: this.getCircle(), duration: 1000, time: 0});
        }
    }
    renderShadow(context: CanvasRenderingContext2D) {
        const shadowRadius = Math.max(3, 6 - this.z / 2);
        context.save();
            context.globalAlpha = 0.3;
            context.fillStyle = 'white';
            context.translate(this.x, this.y);
            context.scale(this.w / 12, this.h / 18);
            context.beginPath();
            context.arc(0, 0, shadowRadius, 0, 2 * Math.PI);
            context.fill();
        context.restore();
    }
}

export function throwMineAtLocation(state: GameState, enemy: Enemy, {tx, ty}: {tx: number, ty: number}, props: Partial<Props> & {source: Actor}): LandMine {
    const hitbox = enemy.getHitbox(state);
    const x = hitbox.x + hitbox.w / 2;
    const y = hitbox.y + hitbox.h / 2;
    const frostMine = new LandMine({
        ...props,
        x,
        y,
    });
    const duration = -2 * frostMine.vz / frostMine.az;
    frostMine.vx = (tx - x) / duration;
    frostMine.vy = (ty - y) / duration;
    addEffectToArea(state, enemy.area, frostMine);
    return frostMine;
}
