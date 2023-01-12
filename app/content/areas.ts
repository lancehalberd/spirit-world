import { find } from 'lodash';

import { addParticleAnimations } from 'app/content/effects/animationEffect';
import { TextCue } from 'app/content/effects/textCue';
import { changeObjectStatus, createObjectInstance, findObjectInstanceById } from 'app/content/objects';
import { allTiles } from 'app/content/tiles';
import { logicHash, isLogicValid } from 'app/content/logic';
import { enterZoneByDoorCallback } from 'app/content/objects/door';
import { enterZoneByTeleporterCallback } from 'app/content/objects/teleporter';
import { dropItemFromTable } from 'app/content/objects/lootObject';
import { checkToUpdateSpawnLocation } from 'app/content/spawnLocations';
import { zones } from 'app/content/zones';
import { editingState } from 'app/development/tileEditor';
import { createCanvasAndContext } from 'app/dom';
import { checkForFloorEffects } from 'app/movement/checkForFloorEffects';
import { isPointInShortRect } from 'app/utils/index';
import { playSound } from 'app/musicController';
import { getFullZoneLocation } from 'app/state';
import { removeTextCue } from 'app/scriptEvents';
import { updateCamera } from 'app/updateCamera';
import { specialBehaviorsHash } from 'app/content/specialBehaviors';

import {
    AreaDefinition, AreaInstance, AreaLayerDefinition,
    Direction, EffectInstance, Enemy, EntranceDefinition,
    FullTile, GameState, Hero, TileCoords,
    LogicDefinition,
    ObjectDefinition,
    ObjectInstance,
    Rect, SpecialAreaBehavior, Tile, TileBehaviors,
    ZoneLocation,
} from 'app/types';


export function playAreaSound(state: GameState, area: AreaInstance, key: string): any {
    if (!key || state.areaInstance !== area) {
        return;
    }
    return playSound(key);
}

export function getDefaultArea(): AreaDefinition {
    return {
        default: true,
        layers: [
            {
                key: 'floor',
                grid: {
                    // The dimensions of the grid.
                    w: 32,
                    h: 32,
                    // The matrix of tiles
                    tiles: [],
                },
            },
            {
                key: 'field',
                grid: {
                    // The dimensions of the grid.
                    w: 32,
                    h: 32,
                    // The matrix of tiles
                    tiles: [],
                },
            },
        ],
        objects: [],
        sections: [{ x: 0, y: 0, w: 32, h: 32}],
    };
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
        sections: parentDefinition.sections,
    };
}

export function getAreaFromLocation(location: ZoneLocation): AreaDefinition {
    const floor = zones[location.zoneKey].floors[location.floor];
    const grid = location.isSpiritWorld ? floor.spiritGrid : floor.grid;
    const alternateGrid = location.isSpiritWorld ? floor.grid : floor.spiritGrid;

    const {x, y} = location.areaGridCoords;
    if (!grid[y]) {
        grid[y] = [];
    }
    if (!grid[y][x]) {
        grid[y][x] =
            initializeAreaTiles(location.isSpiritWorld ? getDefaultSpiritArea(location) : getDefaultArea());
        return grid[y][x] as AreaDefinition;
    } else if (!grid[y][x].layers) {
        const areaDefinition = grid[y][x];
        const alternateAreaDefinition = alternateGrid[y][x];
        if (alternateAreaDefinition.layers) {
            grid[y][x] = initializeAreaTiles({
                ...areaDefinition,
                layers: alternateAreaDefinition.layers.map(copyLayerTemplate),
            });
        } else {
            const defaultLayers = (location.isSpiritWorld ? getDefaultSpiritArea(location) : getDefaultArea()).layers;
            grid[y][x] = initializeAreaTiles({
                ...areaDefinition,
                layers: defaultLayers
            });
        }
        return grid[y][x] as AreaDefinition;
    }
    return grid[y][x];
}

export function getAreaInstanceFromLocation(state: GameState, location: ZoneLocation): AreaInstance {
    return createAreaInstance(state, getAreaFromLocation(location));
}

export function initializeAreaLayerTiles(layer: AreaLayerDefinition): AreaLayerDefinition {
    const tiles = layer.grid.tiles;
    for (let y = 0; y < layer.grid.h; y++) {
        tiles[y] = tiles[y] || [];
        // We need to do this so that each row has the correct number of elements, as in some places
        // we use row.length for iterating through tiles or checking the bounds of the grid.
        for (let x = 0; x < layer.grid.w; x++) {
            tiles[y][x] = tiles[y][x] || null;
        }
    }
    return layer;
}

