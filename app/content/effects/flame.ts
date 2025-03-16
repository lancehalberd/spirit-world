import { addSparkleAnimation } from 'app/content/effects/animationEffect';
import { FRAME_LENGTH } from 'app/gameConstants';
import { getLedgeDelta, updateProjectileHeight } from 'app/movement/getLedgeDelta';
import { createAnimation, drawFrame, drawFrameAt, getFrame } from 'app/utils/animations';
import { createCanvasAndContext } from 'app/utils/canvas';
import { removeEffectFromArea } from 'app/utils/effects';
import { getDirection, hitTargets } from 'app/utils/field';
import { getTileBehaviorsAndObstacles} from 'app/utils/getBehaviors';
import { allImagesLoaded } from 'app/utils/images';
import { editingState } from 'app/development/editingState';


const flameGeometry = {w: 20, h: 20, content: {x: 6, y: 10, w: 8, h: 6}};
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
    delay?: number
    x: number
    y: number
    z?: number
    damage?: number
    vx?: number
    vy?: number
    vz?: number
    minVz ?: number
    ax?: number
    ay?: number
    az?: number
    scale?: number
    ttl?: number
    isPreparing?: boolean
    groundFriction?: number
    beforeUpdate?: (state: GameState, flame: Flame) => void
    source: Actor
}

