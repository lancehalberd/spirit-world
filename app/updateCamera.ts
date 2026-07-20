import {cleanupHeroFromArea, linkObjects} from 'app/content/areas';
import {evaluateLogicDefinition} from 'app/content/logic'
import {editingState} from 'app/development/editingState';
import {CANVAS_WIDTH, CANVAS_HEIGHT} from 'app/gameConstants';
import {checkIfAllEnemiesAreDefeated} from 'app/utils/checkIfAllEnemiesAreDefeated';
import {createObjectInstance} from 'app/utils/createObjectInstance';
import {findObjectInstanceByDefinition} from 'app/utils/findObjectInstanceById';
import {getAreaSize} from 'app/utils/getAreaSize';
import {addEffectToArea, removeEffectFromArea} from 'app/utils/effects';
import {getCameraTarget} from 'app/utils/fixCamera';
import {isObjectInsideTarget} from 'app/utils/index';
import {addObjectToArea, initializeObject, removeObjectFromArea} from 'app/utils/objects';
import {applyCurrentAreaSection, exploreSection} from 'app/utils/sections';
import {resetTileBehavior} from 'app/utils/tileBehavior';
import {applyVariantsToArea} from 'app/utils/variants';

const cameraSpeed = 10;
export function updateCamera(state: GameState, speed?: number): void {
    if (!speed) {
        if (state.hero.action === 'jumpingDown' && !state.nextAreaSet) {
            speed = 4;
        } else {
            speed = editingState.isEditing ? 20 : (state.camera.speed ?? cameraSpeed);
        }
    }
    const { w, h, section } = getAreaSize(state);
    // Quickly move the character to the desired initial position for displaying the next area.
    if (state.nextAreaSet?.current && state.nextAreaSet.current !== state.areaSet.current) {
        let finished = true;
        if (state.nextAreaSet.current.cameraOffset.x < 0 && state.camera.x > -CANVAS_WIDTH) {
            state.camera.x = Math.max(state.camera.x - speed, -CANVAS_WIDTH);
            finished = false;
        }
        if (state.nextAreaSet.current.cameraOffset.x > 0 && state.camera.x < w) {
            state.camera.x = Math.min(state.camera.x + speed, w);
            finished = false;
        }
        if (state.nextAreaSet.current.cameraOffset.y < 0 && state.camera.y > -CANVAS_HEIGHT) {
            state.camera.y = Math.max(state.camera.y - speed, -CANVAS_HEIGHT);
            finished = false;
        }
        if (state.nextAreaSet.current.cameraOffset.y > 0 && state.camera.y < h) {
            state.camera.y = Math.min(state.camera.y + speed, h);
            finished = false;
        }
        if (finished) {
            // Null out references to canvas/context in case that helps GC them faster.
            if (!editingState.isEditing) {
                for (const frame of state.areaSet.current.backgroundFrames) {
                    frame.canvas = null;
                    frame.context = null;
                }
            }
            // The held chakram can transition between areas with the hero.
            for (const object of state.areaSet.current.objects) {
                if (object.changesAreas) {
                    addObjectToArea(state, state.nextAreaSet.current, object);
                    object.x -= state.nextAreaSet.current.cameraOffset.x;
                    object.y -= state.nextAreaSet.current.cameraOffset.y;
                }
            }
            for (const effect of state.areaSet.current.effects) {
                if (effect.changesAreas) {
                    addEffectToArea(state, state.nextAreaSet.current, effect);
                    effect.x -= state.nextAreaSet.current.cameraOffset.x;
                    effect.y -= state.nextAreaSet.current.cameraOffset.y;
                }
            }
            //const lastAreaInstance = state.areaSet.current;
            state.areaSet = state.nextAreaSet;
            delete state.nextAreaSet;
            exploreSection(state, state.nextAreaSet.currentSection.index);
            state.hero.x -= state.areaSet.current.cameraOffset.x;
            state.hero.y -= state.areaSet.current.cameraOffset.y;
            state.camera.x -= state.areaSet.current.cameraOffset.x;
            state.camera.y -= state.areaSet.current.cameraOffset.y;
            state.areaSet.current.cameraOffset = {x: 0, y: 0};
            state.hero.area = state.areaSet.current;
            cleanupHeroFromArea(state);
            state.hero.safeD = state.hero.d;
            state.hero.safeX = state.hero.x;
            state.hero.safeY = state.hero.y;
            // We don't seem to need this any more, but let's preserve it for a bit
            // in case we see issues with super tile transitions again.
            // An old bug used to be that you could briefly move after screen transition
            // when being pulled by the crystal bead flows in the waterfall tower, allowing
            // you to awkwardly screen transition back north after being pushed south.
            /*state.scriptEvents.activeEvents.push({
                type: 'wait',
                blocksInput: true,
                duration: 2 * FRAME_LENGTH,
                time: state.time,
            });*/

            /*state.areaSet.alternate = getAreaInstanceFromLocation(
                state,
                {...state.location, isSpiritWorld: !state.location.isSpiritWorld}
            );
            state.areaSet.current.alternateArea = state.areaSet.alternate;
            state.areaSet.alternate.alternateArea = state.areaSet.current;*/
            //This should have been done prior to initializing objects.
            //linkObjects(state);
            // This should be done when the area set was generated
            //updateAreaSection(state, true);
            //setConnectedAreas(state, lastAreaInstance);
            if (editingState.isEditing) {
                editingState.needsRefresh = true;
                state.areaSet.current.tilesDrawn = [];
                state.areaSet.current.checkToRedrawTiles = true;
            }
            checkIfAllEnemiesAreDefeated(state, state.areaSet.current);
            checkIfAllEnemiesAreDefeated(state, state.areaSet.alternate);

            // Make sure to remove renderParent from the hero for any objects that are
            // no longer being rendered.
            if (state.hero.renderParent && state.hero.renderParent.area !== state.hero.area) {
                delete state.hero.renderParent;
            }
        }
        return;
    }
    const target = getCameraTarget(state);
    if (state.camera.x < target.x) {
        state.camera.x = Math.min(state.camera.x + speed, target.x);
    } else if (state.camera.x > target.x) {
        state.camera.x = Math.max(state.camera.x - speed, target.x);
    }
    if (state.camera.y < target.y) {
        state.camera.y = Math.min(state.camera.y + speed, target.y);
    } else if (state.camera.y > target.y) {
        state.camera.y = Math.max(state.camera.y - speed, target.y);
    }

    // Switch to the next area as soon as the screen is displayed entirely in the new section.
    // section is for the next area section, if one is present.
    if (state.nextAreaSet?.currentSection && isObjectInsideTarget({
        x: state.camera.x, y: state.camera.y, w: CANVAS_WIDTH, h: CANVAS_HEIGHT
    }, section)) {
        // Cleanup the previous sections now that they are completely offscreen.
        resetSection(state, state.areaSet.current, state.areaSet.currentSection);
        resetSection(state, state.areaSet.alternate, state.areaSet.alternateSection);
        linkObjects(state);
        cleanupHeroFromArea(state);
        // Swap to the next area set
        state.areaSet = state.nextAreaSet;
        delete state.nextAreaSet;
        exploreSection(state, state.nextAreaSet.currentSection.index);
        applyCurrentAreaSection(state);
        editingState.needsRefresh = true;
        state.hero.safeD = state.hero.d;
        state.hero.safeX = state.hero.x;
        state.hero.safeY = state.hero.y;
        checkIfAllEnemiesAreDefeated(state, state.areaSet.current);
        checkIfAllEnemiesAreDefeated(state, state.areaSet.alternate);
    }
}


