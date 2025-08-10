import {updateAR} from 'app/arGames/arGame';
import {addObjectFallAnimation, addEnemyFallAnimation, addSplashAnimation} from 'app/content/effects/animationEffect';
import {Enemy} from 'app/content/enemy';
import {setEquippedElement} from 'app/content/menu';
import {editingState} from 'app/development/editingState';
import {FRAME_LENGTH, GAME_KEY} from 'app/gameConstants';
import {addAmbientEffects} from 'app/scenes/field/addAmbientEffects';
import {wasGameKeyPressed} from 'app/userInput';
import {updateAllHeroes} from 'app/updateActor';
import {updateCamera} from 'app/updateCamera';
import {checkIfAllEnemiesAreDefeated} from 'app/utils/checkIfAllEnemiesAreDefeated';
import {getCompositeBehaviors} from 'app/utils/getBehaviors';
import {rectanglesOverlap} from 'app/utils/index';
import {getFieldInstanceAndParts, removeObjectFromArea} from 'app/utils/objects';

export function updateField(this: void, state: GameState) {
    if (editingState.isEditing) {
        updateAllHeroes(state);
        updateCamera(state);
        return;
    }
    state.fieldTime += FRAME_LENGTH;
    state.hero.savedData.playTime += FRAME_LENGTH;
    // Remove completed screenshakes. If this is not checked each time the fieldTime is advanced
    // then the shakes will appear to oscillate out of control when fieldTime exceeds their endTime.
    for (let i = 0; i < state.screenShakes.length; i++) {
        const endTime = state.screenShakes[i].endTime;
        if (endTime && state.fieldTime >= endTime) {
            state.screenShakes.splice(i--, 1);
        }
    }
    const targetFadeLevel = Math.max(state.areaSection?.dark ?? 0, state.nextAreaSection?.dark ?? 0) / 100;
    if (state.fadeLevel < targetFadeLevel) {
        state.fadeLevel = Math.min(state.fadeLevel + 0.05, targetFadeLevel);
    } else if (state.fadeLevel > targetFadeLevel){
        state.fadeLevel = Math.max(state.fadeLevel - 0.05, targetFadeLevel);
    }
    const targetHotLevel = ((!state.nextAreaSection && state.areaSection?.isHot) || state.nextAreaSection?.isHot) ? 1 : 0;
    if (state.hotLevel < targetHotLevel) {
        state.hotLevel = Math.min(state.hotLevel + 0.05, targetHotLevel);
    } else if (state.hotLevel > targetHotLevel){
        state.hotLevel = Math.max(state.hotLevel - 0.05, targetHotLevel);
    }
    // If any priority objects are defined for the area, only process them
    // until there are none remaining in the queue.
    if (state.areaInstance.priorityObjects.length) {
        const priorityObjects = state.areaInstance.priorityObjects.pop();
        for (let i = 0; i < priorityObjects.length; i++) {
            if (state.areaInstance.objects.indexOf(priorityObjects[i] as ObjectInstance) < 0
                && state.areaInstance.effects.indexOf(priorityObjects[i] as EffectInstance) < 0
            ) {
                priorityObjects.splice(i--, 1);
                continue;
            }
            priorityObjects[i].update?.(state);
        }
        if (priorityObjects.length) {
            state.areaInstance.priorityObjects.push(priorityObjects);
        }
        return;
    }
    addAmbientEffects(state);
    updateAllHeroes(state);
    updateCamera(state);
    if (wasGameKeyPressed(state, GAME_KEY.PREVIOUS_ELEMENT)) {
        switchElement(state, -1);
    } else if (wasGameKeyPressed(state, GAME_KEY.NEXT_ELEMENT)) {
        switchElement(state, 1);
    }
    removeDefeatedEnemies(state, state.alternateAreaInstance);
    removeDefeatedEnemies(state, state.areaInstance);
    updateAreaObjects(state, state.areaInstance);
    if (state.nextAreaInstance) {
        updateAreaObjects(state, state.nextAreaInstance);
    }
    updateAreaObjects(state, state.alternateAreaInstance);
    updateAR(state)
}
export function updateAreaObjects(this: void, state: GameState, area: AreaInstance) {
    if (state.hero.action === 'preparingSomersault' && state.fieldTime % 200 !== 0) {
        return;
    }
    const isScreenTransitioning = state.nextAreaInstance || state.nextAreaSection;
    // Time passes slowly for everything but the astral projection while meditating.
    const skipModulus = state.hero.savedData.passiveTools.spiritSight ? 100 : 40;
    const skipFrame = state.hero.action === 'meditating' && (state.hero.animationTime % skipModulus) >= 20;
    area.allActiveObjects = [];
    area.allyTargets = [];
    if (area === state.hero.area) {
        area.allyTargets.push(state.hero);
    }
    // These are anything that hits against enemies can hit, which might include certain objects.
    area.enemyTargets = [];
    // This is the array of literal Enemy instances.
    area.enemies = [];
    area.neutralTargets = [];
    for (const baseObject of [...area?.objects || [], ...area?.effects || []]) {
        for (const object of getFieldInstanceAndParts(state, baseObject)) {
            if (object.area !== area
                || object.status === 'gone'
                || object.status === 'hidden'
                || object.status === 'hiddenEnemy'
                || object.status === 'hiddenSwitch'
            ) {
                continue;
            }
            area.allActiveObjects.push(object);
            if (object.isAllyTarget) {
                area.allyTargets.push(object);
            }
            if (object.isEnemyTarget) {
                area.enemyTargets.push(object);
            }
            if (object.isNeutralTarget) {
                area.neutralTargets.push(object);
            }
            if (object instanceof Enemy) {
                area.enemies.push(object);
            }
        }
    }
    // area.objects array may be mutated during updates, so make a copy of it before iterating over it.
    for (const object of [...(area?.objects || [])]) {
        if (isScreenTransitioning && !object.updateDuringTransition) {
            continue;
        }
        // Time passes slowly for everything but the astral projection while meditating and things it is
        // or has recently interacted with.
        if (skipFrame
            && !object.neverSkipFrames
            && object !== state.hero.astralProjection
            && object !== state.hero.astralProjection?.grabObject
            && object !== state.hero.astralProjection?.lastTouchedObject
            && (!object.linkedObject || object.linkedObject !== state.hero.astralProjection?.lastTouchedObject)
        ) {
            continue;
        }
        object.update?.(state);
        if (object.area && !object.ignorePits && object.getHitbox) {
            object.groundHeight = 0;
            const hitbox = object.getHitbox();
            for (const otherObject of area.objects) {
                if (otherObject === object) {
                    continue;
                }
                if (otherObject.behaviors?.groundHeight > 0 && rectanglesOverlap(hitbox, otherObject.getHitbox())) {
                    object.groundHeight = Math.max(object.groundHeight, otherObject.behaviors?.groundHeight);
                } else if (otherObject.behaviors?.groundHeight > 0) {
                    //console.log(hitbox, otherObject.getHitbox());
                }
            }
            // Objects that can fall in pits are assumed to fall to the ground when not supported.
            if (object.z > object.groundHeight && !object.doesNotFall) {
                object.z = Math.max(object.groundHeight, object.z - 1);
            } else {
                object.z = Math.max(object.z, object.groundHeight);
            }
            if (object.z > 0) {
                continue;
            }
            let isOnGround = false, waterTileCoords: number[], pitTileCoords: number[];
            const points = [
                [hitbox.x + 4, hitbox.y + 4],
                [hitbox.x + hitbox.w - 5, hitbox.y + 4],
                [hitbox.x + 4, hitbox.y + hitbox.h - 5],
                [hitbox.x + hitbox.w - 5, hitbox.y + hitbox.h - 5],
            ];
            for (const [x, y] of points) {
                const behaviors = getCompositeBehaviors(state, object.area, {x, y}, null, object);
                if (behaviors?.pit  && !(object.z > 0)) {
                    pitTileCoords = [((x / 16) | 0), ((y / 16) | 0)];
                } else if (behaviors?.water  && !(object.z > 0)) {
                    waterTileCoords = [((x / 16) | 0), ((y / 16) | 0)];
                } else {
                    isOnGround = true;
                }
            }
            // Object is supported by ground, it should sink or fall.
            if (isOnGround) {
                continue;
            }
            // Object will fall in water over pits.
            if (waterTileCoords) {
                addSplashAnimation(state, object.area, {
                    x: waterTileCoords[0] * 16 + 8,
                    y: waterTileCoords[1] * 16 + 8,
                });
                removeObjectFromArea(state, object);
            }
            // Object falls into a pit.
            if (pitTileCoords) {
                const point = {
                    x: pitTileCoords[0] * 16 + 8,
                    y: pitTileCoords[1] * 16 + 8,
                }
                if (object.definition?.type === 'enemy') {
                    addEnemyFallAnimation(state, object.area, point);
                } else {
                    addObjectFallAnimation(state, object.area, point);
                }
                removeObjectFromArea(state, object);
            }
        }
    }
    // area.effects array may be mutated during updates, so make a copy of it before iterating over it.
    for (const effect of [...(area?.effects || [])]) {
        if (isScreenTransitioning && !effect.updateDuringTransition) {
            continue;
        }
        // Don't update any effects that have been removed from the area.
        if (!effect.area) {
            continue;
        }
        // Time passes slowly for everything but the astral projection while meditating and things it is
        // or has recently interacted with.
        if (skipFrame
            && !effect.neverSkipFrames
            && effect !== state.hero.astralProjection?.lastTouchedObject
            && (!effect.linkedObject || effect.linkedObject !== state.hero.astralProjection?.lastTouchedObject)
        ) {
            continue;
        }
        effect.update?.(state);
    }
}

function switchElement(state: GameState, delta: number): void {
    const allElements: MagicElement[] = [null];
    for (const element of ['fire', 'ice', 'lightning'] as MagicElement[]) {
        if (state.hero.savedData.elements[element]) {
            allElements.push(element);
        }
    }
    const index = allElements.indexOf(state.hero.savedData.element);
    setEquippedElement(state, allElements[(index + delta + allElements.length) % allElements.length]);
}

function removeDefeatedEnemies(state: GameState, area: AreaInstance): void {
    const originalLength = area.objects.length;
    area.objects = area.objects.filter(e => !(e instanceof Enemy) || (e.status !== 'gone'));
    // If an enemy was defeated, check if all enemies are defeated to see if any doors open or treasures appear.
    if (originalLength > area.objects.length) {
        checkIfAllEnemiesAreDefeated(state, area);
    }
}
