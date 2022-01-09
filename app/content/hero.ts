import { addEffectToArea } from 'app/content/areas';
import { destroyClone } from 'app/content/clone';
import {
    arrowAnimations, bowAnimations,
    chargeBackAnimation, chargeFrontAnimation,
    chargeFireBackAnimation, chargeFireFrontAnimation,
    chargeIceBackAnimation, chargeIceFrontAnimation,
    chargeLightningBackAnimation, chargeLightningFrontAnimation,
} from 'app/render/heroAnimations';
import { getHeroFrame, renderCarriedTile, renderExplosionRing, renderHeroBarrier } from 'app/renderActor';
import { getChargeLevelAndElement } from 'app/useTool';
import { drawFrameAt, getFrame } from 'app/utils/animations';
import { directionMap, getDirection } from 'app/utils/field';

import {
    Action, ActiveTool, Actor, AreaInstance,
    Direction, DrawPriority, EffectInstance, Equipment,
    FullTile, GameState, HitProperties, HitResult,
    MagicElement, ObjectInstance, ObjectStatus,
    PassiveTool, Rect, SavedHeroData, ThrownObject, TileBehaviors, TileCoords, ZoneLocation
} from 'app/types';

const throwSpeed = 6;

export class Hero implements Actor, SavedHeroData {
    isAstralProjection = false;
    isClone = false;
    isAllyTarget = true;
    // These aren't used by the Hero itself since it has special handling,
    // but these are used on objects that inherit from hero: AstralProjection and Clone.
    drawPriority: DrawPriority = 'sprites';
    behaviors: TileBehaviors = {
        solid: true,
    };
    x: number = 0;
    y: number = 0;
    z: number = 0;
    area: AreaInstance;
    w: number = 16;
    h: number = 16;
    vx: number = 0;
    vy: number = 0;
    vz: number = 0;
    d: Direction = 'down';
    action?: Action;
    actionDx?: number;
    actionDy?: number;
    actionFrame?: number = 0;
    actionTarget?: any;
    animationTime: number = 0;
    // like being knocked but doesn't stop MC charge or other actions.
    bounce?: {vx: number; vy: number; frames: number};
    equipedGear?: {[key in Equipment]?: boolean};
    hasBarrier?: boolean = false;
    isInvisible?: boolean = false;
    jumpingTime?: number;
    jumpDirection?: Direction;
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
    wading?: boolean;
    slipping?: boolean;
    swimming?: boolean;
    floating?: boolean;
    sinking?: boolean;
    inAirBubbles?: boolean;
    frozenDuration?: number;
    isUsingDoor?: boolean;
    isExitingDoor?: boolean;
    isControlledByObject?: boolean;
    isTouchingPit?: boolean;
    isOverPit?: boolean;
    // stats
    magic: number = 0;
    // base: 20, max: 100, roll: 5, charge: 10, double-charge: 50
    maxMagic: number = 0;
    // base 4, max 8-10 (target mana regen rate)
    magicRegen: number = 0;
    // This is the actual mana regen rate, which changes depending on circumstances and can even become negative.
    actualMagicRegen: number = 0;
    lightRadius: number = 20;
    rollCooldown: number = 0;
    toolCooldown: number = 0;
    // Used to render the bow after firing it.
    toolOnCooldown?: ActiveTool;
    // inventory
    astralProjection?: Hero;
    clones: Hero[];
    activeClone?: Hero;
    barrierElement?: MagicElement;
    barrierLevel?: number;
    safeD: Direction;
    safeX: number;
    safeY: number;
    chargingLeftTool?: boolean;
    chargingRightTool?: boolean;
    chargingHeldObject?: boolean;
    chargeTime?: number = 0;
    spiritRadius: number = 0;
    status: ObjectStatus = 'normal';

    // SavedHeroData fields
    maxLife: number = 4;
    money: number;
    peachQuarters: number;
    spiritTokens: number;
    activeTools: {[key in ActiveTool]: number};
    equipment: {[key in Equipment]: number};
    passiveTools: {[key in PassiveTool]: number};
    elements: {[key in MagicElement]: number};
    weapon: number;
    leftTool?: ActiveTool;
    rightTool?: ActiveTool;
    element?: MagicElement;
    spawnLocation: ZoneLocation;
    // Heroes have special handling for pits and shouldn't use the object pit logic.
    ignorePits = true;

    constructor() {
        this.life = this.maxLife;
        this.clones = [];
        this.equipedGear = {};
    }

