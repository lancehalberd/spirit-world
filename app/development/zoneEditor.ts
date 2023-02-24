import {
    getAreaInstanceFromLocation, setConnectedAreas,
} from 'app/content/areas';
import { logicHash } from 'app/content/logic';
import { specialBehaviorsHash } from 'app/content/specialBehaviors/specialBehaviorsHash';
import { zones } from 'app/content/zones';
import { exportZoneToClipboard, importZone, serializeZone } from 'app/development/exportZone';
import { TabContainer } from 'app/development/tabContainer';
import { renderPropertyRows } from 'app/development/propertyPanel';
import { editingState } from 'app/development/editingState';
import { tagElement } from 'app/dom';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from 'app/gameConstants';
import { checkToRedrawTiles } from 'app/render/renderField';
import { getState } from 'app/state';
import { setAreaSection } from 'app/utils/area';
import { createCanvasAndContext } from 'app/utils/canvas';
import { enterLocation } from 'app/utils/enterLocation';
import { getFullZoneLocation } from 'app/utils/getFullZoneLocation';
import { readFromFile, saveToFile, scaleRect } from 'app/utils/index';
import { getMousePosition, isMouseDown } from 'app/utils/mouse';

import {
    AreaInstance, EditingState, Floor, GameState, LogicDefinition, PanelRows, PropertyRow, Zone
} from 'app/types';

const fullSection = {x: 0, y: 0, w: 32, h: 32};
const leftColumn = {x: 0, y: 0, w: 16, h: 32};
const rightColumn = {x: 16, y: 0, w: 16, h: 32};
const topRow = {x: 0, y: 0, w: 32, h: 16};
const bottomRow = {x: 0, y: 16, w: 32, h: 16};
const tlSection = {x: 0, y: 0, w: 16, h: 16};
const trSection = {x: 16, y: 0, w: 16, h: 16};
const blSection = {x: 0, y: 16, w: 16, h: 16};
const brSection = {x: 16, y: 16, w: 16, h: 16};
const sectionLayouts = {
    single: [fullSection],
    fourSquare: [tlSection, trSection, blSection, brSection],
    columns: [leftColumn, rightColumn],
    rows: [topRow, bottomRow],
    leftColumn: [leftColumn, trSection, brSection],
    rightColumn: [tlSection, blSection, rightColumn],
    topRow: [topRow, blSection, brSection],
    bottomRow: [tlSection, trSection, bottomRow],
}

const superTileSize = 64;
const tileScale = superTileSize / 32;
const pixelScale = tileScale / 16;

const [mapCanvas, mapContext] = createCanvasAndContext(128, 128);
mapCanvas.style.position = 'absolute'
mapCanvas.style.top = '0px';
mapCanvas.style.left = '0px';
const [mapOverlayCanvas, mapOverlayContext] = createCanvasAndContext(128, 128);
mapOverlayCanvas.style.position = 'absolute'
mapOverlayCanvas.style.top = '0px';
mapOverlayCanvas.style.left = '0px';

mapOverlayCanvas.onclick = function (e: MouseEvent) {
  if (e.which !== 1) {
      return;
  }
  jumpToMinimapLocation();
}

mapOverlayCanvas.onmousemove = function (e: MouseEvent) {
  if (!isMouseDown()) {
      return;
  }
  jumpToMinimapLocation();
}

function refreshArea(state: GameState) {
    enterLocation(state, state.location, true);
}

function jumpToMinimapLocation() {
  const [x, y] = getMousePosition(mapOverlayCanvas);
  const gridRow = Math.floor(y / superTileSize);
  const gridColumn = Math.floor(x / superTileSize);
  const pixelX = Math.round(x / pixelScale) % 512;
  const pixelY = Math.round(y / pixelScale) % 512;
  const state = getState();
  if (gridRow >= state.areaGrid.length && gridColumn >= state.areaGrid[0].length) {
      return;
  }
  enterLocation(state, {
      zoneKey: state.location.zoneKey,
      floor: state.location.floor,
      isSpiritWorld: state.location.isSpiritWorld,
      d: state.location.d,
      areaGridCoords: {x: gridColumn, y: gridRow},
      x: pixelX,
      y: pixelY,
      z: 0,
  });
}

const minimapContainer = tagElement('div');
minimapContainer.style.position = 'relative';
minimapContainer.append(mapCanvas);
minimapContainer.append(mapOverlayCanvas);


