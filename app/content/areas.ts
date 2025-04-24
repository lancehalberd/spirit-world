import { evaluateLogicDefinition, logicHash, isLogicValid, isObjectLogicValid } from 'app/content/logic';
import { allTiles } from 'app/content/tiles';
import { zones } from 'app/content/zones';
import { editingState } from 'app/development/editingState';
import { cleanupHeroFromArea, getAreaSectionInstance, removeAllClones } from 'app/utils/area';
import { specialBehaviorsHash } from 'app/content/specialBehaviors/specialBehaviorsHash';
import { createCanvasAndContext } from 'app/utils/canvas';
import { createObjectInstance, } from 'app/utils/createObjectInstance';
import { checkIfAllEnemiesAreDefeated } from 'app/utils/checkIfAllEnemiesAreDefeated';
import { addEffectToArea, removeEffectFromArea } from 'app/utils/effects';
import {hitTargets} from 'app/utils/field';
import { findObjectInstanceByDefinition } from 'app/utils/findObjectInstanceById';
import { getAreaDimensions } from 'app/utils/getAreaSize';
import { initializeAreaLayerTiles, initializeAreaTiles } from 'app/utils/layers';
import { mapTile } from 'app/utils/mapTile';
import { addObjectToArea, initializeObject, removeObjectFromArea } from 'app/utils/objects';
import { applyLayerToBehaviorGrid, resetTileBehavior } from 'app/utils/tileBehavior';
import { applyVariantsToArea } from 'app/utils/variants';

export function getDefaultArea(w = 32, h = 32): AreaDefinition {
    return {
        default: true,
        layers: getDefaultLayers(w, h),
        objects: [],
        sections: [{ x: 0, y: 0, w, h}],
    };
}

export function getDefaultLayers(w = 32, h = 32): AreaLayerDefinition[] {
    return [
        {
            key: 'floor',
            grid: {
                // The dimensions of the grid.
                w,
                h,
                // The matrix of tiles
                tiles: [],
            },
        },
        {
            key: 'field',
            grid: {
                // The dimensions of the grid.
                w,
                h,
                // The matrix of tiles
                tiles: [],
            },
        },
    ];
}

export function copyLayerTemplate(layer: AreaLayerDefinition): AreaLayerDefinition {
    return {
        ...layer,
        drawPriority: layer.key.startsWith('foreground') ? 'foreground' : 'background',
        grid: {
            ...layer.grid,
            // The matrix of tiles
            tiles: [],
        },
        // Add the mask from the parent layer but only if it is defined.
        ...(layer.mask ? { mask: {
            ...layer.mask,
            // The matrix of tiles
            tiles: [],
        }} : {}),
    };
}

export function getDefaultSpiritArea(location: ZoneLocation): AreaDefinition {
    const parentDefinition = getAreaFromLocation({...location, isSpiritWorld: false});
    return {
        default: true,
        parentDefinition,
        isSpiritWorld: true,
        layers: parentDefinition.layers.map(copyLayerTemplate),
        objects: [],
        // Spirit world sections should match their parent definition, otherwise the
        // camera will not be aligned correctly when switching back and forth.
        sections: parentDefinition.sections.map(section => ({
            ...section,
            index: undefined,
            // Default is based on the parent section mapId, if present.
            mapId: section.mapId ? section.mapId + 'Spirit' : undefined
        })),
    };
}

export function getAreaFromLocation(location: ZoneLocation): AreaDefinition {
    const zone = zones[location.zoneKey];
    const floor = zone.floors[location.floor];
    const grid = location.isSpiritWorld ? floor.spiritGrid : floor.grid;
    const alternateGrid = location.isSpiritWorld ? floor.grid : floor.spiritGrid;
    const {w, h} = zone.areaSize ?? {w: 32, h: 32};

    const {x, y} = location.areaGridCoords;
    if (!grid[y]) {
        grid[y] = [];
    }
    if (!grid[y][x]) {
        grid[y][x] =
            initializeAreaTiles(location.isSpiritWorld ? getDefaultSpiritArea(location) : getDefaultArea(w, h));
        return grid[y][x] as AreaDefinition;
    } else if (!grid[y][x].layers) {
        /*const areaDefinition = grid[y][x];
        const alternateAreaDefinition = alternateGrid[y][x];
        if (!alternateAreaDefinition) {
            debugger;
        }
        if (alternateAreaDefinition.layers) {
            grid[y][x] = initializeAreaTiles({
                ...areaDefinition,
                layers: alternateAreaDefinition.layers.map(copyLayerTemplate),
            });
        } else {
            const defaultLayers = (location.isSpiritWorld ? getDefaultSpiritArea(location) : getDefaultArea(w, h)).layers;
            grid[y][x] = initializeAreaTiles({
                ...areaDefinition,
                layers: defaultLayers
            });
        }*/
        populateLayersFromAlternateArea(grid[y][x], alternateGrid[y][x]);
        return grid[y][x] as AreaDefinition;
    }
    return grid[y][x];
}