export function initializeAreaTiles(area: AreaDefinition): AreaDefinition {
    area.layers.map(initializeAreaLayerTiles);
    return area;
}

export function swapHeroStates(heroA: Hero, heroB: Hero) {
    const allKeys = [...new Set([...Object.keys(heroA), ...Object.keys(heroB)])];
    for (const key of allKeys) {
        if (key === 'behaviors' || key === 'magic'
            || key === 'isUncontrollable' || key === 'explosionTime'
        ) {
            continue;
        }
        const temp = heroA[key];
        heroA[key] = heroB[key];
        heroB[key] = temp;
    }
    // Update chakrams to match their correct owner.
    for (const hero of [heroA, heroB]) {
        if (hero.heldChakram) {
            hero.heldChakram.hero = hero;
        }
        for (const chakram of hero.thrownChakrams) {
            chakram.source = hero;
        }
    }
}

export function removeAllClones(state: GameState): void {
    for (const clone of state.hero.clones) {
        removeObjectFromArea(state, clone);
    }
    state.hero.clones = []
}

export function enterLocation(
    state: GameState,
    location: ZoneLocation,
    instant: boolean = true,
    callback: () => void = null,
    preserveZoneFlags = false
): void {
    // Remve astral projection when switching areas.
    if (state.hero.astralProjection) {
        removeObjectFromArea(state, state.hero.astralProjection);
        state.hero.astralProjection = null;
    }
    removeTextCue(state);
    if (state.hero.action === 'meditating') {
        state.hero.action = null;
    }
    state.hero.spiritRadius = 0;
    if (!instant) {
        state.transitionState = {
            callback,
            nextLocation: location,
            time: 0,
            type: 'fade',
        };
        if (state.underwaterAreaInstance && state.zone.underwaterKey === location.zoneKey) {
            state.transitionState.type = 'diving';
            state.transitionState.nextAreaInstance = state.underwaterAreaInstance;
            state.hero.vx = state.hero.vy = 0;
        } else if (state.zone.surfaceKey === location.zoneKey) {
            state.transitionState.type = 'surfacing';
            state.transitionState.nextAreaInstance = state.surfaceAreaInstance;
            state.hero.vx = state.hero.vy = 0;
        } else if (!!state.location.isSpiritWorld !== !!location.isSpiritWorld && state.location.zoneKey === location.zoneKey) {
            state.transitionState.type = 'portal';
        } else if (state.location.logicalZoneKey !== getFullZoneLocation(location).logicalZoneKey) {
            state.transitionState.type = 'circle';
        }
        const targetAreaDefinition = getAreaFromLocation(location);
        if (state.alternateAreaInstance.definition === targetAreaDefinition) {
            state.transitionState.nextAreaInstance = state.alternateAreaInstance;
            state.transitionState.nextAlternateAreaInstance = state.areaInstance;
            // Bring the held chakram with you.
            if (state.hero.heldChakram) {
                removeEffectFromArea(state, state.hero.heldChakram);
                addEffectToArea(state, state.transitionState.nextAreaInstance, state.hero.heldChakram);
            }
        }
        return;
    }
    // Clear zone flags when changing zones.
    if (!preserveZoneFlags && state.location.logicalZoneKey !== getFullZoneLocation(location).logicalZoneKey) {
        state.savedState.zoneFlags = {};
    }
    state.location = getFullZoneLocation({
        ...location,
        areaGridCoords: {...location.areaGridCoords},
        z: 0,
    });
    state.zone = zones[location.zoneKey];
    state.hero.x = location.x;
    state.hero.y = location.y;

    const floor = state.zone.floors[location.floor];
    if (!floor) {
        console.log('Invalid floor', state.location);
        return;
    }
    state.floor = floor;
    state.areaGrid = location.isSpiritWorld ? floor.spiritGrid : floor.grid;
    state.location.areaGridCoords = {
        y: state.location.areaGridCoords.y % state.areaGrid.length,
        x: state.location.areaGridCoords.x % state.areaGrid[state.location.areaGridCoords.y % state.areaGrid.length].length,
    };
    state.location = getFullZoneLocation(state.location);
    const area = getAreaFromLocation(state.location);
    const alternateArea = getAreaFromLocation({...state.location, isSpiritWorld: !state.location.isSpiritWorld});

    // Remove all clones on changing areas.
    cleanupHeroFromArea(state);
    const lastAreaInstance = state.areaInstance;
    // Use the existing area instances on the transition state if any are present.
    state.areaInstance = state.transitionState?.nextAreaInstance
        || createAreaInstance(state, area);
    state.alternateAreaInstance = state.transitionState?.nextAlternateAreaInstance
        || createAreaInstance(state, alternateArea);
    state.areaInstance.alternateArea = state.alternateAreaInstance;
    state.alternateAreaInstance.alternateArea = state.areaInstance;
    state.fadeLevel = (state.areaInstance.dark || 0) / 100;
    linkObjects(state);
    state.hero.area = state.areaInstance;
    state.hero.x = location.x;
    state.hero.y = location.y;
    if (location.z >= 0) {
        state.hero.z = location.z;
        /*if (location.z > 0) {
            state.hero.action = 'knocked';
            // Make sure the character falls straight down.
            state.hero.vx = 0;
            state.hero.vy = 0;
        }*/
    }
    state.hero.vx = 0;
    state.hero.vy = 0;
    // Don't let magic become infinitely negative while being drained.
    // We could also set magic to at least 0 during any zone transition instead of this.
    state.hero.magic = Math.max(state.hero.magic, 0);
    state.hero.actualMagicRegen = Math.max(state.hero.actualMagicRegen, 0);
    state.hero.safeD = state.hero.d;
    state.hero.safeX = location.x;
    state.hero.safeY = location.y;
    setAreaSection(state, state.hero.d, true);
    updateCamera(state, 512);
    checkToUpdateSpawnLocation(state);
    // Make sure the actor is shown as swimming/wading during the transition frames.
    checkForFloorEffects(state, state.hero);
    setConnectedAreas(state, lastAreaInstance);
    checkIfAllEnemiesAreDefeated(state, state.areaInstance);
    for (const object of [...state.areaInstance.objects, ...state.areaInstance.effects]) {
        if (object.onEnterArea) {
            object.onEnterArea(state);
        }
    }
}

