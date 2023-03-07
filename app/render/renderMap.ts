import { createAreaInstance } from 'app/content/areas';
import { getMapTarget } from 'app/content/hints';
import { isLogicValid, logicHash } from 'app/content/logic';
import { allSections, dungeonMaps, isSectionExplored } from 'app/content/sections';
import { zones } from 'app/content/zones/zoneHash';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from 'app/gameConstants';
import { heroIcon } from 'app/render/heroAnimations';
import { checkToRedrawTiles } from 'app/render/renderField';
import { createAnimation, drawFrame } from 'app/utils/animations';
import { findObjectLocation } from 'app/utils/enterZoneByTarget';
import { createCanvasAndContext, drawCanvas } from 'app/utils/canvas';
import { drawText } from 'app/utils/simpleWhiteFont';
import { rectanglesOverlap, pad } from 'app/utils/index';

import { AreaInstance, GameState, Rect } from 'app/types';

const [
    sky00, sky10, sky20, ground00, ground10, ground20,
    sky01, sky11, sky21, ground01, ground11, ground21,
         , sky12, froze, ground02, ground12, ground22,
] = createAnimation('gfx/hud/overworld.png', {w: 64, h: 64}, {xSpace: 2, ySpace: 2, rows: 3, cols: 6}).frames;

const menuSlices = createAnimation('gfx/hud/menu9slice.png', {w: 8, h: 8}, {cols: 3, rows: 3}).frames;

const borderSize = 4;
const worldSize = 192;


