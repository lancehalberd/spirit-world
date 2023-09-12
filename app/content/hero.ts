import { FieldAnimationEffect } from 'app/content/effects/animationEffect';
import { BarrierBurstEffect } from 'app/content/effects/barrierBurstEffect';
import { Staff } from 'app/content/objects/staff';
import { getChargedArrowAnimation } from 'app/content/effects/arrow';
import { ThrownObject } from 'app/content/effects/thrownObject';
import { FRAME_LENGTH } from 'app/gameConstants';
import {
    arrowAnimations, bowAnimations, cloakAnimations,
    chargeBackAnimation, chargeFrontAnimation,
    chargeFireBackAnimation, chargeFireFrontAnimation,
    chargeIceBackAnimation, chargeIceFrontAnimation,
    chargeLightningBackAnimation, chargeLightningFrontAnimation,
    cloudPoofAnimation,
    goldBowAnimations,
    heroAnimations,
    staffAnimations,
} from 'app/render/heroAnimations';
import {
    getHeroFrame, renderCarriedTile,
    renderExplosionRing, renderHeroBarrier,
    spiritBarrierBreakingAnimation,
} from 'app/renderActor';
import { drawFrameAt, getFrame } from 'app/utils/animations';
import { destroyClone } from 'app/utils/destroyClone';
import { addEffectToArea } from 'app/utils/effects';
import { directionMap, getDirection } from 'app/utils/field';
import { getChargeLevelAndElement, getElement } from 'app/utils/getChargeLevelAndElement';
import { boxesIntersect } from 'app/utils/index';

const throwSpeed = 6;

export class Hero implements Actor {
    isAstralProjection = false;
    isClone = false;
    isAllyTarget = true;
    isObject = <const>true;
    canPressSwitches = true;
    // These aren't used by the Hero itself since it has special handling,
    // but these are used on objects that inherit from hero: AstralProjection and Clone.
    getDrawPriority(state: GameState): DrawPriority {
        if (this.action === 'falling') {
            return 'background';
        }
        return 'sprites';
    }
    // This is only used when falling. The hero should be drawn on top of default background elements
    // like pits, but underneath high background elements like moving platforms.
    drawPriorityIndex = 1;
    x: number = 0;
    y: number = 0;
    z: number = 0;
    area: AreaInstance;
    w: number = 16;
    h: number = 16;
    vx: number = 0;
    vy: number = 0;
    vz: number = 0;
    groundHeight = 0;
    d: Direction = 'down';
    action?: Action;
    actionDx?: number;
    actionDy?: number;
    actionFrame?: number = 0;
    actionTarget?: any;
    animationTime: number = 0;
    attackBufferTime: number = 0;
    // like being knocked but doesn't stop MC charge or other actions.
    bounce?: {vx: number; vy: number; frames: number};
    equippedBoots: Equipment = 'leatherBoots';
    hasBarrier?: boolean = false;
    isInvisible?: boolean = false;
    isAirborn = false;
    jumpingVx?: number;
    jumpingVy?: number;
    jumpingVz?: number;
    jumpingDownY?: number;
    // If this is set; the actor is being carried by a hero/clone.
    carrier?: Hero;
    explosionTime?: number;
    pickUpFrame?: number;
    pickUpObject?: ObjectInstance;
    pickUpTile?: FullTile;
    grabTile?: TileCoords;
    grabObject?: ObjectInstance;
    lastTouchedObject?: EffectInstance | ObjectInstance;
    invulnerableFrames?: number;
    life: number;
    ironSkinLife: number = 0;
    ironSkinCooldown: number = 500;
    wading?: boolean;
    slipping?: boolean;
    swimming?: boolean;
    floating?: boolean;
    sinking?: boolean;
    inAirBubbles?: boolean;
    frozenDuration?: number;
    burnDamage?: number = 0;
    burnDuration?: number = 0;
    isRunning?: boolean;
    isUsingDoor?: boolean;
    isExitingDoor?: boolean;
    isControlledByObject?: boolean;
    isTouchingPit?: boolean;
    isOverPit?: boolean;
    isOverClouds?: boolean;
    canFloat?: boolean;
    // stats
    magic: number = 0;
    // base: 20, max: 100, roll: 5, charge: 10, double-charge: 50
    maxMagic: number = 0;
    // base 4, max 8-10 (target mana regen rate)
    magicRegen: number = 0;
    // This is the actual mana regen rate, which changes depending on circumstances and can even become negative.
    actualMagicRegen: number = 0;
    // Until this reaches zero, magic will not regenerate.
    magicRegenCooldown: number = 0;
    // This is the maximum value magic regen cooldown can reach. It is reduced by certain items.
    magicRegenCooldownLimit: number = 4000;
    lightRadius: number = 20;
    rollCooldown: number = 0;
    toolCooldown: number = 0;
    // Used to render the bow after firing it.
    toolOnCooldown?: ActiveTool;
    // inventory
    astralProjection?: Hero;
    clones: Hero[];
    cloneToolReleased?: boolean
    barrierElement?: MagicElement;
    barrierLevel?: number;
    safeD: Direction;
    safeX: number;
    safeY: number;
    // This gets set when the player respawns at a location and is currently used
    // to disable teleporters that they respawn on top of.
    justRespawned: boolean;
    chargingLeftTool?: boolean;
    chargingRightTool?: boolean;
    chargingHeldObject?: boolean;
    chargeTime?: number = 0;
    spiritRadius: number = 0;
    status: ObjectStatus = 'normal';

