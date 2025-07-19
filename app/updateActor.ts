import {
    getAreaFromLocation,
    scrollToArea,
} from 'app/content/areas';
import {addSparkleAnimation} from 'app/content/effects/animationEffect';
import {AirBubbles} from 'app/content/objects/airBubbles';
import {Enemy} from 'app/content/enemy';
import {editingState} from 'app/development/editingState';
import {EXPLOSION_RADIUS, EXPLOSION_TIME, FRAME_LENGTH, gameModifiers} from 'app/gameConstants';
import {checkForFloorEffects} from 'app/movement/checkForFloorEffects';
import {playAreaSound} from 'app/musicController';
import {prependScript} from 'app/scriptEvents';
import {updateHeroSpecialActions} from 'app/updateHeroSpecialActions';
import {updateHeroStandardActions} from 'app/updateHeroStandardActions';
import {isToolButtonPressed, wasToolButtonPressed, wasToolButtonPressedAndReleased} from 'app/useTool';
import {isUnderwater} from 'app/utils/actor';
import {removeAllClones, setNextAreaSection } from 'app/utils/area';
import {removeEffectFromArea} from 'app/utils/effects';
import {directionMap} from 'app/utils/field';
import {getAreaSize} from 'app/utils/getAreaSize';
import {getFullZoneLocation} from 'app/utils/getFullZoneLocation';
import {boxesIntersect, pad} from 'app/utils/index';
import {removeObjectFromArea} from 'app/utils/objects';
import Random from 'app/utils/Random';
import {swapHeroStates} from 'app/utils/swapHeroStates';

export function updateAllHeroes(this: void, state: GameState) {
    if (state.hero.action === 'preparingSomersault' && state.fieldTime % 200 !== 0) {
        state.hero.justRespawned = false;
        updateHeroSpecialActions(state, state.hero);
        return;
    }
    // Switching clones is done outside of updateHero, otherwise the switch gets processed by each clone.
    if (state.hero.clones.length && !state.hero.pickUpObject && wasToolButtonPressedAndReleased(state, 'clone')) {
        if (!state.hero.cloneToolReleased){
            state.hero.cloneToolReleased = true;
        } else {
            for (let i = 0; i < state.hero.clones.length; i++) {
                if (!state.hero.clones[0].isUncontrollable && state.hero.clones[0].action !== 'thrown') {
                    swapHeroStates(state.hero, state.hero.clones[0]);
                    state.hero.cloneToolReleased = true;
                    state.hero.clones[0].cloneToolReleased = true;
                    break;
                }
                state.hero.clones.push(state.hero.clones.shift());
            }
            state.hero.clones.push(state.hero.clones.shift());
        }
    }
    // This is for switching to thrown clone as you throw it.
    if (state.hero.clones.length && state.hero.cloneToolReleased && wasToolButtonPressed(state, 'clone')) {
        for (let i = 0; i < state.hero.clones.length; i++) {
            if (state.hero.clones[i].isUncontrollable
                && !state.hero.clones[i].cannotSwapTo
                && state.hero.clones[i].explosionTime < 300
            ) {
                swapHeroStates(state.hero, state.hero.clones[i]);
                state.hero.cloneToolReleased = false;
                state.hero.clones[i].cannotSwapTo = true;
                break;
            }
        }
    }
    // Clone updates used to be before the main hero update.
    /*for (let i = 0; i < state.hero.clones.length; i++) {
        const clone = state.hero.clones[i];
        updateHero(state, clone);
    }*/
    // Destroy existing astral projection if it isn't in the right area.
    if (state.hero.astralProjection && state.hero.astralProjection.area !== state.hero.area.alternateArea) {
        removeObjectFromArea(state, state.hero.astralProjection);
        state.hero.astralProjection = null;
    }
    if (state.hero.astralProjection) {
        if (state.hero.spiritRadius > 0) {
            updateHero(state, state.hero.astralProjection);
        } else {
            removeObjectFromArea(state, state.hero.astralProjection);
            state.hero.astralProjection = null;
        }
    }
    if (!state.scriptEvents.blockPlayerUpdates) {
        updateHero(state, state.hero);
        for (let i = 0; i < state.hero.clones.length; i++) {
            const clone = state.hero.clones[i];
            updateHero(state, clone);
        }
    }
    const skipModulus = state.hero.savedData.passiveTools.spiritSight ? 100 : 40;
    const skipFrame = state.hero.action === 'meditating' && (state.hero.animationTime % skipModulus) >= 20;
    if (!skipFrame) {
        updatePrimaryHeroState(state, state.hero);
    }
    checkToStartScreenTransition(state, state.hero);
}

