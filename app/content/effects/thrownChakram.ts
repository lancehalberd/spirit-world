import { makeSparkleAnimation } from 'app/content/effects/animationEffect';
import { addEffectToArea, getAreaSize, removeEffectFromArea } from 'app/content/areas';
import { FRAME_LENGTH } from 'app/gameConstants';
import { getChargeLevelAndElement } from 'app/useTool';
import { createAnimation, drawFrame, getFrame } from 'app/utils/animations';
import { hitTargets } from 'app/utils/field';
import { isPointInShortRect, pad } from 'app/utils/index';
import { playSound } from 'app/musicController';

import {
    AnimationEffect, AreaInstance, DrawPriority, EffectInstance, Frame, GameState, Hero, HitProperties, MagicElement,
} from 'app/types';

const chakramGeometry = {w: 16, h: 16, content: {x: 2, y: 2, w: 12, h: 12}};
const chakramAnimation = createAnimation('gfx/chakram1.png', chakramGeometry, {cols: 9, x: 0, duration: 2}, {loopFrame: 1});

interface Props {
    x?: number
    y?: number
    vx?: number
    vy?: number
    // 1 = normal chakram, 2 = spirit chakram
    level: number
    damage?: number
    element?: MagicElement
    piercing?: boolean
    returnSpeed?: number
    source: Hero
}