    // Heroes have special handling for pits and shouldn't use the object pit logic.
    ignorePits = true;
    // Clones that are automatically blowing up are marked with this flag.
    isUncontrollable = false;
    // Clone that you can no longer swap to is marked with this flag.layers
    cannotSwapTo = false;

    heldChakram?: HeldChakram;
    thrownChakrams: ThrownChakram[] = [];
    activeStaff?: Staff;
    activeBarrierBurst?: BarrierBurstEffect;
    // This is set if the player attempts to use the staff tool while it is in use
    // and prevents it from being placed. This is useful for attacking quickly.
    canceledStaffPlacement?: boolean;

    savedData: SavedHeroData;

    constructor() {
        this.clones = [];
        this.equippedBoots = 'leatherBoots';
    }

    applySavedHeroData(defaultSavedHeroData: SavedHeroData, savedHeroData?: SavedHeroData) {
        this.savedData = {...defaultSavedHeroData};
        if (savedHeroData) {
            for (let i in savedHeroData) {
                this.savedData[i] = savedHeroData[i];
            }
        }
        this.savedData.passiveTools = {
            ...defaultSavedHeroData.passiveTools,
            ...savedHeroData?.passiveTools,
        };
        this.savedData.activeTools = {
            ...defaultSavedHeroData.activeTools,
            ...savedHeroData?.activeTools,
        };
        this.savedData.elements = {
            ...defaultSavedHeroData.elements,
            ...savedHeroData?.elements,
        };
        this.savedData.equipment = {
            ...defaultSavedHeroData.equipment,
            ...savedHeroData?.equipment,
        };
        this.savedData.weaponUpgrades = {
            ...defaultSavedHeroData.weaponUpgrades,
            ...savedHeroData?.weaponUpgrades,
        };
        this.life = this.savedData.maxLife;
    }

    exportSavedHeroData(): SavedHeroData {
        return {
            ...this.savedData,
            weaponUpgrades: {...this.savedData.weaponUpgrades},
            spawnLocation: this.savedData.spawnLocation,
            activeTools: {...this.savedData.activeTools},
            elements: {...this.savedData.elements},
            equipment: {...this.savedData.equipment},
            passiveTools: {...this.savedData.passiveTools},
        };
    }

    getCopy(this: Hero): Hero {
        const copy = new Hero();
        for (let i in this) {
            copy[i] = this[i];
        }
        copy.savedData = this.exportSavedHeroData();
        return copy;
    }

    getHitbox(state?: GameState): Rect {
        if (this.hasBarrier) {
            const p = 4;
            return { x: this.x - p, y: this.y - p, w: this.w + 2 * p, h: this.h + 2 * p };
        }
        return { x: this.x, y: this.y, w: this.w, h: this.h };
    }
    getMovementHitbox(this: Hero, state?: GameState): Rect {
        return { x: this.x, y: this.y, w: this.w, h: this.h };
    }

