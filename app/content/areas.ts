import {evaluateLogicDefinition} from 'app/content/logic';
import {allTiles} from 'app/content/tiles';
import {zones} from 'app/content/zones';
import {editingState} from 'app/development/editingState';
import {MUTATE_DURATION} from 'app/gameConstants';
import {getAreaSectionInstance, setAreaSection} from 'app/utils/area';
import {specialBehaviorsHash} from 'app/content/specialBehaviors/specialBehaviorsHash';
import {createCanvasAndContext} from 'app/utils/canvas';
import {createObjectInstance} from 'app/utils/createObjectInstance';
import {checkIfAllEnemiesAreDefeated} from 'app/utils/checkIfAllEnemiesAreDefeated';
import {addEffectToArea, removeEffectFromArea} from 'app/utils/effects';
import {hitTargets} from 'app/utils/field';
import {getAreaDimensions} from 'app/utils/getAreaSize';
import {initializeAreaLayerTiles, initializeAreaTiles} from 'app/utils/layers';
import {mapTile} from 'app/utils/mapTile';
import {addObjectToArea, initializeObject, removeObjectFromArea} from 'app/utils/objects';
import {refreshAreaIce} from 'app/utils/refreshAreaIce';
import {applyLayerToBehaviorGrid, resetTileBehavior} from 'app/utils/tileBehavior';
import {applyVariantsToArea} from 'app/utils/variants';

export function getDefaultArea(w: number, h: number): AreaDefinition {
    if (!w || !h) {
        debugger;
    }
    return {
        default: true,
        layers: getDefaultLayers(w, h),
        objects: [],
        sections: [{ x: 0, y: 0, w, h}],
    };
}

export function getDefaultLayers(w: number, h: number): AreaLayerDefinition[] {
    if (!w || !h) {
        debugger;
    }
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
    if (!layer.grid.w || !layer.grid.h) {
        debugger;
    }
    return {
        ...layer,
        drawPriority: layer.key.startsWith('foreground') ? 'foreground' : 'background',
        grid: {
            ...layer.grid,
            // The matrix of tiles
            tiles: [],
            mask: [],
        },
    };
}

export function getDefaultSpiritArea(location: ZoneLocation): AreaDefinition {
    const parentDefinition = getAreaFromLocation({...location, isSpiritWorld: false});
    const definition: AreaDefinition = {
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
    return definition;
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
        return addMissingSection(zone, grid[y][x], alternateGrid[y]?.[x]);
    } else if (!grid[y][x].layers) {
        populateLayersFromAlternateArea(zone, grid[y][x], alternateGrid[y]?.[x]);
        return addMissingSection(zone, grid[y][x], alternateGrid[y]?.[x]);
    }
    return grid[y][x];
}

export function addMissingSection(zone: Zone, area: AreaDefinition, alternateArea?: AreaDefinition): AreaDefinition {
    if (!area.w || !area.h) {
        const {w, h} = getAreaDimensions(area, zone);
        area.w = w;
        area.h = h;
    }
    if (!area.sections?.length) {
        if (alternateArea?.sections?.length) {
            area.sections = alternateArea.sections.map(({x, y, w, h}) => ({x, y, w, h}));
        } else {
            area.sections = [{
                x: 0,
                y: 0,
                w: area.w,
                h: area.h
            }];
        }
    }
    return area;
}

export function populateLayersFromAlternateArea(zone: Zone|null, area: AreaDefinition, alternateArea: AreaDefinition) {
    if (area.layers) {
        return;
    }
    if (alternateArea?.layers) {
        area.layers = alternateArea.layers.map(copyLayerTemplate);
    } else {
        const {w, h} = getAreaDimensions(area, zone);
        area.layers = getDefaultLayers(w, h);
    }
    initializeAreaTiles(area);
}

export function getAreaInstanceFromLocation(state: GameState, location: ZoneLocation, isActiveArea: boolean = false): AreaInstance {
    return createAreaInstance(state, location, isActiveArea);
}

// Sets global reference to either underwaterAreaInstance or surfaceAreaInstance if the current area is connected to another
// area through an underwater/surface location relationship. Also sets the current area as underwater if a surface area is set.
export function setConnectedAreas(state: GameState, lastAreaInstance?: AreaInstance) {
    state.areaSet.underwater = getConnectedUnderwaterArea(state, state.areaSet.current, lastAreaInstance);
    if (state.areaSet.underwater) {
        state.areaSet.underwater.surfaceArea = state.areaSet.current;
    }
    state.areaSet.surface = getConnectedSurfaceArea(state, state.areaSet.current, lastAreaInstance);
    if (state.areaSet.surface) {
        state.areaSet.surface.underwaterArea = state.areaSet.current;
    }
    state.areaSet.current.underwater = !!state.zone.surfaceKey && !state.location.isSpiritWorld;
}

