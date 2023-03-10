import { createAreaInstance } from 'app/content/areas';
import { convertLocationToMapCoordinates, getMapTarget } from 'app/content/hints';
import { isLogicValid, logicHash } from 'app/content/logic';
import { allSections, dungeonMaps } from 'app/content/sections';
import { editingState } from 'app/development/editingState';
import { initializeSection } from 'app/development/sections';
import { CANVAS_WIDTH, CANVAS_HEIGHT, CANVAS_SCALE, overworldKeys } from 'app/gameConstants';
import { heroIcon } from 'app/render/heroAnimations';
import { checkToRedrawTiles } from 'app/render/renderField';
import { createAnimation, drawFrame } from 'app/utils/animations';
import { mainCanvas } from 'app/utils/canvas';
import { findObjectLocation } from 'app/utils/enterZoneByTarget';
import { createCanvasAndContext, drawCanvas } from 'app/utils/canvas';
import { isPointInShortRect, rectanglesOverlap, pad } from 'app/utils/index';
import { getMousePosition, isMouseDown } from 'app/utils/mouse';
import { isSectionExplored } from 'app/utils/sections';
import { drawText } from 'app/utils/simpleWhiteFont';

import { AreaInstance, AreaSection, GameState, ObjectType, Rect } from 'app/types';

const [
    sky00, sky10, sky20, ground00, ground10, ground20,
    sky01, sky11, sky21, ground01, ground11, ground21,
         , sky12, froze, ground02, ground12, ground22,
] = createAnimation('gfx/hud/overworld.png', {w: 64, h: 64}, {xSpace: 2, ySpace: 2, rows: 3, cols: 6}).frames;

const menuSlices = createAnimation('gfx/hud/menu9slice.png', {w: 8, h: 8}, {cols: 3, rows: 3}).frames;

const borderSize = 4;
const worldSize = 192;


export function renderMap(context: CanvasRenderingContext2D, state: GameState): void {
    if (overworldKeys.includes(state.location.zoneKey)
        || overworldKeys.includes(state.areaSection?.definition?.mapId)
    ) {
        renderOverworldMap(context, state);
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

export function renderOverworldMap(context: CanvasRenderingContext2D, state: GameState): void {
    const w = worldSize + 2 * borderSize;
    const h = worldSize + 2 * borderSize;
    let r = {
        x: (CANVAS_WIDTH - w ) / 2,
        y: (CANVAS_HEIGHT - h ) / 2,
        w, h,
    };
    drawMapFrame(context, r);

    r = pad(r, -borderSize);

    drawFrame(context, ground00, {x: r.x, y: r.y, w: 64, h: 64});
    drawFrame(context, ground10, {x: r.x + 64, y: r.y, w: 64, h: 64});
    drawFrame(context, ground20, {x: r.x + 128, y: r.y, w: 64, h: 64});
    drawFrame(context, ground01, {x: r.x, y: r.y + 64, w: 64, h: 64});
    if (isLogicValid(state, logicHash.frozenLake)) {
        drawFrame(context, froze, {x: r.x + 64, y: r.y + 64, w: 64, h: 64});
    } else {
        drawFrame(context, ground11, {x: r.x + 64, y: r.y + 64, w: 64, h: 64});
    }
    drawFrame(context, ground21, {x: r.x + 128, y: r.y + 64, w: 64, h: 64});
    drawFrame(context, ground02, {x: r.x, y: r.y + 128, w: 64, h: 64});
    drawFrame(context, ground12, {x: r.x + 64, y: r.y + 128, w: 64, h: 64});
    drawFrame(context, ground22, {x: r.x + 128, y: r.y + 128, w: 64, h: 64});

    if (state.location.zoneKey === 'sky' || state.areaSection?.definition.mapId === 'sky') {
        context.save();
            context.globalAlpha *= 0.5;
            context.fillStyle = '#0FF';
            context.fillRect(r.x, r.y, r.w, r.h);
        context.restore();
        drawFrame(context, sky00, {x: r.x, y: r.y, w: 64, h: 64});
        drawFrame(context, sky10, {x: r.x + 64, y: r.y, w: 64, h: 64});
        drawFrame(context, sky20, {x: r.x + 128, y: r.y, w: 64, h: 64});
        drawFrame(context, sky01, {x: r.x, y: r.y + 64, w: 64, h: 64});
        drawFrame(context, sky11, {x: r.x + 64, y: r.y + 64, w: 64, h: 64});
        drawFrame(context, sky21, {x: r.x + 128, y: r.y + 64, w: 64, h: 64});
        drawFrame(context, sky12, {x: r.x + 64, y: r.y + 128, w: 64, h: 64});
    }

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
        const target = getMapTarget(state);
        if (target) {
            context.strokeStyle = 'red';
            context.beginPath();
            const x = r.x + target.x, y = r.y + target.y;
            context.moveTo(x - 6, y - 6);
            context.lineTo(x + 6, y + 6);
            context.moveTo(x + 6, y - 6);
            context.lineTo(x - 6, y + 6);
            context.stroke();
        }
    }
}


const frameSize = 24;
const cursor = createAnimation('gfx/hud/cursortemp.png', {w: frameSize, h: frameSize}).frames[0];

const [mapCanvas, mapContext] = createCanvasAndContext(192, 192);

const [sectionCanvas, sectionContext] = createCanvasAndContext(64, 64);

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
        mapContext.save();
            if (isHidden) {
                mapContext.globalAlpha *= 0.2;
            } else if (!isExplored) {
                mapContext.globalAlpha *= 0.6;
            }
            const {area, section} = sectionData;
            //mapContext.fillRect(column * 32, row * 32, section.w * 2, section.h * 2);
            //mapContext.fillStyle = 'white'
            //mapContext.fillRect(column * 32, row * 32, 8, 8);
            const areaInstance = createAreaInstance(state, area);
            // Draw the full tile first.
            sectionContext.clearRect(0, 0, 64, 64);
            renderActualMapTile(sectionContext, state, areaInstance,
                {x: 0, w: 64, y: 0, h: 64},  {x: 0, y: 0, w: 512, h: 512});
            mapContext.drawImage(sectionCanvas,
                section.x * 2, section.y * 2, section.w * 2, section.h * 2,
                section.mapX * 32, section.mapY * 32, section.w * 2, section.h * 2,
            );
        mapContext.restore();
    }
}