const zoneTabContainer = new TabContainer('zone', [
    {
        key: 'zone',
        render(container: HTMLElement) {
            renderPropertyRows(container, getZoneProperties());
        },
        refresh(container: HTMLElement) {
            this.render(container);
        },
    },
    {
        key: 'behaviors',
        render(container: HTMLElement) {
            renderPropertyRows(container, getBehaviorProperties());
        },
        refresh(container: HTMLElement) {
            this.render(container);
        },
    },
    {
        key: 'import/export',
        render(container: HTMLElement) {
            renderPropertyRows(container, getImportExportProperties());
        },
        refresh(container: HTMLElement) {
            this.render(container);
        },
    },
]);

export function renderZoneTabContainer(): HTMLElement {
    zoneTabContainer.render();
    return zoneTabContainer.element;
}
export function getMinimapSize(state: GameState): {w: number, h: number} {
    return {
        w: state.areaGrid[0].length * superTileSize,
        h: state.areaGrid.length * superTileSize,
    }
}
export function updateMinimapSize(state: GameState): void {
    const {w, h} = getMinimapSize(state);
    if (mapCanvas.width !== w || mapCanvas.height !== h) {
        mapCanvas.width = w;
        mapCanvas.height = h;
        mapOverlayCanvas.width = w;
        mapOverlayCanvas.height = h;
        minimapContainer.style.width = `${w}px`;
        minimapContainer.style.height = `${h}px`;
    }
}
export function clearMinimap(state: GameState): void {
    mapContext.fillStyle = 'rgba(100, 100, 100, 1)';
    mapContext.fillRect(0, 0, mapCanvas.width, mapCanvas.height);
}
export function renderAreaToMinimap(state: GameState, area: AreaInstance, gridCoords: {x: number, y: number}): void {
    if (area.checkToRedrawTiles) {
        checkToRedrawTiles(area);
    }
    mapContext.drawImage(area.canvas,
        0, 0, 512, 512,
        gridCoords.x * superTileSize, gridCoords.y * superTileSize, superTileSize, superTileSize
    );
    if (area.foregroundCanvas) {
        mapContext.drawImage(area.foregroundCanvas,
            0, 0, 512, 512,
            gridCoords.x * superTileSize, gridCoords.y * superTileSize, superTileSize, superTileSize
        );
    }
}
function fillMinimap(state: GameState): void {
    for (let y = 0; y < state.areaGrid.length; y++) {
        for (let x = 0; x < state.areaGrid[y].length; x++) {
            const areaInstance = getAreaInstanceFromLocation(
                state,
                {...state.location, areaGridCoords: {x, y}}
            );
            renderAreaToMinimap(state, areaInstance, {x, y});
        }
    }
}
let lastMinimapZoneKey = '', lastFloor = 0, lastIsSpiritWorld = false;
export function checkToRefreshMinimap(state: GameState): void {
    updateMinimapSize(state);
    if (lastMinimapZoneKey !== state.location.zoneKey
        || lastFloor !== state.location.floor
        || lastIsSpiritWorld !== state.location.isSpiritWorld
    ) {
        clearMinimap(state);
        if (editingState.refreshMinimap) {
            fillMinimap(state);
            lastMinimapZoneKey = state.location.zoneKey;
            lastFloor = state.location.floor;
            lastIsSpiritWorld = state.location.isSpiritWorld;
        } else {
            lastMinimapZoneKey = '';
        }
    }
}