export function populateLayersFromAlternateArea(area: AreaDefinition, alternateArea: AreaDefinition) {
    if (area.layers) {
        return;
    }
    if (alternateArea?.layers) {
        area.layers = alternateArea.layers.map(copyLayerTemplate);
    } else {
        area.layers = getDefaultLayers(area.w, area.h);
    }
    initializeAreaTiles(area);
}

export function getAreaInstanceFromLocation(state: GameState, location: ZoneLocation): AreaInstance {
    return createAreaInstance(state, getAreaFromLocation(location));
}

export function setConnectedAreas(state: GameState, lastAreaInstance: AreaInstance) {
    state.underwaterAreaInstance = null;
    if (state.zone.underwaterKey && state.location.floor === 0) {
        const underwaterArea = getAreaFromLocation({
            ...state.location,
            floor: zones[state.zone.underwaterKey].floors.length - 1,
            zoneKey: state.zone.underwaterKey,
        });
        if (!underwaterArea) {
            debugger;
        }
        // Keep using the existing instance if one is present.
        if (lastAreaInstance?.definition === underwaterArea) {
            state.underwaterAreaInstance = lastAreaInstance;
        } else {
            state.underwaterAreaInstance = createAreaInstance(state, underwaterArea);
        }
    }
    state.surfaceAreaInstance = null;
    if (state.zone.surfaceKey && state.location.floor === state.zone.floors.length - 1) {
        const surfaceArea = getAreaFromLocation({
            ...state.location,
            floor: 0,
            zoneKey: state.zone.surfaceKey,
        })
        if (!surfaceArea) {
            debugger;
        }
        // Keep using the existing instance if one is present.
        if (lastAreaInstance?.definition === surfaceArea) {
            state.surfaceAreaInstance = lastAreaInstance;
        } else {
            state.surfaceAreaInstance = createAreaInstance(state, surfaceArea);
        }
    }
    state.areaInstance.underwater = !!state.surfaceAreaInstance;
}

export function linkObjects(state: GameState): void {
    for (const object of [...state.areaInstance.objects, ...state.alternateAreaInstance.objects]) {
        linkObject(object);
    }
}
export function linkObject(object: ObjectInstance): void {
    if (!object?.definition?.linked || !object?.area) {
        return;
    }
    const linkedObject = object.area.alternateArea.objects.find(
        o => o.definition?.type === object.definition?.type && o.x === object.x && o.y === object.y
    );
    if (linkedObject) {
        linkedObject.linkedObject = object;
        object.linkedObject = linkedObject;
    }
}

interface ObjectTarget {
    object: ObjectDefinition
    inSpiritWorld: boolean
}

export function findZoneTargets(
    state: GameState,
    zoneKey: string,
    objectId: string,
    skipObject: ObjectDefinition,
    checkLogic: boolean
): ObjectTarget[] {
    const zone = zones[zoneKey];
    if (!zone) {
        console.error(`Missing zone: ${zoneKey}`);
        return null;
    }
    const results: ObjectTarget[] = [];
    for (let worldIndex = 0; worldIndex < 2; worldIndex++) {
        for (let floor = 0; floor < zone.floors.length; floor++) {
            // Search the corresponding spirit/material world before checking in the alternate world.
            const areaGrids = state.areaInstance.definition.isSpiritWorld
                ? [zone.floors[floor].spiritGrid, zone.floors[floor].grid]
                : [zone.floors[floor].grid, zone.floors[floor].spiritGrid];
            const areaGrid = areaGrids[worldIndex];
            const inSpiritWorld = areaGrid === zone.floors[floor].spiritGrid;
            for (let y = 0; y < areaGrid.length; y++) {
                for (let x = 0; x < areaGrid[y].length; x++) {
                    for (const object of (areaGrid[y][x]?.objects || [])) {
                        if (object.id === objectId && object !== skipObject) {
                            if (checkLogic && !isObjectLogicValid(state, object)) {
                                continue;
                            }
                            results.push({ object, inSpiritWorld });
                        }
                    }
                }
            }
        }
    }
    return results;
}