export class Flame implements EffectInstance, Props {
    getDrawPriority(state: GameState) {
        return this.z < 24 ? 'sprites' : 'foreground';
    }
    /*behaviors: TileBehaviors = {
        brightness: 0.5,
        lightRadius: 24,
        lightColor: {r: 255, g: 0, b: 0},
    };*/
    getLightSources(state: GameState): LightSource[] {
        // const r = SRandom.seed(this.torch.animationTime).random();
        const hitbox = this.getHitbox();
        return [{
            x: hitbox.x + hitbox.w / 2,
            y: hitbox.y + hitbox.h / 2 - this.z,
            //brightness: 0.8 + 0.05 * Math.sin(this.torch.animationTime / 150),
            brightness: 0.8,
            radius: 40,
            color: {r:255, g: 0, b: 0},
        }];
    }
    drawPriority: DrawPriority = 'sprites';
    isEffect = <const>true;
    isEnemyAttack = true;
    area: AreaInstance = null;
    frame: Frame;
    damage: number;
    scale: number;
    delay = 0;
    x: number;
    y: number;
    z: number = 0;
    vz: number = 0;
    minVz = -8;
    vx: number;
    vy: number;
    ax: number;
    ay: number;
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
    isHigh = false;
    source: Actor;
    beforeUpdate?: (state: GameState, flame: Flame) => void;
    constructor({x, y, z = 0, vx = 0, vy = 0, vz = 0, ax = 0, ay = 0, az = -0.3,
        delay = 0, damage = 1, scale = 1, ttl = 2000, isPreparing = false, groundFriction = 0, minVz = -8, beforeUpdate,
        source,
    }: Props) {
        this.damage = damage;
        this.delay = delay;
        this.x = x;
        this.y = y;
        this.z = z;
        this.vx = vx;
        this.vy = vy;
        this.vz = vz;
        this.minVz = minVz;
        this.ax = ax;
        this.ay = ay;
        this.az = az;
        this.ttl = ttl;
        this.scale = scale;
        this.updateSize();
        this.isPreparing = isPreparing
        this.animationTime = Math.floor(Math.random() * 10) * FRAME_LENGTH;
        this.groundFriction = groundFriction;
        this.beforeUpdate = beforeUpdate;
        this.source = source;
    }
    getAnchorPoint() {
        const hitbox = this.getHitbox();
        return {x: (hitbox.x + hitbox.w / 2) | 0, y: (hitbox.y + hitbox.h / 2) | 0};
    }
    getHitbox() {
        //const w = 3 * this.w / 5;
        //const h = 2 * this.h / 3;
        return {
            x: (this.x - this.w / 2) | 0,
            y: (this.y - this.h / 2) | 0,
            w: this.w | 0,
            h: this.h | 0,
        };
    }
    updateSize() {
        const w = flameGeometry.content?.w ?? flameGeometry.w;
        const h = flameGeometry.content?.h ?? flameGeometry.h;
        this.w = w * this.scale;
        this.h = h * this.scale;
    }
    onHit(state: GameState, hit: HitProperties): HitResult {
        if (this.z <= 16 && hit.element === 'ice') {
            removeEffectFromArea(state, this);
        }
        return {};
    }
    update(state: GameState) {
        if (this.delay > 0) {
            this.delay -= FRAME_LENGTH;
            return;
        }
        this.beforeUpdate?.(state, this);
        const oldAnchorPoint = this.getAnchorPoint();
        this.x += this.vx;
        this.y += this.vy;
        const anchorPoint = this.getAnchorPoint();
        const ledgeDelta = getLedgeDelta(state, this.area, oldAnchorPoint, anchorPoint);
        if (ledgeDelta > 0 && !this.isHigh) {
            removeEffectFromArea(state, this);
            return;
        }
        this.isHigh = updateProjectileHeight(state, this.area, this.isHigh, oldAnchorPoint, anchorPoint);
        this.z = Math.max(0, this.z + this.vz);
        if (this.ax) {
            this.vx += this.ax;
        }
        if (this.ay) {
            this.vy += this.ay;
        }
        this.vz = Math.max(this.minVz, this.vz + this.az);
        this.animationTime += FRAME_LENGTH;
        this.time += FRAME_LENGTH;

        // Experimental code to make falling flames "fall down" southern cliffs they pass over.
        // Falls a max of 80px a frame.
        if (this.z >= 4 && this.vy > 0) {
            const hitbox = this.getHitbox();
            const x = hitbox.x + hitbox.w / 2;
            let y = hitbox.y + hitbox.h / 2;
            for (let i = 0; i < 48; i++) {
                const { tileBehavior } = getTileBehaviorsAndObstacles(state, this.area, {x, y});
                if (tileBehavior?.isSouthernWall) {
                    this.z++;
                    this.y++;
                    y++;
                } else {
                    break;
                }
            }
        }

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
                    direction: getDirection(this.vx, this.vy),
                    hitbox: this.getHitbox(),
                    element: 'fire',
                    hitAllies: !this.reflected,
                    hitEnemies: this.reflected,
                    hitObjects: true,
                    hitTiles: true,
                    vx: this.vx,
                    vy: this.vy,
                    anchorPoint,
                    isHigh: this.isHigh,
                    source: this.source,
                });
                if (hitResult.reflected) {
                    this.reflected = true;
                    this.damage *= (hitResult.returnHit?.damage || 1);
                    this.ax = -this.ax;
                    this.ay = -this.ay;
                    this.vx = -this.vx;
                    this.vy = -this.vy;
                    this.time = 0;
                } else  if (hitResult.blocked || hitResult.stopped || (hitResult.hit && !hitResult.pierced)) {
                    const hitbox = this.getHitbox();
                    const count = 4;
                    for (let i = 0; i < count; i++) {
                        const theta = 2 * Math.PI * i / count;
                        const dx = Math.cos(theta), dy = Math.sin(theta);
                        addSparkleAnimation(state, this.area, {
                                ...hitbox,
                                x: hitbox.x + dx,
                                y: hitbox.y + dy,
                                z: this.z
                            }, { element: 'fire' }, { vx: dx / 2, vy: dy / 2});
                    }
                    removeEffectFromArea(state, this);
                    return;
                }
            }
            // Create sparks less often when the flame is still.
            const rate = (this.vx || this.vy) ? 100 : 400;
            if (this.animationTime % rate === 0) {
                addSparkleAnimation(state, this.area, {...this.getHitbox(), z: this.z}, { element: 'fire' });
            }
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        const frame = getFrame(flameAnimation, this.animationTime);
        drawFrameAt(context, frame, {
            x: this.x - this.w / 2,
            y: this.y + 2 * Math.sin(this.animationTime / 150) - this.z - this.h,
            w: fireElement.content.w * this.scale,
            h: fireElement.content.h * this.scale,
        });
        if (editingState.showHitboxes) {
            context.strokeStyle = 'red';
            const {x, y, w, h} = this.getHitbox();
            context.strokeRect(x + 0.5, y + 0.5, w, h);
        }
    }

    renderShadow(context: CanvasRenderingContext2D) {
        const actualZ = this.z + 4 - 2 * Math.sin(this.animationTime / 150);
        const shadowRadius = Math.max(3, 6 - actualZ / 2);
        context.save();
        context.globalAlpha = 0.5;
        context.fillStyle = 'red';
        context.translate(this.x, this.y);
        context.scale(this.w / 12, this.h / 18);
        context.beginPath();
        context.arc(0, 0, shadowRadius, 0, 2 * Math.PI);
        context.fill();
        context.restore();
    }
}