export function renderZoneEditor(context: CanvasRenderingContext2D, state: GameState, editingState: EditingState): void {
    mapOverlayContext.clearRect(0, 0, mapOverlayCanvas.width, mapOverlayCanvas.height);
    mapOverlayContext.fillStyle = 'rgba(255, 255, 255, 1)';
    // Draw edges separating screens.
    for (let row = 0; row < state.areaGrid.length; row++) {
        for (let column = 0; column < state.areaGrid[row].length; column++) {
            mapOverlayContext.save();
            mapOverlayContext.translate(column * superTileSize, row * superTileSize);
            for( const section of (state.areaGrid[row][column]?.sections || [fullSection])) {
                const {x, y, w, h} = scaleRect(section, tileScale);
                mapOverlayContext.fillRect(x, y, w, 1);
                mapOverlayContext.fillRect(x, y + h - 1, w, 1);
                mapOverlayContext.fillRect(x, y + 1, 1, h - 2);
                mapOverlayContext.fillRect(x + w - 1, y + 1, 1, h - 2);
            }
            mapOverlayContext.restore();
        }
    }
    // Draw door indicators
    for (let row = 0; row < state.areaGrid.length; row++) {
        for (let column = 0; column < state.areaGrid[row].length; column++) {
            mapOverlayContext.save();
            mapOverlayContext.translate(column * superTileSize, row * superTileSize);
            for(const object of (state.areaGrid[row][column]?.objects || [])) {
                if (object.type !== 'door') {
                    continue;
                }
                let {x, y} = object;
                let w = 16, h = 16;
                if (object.targetZone) {
                    mapOverlayContext.fillStyle = 'rgba(0, 255, 255, 1)';
                    w = 32, h = 32;
                } else {
                    x += 8, y += 8;
                    mapOverlayContext.fillStyle = 'rgba(255, 255, 255, 1)';
                    if (object.d === 'up') {
                        y -= 48; h += 48;
                    }
                    if (object.d === 'down') {
                        h += 48;
                    }
                    if (object.d === 'left') {
                        x -= 48; w += 48;
                    }
                    if (object.d === 'right') {
                        w += 48;
                    }
                }
                mapOverlayContext.fillRect(x * pixelScale, y * pixelScale, w * pixelScale, h * pixelScale);
            }
            mapOverlayContext.restore();
        }
    }
    mapOverlayContext.fillStyle = 'rgba(255, 255, 255, 0.3)';
    const area = state.nextAreaInstance || state.areaInstance;
    renderAreaToMinimap(state, area, state.location.areaGridCoords);
    const cameraX = Math.floor(state.location.areaGridCoords.x * superTileSize + state.camera.x * pixelScale - area.cameraOffset.x * pixelScale);
    const cameraY = Math.floor(state.location.areaGridCoords.y * superTileSize + state.camera.y * pixelScale - area.cameraOffset.y * pixelScale);
    mapOverlayContext.fillRect(cameraX, cameraY, CANVAS_WIDTH * pixelScale, CANVAS_HEIGHT * pixelScale);
}

export function getImportExportProperties(): PanelRows {
    let rows: PanelRows = [];
    rows.push([{
        name: 'Export to Clipboard',
        onClick() {
            exportZoneToClipboard(getState().zone);
        },
    }, {
        name: 'Export to File',
        onClick() {
            saveToFile(serializeZone(getState().zone), `map.ts`, 'text/javascript');
        },
    }]);
    rows.push([{
        name: 'Import from Clipboard',
        onClick() {
            navigator.clipboard.readText().then(contents => {
                const state = getState();
                state.location.zoneKey = importZone(contents, state.location.zoneKey);
                state.location.floor = 0;
                refreshArea(state);
            });
        },
    }, {
        name: 'Import from File',
        onClick() {
            readFromFile().then(contents => {
                const state = getState();
                state.location.zoneKey = importZone(contents, state.location.zoneKey);
                state.location.floor = 0;
                refreshArea(state);
            });
        },
    }]);
    return rows;
}


