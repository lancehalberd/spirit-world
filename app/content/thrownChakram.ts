import { makeSparkleAnimation } from 'app/content/animationEffect';
import { addObjectToArea, getAreaSize, removeObjectFromArea } from 'app/content/areas';
import { FRAME_LENGTH } from 'app/gameConstants';
import { createAnimation, drawFrame, getFrame } from 'app/utils/animations';
import { hitTargets } from 'app/utils/field';
import { isPointInShortRect, pad } from 'app/utils/index';
import { playSound } from 'app/utils/sounds';

import {
    AnimationEffect, AreaInstance, DrawPriority, Frame, GameState, Hero, HitProperties, MagicElement, ObjectInstance, ObjectStatus,
} from 'app/types';

const chakramGeometry = {w: 16, h: 16, content: {x: 2, y: 2, w: 12, h: 12}};
const chakramAnimation = createAnimation('gfx/chakram1.png', chakramGeometry, {cols: 9, x: 0, duration: 2}, {loopFrame: 1});

interface Props {
    x?: number
    y?: number,
    vx?: number,
    vy?: number,
    damage?: number,
    element?: MagicElement,
    piercing?: boolean,
    returnSpeed?: number,
    source: Hero,
}

export class ThrownChakram implements ObjectInstance {
    area: AreaInstance;
    definition = null;
    drawPriority: DrawPriority = 'sprites';
    type = 'thrownChakram' as 'thrownChakram';
    element: MagicElement;
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
    constructor({x = 0, y = 0, vx = 0, vy = 0, damage = 1, element = null, returnSpeed = 4, piercing = false, source}: Props) {
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
        this.element = element;
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

        // We do three collision checks
        // A full hitbox check for hitting objects/enemies:
        let hit: HitProperties = {
            damage: this.damage,
            element: this.element,
            cutsGround: true,
            vx: this.vx,
            vy: this.vy,
            hitbox: this,
            hitEnemies: true,
            hitObjects: true,
        }
        // Only push objects on the way out to prevent accidentally dragging objects towards the player.
        if (this.outFrames > 0) {
            hit.canPush = true;
            hit.knockback = {vx: this.vx / 2, vy: this.vy / 2, vz: 0};
        }
        let hitResult = hitTargets(state, this.area, hit);
        if (((hitResult.hit || hitResult.blocked) && !this.piercing && !hitResult.pierced) || hitResult.stopped) {
            this.outFrames = 0;
        }
        // A full hitbox check for hitting tiles.
        hit = {
            damage: this.damage,
            element: this.element,
            cutsGround: true,
            vx: this.vx,
            vy: this.vy,
            hitbox: this,
            hitTiles: true,
        };
        hitResult = hitTargets(state, this.area, hit);
        // A small hitbox check for hitting tiles that stops on any impact, this allows the chakram to go partially
        // into solid tiles and hit things at the base of walls.
        hit = {
            vx: this.vx,
            vy: this.vy,
            hitbox: pad(this, -4),
            hitTiles: true,
        };
        hitResult = hitTargets(state, this.area, hit);
        if (((hitResult.hit || hitResult.blocked) && !this.piercing && !hitResult.pierced) || hitResult.stopped) {
            this.outFrames = 0;
        }
    }
    render(context, state: GameState) {
        const frame = getFrame(chakramAnimation, this.animationTime);
        drawFrame(context, frame, { ...frame, x: this.x - frame.content.x, y: this.y - frame.content.y });
        for (const sparkle of this.sparkles) {
            sparkle.render(context, state);
        }
        if (this.element) {
            context.save();
                context.globalAlpha *= 0.8;
                context.beginPath();
                context.fillStyle = {fire: 'red', ice: '#08F', lightning: 'yellow'}[this.element];
                context.arc(
                    this.x - frame.content.x + frame.w / 2,
                    this.y - frame.content.y + frame.h / 2,
                    6,
                    0, 2 * Math.PI
                );
                context.fill();
            context.restore();
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
        this.hero = source;
        this.updatePosition();
        this.sparkles = [];
    }
    throw(state: GameState) {
        let speed = 3;
        let element: MagicElement = null;
        if (state.hero.passiveTools.charge >= 1) {
            if (state.hero.magic > 0 && this.animationTime >= 1000) {
                speed = 12;
                state.hero.magic -= 10;
                if (state.hero.element) {
                    state.hero.magic -= 10;
                }
                element = state.hero.element;
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
            damage: this.damage * Math.round(1 + speed / 6),
            element,
            source: this.hero,
            piercing: speed === 12,
        });
        if (chakram.speed >= 12) {
            playSound('strongChakram');
        } else if (chakram.speed >= 6) {
            playSound('normalChakram');
        } else {
            playSound('weakChakram');
        }
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
        // Only play the held sound if they actually hold the chakram for a moment.
        // This also happens to be the exact time that damage is doubled with level one charge.
        if (state.hero.passiveTools.charge >= 1 && this.animationTime === 300) {
            playSound('chakramCharge1');
        }
        // Play a second sound when damage is doubled using the base charge (level 0).
        if (!state.hero.passiveTools.charge && this.animationTime === 600) {
            playSound('chakramCharge1');
        }
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

        const hit: HitProperties = {
            damage: this.damage,
            vx: this.vx,
            vy: this.vy,
            hitbox: this,
            hitEnemies: true,
            hitObjects: false,
            knockAwayFrom: { x: this.hero.x + this.hero.w / 2, y: this.hero.y + this.hero.h / 2 },
        };
        const hitResult = hitTargets(state, this.area, hit);
        if (hitResult.hit && !hitResult.pierced) {
            this.hero.action = null;
            removeObjectFromArea(state, this);
            // console.log(hitResult.knockback);
            if (hitResult.knockback) {
                this.hero.bounce = {vx: hitResult.knockback.vx, vy: hitResult.knockback.vy, frames: 10};
            }
            return;
        }
        // Check for hitting tiles separate as we don't want this to remove the held chakram.
        hit.hitEnemies = false;
        hit.hitObjects = false;
        hit.hitTiles = true;
        hitTargets(state, this.area, hit);
    }
    render(context, state: GameState) {
        if (this.animationTime < 100) {
            return;
        }
        let animationTime = 0;
        let element = null;
        if (state.hero.passiveTools.charge >= 1 && state.hero.magic > 0) {
            if (this.animationTime >= 1000) {
                animationTime = this.animationTime;
                element = state.hero.element;
            } else {
                animationTime = this.animationTime / 10;
            }
        }
        const frame = getFrame(chakramAnimation, animationTime);
        drawFrame(context, frame, { ...frame, x: this.x - frame.content.x, y: this.y - frame.content.y });
        for (const sparkle of this.sparkles) {
            sparkle.render(context, state);
        }
        if (element) {
            context.save();
                context.globalAlpha *= 0.8;
                context.beginPath();
                context.fillStyle = {fire: 'red', ice: '#08F', lightning: 'yellow'}[element];
                context.arc(
                    this.x - frame.content.x + frame.w / 2,
                    this.y - frame.content.y + frame.h / 2,
                    6,
                    0, 2 * Math.PI
                );
                context.fill();
            context.restore();
        }
    }
}
