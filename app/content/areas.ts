import _ from 'lodash';

import { changeObjectStatus, createObjectInstance, findObjectInstanceById } from 'app/content/objects';
import { palettes } from 'app/content/palettes';
import { dropItemFromTable } from 'app/content/lootObject';
import { zones } from 'app/content/zones';
import { createCanvasAndContext } from 'app/dom';
import { isPointInShortRect } from 'app/utils/index';
import { updateCamera } from 'app/updateCamera';

import {
    AreaDefinition, AreaInstance, AreaLayerDefinition,
    Direction, Enemy, GameState, Hero, LayerTile,
    ObjectInstance, ShortRectangle, Tile, TileBehaviors,
    ZoneLocation,
} from 'app/types';



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
                    // The palette to use for this grid (controls the size of tiles)
                    palette: 'floor',
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
                    // The palette to use for this grid (controls the size of tiles)
                    palette: 'field',
                    // The matrix of tiles
                    tiles: [],
                },
            },
        ],
        objects: [],
        sections: [{ x: 0, y: 0, w: 32, h: 32}],
    };
}

export function getDefaultSpiritArea(location: ZoneLocation): AreaDefinition {
    const parentDefinition = getAreaFromLocation({...location, isSpiritWorld: false});
    return {
        default: true,
        parentDefinition,
        layers: [
            {
                key: 'floor',
                grid: {
                    // The dimensions of the grid.
                    w: 32,
                    h: 32,
                    // The palette to use for this grid (controls the size of tiles)
                    palette: 'spiritFloor',
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
                    // The palette to use for this grid (controls the size of tiles)
                    palette: 'spiritField',
                    // The matrix of tiles
                    tiles: [],
                },
            },
        ],
        objects: [],
        // Spirit world sections should match their parent definition, otherwise the
        // camera will not be aligned correctly when switching back and forth.
        sections: parentDefinition.sections,
    };
}

export function getAreaFromLocation(location: ZoneLocation): AreaDefinition {
    const floor = zones[location.zoneKey].floors[location.floor];
    const grid = location.isSpiritWorld ? floor.spiritGrid : floor.grid;
    const {x, y} = location.areaGridCoords;
    if (!grid[y]) {
        grid[y] = [];
    }
    if (!grid[y][x]) {
        grid[y][x] =
            initializeAreaTiles(location.isSpiritWorld ? getDefaultSpiritArea(location) : getDefaultArea());
    }
    return grid[y][x];
}

export function initializeAreaLayerTiles(layer: AreaLayerDefinition) {
    const palette = palettes[layer.grid.palette];
    const tiles = layer.grid.tiles;
    for (let y = 0; y < layer.grid.h; y++) {
        tiles[y] = tiles[y] || [];
        for (let x = 0; x < layer.grid.w; x++) {
            tiles[y][x] = tiles[y][x] || _.sample(palette.defaultTiles);
        }
    }
}

export function initializeAreaTiles(area: AreaDefinition): AreaDefinition {
    area.layers.map(initializeAreaLayerTiles);
    return area;
}

export function swapHeroStates(heroA: Hero, heroB: Hero) {
    const allKeys = [...new Set([...Object.keys(heroA), ...Object.keys(heroB)])];
    for (const key of allKeys) {
        if (key === 'behaviors') {
            continue;
        }
        const temp = heroA[key];
        heroA[key] = heroB[key];
        heroB[key] = temp;
    }
}

export function removeAllClones(state: GameState): void {
    // Modify the hero to match the state of the active clone before it is removed.
    if (state.hero.activeClone) {
        swapHeroStates(state.hero, state.hero.activeClone);
        /*state.hero.x = state.hero.activeClone.x;
        state.hero.y = state.hero.activeClone.y;
        state.hero.d = state.hero.activeClone.d;
        state.hero.animationTime = state.hero.activeClone.animationTime;
        state.hero.action = state.hero.activeClone.action;
        state.hero.actionFrame = state.hero.activeClone.actionFrame;
        state.hero.actionDx = state.hero.activeClone.actionDx;
        state.hero.actionDy = state.hero.activeClone.actionDy;
        state.hero.actionTarget = state.hero.activeClone.actionTarget;*/
    }
    for (const clone of state.hero.clones) {
        removeObjectFromArea(state, clone);
    }
    state.hero.clones = []
    state.hero.activeClone = null;
}

