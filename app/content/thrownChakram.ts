import { addParticleAnimations } from 'app/content/animationEffect';
import { destroyTile, getAreaSize, removeObjectFromArea } from 'app/content/areas';
import { Enemy } from 'app/content/enemy';
import { FRAME_LENGTH } from 'app/gameConstants';
import { getTilesInRectangle } from 'app/getActorTargets';
import { damageActor } from 'app/updateActor';
import { createAnimation, drawFrame, getFrame } from 'app/utils/animations';
import { getDirection } from 'app/utils/field';
import { isPointInShortRect, rectanglesOverlap } from 'app/utils/index';

import { AreaInstance, DrawPriority, Frame, GameState, Hero, ObjectInstance, ObjectStatus } from 'app/types';

const chakramGeometry = {w: 16, h: 16, content: {x: 2, y: 2, w: 12, h: 12}};
const chakramAnimation = createAnimation('gfx/chakram1.png', chakramGeometry, {cols: 9, x: 0, duration: 2}, {loopFrame: 1});

interface Props {
    x?: number
    y?: number,
    vx?: number,
    vy?: number,
    damage?: number,
    returnSpeed?: number,
    source: Hero,
}

export class ThrownChakram implements ObjectInstance {
    area: AreaInstance;
    definition = null;
    drawPriority: DrawPriority = 'sprites';
    type = 'thrownChakram' as 'thrownChakram';
    frame: Frame;
    outFrames: number;
    damage: number;
    speed: number;
    returnSpeed: number;
    ignorePits = true;
    x: number;
    y: number;
    w: number;
    h: number;
    vx: number;
    vy: number;
    hitTargets: Set<any>;
    status: ObjectStatus = 'normal';
    source: Hero;
    animationTime = 0;
    constructor({x = 0, y = 0, vx = 0, vy = 0, damage = 1, returnSpeed = 4, source}: Props) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.damage = damage;
        this.speed = Math.sqrt(vx * vx + vy * vy);
        this.returnSpeed = returnSpeed;
        this.w = chakramGeometry.content.w;
        this.h = chakramGeometry.content.h;
        this.outFrames = 12;
        this.hitTargets = new Set();
        this.source = source;
    }
    update(state: GameState) {
        // Chakram returns to the hero if the clone it was thrown from no longer exists.
        if (this.area.objects.indexOf(this.source) < 0) {
            this.source = state.hero;
        }
        this.animationTime += FRAME_LENGTH;
        if (this.outFrames > 0) {
            this.x += this.vx;
            this.y += this.vy;
            this.outFrames--;
            const { section } = getAreaSize(state);
            if (this.x <= section.x || this.y <= section.y
                || this.x + this.w >= section.x + section.w || this.y + this.h >= section.y + section.h
            ) {
                this.outFrames = 0;
            }
        } else {
            const dx = (this.source.x + this.source.w / 2) - (this.x + this.w / 2);
            const dy = (this.source.y - 2 + this.source.h / 2) - (this.y + this.h / 2);
            const m = Math.sqrt(dx * dx + dy * dy);
            this.vx = this.returnSpeed * dx / m;
            this.vy = this.returnSpeed * dy / m;
            this.x += this.vx;
            this.y += this.vy;
            if (isPointInShortRect(this.source.x + this.source.w / 2, this.source.y + this.source.h / 2, this)) {
                removeObjectFromArea(state, this);
                return;
            }
        }
        for (const object of this.area.objects) {
            if (object.status === 'hiddenEnemy' || object.status === 'hiddenSwitch') {
                continue;
            }
            if (object instanceof Enemy) {
                if (!this.hitTargets.has(object) && rectanglesOverlap(object.getHitbox(state), this)) {
                    damageActor(state, object, this.damage);
                    this.hitTargets.add(object);
                    this.outFrames = 0;
                }
            }
            // Only hit objects on the way out to prevent accidentally dragging objects towards the player.
            if (this.outFrames > 0) {
                if (object.getHitbox && object.onHit) {
                    const hitbox = object.getHitbox(state);
                    if (rectanglesOverlap(hitbox, this)) {
                        const direction = getDirection(hitbox.x - this.x + 8 * this.vx, hitbox.y - this.y + 8 * this.vy);
                        object.onHit(state, direction);
                        this.hitTargets.add(object);
                        this.outFrames = 0;
                    }
                }
            }
        }
        for (const target of getTilesInRectangle(this.area, this)) {
            const behavior = this.area.behaviorGrid?.[target.y]?.[target.x];
            if (behavior?.cuttable <= state.hero.weapon) {
                // We need to find the specific cuttable layers that can be destroyed.
                for (const layer of this.area.layers) {
                    const tile = layer.tiles[target.y][target.x];
                    const behavior = tile?.behaviors;
                    if (behavior?.cuttable <= state.hero.weapon) {
                        destroyTile(state, this.area, {...target, layerKey: layer.key});
                        addParticleAnimations(state, this.area, target.x * 16, target.y * 16, 2, behavior.particles, behavior);
                    }
                }
            } else if (behavior?.cuttable > state.hero.weapon ||
                ((behavior?.solid || behavior?.solidMap) && !behavior?.low)
            ) {
                this.outFrames = 0;
            }
        }
    }
    render(context, state: GameState) {
        const frame = getFrame(chakramAnimation, this.animationTime);
        drawFrame(context, frame, { ...frame, x: this.x - frame.content.x, y: this.y - frame.content.y });
    }
}