export function getBehaviorProperties(): PanelRows {
    const state = getState();
    let rows: PanelRows = [];
    rows = [...rows, ...getMinimapProperties()];
    const specialBehaviorKeys = Object.keys(specialBehaviorsHash).filter(
        key => specialBehaviorsHash[key].type === 'area'
    );
    if (specialBehaviorKeys.length) {
        rows.push({
            name: 'Special Behavior',
            value: state.areaInstance.definition.specialBehaviorKey || 'none',
            values: ['none', ...specialBehaviorKeys],
            onChange(specialBehaviorKey: string) {
                if (specialBehaviorKey === 'none') {
                    delete state.areaInstance.definition.specialBehaviorKey;
                } else {
                    state.areaInstance.definition.specialBehaviorKey = specialBehaviorKey;
                }
                refreshArea(state);
            },
        });
    }
    rows.push({
        name: 'Surface Key',
        value: state.zone.surfaceKey || 'none',
        values: ['none', ...Object.keys(zones)],
        onChange(surfaceKey: string) {
            if (state.zone.surfaceKey) {
                delete zones[state.zone.surfaceKey].underwaterKey;
                delete state.zone.surfaceKey;
            }
            if (surfaceKey !== 'none') {
                state.zone.surfaceKey = surfaceKey;
                zones[surfaceKey].underwaterKey = state.zone.key;
                if (state.zone.underwaterKey) {
                    delete zones[state.zone.underwaterKey].surfaceKey;
                    delete state.zone.underwaterKey;
                }
            }
            editingState.needsRefresh = true;
        }
    }, {
        name: 'Underwater Key',
        value: state.zone.underwaterKey || 'none',
        values: ['none', ...Object.keys(zones)],
        onChange(underwaterKey: string) {
            if (state.zone.underwaterKey) {
                delete zones[state.zone.underwaterKey].surfaceKey;
                delete state.zone.underwaterKey;
            }
            if (underwaterKey !== 'none') {
                state.zone.underwaterKey = underwaterKey;
                zones[underwaterKey].surfaceKey = state.zone.key;
                if (state.zone.surfaceKey) {
                    delete zones[state.zone.surfaceKey].underwaterKey;
                    delete state.zone.surfaceKey;
                }
            }
            editingState.needsRefresh = true;
        }
    });
    rows.push({
        name: 'darkness',
        value: state.areaInstance.definition.dark || 0,
        values: [0, 25, 50, 75, 100],
        onChange(dark: number) {
            if (!dark) {
                delete state.areaInstance.definition.dark;
            } else {
                state.areaInstance.definition.dark = dark;
            }
            refreshArea(state);
        }
    });
    rows = [...rows, ...getLogicProperties(state, 'Drains Spirit?', state.areaInstance.definition.corrosiveLogic, updatedLogic => {
        state.areaInstance.definition.corrosiveLogic = updatedLogic;
        refreshArea(state);
    })];
    rows = [...rows, ...getLogicProperties(state, 'Is Section Hot?', state.areaSection.definition.hotLogic, updatedLogic => {
        state.areaSection.definition.hotLogic = updatedLogic;
        refreshArea(state);
    })];
    rows.push({
        name: 'Refresh Area',
        onClick() {
            state.location.x = state.hero.x;
            state.location.y = state.hero.y;
            refreshArea(state);
        }
    });
    return rows;
}

export function getZoneProperties(): PanelRows {
    const state = getState();
    let rows: PanelRows = [];
    const floor = state.location.floor;
    rows.push([{
        name: 'zone',
        value: state.location.zoneKey,
        values: Object.keys(zones),
        onChange(zoneKey: string) {
            if (state.location.zoneKey !== zoneKey) {
                state.location.zoneKey = zoneKey;
                state.location.floor = 0;
                refreshArea(state);
            }
        }
    }, {
        name: '+',
        id: `add-new-zone`,
        onClick() {
            const newZoneKey = window.prompt('Enter the new zone key');
            if (!newZoneKey || zones[newZoneKey]) {
                return;
            }
            const zone: Zone = {
                key: newZoneKey,
                floors: [
                    {
                        grid: [[null]],
                        spiritGrid: [[null]],
                    },
                ],
            };
            zones[newZoneKey] = zone;
            state.location.zoneKey = zone.key;
            state.location.floor = 0;
            refreshArea(state);
        },
    },
    {
        name: 'floor',
        value: '' + (floor + 1),
        values: ([...new Array(state.zone.floors.length)].map((v, i) => '' + (i + 1))),
        onChange(floorString: string) {
            const floorNumber = parseInt(floorString, 10) - 1;
            if (state.location.floor !== floorNumber) {
                state.location.floor = floorNumber;
                refreshArea(state);
            }
        }
    }, {
        name: '+',
        id: `add-zone-floor`,
        onClick() {
            const floor: Floor = {
                grid: [],
                spiritGrid: [],
            };
            for (let i = 0; i < state.areaGrid.length; i++) {
                floor.grid[i] = [];
                floor.spiritGrid[i] = [];
                for (let j = 0; j < state.areaGrid[i].length; j++) {
                    floor.grid[i][j] = null;
                    floor.spiritGrid[i][j] = null;
                }
            }
            state.zone.floors.push(floor);
            state.location.floor = state.zone.floors.length - 1;
            refreshArea(state);
        },
    }]);
    rows.push({
        name: 'Spirit World',
        value: !!state.location.isSpiritWorld,
        onChange(isSpiritWorld: boolean) {
            if (state.location.isSpiritWorld != isSpiritWorld) {
                state.location.isSpiritWorld = isSpiritWorld;
                state.location = getFullZoneLocation(state.location);
                editingState.spirit = isSpiritWorld;
                const tempInstance = state.areaInstance;
                state.areaGrid = isSpiritWorld ? state.floor.spiritGrid : state.floor.grid;
                state.areaInstance = state.alternateAreaInstance;
                state.alternateAreaInstance = tempInstance;
                state.hero.area = state.areaInstance;
                setConnectedAreas(state, tempInstance);
                setAreaSection(state);
                //enterLocation(state, state.location);
                editingState.needsRefresh = true;
            }
        }
    });
    rows = [...rows, ...getMinimapProperties()];
    rows.push(['Size', {
        name: '',
        id: `floor-columns`,
        value: state.areaGrid[0].length,
        onChange(columns: number) {
            if (columns < 1) {
                return state.areaGrid[0].length;
            }
            if (columns !== state.areaGrid[0].length) {
                for (const grid of [state.floor.grid, state.floor.spiritGrid]) {
                    for (let i = 0; i < grid.length; i++) {
                        while (grid[i].length < columns) {
                            grid[i].push(null);
                        }
                        while (grid[i].length > columns) {
                            grid[i].pop();
                        }
                    }
                }
                refreshArea(state);
            }
        }
    }, 'x', {
        name: '',
        id: `floor-rows`,
        value: state.areaGrid.length,
        onChange(rows: number) {
            if (rows < 1) {
                return state.areaGrid.length;
            }
            if (rows !== state.areaGrid.length) {
                for (const grid of [state.floor.grid, state.floor.spiritGrid]) {
                    for (let i = 0; i < grid.length; i++) {
                        while (grid.length < rows) {
                            grid.push([...new Array(grid[0].length)].map(() => null));
                        }
                        while (grid.length > rows) {
                            grid.pop();
                        }
                    }
                }
                refreshArea(state);
            }
        }
    }]);
    rows.push({
        name: 'sections',
        value: 'Change Layout',
        values: ['Change Layout', ...Object.keys(sectionLayouts)],
        onChange(sectionType: string) {
            state.areaInstance.definition.sections = sectionLayouts[sectionType];
            state.areaSection = null;
            setAreaSection(state);
            return 'Change Layout';
        }
    });
    rows.push({
        name: 'Refresh Area',
        onClick() {
            state.location.x = state.hero.x;
            state.location.y = state.hero.y;
            refreshArea(state);
        }
    });
    return rows;
}

