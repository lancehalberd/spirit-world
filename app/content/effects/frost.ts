import {addSparkleAnimation} from 'app/content/effects/animationEffect';
import {FRAME_LENGTH} from 'app/gameConstants';
import {createAnimation, drawFrameCenteredAt} from 'app/utils/animations';
import {addEffectToArea, removeEffectFromArea} from 'app/utils/effects';
import {hitTargets} from 'app/utils/field';


const [iceElement] = createAnimation('gfx/hud/elementhud.png', {w: 20, h: 20}, {x: 2}).frames;

interface Props {
    x: number
    y: number
    z?: number
    damage?: number
    ignoreTargets?: Set<ObjectInstance>
    vx?: number
    vy?: number
    vz?: number
    az?: number
    ttl?: number
    delay?: number
    ignoreWallsDuration?: number
    hitEnemies?: boolean
    source: Actor
}

export class Frost implements EffectInstance, Props {
    drawPriority: DrawPriority = 'sprites';
    area: AreaInstance = null;
    isEffect = <const>true;
    isEnemyAttack = true;
    frame: Frame;
    damage: number;
    x: number;
    y: number;
    z: number = 0;
    vz: number = 0;
    vx: number;
    vy: number;
    az: number;
    w: number = 12;
    h: number = 12;
    ignoreTargets: Set<ObjectInstance>;
    radius: number;
    animationTime = 0;
    speed = 0;
    delay?: number;
    ignoreWallsDuration?: number;
    ttl: number;
    animationOffset: number;
    hitEnemies: boolean;
    source: Actor;
    constructor({x, y, z = 4, vx = 0, vy = 0, vz = 0, az = -0.1, damage = 1, ttl = 400, hitEnemies = false, delay = 0, ignoreWallsDuration, ignoreTargets, source}: Props) {
        this.damage = damage;
        this.x = x - 6;
        this.y = y - 6;
        this.z = z;
        this.vx = vx;
        this.vy = vy;
        this.vz = vz;
        this.az = az;
        this.ttl = ttl;
        this.delay = delay;
        this.ignoreWallsDuration = ignoreWallsDuration;
        this.ignoreTargets = ignoreTargets || new Set();
        this.hitEnemies = hitEnemies;
        this.animationOffset = ((Math.random() * 10) | 0) * 20;
        this.source = source;
    }
    getHitbox() {
        return this;
    }
    update(state: GameState) {
        if (this.animationTime < this.delay) {
            this.animationTime += FRAME_LENGTH;
            return;
        }
        this.x += this.vx;
        this.y += this.vy;
        this.z = Math.max(0, this.z + this.vz);
        this.vz = Math.max(-8, this.vz + this.az);
        this.animationTime += FRAME_LENGTH;

        if (this.animationTime >= this.ttl + this.delay) {
            removeEffectFromArea(state, this);
        } else {
            hitTargets(state, this.area, {
                canPush: false,
                damage: this.damage,
                hitbox: this,
                element: 'ice',
                hitAllies: true,
                hitEnemies: this.hitEnemies,
                hitObjects: true,
                hitTiles: this.animationTime >= (this.delay ?? 0),
                ignoreTargets: this.ignoreTargets,
                source: this.source,
            });
            if (this.animationTime % 200 === this.animationOffset) {
                addSparkleAnimation(state, this.area, this, { element: 'ice' });
            }
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        context.fillStyle = 'white';
        context.save();
            context.beginPath();
            context.globalAlpha *= 0.6;
            context.arc(
                this.x + this.w / 2,
                this.y + this.h / 2 - this.z,
                this.w / 2, 0, 2 * Math.PI
            );
            context.fill();
        context.restore();
        drawFrameCenteredAt(context, iceElement, {x: this.x + this.w / 2, y: this.y + this.h / 2 - this.z, w: 0, h: 0});
    }
}

export function shootFrostInCone(state: GameState, enemy: Enemy, theta: number, {damage = 2, speed = 4, hitEnemies = true, ...props}: Partial<Props & {speed: number}> = {}): void {
    const hitbox = enemy.getHitbox();
    const x = hitbox.x + hitbox.w / 2 + Math.cos(theta) * hitbox.w / 2;
    const y = hitbox.y + hitbox.h / 2 + Math.sin(theta) * hitbox.h / 2;
    const attackTheta = theta - Math.PI / 10 + Math.random() * Math.PI / 5;
    const frost = new Frost({
        damage,
        x,
        y,
        vx: speed * Math.cos(attackTheta),
        vy: speed * Math.sin(attackTheta),
        hitEnemies,
        ignoreTargets: new Set([enemy]),
        source: enemy,
        ...props,
    });
    addEffectToArea(state, enemy.area, frost);
}
