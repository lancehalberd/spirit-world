import { createAreaInstance } from 'app/content/areas';
import { convertLocationToMapCoordinates, getMapTarget } from 'app/content/hints';
import { allSections, dungeonMaps } from 'app/content/sections';
import { zones } from 'app/content/zones/zoneHash';
import { editingState } from 'app/development/editingState';
import { initializeSection } from 'app/development/sections';
import { CANVAS_WIDTH, CANVAS_HEIGHT, CANVAS_SCALE, overworldKeys } from 'app/gameConstants';
import { heroIcon } from 'app/render/heroAnimations';
import { checkToRedrawTiles } from 'app/render/renderField';
import { createAnimation, drawFrame } from 'app/utils/animations';
import { mainCanvas } from 'app/utils/canvas';
import { findObjectLocation } from 'app/utils/enterZoneByTarget';
import { createCanvasAndContext, drawCanvas } from 'app/utils/canvas';
import { isPointInShortRect, boxesIntersect, pad } from 'app/utils/index';
import { getMousePosition, isMouseDown } from 'app/utils/mouse';
import { isSectionExplored } from 'app/utils/sections';
import { drawText } from 'app/utils/simpleWhiteFont';
import { requireFrame } from 'app/utils/packedImages';


const menuSlices = createAnimation('gfx/hud/menu9slice.png', {w: 8, h: 8}, {cols: 3, rows: 3}).frames;

const borderSize = 4;
const worldSize = 192;
const questMarker = requireFrame('gfx/hud/questMarker.png', {x: 0, y: 0, w: 9, h: 18});
const [doorFrame, chestFrame, downFrame, upFrame] = createAnimation('gfx/hud/mapIcons.png', {w: 6, h: 6}, {cols: 4}).frames;

export function renderMap(context: CanvasRenderingContext2D, state: GameState): void {
    if (overworldKeys.includes(state.location.zoneKey)) {
        renderOverworldMap(context, state, state.location.zoneKey);
    } else if (overworldKeys.includes(state.areaSection?.definition?.mapId)) {
        renderOverworldMap(context, state, state.areaSection?.definition?.mapId);
    } else {
        renderDungeonMap(context, state);
    }
}

export function drawMapFrame(context: CanvasRenderingContext2D, r: Rect): void {
    drawFrame(context, menuSlices[0], {x: r.x, y: r.y, w: 8, h: 8});
    drawFrame(context, menuSlices[1], {x: r.x + 8, y: r.y, w: r.w - 16, h: 8});
    drawFrame(context, menuSlices[2], {x: r.x + r.w - 8, y: r.y, w: 8, h: 8});

    drawFrame(context, menuSlices[3], {x: r.x, y: r.y + 8, w: 8, h: r.h - 16});
    drawFrame(context, menuSlices[4], {x: r.x + 8, y: r.y + 8, w: r.w - 16, h: r.h - 16});
    drawFrame(context, menuSlices[5], {x: r.x + r.w - 8, y: r.y + 8, w: 8, h: r.h - 16});

    drawFrame(context, menuSlices[6], {x: r.x, y: r.y + r.h - 8, w: 8, h: 8});
    drawFrame(context, menuSlices[7], {x: r.x + 8, y: r.y + r.h - 8, w: r.w - 16, h: 8});
    drawFrame(context, menuSlices[8], {x: r.x + r.w - 8, y: r.y + r.h - 8, w: 8, h: 8});
}