export function getMinimapProperties(): PanelRows {
    const state = getState();
    const rows: PanelRows = [];
    rows.push(minimapContainer);
    rows.push({
        name: 'Auto-refresh minimap',
        value: !!editingState.refreshMinimap,
        onChange(isSpiritWorld: boolean) {
            editingState.refreshMinimap = !editingState.refreshMinimap;
            if (editingState.refreshMinimap) {
                checkToRefreshMinimap(state);
            }
        }
    });
    return rows;
}

export function getLogicProperties(
    state: GameState,
    label: string,
    logic: LogicDefinition | undefined,
    updateLogic: (newLogic?: LogicDefinition) => void
): PanelRows {
    const rows: PanelRows = [];
    let currentValue = 'none';
    if (logic?.isTrue) {
        currentValue = 'true';
    } else if (logic?.hasCustomLogic) {
        currentValue = 'custom';
    } else if (logic?.logicKey) {
        currentValue = logic.logicKey;
    }
    const row: PropertyRow = [{
        name: 'Logic',
        id: `${label} Logic`,
        value: currentValue,
        values: ['none', 'true', 'custom', ...Object.keys(logicHash)],
        onChange(logicType: string) {
            if (logicType === 'none') {
                updateLogic();
            } else if (logicType === 'true') {
                updateLogic({
                    isTrue: true,
                    isInverted: !!logic?.isInverted,
                });
            } else if (logicType === 'custom') {
                updateLogic({
                    hasCustomLogic: true,
                    customLogic: logic?.customLogic || '',
                    isInverted: !!logic?.isInverted,
                });
            } else {
                updateLogic({
                    logicKey: logicType,
                    isInverted: !!logic?.isInverted,
                });
            }
        }
    }];
    if (label) {
        row.unshift(label);
    }
    if (currentValue === 'custom') {
        row.push({
            name: 'Flag',
            value: logic?.customLogic || '',
            onChange(customLogic: string) {
                const updatedLogic = {...(logic || {})};
                updatedLogic.customLogic = customLogic;
                updateLogic(updatedLogic);
            },
        });
    }
    rows.push(row);
    if (currentValue !== 'none' && currentValue !== 'true') {
        rows.push({
            name: 'Invert',
            value: !!logic?.isInverted,
            onChange(isInverted: boolean) {
                const updatedLogic = {...(logic || {})};
                if (!isInverted) {
                    delete updatedLogic.isInverted;
                } else {
                    updatedLogic.isInverted = true;
                }
                updateLogic(updatedLogic);
            }
        });
    }
    return rows;
}