export function renderMap(context: CanvasRenderingContext2D, state: GameState): void {
    if (['underwater', 'overworld', 'sky'].includes(state.location.zoneKey)) {
        renderOverworldMap(context, state);
    } else if (['underwater', 'overworld', 'sky'].includes(state.areaSection?.mapId)) {
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

    if (state.location.zoneKey === 'sky' || state.areaSection?.mapId === 'sky') {
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

    if (state.location.zoneKey === 'overworld' || state.location.zoneKey === 'sky' || state.location.zoneKey === 'underwater') {
        if (state.time % 1000 <= 600) {
            drawFrame(context, heroIcon, {
                ...heroIcon,
                x: r.x + (state.location.areaGridCoords.x * 64 + state.location.x / 8 - heroIcon.w / 2) | 0,
                y: r.y + (state.location.areaGridCoords.y * 64 + state.location.y / 8 - heroIcon.h / 2) | 0,
            });
        }
    } else if (state.areaSection?.entranceId) {
        const location = findObjectLocation(state, state.areaSection?.mapId, state.areaSection?.entranceId, state.location.isSpiritWorld);
        if (location && state.time % 1000 <= 600) {
            drawFrame(context, heroIcon, {
                ...heroIcon,
                x: r.x + (location.areaGridCoords.x * 64 + location.x / 8 - heroIcon.w / 2) | 0,
                y: r.y + (location.areaGridCoords.y * 64 + location.y / 8 - heroIcon.h / 2) | 0,
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
    const grid = dungeonMaps[mapId].floors[floorId].grid;
    for (let row = 0; row < grid.length; row++) {
        for (let column = 0; column < grid[row]?.length; column++) {
            const sectionData = allSections[grid[row][column]];
            if (!sectionData) {
                continue;
            }
            //mapContext.fillStyle = 'blue';
            if (!hasMap && !isSectionExplored(state, sectionData.section.index)) {
                //mapContext.fillStyle = 'red';
                continue;
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
                column * 32, row * 32, section.w * 2, section.h * 2,
            );
        }
    }
}

function renderDungeonMap(context: CanvasRenderingContext2D, state: GameState): void {
    // This is wider to display the floor indicators.
    const w = worldSize + 2 * borderSize + 4 + 20;
    const h = worldSize + 2 * borderSize;
    let r = {
        x: (CANVAS_WIDTH - w ) / 2,
        y: (CANVAS_HEIGHT - h ) / 2,
        w, h,
    };
    drawMapFrame(context, r);
    r = pad(r, -borderSize);
    // TODO: Draw floor indicators

    const zone = zones[state.location.zoneKey];
    const selectedFloorIndex = state.menuIndex % zone.floors.length;
    const floorIds = Object.keys(dungeonMaps[state.areaSection?.mapId].floors);
    const selectedFloorId = floorIds[selectedFloorIndex];
    refreshDungeonMap(state, state.areaSection?.mapId, selectedFloorId);

    const rowHeight = 24;

    for (let floor = 0; floor < floorIds.length; floor++) {
        drawText(context, floorIds[floor], r.x + 12, r.y + r.h - rowHeight * floor - rowHeight / 2, {
            textBaseline: 'middle',
            textAlign: 'center',
            size: 16,
        });
        if (state.time % 1000 <= 600 && floor === state.location.floor) {
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

    // Adjust the rectangle to just include the portion where the map should be drawn
    r.x += 24; r.w -= 24;

    drawCanvas(context, mapCanvas, {x: 0, y: 0, w: 192, h: 192}, r);

    if (state.time % 1000 <= 600 && state.location.floor === selectedFloorIndex) {
        drawFrame(context, heroIcon, {
            ...heroIcon,
            x: r.x + (state.location.areaGridCoords.x * 64 + state.location.x / 8 - heroIcon.w / 2) | 0,
            y: r.y + (state.location.areaGridCoords.y * 64 + state.location.y / 8 - heroIcon.h / 2) | 0,
        });
    }
}

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
            if (object.definition?.type === 'enemy' || object.definition?.type === 'boss') {
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
/*
const wallColor = 'white';
const unexploredColor = 'grey';
const exploredColor = 'blue';
const pitColor = 'black';
const entranceColor = 'red';
export function renderMapTile(context: CanvasRenderingContext2D, state: GameState, target: Rect, area: AreaDefinition, source: Rect ): void {
    const explored = true;
    const fillColor = explored ? exploredColor : unexploredColor;
    context.fillStyle = fillColor;
    context.fillRect(target.x, target.y, target.w, target.h);
    context.fillStyle = wallColor;
    // Draw a 2x2 wall pixel for every solid pixel around the exterior of the source rectangle.
    for (let y = source.y; y < source.y + source.h; y++) {
        for (let x = source.x; x < source.x + source.w; x++) {
            // Skip all tiles that aren't on the border.
            if (y !== source.y && y !== source.y + source.h - 1
                && x !== source.x && x !== source.x + source.w - 1) {
                continue;
            }

            for (let i = 0; i < area.layers.length; i++) {
                const layer = area.layers[i], parentLayer = area.parentDefinition?.layers?.[i];
                // Masked tiles are assumed not to set any behaviors as they are mostly hidden by the mask.
                if (layer.mask?.tiles?.[y]?.[x]) {
                    continue;
                }
                let tileIndex = layer.grid?.tiles?.[y]?.[x];
                if (!tileIndex && parentLayer) {
                    // Masked tiles are assumed not to set any behaviors as they are mostly hidden by the mask.
                    if (parentLayer.mask?.tiles?.[y]?.[x]) {
                        continue;
                    }
                    tileIndex = parentLayer.grid?.tiles?.[y]?.[x];
                }
                if (!tileIndex) {
                    continue;
                }
                const tile = allTiles[tileIndex];
                // The behavior grid combines behaviors of all layers, with higher layers
                // overriding the behavior of lower layers.
                if (tile.behaviors?.solid) {
                    context.fillRect(target.x + 2 * (x - source.x), target.y + 2 * (y - source.y), 2, 2);
                }
            }

        }
    }
    // Draw additional objects that we want to show on the map.
    for (const object of area.objects) {
        if (object.type === 'door') {
            if (object.targetZone && object.targetObjectId) {
                context.fillStyle = entranceColor;
            } else {
                context.fillStyle = fillColor
            }
        } else if (object.type === 'pitEntrance' && object.targetZone && object.targetObjectId) {
            context.fillStyle = pitColor;
        } else {
            continue;
        }
        const instance = createObjectInstance(state, object);
        const hitbox = instance.getHitbox();
        const tileRectangle = {
            x: (hitbox.x / 16) | 0,
            y: (hitbox.y / 16) | 0,
            w: Math.ceil(hitbox.w / 16),
            h: Math.ceil(hitbox.h / 16),
        }
        if (rectanglesOverlap(tileRectangle, source)) {
            context.fillRect(
                target.x + 2 * (tileRectangle.x - source.x),
                target.y + 2 * (tileRectangle.y - source.y),
                2 * tileRectangle.w,
                2 * tileRectangle.h,
            );
        }
    }
}
*/
