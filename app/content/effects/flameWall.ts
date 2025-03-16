import { addSparkleAnimation } from 'app/content/effects/animationEffect';
import { editingState } from 'app/development/editingState';
import { CANVAS_HEIGHT, CANVAS_WIDTH, FRAME_LENGTH } from 'app/gameConstants';
import { createAnimation, drawFrame, getFrame } from 'app/utils/animations';
import { directionMap, rotateDirection } from 'app/utils/direction';
import { addEffectToArea, removeEffectFromArea } from 'app/utils/effects';
import { hitTargets } from 'app/utils/field';
import { getAreaSize } from 'app/utils/getAreaSize';


const flameAnimation = createAnimation('gfx/effects/flame.png', {w: 32, h: 48, content: {x: 8, y: 36, w: 16, h: 12}}, {cols: 4, duration: 3});

interface Props {
    direction: Direction
    damage?: number
    delay?: number
    fromPoint?: Point
    length?: number
    source: Actor
}

const baseFlameSize = 12;
export class FlameWall implements EffectInstance, Props {
    drawPriority: DrawPriority = 'foreground';
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
    w: number = 12;
    h: number = 12;
    fromPoint: Props['fromPoint']
    ignorePits = true;
    length = 6;
    delay: number;
    animationTime = 0;
    time = 0;
    direction: Direction;
    status: ObjectStatus = 'normal';
    speed = 0;
    distance = 0;
    source: Actor
    constructor({damage = 1, delay = 800, direction = 'down', length = 6, fromPoint, source}: Props) {
        this.delay = delay;
        this.damage = damage;
        this.direction = direction;
        this.length = length;
        this.fromPoint = fromPoint;
        this.animationTime = Math.floor(Math.random() * 10) * FRAME_LENGTH;
        this.source = source;
    }
    getHitbox(state: GameState) {
        return {
            x: this.x - this.w / 2,
            y: this.y - this.h / 2,
            w: this.w,
            h: this.h,
        }
    }
    update(state: GameState) {
        const { section } = getAreaSize(state);
        let left = section.x + 16;
        let top = section.y + 32;
        let right = section.x + section.w - 16;
        let bottom = section.y + section.h - 16;
        if (this.time === 0) {
            left = Math.max(state.camera.x + baseFlameSize / 2, left);
            right = Math.min(state.camera.x + CANVAS_WIDTH - baseFlameSize / 2, right);
            top = Math.max(state.camera.y + baseFlameSize / 2, top);
            bottom = Math.min(state.camera.y + CANVAS_HEIGHT - baseFlameSize / 2, bottom);
            if (this.fromPoint) {
                this.x = this.fromPoint.x;
                this.y = this.fromPoint.y;
                // This will always start 1 tile wide, but grow each tile it moves until it reaches max length
                this.w = this.h = baseFlameSize;
            } else {
                const heroHitbox = state.hero.getHitbox();
                if (this.direction === 'up' || this.direction === 'down') {
                    this.w = this.length * 16;
                    // Appear 2 tiles left or right of centered on the player.
                    this.x = heroHitbox.x + heroHitbox.w / 2 - 16 + Math.floor(Math.random() * 32);
                    this.x = Math.max(left + this.w / 2, Math.min(right - this.w / 2, this.x));
                    this.h = baseFlameSize;
                } else {
                    this.h = this.length * 16;
                    this.y = heroHitbox.y + heroHitbox.h / 2 - 16 + Math.floor(Math.random() * 32);
                    this.y = Math.max(top + this.h / 2, Math.min(bottom - this.h / 2, this.y));
                    this.w = baseFlameSize;
                }
                if (this.direction === 'down') {
                    this.y = top + baseFlameSize / 2;
                } else if (this.direction === 'up') {
                    this.y = bottom - baseFlameSize / 2;
                } else if (this.direction === 'right') {
                    this.x = left + baseFlameSize / 2;
                } else if (this.direction === 'left') {
                    this.x = right - baseFlameSize / 2;
                }
            }
        }
        this.time += FRAME_LENGTH;
        this.animationTime += FRAME_LENGTH;
        if (this.animationTime >= this.delay) {
            this.speed = Math.min(4, this.speed + 0.5);
            this.x += this.speed * directionMap[this.direction][0];
            this.y += this.speed * directionMap[this.direction][1];
            // Grow wider as the flame advances from its starting point.
            if (this.fromPoint) {
                this.distance += this.speed;
                const length = Math.min(16 + this.distance, this.length * 16);
                if (this.direction === 'up' || this.direction === 'down') {
                    this.w = length;
                } else {
                    this.h = length;
                }
            }
            if ((this.direction === 'left' && this.x < left)
                || (this.direction === 'right' && this.x > right)
                || (this.direction === 'up' && this.y < top)
                || (this.direction === 'down' && this.y > bottom)
            ) {
                removeEffectFromArea(state, this);
            } else {
                const hitbox = this.getHitbox(state);
                hitTargets(state, this.area, {
                    canPush: false,
                    damage: this.damage,
                    hitbox,
                    element: 'fire',
                    hitAllies: true,
                    hitTiles: true,
                    knockback: {vx: 4 * directionMap[this.direction][0], vy: 4 * directionMap[this.direction][1], vz: 2},
                    source: this.source,
                });
                if (this.animationTime % 100 === 0) {
                    addSparkleAnimation(state, this.area, hitbox, { element: 'fire' });
                }
            }
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        const hitbox = this.getHitbox(state);
        const isWide = hitbox.w > hitbox.h;
        const isTall = hitbox.w < hitbox.h;
        const p = Math.min(1, 2 * this.animationTime / this.delay);
        const spacing = 10, size = 16;
        // Number of flames is based on the final size of the wall.
        // Initially the flames will be small and bunched up, and they will grow and spread out to fill the desired hitbox.
        const flameCount = Math.ceil(Math.max(hitbox.w, hitbox.h) / spacing);
        const visualPadding = 4;
        const flameDx = isWide ? Math.max(0, ((hitbox.w + visualPadding) * p - size) / Math.max(1, (flameCount - 1))) : 0;
        const flameDy = isTall ? Math.max(0, ((hitbox.h + 2 * visualPadding) * p - size) / Math.max(1, (flameCount - 1))) : 0;
        const actualWidth = (flameCount - 1) * flameDx + size;
        const actualHeight = (flameCount - 1) * flameDy + size;
        const x = isWide ? hitbox.x + (hitbox.w - actualWidth) / 2 : hitbox.x;
        const y = isTall ? hitbox.y + (hitbox.h - actualHeight) / 2 : hitbox.y;
        const drawTargets: (Rect & {frame: Frame})[] = [];
        for (let i = 0; i < flameCount; i++) {
            // Show a different frame for each flame.
            const frame = getFrame(flameAnimation, this.animationTime + i * flameAnimation.frameDuration * FRAME_LENGTH);
            const distanceFromCenter = Math.abs(i + 0.5 - flameCount / 2);
            const flameP = distanceFromCenter * 2 / flameCount;
            const scale = Math.min(1 - 0.2 * flameP, 2 * this.animationTime / this.delay - 0.5 * flameP);
            // These deltas will make the flames near the edges fall a little behind the flames in the center when moving.
            const dx = 1.5 * this.speed * directionMap[this.direction][0] * flameP * flameP;
            const dy = 1.5 * this.speed * directionMap[this.direction][1] * flameP * flameP;
            const cx = isWide ? (x + i * flameDx + size / 2) : x + hitbox.w / 2 - dx;
            const cy = isTall ? (y + i * flameDy + size / 2) : y + hitbox.h / 2 - dy;

            drawTargets.push({
                frame,
                x: Math.round(cx - scale * (frame.content.x + frame.content.w / 2)),
                y: Math.round(cy - scale * (frame.content.y + frame.content.h / 2)),
                h: frame.h * scale,
                w: frame.w * scale,
            });
        }
        drawTargets.sort((a, b) => a.y - b.y);
        for (const drawTarget of drawTargets) {
            drawFrame(context, drawTarget.frame, drawTarget);
        }
        if (editingState.showHitboxes) {
            context.fillStyle = 'rgba(255,255,0, 0.3)';
            context.fillRect(hitbox.x, hitbox.y, hitbox.w, hitbox.h);
        }
    }

    static createRadialFlameWall(state: GameState, area: AreaInstance, fromPoint: Point, length = 4, source: Actor) {
        for (let i = 0; i < 4; i++) {
            const flameWall = new FlameWall({
                direction: rotateDirection('down', i),
                fromPoint,
                length,
                source,
            });
            addEffectToArea(state, area, flameWall);
        }
    }
}