let w = worldSize + 2 * borderSize;
let h = worldSize + 2 * borderSize;
const fullWorldMapRectangle = {
    x: (CANVAS_WIDTH - w ) / 2,
    y: (CANVAS_HEIGHT - h ) / 2,
    w, h,
};
const innerWorldMapRectangle = {
    x: fullWorldMapRectangle.x + borderSize,
    y: fullWorldMapRectangle.y + borderSize,
    w: worldSize,
    h: worldSize,
};
export function renderOverworldMap(context: CanvasRenderingContext2D, state: GameState, zone: string): void {
    if (zone === 'underwater') {
        zone = 'overworld';
    }
    drawMapFrame(context, fullWorldMapRectangle);
    const r = innerWorldMapRectangle;
    refreshWorldMap(state, zone);
    drawCanvas(context, mapCanvas, {x: 0, y: 0, w: 192, h: 192}, innerWorldMapRectangle);

    if (overworldKeys.includes(state.location.zoneKey)) {
        if (state.time % 1000 <= 600) {
            const mapCoordinates = convertLocationToMapCoordinates(state.location);
            drawFrame(context, heroIcon, {
                ...heroIcon,
                x: r.x + (mapCoordinates.x - heroIcon.w / 2) | 0,
                y: r.y + (mapCoordinates.y - heroIcon.h / 2) | 0,
            });
        }
    } else if (state.areaSection?.definition.entranceId) {
        const location = findObjectLocation(state, state.areaSection?.definition.mapId, state.areaSection?.definition.entranceId, state.location.isSpiritWorld);
        if (location && state.time % 1000 <= 600) {
            const mapCoordinates = convertLocationToMapCoordinates(location);
            drawFrame(context, heroIcon, {
                ...heroIcon,
                x: r.x + (mapCoordinates.x - heroIcon.w / 2) | 0,
                y: r.y + (mapCoordinates.y - heroIcon.h / 2) | 0,
            });
        }
    }

    if (state.time % 1000 <= 600) {
        const location = getMapTarget(state);
        if (location && location.zoneKey === zone && location.isSpiritWorld === state.location.isSpiritWorld) {
            const mapCoordinates = convertLocationToMapCoordinates(location);
            drawFrame(context, questMarker, {
                ...questMarker,
                x: r.x + mapCoordinates.x - 4,
                y: r.y + mapCoordinates.y - 15,
            });
        }
    }
}


const frameSize = 24;
const cursor = createAnimation('gfx/hud/cursortemp.png', {w: frameSize, h: frameSize}).frames[0];

const [mapCanvas, mapContext] = createCanvasAndContext(192, 192);

function refreshWorldMap(state: GameState, zoneKey: string): void {
    const floorId = state.location.isSpiritWorld ? 'spirit' : 'material';
    // It is expensive to render the world map, so only re-render if it has important changes.
    if (!state.map.needsRefresh && state.map.renderedMapId === zoneKey && state.map.renderedFloorId === floorId) {
        return;
    }
    state.map.needsRefresh = false;
    state.map.renderedMapId = zoneKey;
    state.map.renderedFloorId = floorId;

    mapContext.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
    const zone = zones[zoneKey];
    const grid = state.location.isSpiritWorld ? zone.floors[0].spiritGrid : zone.floors[0].grid;
    for (let row = 0; row < grid.length; row++) {
        for (let column = 0; column < grid[row].length; column++) {
            const areaInstance = createAreaInstance(state, grid[row][column]);
            renderActualMapTile(mapContext, state, areaInstance,
                {x: column * 64, w: 64, y: row * 64, h: 64},  {x: 0, y: 0, w: areaInstance.w * 16, h: areaInstance.h * 16});
            renderMapObjects(mapContext, state, areaInstance,
                {x: column * 64, w: 64, y: row * 64, h: 64},  {x: 0, y: 0, w: areaInstance.w * 16, h: areaInstance.h * 16},
                state.hero.savedData.passiveTools.trueSight >= 1);
        }
    }
}

interface SectionRenderData {
    alpha: number
    source: Rect
    target: Rect
    area: AreaInstance
}