export function scrollToArea(state: GameState, area: AreaDefinition, direction: Direction): void {
    //console.log('scrollToArea', direction);
    removeAllClones(state);
    state.nextAreaInstance = createAreaInstance(state, area);
    if (direction === 'up') {
        state.nextAreaInstance.cameraOffset.y = -state.nextAreaInstance.h * 16;
    }
    if (direction === 'down') {
        state.nextAreaInstance.cameraOffset.y = state.areaInstance.h * 16;
    }
    if (direction === 'left') {
        state.nextAreaInstance.cameraOffset.x = -state.nextAreaInstance.w * 16;
    }
    if (direction === 'right') {
        state.nextAreaInstance.cameraOffset.x = state.areaInstance.w * 16;
    }
}

export function switchToNextAreaSection(state: GameState): void {
    if (!state.nextAreaSection || state.areaSection === state.nextAreaSection) {
        state.nextAreaSection = null;
        return;
    }
    refreshSection(state, state.areaInstance, state.areaSection);
    refreshSection(state, state.alternateAreaInstance, state.areaSection);
    linkObjects(state);
    state.areaSection = state.nextAreaSection;
    editingState.needsRefresh = true;
    cleanupHeroFromArea(state);
    state.hero.safeD = state.hero.d;
    state.hero.safeX = state.hero.x;
    state.hero.safeY = state.hero.y;
    checkIfAllEnemiesAreDefeated(state, state.areaInstance);
    checkIfAllEnemiesAreDefeated(state, state.alternateAreaInstance);
}


export function mapTileNumbersToFullTiles(tileNumbers: number[][]): FullTile[][] {
    if (!tileNumbers) {
        return null;
    }
    const fullTiles: FullTile[][] = [];
    for (let i = 0; i < tileNumbers.length; i++) {
        fullTiles[i] = [];
        for (let j = 0; j < tileNumbers[i]?.length; j++) {
            if (tileNumbers[i][j] && typeof tileNumbers[i][j] !== 'number') {
                console.error('NaN', tileNumbers[i][j]);
                debugger;
            }
            fullTiles[i][j] = allTiles[tileNumbers[i][j]];
        }
    }
    return fullTiles;
}

export function getOrCreateAreaInstance(state: GameState, location: ZoneLocation): AreaInstance {
    const definition = getAreaFromLocation(location);
    for (const area of editingState.recentAreas) {
        if (area.definition === definition) {
            return area;
        }
    }
    return createAreaInstance(state, definition);
}

export function addRecentArea(areaInstance: AreaInstance): void {
    const index = editingState.recentAreas.findIndex(area => area.definition === areaInstance.definition);
    if (index >= 0) {
        editingState.recentAreas.splice(index, 1, areaInstance);
    } else {
        editingState.recentAreas.unshift(areaInstance);
        while(editingState.recentAreas.length > 20) {
            editingState.recentAreas.pop();
        }
    }
}