export function setConnectedAreas(state: GameState, lastAreaInstance: AreaInstance) {
    state.underwaterAreaInstance = null;
    if (state.zone.underwaterKey && state.location.floor === 0) {
        const underwaterArea = getAreaFromLocation({
            ...state.location,
            floor: zones[state.zone.underwaterKey].floors.length - 1,
            zoneKey: state.zone.underwaterKey,
        })
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
    if (!object.definition?.linked) {
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

export function findEntranceById(areaInstance: AreaInstance, id: string, skippedDefinitions: ObjectDefinition[]): ObjectInstance {
    for (const object of areaInstance.objects) {
        if (!object.definition || skippedDefinitions?.includes(object.definition)) {
            continue;
        }
        if (object.definition.type !== 'enemy' && object.definition.type !== 'boss' && object.definition.id === id) {
            return object;
        }
    }
    console.error('Missing target', id);
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

export function enterZoneByTarget(
    state: GameState,
    zoneKey: string,
    targetObjectId: string,
    skipObject: ObjectDefinition,
    instant: boolean = true,
    callback: () => void = null
): boolean {
    const zone = zones[zoneKey];
    if (!zone) {
        console.error(`Missing zone: ${zoneKey}`);
        return false;
    }
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
                        if (object.id === targetObjectId && object !== skipObject) {
                            if (!isObjectLogicValid(state, object)) {
                                continue;
                            }
                            enterLocation(state, {
                                zoneKey,
                                floor,
                                areaGridCoords: {x, y},
                                x: object.x,
                                y: object.y,
                                d: state.hero.d,
                                isSpiritWorld: inSpiritWorld,
                            }, instant, () => {
                                const target = findEntranceById(state.areaInstance, targetObjectId, [skipObject]);
                                if (target?.getHitbox) {
                                    const hitbox = target.getHitbox(state);
                                    state.hero.x = hitbox.x + hitbox.w / 2 - state.hero.w / 2;
                                    state.hero.y = hitbox.y + hitbox.h / 2 - state.hero.h / 2;
                                    setAreaSection(state, state.hero.d, true);
                                    checkForFloorEffects(state, state.hero);
                                    updateCamera(state, 512);
                                }
                                // Technically this could also be a MarkerDefinition.
                                const definition = target.definition as EntranceDefinition;
                                if (definition.locationCue) {
                                    const textCue = new TextCue(state, { text: definition.locationCue});
                                    addEffectToArea(state, state.areaInstance, textCue);
                                }
                                // Entering via a door requires some special logic to orient the
                                // character to the door properly.
                                if (definition.type === 'door') {
                                    enterZoneByDoorCallback(state, targetObjectId, skipObject);
                                } else if (definition.type === 'teleporter') {
                                    enterZoneByTeleporterCallback(state, targetObjectId);
                                }
                                callback?.();
                            });
                            return true;
                        }
                    }
                }
            }
        }
    }
    console.error('Could not find', targetObjectId, 'in', zoneKey);
    return false;
}