function refreshDungeonMap(state: GameState, mapId: string, floorId: string): void {
    // It is expensive to render the dungeon map, so only re-render if it has important changes.
    if (!state.map.needsRefresh && state.map.renderedMapId === mapId && state.map.renderedFloorId === floorId) {
        return;
    }
    state.map.needsRefresh = false;
    state.map.renderedMapId = mapId;
    state.map.renderedFloorId = floorId;

    const hasMap = state.savedState.dungeonInventories[state.location.logicalZoneKey]?.map;


    mapContext.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
    const sections = dungeonMaps[mapId].floors[floorId].sections;
    const {w, h} = state.zone.areaSize ?? {w: 32, h: 32};

    // Compute shared date for rendering the sections for this map.
    const sectionRenderData: SectionRenderData[] = [];
    for (let sectionIndex of sections) {
        const sectionData = allSections[sectionIndex];
        if (!sectionData) {
            continue;
        }
        //mapContext.fillStyle = 'blue';
        const isHidden = sectionData.section.hideMap;
        const isExplored = hasMap || isSectionExplored(state, sectionData.section.index);
        if (!editingState.isEditing && (!isExplored || isHidden)) {
            //mapContext.fillStyle = 'red';
            continue;
        }
        const {area, section} = sectionData;
        sectionRenderData.push({
            alpha: isHidden ? 0.2 : (!isExplored ? 0.6 : 1),
            source: {
                x: section.x * 16,
                y: section.y * 16,
                w: section.w * 16,
                h: section.h * 16,
            },
            target: {
                x: section.mapX * 32,
                y: section.mapY * 32,
                w: section.w * 16 * 4 / w,
                h: section.h * 16 * 4 / h,
            },
            area: createAreaInstance(state, area),
        });
    }

    // Draw the area tiles first:
    for (const data of sectionRenderData) {
        mapContext.save();
            mapContext.globalAlpha *= data.alpha;
            renderActualMapTile(mapContext, state, data.area,
                data.target,  data.source);
        mapContext.restore();
    }
    // Then draw objects on top:
    // (possible drawback is objects being drawn on top of foreground tiles, but so far this isn't a problem.)
    // (technically we should draw: background tiles, background objects, foreground tiles, foreground objects, then map icons)
    for (const data of sectionRenderData) {
        mapContext.save();
            mapContext.globalAlpha *= data.alpha;
            renderMapObjects(mapContext, state, data.area,
                data.target,  data.source, hasMap);
        mapContext.restore();
    }
}

w = worldSize + 2 * borderSize + 4 + 20;
h = worldSize + 2 * borderSize;
const fullDungeonMapRectangle = {
    x: (CANVAS_WIDTH - w ) / 2,
    y: (CANVAS_HEIGHT - h ) / 2,
    w, h,
};
const innerDungeonMapRectangle = {
    x: fullDungeonMapRectangle.x + borderSize + 24,
    y: fullDungeonMapRectangle.y + borderSize,
    w: worldSize,
    h: worldSize,
};
const floorMarkerRectangle = {
    x: fullDungeonMapRectangle.x + borderSize,
    y: fullDungeonMapRectangle.y + borderSize,
    w: 20,
    h: worldSize,
};

export function getSelectedFloorId(state: GameState): string {
    // This happens when visiting an unpopulated super tile, for example when a new super tile is created in the editor
    // or a super tile is never edited after being created.
    if (!state.areaSection?.definition?.mapId) {
        initializeSection(state.areaSection.definition, state.location);
    }
    const map = dungeonMaps[state.areaSection?.definition.mapId];
    if (!map) {
        console.error('Could not find dungeon map for', state.areaSection?.definition.mapId);
        return '1F';
    }
    const floorIds = Object.keys(map.floors);
    const selectedFloorIndex = state.menuIndex % floorIds.length;
    return floorIds[selectedFloorIndex];
}