    applySavedHeroData(defaultSavedHeroData: SavedHeroData, savedHeroData?: SavedHeroData) {
        for (let i in defaultSavedHeroData) {
            this[i] = defaultSavedHeroData[i];
        }
        if (savedHeroData) {
            for (let i in savedHeroData) {
                this[i] = savedHeroData[i];
            }
        }
        this.passiveTools = {
            ...defaultSavedHeroData.passiveTools,
            ...savedHeroData?.passiveTools,
        };
        this.activeTools = {
            ...defaultSavedHeroData.activeTools,
            ...savedHeroData?.activeTools,
        };
        this.elements = {
            ...defaultSavedHeroData.elements,
            ...savedHeroData?.elements,
        };
        this.equipment = {
            ...defaultSavedHeroData.equipment,
            ...savedHeroData?.equipment,
        };
    }

    exportSavedHeroData(): SavedHeroData {
        return {
            maxLife: this.maxLife,
            money: this.money,
            peachQuarters: this.peachQuarters,
            spiritTokens: this.spiritTokens,
            weapon: this.weapon,
            leftTool: this.leftTool,
            rightTool: this.rightTool,
            element: this.element,
            spawnLocation: this.spawnLocation,
            activeTools: {...this.activeTools},
            elements: {...this.elements},
            equipment: {...this.equipment},
            passiveTools: {...this.passiveTools},
        };
    }

    getCopy(this: Hero): Hero {
        const copy = new Hero();
        for (let i in this) {
            copy[i] = this[i];
        }
        copy.passiveTools = {
            ...this.passiveTools,
        };
        copy.activeTools = {
            ...this.activeTools,
        };
        copy.elements = {
            ...this.elements,
        };
        copy.equipment = {
            ...this.equipment,
        };
        return copy;
    }

    getHitbox(this: Hero, state: GameState): Rect {
        return { x: this.x, y: this.y, w: 16, h: 16 };
    }

