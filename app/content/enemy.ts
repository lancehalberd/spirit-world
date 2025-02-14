import {
    iceFrontAnimation,
} from 'app/content/animations/iceOverlay';
import { addSparkleAnimation, FieldAnimationEffect } from 'app/content/effects/animationEffect';
import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import { addTextCue } from 'app/content/effects/textCue';
import { dropItemFromTable, getLoot } from 'app/content/objects/lootObject';
import { objectHash } from 'app/content/objects/objectHash';
import { bossDeathExplosionAnimation, enemyDeathAnimation } from 'app/content/enemyAnimations';
import { editingState } from 'app/development/editingState';
import { FRAME_LENGTH, gameModifiers } from 'app/gameConstants';
import { playAreaSound } from 'app/musicController';
import { renderEnemyShadow } from 'app/renderActor';
import { appendCallback } from 'app/scriptEvents';
import { drawFrame, getFrame } from 'app/utils/animations';
import {getCardinalDirection} from 'app/utils/direction';
import {addEffectToArea, removeEffectFromArea} from 'app/utils/effects';
import { checkForFloorEffects, moveEnemy } from 'app/utils/enemies';
import {trackEnemyTookDamage} from 'app/utils/enemyDamageTracking';
import { breakBrittleTilesInRect } from 'app/utils/field';
import { getAreaSize } from 'app/utils/getAreaSize';
import { pad } from 'app/utils/index';
import { getObjectStatus, saveObjectStatus } from 'app/utils/objects';
import Random from 'app/utils/Random';
import { isTargetVisible } from 'app/utils/target';

interface EnemyAbilityWithCharges {
    definition: EnemyAbility<any>
    cooldown: number
    charges: number
}


