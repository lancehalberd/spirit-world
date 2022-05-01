import {
    enterLocation, setAreaSection, setConnectedAreas,
} from 'app/content/areas';
import { logicHash } from 'app/content/logic';
import { specialBehaviorsHash } from 'app/content/specialBehaviors';
import { zones } from 'app/content/zones';
import { exportZoneToClipboard, importZone, serializeZone } from 'app/development/exportZone';
import { TabContainer } from 'app/development/tabContainer';
import { renderPropertyRows } from 'app/development/propertyPanel';
import { displayTileEditorPropertyPanel, editingState, EditingState } from 'app/development/tileEditor';
import { createCanvasAndContext } from 'app/dom';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from 'app/gameConstants';
import { getState } from 'app/state';
import { readFromFile, saveToFile } from 'app/utils/index';

import {
    Floor, GameState, LogicDefinition, PanelRows, PropertyRow, Zone
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

const [mapCanvas, mapContext] = createCanvasAndContext(128, 128);

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

export function renderZoneEditor(context: CanvasRenderingContext2D, state: GameState, editingState: EditingState): void {
    const width = state.areaGrid[0].length * 32;
    const height = state.areaGrid.length * 32;
    if (mapCanvas.width !== width || mapCanvas.height !== height) {
        mapCanvas.width = width;
        mapCanvas.height = height;
    }
    mapContext.fillStyle = 'rgba(200, 200, 200, 1)';
    mapContext.fillRect(0, 0, width, height);

    mapContext.fillStyle = 'rgba(50, 50, 50, 0.5)';
    for (let row = 0; row < state.areaGrid.length; row++) {
        for (let column = 0; column < state.areaGrid[row].length; column++) {
            for( const section of (state.areaGrid[row][column]?.sections || [fullSection])) {
                mapContext.fillRect(column * 32 + section.x, row * 32 + section.y, section.w, 1);
                mapContext.fillRect(column * 32 + section.x, row * 32 + section.y + section.h - 1, section.w, 1);
                mapContext.fillRect(column * 32 + section.x, row * 32 + section.y + 1, 1, section.h - 2);
                mapContext.fillRect(column * 32 + section.x + section.w - 1, row * 32 + section.y + 1, 1, section.h - 2);
            }
        }
    }
    const area = state.nextAreaInstance || state.areaInstance;
    mapContext.drawImage(area.canvas,
        0, 0, 512, 512,
        state.location.areaGridCoords.x * 32, state.location.areaGridCoords.y * 32, 32, 32
    );
    mapContext.fillStyle = 'rgba(255, 255, 255, 0.5)';
    let cameraX = Math.floor(state.location.areaGridCoords.x * 32 + state.camera.x / 16 - area.cameraOffset.x / 16);
    let cameraY = Math.floor(state.location.areaGridCoords.y * 32 + state.camera.y / 16 - area.cameraOffset.y / 16);
    mapContext.fillRect(cameraX, cameraY, CANVAS_WIDTH / 16, CANVAS_HEIGHT / 16);
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
                enterLocation(state, state.location);
                displayTileEditorPropertyPanel();
            });
        },
    }, {
        name: 'Import from File',
        onClick() {
            readFromFile().then(contents => {
                const state = getState();
                state.location.zoneKey = importZone(contents, state.location.zoneKey);
                state.location.floor = 0;
                enterLocation(state, state.location);
                displayTileEditorPropertyPanel();
            });
        },
    }]);
    return rows;
}


export function getBehaviorProperties(): PanelRows {
    const state = getState();
    let rows: PanelRows = [];
    rows.push(mapCanvas);
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
                enterLocation(state, state.location);
                displayTileEditorPropertyPanel();
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
            displayTileEditorPropertyPanel();
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
            displayTileEditorPropertyPanel();
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
        }
    });
    rows = [...rows, ...getLogicProperties(state, 'Is Hot?', state.areaInstance.definition.hotLogic || {}, updatedLogic => {
        state.areaInstance.definition.hotLogic = updatedLogic;
        enterLocation(state, state.location);
        displayTileEditorPropertyPanel();
    })];
    rows.push({
        name: 'Refresh Area',
        onClick() {
            state.location.x = state.hero.x;
            state.location.y = state.hero.y;
            // Calling this will instantiate the area again and place the player back in their current location.
            enterLocation(state, state.location);
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
                enterLocation(state, state.location);
                displayTileEditorPropertyPanel();
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
            enterLocation(state, state.location);
            displayTileEditorPropertyPanel();
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
                enterLocation(state, state.location);
                displayTileEditorPropertyPanel();
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
            enterLocation(state, state.location);
            displayTileEditorPropertyPanel();
        },
    }]);
    rows.push({
        name: 'Spirit World',
        value: !!state.location.isSpiritWorld,
        onChange(isSpiritWorld: boolean) {
            if (state.location.isSpiritWorld != isSpiritWorld) {
                state.location.isSpiritWorld = isSpiritWorld;
                editingState.spirit = isSpiritWorld;
                const tempInstance = state.areaInstance;
                state.areaInstance = state.alternateAreaInstance;
                state.alternateAreaInstance = tempInstance;
                state.hero.area = state.areaInstance;
                setConnectedAreas(state, tempInstance);
                //enterLocation(state, state.location);
                displayTileEditorPropertyPanel();
            }
        }
    });
    rows.push(mapCanvas);

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
                enterLocation(state, state.location);
                displayTileEditorPropertyPanel();
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
                enterLocation(state, state.location);
                displayTileEditorPropertyPanel();
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
            setAreaSection(state, state.hero.d);
            return 'Change Layout';
        }
    });
    rows.push({
        name: 'Refresh Area',
        onClick() {
            state.location.x = state.hero.x;
            state.location.y = state.hero.y;
            // Calling this will instantiate the area again and place the player back in their current location.
            enterLocation(state, state.location);
        }
    });
    return rows;
}

export function getLogicProperties(
    state: GameState,
    label: string,
    logic: LogicDefinition,
    updateLogic: (newLogic?: LogicDefinition) => void
): PanelRows {
    const rows: PanelRows = [];
    let currentValue = 'none';
    if (logic.isTrue) {
        currentValue = 'true';
    } else if (logic.hasCustomLogic) {
        currentValue = 'custom';
    } else if (logic.logicKey) {
        currentValue = logic.logicKey;
    }
    const row: PropertyRow = [{
        name: 'Logic',
        value: currentValue,
        values: ['none', 'true', 'custom', ...Object.keys(logicHash)],
        onChange(logicType: string) {
            if (logicType === 'none') {
                updateLogic();
            } else if (logicType === 'true') {
                updateLogic({
                    isTrue: true,
                    isInverted: !!logic.isInverted,
                });
            } else if (logicType === 'custom') {
                updateLogic({
                    hasCustomLogic: true,
                    customLogic: logic.customLogic || '',
                    isInverted: !!logic.isInverted,
                });
            } else {
                updateLogic({
                    logicKey: logicType,
                    isInverted: !!logic.isInverted,
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
            value: logic.customLogic || '',
            onChange(customLogic: string) {
                const updatedLogic = {...logic};
                updatedLogic.customLogic = customLogic;
                updateLogic(updatedLogic);
            },
        });
    }
    rows.push(row);
    if (currentValue !== 'none' && currentValue !== 'true') {
        rows.push({
            name: 'Invert',
            value: !!logic.isInverted,
            onChange(isInverted: boolean) {
                const updatedLogic = {...logic};
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
