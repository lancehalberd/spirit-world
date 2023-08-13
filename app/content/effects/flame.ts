import { addSparkleAnimation } from 'app/content/effects/animationEffect';
import { FRAME_LENGTH } from 'app/gameConstants';
import { createAnimation, drawFrame, drawFrameAt, getFrame } from 'app/utils/animations';
import { createCanvasAndContext } from 'app/utils/canvas';
import { removeEffectFromArea } from 'app/utils/effects';
import { hitTargets } from 'app/utils/field';
import { allImagesLoaded } from 'app/utils/images';


const flameGeometry = {w: 20, h: 20, content: {x: 2, y: 2, w: 16, h: 16}};
export const [
    /* container */, fireElement, /* elementShine */
] = createAnimation('gfx/hud/elementhud.png',
    flameGeometry, {cols: 2}
).frames;


const [flameCanvas, flameContext] = createCanvasAndContext(fireElement.w * 2, fireElement.h);
const createFlameAnimation = async () => {
    await allImagesLoaded();
    drawFrame(flameContext, fireElement, {...fireElement, x: 0, y: 0});
    flameContext.translate(fireElement.w + fireElement.content.x + fireElement.content.w / 2, 0);
    flameContext.scale(-1, 1);
    drawFrame(flameContext, fireElement, {...fireElement, x: -fireElement.content.w / 2 - fireElement.content.x, y: 0});
}
createFlameAnimation();
export const flameAnimation = createAnimation(flameCanvas, flameGeometry, {cols: 2});

interface Props {
    x: number
    y: number
    z?: number
    damage?: number
    vx?: number
    vy?: number
    vz?: number
    minVz ?: number
    az?: number
    scale?: number
    ttl?: number
    isPreparing?: boolean
    groundFriction?: number
}

export class Flame implements EffectInstance, Props {
    drawPriority: DrawPriority = 'sprites';
    behaviors: TileBehaviors = {
        brightness: 0.5,
        lightRadius: 24,
    };
    isEffect = <const>true;
    isEnemyAttack = true;
    area: AreaInstance = null;
    frame: Frame;
    damage: number;
    scale: number;
    x: number;
    y: number;
    z: number = 0;
    vz: number = 0;
    minVz = -8;
    vx: number;
    vy: number;
    az: number;
    w: number = 12;
    h: number = 12;
    radius: number;
    animationTime = 0;
    time: number = 0;
    speed = 0;
    ttl: number;
    isPreparing = false;
    reflected = false;
    isEnemyTarget: boolean = true;
    groundFriction = 0;
    constructor({x, y, z = 0, vx = 0, vy = 0, vz = 0, az = -0.3, damage = 1, scale = 1, ttl = 2000, isPreparing = false, groundFriction = 0, minVz = -8}: Props) {
        this.damage = damage;
        this.x = x;
        this.y = y;
        this.z = z;
        this.vx = vx;
        this.vy = vy;
        this.vz = vz;
        this.minVz = minVz;
        this.az = az;
        this.ttl = ttl;
        this.scale = scale;
        this.w = 12 * scale;
        this.h = 12 * scale;
        this.isPreparing = isPreparing
        this.animationTime = Math.floor(Math.random() * 10) * FRAME_LENGTH;
        this.groundFriction = groundFriction;
    }
    getHitbox() {
        return this;
    }
    onHit(state: GameState, hit: HitProperties): HitResult {
        if (hit.element === 'ice') {
            removeEffectFromArea(state, this);
        }
        return {};
    }
    update(state: GameState) {
        this.x += this.vx;
        this.y += this.vy;
        this.z = Math.max(0, this.z + this.vz);
        this.vz = Math.max(this.minVz, this.vz + this.az);
        this.w = 12 * this.scale;
        this.h = 12 * this.scale;
        this.animationTime += FRAME_LENGTH;
        this.time += FRAME_LENGTH;

        if (this.z <= 0 && this.groundFriction) {
            this.vx *= (1 - this.groundFriction);
            this.vy *= (1 - this.groundFriction);
        }

        if (this.time >= this.ttl) {
            removeEffectFromArea(state, this);
        } else  {
            if (!this.isPreparing && this.z <= 16) {
                const hitResult = hitTargets(state, this.area, {
                    canPush: false,
                    damage: this.damage,
                    hitbox: this.getHitbox(),
                    element: 'fire',
                    hitAllies: !this.reflected,
                    hitEnemies: this.reflected,
                    hitTiles: true,
                });
                if (hitResult.reflected) {
                    this.reflected = true;
                    this.vx = -this.vx;
                    this.vy = -this.vy;
                    this.time = 0;
                }
            }
            // Create sparks less often when the flame is still.
            const rate = (this.vx || this.vy) ? 100 : 400;
            if (this.animationTime % rate === 0) {
                addSparkleAnimation(state, this.area, this, { element: 'fire' });
            }
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        const frame = getFrame(flameAnimation, this.animationTime);
        drawFrameAt(context, frame, {
            x: this.x - 2,
            y: this.y - 4 + 2 * Math.sin(this.animationTime / 150) - this.z,
            w: fireElement.content.w * this.scale,
            h: fireElement.content.h * this.scale,
        });
    }

    renderShadow(context: CanvasRenderingContext2D) {
        const actualZ = this.z + 4 - 2 * Math.sin(this.animationTime / 150);
        const shadowRadius = Math.max(3, 6 - actualZ / 2);
        context.save();
        context.globalAlpha = 0.5;
        context.fillStyle = 'red';
        context.translate(this.x + this.w / 2, this.y + this.h / 2);
        context.scale(this.w / 12, this.h / 18);
        context.beginPath();
        context.arc(0, 0, shadowRadius, 0, 2 * Math.PI);
        context.fill();
        context.restore();
    }
}