function renderDungeonMap(context: CanvasRenderingContext2D, state: GameState): void {
    const selectedFloorId = getSelectedFloorId(state);
    drawMapFrame(context, fullDungeonMapRectangle);
    // Refresh the dungeon map if necessary
    refreshDungeonMap(state, state.areaSection?.definition.mapId, selectedFloorId);
    // Draw the dungeon map to the screen
    drawCanvas(context, mapCanvas, {x: 0, y: 0, w: 192, h: 192}, innerDungeonMapRectangle);
    // Draw the flashing hero icon on top of the dungeon map if the hero is currently on the displayed floor.
    const {w, h} = state.areaInstance;
    if (state.time % 1000 <= 600 && state.areaSection.definition.floorId === selectedFloorId) {
        drawFrame(context, heroIcon, {
            ...heroIcon,
            x: innerDungeonMapRectangle.x + (state.areaSection.definition.mapX * 32 + (state.location.x - 16 * state.areaSection.x) * 4 / w - heroIcon.w / 2) | 0,
            y: innerDungeonMapRectangle.y + (state.areaSection.definition.mapY * 32 + (state.location.y - 16 * state.areaSection.y) * 4 / h  - heroIcon.h / 2) | 0,
        });
    }
    if (editingState.isEditing) {
        const hoverSection = isMouseDown() ? undefined : getSectionUnderMouse(state);
        if (hoverSection) {
            context.save();
                context.globalAlpha *= 0.3;
                context.fillStyle = 'white';
                context.fillRect(
                    innerDungeonMapRectangle.x + hoverSection.mapX * 32,
                    innerDungeonMapRectangle.y + hoverSection.mapY * 32,
                    hoverSection.w * 16 * 4 / w,
                    hoverSection.h * 16 * 4 / h,
                );
            context.restore();
        }
        for (const sectionIndex of editingState.selectedSections) {
            const section = allSections[sectionIndex]?.section;
            if (!section) {
                continue;
            }
            const r = pad({
                x: section.mapX * 32,
                y: section.mapY * 32,
                w: section.w * 16 * 4 / w,
                h: section.h * 16 * 4 / h
            }, -4);
            context.strokeStyle = 'white';
            context.lineWidth = 2;
            context.strokeRect(
                innerDungeonMapRectangle.x + r.x,
                innerDungeonMapRectangle.y + r.y,
                r.w,
                r.h
            );
        }
    }

    // Render the floor markers with hero marker + selected floor cursor
    const r = floorMarkerRectangle;
    const rowHeight = 24;
    const floorIds = Object.keys(dungeonMaps[state.areaSection?.definition.mapId].floors || {});
    const selectedFloorIndex = state.menuIndex % floorIds.length;
    const hasMap = state.savedState.dungeonInventories[state.location.logicalZoneKey]?.map;
    let y = r.y + r.h;
    for (let floor = 0; floor < floorIds.length; floor++) {
        if (!hasMap
            && !editingState.isEditing
            && !dungeonMaps[state.areaSection?.definition.mapId]?.floors[floorIds[floor]].sections?.find(section => isSectionExplored(state, section))) {
            continue;
        }
        drawText(context, floorIds[floor], r.x + 12, y - rowHeight / 2, {
            textBaseline: 'middle',
            textAlign: 'center',
            size: 16,
        });
        if (state.time % 1000 <= 600 && floorIds[floor] === state.areaSection.definition.floorId) {
            drawFrame(context, heroIcon, {
                ...heroIcon,
                x: r.x + 20 - (heroIcon.w / 2) | 0,
                y: y - 8 - (heroIcon.h / 2) | 0,
            });
        }
        if (selectedFloorIndex === floor) {
            drawFrame(context, cursor, {
                ...cursor,
                x: r.x,
                y: y - 24,
            });
        }
        y -= rowHeight;
    }
}


const mapObjectTypes: ObjectType[] = [
    'waterfall', 'door', 'pitEntrance', 'saveStatue', 'pushStairs', 'teleporter', 'chest', 'bigChest'
];
export function renderActualMapTile(context: CanvasRenderingContext2D, state: GameState, area: AreaInstance, target: Rect, source: Rect): void {
    if (area.checkToRedrawTiles) {
        checkToRedrawTiles(area);
    }
    context.drawImage(area.canvas,
        source.x, source.y, source.w, source.h,
        target.x, target.y, target.w, target.h,
    );
    if (area.foregroundCanvas) {
        context.drawImage(area.foregroundCanvas,
            source.x, source.y, source.w, source.h,
            target.x, target.y, target.w, target.h,
        );
    }
}

