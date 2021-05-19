import { addParticleAnimations, makeSparkleAnimation } from 'app/content/animationEffect';
import { addObjectToArea, destroyTile, getAreaSize, removeObjectFromArea } from 'app/content/areas';
import { Enemy } from 'app/content/enemy';
import { FRAME_LENGTH } from 'app/gameConstants';
import { getTilesInRectangle } from 'app/getActorTargets';
import { damageActor } from 'app/updateActor';
import { createAnimation, drawFrame, getFrame } from 'app/utils/animations';
import { getDirection } from 'app/utils/field';
import { isPointInShortRect, rectanglesOverlap } from 'app/utils/index';

import { AnimationEffect, AreaInstance, DrawPriority, Frame, GameState, Hero, ObjectInstance, ObjectStatus } from 'app/types';

const chakramGeometry = {w: 16, h: 16, content: {x: 2, y: 2, w: 12, h: 12}};
const chakramAnimation = createAnimation('gfx/chakram1.png', chakramGeometry, {cols: 9, x: 0, duration: 2}, {loopFrame: 1});

interface Props {
    x?: number
    y?: number,
    vx?: number,
    vy?: number,
    damage?: number,
    piercing?: boolean,
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
    piercing = false;
    x: number;
    y: number;
    w: number;
    h: number;
    vx: number;
    vy: number;
    status: ObjectStatus = 'normal';
    source: Hero;
    animationTime = 0;
    sparkles: AnimationEffect[];
    constructor({x = 0, y = 0, vx = 0, vy = 0, damage = 1, returnSpeed = 4, piercing = false, source}: Props) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.damage = damage;
        this.speed = Math.sqrt(vx * vx + vy * vy);
        this.piercing = piercing;
        this.returnSpeed = returnSpeed;
        this.w = chakramGeometry.content.w;
        this.h = chakramGeometry.content.h;
        this.outFrames = 12;
        this.source = source;
        this.sparkles = [];
    }
    update(state: GameState) {
        // Chakram returns to the hero if the clone it was thrown from no longer exists.
        if (this.area.objects.indexOf(this.source) < 0) {
            this.source = state.hero;
        }
        if (this.piercing && ((this.animationTime < 200 && this.animationTime % 40 === 0) || this.animationTime % 200 === 0)) {
            this.sparkles.push(makeSparkleAnimation(state, this));
        }
        this.sparkles = this.sparkles.filter(s => !s.done);
        for (const sparkle of this.sparkles) {
            sparkle.update(state);
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
                if (rectanglesOverlap(object.getHitbox(state), this)) {
                    if (damageActor(state, object, this.damage, {vx: this.vx / 2, vy: this.vy / 2, vz: 0})) {
                        if (!this.piercing) {
                            this.outFrames = 0;
                        }
                    }
                }
            }
            // Only hit objects on the way out to prevent accidentally dragging objects towards the player.
            if (this.outFrames > 0) {
                if (object.getHitbox && object.onHit) {
                    const hitbox = object.getHitbox(state);
                    if (rectanglesOverlap(hitbox, this)) {
                        const direction = getDirection(hitbox.x - this.x + 8 * this.vx, hitbox.y - this.y + 8 * this.vy);
                        object.onHit(state, direction);
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
        for (const sparkle of this.sparkles) {
            sparkle.render(context, state);
        }
    }
}

export class HeldChakram implements ObjectInstance {
    area: AreaInstance;
    hero: Hero;
    definition = null;
    drawPriority: DrawPriority = 'sprites';
    type = 'heldChakram' as 'heldChakram';
    frame: Frame;
    outFrames: number;
    damage: number;
    ignorePits = true;
    x: number;
    y: number;
    w: number;
    h: number;
    vx: number;
    vy: number;
    status: ObjectStatus = 'normal';
    animationTime = 0;
    changesAreas = true;
    updateDuringTransition = true;
    sparkles: AnimationEffect[];
    constructor({x = 0, y = 0, vx = 0, vy = 0, damage = 1, source}: Props) {
        this.vx = vx;
        this.vy = vy;
        this.damage = damage;
        this.w = chakramGeometry.content.w;
        this.h = chakramGeometry.content.h;
        this.outFrames = 12;
        this.hero = source;
        this.updatePosition();
        this.sparkles = [];
    }
    throw(state: GameState) {
        let speed = 3;
        if (state.hero.passiveTools.charge >= 1) {
            if (state.hero.magic > 0 && this.animationTime >= 1000) {
                speed = 12;
                state.hero.magic -= 10;
            } else {
                speed = Math.min(6, speed + this.animationTime / 100);
            }
        } else {
            speed = Math.min(6, speed + this.animationTime / 200);
        }
        const chakram = new ThrownChakram({
            x: this.hero.x + 3,
            y: this.hero.y,
            vx: speed * this.vx,
            vy: speed * this.vy,
            returnSpeed: 4,
            damage: this.damage * Math.round(Math.max(1, speed / 4)),
            source: this.hero,
            piercing: speed === 12,
        });
        this.hero.vx -= chakram.vx / 4;
        this.hero.vy -= chakram.vy / 4;
        addObjectToArea(state, this.area, chakram);
        removeObjectFromArea(state, this);
    }
    updatePosition() {
        if (this.vx && this.vy) {
            // When aiming diagonally, place the chakram in the aimed direction.
            this.x = this.hero.x + 3 + this.vx * 5;
            this.y = this.hero.y + this.vy * 5;
        } else {
            // When aiming cardinally, place the chakram in the left hand.
            this.x = this.hero.x + 3 + this.vy * 5 + this.vx * 5;
            this.y = this.hero.y - this.vx * 5 + this.vy * 5;
        }
    }
    update(state: GameState) {
        // Held chakram is thrown if the hero no longer exists.
        if (this.hero !== state.hero && this.area.objects.indexOf(this.hero) < 0) {
            this.throw(state);
            return;
        }
        if (this.animationTime >= 1000 && state.hero.passiveTools.charge >= 1 && this.animationTime % 200 === 0) {
            this.sparkles.push(makeSparkleAnimation(state, this));
        }
        this.sparkles = this.sparkles.filter(s => !s.done);
        for (const sparkle of this.sparkles) {
            sparkle.update(state);
        }
        this.updatePosition();
        this.animationTime += FRAME_LENGTH;
        for (const object of this.area.objects) {
            if (object.status === 'hiddenEnemy' || object.status === 'hiddenSwitch') {
                continue;
            }
            if (object instanceof Enemy) {
                const enemyHitbox = object.getHitbox(state);
                if (rectanglesOverlap(object.getHitbox(state), this)) {
                    const dx = (enemyHitbox.x + enemyHitbox.w / 2) - (this.hero.x + this.hero.w / 2);
                    const dy = (enemyHitbox.y + enemyHitbox.h / 2) - (this.hero.y + this.hero.h / 2);
                    const mag = Math.sqrt(dx * dx + dy * dy);
                    const hit = damageActor(state, object, this.damage, mag ? {vx: 4 * dx / mag, vy: 4 * dy / mag, vz: 0} : null);
                    if (hit) {
                        this.hero.action = null;
                        removeObjectFromArea(state, this);
                        this.hero.bounce = {vx: -4 * dx / mag, vy: -4 * dy / mag, frames: 10};
                        return;
                    }
                    this.outFrames = 0;
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
            }
        }
    }
    render(context, state: GameState) {
        if (this.animationTime < 100) {
            return;
        }
        let animationTime = 0;
        if (state.hero.passiveTools.charge >= 1 && state.hero.magic > 0) {
            if (this.animationTime >= 1000) {
                animationTime = this.animationTime;
            } else {
                animationTime = this.animationTime / 10;
            }
        }
        const frame = getFrame(chakramAnimation, animationTime);
        drawFrame(context, frame, { ...frame, x: this.x - frame.content.x, y: this.y - frame.content.y });
        for (const sparkle of this.sparkles) {
            sparkle.render(context, state);
        }
    }
}