export function updateHero(this: void, state: GameState, hero: Hero) {
    hero.justRespawned = false;
    // If the hero is performing some special action with logic that overrides default actions,
    // for example, falling into a pit, or transitioning between screens, this function will handle
    // the update and return `true`, indicating that normal behavior should be suspended.
    const blockNormalActions = updateHeroSpecialActions(state, hero);
    if (!blockNormalActions) {
        // This update relates to hero performing or completing actions + movement.
        updateHeroStandardActions(state, hero);
        if (!hero.area) {
            return;
        }
        checkForEnemyDamage(state, hero);
        // Mostly don't check for pits/damage when the player cannot control themselves
        if (!hero.isAstralProjection) {
            checkForFloorEffects(state, hero);
        }
    }
    // Currently unused as we have removed the particles from the clone explosion charge effect, but we might add it back later.
    updateHeroVisualEffects;//(state, hero);
    updateGenericHeroState(state, hero);
}

export function updateHeroVisualEffects(this: void, state: GameState, hero: Hero) {
    // Add fire particles indicating the clone is charing to explode.
    if (hero.explosionTime % 60 === 20 && hero.explosionTime < EXPLOSION_TIME - 100) {
        const count = Math.ceil((EXPLOSION_TIME - hero.explosionTime) / 100);
        const baseTheta = Math.random() * 2 * Math.PI;
        const element = (hero.explosionTime % 240 === 200) ? 'lightning' : 'fire';
        for (let i = 0; i < count; i++) {
            const p = Math.max(0.1, 1 - hero.explosionTime / EXPLOSION_TIME / 2);
            const radius = EXPLOSION_RADIUS;// * p;
            const theta = baseTheta + 2 * Math.PI * i / count;
            const dx = Math.cos(theta), dy = Math.sin(theta);
            const hitbox = {...hero.getHitbox(), x: 0, y: 0};
            const sparkle = addSparkleAnimation(state, hero.area, {
                x: hitbox.w / 2 + radius * dx,
                y: hitbox.h / 2 + radius * dy, w: 0, h: 0},
                {
                    element,
                    target: hero,
                }
            );
            let speed = Math.max(Random.range(1, 2) / p, radius * 20 / (EXPLOSION_TIME - hero.explosionTime));
            // override the default velocity so that the particle
            // always moves in towards the center of the blast.
            sparkle.vx = -speed * dx;
            sparkle.vy = -speed * dy;
            sparkle.ttl = FRAME_LENGTH * radius / speed;
            if (element === 'lightning') {
                sparkle.vstep = 3;
                sparkle.vx *= 3;
                sparkle.vy *= 3;
            }
            //delete sparkle.vstep;
            sparkle.friction = 0.01;
            sparkle.az = 0;
            sparkle.vz = 0;
            sparkle.z = 1;
        }
    }
}

