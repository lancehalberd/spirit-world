import {scrollToArea} from 'app/content/areas';
import {editingState} from 'app/development/editingState';
import {updateHeroSpecialActions} from 'app/updateHeroSpecialActions';
import {wasToolButtonPressed, wasToolButtonPressedAndReleased} from 'app/useTool';
import {setNextAreaSection } from 'app/utils/area';
import {getAreaSize} from 'app/utils/getAreaSize';
import {updatePrimaryHeroState} from 'app/utils/hero';
import {removeObjectFromArea} from 'app/utils/objects';
import {swapHeroStates} from 'app/utils/swapHeroStates';

export function updateAllHeroes(this: void, state: GameState, interactive: boolean) {
    // Skip this if the hero isn't currently part of any area.
    if (!state.hero.area) {
        return;
    }
    if (state.hero.action === 'preparingSomersault' && state.fieldTime % 200 !== 0) {
        state.hero.justRespawned = false;
        updateHeroSpecialActions(state, state.hero, interactive);
        return;
    }
    // Switching clones is done outside of updateHero, otherwise the switch gets processed by each clone.
    if (interactive && state.hero.clones.length && !state.hero.pickUpObject && wasToolButtonPressedAndReleased(state, 'clone')) {
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
    if (interactive && state.hero.clones.length && state.hero.cloneToolReleased && wasToolButtonPressed(state, 'clone')) {
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
    // Any time the tool button is pressed we recalculate the relative heading of each clone which will be used for controlling
    // the rotation applied to the controls for the clone until the clone button is pressed again.
    // This is what allows having each clone and hero move in different relative directions for the same controller input.
    if (state.hero.clones.length && state.hero.cloneToolReleased && wasToolButtonPressed(state, 'clone')) {
        // TODO: set the heading for each clone here based on its current direction relative to the hero.
    }
    // Destroy existing astral projection if it isn't in the right area.
    if (state.hero.astralProjection && state.hero.astralProjection.area !== state.hero.area.alternateArea) {
        removeObjectFromArea(state, state.hero.astralProjection);
        delete state.hero.astralProjection;
    }
    if (state.hero.astralProjection) {
        if (!(state.hero.spiritRadius > 0)) {
            removeObjectFromArea(state, state.hero.astralProjection);
            delete state.hero.astralProjection;
        }
    }
    state.hero.update(state, interactive);
    /*for (let i = 0; i < state.hero.clones.length; i++) {
        const clone = state.hero.clones[i];
        clone.update(state, interactive);
    }*/
    const skipModulus = state.hero.savedData.passiveTools.spiritSight ? 100 : 40;
    const skipFrame = state.hero.action === 'meditating' && (state.hero.animationTime % skipModulus) >= 20;
    if (!skipFrame) {
        updatePrimaryHeroState(state, state.hero);
    }
    checkToStartScreenTransition(state, state.hero);
}

/*export function updateHeroVisualEffects(this: void, state: GameState, hero: Hero) {
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
}*/




function checkToStartScreenTransition(state: GameState, hero: Hero) {
    // Check for transition to other areas/area sections.
    const isMovingThroughZoneDoor = hero.actionTarget?.definition?.type === 'door'
        && hero.actionTarget.definition.targetZone
        && hero.actionTarget.definition.targetObjectId
    // Hero can only trigger a screen transition when they are astral projection, otherwise they could
    // get stuck falling into a pit until they die.
    const canTransitionSafely = !hero.isOverPit
        // Astral projection won't fall into pits. This applies to areas where the MC is forced to
        // be an Astral projection, such as the initial journey to the Dreaming.
        || hero.isAstralProjection
        // Falling from the sky transitions you, so you won't softlock here.
        || state.location.zoneKey === 'sky'
        // Falling in this location will transition you to the water drain.
        || (state.location.zoneKey === 'treeWater' && !state.location.isSpiritWorld)
        // Falling in this location will transition you to the forest temple zone.
        || (state.location.zoneKey === 'forest' && state.location.isSpiritWorld);
    // Do not trigger the scrolling transition when traveling through a zone door.
    if ((!editingState.isEditing && !canTransitionSafely)
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
        scrollToArea(state, state.location, 'left');
        return;
    } else if (hero.x + hero.w > w && (hero.vx > 0 || hero.actionDx > 0)) {
        state.location.areaGridCoords = {
            x: (state.location.areaGridCoords.x + 1) % state.areaGrid[0].length,
            y: state.location.areaGridCoords.y,
        };
        scrollToArea(state, state.location, 'right');
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
        scrollToArea(state, state.location, 'up');
    } else if (hero.y + hero.h > h && isHeroMovingDown) {
        state.location.areaGridCoords = {
            x: state.location.areaGridCoords.x,
            y: (state.location.areaGridCoords.y + 1) % state.areaGrid.length,
        };
        scrollToArea(state, state.location, 'down');
    } else if (hero.y < section.y && (hero.vy < 0 || hero.actionDy < 0)) {
        setNextAreaSection(state, 'up');
    } else if (hero.y + hero.h > section.y + section.h && isHeroMovingDown) {
        setNextAreaSection(state, 'down');
    }
}