export class Enemy<Params=any> implements Actor, ObjectInstance {
    type = 'enemy' as 'enemy';
    behaviors: TileBehaviors;
    isObject = <const>true;
    action: Action = null;
    abilities: EnemyAbilityWithCharges[] = [];
    taunts?: {[key in string]: TextCueTauntInstance} ={}
    activeAbility: EnemyAbilityInstance<any>;
    area: AreaInstance;
    drawPriority: DrawPriority = 'sprites';
    definition: EnemyObjectDefinition | BossObjectDefinition;
    enemyDefinition: EnemyDefinition<Params>;
    // Which key was read from this.animations to produce the current animation.
    // Only valid if `currentAnimation` is set using standard methods.
    currentAnimationKey: string;
    currentAnimation: FrameAnimation;
    // If this is set, the enemy will automatically transition to this animation key
    // once it has completed the current animation.
    nextAnimationKey?: string;
    hasShadow: boolean = true;
    animationTime: number;
    animations: ActorAnimations;
    alwaysReset: boolean = false;
    alwaysUpdate: boolean = false;
    frozenDuration = 0;
    // If the enemy was killed with freezing damage, we track that here and prevent
    // certain on death effects from occuring.
    frozenAtDeath = false;
    burnDuration = 0;
    burnDamage = 0;
    // This ignores the default pit logic in favor of the ground effects
    // code used internally.
    ignorePits = true;
    d: CardinalDirection;
    // Rotation is used for changing directions of certain sprites.
    rotation: number;
    spawnX: number;
    spawnY: number;
    x: number;
    y: number;
    z: number = 0;
    vx: number = 0;
    vy: number = 0;
    vz: number = 0;
    az: number = -0.5;
    w: number;
    h: number;
    groundHeight = 0;
    canBeKnockedBack: boolean = true;
    canBeKnockedDown: boolean = true;
    // If this is true the enemy can move in water tiles and will also not sink in them.
    canSwim: boolean = false;
    // If this is true the enemy can move on lava tiles and will not be damaged by them.
    canMoveInLava: boolean = false;
    difficulty = 0;
    flying: boolean;
    isImmortal: boolean = false;
    isInvulnerable: boolean = false;
    isEnemyTarget: boolean = true;
    isAirborn = false;
    life: number;
    maxLife: number;
    speed: number;
    acceleration: number;
    aggroRadius: number;
    mode = 'choose';
    // This time resets to 0 with every mode change.
    modeTime = 0;
    // This time starts at 0 and updates with every enemy update call and shouldn't be reset.
    time = 0;
    isDefeated = false;
    isBoss = false;
    // Used to control animation of the healthBar for bosses.
    // This will be incremented each frame, but a boss can reset it to 0 on update to hide the
    // healthbar.
    // There is a 100ms grace period before the bar is displayed at all.
    healthBarTime = 0;
    healthBarColor?: string;
    params: Params;
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
        // Calculate the actual difficulty of this enemy instance.
        this.difficulty = gameModifiers.globalEnemyDifficulty * (definition.difficulty ?? this.enemyDefinition.naturalDifficultyRating);
        this.animations = this.enemyDefinition.animations;
        this.behaviors = {
            ...(this.enemyDefinition.tileBehaviors || {}),
            // Attribute touch hits to this enemy.
            touchHit: this.enemyDefinition.tileBehaviors?.touchHit ? {
                ...this.enemyDefinition.tileBehaviors.touchHit,
                source: this,
            } : undefined,
        };
        this.d = definition.d || 'down';
        this.hasShadow = this.enemyDefinition.hasShadow ?? true;
        this.changeToAnimation(this.enemyDefinition.initialAnimation || 'idle');
        this.spawnX = this.x = definition.x;
        this.spawnY = this.y = definition.y;
        const frame = this.getFrame();
        if (!frame) {
            debugger;
        }
        this.maxLife = this.enemyDefinition.life ?? 1;
        this.life = this.maxLife;
        this.speed = this.enemyDefinition.speed ?? 1;
        this.acceleration = this.enemyDefinition.acceleration ?? .1;
        this.aggroRadius = this.enemyDefinition.aggroRadius ?? 80;
        this.canBeKnockedBack = this.enemyDefinition.canBeKnockedBack ?? this.definition.type !== 'boss';
        this.canBeKnockedDown = this.enemyDefinition.canBeKnockedDown ?? this.definition.type !== 'boss';
        this.flying = this.enemyDefinition.flying;
        this.isImmortal = this.enemyDefinition.isImmortal;
        this.z = this.definition.z ?? 0;
        this.scale = this.enemyDefinition.scale ?? 1;
        this.w = (frame.content?.w ?? frame.w) * this.scale;
        this.h = (frame.content?.h ?? frame.h) * this.scale;
        this.params = {
            ...(this.enemyDefinition.params || {}),
            ...(definition.params || {}),
        } as Params;
        this.status = definition.status;
        if (this.definition.id && getObjectStatus(state, this.definition)) {
            this.status = 'gone';
        }
        this.alwaysReset = this.enemyDefinition.alwaysReset;
        this.updateDrawPriority();
        this.mode = this.enemyDefinition.initialMode || 'choose';
        this.touchHit = this.enemyDefinition.touchHit;
        for (const ability of this.enemyDefinition.abilities ?? []) {
            this.gainAbility(ability);
        }
        for (const tauntKey in this.enemyDefinition.taunts ?? []) {
            this.taunts[tauntKey] = {
                definition: this.enemyDefinition.taunts[tauntKey],
                cooldown: 0,
                timesUsed: 0,
            };
        }
        this.healthBarColor = this.enemyDefinition.healthBarColor;
        this.enemyDefinition.initialize?.(state, this);
        this.isAirborn = this.flying || this.enemyDefinition.floating || this.z > 0;
        this.canSwim = this.enemyDefinition.canSwim || this.enemyDefinition.baseMovementProperties?.canSwim;
        this.canMoveInLava = this.enemyDefinition.canMoveInLava || this.enemyDefinition.baseMovementProperties?.canMoveInLava;
        this.isBoss = this.definition.type === 'boss';
    }
    gainAbility(ability: EnemyAbility<any>) {
        this.abilities.push({
            definition: ability,
            charges: ability.initialCharges ?? 1,
            cooldown: ability.initialCooldown || ability.cooldown || 0,
        });
    }
    getFrame(): Frame {
        const frame = getFrame(this.currentAnimation, this.animationTime);
        if (!frame) {
            console.log("Missing frame", this.currentAnimationKey, this.animationTime, this.currentAnimation);
            debugger;
        }
        return frame;
    }
    getTouchHitbox(): Rect {
        if (this.enemyDefinition.getTouchHitbox) {
            return this.enemyDefinition.getTouchHitbox(this);
        }
        return this.getHitbox();
    }
    getHitbox(state?: GameState): Rect {
        if (this.enemyDefinition.getHitbox) {
            return this.enemyDefinition.getHitbox(this);
        }
        return this.getDefaultHitbox();
    }
    getYDepth(): number {
        if (this.enemyDefinition.getYDepth) {
            return this.enemyDefinition.getYDepth(this);
        }
        const hitbox = this.getHitbox();
        return hitbox.y + hitbox.h + this.z;
    }
    getTargetingAnchorPoint(): Point {
        const frame = this.getFrame();
        if (frame.anchor) {
            return {x: this.x, y: this.y};
        }
        const hitbox = this.getHitbox();
        return {x: hitbox.x + hitbox.w / 2, y: hitbox.y + hitbox.h / 2};
    }
    getMovementHitbox(): Rect {
        const frame = this.getFrame();
        const hitbox = {
            x: this.x | 0,
            y: this.y | 0,
            w: ((frame.content?.w ?? frame.w) * this.scale) | 0,
            h: ((frame.content?.h ?? frame.h) * this.scale) | 0,
        };
        if (frame.anchor) {
            if (
                (this.enemyDefinition.flipRight && this.d === 'right')
                || (this.enemyDefinition.flipLeft && this.d === 'left')
            ) {
                hitbox.x -= ((frame.content?.x || 0) + (frame.content?.w || frame.w) - frame.anchor.x);
            } else {
                hitbox.x -= (frame.anchor.x - (frame.content?.x || 0));
            }
            hitbox.y -= (frame.anchor.y - (frame.content.y || 0));
        }
        return hitbox;
    }
    getDefaultHitbox(): Rect {
        const frame = this.getFrame();
        const hitbox = {
            x: this.x | 0,
            y: (this.y - this.z) | 0,
            w: ((frame.content?.w ?? frame.w) * this.scale) | 0,
            h: ((frame.content?.h ?? frame.h) * this.scale) | 0,
        };
        if (frame.anchor) {
            if (
                (this.enemyDefinition.flipRight && this.d === 'right')
                || (this.enemyDefinition.flipLeft && this.d === 'left')
            ) {
                hitbox.x -= ((frame.content?.x || 0) + (frame.content?.w || frame.w) - frame.anchor.x);
            } else {
                hitbox.x -= (frame.anchor.x - (frame.content?.x || 0));
            }
            hitbox.y -= (frame.anchor.y - (frame.content?.y || 0));
        }
        return hitbox;
    }
    distanceToPoint(p: Coords): number {
        const hitbox = this.getHitbox();
        const dx = hitbox.x + hitbox.w / 2 - p[0];
        const dy = hitbox.y + hitbox.h / 2 - p[1];
        return Math.sqrt(dx * dx + dy *dy);
    }
    faceTarget(state: GameState, target?: ObjectInstance | EffectInstance): void {
        if (!this.area) {
            return;
        }
        if (!target) {
            target = this.area.allyTargets.find(t => isTargetVisible(state, this, t))
        }
        if (!target) {
            return;
        }
        const hitbox = this.getHitbox();
        const targetHitbox = target.getHitbox();
        const dx = targetHitbox.x + targetHitbox.w / 2 - (hitbox.x + hitbox.w / 2);
        const dy = targetHitbox.y + targetHitbox.h / 2 - (hitbox.y + hitbox.h / 2);
        this.d = getCardinalDirection(dx, dy);
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
    changeToAnimation(type: string, nextAnimationKey?: string) {
        if (!this.animations) {
            debugger;
        }
        this.currentAnimationKey = type;
        this.nextAnimationKey = nextAnimationKey;
        const animationSet = this.animations[type] || this.animations.idle;
        // Fallback to the first defined direction if the current direction isn't defined.
        const targetAnimation = animationSet[this.d] || Object.values(animationSet)[0];
        if (!targetAnimation) {
            console.error(`No animation found for ${type} ${this.d}`, this.animations);
            debugger;
        }
        if (this.currentAnimation !== targetAnimation) {
            this.currentAnimation = targetAnimation;
            this.animationTime = 0;
        }
    }
    // Utility function for transitioning an enemy to a certain target animation smoothly.
    // Causes an enemy to run through a sequence of unique animations if called every update.
    // If the enemy is currently using one of the animations, it will start at that point,
    // otherwise it will immediately change to the initial animation.
    // Returns true when the enemy reaches the final animation key.
    runAnimationSequence(animationKeys: string[]): boolean {
        const index = animationKeys.indexOf(this.currentAnimationKey);
        if (index < 0) {
            // Start the animation sequence from the beginning.
            this.changeToAnimation(animationKeys[0], animationKeys[1]);
            return false;
        } else if (index === animationKeys.length - 1) {
            // The final animation has been reached.
            return true;
        }
        // Continue on with the current animation and transition to the next when it completes.
        this.changeToAnimation(animationKeys[index], animationKeys[index + 1]);
        return false;
    }
    setAnimation(type: string, d: Direction, time: number = 0, nextAnimationKey?: string) {
        this.currentAnimationKey = type;
        this.nextAnimationKey = nextAnimationKey;
        const animationSet = this.animations[type] || this.animations.idle;
        // Fallback to the first defined direction if the current direction isn't defined.
        this.currentAnimation = animationSet[d] || Object.values(animationSet)[0];
        if (!this.currentAnimation) {
            console.error(`No animation found for ${type} ${this.d}`, this.animations);
            debugger;
        }
        this.animationTime = time;
    }
    setMode(mode: string) {
        this.mode = mode;
        // Setting it this way means that `modeTime` will be 0 during the next update loop,
        // since we increment modeTime by FRAME_LENGTH between each update.
        this.modeTime = -FRAME_LENGTH;
    }
    knockBack(state: GameState, {vx = 0, vy = 0, vz = 0}: {vx: number, vy: number, vz: number}, force = false) {
        if (!this.canBeKnockedBack && !force) {
            return;
        }
        // Interrupt any abilities underway if this was a normal knockback.
        if (this.canBeKnockedBack) {
            this.activeAbility = null;
        }
        if (!this.enemyDefinition.hasCustomHurtAnimation) {
            this.changeToAnimation('hurt');
        }
        this.action = 'knocked';
        if (vz > 0 || this.z > 0) {
            this.isAirborn = true;
        }
        this.animationTime = 0;
        this.az = Math.min(-0.2, this.az);
        this.vx = vx;
        this.vy = vy;
        this.vz = vz;
    }
    onHit(state: GameState, hit: HitProperties): HitResult {
        if (this.status === 'gone' || this.status === 'hidden'
            || this.mode === 'hidden' || this.isDefeated || this.life <= 0
        ) {
            return {};
        }
        if (this.enemyDefinition.onHit) {
            return this.enemyDefinition.onHit(state, this, hit);
        }
        return this.defaultOnHit(state, hit);
    }
    updateDrawPriority() {
        this.drawPriority = this.flying ? 'foreground' : (this.enemyDefinition.drawPriority || 'sprites');
    }
    playBlockSound(state: GameState) {
        if (this.blockInvulnerableFrames) {
            return;
        }
        this.makeSound(state,'blockAttack');
        this.blockInvulnerableFrames = 30;
    }
    defaultBlockHit(state: GameState, hit: HitProperties, stopped = false): HitResult {
        this.playBlockSound(state);
        return {
            hit: true,
            blocked: true,
            stopped,
            knockback: hit.knockback ? {vx: -hit.knockback.vx, vy: -hit.knockback.vy, vz: 0 } : null
        };
    }
    defaultOnHit(state: GameState, hit: HitProperties): HitResult {
        if (this.status === 'off') {
            if (hit.element === 'lightning') {
                this.status = 'normal';
                this.behaviors = {
                    ...(this.enemyDefinition.tileBehaviors || {}),
                };
                this.flying = this.enemyDefinition.flying;
                this.isAirborn = this.flying || this.enemyDefinition.floating || this.z > 0;
                this.updateDrawPriority();
                return {
                    hit: true,
                    blocked: true,
                    stopped: true,
                    debug: 'lightning hit an "off" enemy'
                };
            }
            return {
                debug: 'enemy is "off"',
                blocked: true,
                stopped: true,
            };
        }
        if (this.life <= 0 || this.status === 'gone' || this.enemyInvulnerableFrames || this.isInvulnerable) {
            return {};
        }
        // Ignore attacks that this enemy is immune to.
        if (this.enemyDefinition.immunities?.includes(hit.element)) {
            return {debug: 'enemy is immune to ' + hit.element};
        }
        if (this.shielded && !(hit.isThrownObject && hit.damage > 1)) {
            // Thrown objects with more than 1 damage still do half damage through shields.
            if (hit.isThrownObject && hit.damage > 1) {
                hit = {...hit, damage: Math.ceil(hit.damage / 2)};
            } else {
                return this.defaultBlockHit(state, hit);
            }
        }
        if (hit.knockback) {
            this.knockBack(state, hit.knockback);
        } else if (hit.knockAwayFrom) {
            const hitbox = this.getHitbox();
            const dx = (hitbox.x + hitbox.w / 2) - hit.knockAwayFrom.x;
            const dy = (hitbox.y + hitbox.h / 2) - hit.knockAwayFrom.y;
            const mag = Math.sqrt(dx * dx + dy * dy);
            if (mag) {
                this.knockBack(state, {vx: 4 * dx / mag, vy: 4 * dy / mag, vz: 0});
            }
        }
        let damageDealt = 0;
        if (hit.damage) {
            const multiplier = this.enemyDefinition.elementalMultipliers?.[hit.element] || 1;
            damageDealt = multiplier * hit.damage;
            this.applyDamage(state, damageDealt, 'enemyHit', hit.element === 'lightning' ? 0.5 : 1);
            if (hit.element === 'fire') {
                this.applyBurn(hit.damage, 2000);
            }
            if (this.currentAnimationKey === 'idle' && !this.enemyDefinition.hasCustomHurtAnimation) {
                this.changeToAnimation('hurt', this.currentAnimationKey);
            }
        }
        // Hitting frozen enemies unfreezes them.
        if (this.frozenDuration > 0) {
            this.frozenDuration = 0;
            // Record the enemy as frozen if they were defeated by this hit.
            this.frozenAtDeath = !this.isImmortal && this.life <= 0;
        } else if (hit.element === 'ice' && !this.isBoss && this.enemyDefinition.canBeFrozen !== false) {
            this.burnDuration = 0;
            // Do not freeze the enemy unless they will actually stay frozen for some duration:
            // They are immortal or have life left, or they are dying but airborn.
            if (this.isImmortal || this.life > 0 || this.z > 0 || this.vz > 0) {
                this.makeSound(state, 'freeze');
                this.frozenDuration = 1500;
                // Freeze the enemy in place if they are touching the ground.
                if (this.z <= 0 && this.vz <= 0) {
                    this.vx = this.vy = 0;
                }
                if (this.enemyDefinition.onFreeze) {
                    this.enemyDefinition.onFreeze(state, this);
                }
            } else if (this.enemyDefinition.canBeFrozen) {
                this.frozenAtDeath = true;
            }
        }
        return {
            damageDealt,
            hit: true,
            destroyed: this.life <= 0 && !this.isImmortal,
            knockback: hit.knockback ? {vx: -hit.knockback.vx, vy: -hit.knockback.vy, vz: 0 } : null,
            pierced: hit.isPiercing,
        };
    }
    applyDamage(state: GameState, damage: number, damageSound: string = 'enemyHit', iframeMultiplier = 1) {
        if (this.life <= 0) {
            return;
        }
        damage *= gameModifiers.globalDamageDealt;
        trackEnemyTookDamage(this, damage);
        this.life = Math.max(0, this.life - damage);
        // This is actually the number of frames the enemy cannot damage the hero for.
        this.invulnerableFrames = this.enemyDefinition.invulnerableFrames ?? 50;
        this.enemyInvulnerableFrames = (iframeMultiplier * 20) | 0;
        if (!this.checkIfDefeated(state)) {
            this.makeSound(state, damageSound);
        }
        if (this.area !== state.areaInstance) {
            if (this.isDefeated && !this.isBoss) {
                addEffectToArea(state, state.areaInstance, new FieldAnimationEffect({
                    animation: enemyDeathAnimation,
                    x: this.x,
                    y: this.y,
                    scale: this.scale,
                    alpha: 0.3,
                    ttl: 200,
                }));
            }
        }
        return true;
    }
    checkIfDefeated(state: GameState) {
        if (this.life <= 0 && !this.isImmortal && this.action !== 'knocked') {
            this.showDeathAnimation(state);
            return true;
        }
        return false;
    }
    applyBurn(burnDamage: number, burnDuration: number) {
        if (burnDuration * burnDamage >= this.burnDuration * this.burnDamage) {
            this.burnDuration = burnDuration;
            this.burnDamage = burnDamage;
        }
        // Burns unfreeze the enemy.
        this.frozenDuration = 0;
    }
    showDeathAnimation(state: GameState) {
        if (this.status === 'gone' || this.isDefeated) {
            return;
        }
        this.isDefeated = true;
        this.setMode('defeated');
        if (this.isBoss) {
            const bossDefinition = this.definition;
            if (this.enemyDefinition.onDeath) {
                this.enemyDefinition.onDeath(state, this);
            }
            // Immediately kill other enemies and remove enemy attack effects when the boss is defeated.
            // Bosses in both material+spirit realms must be defeated before the battle is over.
            const allEnemies = [...this.area.enemies, ...this.area.alternateArea.enemies];
            if (!allEnemies.some(object => object.isBoss && object.isFromCurrentSection(state)
                    && object.status !== 'gone' && !object.isDefeated)
            ) {
                // Remove all enemy attacks from the screen when a boss is defeated.
                this.area.effects = this.area.effects.filter(effect => !effect.isEnemyAttack);
                allEnemies.filter(e => e.isFromCurrentSection(state)).forEach(object => object.showDeathAnimation(state));

                // Freeze player from taking any action for ~3 seconds during the explosion
                state.scriptEvents.queue.push({
                    type: 'wait',
                    duration: 3000,
                    blockPlayerInput: true,
                });
                appendCallback(state, (state: GameState) => {
                    for (const enemy of allEnemies) {
                        if (enemy.isBoss) {
                            enemy.status = 'gone';
                        }
                    }
                    if (bossDefinition.type === 'boss'){
                        // Do nothing if this boss was already defeated.
                        if (getObjectStatus(state, bossDefinition)) {
                            return;
                        }
                        // Make sure to save status before gaining loot since gaining loot refreshes object status.
                        saveObjectStatus(state, bossDefinition);
                        // Gain loot if any is defined.
                        if (bossDefinition.lootType && bossDefinition.lootType !== 'empty') {
                            getLoot(state, bossDefinition);
                        } else {
                            state.areaInstance.needsLogicRefresh = true;
                        }
                    }
                });
            }
            // Show the boss death animation.
            this.setAnimation('death', this.d);
            return;
        }
        const hitbox = this.getHitbox();
        this.addNormalDeathEffect(state, hitbox);
        if (this.enemyDefinition.lootTable) {
            dropItemFromTable(state, this.area, this.enemyDefinition.lootTable,
                hitbox.x + hitbox.w / 2,
                hitbox.y + hitbox.h / 2
            );
        }
        if (this.enemyDefinition.onDeath) {
            this.enemyDefinition.onDeath(state, this);
        }
        this.status = 'gone';
        if (this.definition.id) {
            saveObjectStatus(state, this.definition);
        }
    }
    addNormalDeathEffect(state: GameState, hitbox = this.getHitbox()) {
        const deathAnimation = new FieldAnimationEffect({
            animation: enemyDeathAnimation,
            x: hitbox.x + hitbox.w / 2 - enemyDeathAnimation.frames[0].w / 2 * this.scale,
            // +1 to make sure the explosion appears in front of enemies the frame they die.
            y: hitbox.y + hitbox.h / 2 - enemyDeathAnimation.frames[0].h / 2 * this.scale + 1,
            scale: this.scale,
        });
        if (this.action === 'knocked') {
            deathAnimation.vx = this.vx;
            deathAnimation.vy = this.vy;
            deathAnimation.friction = 0.1;
        }
        addEffectToArea(state, this.area, deathAnimation);
        this.makeSound(state, 'enemyDeath');
    }
    addBossDeathEffect(state: GameState, hitbox = this.getHitbox()) {
        const animation = bossDeathExplosionAnimation;
        const explosionAnimation = new FieldAnimationEffect({
            animation,
            drawPriority: 'foreground',
            x: hitbox.x + Math.random() * hitbox.w - animation.frames[0].w / 2,
            y: hitbox.y + Math.random() * hitbox.h - animation.frames[0].h / 2,
        });
        // Always show the explosion in the player's instance so that the animation
        // is always visible.
        addEffectToArea(state, state.areaInstance, explosionAnimation);
        playAreaSound(state, state.areaInstance, 'enemyDeath');
    }
    shouldReset(state: GameState) {
        return true;
    }
    shouldRespawn(state: GameState) {
        return this.alwaysReset;
    }
    // Randomize abilities and use the first one that is valid.
    // Does not cancel active abilities.
    useRandomAbility(state: GameState) {
        if (this.activeAbility) {
            return;
        }
        for (const ability of Random.shuffle(this.abilities)) {
            if (this.tryUsingAbility(state, ability.definition)) {
                return;
            }
        }
    }
    getAbility(definition: EnemyAbility<any>): EnemyAbilityWithCharges {
        return this.abilities.find(a => a.definition === definition);
    }
    tryUsingAbility(state: GameState, definition: EnemyAbility<any>): boolean {
        if (this.activeAbility) {
            if (this.activeAbility.definition.cannotBeCanceled || !definition.cancelsOtherAbilities) {
                return false;
            }
        }
        const ability = this.abilities.find(a => a.definition === definition);
        if (!ability || !(ability.charges > 0)) {
            return false;
        }
        if (ability.definition.isEnabled?.(state, this) === false) {
            return false;
        }
        const target = ability.definition.getTarget(state, this);
        if (!target) {
            return false;
        }
        this.useAbility(state, ability, target);
        return true;
    }
    useAbility(state: GameState, ability: EnemyAbilityWithCharges, target: any) {
        ability.charges--;
        this.activeAbility = {
            definition: ability.definition,
            target,
            time: 0,
        };
        ability.definition.prepareAbility?.(state, this, target);
        if ((ability.definition.prepTime || 0) <= 0) {
            ability.definition.useAbility?.(state, this, target);
            this.activeAbility.used = true;
            if ((ability.definition.recoverTime || 0) <= 0) {
                this.activeAbility = null;
                this.changeToAnimation('idle');
            }
        }
    }
    // Use a taunt from the list of given taunt keys if possible and applies a global cooldown
    // to all taunts on the list based on the cooldown of the selected taunt.
    useTauntFromList(state: GameState, tauntKeys: string[], shuffle = true): string|undefined {
        let usedTaunt: string|undefined;
        for (const tauntKey of (shuffle ? Random.shuffle(tauntKeys) : tauntKeys)) {
            if(this.useTaunt(state, tauntKey)) {
                usedTaunt = tauntKey;
                break;
            }
        }
        if (!usedTaunt) {
            return;
        }
        const baseCooldown = this.taunts[usedTaunt].definition.cooldown || 3000;
        for (const tauntKey of tauntKeys) {
            const tauntInstance = this.taunts[tauntKey];
            if (tauntInstance) {
                tauntInstance.cooldown = Math.max(tauntInstance.cooldown, baseCooldown);
            }
        }
        // The cooldown for the selected taunt is set high enough that it won't be selected again
        // until other taunts are used if they run continuously.
        const tauntInstance = this.taunts[usedTaunt];
        tauntInstance.cooldown = Math.max(tauntInstance.cooldown, baseCooldown * tauntKeys.length);
        return usedTaunt;
    }
    useTaunt(state: GameState, tauntKey: string): boolean {
        const tauntInstance = this.taunts[tauntKey];
        if (!tauntInstance) {
            console.error('Missing taunt ', tauntKey);
            return false;
        }
        const definition = tauntInstance.definition;
        if (tauntInstance.cooldown || tauntInstance.timesUsed >= definition.limit) {
            return false;
        }
        if (addTextCue(state, definition.text, definition.duration, definition.priority)) {
            tauntInstance.cooldown = definition.cooldown || 3000;
            tauntInstance.timesUsed++;
            return true;
        }
        return false;
    }
    update(state: GameState) {
        if (this.status === 'gone') {
            return;
        }
        if (!this.alwaysUpdate && !this.isFromCurrentSection(state)) {
            return;
        }
        this.time += FRAME_LENGTH;
        if (this.invulnerableFrames > 0) {
            this.invulnerableFrames--;
        }
        if (this.enemyInvulnerableFrames > 0) {
            this.enemyInvulnerableFrames--;
        }
        if (this.blockInvulnerableFrames > 0) {
            this.blockInvulnerableFrames--;
        }
        // Unfreeze defeated enemies, otherwise their death animation may be delayed
        // until they are unfrozen.
        if (!this.isImmortal && this.frozenDuration > 0 && this.life <= 0 && this.z <= 0) {
            this.frozenDuration = 0;
            this.frozenAtDeath = true;
        }
        if (this.frozenDuration > 0) {
            this.frozenDuration -= FRAME_LENGTH;
            if (Math.abs(this.vx) > 0.1 || Math.abs(this.vy) > 0.1) {
                moveEnemy(state, this, this.vx, this.vy, {canFall: true, canSwim: true});
            }
            if (this.z > 0) {
                this.z = Math.max(0, this.z + this.vz);
                this.vz = Math.max(-8, this.vz + this.az);
                // Enemy can take 1-2 fall damage while frozen if it lands hard enough.
                if (this.z <= 0) {
                    this.isAirborn = false;
                }
                if (this.z === 0 && this.vz <= -5) {
                    this.applyDamage(state, (this.vz / -4) | 0);
                    this.frozenDuration = 0;
                }
            }
            // Slowly slide to a stop
            this.vx *= 0.95;
            this.vy *= 0.95;
            return;
        }
        if (this.burnDuration > 0) {
            this.burnDuration -= FRAME_LENGTH;
            this.life = Math.max(0, this.life - this.burnDamage * FRAME_LENGTH / 1000);
            if (this.checkIfDefeated(state)) {
                // End ths burn when the enemy is defeated.
                this.burnDuration = 0;
            }
            if (this.burnDuration % 40 === 0) {
                const hitbox = this.getHitbox();
                addSparkleAnimation(state, this.area, pad(hitbox, -4), { element: 'fire' });
            }
        }
        for (const tauntKey in this.taunts ?? []) {
            const tauntInstance = this.taunts[tauntKey];
            if (tauntInstance.cooldown > 0) {
                tauntInstance.cooldown -= FRAME_LENGTH;
            }
        }
        // Only time counter advances for enemies that are off.
        // This status is only meant to apply to machines.
        if (this.status === 'off') {
            this.behaviors = {solid: true};
            this.flying = false;
            this.updateDrawPriority();
            if (this.z > 0) {
                this.z = Math.max(0, this.z + this.vz);
                if (this.z <= 0) {
                    this.isAirborn = false;
                }
                this.vz = Math.max(-8, this.vz + this.az);
            }
            return;
        }
        this.modeTime += FRAME_LENGTH;
        this.animationTime += FRAME_LENGTH;
        // Switch to the next animation if we reach the end of the current animation.
        if (this.nextAnimationKey && this.animationTime >= this.currentAnimation.duration) {
            this.changeToAnimation(this.nextAnimationKey);
        }
        for (const ability of this.abilities) {
            // Abilities don't gain charges while in use.
            if (this.activeAbility?.definition === ability.definition) {
                continue;
            }
            if (ability.charges < (ability.definition.charges || 1)) {
                ability.cooldown -= FRAME_LENGTH;
                if (ability.cooldown <= 0) {
                    ability.cooldown = (ability.definition.cooldown || 0)
                    ability.charges += (ability.definition.chargesRecovered || 1);
                    ability.charges = Math.min(ability.charges, ability.definition.charges || 1);
                }
            }
        }
        if (this.activeAbility) {
            this.activeAbility.time += FRAME_LENGTH;
            // Actually use the ability once the prepTime has passed.
            if (!this.activeAbility.used && this.activeAbility.time >= (this.activeAbility.definition.prepTime || 0)) {
                this.activeAbility.definition.useAbility?.(state, this, this.activeAbility.target);
                this.activeAbility.used = true;
            } else if (!this.activeAbility.used && this.activeAbility.definition.updateAbility) {
                if (this.activeAbility.definition.updateAbility(state, this, this.activeAbility.target) === false) {
                    this.activeAbility = null;
                    this.changeToAnimation('idle');
                }
            }
            if (this.activeAbility && this.activeAbility.time >= (this.activeAbility.definition.prepTime || 0) + (this.activeAbility.definition.recoverTime || 0)) {
                this.activeAbility = null;
                this.changeToAnimation('idle');
            }

        }
        if (this.isDefeated) {
            if (this.animationTime <= 2800 &&
                (this.animationTime % 300 === 0 || this.animationTime % 500 === 0)
            ) {
                this.addBossDeathEffect(state);
            }
            if (this.animationTime >= 2800) {
                this.status = 'gone';
            }
            return;
        } else {
            this.checkIfDefeated(state);
        }
        const minZ = this.canBeKnockedDown ? 0 : (this.flying ? 12 : 0);
        if (this.action === 'knocked') {
            this.vz = Math.max(-8, this.vz + this.az);
            this.z += this.vz;
            moveEnemy(state, this, this.vx, this.vy, {canFall: true, canSwim: true});
            if (this.z <= minZ) {
                this.z = minZ;
            }
            if (this.z <= 0) {
                this.isAirborn = this.flying || this.enemyDefinition.floating || false;
            }
            this.animationTime += FRAME_LENGTH;
            if (this.animationTime >= 200 && this.z <= minZ) {
                this.action = null;
                this.changeToAnimation('idle');
                this.animationTime = 0;
                this.checkIfDefeated(state);
            }
            // Normally enemies do not update when knocked. But forced knockbacks
            // currently continue running update code on enemies like bosses that
            // can only be knocked back in special circumstances.
            if (this.canBeKnockedBack) {
                return;
            }
        } else if (
            (this.az > 0 || this.vz > 0 || this.z > minZ)
            && !this.flying && !this.enemyDefinition.floating && !this.activeAbility
        ) {
            this.vz = Math.max(-8, this.vz + this.az);
            this.z += this.vz;
            if (this.z <= minZ) {
                this.z = minZ;
            }
            if (this.z <= 0) {
                this.isAirborn = this.flying || this.enemyDefinition.floating || false;
            }
            this.animationTime += FRAME_LENGTH;
        }
        if (this.flying) {
            if (this.enemyDefinition.updateFlyingZ) {
                this.enemyDefinition.updateFlyingZ(state, this);
            } else if (this.z < 12) {
                this.z = Math.min(12, this.z + 2);
                return;
            } else if (this.z > 12) {
                this.z = Math.max(12, this.z - 2);
            }
        }
        this.healthBarTime += FRAME_LENGTH;
        if (this.enemyDefinition.update) {
            this.enemyDefinition.update(state, this);
        }
        // Checks if the enemy fell into a pit, for example
        checkForFloorEffects(state, this);
        // Break brittle tiles under the enemy.
        if (this.z <= 0) {
            breakBrittleTilesInRect(state, this.area, pad(this.getMovementHitbox(), -4));
        }
        if (this.enemyDefinition.afterUpdate) {
            this.enemyDefinition.afterUpdate(state, this);
        }
    }
    getHealthPercent(state: GameState): number {
        if (this.enemyDefinition.getHealthPercent) {
            return this.enemyDefinition.getHealthPercent(state, this);
        }
        return this.life / this.maxLife;
    }
    getShieldPercent(state: GameState): number {
        if (this.enemyDefinition.getShieldPercent) {
            return this.enemyDefinition.getShieldPercent(state, this);
        }
        return this.shielded ? 1 : 0;
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        if (!this.area || this.status === 'gone' || this.status === 'hidden' || this.mode === 'hidden') {
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
        if (this.frozenDuration > 0) {
            const p = Math.ceil(Math.min(3, this.frozenDuration / 200)) / 4;
            this.renderFrozenEffect(context, p);
        }
    }
    renderFrozenEffect(context: CanvasRenderingContext2D, p: number) {
        const frame = getFrame(iceFrontAnimation, this.frozenDuration);
        context.save();
            context.globalAlpha *= (0.3 + 0.7 * p);
            const hitbox = this.getHitbox();
            const targetWidth = 2 * p + hitbox.w;
            const targetHeight = 2 * p + hitbox.h;
            const scale = Math.round(Math.max(1, targetWidth / 24, targetHeight / 24) * 2) / 2;
            // Note enemy hitbox already incorporates the z value into the y value of the hitbox.
            drawFrame(context, frame, {
                x: hitbox.x - (frame.w * scale - hitbox.w) / 2,
                y: hitbox.y + hitbox.h - frame.h * scale + 6 * scale,
                w: frame.w * scale,
                h: frame.h * scale,
            });
        context.restore();
    }
    alternateRender(context: CanvasRenderingContext2D, state: GameState) {
        if (this.enemyDefinition.alternateRender) {
            this.enemyDefinition.alternateRender(context, state, this);
        } else if (
            // Player can briefly see damaged/defeated enemies from the other world if they have
            // spirit sight or true sight.
            (state.hero.savedData.passiveTools.spiritSight || state.hero.savedData.passiveTools.trueSight)
            && (this.enemyInvulnerableFrames > 0 || this.isDefeated)
        ) {
            context.save();
                context.globalAlpha *= 0.3;
                this.render(context, state);
            context.restore();
        }
    }
    defaultRender(context: CanvasRenderingContext2D, state?: GameState, frame = this.getFrame()) {
        if (!frame) {
            console.error('Frame not found for enemy animation', this, this.currentAnimation);
            return;
        }
        context.save();
            if (this.invulnerableFrames) {
                context.globalAlpha *= (0.7 + 0.3 * Math.cos(2 * Math.PI * this.time / 150));
            }
            if ((this.d === 'right' && this.enemyDefinition.flipRight)
                || (this.d === 'left' && this.enemyDefinition.flipLeft)
            ) {
                // Draw the frame reflected horizontally if we only have a left or a right frame.
                if (frame.anchor) {
                    context.translate((this.x | 0), 0);
                    context.scale(-1, 1);
                    drawFrame(context, frame, { ...frame,
                        x: - (frame.anchor.x) * this.scale,
                        y: this.y - frame.anchor.y * this.scale - this.z,
                        w: frame.w * this.scale,
                        h: frame.h * this.scale,
                    });
                } else {
                    const w = frame.content?.w ?? frame.w;
                    context.translate((this.x | 0) + (w / 2) * this.scale, 0);
                    context.scale(-1, 1);
                    drawFrame(context, frame, { ...frame,
                        x: - (w / 2 + (frame.content?.x || 0)) * this.scale,
                        y: this.y - (frame.content?.y || 0) * this.scale - this.z,
                        w: frame.w * this.scale,
                        h: frame.h * this.scale,
                    });
                    /*
                    // Draw a red dot where we are flipping
                    context.fillStyle = 'red';
                    context.fillRect( -1, this.y, 2, frame.content?.h || frame.h);
                    */
                }
            } else if (this.rotation) {
                // Rotate the frame about a point.
                // TODO: Support frames with anchor points and rotate around the anchor point instead of the center.
                const w = frame.content?.w ?? frame.w;
                const h = frame.content?.h ?? frame.h;
                context.translate((this.x | 0) + (w / 2) * this.scale, (this.y | 0) + (h / 2) * this.scale - this.z);
                context.rotate(this.rotation);
                drawFrame(context, frame, { ...frame,
                    x: - (w / 2 + (frame.content?.x || 0)) * this.scale,
                    y: - (h / 2 + (frame.content?.y || 0)) * this.scale,
                    w: frame.w * this.scale,
                    h: frame.h * this.scale,
                });
                /*
                // Draw a red dot where we are flipping
                context.fillStyle = 'red';
                context.fillRect( -1, this.y, 2, frame.content?.h || frame.h);
                */
            } else {
                // Draw the frame so that the anchor point coincides with the enemy position.
                const anchor = frame.anchor ?? frame.content ?? {x: 0, y: 0};
                drawFrame(context, frame, { ...frame,
                    x: this.x - anchor.x * this.scale,
                    y: this.y - anchor.y * this.scale - this.z,
                    w: frame.w * this.scale,
                    h: frame.h * this.scale,
                });
            }
        context.restore();
        if (editingState.showHitboxes) {
            context.save();
                const hitbox = this.getTouchHitbox();
                context.globalAlpha *= 0.5;
                context.fillStyle = 'red';
                context.fillRect(hitbox.x, hitbox.y, hitbox.w, hitbox.h);
            context.restore();
            context.save();
                context.fillStyle = 'blue';
                context.fillRect(this.x - 1, this.y - this.z - 1, 2, 2);
            context.restore();
        }
    }
    renderUsingAnimationSet(context: CanvasRenderingContext2D, state: GameState, actorAnimations: ActorAnimations) {
        // This only works if golemHandHurtAnimations parallels the `golemHandAnimations`
        // that the base golem hand uses to render.
        const animationType = actorAnimations[this.currentAnimationKey]
        if (!animationType) {
            debugger;
            console.error('Missing animation type', this.currentAnimationKey, actorAnimations);
            return;
        }
        const animation = animationType[this.d];
        if (!animation) {
            debugger;
            console.error('Missing golemHandHurtAnimations animation direction', this.currentAnimationKey, this.d);
            return;
        }
        const frame = getFrame(animation, this.animationTime);
        this.defaultRender(context, state, frame);
    }
    renderShadow(context: CanvasRenderingContext2D, state: GameState) {
        if (this.enemyDefinition.renderShadow) {
            this.enemyDefinition.renderShadow(context, state, this);
        } else {
            this.defaultRenderShadow(context, state);
        }
    }
    defaultRenderShadow(context: CanvasRenderingContext2D, state: GameState) {
        if (this.hasShadow && this.status !== 'gone' && this.status !== 'hidden' && this.mode !== 'hidden') {
            renderEnemyShadow(context, state, this);
        }
    }
    renderPreview(context: CanvasRenderingContext2D, target?: Rect): void {
        if (this.enemyDefinition.renderPreview) {
            this.enemyDefinition.renderPreview(context, this, target);
        } else if (target) {
            this.defaultRenderPreview(context, target);
        } else {
            this.defaultRender(context);
        }
    }
    defaultRenderPreview(context: CanvasRenderingContext2D, target?: Rect, hitbox = this.getHitbox()): void {
        if (!target) {
            this.defaultRender(context);
            return;
        }
        context.save();
            const scale = Math.min(1, Math.min(target.w / hitbox.w, target.h / hitbox.h));
            context.translate(
                target.x + (target.w - hitbox.w * scale) / 2,
                target.y + (target.h - hitbox.h * scale) / 2,
            );
            if (scale < 1) {
                context.scale(scale, scale);
            }
            this.x = this.y = 0;
            this.defaultRender(context);
        context.restore();
    }
    makeSound(state: GameState, soundKey: string) {
        playAreaSound(state, this.area, soundKey);
    }
    // Update the scale of the enemy without moving the center of its feet.
    changeScale(scale: number): void {
        if (scale === this.scale) {
            return;
        }
        let hitbox = this.getHitbox();
        const cx = hitbox.x + hitbox.w / 2, by = hitbox.y + hitbox.h;
        this.scale = scale;
        hitbox = this.getHitbox();
        this.x += (cx - hitbox.x - hitbox.w / 2);
        this.y += (by - hitbox.y - hitbox.h);
    }
    cancelAttacks(state: GameState) {
        if (this.activeAbility) {
            delete this.activeAbility;
        }
        for (const effect of [...state.areaInstance.effects, ...state.areaInstance.alternateArea.effects]) {
            if (effect.source === this) {
                removeEffectFromArea(state, effect);
            }
        }
    }
}
objectHash.enemy = Enemy;
objectHash.boss = Enemy;

class _Enemy<T> extends Enemy<T> {}
declare global {
    export interface Enemy<T=any> extends _Enemy<T> {}
}