    onHit(this: Hero, state: GameState, hit: HitProperties): HitResult {
        if (this.life <= 0) {
            return {};
        }
        if (this.action === 'roll' || this.action === 'getItem' || this.action === 'jumpingDown') {
            return {};
        }
        if (this.hasBarrier) {
            let spiritDamage = hit.spiritCloakDamage || Math.max(10, hit.damage * 5);
            // The cloak halves incoming damage that matches its current element.
            if (hit.element && hit.element === this.barrierElement) {
                spiritDamage /= 2;
            }
            if (hit.damage && state.hero.invulnerableFrames <= 0) {
                state.hero.magic -= spiritDamage;
                state.hero.invulnerableFrames = Math.max(state.hero.invulnerableFrames, 10);
            }
            const hitbox = this.getHitbox(state);
            let reflectDamage = this.barrierLevel;
            if (!this.barrierElement) {
                reflectDamage++;
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
            return {};
        }
        if (hit.damage) {
            let damage = hit.damage;
            if (hit.element === 'fire' && state.hero.passiveTools.fireBlessing) {
                damage /= 2;
            }
            if (hit.element === 'ice' && state.hero.passiveTools.waterBlessing) {
                damage /= 2;
            }
            if (state.hero.passiveTools.goldMail) {
                damage /= 2;
            }
            this.takeDamage(state, damage);
        }
        if (hit.knockback && !this.equipedGear?.ironBoots) {
            this.knockBack(state, hit.knockback);
        }
        // Getting hit while frozen unfreezes you.
        if (this.frozenDuration > 0) {
            this.frozenDuration = 0;
        } else if (hit.element === 'ice') {
            // Getting hit by ice freezes you.
            this.frozenDuration = 1500;
        }
        return { hit: true };
    }

    knockBack(state: GameState, knockback: {vx: number; vy: number; vz: number}) {
        this.throwHeldObject(state);
        this.action = 'knocked';
        this.animationTime = 0;
        this.vx = knockback.vx;
        this.vy = knockback.vy;
        this.vz = knockback.vz || 2;
    }

    setElement(nextElement: MagicElement): void {
        if (this.element !== nextElement) {
            this.element = nextElement;
            // Reduce charge time to 500ms when switching between elements,
            // as if it takes some effort to change elements.
            this.chargeTime = Math.min(this.chargeTime, 500);
        }
    }

    takeDamage(this: Hero, state: GameState, damage: number): void {
        // Damage applies to the hero, not the clone.
        state.hero.life -= damage / 2;
        state.hero.invulnerableFrames = 50;
        // Taking damage resets radius for spirit sight meditation.
        state.hero.spiritRadius = 0;
        // If any clones are in use, any damage one takes destroys it until only one clone remains.
        if (state.hero.clones.length) {
            destroyClone(state, this);
        }
    }

    renderBow(this: Hero, context: CanvasRenderingContext2D, state: GameState, bowDirection: Direction): void {
        const isChargingBow = state.hero.toolOnCooldown !== 'bow';
        const bowAnimationTime = isChargingBow ? 0 : (200 - state.hero.toolCooldown);
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
        const frame = getFrame(bowAnimations[bowDirection], bowAnimationTime);
        drawFrameAt(context, frame, { x: this.x - 6, y: this.y - this.z - 11 });
        if (isChargingBow && state.hero.magic > 0) {
            const arrowFrame = getFrame(arrowAnimations[bowDirection], bowAnimationTime);
            drawFrameAt(context, arrowFrame, { x: this.x - 7 + arrowXOffset, y: this.y - this.z - 11 + arrowYOffset });
        }
    }

    render(this: Hero, context: CanvasRenderingContext2D, state: GameState): void {
        const hero = this;
        // Currently the hero always has the barrier when invisible, but this could change.
        if (state.hero.isInvisible) {
            if (hero.hasBarrier) {
                renderHeroBarrier(context, state, hero);
            }
            return;
        }
        if (hero.action === 'fallen' || hero.action === 'sankInLava') {
            return;
        }
        if (state.hero.magic > 0 && hero.passiveTools.charge && hero.action === 'charging') {
            const { chargeLevel } = getChargeLevelAndElement(state, hero);
            if (chargeLevel) {
                const animation = !hero.element
                    ? chargeBackAnimation
                    : {
                        fire: chargeFireBackAnimation,
                        ice: chargeIceBackAnimation,
                        lightning: chargeLightningBackAnimation
                    }[hero.element];
                context.save();
                    context.globalAlpha *= 0.8;
                    const frame = getFrame(animation, hero.chargeTime);
                    drawFrameAt(context, frame, { x: hero.x, y: hero.y - hero.z });
                context.restore();
            }
        }
        const isChargingBow = (hero.chargingRightTool && hero.rightTool === 'bow')
                || (hero.chargingLeftTool && hero.leftTool === 'bow');
        const shouldDrawBow = isChargingBow || state.hero.toolOnCooldown === 'bow';
        const bowDirection = getDirection(hero.actionDx, hero.actionDy, true, hero.d);
        const drawBowUnderHero = bowDirection === 'up' || bowDirection === 'upleft' || bowDirection === 'upright';
        if (shouldDrawBow && drawBowUnderHero) {
            this.renderBow(context, state, bowDirection);
        }
        const frame = getHeroFrame(state, hero);
        const activeClone = state.hero.activeClone || state.hero;
        context.save();
            if (hero !== activeClone) {
                context.globalAlpha *= 0.8;
            } else if (hero.invulnerableFrames) {
                context.globalAlpha *= (0.7 + 0.3 * Math.cos(2 * Math.PI * hero.invulnerableFrames * 3 / 50));
            }
            drawFrameAt(context, frame, { x: hero.x, y: hero.y - hero.z });
        context.restore();
        if (shouldDrawBow && !drawBowUnderHero) {
            this.renderBow(context, state, bowDirection);
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
                context.globalAlpha *= (0.3 + 0.2 * p);
                context.fillRect(
                    Math.round(hero.x - frame.content.x - p),
                    Math.round(hero.y - hero.z - frame.content.y - p),
                    Math.round(frame.w + 2 * p),
                    Math.round(frame.h + 2 * p)
                );
            context.restore();
        }
        renderExplosionRing(context, state, hero);
        if (state.hero.magic > 0 && hero.passiveTools.charge && hero.action === 'charging') {
            const animation = !hero.element
                ? chargeFrontAnimation
                : {
                    fire: chargeFireFrontAnimation,
                    ice: chargeIceFrontAnimation,
                    lightning: chargeLightningFrontAnimation
                }[hero.element];
            context.save();
                context.globalAlpha *= 0.8;
                const frame = getFrame(animation, hero.chargeTime);
                drawFrameAt(context, frame, { x: hero.x, y: hero.y - hero.z });
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
}