function resetSection(state: GameState, area: AreaInstance, section: Rect): void {
    // First reset tiles that need to be reset.
    // This is done before objects since some objects will update the tiles under them.
    for (let y = 0; y < section.h; y++) {
        const row = section.y + y;
        for (let x = 0; x < section.w; x++) {
            const column = section.x + x;
            for (const layer of area.layers) {
                layer.tiles[row][column] = layer.originalTiles[row][column];
            }
            resetTileBehavior(area, {x: column, y: row});
            if (area.tilesDrawn[row]?.[column]) {
                area.tilesDrawn[row][column] = false;
            }
        }
    }
    area.checkToRedrawTiles = true;
    // Remove effects unless they update during the transition, like the held chakram.
    for (const effect of [...area.effects]) {
        if (!effect.updateDuringTransition) {
            removeEffectFromArea(state, effect);
        }
    }
    const l = section.x * 16;
    const t = section.y * 16;
    // Objects will be initialized after all objects are added to the area since some object initialization will depend on
    // other objects, for example beds/cocoons placing target NPC objects inside of them.
    const objectsToInitialize: ObjectInstance[] = [];
    // Remove any objects from that area that should be reset.
    // This will permanently remove any objects that reset and don't have definitions, like loot drops.
    for (const object of [...area.objects]) {
        // We only want to use definitions from the area itself, not transient objects like minions.
        const definition = area.definition.objects[area.definition.objects.indexOf(object.definition)];
        // Only update objects defined in this section
        if (definition?.x >= l + section.w * 16 || definition?.x < l || definition?.y >= t + section.h * 16 || definition?.y < t) {
            continue;
        }
        if (object.alwaysReset || object.shouldReset && object.shouldReset(state)) {
            removeObjectFromArea(state, object);
            // Transient effects or minions summoned by a boss should just be despawned when reset.
            if (definition) {
                if (!evaluateLogicDefinition(state, definition)) {
                    continue;
                }
                const object = createObjectInstance(state, definition);
                addObjectToArea(state, area, object);
                objectsToInitialize.push(object);
            }
        }
    }
    // Reset objects in the section that should be reset.
    for (let i = 0; i < area.definition.objects.length; i++) {
        const definition = area.definition.objects[i];
        // Ignore objects defined outside of this section.
        if (definition.x >= l + section.w * 16 || definition.x < l || definition.y >= t + section.h * 16 || definition.y < t) {
            continue;
        }
        if (!evaluateLogicDefinition(state, definition)) {
            continue;
        }
        let object = findObjectInstanceByDefinition(area, definition, true);
        if (!object) {
            object = createObjectInstance(state, definition);
            if (object.alwaysReset || object.shouldRespawn && object.shouldRespawn(state)) {
                addObjectToArea(state, area, object);
                objectsToInitialize.push(object);
            }
        }
    }
    for (const object of objectsToInitialize) {
        initializeObject(state, object, true);
    }
    applyVariantsToArea(state, area);
}