export function enterLocation(
    state: GameState,
    location: ZoneLocation,
    instant: boolean = true,
    callback: () => void = null
): void {
    if (!instant) {
        if (state.location?.zoneKey !== location.zoneKey || state.location?.floor !== location.floor) {
            state.transitionState = {
                callback,
                nextLocation: location,
                time: 0,
                type: state.location?.zoneKey !== location.zoneKey ? 'circle' : 'fade',
            };
            return;
        }
    }
    state.location = {
        ...location,
        areaGridCoords: {...location.areaGridCoords},
        z: 0,
    };
    state.zone = zones[location.zoneKey];
    state.hero.x = location.x;
    state.hero.y = location.y;

    const floor = state.zone.floors[location.floor];
    if (!floor) {
        console.log('Invalid floor', state.location);
        return;
    }
    state.areaGrid = location.isSpiritWorld ? floor.spiritGrid : floor.grid;
    state.location.areaGridCoords = {
        y: state.location.areaGridCoords.y % state.areaGrid.length,
        x: state.location.areaGridCoords.x % state.areaGrid[state.location.areaGridCoords.y].length,
    };
    const area = getAreaFromLocation(state.location);
    const alternateArea = getAreaFromLocation({...state.location, isSpiritWorld: !state.location.isSpiritWorld});

    // Remove all clones on changing areas.
    removeAllClones(state);
    state.hero.activeStaff?.remove(state);
    state.areaInstance = createAreaInstance(state, area);
    state.alternateAreaInstance = createAreaInstance(state, alternateArea);
    state.areaInstance.alternateArea = state.alternateAreaInstance;
    state.alternateAreaInstance.alternateArea = state.areaInstance;
    linkObjects(state);
    state.hero.area = state.areaInstance;
    state.hero.x = location.x;
    state.hero.y = location.y;
    if (location.z) {
        state.hero.z = location.z;
        state.hero.action = 'knocked';
    }
    state.hero.safeD = state.hero.d;
    state.hero.safeX = location.x;
    state.hero.safeY = location.y;
    setAreaSection(state, state.hero.d, true);
    updateCamera(state, 512);
}

export function linkObjects(state: GameState): void {
    for (const object of state.areaInstance.objects) {
        linkObject(object);
    }
}
export function linkObject(object: ObjectInstance): void {
    if (!object.definition?.linked) {
        return;
    }
    const linkedObject = object.area.alternateArea.objects.find(o => o.x === object.x && o.y === object.y);
    if (linkedObject) {
        linkedObject.linkedObject = object;
        object.linkedObject = linkedObject;
    }
}

export function enterZoneByTarget(
    state: GameState,
    zoneKey: string,
    targetObjectId: string,
    instant: boolean = true,
    callback: () => void = null
): boolean {
    const zone = zones[zoneKey];
    if (!zone) {
        console.error(`Missing zone: ${zoneKey}`);
        return false;
    }
    const inSpiritWorld = state.areaInstance.definition.isSpiritWorld;
    for (let floor = 0; floor < zone.floors.length; floor++) {
        const areaGrid = inSpiritWorld ? zone.floors[floor].spiritGrid : zone.floors[floor].grid;
        for (let y = 0; y < areaGrid.length; y++) {
            for (let x = 0; x < areaGrid[y].length; x++) {
                for (const object of (areaGrid[y][x]?.objects || [])) {
                    if (object.id === targetObjectId) {
                        enterLocation(state, {
                            zoneKey,
                            floor,
                            areaGridCoords: {x, y},
                            x: object.x,
                            y: object.y,
                            d: state.hero.d,
                            isSpiritWorld: inSpiritWorld,
                        }, instant, () => {
                            const target = findObjectInstanceById(state.areaInstance, targetObjectId);
                            if (target?.getHitbox) {
                                const hitbox = target.getHitbox(state);
                                state.hero.x = hitbox.x + hitbox.w / 2 - state.hero.w / 2;
                                state.hero.y = hitbox.y + hitbox.h / 2 - state.hero.h / 2;
                            }
                            callback?.();
                        });
                        return true;
                    }
                }
            }
        }
    }
    console.error('Could not find', targetObjectId, 'in', zoneKey);
    return false;
}