export function createAreaInstance(state: GameState, definition: AreaDefinition): AreaInstance {
    const behaviorGrid: TileBehaviors[][] = [];
    const areaSize = getAreaDimensions(definition);
    const backgroundFrames: AreaFrame[] = [];
    for (let i = 0; i < 6; i++) {
        const [canvas, context] = createCanvasAndContext(
            areaSize.w * 16,
            areaSize.h * 16,
        );
        backgroundFrames.push({
            canvas,
            context,
            frameIndex: i,
            isForeground: false,
            tilesDrawn: [],
        });
    }
    const foregroundFrames: AreaFrame[] = [];
    for (let i = 0; i < 1; i++) {
        const [canvas, context] = createCanvasAndContext(
            areaSize.w * 16,
            areaSize.h * 16,
        );
        foregroundFrames.push({
            canvas,
            context,
            frameIndex: i,
            isForeground: true,
            tilesDrawn: [],
        });
    }
    const instance: AreaInstance = {
        alternateArea: null,
        definition: definition,
        dark: definition.dark,
        w: areaSize.w,
        h: areaSize.h,
        behaviorGrid,
        tilesDrawn: [],
        checkToRedrawTiles: true,
        checkToRedrawWaterSurface: false,
        drawnFrames: new Set(),
        layers: definition.layers.filter((layer) => {
            if (!layer) {
                console.error('missing layer', definition);
                debugger;
            }
            // The selected layer is always visible.
            if (editingState.isEditing && editingState.selectedLayerKey === layer.key) {
                return true;
            }
            // visibilityOverride dictates state of layers if they are not selected and it is set to show/fade/hide.
            if (layer.visibilityOverride === 'show' || layer.visibilityOverride === 'fade') {
                return true;
            }
            if (layer.visibilityOverride === 'hide') {
                return false;
            }
            // Custom logic can be specified instead of a logic key for single flag checks.
            if (layer.hasCustomLogic && layer.customLogic) {
                return isLogicValid(state, {
                    requiredFlags: [layer.customLogic]
                }, layer.invertLogic);
            }
            // Layers without logic are visible by default.
            if (!layer.logicKey) {
                return true;
            }
            const logic = logicHash[layer.logicKey];
            // Logic should never be missing, so surface an error and hide the layer.
            if (!logic) {
                console.error('Missing logic!', layer.logicKey);
                debugger;
                return false;
            }
            // If the layer has logic, only display it if the logic is valid.
            return isLogicValid(state, logic, layer.invertLogic);
        }).map(layer => ({
            definition: layer,
            ...layer,
            ...layer.grid,
            tiles: mapTileNumbersToFullTiles(layer.grid.tiles),
            maskTiles: mapTileNumbersToFullTiles(layer.mask?.tiles),
            originalTiles: mapTileNumbersToFullTiles(layer.grid.tiles),
        })),
        effects: [],
        objects: [],
        allActiveObjects: [],
        removedObjectDefinitions: new Set(),
        priorityObjects: [],
        backgroundFrames,
        foregroundFrames,
        cameraOffset: {x: 0, y: 0},
        allyTargets: [],
        enemyTargets: [],
        neutralTargets: [],
        enemies: [],
        objectsToRender: [],
    };
    // Don't attempt to inherit layers if they are not defined in the parent. This can
    // happen in spirit areas that are not connected to the material world.
    if (definition.parentDefinition?.layers) {
        for (const layer of instance.layers) {
            const definitionIndex = definition.layers.indexOf(layer.definition);
            const parentLayerDefinition = definition.parentDefinition.layers.find(l => l.key === layer.key);
            if (!parentLayerDefinition) {
                console.warn('Missing parent layer definition for layer', layer);
                console.warn('Copying child layer to parent');
                definition.parentDefinition.layers.splice(definitionIndex, 0, initializeAreaLayerTiles({
                    ...layer.definition,
                    grid: {
                        ...layer.definition.grid,
                        tiles: [],
                    },
                }));
                //debugger;
                continue;
            }
            for (let y = 0; y < layer.tiles.length; y++) {
                for (let x = 0; x < layer.tiles[y].length; x++) {
                    if (!layer.tiles[y][x]) {
                        const parentTile = allTiles[definition.parentDefinition.layers[definitionIndex].grid.tiles[y]?.[x]];
                        const tile = mapTile(parentTile);
                        layer.tiles[y][x] = tile;
                        layer.originalTiles[y][x] = tile;
                    }
                }

            }
        }
    }
    applyVariantsToArea(state, instance);
    for (const layer of instance.layers) {
        applyLayerToBehaviorGrid(behaviorGrid, layer);
    }
    for (const object of definition.objects.filter(object => isObjectLogicValid(state, object))) {
        const objectInstance = createObjectInstance(state, object);
        addObjectToArea(state, instance, objectInstance);
        initializeObject(state, objectInstance);
}
    instance.isCorrosive = evaluateLogicDefinition(state, instance.definition.corrosiveLogic, false);
    if (definition.specialBehaviorKey) {
        const specialBehavior = specialBehaviorsHash[definition.specialBehaviorKey] as SpecialAreaBehavior;
        specialBehavior?.apply(state, instance);
    }
    addRecentArea(instance);
    return instance;
}