export class ThrownChakram implements EffectInstance {
    area: AreaInstance;
    drawPriority: DrawPriority = 'sprites';
    type = 'thrownChakram' as 'thrownChakram';
    element: MagicElement;
    frame: Frame;
    isEffect = <const>true;
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
    source: Hero;
    animationTime = 0;
    sparkles: AnimationEffect[];
    relativeSparkles: AnimationEffect[];
    hitCooldown: number = 0;
    isPlayerAttack = true;
    level: number;
    constructor({x = 0, y = 0, vx = 0, vy = 0, damage = 1, element = null, returnSpeed = 4, piercing = false, level, source}: Props) {
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
        this.relativeSparkles = [];
        this.sparkles = [];
        this.element = element;
        this.level = level;
    }
    update(state: GameState) {
        // Chakram returns to the hero if the clone it was thrown from no longer exists.
        if (this.area.objects.indexOf(this.source) < 0) {
            this.source = state.hero;
        }
        let spawnTime = 200;
        if (this.animationTime < 200) {
            spawnTime /= 5;
        }
        if (this.hitCooldown) {
            this.hitCooldown -= FRAME_LENGTH;
        }
        //if (this.element === 'lightning') {
        //    spawnTime /= 2;
        //}
        if ((this.piercing || this.element) && this.animationTime % spawnTime === 0) {
            this.sparkles.push(makeSparkleAnimation(state, this, {
                element: this.element,
                velocity: {x: this.vx, y: this.vy},
            }));
        }
        this.sparkles = this.sparkles.filter(s => !s.done);
        for (const sparkle of this.sparkles) {
            sparkle.update(state);
        }

        if (this.level >= 2 && this.relativeSparkles.length < 3) {
            this.relativeSparkles.push(makeSparkleAnimation(state, this, {
                velocity: {x: 0, y: 0, z: 0.3},
            }));
        }
        this.relativeSparkles = this.relativeSparkles.filter(s => !s.done);
        for (const relativeSparkle of this.relativeSparkles) {
            // double the speed these sparkles run at.
            relativeSparkle.update(state);
            relativeSparkle.update(state);
        }


        this.animationTime += FRAME_LENGTH;
        if (this.outFrames > 0) {
            this.x += this.vx;
            this.y += this.vy;
            for (const relativeSparkle of this.relativeSparkles) {
                relativeSparkle.x += this.vx;
                relativeSparkle.y += this.vy;
            }
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
            for (const relativeSparkle of this.relativeSparkles) {
                relativeSparkle.x += this.vx;
                relativeSparkle.y += this.vy;
            }
            if (isPointInShortRect(this.source.x + this.source.w / 2, this.source.y + this.source.h / 2, this)) {
                removeEffectFromArea(state, this);
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
            hitEnemies: this.hitCooldown <= 0,
            hitObjects: this.hitCooldown <= 0,
            source: this.source,
        }
        // Only push objects on the way out to prevent accidentally dragging objects towards the player.
        if (this.outFrames > 0) {
            hit.canPush = true;
            hit.knockback = {vx: this.vx / 2, vy: this.vy / 2, vz: 0};
        }
        let hitResult = hitTargets(state, this.area, hit);
        let didHit = hitResult.hit || hitResult.blocked;
        if (hitResult.blocked || hitResult.stopped) {
            this.hitCooldown = 200;
        }
        // This is used to make torches light th chakram on fire.
        if (hitResult.setElement) {
            this.element = hitResult.setElement;
        }
        if ((didHit && !this.piercing && !hitResult.pierced && !hitResult.destroyed) || hitResult.stopped) {
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
        didHit = hitResult.hit || hitResult.blocked;
        if ((didHit && !this.piercing && !hitResult.pierced && !hitResult.destroyed) || hitResult.stopped) {
            this.outFrames = 0;
        }
    }
    render(context, state: GameState) {
        const frame = getFrame(chakramAnimation, this.animationTime);
        drawFrame(context, frame, { ...frame, x: this.x - frame.content.x, y: this.y - frame.content.y });
        for (const sparkle of this.sparkles) {
            sparkle.render(context, state);
        }
        for (const sparkle of this.relativeSparkles) {
            sparkle.render(context, state);
        }
    }
}

export class HeldChakram implements EffectInstance {
    area: AreaInstance;
    hero: Hero;
    drawPriority: DrawPriority = 'sprites';
    type = 'heldChakram' as 'heldChakram';
    frame: Frame;
    damage: number;
    ignorePits = true;
    isEffect = <const>true;
    x: number;
    y: number;
    w: number;
    h: number;
    vx: number;
    vy: number;
    animationTime = 0;
    changesAreas = true;
    updateDuringTransition = true;
    sparkles: AnimationEffect[];
    isPlayerAttack = true;
    level: number;
    constructor({x = 0, y = 0, vx = 0, vy = 0, source, level}: Props) {
        this.vx = vx;
        this.vy = vy;
        this.damage = 1;
        this.w = chakramGeometry.content.w;
        this.h = chakramGeometry.content.h;
        this.hero = source;
        this.updatePosition();
        this.sparkles = [];
        this.level = level;
        // The Spirit Chakram deals two damage when held if it has been upgraded.
        if (this.level > 1 && this.hero.weaponUpgrades.spiritDamage) {
            this.damage++;
        }
    }
    throw(state: GameState) {
        const { chargeLevel, element } = getChargeLevelAndElement(state, this.hero);
        let throwDamage = this.level;
        let throwSpeed = 1 + 2 * this.level;
        if (this.level === 1) {
            if (this.hero.weaponUpgrades.normalDamage) {
                throwDamage++;
            }
            if (this.hero.weaponUpgrades.normalRange) {
                throwSpeed += 2;
            }
        } else {
            if (this.hero.weaponUpgrades.spiritDamage) {
                throwDamage += 2;
            }
            if (this.hero.weaponUpgrades.spiritRange) {
                throwSpeed += 3;
            }
        }
        if (chargeLevel >= 1) {
            throwSpeed = 12;
            throwDamage += 2;
            state.hero.magic -= 10;
            if (state.hero.element) {
                state.hero.magic -= 10;
            }
        } else if (state.hero.getMaxChargeLevel(state) >= 1) {
            // Chakram reaches max speed twice as fast once you have the charge tool.
            if (this.animationTime >= 300) {
                throwDamage += this.level;
                throwSpeed += 3;
            }
        } else {
            if (this.animationTime >= 600) {
                throwDamage += this.level;
                throwSpeed += 3;
            }
        }
        const chakram = new ThrownChakram({
            x: this.hero.x + 3,
            y: this.hero.y,
            vx: throwSpeed * this.vx,
            vy: throwSpeed * this.vy,
            returnSpeed: Math.max(4, 2 * throwSpeed / 3),
            damage: throwDamage,
            element,
            source: this.hero,
            piercing: throwSpeed === 12,
            level: this.level,
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
        addEffectToArea(state, this.area, chakram);
        removeEffectFromArea(state, this);
        this.hero.thrownChakrams.push(chakram);
        delete this.hero.heldChakram;
    }
    updatePosition() {
        //if (this.vx && this.vy) {
            // When aiming diagonally, place the chakram in the aimed direction.
          //  this.x = this.hero.x + 3 + this.vx * 5;
           // this.y = this.hero.y + this.vy * 5;
        //} else {
            // When aiming cardinally, place the chakram in the right hand.
            this.x = this.hero.x + 3 - this.vy * 5 + this.vx * 5;
            this.y = this.hero.y + this.vx * 5 + this.vy * 4;
        //}
    }
    update(state: GameState) {
        const maxChargeLevel = state.hero.getMaxChargeLevel(state);
        // Only play the held sound if they actually hold the chakram for a moment.
        // This also happens to be the exact time that damage is doubled with level one charge.
        if (maxChargeLevel && this.animationTime === 300) {
            playSound('chakramCharge1');
        }
        // Play a second sound when damage is doubled using the base charge (level 0).
        if (!maxChargeLevel && this.animationTime === 600) {
            playSound('chakramCharge1');
            const cx = this.w / 2, cy = this.h / 2;
            this.sparkles.push(makeSparkleAnimation(state, {x: cx + 2, y: cy + 2, w: 1, h: 1}, { target: this, delay: 0 }));
            this.sparkles.push(makeSparkleAnimation(state, {x: cx - 3, y: cy + 3, w: 1, h: 1}, { target: this, delay: 80 }));
            this.sparkles.push(makeSparkleAnimation(state, {x: cx - 4, y: cy - 4, w: 1, h: 1}, { target: this, delay: 160 }));
            this.sparkles.push(makeSparkleAnimation(state, {x: cx + 6, y: cy - 6, w: 1, h: 1}, { target: this, delay: 240 }));
        }
        // Held chakram is thrown if the hero no longer exists.
        if (this.hero !== state.hero && this.area.objects.indexOf(this.hero) < 0) {
            this.throw(state);
            return;
        }
        // Remove a chakram if it is not in the are with the hero.
        if (!state.transitionState && this.hero.area !== this.area) {
            removeEffectFromArea(state, this);
            delete this.hero.heldChakram;
            return;
        }
        if (state.hero.magic > 0 && this.animationTime >= 1000 && maxChargeLevel && this.animationTime % 200 === 0) {
            this.sparkles.push(makeSparkleAnimation(state, this, { element: this.hero.element }));
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
            source: this.hero,
        };
        const hitResult = hitTargets(state, this.area, hit);
        if (hitResult.hit && !hitResult.pierced) {
            this.hero.action = null;
            removeEffectFromArea(state, this);
            delete this.hero.heldChakram;
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
        if (state.hero.getMaxChargeLevel(state) && state.hero.magic > 0) {
            const { chargeLevel } = getChargeLevelAndElement(state, this.hero);
            if (chargeLevel >= 1) {
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