// Get and memoize the connected underwater area for the given area, returning null if there is none.
export function getConnectedUnderwaterArea(state: GameState, area: AreaInstance, lastAreaInstance?: AreaInstance): AreaInstance|null {
    if (area.underwaterArea || area.underwaterArea === null) {
        return area.underwaterArea;
    }
    const underwaterZoneKey = zones[area.location.zoneKey].underwaterKey;
    if (!underwaterZoneKey || area.location.floor > 0) {
        area.underwaterArea = null;
        return null;
    }
    const underwaterLocation: ZoneLocation = {
        ...area.location,
        floor: zones[underwaterZoneKey].floors.length - 1,
        zoneKey: underwaterZoneKey,
    };
    const underwaterAreaDefinition = getAreaFromLocation(underwaterLocation);
    if (!underwaterAreaDefinition) {
        debugger;
    }
    // Keep using the existing instance if one is present.
    if (lastAreaInstance?.definition === underwaterAreaDefinition) {
        area.underwaterArea = lastAreaInstance;
    } else {
        area.underwaterArea = createAreaInstance(state, underwaterLocation);
    }
    return area.underwaterArea;
}

// Get and memoize the connected surface area for the given area, returning null if there is none.
export function getConnectedSurfaceArea(state: GameState, area: AreaInstance, lastAreaInstance?: AreaInstance): AreaInstance|null {
    if (area.surfaceArea || area.surfaceArea === null) {
        return area.surfaceArea;
    }
    const currentZone = zones[area.location.zoneKey];
    const surfaceZoneKey = currentZone.surfaceKey;
    if (!surfaceZoneKey || area.location.floor !== currentZone.floors.length - 1) {
        area.surfaceArea = null;
        return null;
    }
    const surfaceLocation: ZoneLocation = {
        ...area.location,
        floor: 0,
        zoneKey: surfaceZoneKey,
    };
    const surfaceAreaDefinition = getAreaFromLocation(surfaceLocation)
    if (!surfaceAreaDefinition) {
        debugger;
    }
    // Keep using the existing instance if one is present.
    if (lastAreaInstance?.definition === surfaceAreaDefinition) {
        area.surfaceArea = lastAreaInstance;
    } else {
        area.surfaceArea = createAreaInstance(state, surfaceLocation);
    }
    return area.surfaceArea;
}