export function setNextAreaSection(state: GameState, d: Direction): void {
    removeAllClones(state);
    state.nextAreaSection = state.areaInstance.definition.sections[0];
    const hero = state.hero;
    let x = hero.x / state.areaInstance.palette.w;
    let y = hero.y / state.areaInstance.palette.h;
    if (d === 'right') {
        x += hero.w / state.areaInstance.palette.w;
    }
    if (d === 'down') {
        y += hero.h / state.areaInstance.palette.h;
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
    removeAllClones(state);
    state.hero.activeStaff?.remove(state);
    state.hero.safeD = state.hero.d;
    state.hero.safeX = state.hero.x;
    state.hero.safeY = state.hero.y;
    checkIfAllEnemiesAreDefeated(state, state.areaInstance);
    checkIfAllEnemiesAreDefeated(state, state.alternateAreaInstance);
}

export function setAreaSection(state: GameState, d: Direction, newArea: boolean = false): void {
    const lastAreaSection = state.areaSection;
    state.areaSection = state.areaInstance.definition.sections[0];
    let x = state.hero.x / state.areaInstance.palette.w;
    let y = state.hero.y / state.areaInstance.palette.h;
    if (d === 'right') {
        x += state.hero.w / state.areaInstance.palette.w;
    }
    if (d === 'down') {
        y += state.hero.h / state.areaInstance.palette.h;
    }
    for (const section of state.areaInstance.definition.sections) {
        if (isPointInShortRect(x, y, section)) {
            state.areaSection = section;
            break;
        }
    }
    if (newArea || lastAreaSection !== state.areaSection) {
        removeAllClones(state);
        state.hero.activeStaff?.remove(state);
        state.hero.safeD = state.hero.d;
        state.hero.safeX = state.hero.x;
        state.hero.safeY = state.hero.y;
    }
}

export function scrollToArea(state: GameState, area: AreaDefinition, direction: Direction): void {
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
    const grid = layer.grid;
    const palette = palettes[grid.palette];
    for (let y = 0; y < grid.tiles.length; y++) {
        if (!behaviorGrid[y]) {
            behaviorGrid[y] = [];
        }
        for (let x = 0; x < grid.tiles.length; x++) {
            let tile = grid.tiles[y][x];
            if (!tile && parentLayer) {
                tile = parentLayer.grid.tiles[y][x];
            }
            if (!tile) {
                continue;
            }
            const behaviors = palette.behaviors[`${tile.x}x${tile.y}`];
            // The behavior grid combines behaviors of all layers, with higher layers
            // overriding the behavior of lower layers.
            if (behaviors) {
                behaviorGrid[y][x] = {...(behaviorGrid[y][x] || {}), ...behaviors};
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
        const palette = layer.palette;
        const tile = layer.tiles[y]?.[x];
        if (!tile) {
            continue;
        }
        const behaviors = palette.behaviors[`${tile.x}x${tile.y}`];
        // The behavior grid combines behaviors of all layers, with higher layers
        // overriding the behavior of lower layers.
        if (behaviors) {
            area.behaviorGrid[y][x] = {...(area.behaviorGrid[y][x] || {}), ...behaviors};
        }
    }
}

export function createAreaInstance(state: GameState, definition: AreaDefinition): AreaInstance {
    const behaviorGrid: TileBehaviors[][] = [];
    for (let i = 0; i < definition.layers.length; i++) {
        applyLayerToBehaviorGrid(behaviorGrid, definition.layers[i], definition.parentDefinition?.layers[i]);
    }
    // Currently all layers should use matching grids, so just grab the first.
    const palette = palettes[definition.layers[0].grid.palette];
    const [canvas, context] = createCanvasAndContext(
        palette.w * definition.layers[0].grid.w,
        palette.h * definition.layers[0].grid.h,
    );
    const instance: AreaInstance = {
        alternateArea: null,
        definition: definition,
        palette,
        w: definition.layers[0].grid.w,
        h: definition.layers[0].grid.h,
        behaviorGrid,
        tilesDrawn: [],
        checkToRedrawTiles: true,
        layers: definition.layers.map(layer => ({
            definition: layer,
            ...layer,
            ...layer.grid,
            tiles: _.cloneDeep(layer.grid.tiles),
            originalTiles: _.cloneDeep(layer.grid.tiles),
            palette: palettes[layer.grid.palette]
        })),
        objects: [],
        priorityObjects: [],
        canvas,
        context,
        cameraOffset: {x: 0, y: 0},
    };
    if (definition.parentDefinition) {
        for (let l = 0; l < instance.layers.length; l++) {
            for (let y = 0; y < instance.layers[l].tiles.length; y++) {
                for (let x = 0; x < instance.layers[l].tiles[y].length; x++) {
                    if (!instance.layers[l].tiles[y][x]) {
                        instance.layers[l].tiles[y][x] = definition.parentDefinition.layers[l].grid.tiles[y][x];
                        instance.layers[l].originalTiles[y][x] = definition.parentDefinition.layers[l].grid.tiles[y][x];
                    }
                }

            }
        }
    }
    definition.objects.map(o => addObjectToArea(state, instance, createObjectInstance(state, o)));
    return instance;
}

export function getAreaSize(state: GameState): {w: number, h: number, section: ShortRectangle} {
    const area = state.areaInstance;
    const areaSection = state.nextAreaSection || state.areaSection;
    return {
        w: area.palette.w * area.w,
        h: area.palette.h * area.h,
        section: {
            x: areaSection.x * state.areaInstance.palette.w,
            y: areaSection.y * state.areaInstance.palette.h,
            w: areaSection.w * state.areaInstance.palette.w,
            h: areaSection.h * state.areaInstance.palette.h,
        },
    }
}

export function refreshSection(state: GameState, area: AreaInstance, section: ShortRectangle): void {
    // First reset tiles that need to be reset.
    // This is done before objects since some objects will update the tiles under them.
    for (let y = 0; y < section.h; y++) {
        const row = section.y + y;
        for (let x = 0; x < section.w; x++) {
            const column = section.x + x;
            for (let l = 0; l < area.definition.layers.length; l++) {
                area.layers[l].tiles[row][column] = area.layers[l].originalTiles[row][column];
            }
            resetTileBehavior(area, {x: column, y: row});
            if (area.tilesDrawn[row]?.[column]) {
                area.tilesDrawn[row][column] = false;
            }
        }
    }
    area.checkToRedrawTiles = true;
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
                const object = createObjectInstance(state, definition);
                addObjectToArea(state, area, object);
            } else {
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
        let object = findObjectInstanceById(area, definition.id, true);
        if (!object) {
            object = createObjectInstance(state, definition);
            if (object.alwaysReset || object.shouldRespawn && object.shouldRespawn(state)) {
                addObjectToArea(state, area, object);
            }
        }
    }
}
export function addObjectToArea(state: GameState, area: AreaInstance, object: ObjectInstance): void {
    object.area = area;
    if (object.add) {
        object.add(state, area);
    } else {
        area.objects.push(object);
    }
}
export function removeObjectFromArea(state: GameState, object: ObjectInstance): void {
    if (object.remove) {
        object.remove(state);
    } else {
        if (object.cleanup) {
            object.cleanup(state);
        }
        const index = object.area.objects.indexOf(object);
        if (index >= 0) {
            object.area.objects.splice(index, 1);
        }
    }
}

export function destroyTile(state: GameState, area: AreaInstance, target: LayerTile): void {
    const layer = _.find(area.layers, { key: target.layerKey });
    if (!layer) {
        console.error(`Missing target layer: ${target.layerKey}`);
        return;
    }
    const behavior = area.behaviorGrid?.[target.y]?.[target.x];
    if (area.tilesDrawn[target.y]?.[target.x]) {
        area.tilesDrawn[target.y][target.x] = false;
    }
    area.checkToRedrawTiles = true;
    const underTile = behavior?.underTile || {x: 0, y: 0};
    layer.tiles[target.y][target.x] = underTile;

    resetTileBehavior(area, target);
    if (behavior?.lootTable) {
        dropItemFromTable(state, area, behavior.lootTable,
            (target.x + 0.5) * area.palette.w,
            (target.y + 0.5) * area.palette.h
        );
    }
}


export function checkIfAllEnemiesAreDefeated(state: GameState, area: AreaInstance): void {
    if (area.objects.some(e => (e instanceof Enemy) && e.isInCurrentSection(state))) {
        return;
    }
    const { section } = getAreaSize(state);
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
        if (object.status === 'hiddenEnemy') {
            changeObjectStatus(state, object, 'normal');
        }
        if (object.status === 'closedEnemy') {
            changeObjectStatus(state, object, 'normal');
        }
    }
}