const w = worldSize + 2 * borderSize + 4 + 20;
const h = worldSize + 2 * borderSize;
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
    if (state.time % 1000 <= 600 && state.areaSection.definition.floorId === selectedFloorId) {
        drawFrame(context, heroIcon, {
            ...heroIcon,
            x: innerDungeonMapRectangle.x + (state.areaSection.definition.mapX * 32 + state.location.x / 8 - heroIcon.w / 2 - state.areaSection.x * 2) | 0,
            y: innerDungeonMapRectangle.y + (state.areaSection.definition.mapY * 32 + state.location.y / 8 - heroIcon.h / 2 - state.areaSection.y * 2) | 0,
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
                    hoverSection.w * 2,
                    hoverSection.h * 2
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
                w: section.w * 2,
                h: section.h * 2
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
    for (let floor = 0; floor < floorIds.length; floor++) {
        drawText(context, floorIds[floor], r.x + 12, r.y + r.h - rowHeight * floor - rowHeight / 2, {
            textBaseline: 'middle',
            textAlign: 'center',
            size: 16,
        });
        if (state.time % 1000 <= 600 && floorIds[floor] === state.areaSection.definition.floorId) {
            drawFrame(context, heroIcon, {
                ...heroIcon,
                x: r.x + 20 - (heroIcon.w / 2) | 0,
                y: r.y + r.h - rowHeight * floor - 8 - (heroIcon.h / 2) | 0,
            });
        }
    }
    drawFrame(context, cursor, {
        ...cursor,
        x: r.x,
        y: r.y + r.h - rowHeight * selectedFloorIndex - 24,
    });
}


const mapObjectTypes: ObjectType[] = ['door', 'pitEntrance', 'saveStatue', 'pushStairs'];
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
    // Draw additional objects that we want to show on the map.
    context.save();
        context.translate(target.x, target.y);
        context.scale(1 / 8, 1 / 8);
        for (const object of area.objects) {
            if (!mapObjectTypes.includes(object.definition?.type)) {
                continue;
            }
            const hitbox = object.getHitbox();
            if (!rectanglesOverlap(hitbox, source)) {
                continue;
            }
            for(const part of [object, ...(object.getParts?.(state) || [])]) {
                part.render(context, state);
                part.renderForeground?.(context, state);
            }

            if (object.definition?.type === 'door' && object.definition.targetZone && object.definition.targetObjectId) {
                context.fillStyle = 'rgba(0, 255, 255, 1)';
                context.fillRect(
                    hitbox.x,
                    hitbox.y,
                    Math.max(hitbox.w, 8),
                    Math.max(hitbox.h, 8),
                );
            }
        }
    context.restore();
}

export function mouseCoordsToMapCoords({x, y}: {x: number, y: number}): {x: number, y: number} {
    return {
        x: ((x - innerDungeonMapRectangle.x) / 32) | 0,
        y: ((y - innerDungeonMapRectangle.y) / 32) | 0,
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
