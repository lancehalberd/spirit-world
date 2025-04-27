import {addSparkleAnimation} from 'app/content/effects/animationEffect';
import {FRAME_LENGTH} from 'app/gameConstants';
import {getLedgeDelta, updateProjectileHeight} from 'app/movement/getLedgeDelta';
import {createAnimation, drawFrameAt, getFrame} from 'app/utils/animations';
import {removeEffectFromArea} from 'app/utils/effects';
import {getDirection, hitTargets} from 'app/utils/field';
import {getTileBehaviorsAndObstacles} from 'app/utils/getBehaviors';
import {editingState} from 'app/development/editingState';
import {clamp} from 'app/utils/index';


const flameAnimation = createAnimation('gfx/effects/flame.png', {w: 32, h: 48, content: {x: 8, y: 36, w: 16, h: 12}}, {cols: 4, duration: 3});
const flameBrokenAnimation = createAnimation('gfx/effects/flame.png', {w: 32, h: 48, content: {x: 8, y: 36, w: 16, h: 12}}, {cols: 4, duration: 3, y: 1, loop: false});

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
    hybridWorlds?: boolean
    // This will cause the flame to persist even after it hits something.
    persist?: boolean
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
        const p = clamp(this.destroyed ? (1 - this.animationTime / flameBrokenAnimation.duration) : this.animationTime / 400, 0.1, 1);
        const hitbox = this.getHitbox();
        return [{
            x: hitbox.x + hitbox.w / 2,
            y: hitbox.y + hitbox.h / 2 - this.z,
            //brightness: 0.8 + 0.05 * Math.sin(this.torch.animationTime / 150),
            brightness: 0.8 * p,
            radius: (40 * p) | 0,
            color: {r:255, g: 0, b: 0},
        }];
    }
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
    hybridWorlds = false;
    isEnemyTarget: boolean = true;
    groundFriction = 0;
    // Set when the flame is destroyed and show the flameBrokenAnimation.
    destroyed = false;
    isHigh = false;
    persist = false;
    source: Actor;
    beforeUpdate?: (state: GameState, flame: Flame) => void;
    constructor({x, y, z = 0, vx = 0, vy = 0, vz = 0, ax = 0, ay = 0, az = -0.3,
        delay = 0, damage = 1, scale = 1, ttl = 2000, hybridWorlds = false, isPreparing = false, groundFriction = 0, minVz = -8, beforeUpdate,
        source, persist
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
        this.persist = persist;
        this.hybridWorlds = hybridWorlds;
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
        const w = flameAnimation.frames[0].content?.w ?? flameAnimation.frames[0].w;
        const h = flameAnimation.frames[0].content?.h ?? flameAnimation.frames[0].h;
        this.w = w * this.scale;
        this.h = h * this.scale;
    }
    onHit(state: GameState, hit: HitProperties): HitResult {
        if (this.z <= 16 && hit.element === 'ice') {
            this.breakApart();
        }
        return {};
    }
    breakApart() {
        this.destroyed = true;
        this.animationTime = 0;
    }
    update(state: GameState) {
        if (this.destroyed) {
            this.animationTime += FRAME_LENGTH;
            if (this.animationTime >= flameBrokenAnimation.duration) {
                removeEffectFromArea(state, this);
            }
            return;
        }
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
            this.breakApart();
            return;
        }
        // For attacks that move horizontally, update "isHigh" to indicate whether they are above content that is below an edge.
        // We don't do this for attacks with vertical components since they can fall down below edges.
        if (!this.az) {
            this.isHigh = updateProjectileHeight(state, this.area, this.isHigh, oldAnchorPoint, anchorPoint);
        }
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
            this.breakApart();
        } else  {
            if (this.time >= this.ttl - 400) {
                // Flame shrinks and slows down towards the end of its TTL.
                this.scale = Math.max(0.1, this.scale - 0.04);
                this.vx *= 0.95;
                this.vy *= 0.95;
                this.vz *= 0.95;
                this.updateSize();
            }
            if (!this.isPreparing && this.z <= 16) {
                const hitProperties: HitProperties = {
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
                };
                const hitResult = hitTargets(state, this.area, hitProperties);
                let hit = hitResult.hit, stopped = hitResult.blocked || hitResult.stopped;

                if (this.hybridWorlds) {
                    const hitResult = hitTargets(state, this.area.alternateArea, hitProperties);
                    hit = hit || hitResult.hit;
                    stopped = stopped || hitResult.blocked || hitResult.stopped;
                }
                if (hitResult.reflected) {
                    this.reflected = true;
                    this.damage *= (hitResult.returnHit?.damage || 1);
                    this.ax = -this.ax;
                    this.ay = -this.ay;
                    this.vx = -this.vx;
                    this.vy = -this.vy;
                    this.time = 0;
                } else  if (!this.persist && (hitResult.blocked || stopped || (hit && !hitResult.pierced))) {
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
                    this.breakApart();
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
        const frame = getFrame(this.destroyed ? flameBrokenAnimation : flameAnimation, this.animationTime);
        drawFrameAt(context, frame, {
            x: this.x - this.w / 2,
            y: this.y - this.z - this.h / 2,
            //y: this.y + 2 * Math.sin(this.animationTime / 150) - this.z - this.h,
            w: (frame.content.w ?? frame.w) * this.scale,
            h: (frame.content.h ?? frame.h) * this.scale,
        });
        if (editingState.showHitboxes) {
            context.strokeStyle = 'red';
            const {x, y, w, h} = this.getHitbox();
            context.strokeRect(x + 0.5, y + 0.5, w, h);
        }
    }
    alternateRender(context: CanvasRenderingContext2D, state: GameState) {
        if (this.hybridWorlds) {
            this.render(context, state);
        }
    }

    renderShadow(context: CanvasRenderingContext2D) {
        const p = clamp(this.destroyed ? (1 - this.animationTime / flameBrokenAnimation.duration) : this.animationTime / 400, 0.1, 1);
        const actualZ = this.z + 4 - 2 * Math.sin(this.animationTime / 150);
        const shadowRadius = Math.max(3, 6 - actualZ / 2);
        context.save();
        context.globalAlpha = 0.5 * p;
        context.fillStyle = 'red';
        context.translate(this.x, this.y);
        context.scale(this.w / 12, this.h / 18);
        context.beginPath();
        context.arc(0, 0, shadowRadius, 0, 2 * Math.PI);
        context.fill();
        context.restore();
    }
}