export function updateGenericHeroState(this: void, state: GameState, hero: Hero) {
    if (hero.displayLife === undefined) {
        hero.displayLife = hero.life;
    }
    if (hero.displayLife > hero.life && hero.invulnerableFrames <= 0) {
        //hero.displayLife = Math.max(hero.life, hero.displayLife - 0.1);
        hero.displayLife = hero.life;
    } else if (hero.displayLife < hero.life) {
        const oldModValue = hero.displayLife % 1;
        hero.displayLife = Math.min(hero.life, hero.displayLife + 0.1);
        if (hero.displayLife % 1 < oldModValue) {
            //console.log(hero.displayLife);
            playAreaSound(state, state.areaInstance, 'heart');
        }
    }
    // Hero takes one damage every half second while in a hot room without the fire blessing.
    if (!editingState.isEditing && state.areaSection?.isHot && !state.hero.savedData.passiveTools.fireBlessing) {
        hero.applyBurn(1, 500);
    }
    if (hero.rollCooldown > 0) {
        hero.rollCooldown -= FRAME_LENGTH;
    }
    if (hero.invulnerableFrames > 0) {
        hero.invulnerableFrames--;
    }
    // Remove barrier/invisibility if the hero does not have the cloak equipped.
    if ((hero.hasBarrier || hero.isInvisible) && hero.savedData.leftTool !== 'cloak' && hero.savedData.rightTool !== 'cloak') {
        hero.shatterBarrier(state);
        hero.isInvisible = false;
    }
    // End invisibility once the player lets go of the cloak tool.
    if (hero.isInvisible && !isToolButtonPressed(state, 'cloak') && !state.scriptEvents.blockPlayerInput) {
        hero.isInvisible = false;
    }
    if (hero.clones?.length && hero.savedData.leftTool !== 'clone' && hero.savedData.rightTool !== 'clone') {
        removeAllClones(state);
    }
    hero.areaTime += FRAME_LENGTH;
    if (hero.frozenHeartDuration > 0) {
        hero.frozenHeartDuration -= FRAME_LENGTH;
        state.hero.ironSkinCooldown = Math.max(state.hero.ironSkinCooldown, 1000);
    }
    if (hero.frozenDuration > -500) {
        hero.frozenDuration -= FRAME_LENGTH;
    }
    if ((hero.frozenDuration ?? 0) <= 0) {
        hero.animationTime += FRAME_LENGTH;
        if (hero.action === 'walking' && hero.isRunning && hero.magic > 0) {
            //hero.animationTime += FRAME_LENGTH / 2;
        }
    }
    // Burns end immediately dealing no damage to swimming targets.
    if (hero.swimming) {
        hero.burnDuration = 0;
    }
    if (hero.burnDuration > 0) {
        hero.burnDuration -= FRAME_LENGTH;
        state.hero.ironSkinCooldown = Math.max(state.hero.ironSkinCooldown, 3000);
        // Burns expire twice as fast when standing on water.
        if (hero.wading) {
            hero.burnDuration -= FRAME_LENGTH;
        }
        if (hero.savedData.passiveTools.phoenixCrown > 0) {
            // If the hero has the phoenix crown, burning causes them to gain spirit instead of draining it an causing damage.
            if (!gameModifiers.nerfPhoenixCrown) {
                state.hero.magic += 5 * FRAME_LENGTH / 1000;
            }
        } else if (hero.savedData.ironSkinLife > 0) {
            // If the hero has iron skin, they only take half as much damage to the iron skin and nothing from life/magic.
            hero.savedData.ironSkinLife = Math.max(0, hero.savedData.ironSkinLife - state.hero.burnDamage / 2 * FRAME_LENGTH / 1000);
        } else if (state.hero.magic > 0) {
            // If the hero has magic, half of burning damage applies to magic and half applies to their life.
            const drainCoefficient = state.hero.magicRegen ? 4 / state.hero.magicRegen : 0;
            // This will result in a 1 second cooldown by default for a 2 second burn.
            state.hero.spendMagic(drainCoefficient * 10 * state.hero.burnDamage / 2 * FRAME_LENGTH / 1000, 10);
            // Having the barrier up will completely negate the burn damage applying to the hero's life.
            if (!hero.hasBarrier) {
                state.hero.life = Math.max(0, state.hero.life - state.hero.burnDamage / 2 * FRAME_LENGTH / 1000);
            }
        } else {
            // 100% of burn damage goes to life without iron skin or magic.
            state.hero.life = Math.max(0, state.hero.life - state.hero.burnDamage * FRAME_LENGTH / 1000);
        }
        if (hero.burnDuration % 40 === 0) {
            const hitbox = hero.getHitbox();
            addSparkleAnimation(state, hero.area, pad(hitbox, -4), { element: 'fire' });
        }
    }
    // Remove action targets from old areas.
    if (hero.actionTarget && hero.actionTarget.area !== hero.area && hero.actionTarget.area !== state.nextAreaInstance) {
        hero.actionTarget = null;
    }
    if (hero.grabObject && hero.action !== 'grabbing') {
        hero.grabObject = null;
    }
    if (hero.grabTile && hero.action !== 'grabbing') {
        hero.grabTile = null;
    }
    if (hero.action === 'pushing') {
        hero.animationTime -= 3 * FRAME_LENGTH / 4;
    }
    if (hero.action !== 'chargingCloneExplosion' && !hero.isUncontrollable) {
        hero.explosionTime = 0;
    }
    if (hero.action !== 'meditating' && hero.action !== 'getItem') {
        hero.spiritRadius = 0;
    }
    if (hero.toolCooldown > 0) {
        hero.toolCooldown -= FRAME_LENGTH;
        if (hero.toolCooldown <= 0) {
            hero.toolOnCooldown = null;
        }
    }
}