    overlaps(this: Hero, target: Rect | {getHitbox: () => Rect}) {
        if ((target as any).getHitbox) {
            return boxesIntersect((target as any).getHitbox(), this.getHitbox());
        }
        return boxesIntersect(target as Rect, this.getHitbox());
    }

    onHit(this: Hero, state: GameState, hit: HitProperties): HitResult {
        if (this.life <= 0) {
            return {};
        }
        if (state.scriptEvents.blockPlayerInput) {
            return {};
        }
        if (this.action === 'getItem' || this.action === 'jumpingDown' || this.action === 'falling' || this.action === 'fallen') {
            return {};
        }
        // Most damage is ignored while the hero is using the dodge roll ability.
        if (this.action === 'roll' && !hit.canDamageRollingHero) {
            return {};
        }
        if (this.hasBarrier) {
            let iframeMultiplier = 1;
            let spiritDamage = hit.spiritCloakDamage || Math.max(10, hit.damage * 5);
            // The cloak halves incoming damage that matches its current element.
            // Note that since the base cloak tool can no longer be charged, barrier element is never set.
            if (hit.element && hit.element === this.barrierElement) {
                spiritDamage /= 2;
            }
            let reflectDamage = this.barrierLevel;
            if (!this.barrierElement) {
                reflectDamage++;
            }
            if (hit.element === 'fire') {
                // The barrier prevents burning damage entirely (normally a 2x multiplier)
                // so to balance this out the barrier takes a flat 50% more damage from fire elements.
                spiritDamage *= 1.5;
                if (state.hero.savedData.passiveTools.fireBlessing) {
                    spiritDamage /= 2;
                }
            }
            if (hit.element === 'ice' && state.hero.savedData.passiveTools.waterBlessing) {
                spiritDamage /= 2;
            }
            if (hit.element === 'lightning' && state.hero.savedData.passiveTools.lightningBlessing) {
                spiritDamage /= 2;
                iframeMultiplier *= 0.5;
            }
            // The cloak does increased extra damage and prevents all spirit damage while the cloak is being activated.
            // This rewards players for using the cloak just in time to block attacks, but may be too generous.
            if (this.toolOnCooldown === 'cloak') {
                spiritDamage = 0;
                reflectDamage++;
            }
            if (hit.damage && state.hero.invulnerableFrames <= 0) {
                state.hero.magic -= spiritDamage;
                state.hero.invulnerableFrames = Math.max(state.hero.invulnerableFrames, iframeMultiplier * 10);
                state.hero.increaseMagicRegenCooldown(1000 * spiritDamage / 20);
            }
            const hitbox = this.getHitbox(state);
            if (hit.canAlwaysKnockback && hit.knockback) {
                this.knockBack(state, hit.knockback);
            }
            return { hit: true, reflected: true,
                returnHit: {
                    damage: reflectDamage,
                    element: this.barrierElement,
                    knockAwayFrom: {
                        x: hitbox.x + hitbox.w / 2,
                        y: hitbox.y + hitbox.h / 2,
                    },
                },
            };
        }
        // Enemies have special code for handling invulnerability.
        if (this.invulnerableFrames > 0 || this.isInvisible) {
            if (!this.isInvisible && hit.knockback && hit.canAlwaysKnockback) {
                this.knockBack(state, hit.knockback);
                return { hit: true };
            }
            return {};
        }
        const preventKnockback = this.equippedBoots === 'ironBoots' || this.ironSkinLife > 0;
        if (hit.damage) {
            let damage = hit.damage;
            let iframeMultiplier = 1;
            if (hit.element === 'fire') {
                let burnDuration = 2000;
                const burnDamage = damage / 2;
                if (state.hero.savedData.passiveTools.fireBlessing) {
                    damage /= 2;
                    burnDuration /= 2;
                }
                this.applyBurn(burnDamage, burnDuration);
            }
            if (hit.element === 'ice' && state.hero.savedData.passiveTools.waterBlessing) {
                damage /= 2;
            }
            if (hit.element === 'lightning' && state.hero.savedData.passiveTools.lightningBlessing) {
                damage /= 2;
                iframeMultiplier *= 0.5;
            }
            if (state.hero.savedData.passiveTools.goldMail) {
                damage /= 2;
                iframeMultiplier *= 1.2;
            }
            this.takeDamage(state, damage, iframeMultiplier);
        }
        if (hit.knockback && (hit.canAlwaysKnockback || !preventKnockback)) {
            this.knockBack(state, hit.knockback);
        }
        // Getting hit while frozen unfreezes you.
        if (this.frozenDuration > 0) {
            this.frozenDuration = 0;
        } else if (hit.element === 'ice' && !(this.ironSkinLife > 0)) {
            // Getting hit by ice freezes you unless you have iron skin up.
            if (this.savedData.passiveTools.waterBlessing) {
                this.frozenDuration = 1000;
            } else {
                this.frozenDuration = 1500;
            }
            // ice hits remove burns.
            this.burnDuration = 0;
        }
        return { hit: true };
    }

