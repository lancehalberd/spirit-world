import { addObjectToArea, checkIfAllEnemiesAreDefeated, removeObjectFromArea } from 'app/content/areas';
import { AnimationEffect } from 'app/content/animationEffect';
import { Enemy } from 'app/content/enemy';
import { editingState } from 'app/development/tileEditor';
import { GAME_KEY } from 'app/gameConstants';
import { wasGameKeyPressed } from 'app/keyCommands';
import { updateAllHeroes } from 'app/updateActor';
import { updateCamera } from 'app/updateCamera';
import { createAnimation } from 'app/utils/animations';
import { getTileBehaviors } from 'app/utils/field';

import {
    AreaInstance, FrameAnimation, FrameDimensions,
    GameState, MagicElement,
} from 'app/types';

const fallGeometry: FrameDimensions = {w: 24, h: 24};
export const objectFallAnimation: FrameAnimation = createAnimation('gfx/effects/enemyfall.png', fallGeometry, { cols: 10, duration: 4}, { loop: false });


export function updateField(this: void, state: GameState) {
    if (editingState.isEditing) {
        updateAllHeroes(state);
        updateCamera(state);
        return;
    }
    // If any priority objects are defined for the area, only process them
    // until there are none remaining in the queue.
    if (state.areaInstance.priorityObjects.length) {
        const priorityObjects = state.areaInstance.priorityObjects.pop();
        for (let i = 0; i < priorityObjects.length; i++) {
            if (state.areaInstance.objects.indexOf(priorityObjects[i]) < 0) {
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
    updateAreaObjects(state, state.alternateAreaInstance);
}
export function updateAreaObjects(this: void, state: GameState, area: AreaInstance) {
    const isScreenTransitioning = state.nextAreaInstance || state.nextAreaSection;
    area.allyTargets = [state.hero];
    area.enemyTargets = [];
    area.neutralTargets = [];
    for (const object of area?.objects || []) {
        if (object.isAllyTarget) {
            area.allyTargets.push(object);
        }
        if (object.isEnemyTarget) {
            area.enemyTargets.push(object);
        }
        if (object.isNeutralTarget) {
            area.neutralTargets.push(object);
        }
    }
    for (const object of area?.objects || []) {
        if (isScreenTransitioning && !object.updateDuringTransition) {
            continue;
        }
        object.update?.(state);
        if (!object.ignorePits && object.getHitbox) {
            const hitbox = object.getHitbox(state);
            const x = hitbox.x + hitbox.w / 2;
            const y = hitbox.y + hitbox.h / 2;
            const { tileBehavior } = getTileBehaviors(state, object.area, {x, y});
            if (!tileBehavior) {
                return;
            }
            if (tileBehavior.pit && !(object.z > 0)) {
                const pitAnimation = new AnimationEffect({
                    animation: objectFallAnimation,
                    x: ((x / 16) | 0) * 16 - 4, y: ((y / 16) | 0) * 16 - 4,
                });
                addObjectToArea(state, object.area, pitAnimation);
                removeObjectFromArea(state, object);
            }
        }
    }
}


function switchElement(state: GameState, delta: number): void {
    const allElements: MagicElement[] = [null];
    for (const element of ['fire', 'ice', 'lightning'] as MagicElement[]) {
        if (state.hero.elements[element]) {
            allElements.push(element);
        }
    }
    const index = allElements.indexOf(state.hero.element);
    state.hero.element = allElements[(index + delta + allElements.length) % allElements.length];
}

function removeDefeatedEnemies(state: GameState, area: AreaInstance): void {
    const originalLength = area.objects.length;
    area.objects = area.objects.filter(e => !(e instanceof Enemy) || (e.life > 0 && e.status !== 'gone'));
    // If an enemy was defeated, check if all enemies are defeated to see if any doors open or treasures appear.
    if (originalLength > area.objects.length) {
        checkIfAllEnemiesAreDefeated(state, area);
    }
}