export function refreshAreaLogic(state: GameState, area: AreaInstance, fastRefresh = false): void {
    if (!area) {
        return;
    }
    const wasHot = state.areaSection?.isHot;
    if (state.areaSection) {
        state.areaSection = getAreaSectionInstance(state, state.areaSection.definition);
    }
    area.needsLogicRefresh = false;
    let lastLayerIndex = -1, refreshBehavior = false;
    for (let i = 0; i < area.definition.layers.length; i++) {
        const layerDefinition = area.definition.layers[i];
        const layerIndex = area.layers.findIndex(l => l.definition === layerDefinition);
        if (layerIndex >= 0) {
            lastLayerIndex = layerIndex;
        }
        if (!layerDefinition.hasCustomLogic && !layerDefinition.logicKey) {
            continue;
        }
        let showLayer = false;
        if (layerDefinition.hasCustomLogic) {
            showLayer = isLogicValid(state, {
                requiredFlags: [layerDefinition.customLogic]
            }, layerDefinition.invertLogic);
        }
        if (layerDefinition.logicKey) {
            showLayer = isLogicValid(state, logicHash[layerDefinition.logicKey], layerDefinition.invertLogic);
        }
        if (layerIndex >= 0 && !showLayer) {
            // Remove the layer if it is present but should be hidden.
            area.layers.splice(layerIndex, 1);
            area.alternateArea.layers.splice(layerIndex, 1);
            refreshBehavior = true;
        } else if (layerIndex < 0 && showLayer) {
            // Add the layer if it is hidden but should be present.
            for (const instance of [area, area.alternateArea]) {
                const definition = instance.definition.layers[i];
                const newLayer = {
                    definition: definition,
                    ...definition,
                    ...definition.grid,
                    tiles: mapTileNumbersToFullTiles(definition.grid.tiles),
                    maskTiles: mapTileNumbersToFullTiles(definition.mask?.tiles),
                    originalTiles: mapTileNumbersToFullTiles(definition.grid.tiles),
                }
                instance.layers.splice(lastLayerIndex + 1, 0, newLayer);
            }
            lastLayerIndex++;
            refreshBehavior = true;
        }
    }
    for (const instance of [area, area.alternateArea]) {
        if (instance.definition.specialBehaviorKey) {
            const specialBehavior = specialBehaviorsHash[instance.definition.specialBehaviorKey] as SpecialAreaBehavior;
            specialBehavior?.onRefreshLogic(state, instance);
        }
    }
    for (let instance of [area, area.alternateArea]) {
        if (refreshBehavior) {
            state.map.needsRefresh = true;
            state.fadeLevel = (state.areaInstance.dark || 0) / 100;
            // This was causing the player to stutter during lava fill on Flame Beast, do we need this?
            // state.hero.vx = state.hero.vy = 0;
            const nextAreaInstance = createAreaInstance(state, instance.definition);
            nextAreaInstance.alternateArea = instance.alternateArea;
            nextAreaInstance.alternateArea.alternateArea = nextAreaInstance;
            // Refresh tile behaviors+canvases.
            nextAreaInstance.tilesDrawn = [];
            nextAreaInstance.checkToRedrawTiles = true;
            nextAreaInstance.behaviorGrid = [];
            nextAreaInstance.layers = [...instance.layers];
            // Update any tile behaviors that may have changed as layers were added/removed.
            for (let y = 0; y < nextAreaInstance.h; y++) {
                for (let x = 0; x < nextAreaInstance.w; x++) {
                    // This flag is set in special examples to make sure modified tiles are reverted on logic refresh.
                    // In particular, the Frost Beast may freeze some tiles on the field that should be reverted when
                    // the area refreshes after beating it, otherwise most tiles will melt while some random ice tiles
                    // remain.
                    if (state.map.restoreOriginalTiles) {
                        for (const layer of nextAreaInstance.layers) {
                            layer.tiles[y][x] = layer.originalTiles[y][x];
                        }
                    }
                    resetTileBehavior(nextAreaInstance, {x, y});
                }
            }
            // If this is the instance currently being viewed, then apply either fast or normal transition logic.
            if (state.areaInstance === instance) {
                if (fastRefresh) {
                    state.areaInstance = nextAreaInstance;
                    state.hero.area = state.areaInstance;
                } else {
                    state.transitionState = {
                        callback: () => null,
                        nextLocation: {
                            ...state.location,
                            x: state.hero.x,
                            y: state.hero.y,
                        },
                        time: 0,
                        type: 'mutating',
                        nextAreaInstance,
                    };
                }
            } else if (state.alternateAreaInstance === instance) {
                if (fastRefresh) {
                    state.alternateAreaInstance = nextAreaInstance;
                } else {
                    if (!state.transitionState) {
                        debugger;
                    }
                    state.transitionState.nextAlternateAreaInstance = nextAreaInstance;
                }
            }

            // Copy the objects from the current area and then apply the object logic update code that follows below.
            nextAreaInstance.objects = [];
            for (const object of [...instance.objects]) {
                addObjectToArea(state, nextAreaInstance, object);
            }
            // The objects will be removed from the current instance, so add them back so they will render during the transition.
            //instance.objects = nextAreaInstance.objects.filter(o => instance.removedObjectIds.includes(o.definition.id));
            instance.objects = [...nextAreaInstance.objects];
            const originalEffects = [...instance.effects];
            nextAreaInstance.effects = [];
            for (const effect of originalEffects) {
                addEffectToArea(state, nextAreaInstance, effect);
            }
            // Cull any effects that might not be valid in the new instance. For example, lava bubbles that are no longer
            // over lava tiles should be removed.
            for (const effect of [...nextAreaInstance.effects]) {
                if (effect.checkToCull?.(state)) {
                    removeEffectFromArea(state, effect);
                }
            }
            // The effects will be removed from the current instance, so add them back so they will render during the transition.
            instance.effects = originalEffects;

            // Since objects are on the next area now, we must also move the priority object queue to the next area.
            nextAreaInstance.priorityObjects = instance.priorityObjects;
            // Without this the HUD/music logic will briefly be unable to detect bosses in the area which can cause boss music
            // to restart during logic refreshes.
            nextAreaInstance.enemies = [...instance.enemies];
            // Don't lose track of the objects that have been intentional removed from the area.
            nextAreaInstance.removedObjectDefinitions = instance.removedObjectDefinitions;
            instance.priorityObjects = []
            instance = nextAreaInstance;


            applyVariantsToArea(state, instance);
        }

        // If the heat level of the room changed, hit all the tiles with fire to melt any ice.
        if (!wasHot && state.areaSection?.isHot) {
            hitTargets(state, instance, {hitbox: {x: 0, y: 0, w: 2000, h: 2000}, hitTiles: true, element: 'fire', source: null});
        }

        // Call refresh logic on any objects currently in the area in case their state depends on the current logic.
        // For example, the door and signs in the Staff Tower Elevator update their state as you interact with the elevator
        // controls.
        for (const object of instance.objects) {
            object.refreshLogic?.(state);
            if (object.definition?.specialBehaviorKey) {
                try {
                    specialBehaviorsHash[object.definition.specialBehaviorKey].onRefreshLogic?.(state, object as any);
                } catch (error) {
                    console.error(object.definition.specialBehaviorKey);
                }
            }
        }
        for (const object of instance.definition.objects) {
            if (!object.logicKey && !object.hasCustomLogic) {
                continue;
            }
            let objectInstance = instance.objects.find(o => o.definition === object
                // Experimental code to allow us to prevent adding objects that have matching ids for existing objects
                // even if they come from the same definition. This was added to allow replacing the editor defined
                // peach loot with a special generated peach during the peach tree cutscene after the first boss.
                || (o.definition.id && o.definition.id === object.id)
            );
            if (isObjectLogicValid(state, object)) {
                // If the object is valid but was never added to the area, add it now.
                if (!objectInstance && !instance.removedObjectDefinitions.has(object)) {
                    objectInstance = createObjectInstance(state, object);
                    // Note that special behavior is applied to objects as part of adding them to the area.
                    addObjectToArea(state, instance, objectInstance);
                }
            } else {
                if (objectInstance) {
                    const area = objectInstance.area;
                    removeObjectFromArea(state, objectInstance);
                    // If the object is invalid but present, remove it from the area, but don't track it as removed by gameplay
                    // so that logical changes can bring it back.
                    if (area && objectInstance.definition) {
                        area.removedObjectDefinitions.delete(objectInstance.definition);
                    }

                }
            }
        }
        //console.log('new instance', instance.objects.map( o => o.definition?.id ));
    }
    delete state.map.restoreOriginalTiles;
    checkIfAllEnemiesAreDefeated(state, area);
}

export function refreshSection(state: GameState, area: AreaInstance, section: Rect): void {
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
                if (!isObjectLogicValid(state, definition)) {
                    continue;
                }
                const object = createObjectInstance(state, definition);
                addObjectToArea(state, area, object);
                initializeObject(state, object);
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
        if (!isObjectLogicValid(state, definition)) {
            continue;
        }
        let object = findObjectInstanceByDefinition(area, definition, true);
        if (!object) {
            object = createObjectInstance(state, definition);
            if (object.alwaysReset || object.shouldRespawn && object.shouldRespawn(state)) {
                addObjectToArea(state, area, object);
                initializeObject(state, object);
            }
        }
    }

    applyVariantsToArea(state, area);
}