    applyBurn(burnDamage: number, burnDuration: number) {
        if (burnDuration * burnDamage >= this.burnDuration * this.burnDamage) {
            this.burnDuration = burnDuration;
            this.burnDamage = burnDamage;
        }
        // Burns unfreeze the player.
        this.frozenDuration = 0;
    }

    burstBarrier(state: GameState) {
        if (!this.hasBarrier) {
            return;
        }
        this.hasBarrier = false;
        this.activeBarrierBurst = new BarrierBurstEffect({
            element: getElement(state, this),
            level: this.savedData.activeTools.cloak,
            source: this,
        });
        addEffectToArea(state, this.area, this.activeBarrierBurst);
    }

    shatterBarrier(state: GameState) {
        if (!this.hasBarrier) {
            return;
        }
        this.hasBarrier = false;
        const shatteredBarrier = new FieldAnimationEffect({
            animation: spiritBarrierBreakingAnimation,
            x: this.x - 7,
            y: this.y + 5,
            // This is a hack to draw the bubble up higher while using the y value to force it in front of the hero.
            z: 18,
            drawPriority: 'sprites',
        });
        addEffectToArea(state, this.area, shatteredBarrier);
    }

    knockBack(state: GameState, knockback: {vx: number; vy: number; vz: number}) {
        this.throwHeldObject(state);
        this.action = 'knocked';
        this.isAirborn = true;
        this.animationTime = 0;
        this.vx = knockback.vx;
        this.vy = knockback.vy;
        this.vz = knockback.vz || 2;
    }

    setElement(nextElement: MagicElement): void {
        if (this.savedData.element !== nextElement) {
            this.savedData.element = nextElement;
            // Reduce charge time to 500ms when switching between elements,
            // as if it takes some effort to change elements.
            this.chargeTime = Math.min(this.chargeTime, 500);
        }
    }

    takeDamage(this: Hero, state: GameState, damage: number, iframeMultiplier = 1): void {
        if (state.scriptEvents.blockPlayerInput) {
            return;
        }
        // Iron Skin is shared across all clones, so use the values from the main hero
        if (state.hero.ironSkinLife) {
            state.hero.ironSkinCooldown = 3000;
            if (state.hero.ironSkinLife > damage / 2) {
                state.hero.ironSkinLife -= damage / 2;
                // Iframes are only for the clone taking the damage.
                this.invulnerableFrames = 50 * iframeMultiplier;
                //if (state.hero.clones.filter(clone => !clone.isUncontrollable).length || this !== state.hero) {
                //    destroyClone(state, this);
                //}
                return;
            } else {
                damage -= 2 * state.hero.ironSkinLife;
                state.hero.ironSkinLife = 0;
            }
        }
        // If any controllable clones are in use,
        // any damage the hero or any clone take destroys it.
        // If there are no controllable clones, damage will only kill the
        // uncontrollably ones, never the primary clone the player is controlling.
        if (state.hero.clones.filter(clone => !clone.isUncontrollable).length
            || this !== state.hero
        ) {
            if (this !== state.hero) {
                // Clones that are not currently controlled take minimal damage.
                state.hero.life -= Math.min(damage / 2, 0.5);
                // Set iframes because a clone can take multiple tile hits in
                // a single frame otherwise.
                this.invulnerableFrames = 1;
            } else {
                state.hero.life -= damage / 2;
                state.hero.invulnerableFrames = 50 * iframeMultiplier;
                // Taking damage resets radius for spirit sight meditation.
                state.hero.spiritRadius = 0;
            }
            destroyClone(state, this);
        } else {
            // Damage applies to the hero, not the clone.
            state.hero.life -= damage / 2;
            state.hero.invulnerableFrames = 50 * iframeMultiplier;
            // Taking damage resets radius for spirit sight meditation.
            state.hero.spiritRadius = 0;
        }
    }

