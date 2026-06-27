import {addSparkleAnimation} from 'app/content/effects/animationEffect';
import {AirBubbles} from 'app/content/objects/airBubbles';
import {editingState} from 'app/development/editingState';
import {FRAME_LENGTH, gameModifiers} from 'app/gameConstants';
import {playAreaSound} from 'app/musicController';
import {showDefeatedScene} from 'app/scenes/defeated/showDefeatedScene';
import {prependScript} from 'app/scriptEvents';
import {isToolButtonPressed} from 'app/useTool';
import {isUnderwater} from 'app/utils/actor';
import {removeAllClones} from 'app/utils/area';
import {pad} from 'app/utils/index';


export function updateGenericHeroState(this: void, state: GameState, hero: Hero, interactive: boolean) {
    // Round to 1e-6 to ignore minor floating point errors.
    state.hero.life = ((state.hero.life * 1000000) | 0) / 1000000;
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
    // Hero takes one damage every half second while in a hot room.
    if (!editingState.isEditing && state.areaSection?.isHot) {
        hero.applyBurn(state, 1, 500);
    }
    // Life is restored as soon as it is visibly lost in the Dream world.
    if (state.location.zoneKey === 'dream' && hero.displayLife < hero.savedData.maxLife) {
        hero.life = hero.savedData.maxLife;
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
    if (hero.isInvisible && !isToolButtonPressed(state, 'cloak') && interactive) {
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
            // If the hero has the phoenix crown, burning causes them to gain spirit.
            state.hero.magic += 5 * FRAME_LENGTH / 1000;
        }
        //let drainCoefficient = state.hero.magicRegen ? 4 / state.hero.magicRegen : 0;
        let drainCoefficient = 1;
        if (state.hero.savedData.passiveTools.fireBlessing >= 2) {
            drainCoefficient /= 2;
        }
        // Controls how frequently flame effects appear.
        let modValue = 100;
        if (hero.hasBarrier) {
            // Burning no longer prevents magic regen cooldown, so the 40ms added here will get reduced by 20ms each frame.
            state.hero.spendMagic(state, drainCoefficient * 20 * state.hero.burnDamage * FRAME_LENGTH / 1000, 40);
        } else if (hero.savedData.ironSkinLife > 0) {
            // If the hero has iron skin, they only take half as much damage to the iron skin and nothing from life/magic.
            hero.savedData.ironSkinLife = Math.max(0, hero.savedData.ironSkinLife - state.hero.burnDamage / 2 * FRAME_LENGTH / 1000);
        } else if (state.hero.savedData.passiveTools.fireBlessing && state.hero.magic > 0) {
            // The fire blessing causes burns to apply to magic instead of life, but does not increase cooldown.
            state.hero.spendMagic(state, drainCoefficient * 20 * state.hero.burnDamage * FRAME_LENGTH / 1000, 0);
        } else {
            // 100% of burn damage goes to life without iron skin or magic.
            state.hero.life = Math.max(0, state.hero.life - state.hero.burnDamage * FRAME_LENGTH / 1000);
            modValue = 40;
        }
        if (state.fieldTime % modValue === 0) {
            const hitbox = hero.getHitbox();
            addSparkleAnimation(state, hero.area, pad(hitbox, -4), { element: 'fire' });
        }
    }
    if (state.hero.shockDuration > 0 && state.fieldTime % 80 === 20) {
        const hitbox = hero.getHitbox();
        // This hitbox is manually tuned until I thought the effect looked right.
        addSparkleAnimation(state, hero.area, {x: 2, y: -4, w: hitbox.w - 4, h: hitbox.h}, { element: 'lightning', target: hero });
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
    if (hero.isMagicDisabled) {
        hero.magic = 0;
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
            showDefeatedScene(state);
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
        state.hero.increaseMagicRegenCooldown(state, drainCoefficient * FRAME_LENGTH / 2);
    } else if (hasBarrier) {
        if (state.hero.invulnerableFrames > 0) {
            // Regenerate no magic during iframes after the barrier is damaged.
            state.hero.actualMagicRegen = 0;
        } else {
            state.hero.actualMagicRegen = !state.hero.action ? 2 : 1;
        }
    }
    const isHoldingBreath = isUnderwater(state, state.hero);
    // Corrosive areas drain mana unless you have the water blessing.
    let waterDrainingMagicSpeed = (isHoldingBreath || state.areaSection?.isCorrosive) ? 1 : 0;
    if (state.hero.savedData.passiveTools.waterBlessing >= 2) {
        waterDrainingMagicSpeed = 0;
    } else if (state.hero.savedData.passiveTools.waterBlessing >= 1) {
        waterDrainingMagicSpeed /= 2;
    }
    if (activeAirBubbles) {
        // "airBubbles" are actually going to be "Spirit Recharge" points that regenerate mana quickly.
        state.hero.magic = Math.max(0, state.hero.magic);
        activeAirBubbles.consumeCharge(state);

        if (activeAirBubbles.charge > 0) {
            state.hero.actualMagicRegen = Math.max(5, state.hero.actualMagicRegen);
        } else if (waterDrainingMagicSpeed > 0 || isHoldingBreath || isInvisible) {
            // Magic regen is 0 while magic is being drained but the hero is standing on
            // a depleted spirit recharge point.
            state.hero.actualMagicRegen = 0;
        }
    } else if (state.areaSection?.isCorrosive) {
        state.hero.actualMagicRegen = Math.min(-20 * waterDrainingMagicSpeed, isInvisible ? state.hero.actualMagicRegen : 0);
    } else if (isHoldingBreath) {
        state.hero.actualMagicRegen = Math.min(-2 * waterDrainingMagicSpeed, isInvisible ? state.hero.actualMagicRegen : 0);
    } else if (!isInvisible && !hasBarrier) {
        state.hero.actualMagicRegen = !state.hero.action ? 2 * state.hero.magicRegen : state.hero.magicRegen;
        // Even if the hero has 0 magicRegen, they are still able to regenerate magic up to 0.
        if (state.hero.magic < 0) {
            state.hero.actualMagicRegen = Math.max(1, state.hero.actualMagicRegen);
        }
    }
    // No magic regen cooldown if a magic potion is in effect or in the dream world.
    if (state.hero.magicPotionExpiresAt > state.fieldTime || state.location.zoneKey === 'dream') {
        state.hero.magicRegenCooldown = 0;
    }
    const isTryingToRun = state.hero.action === 'walking' && state.hero.isRunning;
    const isActuallyRunning = isTryingToRun && state.hero.magic > 0;
    const preventCooldownRegeneration = isInvisible
        || state.hero.toolCooldown > 0 || state.hero.action === 'roll' || isActuallyRunning;
    if (state.hero.shockDuration > 0) {
        state.hero.shockDuration -= FRAME_LENGTH;
    } else if (state.hero.magicRegenCooldown > 0 && !preventCooldownRegeneration) {
        // Foggy areas double spirit energy cooldown.
        const cooldownRecoverSpeed = state.areaSection?.isFoggy ? FRAME_LENGTH / 2 : FRAME_LENGTH;
        const recoveryFactor = Math.max(0, (state.hero.magicRegenCooldown - cooldownRecoverSpeed)) / state.hero.magicRegenCooldown;
        state.hero.recentMagicSpent = recoveryFactor * state.hero.recentMagicSpent;
        state.hero.magicRegenCooldown -= cooldownRecoverSpeed;
    } else if (!preventCooldownRegeneration) {
        state.hero.recentMagicSpent = 0;
    }
    // Trying to run and the shock status effect both prevent magic from regnerating.
    const canRegenerateMagic = !isTryingToRun && state.hero.shockDuration <= 0 && state.hero.magicRegenCooldown <= 0;
    if (!state.hero.action && state.hero.actualMagicRegen >= 0) {
        // Double regeneration rate while idle.
        if (canRegenerateMagic) {
            state.hero.magic += 2 * state.hero.actualMagicRegen * FRAME_LENGTH / 1000 * gameModifiers.spiritEnergyRegeneration;
        }
    } else if (isActuallyRunning) {
        // Spirit regeneration does not apply while running, but depletion still takes effect.
        if (state.hero.actualMagicRegen < 0) {
            state.hero.magic += state.hero.actualMagicRegen * FRAME_LENGTH / 1000;
        }
        // Slowly expend spirit energy while running.
        state.hero.spendMagic(state, drainCoefficient * 5 * FRAME_LENGTH / 1000, drainCoefficient * FRAME_LENGTH / 5);
    } else if (state.hero.actualMagicRegen < 0) {
        // Magic is being drained for some reason
        state.hero.magic += state.hero.actualMagicRegen * FRAME_LENGTH / 1000;
    } else if (canRegenerateMagic) {
        // Normal regeneration rate.
        state.hero.magic += state.hero.actualMagicRegen * FRAME_LENGTH / 1000 * gameModifiers.spiritEnergyRegeneration;
    }
    if (state.hero.clones.length) {
        // Clones drain 2 magic per second but do not effect cooldown time.
        state.hero.spendMagic(state, 2 * drainCoefficient * state.hero.clones.length * FRAME_LENGTH / 1000, 0);
    }
    // Meditation grants 3 additional spirit energy per second.
    if (hero.action === 'meditating' && canRegenerateMagic) {
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
                state.hero.spendMagic(state, drainCoefficient * 2 * FRAME_LENGTH / 1000 / coefficient, 0);
                targetLightRadius = 200 * coefficient;
                minLightRadius += 20 * coefficient;
            } else if (state.hero.savedData.passiveTools.catEyes > 0) {
                state.hero.spendMagic(state, drainCoefficient * 4 * FRAME_LENGTH / 1000 / coefficient, 0);
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