export function renderMapObjects(context: CanvasRenderingContext2D, state: GameState, area: AreaInstance, target: Rect, source: Rect, drawChests: boolean = false) {
    const xScale = 4 / area.w, yScale = 4 / area.h;
    // Draw additional objects that we want to show on the map.
    context.save();
        context.translate(target.x, target.y);
        // context.scale(4 / area.w, 4 / area.h);
        for (const object of area.objects) {
            if (!mapObjectTypes.includes(object.definition?.type)) {
                continue;
            }
            let hitbox = object.getHitbox();
            if (!boxesIntersect(hitbox, source)) {
                continue;
            }
            hitbox = {...hitbox, x: hitbox.x - source.x, y: hitbox.y - source.y};
            /*if (object.definition.id === 'warTempleNorthEntrance') {
                debugger;
            }*/
            if (object.definition?.type === 'chest' || object.definition?.type === 'bigChest') {
                // Only render graphics for chests if drawChests is true.
                if (drawChests && !state.savedState.objectFlags[object.definition.id] && object.definition.lootType !== 'empty') {
                    drawFrame(context, chestFrame, {...chestFrame,
                        x: Math.round((hitbox.x + hitbox.w / 2) * xScale) - chestFrame.w / 2,
                        y: Math.round((hitbox.y + hitbox.h / 2) * yScale) - chestFrame.h / 2,
                    });
                }
            } else {
                context.save();
                    context.scale(4 / area.w, 4 / area.h);
                    context.translate(-source.x, -source.y);
                    for(const part of [object, ...(object.getParts?.(state) || [])]) {
                        part.render(context, state);
                        part.renderForeground?.(context, state);
                    }
                context.restore();
            }

            if (object.definition?.type === 'door'
                && object.definition.targetZone && object.definition.targetObjectId
                && object.status !== 'cracked'
            ) {
                if (object.definition.style === 'wideEntrance' && object.definition.d === 'up') {
                    drawFrame(context, upFrame, {...upFrame,
                        x: Math.round((hitbox.x + hitbox.w / 2) * xScale) - upFrame.w / 2,
                        y: Math.round((hitbox.y) * yScale),
                    });
                } else if (object.definition.style === 'wideEntrance' && object.definition.d === 'down') {
                    drawFrame(context, downFrame, {...downFrame,
                        x: Math.round((hitbox.x + hitbox.w / 2) * xScale) - downFrame.w / 2,
                        y: Math.round((hitbox.y + hitbox.h) * yScale) - downFrame.h,
                    });
                } else {
                    drawFrame(context, doorFrame, {...doorFrame,
                        x: Math.round((hitbox.x + hitbox.w / 2) * xScale) - doorFrame.w / 2,
                        y: Math.round((hitbox.y + hitbox.h / 2) * yScale) - doorFrame.h / 2
                            // Render southern doors further up.
                            + (object.definition.d === 'down' ? -2 : 0),
                    });
                }
            }
        }
    context.restore();
}

export function mouseCoordsToMapCoords({x, y}: {x: number, y: number}): {x: number, y: number} {
    return {
        x: ((x - innerDungeonMapRectangle.x) / 32),
        y: ((y - innerDungeonMapRectangle.y) / 32),
    }
}

export function getSectionUnderMouse(state: GameState): AreaSection | undefined {
    const sections = getDisplayedMapSections(state);
    if (!sections) {
        return;
    }
    let [x, y] = getMousePosition(mainCanvas, CANVAS_SCALE);
    x -= innerDungeonMapRectangle.x;
    y -= innerDungeonMapRectangle.y;
    for (const sectionIndex of [...sections].reverse()) {
        const section = allSections[sectionIndex].section;
        if (isPointInShortRect(x, y, {
            x: section.mapX * 32,
            y: section.mapY * 32,
            w: 2 * section.w,
            h: 2 * section.h,
        })) {
            return section;
        }
    }
}
export function getDisplayedMapSections(state: GameState): number[] | undefined {
    if (!state.showMap || !state.paused) {
        return;
    }
    const mapId = state.areaSection?.definition.mapId;
    if (overworldKeys.includes(mapId)) {
        return [];
    }
    const selectedFloorId = getSelectedFloorId(state);
    const map = dungeonMaps[mapId];
    return map.floors[selectedFloorId].sections;
}