    renderBow(this: Hero, context: CanvasRenderingContext2D, state: GameState, bowDirection: Direction): void {
        const isChargingBow = this.toolOnCooldown !== 'bow';
        const bowAnimationTime = isChargingBow ? 0 : (200 - this.toolCooldown);
        let arrowXOffset = 8, arrowYOffset = 8;
        if (directionMap[bowDirection][0] < 0) {
            arrowXOffset -= directionMap[bowDirection][1] === 0 ? 8 : 4;
        } else if (directionMap[bowDirection][0] > 0) {
            arrowXOffset += directionMap[bowDirection][1] === 0 ? 8 : 4;
        }
        if (directionMap[bowDirection][1] < 0) {
            arrowYOffset -= directionMap[bowDirection][0] === 0 ? 8 : 4;
        } else if (directionMap[bowDirection][1] > 0) {
            arrowYOffset += directionMap[bowDirection][0] === 0 ? 8 : 4;
        }
        const animations = this.savedData.activeTools.bow >= 2 ? goldBowAnimations : bowAnimations;
        const frame = getFrame(animations[bowDirection], bowAnimationTime);
        drawFrameAt(context, frame, { x: this.x - 6, y: this.y - this.z - 11 });
        if (isChargingBow && state.hero.magic > 0) {
            const arrowFrame = getFrame(arrowAnimations[bowDirection], bowAnimationTime);
            drawFrameAt(context, arrowFrame, { x: this.x - 7 + arrowXOffset, y: this.y - this.z - 11 + arrowYOffset });
            const { chargeLevel, element } = getChargeLevelAndElement(state, this);
            const chargeAnimation = getChargedArrowAnimation(chargeLevel, element);
            if (chargeAnimation) {
                const chargeFrame = getFrame(chargeAnimation, state.time);
                let x = this.x + 5, y = this.y + 1 - this.z;
                if (directionMap[bowDirection][0] < 0) {
                    x -= directionMap[bowDirection][1] === 0 ? 15 : 8;
                } else if (directionMap[bowDirection][0] > 0) {
                    x += directionMap[bowDirection][1] === 0 ? 15 : 8;
                }
                if (directionMap[bowDirection][1] < 0) {
                    y -= directionMap[bowDirection][0] === 0 ? 15 : 8;
                } else if (directionMap[bowDirection][1] > 0) {
                    y += directionMap[bowDirection][0] === 0 ? 15 : 8;
                }

                drawFrameAt(context, chargeFrame, { x, y });
            }
        }
    }

    renderCloak(this: Hero, context: CanvasRenderingContext2D, state: GameState) {
        const cloakAnimationTime = 400 - this.toolCooldown;
        const animation = cloakAnimations[this.d];
        if (cloakAnimationTime < animation.duration) {
            const frame = getFrame(animation, cloakAnimationTime);
            drawFrameAt(context, frame, { x: this.x - 8, y: this.y - 16});
        }
    }

    renderStaff(this: Hero, context: CanvasRenderingContext2D, state: GameState, staffDirection: Direction): void {
        if (this.animationTime < staffAnimations[staffDirection].duration) {
            const frame = getFrame(staffAnimations[staffDirection], this.animationTime);
            let x = this.x - 61 + 7, y = this.y - 32 - 90 + 6;
            if (this.animationTime < heroAnimations.staffJump[staffDirection].duration) {
                y -= this.z;
            }
            drawFrameAt(context, frame, { x, y });
        }
    }

    renderForeground(this: Hero, context: CanvasRenderingContext2D, state: GameState) {
        // Start drawing the hero in the foreground when they are most of the way up a ladder.
        // This prevents them from rendering under foreground ceiling tiles at the top of ladders.
        const isClimbingLadder = (this.actionTarget?.style === 'ladderUp' || this.actionTarget?.style === 'ladderUpTall');
        if (
            (isClimbingLadder && this.y < this.actionTarget.y + 24)
            // Render hero in the foreground when they are high enough (occurs when falling into an area).
            || this.z > 24
        ) {
            this.render(context, state);
        }
    }

