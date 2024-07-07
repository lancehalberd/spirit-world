import {
    iceFrontAnimation,
} from 'app/content/animations/iceOverlay';
import { addParticleAnimations, FieldAnimationEffect } from 'app/content/effects/animationEffect';
import { BarrierBurstEffect } from 'app/content/effects/barrierBurstEffect';
import { lightStoneParticles, heavyStoneParticles } from 'app/content/tiles/constants';
import { Staff } from 'app/content/objects/staff';
import { getChargedArrowAnimation } from 'app/content/effects/arrow';
import { ThrownObject } from 'app/content/effects/thrownObject';
import { editingState } from 'app/development/editingState';
import { FRAME_LENGTH } from 'app/gameConstants';
import { playAreaSound } from 'app/musicController';

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
    renderExplosionRing, renderHeroBarrier, renderHeroShadow,
    spiritBarrierBreakingAnimation,
} from 'app/renderActor';
import { getCloneMovementDeltas } from 'app/userInput';
import { drawFrameAt, getFrame } from 'app/utils/animations';
import { destroyClone } from 'app/utils/destroyClone';
import { addEffectToArea, removeEffectFromArea } from 'app/utils/effects';
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
    // How long the hero has been in the current area.
    areaTime: number = 0;
    animationTime: number = 0;
    attackBufferTime: number = 0;
    // like being knocked but doesn't stop MC charge or other actions.
    bounce?: {vx: number; vy: number; frames: number};
    hasBarrier?: boolean = false;
    isInvisible?: boolean = false;
    isAirborn = false;
    jumpingVx?: number;
    jumpingVy?: number;
    jumpingVz?: number;
    jumpingDownY?: number;
    isJumpingWrecklessly?: boolean;
    // This must be set when jumping to allow using trampolines.
    // It is set to false to prevent trampolining in certain circumstances while jumping.
    canTrampoline?: boolean;
    // If this is set; the actor is being carried by a hero/clone.
    carrier?: Hero;
    explosionTime?: number;
    pickUpFrame?: number;
    pickUpObject?: ObjectInstance;
    pickUpTile?: FullTile;
    grabTile?: TileCoords;
    grabObject?: ObjectInstance;
    lastTouchedObject?: EffectInstance | ObjectInstance;
    lastPushTime?: number
    invulnerableFrames?: number;
    life: number;
    // The amount of life to actually display in the HUD.
    // This value may change over many frames to catch up with
    // the actual life value which changes in larger chunks.
    displayLife?: number;
    ironSkinCooldown: number = 500;
    wading?: boolean;
    slipping?: boolean;
    swimming?: boolean;
    floating?: boolean;
    sinking?: boolean;
    inAirBubbles?: boolean;
    frozenDuration?: number;
    frozenHeartDuration?: number;
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
    // How much magic the hero has spent recently. This is drawn as a red bar on top of remaining magic
    // and is used to visualize both how much magic the hero spent and how long until magic regen starts again.
    recentMagicSpent: number = 0;
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
    renderParent?: BaseFieldInstance;

    constructor() {
        this.clones = [];
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

    getHitbox(): Rect {
        if (this.hasBarrier) {
            const p = 4;
            return { x: (this.x - p) | 0, y: (this.y - p) | 0, w: this.w + 2 * p, h: this.h + 2 * p };
        }
        return { x: this.x | 0, y: this.y | 0, w: this.w, h: this.h };
    }
    getMovementHitbox(this: Hero): Rect {
        return { x: this.x | 0, y: this.y | 0, w: this.w, h: this.h };
    }
    // This is used when checking what part of the floor the hero is touching for things like standing on platforms
    // or damaging floor. The hero's normal movement hitbox is much taller than the hero appears so using this
    // shorter hitbox makes floor effects feel more intuitive.
    getFloorHitbox(this: Hero): Rect {
        return { x: (this.x | 0) + 2, y: (this.y | 0) + 8, w: this.w - 4, h: this.h - 8 };
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
        const hitbox = this.getHitbox();
        // Generically knock the hero back if knockAwayFromHit is set but no actual knockbac vector is set.
        if (hit.knockAwayFromHit && !hit.knockback) {
            let dx = -directionMap[this.d][0], dy = -directionMap[this.d][1];
            if (hit.hitbox) {
                dx = (hitbox.x + hitbox.w / 2) - (hit.hitbox.x + hit.hitbox.w / 2);
                dy = (hitbox.y + hitbox.h / 2) - (hit.hitbox.y + hit.hitbox.h / 2);
            } else if (hit.hitCircle) {
                dx = (hitbox.x + hitbox.w / 2) - hit.hitCircle.x;
                dy = (hitbox.y + hitbox.h / 2) - hit.hitCircle.y;
            } else if (hit.hitRay) {
                // TODO.
            }
            hit.knockback = {
                vx: 4 * dx,
                vy: 4 * dy,
                vz: 2,
            };
        }
        if (this.hasBarrier) {
            let iframeMultiplier = 1;
            let spiritDamage = hit.spiritCloakDamage || Math.max(10, hit.damage * 5);
            // The cloak halves incoming damage that matches its current element.
            // Note that since the base cloak tool can no longer be charged, barrier element is never set.
            //if (hit.element && hit.element === this.barrierElement) {
            //    spiritDamage /= 2;
            //}
            let reflectDamage = this.barrierLevel;
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
                state.hero.spendMagic(spiritDamage);
                state.hero.invulnerableFrames = Math.max(state.hero.invulnerableFrames, iframeMultiplier * 10);
                // state.hero.increaseMagicRegenCooldown(1000 * spiritDamage / 20);
            }
            if (hit.canAlwaysKnockback && hit.knockback) {
                this.knockBack(state, hit.knockback);
            }
            return { hit: true, reflected: true,
                returnHit: {
                    damage: reflectDamage,
                    // element: this.barrierElement,
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
        const hadIronSkin = this.savedData.ironSkinLife > 0;
        const preventKnockback = this.savedData.equippedBoots === 'ironBoots' || this.savedData.ironSkinLife > 0;
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
        if (hit.knockback && hit.element !== 'ice' && (hit.canAlwaysKnockback || !preventKnockback)) {
            this.knockBack(state, hit.knockback);
        }
        // Getting hit while frozen unfreezes you.
        if (this.frozenHeartDuration > 0) {
            this.frozenHeartDuration = 0;
        } else if (this.frozenDuration > 0) {
            this.frozenDuration = 0;
        } else if (hit.element === 'ice' && this.frozenDuration <= -500) {
            const duration = this.savedData.passiveTools.waterBlessing ? 1000 : 1500;
            if (hadIronSkin) {
                this.frozenHeartDuration = 2 * duration;
            } else {
                // Getting hit by ice freezes you unless you have iron skin up.
                this.frozenDuration = duration;
                this.vx = this.vy = 0;
            }
            playAreaSound(state, state.areaInstance, 'freeze');
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
        this.frozenHeartDuration = 0;
    }

    burstBarrier(state: GameState) {
        if (!this.hasBarrier) {
            return;
        }
        this.hasBarrier = false;
        this.activeBarrierBurst = new BarrierBurstEffect({
            element: getElement(state, this),
            level: (this.savedData.activeTools.cloak & 2) ? 2: 1,
            source: this,
        });
        addEffectToArea(state, this.area, this.activeBarrierBurst);
    }
    fallIntoPit(state: GameState) {
        this.throwHeldObject(state);
        this.heldChakram?.throw(state);
        this.endInvisibility(state);
        // Unfreeze on falling into a pit.
        this.frozenDuration = 0;
        this.action = 'falling';
        this.animationTime = 0;
    }
    endInvisibility(state: GameState) {
        this.isInvisible = false;
        if (this.activeBarrierBurst) {
            removeEffectFromArea(state, this.activeBarrierBurst);
            delete this.activeBarrierBurst;
        }
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
        // Immediately change display life to the current life so that it is obvious how much
        // damage the most recent hid did.
        this.displayLife = this.life;
        if (this.frozenHeartDuration > 0) {
            // When the player has frozen hearts, all damage just destroys those hearts.
            const targetValue = Math.max(0, Math.ceil(this.savedData.ironSkinLife) - 2);
            damage = 2 * (this.savedData.ironSkinLife - targetValue);
            //playAreaSound(state, state.areaInstance, 'rockShatter');
            //playAreaSound(state, state.areaInstance, 'freeze');
            //playAreaSound(state, state.areaInstance, 'pickUpObject');
            //addParticleAnimations(state, this.area, this.x + 8, this.y + 8, 8,
            //    [...lightStoneParticles, ...heavyStoneParticles],
            //    {numberParticles}, 4
            //);
        }
        // Iron Skin is shared across all clones, so use the values from the main hero
        if (state.hero.savedData.ironSkinLife) {
            state.hero.ironSkinCooldown = 3000;
            const numberParticles = Math.ceil(damage * 2);
            addParticleAnimations(state, this.area, this.x + 8, this.y + 8, 8,
                [...lightStoneParticles, ...heavyStoneParticles],
                {numberParticles}, 4
            );
            if (state.hero.savedData.ironSkinLife >= damage / 2) {
                state.hero.savedData.ironSkinLife -= damage / 2;
                if (damage >= 1) {
                    playAreaSound(state, state.areaInstance, 'rockShatter');
                } else {
                    // Play a different sound for small amounts of damage.
                    playAreaSound(state, state.areaInstance, 'pickUpObject');
                }

                // Iframes are only for the clone taking the damage.
                this.invulnerableFrames = 30 * iframeMultiplier;
                //if (state.hero.clones.filter(clone => !clone.isUncontrollable).length || this !== state.hero) {
                //    destroyClone(state, this);
                //}
                return;
            } else {
                damage -= 2 * state.hero.savedData.ironSkinLife;
                // Always play the full sound when the last of the iron skin barrier is destroyed.
                playAreaSound(state, state.areaInstance, 'rockShatter');
                state.hero.savedData.ironSkinLife = 0;
            }
        }
        // If any controllable clones are in use,
        // any damage the hero or any clone take destroys it.
        // If there are no controllable clones, damage will only kill the
        // uncontrollably ones, never the primary clone the player is controlling.
        playAreaSound(state, state.areaInstance, 'ouch');
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
        const animations = (this.savedData.activeTools.bow & 2) ? goldBowAnimations : bowAnimations;
        const frame = getFrame(animations[bowDirection], bowAnimationTime);
        drawFrameAt(context, frame, { x: this.x - 6, y: this.y - this.z - 11 });
        if (isChargingBow && state.hero.magic > 0) {
            const arrowFrame = getFrame(arrowAnimations[bowDirection], bowAnimationTime);
            drawFrameAt(context, arrowFrame, { x: this.x - 7 + arrowXOffset, y: this.y - this.z - 11 + arrowYOffset });
            const { chargeLevel, element } = getChargeLevelAndElement(state, this, this.savedData.activeTools.bow);
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
        // Debug floor hitbox.
        /*context.save();
            context.globalAlpha *= 0.6;
            context.fillStyle = 'orange';
            const floorHitbox = this.getFloorHitbox();
            context.fillRect(floorHitbox.x, floorHitbox.y, floorHitbox.w, floorHitbox.h);
        context.restore();*/
        // Start drawing the hero in the foreground when they are most of the way up a ladder.
        // This prevents them from rendering under foreground ceiling tiles at the top of ladders.
        const isClimbingLadder = (this.actionTarget?.style === 'ladderUp' || this.actionTarget?.style === 'ladderUpTall');
        if (
            editingState.isEditing ||
            (isClimbingLadder && this.y < this.actionTarget.y + 24)
            // Render hero in the foreground when they are high enough (occurs when falling into an area).
            || this.z > 24
        ) {
            this.render(context, state);
        }
        const isOverTrampoline = this.canTrampoline && (this.action === 'jumpingDown' && this.area.objects.find(o => o.definition?.type === 'trampoline' && this.overlaps((o as Trampoline).getFrameHitbox()) ));
        if (isOverTrampoline) {
            renderHeroShadow(context, state, this);
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
             if (hero.pickUpTile) {
                renderCarriedTile(context, state, hero);
            }
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
        this.renderHeroFrame(context, state);
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
            const frame = getFrame(iceFrontAnimation, hero.frozenDuration);
            context.save();
                const p = Math.round(Math.min(3, hero.frozenDuration / 200));
                context.globalAlpha *= (0.3 + 0.15 * p);
                drawFrameAt(context, frame, { x: this.x - 10, y: this.y - this.z - 13 });
            context.restore();
        }
        this.renderChargingFront(context, state);
        // Debug code for visualizing when the hero is in an invalid location underneath a ledge tile.
        /*context.save();
            const box = this.getMovementHitbox();
            context.fillStyle = isUnderLedge(state, this.area, box) ? 'red' : 'blue';
            context.fillRect(box.x, box.y, box.w, box.h);
        context.restore();*/
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

    // Assuming the hero is charging a weapon or tool, returns the level of the charging tool or weapon.
    getChargingToolLevel(this: Hero): number {
        let tool = (this.chargingLeftTool && this.savedData.leftTool) || (this.chargingRightTool && this.savedData.rightTool);
        // TODO: Account for gloves level if we ever support charging thrown objects.
        if (tool) {
            return (this.savedData.activeTools[tool] & 2) ? 2 : 1;
        }
        return this.heldChakram?.level || ((this.savedData.weapon & 2) ? 2 : 1);
    }

    renderChargingBehind(this: Hero, context: CanvasRenderingContext2D, state: GameState) {
        const renderCharging = state.hero.magic > 0 && this.getMaxChargeLevel(state)
            && this.action === 'charging' && this.chargeTime >= 60
        if (renderCharging) {
            const { chargeLevel, element } = getChargeLevelAndElement(state, this, this.getChargingToolLevel());
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
            const { chargeLevel } = getChargeLevelAndElement(state, this, this.getChargingToolLevel());
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

    dropHeldObject(this: Hero, state: GameState){
        const hero = this;
        if (hero.pickUpObject) {
            // This assumes only clones can be picked up and dropped.
            // Since only astral projection drops items, and the projection
            // cannot pick up a clone, this branch is not currently expected to run.
            const clone = hero.pickUpObject as Hero;
            clone.x = hero.x;
            clone.y = hero.y;
            clone.vx = 0
            clone.vy = 0;
            clone.vz = 0;
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
        const tile = hero.pickUpTile;
        const behaviors = tile.behaviors;
        const thrownObject = new ThrownObject({
            frame: tile.frame,
            behaviors,
            x: hero.x,
            y: hero.y,
            vx: 0,
            vy: 0,
            vz: 0,
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
                vx: 0,
                vy: 0,
                vz: 0,
            });
            alternateThrownObject.linkedObject = thrownObject;
            thrownObject.linkedObject = alternateThrownObject;
            addEffectToArea(state, hero.area.alternateArea, alternateThrownObject);
        }
        hero.pickUpTile = null;
    }

    throwHeldObject(this: Hero, state: GameState){
        const hero = this;
        const [dx, dy] = getCloneMovementDeltas(state, hero);
        const direction = getDirection(dx, dy, true, hero.d);
        if (hero.pickUpObject) {
            // This assumes only clones can be picked up and thrown. We will have to update this if
            // we add other objects to this category.
            const clone = hero.pickUpObject as Hero;
            clone.d = hero.d;
            clone.x = hero.x;
            clone.y = hero.y;
            clone.vx = directionMap[direction][0] * throwSpeed;
            clone.vy = directionMap[direction][1] * throwSpeed;
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
            vx: directionMap[direction][0] * throwSpeed,
            vy: directionMap[direction][1] * throwSpeed,
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
                vx: directionMap[direction][0] * throwSpeed,
                vy: directionMap[direction][1] * throwSpeed,
                vz: 2,
            });
            alternateThrownObject.linkedObject = thrownObject;
            thrownObject.linkedObject = alternateThrownObject;
            addEffectToArea(state, hero.area.alternateArea, alternateThrownObject);
        }
        hero.pickUpTile = null;
    }

    // This should only be called on `state.hero`.
    spendMagic(amount: number, cooldownAmount?: number) {
        // console.log('spendMagic', amount, cooldownAmount);
        this.magic -= amount;
        this.recentMagicSpent += amount;
        if (this.magic < 0) {
            // This prevents the recentMagicSpent portion from jumping when your magic becomes negative.
            this.recentMagicSpent += this.magic - 0.001;
            this.magic = -0.001;
            if (amount >= 10) {
                this.magicRegenCooldown = this.magicRegenCooldownLimit;
            }
        } else if (cooldownAmount > 0) {
            this.increaseMagicRegenCooldown(cooldownAmount);
        } else if (cooldownAmount !== 0) {
            this.increaseMagicRegenCooldown(100 * amount);
        }
    }

    // This should only be called on `state.hero`.
    increaseMagicRegenCooldown(amount: number): void {
        //console.log('increaseMagicRegenCooldown', amount);
        this.magicRegenCooldown = Math.min(Math.max(100, this.magicRegenCooldown + amount), this.magicRegenCooldownLimit);
    }
}

class _Hero extends Hero {}
declare global {
    export interface Hero extends _Hero {}
}
