import {
    getAreaFromLocation, getAreaSize, removeEffectFromArea,
    removeObjectFromArea, scrollToArea, setNextAreaSection,
    swapHeroStates,
} from 'app/content/areas';
import { AirBubbles } from 'app/content/objects/airBubbles';
import { Enemy } from 'app/content/enemy';
import { editingState } from 'app/development/tileEditor';
import { FRAME_LENGTH, GAME_KEY } from 'app/gameConstants';
import {
    wasGameKeyPressedAndReleased, wasGameKeyPressed
} from 'app/keyCommands';
import { checkForFloorEffects } from 'app/movement/checkForFloorEffects';
import { prependScript } from 'app/scriptEvents';
import { updateHeroSpecialActions } from 'app/updateHeroSpecialActions';
import { updateHeroStandardActions } from 'app/updateHeroStandardActions';
import {
    directionMap,
} from 'app/utils/field';
import { boxesIntersect } from 'app/utils/index';

import {
    GameState, Hero,
} from 'app/types';

export function updateAllHeroes(this: void, state: GameState) {
    // Switching clones is done outside of updateHero, otherwise the switch gets processed by each clone.
    if (state.hero.clones.length
        && !state.hero.pickUpObject && (
            (state.hero.leftTool === 'clone' && wasGameKeyPressedAndReleased(state, GAME_KEY.LEFT_TOOL))
            || (state.hero.rightTool === 'clone' && wasGameKeyPressedAndReleased(state, GAME_KEY.RIGHT_TOOL))
    )) {
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
    if (state.hero.clones.length && state.hero.cloneToolReleased && (
        (state.hero.leftTool === 'clone' && wasGameKeyPressed(state, GAME_KEY.LEFT_TOOL))
            || (state.hero.rightTool === 'clone' && wasGameKeyPressed(state, GAME_KEY.RIGHT_TOOL))
    )) {
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
    for (let i = 0; i < state.hero.clones.length; i++) {
        const clone = state.hero.clones[i];
        updateHero(state, clone);
    }
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
    updateHero(state, state.hero);
    const skipFrame = state.hero.action === 'meditating' && (state.hero.animationTime % 100) !== 0;
    if (!skipFrame) {
        updatePrimaryHeroState(state, state.hero);
    }
    checkToStartScreenTransition(state, state.hero);
}

export function updateHero(this: void, state: GameState, hero: Hero) {
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
    updateGenericHeroState(state, hero);
}


export function updateGenericHeroState(this: void, state: GameState, hero: Hero) {
    if (hero.rollCooldown > 0) {
        hero.rollCooldown -= FRAME_LENGTH;
    }
    if (hero.invulnerableFrames > 0) {
        hero.invulnerableFrames--;
    }
    if (hero.frozenDuration > 0) {
        hero.frozenDuration -= FRAME_LENGTH;
    } else {
        hero.animationTime += FRAME_LENGTH;
        if (hero.action === 'walking' && hero.isRunning && hero.magic >= 0) {
            hero.animationTime += FRAME_LENGTH / 2;
        }
        if (hero.passiveTools.ironSkin) {
            hero.ironSkinCooldown -= FRAME_LENGTH;
            // Iron skin restored twice as quickly when still.
            if (!hero.action || hero.action === 'meditating') {
                hero.ironSkinCooldown -= FRAME_LENGTH;
            }
            if (hero.ironSkinCooldown <= 0) {
                hero.ironSkinCooldown = 1000;
                hero.ironSkinLife = Math.min(hero.ironSkinLife + 0.25, hero.maxLife / 4);
            }
        }
    }
    // Remove action targets from old areas.
    if (hero.actionTarget && hero.actionTarget.area !== hero.area) {
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
    if (hero.action !== 'meditating') {
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
    // Hero takes one damage every half second while in a hot room without the fire blessing.
    if (!editingState.isEditing && hero.area?.isHot && !hero.passiveTools.fireBlessing) {
        if (state.time % 500 === 0) {
            hero.onHit(state, {damage: 1, canDamageRollingHero: true, element: 'fire'});
            // Stop updating this hero if it was destroyed by taking damage,
            if (!hero.area) {
                return;
            }
        }
    }
    let activeAirBubbles: AirBubbles = null;
    for (const object of hero.area.objects) {
        if (object instanceof AirBubbles && object.status === 'normal') {
            if (hero.overlaps(object)) {
                activeAirBubbles = object;
                break;
            }
        }
    }
    if (hero.life <= 0
        && hero.action !== 'thrown' && hero.action !== 'knocked' && hero.action !== 'knockedHard'
        && hero.action !== 'jumpingDown' && hero.action !== 'falling' && hero.action !== 'fallen'
    ) {
        if (hero.area.enemies.find(enemy => enemy.definition.id === 'tombRivalBoss')
            && state.savedState.objectFlags.elderTomb
        ) {
            hero.life = 0.01;
            // The elder rescues you from defeat by the rival if certain conditions are met.
            prependScript(state, '{@elder.tombRescue}');
        } else {
            hero.life = 0;
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
            if (state.hero.hasRevive) {
                state.reviveTime = state.fieldTime;
            }
            state.menuIndex = 0;
        }
    }
    // This value starts at 1 and decreases to 1 / 4 once the max of 16 magicRegen is reached.
    const drainCoefficient = state.hero.magicRegen ? 4 / state.hero.magicRegen : 0;
    if (state.hero.isInvisible) {
        state.hero.actualMagicRegen = Math.max(-20, state.hero.actualMagicRegen - drainCoefficient * 4 * FRAME_LENGTH / 1000);
    } else if (state.hero.hasBarrier) {
        if (state.hero.invulnerableFrames > 0) {
            // Regenerate no magic during iframes after the barrier is damaged.
            state.hero.actualMagicRegen = 0;
        } else {
            state.hero.actualMagicRegen = !state.hero.action ? 2 : 1;
        }
    }
    const isHoldingBreath = !state.hero.passiveTools.waterBlessing && state.zone.surfaceKey;
    // The waterfall tower area drains mana unless you have the water blessing.
    // Might make more sense to have this related to the water tiles in the material world or have
    // it be configurable on the area like `darkness` but for now just using the zone key is fine.
    const isWaterDrainingMagic = !state.hero.passiveTools.waterBlessing && state.zone.key === 'waterfallTower';
    if (activeAirBubbles) {
        // "airBubbles" are actually going to be "Spirit Recharge" points that regenerate mana quickly.
        state.hero.magic = Math.max(0, state.hero.magic);
        activeAirBubbles.consumeCharge(state);

        if (activeAirBubbles.charge > 0) {
            state.hero.actualMagicRegen = Math.max(5, state.hero.actualMagicRegen);
        } else if (isWaterDrainingMagic || isHoldingBreath || state.hero.isInvisible) {
            // Magic regen is 0 while magic is being drained but the hero is standing on
            // a depleted spirit recharge point.
            state.hero.actualMagicRegen = 0;
        }
    } else if (isWaterDrainingMagic) {
        state.hero.actualMagicRegen = Math.min(-20, state.hero.actualMagicRegen);
    } else if (isHoldingBreath) {
        state.hero.actualMagicRegen = Math.min(-1, state.hero.actualMagicRegen);
    } else if (!state.hero.isInvisible && !state.hero.hasBarrier) {
        state.hero.actualMagicRegen = !state.hero.action ? 2 * state.hero.magicRegen : state.hero.magicRegen;
    }
    if (!state.hero.action && state.hero.actualMagicRegen > 0) {
        // Double regeneration rate while idle.
        state.hero.magic += 2 * state.hero.actualMagicRegen * FRAME_LENGTH / 1000;
    } else if (state.hero.action === 'walking' && state.hero.isRunning) {
        // Spirit regeneration does not apply while running, but depletion still takes effect.
        if (state.hero.actualMagicRegen < 0) {
            state.hero.magic += state.hero.actualMagicRegen * FRAME_LENGTH / 1000;
        }
        // Slowly expend spirit energy while running.
        if (state.hero.magic >= 0) {
            state.hero.magic -= drainCoefficient * 5 * FRAME_LENGTH / 1000;
        }
    } else {
        // Normal regeneration rate.
        state.hero.magic += state.hero.actualMagicRegen * FRAME_LENGTH / 1000;
    }
    // Clones drain 2 magic per second.
    state.hero.magic -= 2 * drainCoefficient * state.hero.clones.length * FRAME_LENGTH / 1000;
    // Meditation grants 3 additional spirit energy per second.
    if (hero.action === 'meditating') {
        state.hero.magic += 3 * FRAME_LENGTH / 1000;
    }
    //if (hero.action !== 'knocked' && hero.action !== 'thrown') {
        // At base mana regen, using cat eyes reduces your mana very slowly unless you are stationary.
        let targetLightRadius = 20, minLightRadius = 20;
        if (hero.area.dark) {
            const coefficient = 100 / hero.area.dark;
            minLightRadius *= coefficient;
            if (state.hero.passiveTools.trueSight > 0) {
                // True sight gives better vision and consumes less spirit energy.
                state.hero.magic -= drainCoefficient * 2 * FRAME_LENGTH / 1000 / coefficient;
                targetLightRadius = 320 * coefficient;
                minLightRadius += 20 * coefficient;
            } else if (state.hero.passiveTools.catEyes > 0) {
                state.hero.magic -= drainCoefficient * 4 * FRAME_LENGTH / 1000 / coefficient;
                targetLightRadius = 80 * coefficient;
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
    if (state.hero.magic < 0) {
        state.hero.shatterBarrier(state);
        state.hero.isInvisible = false;
        /*if (state.hero.clones.length) {
            state.hero.x = hero.x;
            state.hero.y = hero.y;
            removeAllClones(state);
        }*/
        if (isHoldingBreath) {
            hero.onHit(state, {damage: 1});
        }
    }
    if (state.hero.magic > state.hero.maxMagic) {
        state.hero.magic = state.hero.maxMagic;
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
    const heroHitbox = hero.getHitbox(state);
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
        const enemyHitbox = enemy.getHitbox(state);
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
    } else if (hero.x + hero.w > w && (hero.vx > 0 || hero.actionDx > 0)) {
        state.location.areaGridCoords = {
            x: (state.location.areaGridCoords.x + 1) % state.areaGrid[0].length,
            y: state.location.areaGridCoords.y,
        };
        scrollToArea(state, getAreaFromLocation(state.location), 'right');
    } else if (hero.x < section.x && (hero.vx < 0 || hero.actionDx < 0)) {
        setNextAreaSection(state, 'left');
    } else if (hero.x + hero.w > section.x + section.w && (hero.vx > 0 || hero.actionDx > 0)) {
        setNextAreaSection(state, 'right');
    }
    //const isHeroMovingDown = (hero.vy > 0 || hero.actionDy > 0 || (hero.action === 'jumpingDown' && hero.vy > 0));
    const isHeroMovingDown = hero.vy > 0 || hero.actionDy > 0;
    if (hero.y < 0 && (hero.vy < 0 || hero.actionDy < 0)) {
        state.location.areaGridCoords = {
            x: state.location.areaGridCoords.x,
            y: (state.location.areaGridCoords.y + state.areaGrid.length - 1) % state.areaGrid.length,
        };
        scrollToArea(state, getAreaFromLocation(state.location), 'up');
    } else if (hero.y + hero.h > h && isHeroMovingDown) {
        state.location.areaGridCoords = {
            x: state.location.areaGridCoords.x,
            y: (state.location.areaGridCoords.y + 1) % state.areaGrid.length,
        };
        scrollToArea(state, getAreaFromLocation(state.location), 'down');
    } else if (hero.y < section.y && (hero.vy < 0 || hero.actionDy < 0)) {
        setNextAreaSection(state, 'up');
    } else if (hero.y + hero.h > section.y + section.h && isHeroMovingDown) {
        setNextAreaSection(state, 'down');
    }
}