export function updatePrimaryHeroState(this: void, state: GameState, hero: Hero) {
    let activeAirBubbles: AirBubbles = null;
    for (const object of hero.area.objects) {
        if (object instanceof AirBubbles && object.status === 'normal') {
            if (hero.overlaps(object)) {
                activeAirBubbles = object;
                break;
            }
        }
        if (object.definition?.type === 'shieldingUnit' && hero.overlaps(object.getHitbox())) {
            hero.savedData.ironSkinLife = Math.min(hero.savedData.maxLife, hero.savedData.ironSkinLife + 2 * FRAME_LENGTH / 1000);
        }
    }
    if (state.hero.life <= 0
        && hero.action !== 'thrown' && hero.action !== 'knocked' && hero.action !== 'knockedHard'
        && hero.action !== 'jumpingDown' && hero.action !== 'falling' && hero.action !== 'fallen'
    ) {
        if (hero.area.enemies.find(enemy => enemy.definition.id === 'tombRivalBoss')
            && state.savedState.objectFlags.elderTomb
        ) {
            state.hero.life = 0.01;
            // The elder rescues you from defeat by the rival if certain conditions are met.
            prependScript(state, '{@elder.tombRescue}');
        } else {
            state.hero.life = 0;
            hero.action = null;
            hero.chargeTime = 0;
            hero.frozenDuration = 0;
            state.defeatState = {
                defeated: true,
                time: 0,
            };
            if (hero.heldChakram) {
                removeEffectFromArea(state, hero.heldChakram);
                delete hero.heldChakram;
            }
            hero.endInvisibility(state);
            if (state.hero.savedData.hasRevive) {
                state.reviveTime = state.fieldTime;
            }
            state.menuIndex = 0;
        }
    }
    // This value starts at 1 and decreases to 1 / 4 once the max of 16 magicRegen is reached.
    const drainCoefficient = state.hero.magicRegen ? 4 / state.hero.magicRegen : 0;
    const isInvisible = !![state.hero, ...state.hero.clones].find(hero => hero.isInvisible);
    const hasBarrier = !![state.hero, ...state.hero.clones].find(hero => hero.hasBarrier);

    if (hero.savedData.passiveTools.ironSkin && state.hero.magic >= state.hero.maxMagic) {
        state.hero.ironSkinCooldown -= FRAME_LENGTH;
        // Iron skin restored twice as quickly when still.
        if (!hero.action || hero.action === 'meditating') {
            state.hero.ironSkinCooldown -= FRAME_LENGTH;
        }
        if (state.hero.ironSkinCooldown <= 0) {
            state.hero.ironSkinCooldown = 1000;
            // Iron skin life can be increased over the normal max using shielding units, so don't reduce
            // iron skin life here it is over the max.

            hero.savedData.ironSkinLife = Math.max(hero.savedData.ironSkinLife, Math.min(hero.savedData.ironSkinLife + 0.25, hero.savedData.maxLife / 4));
        }
    }

    if (isInvisible) {
        let drainAmount = drainCoefficient * 4 * FRAME_LENGTH / 1000;
        if (state.hero.activeBarrierBurst?.element) {
            drainAmount *= 2;
        }
        state.hero.actualMagicRegen = Math.max(-20, Math.min(0, state.hero.actualMagicRegen) - drainAmount);
        state.hero.increaseMagicRegenCooldown(drainCoefficient * FRAME_LENGTH / 2);
    } else if (hasBarrier) {
        if (state.hero.invulnerableFrames > 0) {
            // Regenerate no magic during iframes after the barrier is damaged.
            state.hero.actualMagicRegen = 0;
        } else {
            state.hero.actualMagicRegen = !state.hero.action ? 2 : 1;
        }
    }
    const isHoldingBreath = !state.hero.savedData.passiveTools.waterBlessing && isUnderwater(state, state.hero);
    // Corrosive areas drain mana unless you have the water blessing.
    const isWaterDrainingMagic = !state.hero.savedData.passiveTools.waterBlessing && state.areaSection?.isCorrosive;
    if (activeAirBubbles) {
        // "airBubbles" are actually going to be "Spirit Recharge" points that regenerate mana quickly.
        state.hero.magic = Math.max(0, state.hero.magic);
        activeAirBubbles.consumeCharge(state);

        if (activeAirBubbles.charge > 0) {
            state.hero.actualMagicRegen = Math.max(5, state.hero.actualMagicRegen);
        } else if (isWaterDrainingMagic || isHoldingBreath || isInvisible) {
            // Magic regen is 0 while magic is being drained but the hero is standing on
            // a depleted spirit recharge point.
            state.hero.actualMagicRegen = 0;
        }
    } else if (isWaterDrainingMagic) {
        state.hero.actualMagicRegen = Math.min(-20, state.hero.actualMagicRegen);
    } else if (isHoldingBreath) {
        state.hero.actualMagicRegen = Math.min(-1, state.hero.actualMagicRegen);
    } else if (!isInvisible && !hasBarrier) {
        state.hero.actualMagicRegen = !state.hero.action ? 2 * state.hero.magicRegen : state.hero.magicRegen;
        // Even if the hero has 0 magicRegen, they are still able to regenerate magic up to 0.
        if (state.hero.magic < 0) {
            state.hero.actualMagicRegen = Math.max(1, state.hero.actualMagicRegen);
        }
    }
    const isTryingToRun = state.hero.action === 'walking' && state.hero.isRunning;
    const isActuallyRunning = isTryingToRun && state.hero.magic > 0;
    const preventCooldownRegeneration = isInvisible
        || state.hero.toolCooldown > 0 || state.hero.action === 'roll' || isActuallyRunning
        || (!state.hero.savedData.passiveTools.phoenixCrown && hero.burnDuration > 0);
    if (state.hero.magicRegenCooldown > 0 && !preventCooldownRegeneration) {
        // Foggy areas double spirit energy cooldown.
        const cooldownRecoverSpeed = state.areaSection?.isFoggy ? FRAME_LENGTH / 2 : FRAME_LENGTH;
        const recoveryFactor = Math.max(0, (state.hero.magicRegenCooldown - cooldownRecoverSpeed)) / state.hero.magicRegenCooldown;
        state.hero.recentMagicSpent = recoveryFactor * state.hero.recentMagicSpent;
        state.hero.magicRegenCooldown -= cooldownRecoverSpeed;
    } else if (!preventCooldownRegeneration) {
        state.hero.recentMagicSpent = 0;
    }
    if (!state.hero.action && state.hero.actualMagicRegen >= 0) {
        // Double regeneration rate while idle.
        if (state.hero.magicRegenCooldown <= 0) {
            state.hero.magic += 2 * state.hero.actualMagicRegen * FRAME_LENGTH / 1000 * gameModifiers.spiritEnergyRegeneration;
        }
    } else if (isActuallyRunning) {
        // Spirit regeneration does not apply while running, but depletion still takes effect.
        if (state.hero.actualMagicRegen < 0) {
            state.hero.magic += state.hero.actualMagicRegen * FRAME_LENGTH / 1000;
        }
        // Slowly expend spirit energy while running.
        state.hero.spendMagic(drainCoefficient * 5 * FRAME_LENGTH / 1000, drainCoefficient * FRAME_LENGTH / 5);
    } else if (state.hero.actualMagicRegen < 0) {
        // Magic is being drained for some reason
        state.hero.magic += state.hero.actualMagicRegen * FRAME_LENGTH / 1000;
    } else if (!isTryingToRun) {
        // Normal regeneration rate, this doesn't apply when the hero is trying to run.
        if (state.hero.magicRegenCooldown <= 0) {
            state.hero.magic += state.hero.actualMagicRegen * FRAME_LENGTH / 1000 * gameModifiers.spiritEnergyRegeneration;
        }
    }
    if (state.hero.clones.length) {
        // Clones drain 2 magic per second but do not effect cooldown time.
        state.hero.spendMagic(2 * drainCoefficient * state.hero.clones.length * FRAME_LENGTH / 1000, 0);
    }
    // Meditation grants 3 additional spirit energy per second.
    if (hero.action === 'meditating' && state.hero.magicRegenCooldown <= 0) {
        state.hero.magic += 3 * FRAME_LENGTH / 1000;
    }
    //if (hero.action !== 'knocked' && hero.action !== 'thrown') {
        // At base mana regen, using cat eyes reduces your mana very slowly unless you are stationary.
        let targetLightRadius = 20, minLightRadius = 20;
        if (state.areaSection.dark) {
            const coefficient = Math.max(1, 80 / state.areaSection.dark);
            minLightRadius *= coefficient;
            if (state.hero.savedData.passiveTools.trueSight > 0) {
                // True sight gives better vision and consumes less spirit energy.
                state.hero.spendMagic(drainCoefficient * 2 * FRAME_LENGTH / 1000 / coefficient, 0);
                targetLightRadius = 200 * coefficient;
                minLightRadius += 20 * coefficient;
            } else if (state.hero.savedData.passiveTools.catEyes > 0) {
                state.hero.spendMagic(drainCoefficient * 4 * FRAME_LENGTH / 1000 / coefficient, 0);
                targetLightRadius = 70 * coefficient;
                minLightRadius += 10 * coefficient;
            }
            // Light radius starts dropping when spirit energy < 50% full.
            targetLightRadius = Math.max(minLightRadius,
                Math.floor(targetLightRadius * Math.min(1, 2 * state.hero.magic / state.hero.maxMagic)));
        }
        if (state.hero.lightRadius > targetLightRadius) {
            state.hero.lightRadius = Math.max(targetLightRadius, state.hero.lightRadius - 2);
        } else if (state.hero.lightRadius < targetLightRadius) {
            state.hero.lightRadius = Math.min(targetLightRadius, state.hero.lightRadius + 2);
        }
    //}
    if (editingState.isEditing && state.hero.magicRegen) {
        state.hero.magic = state.hero.maxMagic;
    }
    if (state.hero.magic <= 0) {
        for (const hero of [state.hero, ...state.hero.clones]) {
            hero.shatterBarrier(state);
            hero.isInvisible = false;
        }
        /*if (state.hero.clones.length) {
            state.hero.x = hero.x;
            state.hero.y = hero.y;
            removeAllClones(state);
        }*/
        if (state.hero.magic <= -2 && isHoldingBreath) {
            hero.onHit(state, {damage: 1, source: null});
        }
    }
    if (state.hero.magic > state.hero.maxMagic) {
        state.hero.magic = state.hero.maxMagic;
    } else if (state.hero.magic < -10) {
        state.hero.magic = -10;
    }
    state.location.x = state.hero.x;
    state.location.y = state.hero.y;
}