    renderHeroFrame(this: Hero, context: CanvasRenderingContext2D, state: GameState): Frame {
        const frame = getHeroFrame(state, this);
        context.save();
            if (this !== state.hero) {
                context.globalAlpha *= 0.5;
            } else if (this.invulnerableFrames) {
                context.globalAlpha *= (0.7 + 0.3 * Math.cos(2 * Math.PI * this.invulnerableFrames * 3 / 50));
            }
            drawFrameAt(context, frame, { x: this.x, y: this.y - this.z });
        context.restore();
        return frame;
    }

    render(this: Hero, context: CanvasRenderingContext2D, state: GameState): void {
        const hero = this;
        // 'sinkingInLava' action is currently unused, lava ground just does a lot of damage instead.
        if (hero.action === 'falling' || hero.action === 'sinkingInLava') {

            if (hero.isOverClouds) {
                if (hero.animationTime < FRAME_LENGTH * cloudPoofAnimation.frameDuration) {
                    this.renderHeroFrame(context, state);
                }
                const frame = getFrame(cloudPoofAnimation, hero.animationTime);
                drawFrameAt(context, frame, { x: this.x, y: this.y - this.z });
            } else {
                this.renderHeroFrame(context, state);
            }
            return;
        }
        if (hero.action === 'fallen' || hero.action === 'sankInLava') {
            return;
        }
        renderExplosionRing(context, state, hero);
        this.renderChargingBehind(context, state);
        if (this.isInvisible) {
            this.renderChargingFront(context, state);
            return;
        }
        const isChargingBow = (hero.chargingRightTool && hero.savedData.rightTool === 'bow')
                || (hero.chargingLeftTool && hero.savedData.leftTool === 'bow');
        const shouldDrawBow = isChargingBow || hero.toolOnCooldown === 'bow';
        const bowDirection = getDirection(hero.actionDx, hero.actionDy, true, hero.d);
        const drawBowUnderHero = bowDirection === 'up' || bowDirection === 'upleft' || bowDirection === 'upright';
        if (shouldDrawBow && drawBowUnderHero) {
            this.renderBow(context, state, bowDirection);
        }
        if (hero.action === 'usingStaff' && hero.d === 'up') {
            this.renderStaff(context, state, hero.d);
        }
        const frame = this.renderHeroFrame(context, state);
        if (this.toolOnCooldown === 'cloak') {
            this.renderCloak(context, state);
        }
        if (shouldDrawBow && !drawBowUnderHero) {
            this.renderBow(context, state, bowDirection);
        }
        if (hero.action === 'usingStaff' && hero.d !== 'up') {
            this.renderStaff(context, state, hero.d);
        }
        if (hero.pickUpTile) {
            renderCarriedTile(context, state, hero);
        }
        if (hero.hasBarrier) {
            renderHeroBarrier(context, state, hero);
        }
        if (hero.frozenDuration > 0) {
            context.save();
                context.fillStyle = 'white';
                const p = Math.round(Math.min(3, hero.frozenDuration / 200));
                context.globalAlpha *= (0.3 + 0.15 * p);
                context.fillRect(
                    Math.round(hero.x - frame.content.x - p),
                    Math.round(hero.y - hero.z - frame.content.y - p),
                    Math.round(frame.w + 2 * p),
                    Math.round(frame.h + 2 * p)
                );
            context.restore();
        }
        this.renderChargingFront(context, state);
    }

    getMaxChargeLevel(this: Hero, state: GameState): number {
        if (state.hero.savedData.elements.fire && state.hero.savedData.elements.ice && state.hero.savedData.elements.lightning) {
            return 2;
        }
        if (state.hero.savedData.elements.fire || state.hero.savedData.elements.ice || state.hero.savedData.elements.lightning) {
            return 1;
        }
        return 0;
    }