export function setNextAreaSection(state: GameState, d: Direction): void {
    //console.log('setNextAreaSection', d);
    removeAllClones(state);
    state.nextAreaSection = state.areaInstance.definition.sections[0];
    const hero = state.hero;
    let x = hero.x / 16;
    let y = hero.y / 16;
    if (d === 'right') {
        x += hero.w / 16;
    }
    if (d === 'down') {
        y += hero.h / 16;
    }
    for (const section of state.areaInstance.definition.sections) {
        if (isPointInShortRect(x, y, section)) {
            state.nextAreaSection = section;
            break;
        }
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
    cleanupHeroFromArea(state);
    state.hero.safeD = state.hero.d;
    state.hero.safeX = state.hero.x;
    state.hero.safeY = state.hero.y;
    checkIfAllEnemiesAreDefeated(state, state.areaInstance);
    checkIfAllEnemiesAreDefeated(state, state.alternateAreaInstance);
}

export function setAreaSection(state: GameState, d: Direction, newArea: boolean = false): void {
    //console.log('setAreaSection', state.hero.x, state.hero.y, d);
    const lastAreaSection = state.areaSection;
    state.areaSection = state.areaInstance.definition.sections[0];
    let x = Math.min(32, Math.max(0, (state.hero.x + 8) / 16));
    let y = Math.min(32, Math.max(0, (state.hero.y + 8) / 16));
    for (const section of state.areaInstance.definition.sections) {
        if (isPointInShortRect(x, y, section)) {
            state.areaSection = section;
            break;
        }
    }
    if (newArea || lastAreaSection !== state.areaSection) {
        cleanupHeroFromArea(state);
        state.hero.safeD = state.hero.d;
        state.hero.safeX = state.hero.x;
        state.hero.safeY = state.hero.y;
    }
}

export function cleanupHeroFromArea(state: GameState): void {
    for (const hero of [state.hero, ...state.hero.clones]) {
        hero.activeStaff?.remove(state);
    }
    removeAllClones(state);
}

export function scrollToArea(state: GameState, area: AreaDefinition, direction: Direction): void {
    //console.log('scrollToArea', direction);
    removeAllClones(state);
    state.nextAreaInstance = createAreaInstance(state, area);
    if (direction === 'up') {
        state.nextAreaInstance.cameraOffset.y = -state.nextAreaInstance.canvas.height;
    }
    if (direction === 'down') {
        state.nextAreaInstance.cameraOffset.y = state.areaInstance.canvas.height;
    }
    if (direction === 'left') {
        state.nextAreaInstance.cameraOffset.x = -state.nextAreaInstance.canvas.width;
    }
    if (direction === 'right') {
        state.nextAreaInstance.cameraOffset.x = state.areaInstance.canvas.width;
    }
}

export function applyLayerToBehaviorGrid(behaviorGrid: TileBehaviors[][], layer: AreaLayerDefinition, parentLayer: AreaLayerDefinition): void {
    const tiles = layer.grid.tiles;
    const isForeground = layer.drawPriority === 'foreground';
    for (let y = 0; y < tiles.length; y++) {
        if (!behaviorGrid[y]) {
            behaviorGrid[y] = [];
        }
        for (let x = 0; x < tiles.length; x++) {
            let tile = tiles[y][x];
            if (!tile && parentLayer) {
                tile = parentLayer.grid.tiles[y]?.[x];
            }
            if (!tile) {
                continue;
            }
            const behaviors = allTiles[tile]?.behaviors;
            // The behavior grid combines behaviors of all layers, with higher layers
            // overriding the behavior of lower layers.
            if (behaviors) {
                applyTileToBehaviorGrid(behaviorGrid, {x, y}, allTiles[tile], isForeground);
            }
        }
    }
}

// This resets the tile behavior for a specific tile to whatever the combined behavior of the layers are.
// This is useful when an object in a tile was overriding the tile behavior beneath it and we need to
// reconstruct the original behavior after the object is removed.
export function resetTileBehavior(area: AreaInstance, {x, y}: Tile): void {
    delete area.behaviorGrid?.[y]?.[x];
    for (const layer of area.layers) {
        const tile = layer.tiles[y]?.[x];
        if (!tile) {
            continue;
        }
        const isForeground = (layer.definition.drawPriority ?? layer.definition.key) === 'foreground';
        // The behavior grid combines behaviors of all layers, with higher layers
        // overriding the behavior of lower layers.
        if (tile.behaviors) {
            if (!area.behaviorGrid[y]) {
                area.behaviorGrid[y] = [];
            }
            applyTileToBehaviorGrid(area.behaviorGrid, {x, y}, tile, isForeground);
        }
    }
}

function applyTileToBehaviorGrid(behaviorGrid: TileBehaviors[][], {x, y}: Tile, tile: FullTile, isForeground: boolean): void {
    const behaviors = tile.behaviors;
    // Tiles 0/1 are the null and empty tile and should not impact the tile behavior.
    if (!behaviors || tile.index < 2) {
        return;
    }
    // Lava + clouds erase the behaviors of tiles underneath them.
    if (behaviors.isLava || behaviors.cloudGround) {
        behaviorGrid[y][x] = {};
    }
    // Any background tile rendered on top of lava removes the lava behavior from it.
    if (!isForeground && behaviorGrid[y]?.[x]
        && !behaviors.isLava && !behaviors.isLavaMap && behaviors.isGround !== false
    ) {
        delete behaviorGrid[y][x].isLava;
        delete behaviorGrid[y][x].isLavaMap;
    }
    // Any background tile rendered on top of a pit removes the pit behavior.
    // If this causes issues with decorations like shadows we may need to explicitly set pit = false
    // on tiles that can cover up pits (like in the sky) and use that, or alternatively, make a separate
    // sky behavior that has this behavior instead of pits.
    if (!isForeground && behaviorGrid[y]?.[x]?.pit && !behaviors.pit && behaviors.isGround !== false) {
        delete behaviorGrid[y][x].pit;
    }
    if (!isForeground && behaviorGrid[y]?.[x]?.cloudGround && !behaviors.cloudGround) {
        delete behaviorGrid[y][x].cloudGround;
    }
    const lightRadius = Math.max(behaviorGrid[y][x]?.lightRadius || 0, behaviors.lightRadius || 0);
    const brightness = Math.max(behaviorGrid[y][x]?.brightness || 0, behaviors.brightness || 0);
    const baseSolidMap = behaviorGrid[y][x]?.solidMap;
    behaviorGrid[y][x] = {...(behaviorGrid[y][x] || {}), ...behaviors, lightRadius, brightness};
    if (baseSolidMap && behaviors.solidMap) {
        behaviorGrid[y][x].solidMap = new Uint16Array([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);
        for (let row = 0; row < 16; row++) {
            behaviorGrid[y][x].solidMap[row] = baseSolidMap[row] | behaviors.solidMap[row];
        }
    }
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

function createAreaInstance(state: GameState, definition: AreaDefinition): AreaInstance {
    const behaviorGrid: TileBehaviors[][] = [];
    const [canvas, context] = createCanvasAndContext(
        definition.layers[0].grid.w * 16,
        definition.layers[0].grid.h * 16,
    );
    const instance: AreaInstance = {
        alternateArea: null,
        definition: definition,
        dark: definition.dark,
        w: definition.layers[0].grid.w,
        h: definition.layers[0].grid.h,
        behaviorGrid,
        tilesDrawn: [],
        checkToRedrawTiles: true,
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
        removedObjectIds: [],
        priorityObjects: [],
        canvas,
        context,
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
            const parentLayerDefinition = definition.parentDefinition.layers[definitionIndex];
            if (!parentLayerDefinition) {
                console.warn('Missing parent layer definition for layer', layer);
                console.warn('Copying child layer to parent');
                definition.parentDefinition.layers[definitionIndex] = initializeAreaLayerTiles({
                    ...layer.definition,
                    grid: {
                        ...layer.definition.grid,
                        tiles: [],
                    },
                });
                //debugger;
                continue;
            }
            for (let y = 0; y < layer.tiles.length; y++) {
                for (let x = 0; x < layer.tiles[y].length; x++) {
                    if (!layer.tiles[y][x]) {
                        const parentTile = allTiles[definition.parentDefinition.layers[definitionIndex].grid.tiles[y]?.[x]];
                        // Tiles with linked offsets map to different tiles than the parent definition.
                        const linkedOffset = parentTile?.behaviors?.linkedOffset || 0;
                        const tile = linkedOffset ? allTiles[parentTile.index + linkedOffset] : parentTile;
                        layer.tiles[y][x] = tile;
                        layer.originalTiles[y][x] = tile;
                    }
                }

            }
        }
    }
    for (const layer of instance.layers) {
        const definitionIndex = definition.layers.indexOf(layer.definition);
        applyLayerToBehaviorGrid(behaviorGrid,
            instance.definition.layers[definitionIndex],
            definition.parentDefinition?.layers?.[definitionIndex]
        );
    }
    definition.objects.filter(
        object => isObjectLogicValid(state, object)
    ).map(o => addObjectToArea(state, instance, createObjectInstance(state, o)));
    instance.isHot = evaluateLogicDefinition(state, instance.definition.hotLogic, false);
    if (definition.specialBehaviorKey) {
        const specialBehavior = specialBehaviorsHash[definition.specialBehaviorKey] as SpecialAreaBehavior;
        specialBehavior?.apply(state, instance);
    }
    return instance;
}

export function evaluateLogicDefinition(state: GameState, logicDefinition?: LogicDefinition, defaultValue: boolean = true): boolean {
    if (!logicDefinition) {
        return defaultValue;
    }
    if (logicDefinition.isTrue) {
        return !logicDefinition.isInverted;
    }
    if (logicDefinition.hasCustomLogic) {
        return isLogicValid(state, { requiredFlags: [logicDefinition.customLogic] }, logicDefinition.isInverted);
    }
    if (logicDefinition.logicKey) {
        return isLogicValid(state, logicHash[logicDefinition.logicKey], logicDefinition.isInverted);
    }
    return defaultValue;
}

export function getAreaSize(state: GameState): {w: number, h: number, section: Rect} {
    const area = state.areaInstance;
    const areaSection = state.nextAreaSection || state.areaSection;
    return {
        w: 16 * area.w,
        h: 16 * area.h,
        section: {
            x: areaSection.x * 16,
            y: areaSection.y * 16,
            w: areaSection.w * 16,
            h: areaSection.h * 16,
        },
    }
}

export function refreshAreaLogic(state: GameState, area: AreaInstance, fastRefresh = false): void {
    if (!area) {
        return;
    }
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
                instance.layers.splice(lastLayerIndex, 0, newLayer);
            }
            refreshBehavior = true;
        }
    }
    for (const instance of [area, area.alternateArea]) {
        if (instance.definition.specialBehaviorKey) {
            const specialBehavior = specialBehaviorsHash[instance.definition.specialBehaviorKey] as SpecialAreaBehavior;
            specialBehavior?.apply(state, instance);
        }
    }
    for (let instance of [area, area.alternateArea]) {
        const shouldBeHot = evaluateLogicDefinition(state, instance.definition.hotLogic, false);
        if (refreshBehavior || instance.isHot !== shouldBeHot) {
            state.fadeLevel = (state.areaInstance.dark || 0) / 100;
            state.hero.vx = state.hero.vy = 0;
            const nextAreaInstance = createAreaInstance(state, instance.definition);
            nextAreaInstance.alternateArea = instance.alternateArea;
            nextAreaInstance.alternateArea.alternateArea = nextAreaInstance;
            // Refresh tile behaviors+canvases.
            nextAreaInstance.tilesDrawn = [];
            nextAreaInstance.checkToRedrawTiles = true;
            nextAreaInstance.behaviorGrid = [];
            nextAreaInstance.layers = [...instance.layers];
            /*for (const layer of nextAreaInstance.layers || []) {
                const definitionIndex = nextAreaInstance.definition.layers.indexOf(layer.definition);
                applyLayerToBehaviorGrid(nextAreaInstance.behaviorGrid,
                    nextAreaInstance.definition.layers[definitionIndex],
                    nextAreaInstance.definition.parentDefinition?.layers?.[definitionIndex]
                );
            }*/
            // Update any tile behaviors that may have changed as layers were added/removed.
            for (let y = 0; y < 32; y++) {
                for (let x = 0; x < 32; x++) {
                    for (const layer of nextAreaInstance.layers) {
                        layer.tiles[y][x] = layer.originalTiles[y][x];
                    }
                    resetTileBehavior(nextAreaInstance, {x, y});
                }
            }

            // If this is the transition currently being viewed, then apply either fash or normal transition logic.
            if (state.areaInstance === instance) {
                if (fastRefresh) {
                    state.areaInstance = nextAreaInstance;
                    state.hero.area = state.areaInstance;
                } else {
                    state.transitionState = {
                        callback: () => null,
                        nextLocation: state.location,
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
            instance.objects = nextAreaInstance.objects;
            nextAreaInstance.effects = [];
            for (const effect of [...instance.effects]) {
                addEffectToArea(state, nextAreaInstance, effect);
            }
            // The effects will be removed from the current instance, so add them back so they will render during the transition.
            instance.effects = nextAreaInstance.effects;
            // Since objects are on the next area now, we must also move the priority object queue to the next area.
            nextAreaInstance.priorityObjects = instance.priorityObjects;
            // Without this the HUD/music logic will briefly be unable to detect bosses in the area which can cause boss music
            // to restart during logic refreshes.
            nextAreaInstance.enemies = [...instance.enemies];
            instance.priorityObjects = []
            instance = nextAreaInstance;
            if (nextAreaInstance.objects.find(o => o.definition?.id === 'voidTree' && o instanceof Enemy && !o.params.allHearts)) {
                debugger;
            }
        }
        for (const object of instance.definition.objects) {
            /*if (object.id.includes('void')
                && !object.id.includes('-')
                && !object.id.includes('Entrance')
                && !object.id.includes('Exit')
                && object.id !== 'voidTree' && !state.savedState.objectFlags[object.id]) {
                debugger;
            }*/
            if (!object.logicKey && !object.hasCustomLogic) {
                if (object.specialBehaviorKey) {
                    const objectInstance = instance.objects.find(o => o.definition === object);
                    if (objectInstance) {
                        specialBehaviorsHash[objectInstance.definition.specialBehaviorKey].apply?.(state, objectInstance as any);
                    }
                }
                continue;
            }
            let objectInstance = instance.objects.find(o => o.definition === object);
            if (isObjectLogicValid(state, object)) {
                // If the object is valid but was never added to the area, add it now.
                if (!objectInstance && object.id && !instance.removedObjectIds.includes(object.id)) {
                    objectInstance = createObjectInstance(state, object);
                    addObjectToArea(state, instance, objectInstance);
                } else if (objectInstance) {
                    if (objectInstance.definition.specialBehaviorKey) {
                        specialBehaviorsHash[objectInstance.definition.specialBehaviorKey].apply?.(state, objectInstance as any);
                    }
                }
            } else {
                // If the object is invalid but present, remove it from the area, but don't track it as removed by gameplay
                // so that logical changes can bring it back.
                if (objectInstance) {
                    removeObjectFromArea(state, objectInstance, false);
                }
            }
        }
        for (const object of area.objects) {
            object.refreshLogic?.(state);
            if (object.definition?.specialBehaviorKey) {
                try {
                    specialBehaviorsHash[object.definition.specialBehaviorKey].apply?.(state, object as any);
                } catch (error) {
                    console.error(object.definition.specialBehaviorKey);
                }
            }
        }
        //console.log('new instance', instance.objects.map( o => o.definition?.id ));
        if (instance.objects.find(o => o.definition?.id === 'voidTree' && o instanceof Enemy && !o.params.allHearts)) {
            debugger;
        }
    }
    checkIfAllEnemiesAreDefeated(state, area);
}

export function applyBehaviorToTile(area: AreaInstance, x: number, y: number, behavior: TileBehaviors): void {
    if (!area.behaviorGrid[y]) {
        area.behaviorGrid[y] = [];
    }
    if (!area.behaviorGrid[y][x]) {
        area.behaviorGrid[y][x] = {};
    }
    area.behaviorGrid[y][x] = {...area.behaviorGrid[y][x], ...behavior};
}

export function isObjectLogicValid(state: GameState, definition: ObjectDefinition): boolean {
    if (definition.hasCustomLogic && definition.customLogic) {
        return isLogicValid(state, {requiredFlags: [definition.customLogic]}, definition.invertLogic);
    }
    if (!definition.logicKey) {
        return true;
    }
    const logic = logicHash[definition.logicKey];
    // Logic should never be missing, so surface an error and hide the layer.
    if (!logic) {
        console.error('Missing logic!', definition.logicKey);
        debugger;
        return false;
    }
    return isLogicValid(state, logic, definition.invertLogic);
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
        let object = findObjectInstanceById(area, definition.id, true);
        if (!object) {
            object = createObjectInstance(state, definition);
            if (object.alwaysReset || object.shouldRespawn && object.shouldRespawn(state)) {
                addObjectToArea(state, area, object);
            }
        }
    }
}
function hitboxToGrid(hitbox: Rect): Rect {
    const x = (hitbox.x / 16) | 0;
    const w = (hitbox.w / 16) | 0;
    const y = (hitbox.y / 16) | 0;
    const h = (hitbox.h / 16) | 0;
    return {x, y, w, h};
}
export function addObjectToArea(state: GameState, area: AreaInstance, object: ObjectInstance): void {
    if (object.area && object.area !== area) {
        removeObjectFromArea(state, object);
    }
    object.area = area;
    if (object.add) {
        object.add(state, area);
    } else {
        area.objects.push(object);
    }

    if (object.definition?.specialBehaviorKey) {
        try {
            specialBehaviorsHash[object.definition.specialBehaviorKey].apply?.(state, object as any);
        } catch (error) {
            console.error(object.definition.specialBehaviorKey);
        }
    }

    if (object.applyBehaviorsToGrid && object.behaviors) {
        const gridRect = hitboxToGrid(object.getHitbox());
        for (let x = gridRect.x; x < gridRect.x + gridRect.w; x++) {
            for (let y = gridRect.y; y < gridRect.y + gridRect.h; y++) {
                applyBehaviorToTile(area, x, y, object.behaviors);
            }
        }
    }
}
export function removeObjectFromArea(state: GameState, object: ObjectInstance, trackId: boolean = true): void {
    if (!object.area) {
        return;
    }
    if (object.definition?.id && trackId) {
        object.area.removedObjectIds.push(object.definition.id);
    }
    if (object.remove) {
        object.remove(state);
        object.area = null;
    } else {
        if (object.cleanup) {
            object.cleanup(state);
        }
        const index = object.area.objects.indexOf(object);
        if (index >= 0) {
            object.area.objects.splice(index, 1);
        }
        object.area = null;
    }
}

export function addEffectToArea(state: GameState, area: AreaInstance, effect: EffectInstance): void {
    if (effect.area && effect.area !== area) {
        removeEffectFromArea(state, effect);
    }
    effect.area = area;
    if (effect.add) {
        effect.add(state, area);
    } else {
        area.effects.push(effect);
    }
}
export function removeEffectFromArea(state: GameState, effect: EffectInstance): void {
    if (!effect.area) {
        return;
    }
    if (effect.remove) {
        effect.remove(state);
        effect.area = null;
    } else {
        if (effect.cleanup) {
            effect.cleanup(state);
        }
        const index = effect.area.effects.indexOf(effect);
        if (index >= 0) {
            effect.area.effects.splice(index, 1);
        }
        effect.area = null;
    }
}

export function destroyTile(state: GameState, area: AreaInstance, target: TileCoords, noParticles: boolean = false): void {
    const layer = find(area.layers, { key: target.layerKey });
    if (!layer) {
        console.error(`Missing target layer: ${target.layerKey}`);
        return;
    }
    const behavior = area.behaviorGrid?.[target.y]?.[target.x];
    if (area.tilesDrawn[target.y]?.[target.x]) {
        area.tilesDrawn[target.y][target.x] = false;
    }
    area.checkToRedrawTiles = true;
    const underTile = behavior?.underTile || 0;
    layer.tiles[target.y][target.x] = allTiles[underTile];
    if (behavior.breakSound) {
        playAreaSound(state, area, behavior.breakSound);
    }

    resetTileBehavior(area, target);
    if (!noParticles && behavior.particles) {
        addParticleAnimations(state, area, target.x * 16 + 8, target.y * 16 + 8, 4, behavior.particles, behavior);
    }
    if (behavior?.lootTable) {
        dropItemFromTable(state, area, behavior.lootTable,
            (target.x + 0.5) * 16,
            (target.y + 0.5) * 16
        );
    }
}


export function checkIfAllEnemiesAreDefeated(state: GameState, area: AreaInstance): void {
    // Don't use `enemyTargets` here since this runs before it is populated sometimes.
    const enemiesAreDefeated = !area.objects.some(e =>
        (e instanceof Enemy) && e.status !== 'gone' && e.isFromCurrentSection(state)
    );
    const { section } = getAreaSize(state);
    let playChime = false;
    for (const object of area.objects) {
        if (!object.getHitbox) {
            continue;
        }
        const hitbox = object.getHitbox(state);
        if (hitbox.x < section.x ||
            hitbox.x >= section.x + section.w ||
            hitbox.y < section.y ||
            hitbox.y >= section.y + section.h
        ) {
            continue;
        }
        if (enemiesAreDefeated) {
            if (object.status === 'hiddenEnemy') {
                changeObjectStatus(state, object, 'normal');
                playChime = true;
            }
            if (object.status === 'closedEnemy') {
                changeObjectStatus(state, object, 'normal');
                playChime = true;
            }
        } else {
            // Close doors if new enemies appear.
            if (object.definition?.status === 'closedEnemy') {
                changeObjectStatus(state, object, 'closedEnemy');
            }
        }
    }
    if (playChime) {
        playSound('secretChime');
    }
}