function checkForEnemyDamage(state: GameState, hero: Hero) {
    if (hero.action === 'roll' || hero.action === 'getItem' || hero.invulnerableFrames > 0 || state.hero.isInvisible) {
        return;
    }
    if (!hero.area) {
        debugger;
    }
    const heroHitbox = hero.getHitbox();
    for (const enemy of hero.area.objects) {
        if (!(enemy instanceof Enemy) || enemy.invulnerableFrames > 0
            || enemy.status === 'hidden' || enemy.status === 'gone' || enemy.status === 'off'
            || enemy.mode === 'hidden'
            || enemy.isDefeated
        ) {
            continue;
        }
        const touchHit = enemy.enemyDefinition.touchDamage
            ? { damage: enemy.enemyDefinition.touchDamage } : enemy.touchHit;
        if (!touchHit) {
            continue;
        }
        const enemyHitbox = enemy.getTouchHitbox();
        if (boxesIntersect(heroHitbox, enemyHitbox)) {
            let dx = (heroHitbox.x + heroHitbox.w / 2) - (enemyHitbox.x + enemyHitbox.w / 2);
            let dy = (heroHitbox.y + heroHitbox.h / 2) - (enemyHitbox.y + enemyHitbox.h / 2);
            if (!dx && !dy) {
                dx = -directionMap[hero.d][0];
                dy = -directionMap[hero.d][1];
            } else {
                const mag = Math.sqrt(dx*dx + dy*dy);
                dx /= mag;
                dy /= mag;
            }
            const hitResult = hero.onHit(state, {
                ...touchHit,
                source: enemy,
                knockback: {
                    // vx: - 4 * directionMap[hero.d][0],
                    // vy: - 4 * directionMap[hero.d][1],
                    vx: 4 * dx,
                    vy: 4 * dy,
                    vz: 2,
                },
            });

            if (hitResult.returnHit) {
                enemy.onHit(state, hitResult.returnHit);
            } else if (hitResult.knockback) {
                enemy.knockBack(state, hitResult.knockback);
            }
        }
    }
}

