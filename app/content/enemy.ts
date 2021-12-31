import { AnimationEffect } from 'app/content/animationEffect';
import { checkForFloorEffects, moveEnemy } from 'app/content/enemies';
import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import { dropItemFromTable, getLoot } from 'app/content/lootObject';
import { addObjectToArea, getAreaSize } from 'app/content/areas';
import { enemyDeathAnimation } from 'app/content/enemyAnimations';
import { getObjectStatus, saveObjectStatus } from 'app/content/objects';
import { FRAME_LENGTH } from 'app/gameConstants';
import { drawFrame, getFrame } from 'app/utils/animations';
import { playSound } from 'app/utils/sounds';

import {
    Action, Actor, AreaInstance, BossObjectDefinition, Direction, DrawPriority,
    EnemyDefinition, EnemyObjectDefinition,
    Frame, FrameAnimation, GameState, HitProperties, HitResult,
    ObjectInstance, ObjectStatus, Rect, TileBehaviors,
} from 'app/types';

export class Enemy implements Actor, ObjectInstance {
    type = 'enemy' as 'enemy';
    behaviors: TileBehaviors;
    action: Action = null;
    area: AreaInstance;
    drawPriority: DrawPriority = 'sprites';
    definition: EnemyObjectDefinition | BossObjectDefinition;
    enemyDefinition: EnemyDefinition;
    currentAnimation: FrameAnimation;
    hasShadow: boolean = true;
    animationTime: number;
    alwaysReset: boolean = false;
    alwaysUpdate: boolean = false;
    // This ignores the default pit logic in favor of the ground effects
    // code used internally.
    ignorePits = true;
    d: Direction;
    spawnX: number;
    spawnY: number;
    x: number;
    y: number;
    z: number = 0;
    vx: number = 0;
    vy: number = 0;
    vz: number = 0;
    az: number = 0;
    w: number;
    h: number;
    canBeKnockedBack: boolean = true;
    canBeKnockedDown: boolean = true;
    flying: boolean;
    isImmortal: boolean = false;
    isInvulnerable: boolean = false;
    isEnemyTarget: boolean = true;
    life: number;
    speed: number;
    acceleration: number;
    aggroRadius: number;
    mode = 'choose';
    // This time resets to 0 with every mode change.
    modeTime = 0;
    // This time starts at 0 and updates with every enemy update call and shouldn't be reset.
    time = 0;
    // Used to control animation of the healthBar for bosses.
    // This will be incremented each frame, but a boss can reset it to 0 on update to hide the
    // healthbar.
    healthBarTime = 0;
    params: any;
    enemyInvulnerableFrames = 0;
    // This is used to prevent the block effect from happening too frequently
    blockInvulnerableFrames = 0;
    invulnerableFrames = 0;
    status: ObjectStatus = 'normal';
    scale: number = 1;
    shielded: boolean = false;
    touchHit: HitProperties;
    constructor(state: GameState, definition: EnemyObjectDefinition | BossObjectDefinition) {
        this.definition = definition;
        this.enemyDefinition = enemyDefinitions[this.definition.enemyType] || enemyDefinitions.snake;
        this.behaviors = {
            ...(this.enemyDefinition.tileBehaviors || {}),
        };
        this.d = definition.d || 'down';
        this.hasShadow = this.enemyDefinition.hasShadow ?? true;
        this.currentAnimation = this.enemyDefinition.animations.idle[this.d];
        this.animationTime = 0;
        this.spawnX = this.x = definition.x;
        this.spawnY = this.y = definition.y;
        const frame = this.getFrame();
        this.w = frame.content?.w ?? frame.w;
        this.h = frame.content?.h ?? frame.h;
        this.life = this.enemyDefinition.life ?? 1;
        this.speed = this.enemyDefinition.speed ?? 1;
        this.acceleration = this.enemyDefinition.acceleration ?? .1;
        this.aggroRadius = this.enemyDefinition.aggroRadius ?? 80;
        this.canBeKnockedBack = this.enemyDefinition.canBeKnockedBack ?? this.definition.type !== 'boss';
        this.canBeKnockedDown = this.enemyDefinition.canBeKnockedDown ?? this.definition.type !== 'boss';
        this.flying = this.enemyDefinition.flying;
        this.isImmortal = this.enemyDefinition.isImmortal;
        this.z = 0;//this.flying ? 12 : 0;
        this.scale = this.enemyDefinition.scale ?? 1;
        this.params = {
            ...(this.enemyDefinition.params || {}),
            ...(definition.params || {}),
        };
        this.status = definition.status;
        if (getObjectStatus(state, this.definition)) {
            this.status = 'gone';
        }
        this.alwaysReset = this.enemyDefinition.alwaysReset;
        this.updateDrawPriority();
        this.mode = this.enemyDefinition.initialMode || 'choose';
        this.touchHit = this.enemyDefinition.touchHit;
    }
    getFrame(): Frame {
        return getFrame(this.currentAnimation, this.animationTime);
    }
    getHitbox(state: GameState): Rect {
        const frame = this.getFrame();
        return {
            x: this.x,
            y: this.y - this.z,
            w: (frame.content?.w ?? frame.w) * this.scale,
            h: (frame.content?.h ?? frame.h) * this.scale,
        };
    }
    isInCurrentSection(state: GameState): boolean {
        const { section } = getAreaSize(state);
        return !(this.x < section.x || this.x > section.x + section.w || this.y < section.y || this.y > section.y + section.h)
    }
    isFromCurrentSection(state: GameState): boolean {
        const { section } = getAreaSize(state);
        return !(this.spawnX < section.x || this.spawnX > section.x + section.w ||
                this.spawnY < section.y || this.spawnY > section.y + section.h)
    }
    setAnimation(type: string, d: Direction, time: number = 0) {
        const animationSet = this.enemyDefinition.animations[type] || this.enemyDefinition.animations.idle;
        this.currentAnimation = animationSet[d];
        this.animationTime = time;
    }
    setMode(mode: string) {
        this.mode = mode;
        // Setting it this way means that `modeTime` will be 0 during the next update loop,
        // since we increment modeTime by FRAME_LENGTH between each update.
        this.modeTime = -FRAME_LENGTH;
    }
    knockBack(state: GameState, {vx = 0, vy = 0, vz = 0}: {vx: number, vy: number, vz: number}) {
        if (!this.canBeKnockedBack) {
            return;
        }
        this.action = 'knocked';
        this.animationTime = 0;
        this.vx = vx;
        this.vy = vy;
        this.vz = vz;
    }
    onHit(state: GameState, hit: HitProperties): HitResult {
        if (this.status === 'gone' || this.status === 'hidden' || this.life <= 0) {
            return {};
        }
        if (this.enemyDefinition.onHit) {
            return this.enemyDefinition.onHit(state, this, hit);
        }
        return this.defaultOnHit(state, hit);
    }
    updateDrawPriority() {
        this.drawPriority = this.flying ? 'foreground' : 'sprites';
    }
    defaultOnHit(state: GameState, hit: HitProperties): HitResult {
        if (this.status === 'off') {
            if (hit.element === 'lightning') {
                this.status = 'normal';
                this.behaviors = {
                    ...(this.enemyDefinition.tileBehaviors || {}),
                };
                this.flying = this.enemyDefinition.flying;
                this.updateDrawPriority();
                return {
                    hit: true,
                    blocked: true,
                };
            }
            return {};
        }
        if (this.life <= 0 || this.status === 'gone' || this.enemyInvulnerableFrames || this.isInvulnerable) {
            return {};
        }
        // Ignore attacks that this enemy is immune to.
        if (this.enemyDefinition.immunities?.includes(hit.element)) {
            return {};
        }
        if (this.shielded) {
            if (this.blockInvulnerableFrames) {
                return {};
            }
            playSound('blockAttack');
            this.blockInvulnerableFrames = 30;
            return {
                hit: true,
                blocked: true,
                knockback: hit.knockback ? {vx: -hit.knockback.vx, vy: -hit.knockback.vy, vz: 0 } : null
            };
        }
        if (hit.damage) {
            const multiplier = this.enemyDefinition.elementalMultipliers?.[hit.element] || 1;
            this.applyDamage(state, multiplier * hit.damage);
        }
        return {
            hit: true,
            knockback: hit.knockback ? {vx: -hit.knockback.vx, vy: -hit.knockback.vy, vz: 0 } : null
        };
    }
    applyDamage(state: GameState, damage: number) {
        if (this.life <= 0) {
            return;
        }
        this.life -= damage;
        // This is actually the number of frames the enemy cannot damage the hero for.
        this.invulnerableFrames = 50;
        this.enemyInvulnerableFrames = 20;
        if (this.life <= 0 && !this.isImmortal) {
            this.showDeathAnimation(state);
        } else {
            playSound('enemyHit');
        }
        return true;
    }
    showDeathAnimation(state: GameState) {
        if (this.status === 'gone') {
            return;
        }
        const hitbox = this.getHitbox(state);
        const deathAnimation = new AnimationEffect({
            animation: enemyDeathAnimation,
            x: hitbox.x + hitbox.w / 2 - enemyDeathAnimation.frames[0].w / 2 * this.scale,
            // +1 to make sure the explosion appears in front of enemies the frame they die.
            y: hitbox.y + hitbox.h / 2 - enemyDeathAnimation.frames[0].h / 2 * this.scale + 1,
            scale: this.scale,
        });
        playSound('enemyDeath');
        if (this.enemyDefinition.lootTable) {
            dropItemFromTable(state, this.area, this.enemyDefinition.lootTable,
                hitbox.x + hitbox.w / 2,
                hitbox.y + hitbox.h / 2
            );
        }
        addObjectToArea(state, this.area, deathAnimation);
        if (this.enemyDefinition.onDeath) {
            this.enemyDefinition.onDeath(state, this);
        }
        this.status = 'gone';
        if (this.definition.type === 'boss') {
            // If the last boss is defeated kill all regular enemies.
            // Bosses in both material+spirit realms must be defeated before the battle is over.
            const allEnemies = [...this.area.enemies, ...this.area.alternateArea.enemies];
            if (!allEnemies.some(object => object.definition.type === 'boss' && object.status !== 'gone')) {
                // Remove all enemy attacks from the screen when a boss is defeated.
                this.area.objects = this.area.objects.filter(object => !object.isEnemyAttack);
                allEnemies.forEach(object => object.showDeathAnimation(state));
                // Gain loot if this boss hasn't been defeated yet.
                if (!getObjectStatus(state, this.definition)) {
                    // Make sure to save status before gaining loot since gaining loot refreshes object status.
                    saveObjectStatus(state, this.definition);
                    if (this.definition.lootType && this.definition.lootType !== 'empty') {
                        getLoot(state, this.definition);
                    }
                } else {
                    saveObjectStatus(state, this.definition);
                }
            }
        } else {
            saveObjectStatus(state, this.definition);
        }
    }
    shouldReset(state: GameState) {
        return true;
    }
    shouldRespawn(state: GameState) {
        return this.alwaysReset;
    }
    update(state: GameState) {
        if (this.status === 'gone') {
            return;
        }
        if (!this.alwaysUpdate && !this.isFromCurrentSection(state)) {
            return;
        }
        this.time += FRAME_LENGTH;
        // Only time counter advances for enemies that are off.
        // This status is only meant to apply to machines.
        if (this.status === 'off') {
            this.behaviors = {solid: true};
            this.flying = false;
            this.updateDrawPriority();
            if (this.z > 0) {
                this.z = Math.max(0, this.z + this.vz);
                this.vz = Math.max(-8, this.vz - 0.5);
            }
            return;
        }
        this.modeTime += FRAME_LENGTH;
        this.animationTime += FRAME_LENGTH;
        this.healthBarTime += FRAME_LENGTH;
        if (this.invulnerableFrames > 0) {
            this.invulnerableFrames--;
        }
        if (this.enemyInvulnerableFrames > 0) {
            this.enemyInvulnerableFrames--;
        }
        if (this.blockInvulnerableFrames > 0) {
            this.blockInvulnerableFrames--;
        }
        if (this.action === 'knocked') {
            this.z += this.vz;
            this.vz = Math.max(-8, this.vz - 0.5);
            moveEnemy(state, this, this.vx, this.vy, {canFall: true});
            const minZ = this.canBeKnockedDown ? 0 : (this.flying ? 12 : 0);
            if (this.z <= minZ) {
                this.z = minZ;
            }
            this.animationTime += FRAME_LENGTH;
            if (this.animationTime >= 200 && (!this.canBeKnockedDown || this.z <= minZ)) {
                this.action = null;
                this.animationTime = 0;
            }
            return;
        }
        if (this.flying && this.z < 12) {
            this.z = Math.min(12, this.z + 2);
            return;
        }
        if (this.flying && this.z > 12) {
            this.z = Math.max(12, this.z - 2);
        }
        if (this.enemyDefinition.update) {
            this.enemyDefinition.update(state, this);
        }
        // Checks if the enemy fell into a pit, for example
        checkForFloorEffects(state, this);
    }
    getHealthPercent(state): number {
        if (this.enemyDefinition.getHealthPercent) {
            return this.enemyDefinition.getHealthPercent(state, this);
        }
        return this.life / this.enemyDefinition.life;
    }
    getShieldPercent(state): number {
        if (this.enemyDefinition.getShieldPercent) {
            return this.enemyDefinition.getShieldPercent(state, this);
        }
        return this.shielded ? 1 : 0;
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        if (!this.area || this.status === 'gone' || this.status === 'hidden') {
            return;
        }
        if (this.enemyDefinition.render) {
            this.enemyDefinition.render(context, state, this);
        } else {
            this.defaultRender(context, state);
        }
        if (this.enemyDefinition.renderOver) {
            this.enemyDefinition.renderOver(context, state, this);
        }
    }
    defaultRender(context: CanvasRenderingContext2D, state: GameState) {
        const frame = this.getFrame();
        context.save();
            if (this.invulnerableFrames) {
                context.globalAlpha *= (0.7 + 0.3 * Math.cos(2 * Math.PI * this.time / 150));
            }
            if (this.d === 'right' && this.enemyDefinition.flipRight) {
                // Flip the frame when facing right. We may need an additional flag for this behavior
                // if we don't do it for all enemies on the right frames.
                const w = frame.content?.w ?? frame.w;
                if (this.definition.enemyType === 'flameHeart') {
                    console.log(frame, frame.content, w);
                }
                context.translate((this.x | 0) + ((frame?.content?.x || 0) + w / 2) * this.scale, 0);
                context.scale(-1, 1);
                drawFrame(context, frame, { ...frame,
                    x: - w / 2 - (frame?.content?.x || 0) * this.scale,
                    y: this.y - (frame?.content?.y || 0) * this.scale - this.z,
                    w: frame.w * this.scale,
                    h: frame.h * this.scale,
                });
            } else {
                drawFrame(context, frame, { ...frame,
                    x: this.x - (frame?.content?.x || 0) * this.scale,
                    y: this.y - (frame?.content?.y || 0) * this.scale - this.z,
                    w: frame.w * this.scale,
                    h: frame.h * this.scale,
                });
            }
            /*const hitbox = this.getHitbox(state);
            context.globalAlpha = 0.5;
            context.fillStyle = 'red';
            context.fillRect(hitbox.x, hitbox.y, hitbox.w, hitbox.h);*/
        context.restore();
    }
}