export function linkObjects(state: GameState, areaSet: AreaSet = state.areaSet): void {
    for (const object of [...areaSet?.current.objects, ...areaSet?.alternate.objects]) {
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
            const areaGrids = state.areaSet?.current.definition.isSpiritWorld
                ? [zone.floors[floor].spiritGrid, zone.floors[floor].grid]
                : [zone.floors[floor].grid, zone.floors[floor].spiritGrid];
            const areaGrid = areaGrids[worldIndex];
            const inSpiritWorld = areaGrid === zone.floors[floor].spiritGrid;
            for (let y = 0; y < areaGrid.length; y++) {
                for (let x = 0; x < areaGrid[y].length; x++) {
                    for (const object of (areaGrid[y][x]?.objects || [])) {
                        if (object.id === objectId && object !== skipObject) {
                            if (checkLogic && !evaluateLogicDefinition(state, object)) {
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

export function getOrCreateAreaInstanceFromLocation(state: GameState, location: ZoneLocation): AreaInstance {
    const definition = getAreaFromLocation(location);
    for (const area of editingState.recentAreas) {
        if (area.definition === definition) {
            return area;
        }
    }
    return createAreaInstance(state, location);
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

export function createAreaInstance(state: GameState, location: ZoneLocation, isActiveArea: boolean = false): AreaInstance {
    const definition = getAreaFromLocation(location);
    for (const variant of (definition.variants ?? [])) {
        variant._editorType = 'variant';
    }
    const behaviorGrid: TileBehaviors[][] = [];
    const zone = zones[location.zoneKey];
    const areaSize = getAreaDimensions(definition, zone);
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
        location,
        alternateArea: null,
        definition: definition,
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
            return evaluateLogicDefinition(state, layer, true);
        }).map(layer => ({
            definition: layer,
            ...layer,
            ...layer.grid,
            tiles: mapTileNumbersToFullTiles(layer.grid.tiles),
            maskTiles: mapTileNumbersToFullTiles(layer.grid.mask),
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
        needsIceRefresh: true,
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
                        const parentMaskTile = allTiles[definition.parentDefinition.layers[definitionIndex].grid.mask?.[y]?.[x]];
                        const maskTile = mapTile(parentMaskTile);
                        if (maskTile) {
                            layer.maskTiles = layer.maskTiles || [];
                            layer.maskTiles[y] = layer.maskTiles[y] || [];
                            layer.maskTiles[y][x] = maskTile;
                        }
                    }
                }

            }
        }
    }
    applyVariantsToArea(state, instance);
    for (const layer of instance.layers) {
        applyLayerToBehaviorGrid(behaviorGrid, layer);
    }
    const newObjectInstances: ObjectInstance[] = [];
    for (const object of definition.objects.filter(object => evaluateLogicDefinition(state, object))) {
        const objectInstance = createObjectInstance(state, object);
        addObjectToArea(state, instance, objectInstance);
        newObjectInstances.push(objectInstance);
    }
    for (const objectInstance of newObjectInstances) {
        initializeObject(state, objectInstance, isActiveArea);
    }
    // instance.isCorrosive = evaluateLogicDefinition(state, instance.definition.corrosiveLogic, false);
    if (definition.specialBehaviorKey) {
        const specialBehavior = specialBehaviorsHash[definition.specialBehaviorKey] as SpecialAreaBehavior;
        specialBehavior?.apply(state, instance);
    }
    addRecentArea(instance);
    refreshAreaIce(state, instance);
    return instance;
}


export function refreshCurrentAreaLogic(state: GameState, mutationDuration = state.mutationDuration ?? MUTATE_DURATION): void {
    state.currentAreaNeedsLogicRefresh = false;
    const area = state.areaSet.current;
    if (!area) {
        return;
    }
    const wasHot = state.areaSet.areaSection?.isHot;
    if (state.areaSet.areaSection) {
        setAreaSection(state, getAreaSectionInstance(state, state.zone, area.definition, state.areaSet.areaSection.definition));
    }
    let lastLayerIndex = -1, refreshBehavior = false;
    for (let i = 0; i < area.definition.layers.length; i++) {
        const layerDefinition = area.definition.layers[i];
        const layerIndex = area.layers.findIndex(l => l.definition === layerDefinition);
        if (layerIndex >= 0) {
            lastLayerIndex = layerIndex;
        }
        // Skip evaluating layer logic altogether if no logic is set on it.
        if (!layerDefinition.hasCustomLogic && !layerDefinition.logicKey) {
            continue;
        }
        let showLayer = evaluateLogicDefinition(state, layerDefinition, true)
       /* if (layerDefinition.hasCustomLogic) {
            showLayer = isLogicValid(state, {
                requiredFlags: [layerDefinition.customLogic]
            }, layerDefinition.isInverted);
        }
        if (layerDefinition.logicKey) {
            showLayer = isLogicValid(state, logicHash[layerDefinition.logicKey], layerDefinition.isInverted);
        }*/
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
                    maskTiles: mapTileNumbersToFullTiles(definition.grid.mask),
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
    // Objects will be initialized after all objects are added to the area since some object initialization will depend on
    // other objects, for example beds/cocoons placing target NPC objects inside of them.
    const objectsToInitialize: ObjectInstance[] = [];
    for (let instance of [area, area.alternateArea]) {
        if (refreshBehavior) {
            state.map.needsRefresh = true;
            state.fadeLevel = (state.areaSet.areaSection.dark ?? 0) / 100;
            // This was causing the player to stutter during lava fill on Flame Beast, do we need this?
            // state.hero.vx = state.hero.vy = 0;
            const nextAreaInstance = createAreaInstance(state, instance.location, true);
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
            if (state.areaSet.current === instance) {
                if (mutationDuration <= 0) {
                    state.areaSet.current = nextAreaInstance;
                    state.hero.area = state.areaSet.current;
                } else {
                    state.mutationState = {
                        time: 0,
                        duration: mutationDuration,
                        nextAreaSet: {
                            current: nextAreaInstance,
                            // This will get replaced by the updated alternate area in the block below.
                            alternate: state.areaSet.alternate,
                        },
                    };
                }
            } else if (state.areaSet.alternate === instance) {
                if (mutationDuration <= 0) {
                    state.areaSet.alternate = nextAreaInstance;
                } else {
                    if (!state.mutationState) {
                        debugger;
                    }
                    state.mutationState.nextAreaSet.alternate = nextAreaInstance;
                }
            }

            // Copy the objects from the current area and then apply the object logic update code that follows below.
            nextAreaInstance.objects = [];
            for (const object of [...instance.objects]) {
                addObjectToArea(state, nextAreaInstance, object);
                objectsToInitialize.push(object);
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
        if (!wasHot && state.areaSet.areaSection?.isHot) {
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
                || (o.definition?.id && o.definition.id === object.id)
            );
            if (evaluateLogicDefinition(state, object)) {
                // If the object is valid but was never added to the area, add it now.
                if (!objectInstance && !instance.removedObjectDefinitions.has(object)) {
                    objectInstance = createObjectInstance(state, object);
                    // Note that special behavior is applied to objects as part of adding them to the area.
                    addObjectToArea(state, instance, objectInstance);
                    objectsToInitialize.push(objectInstance);
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
    for (const object of objectsToInitialize) {
        initializeObject(state, object, true);
    }
    checkIfAllEnemiesAreDefeated(state, area);
    checkIfAllEnemiesAreDefeated(state, area.alternateArea);
}


export function initializeAreaSet(state: GameState, areaSet: AreaSet, isActiveArea: boolean) {
    // TODO: figure out what needs to be done for variants.

    // TODO: If necessary, add `onBeforeLinkObjects`, if some objects require running code before linking,
    // for example, if an object had initialization logic to move it around independent of initial linked objects
    // that may cause it to link with a different object afterwards.
    linkObjects(state);
    for (const object of [...areaSet.current.objects, ...areaSet.alternate.objects]) {
        initializeObject(state, object, isActiveArea);
    }
    checkIfAllEnemiesAreDefeated(state, areaSet.current);
    checkIfAllEnemiesAreDefeated(state, areaSet.alternate);
}