function checkToStartScreenTransition(state: GameState, hero: Hero) {
    // Check for transition to other areas/area sections.
    const isMovingThroughZoneDoor = hero.actionTarget?.definition?.type === 'door'
        && hero.actionTarget.definition.targetZone
        && hero.actionTarget.definition.targetObjectId
    // Do not trigger the scrolling transition when traveling through a zone door.
    if ((!editingState.isEditing && hero.isOverPit)
        || state.nextAreaSection || state.nextAreaInstance || isMovingThroughZoneDoor
    ) {
        return;
    }

    const { w, h, section } = getAreaSize(state);
    // We only move to the next area if the player is moving in the direction of that area.
    // dx/dy handles most cases, but in some cases like moving through doorways we also need to check
    // hero.actionDx
    if (hero.x < 0 && (hero.vx < 0 || hero.actionDx < 0)) {
        state.location.areaGridCoords = {
            x: (state.location.areaGridCoords.x + state.areaGrid[0].length - 1) % state.areaGrid[0].length,
            y: state.location.areaGridCoords.y,
        };
        scrollToArea(state, getAreaFromLocation(state.location), 'left');
        state.location = getFullZoneLocation(state.location);
        return;
    } else if (hero.x + hero.w > w && (hero.vx > 0 || hero.actionDx > 0)) {
        state.location.areaGridCoords = {
            x: (state.location.areaGridCoords.x + 1) % state.areaGrid[0].length,
            y: state.location.areaGridCoords.y,
        };
        scrollToArea(state, getAreaFromLocation(state.location), 'right');
        state.location = getFullZoneLocation(state.location);
        return;
    } else if (hero.x < section.x && (hero.vx < 0 || hero.actionDx < 0)) {
        setNextAreaSection(state, 'left');
        return;
    } else if (hero.x + hero.w > section.x + section.w && (hero.vx > 0 || hero.actionDx > 0)) {
        setNextAreaSection(state, 'right');
        return;
    }
    //const isHeroMovingDown = (hero.vy > 0 || hero.actionDy > 0 || (hero.action === 'jumpingDown' && hero.vy > 0));
    const isHeroMovingDown = hero.vy > 0 || hero.actionDy > 0;
    if (hero.y < 0 && (hero.vy < 0 || hero.actionDy < 0)) {
        state.location.areaGridCoords = {
            x: state.location.areaGridCoords.x,
            y: (state.location.areaGridCoords.y + state.areaGrid.length - 1) % state.areaGrid.length,
        };
        scrollToArea(state, getAreaFromLocation(state.location), 'up');
        state.location = getFullZoneLocation(state.location);
    } else if (hero.y + hero.h > h && isHeroMovingDown) {
        state.location.areaGridCoords = {
            x: state.location.areaGridCoords.x,
            y: (state.location.areaGridCoords.y + 1) % state.areaGrid.length,
        };
        scrollToArea(state, getAreaFromLocation(state.location), 'down');
        state.location = getFullZoneLocation(state.location);
    } else if (hero.y < section.y && (hero.vy < 0 || hero.actionDy < 0)) {
        setNextAreaSection(state, 'up');
    } else if (hero.y + hero.h > section.y + section.h && isHeroMovingDown) {
        setNextAreaSection(state, 'down');
    }
}