    renderChargingBehind(this: Hero, context: CanvasRenderingContext2D, state: GameState) {
        const renderCharging = state.hero.magic > 0 && this.getMaxChargeLevel(state)
            && this.action === 'charging' && this.chargeTime >= 60
        if (renderCharging) {
            const { chargeLevel, element } = getChargeLevelAndElement(state, this);
            if (chargeLevel) {
                const animation = !element
                    ? chargeBackAnimation
                    : {
                        fire: chargeFireBackAnimation,
                        ice: chargeIceBackAnimation,
                        lightning: chargeLightningBackAnimation
                    }[element];
                context.save();
                    context.globalAlpha *= 0.8;
                    const frame = getFrame(animation, this.chargeTime);
                    if (chargeLevel >= 2) {
                        drawFrameAt(context, frame, { x: this.x, y: this.y - this.z - 9 });
                    }
                    drawFrameAt(context, frame, { x: this.x, y: this.y - this.z });
                context.restore();
            }
        }
    }

    renderChargingFront(this: Hero, context: CanvasRenderingContext2D, state: GameState) {
        const renderCharging = state.hero.magic > 0 && this.getMaxChargeLevel(state)
            && this.action === 'charging' && this.chargeTime >= 60
        if (renderCharging) {
            const element = getElement(state, this);
            const animation = !element
                ? chargeFrontAnimation
                : {
                    fire: chargeFireFrontAnimation,
                    ice: chargeIceFrontAnimation,
                    lightning: chargeLightningFrontAnimation
                }[element];
            const { chargeLevel } = getChargeLevelAndElement(state, this);
            context.save();
                context.globalAlpha *= 0.8;
                const frame = getFrame(animation, this.chargeTime);
                if (chargeLevel >= 2) {
                    let frame = getFrame(animation, this.chargeTime + 100);
                    drawFrameAt(context, frame, { x: this.x, y: this.y - this.z - 6 });
                    frame = getFrame(animation, this.chargeTime + 200);
                    drawFrameAt(context, frame, { x: this.x, y: this.y - this.z - 12 });
                }
                drawFrameAt(context, frame, { x: this.x, y: this.y - this.z });
            context.restore();
        }
    }

    throwHeldObject(this: Hero, state: GameState){
        const hero = this;
        if (hero.pickUpObject) {
            // This assumes only clones can be picked up and thrown. We will have to update this if
            // we add other objects to this category.
            const clone = hero.pickUpObject as Hero;
            clone.d = hero.d;
            clone.vx = directionMap[hero.d][0] * throwSpeed;
            clone.vy = directionMap[hero.d][1] * throwSpeed;
            clone.vz = 2;
            clone.action = 'thrown';
            clone.isAirborn = true;
            clone.animationTime = 0;
            clone.carrier = null;
            hero.pickUpObject = null;
            return;
        }
        if (!hero.pickUpTile) {
            return;
        }
        hero.action = 'throwing';
        hero.actionFrame = 0;
        const tile = hero.pickUpTile;
        const behaviors = tile.behaviors;
        const thrownObject = new ThrownObject({
            frame: tile.frame,
            behaviors,
            x: hero.x,
            y: hero.y,
            vx: directionMap[hero.d][0] * throwSpeed,
            vy: directionMap[hero.d][1] * throwSpeed,
            vz: 2,
        });
        hero.lastTouchedObject = thrownObject;
        addEffectToArea(state, hero.area, thrownObject);
        if (tile.linkedTile) {
            const behaviors = tile.linkedTile.behaviors;
            const alternateThrownObject = new ThrownObject({
                frame: tile.linkedTile.frame,
                behaviors,
                x: hero.x,
                y: hero.y,
                vx: directionMap[hero.d][0] * throwSpeed,
                vy: directionMap[hero.d][1] * throwSpeed,
                vz: 2,
            });
            alternateThrownObject.linkedObject = thrownObject;
            thrownObject.linkedObject = alternateThrownObject;
            addEffectToArea(state, state.alternateAreaInstance, alternateThrownObject);
        }
        hero.pickUpTile = null;
    }

    increaseMagicRegenCooldown(amount: number): void {
        this.magicRegenCooldown = Math.min(Math.max(100, this.magicRegenCooldown + amount), this.magicRegenCooldownLimit);
    }
}

class _Hero extends Hero {}
declare global {
    export interface Hero extends _Hero {}
}
