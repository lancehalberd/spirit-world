import _ from 'lodash';
import {
    enterArea, enterAreaGrid, setAreaSection,
} from 'app/content/areas';
import { zones } from 'app/content/zones';
import { exportZoneToClipboard, importZone, serializeZone } from 'app/development/exportZone';
import { displayTileEditorPropertyPanel, EditingState } from 'app/development/tileEditor';
import { createCanvasAndContext } from 'app/dom';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from 'app/gameConstants';
import { getState } from 'app/state';
import { readFromFile, saveToFile } from 'app/utils/index';

import {
    Floor, GameState, PanelRows, Zone
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

export function renderZoneEditor(context: CanvasRenderingContext2D, state: GameState, editingState: EditingState): void {
    const width = state.areaGrid[0].length * 32;
    const height = state.areaGrid.length * 32;
    if (mapCanvas.width !== width || mapCanvas.height !== height) {
        mapCanvas.width = width;
        mapCanvas.height = height;
    }
    mapContext.clearRect(0, 0, width, height);

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

    mapContext.fillStyle = 'rgba(255, 255, 255, 0.8)';
    const area = state.nextAreaInstance || state.areaInstance;
    let cameraX = Math.floor(state.areaGridCoords.x * 32 + state.camera.x / 16 - area.cameraOffset.x / 16);
    let cameraY = Math.floor(state.areaGridCoords.y * 32 + state.camera.y / 16 - area.cameraOffset.y / 16);
    mapContext.fillRect(cameraX, cameraY, CANVAS_WIDTH / 16, CANVAS_HEIGHT / 16);
}

export function getZoneProperties(state: GameState, editingState: EditingState): PanelRows {
    const rows: PanelRows = [];
    rows.push({
        name: editingState.showZoneProperties ? 'Zone -' : 'Zone +',
        onClick() {
            editingState.showZoneProperties = !editingState.showZoneProperties;
            displayTileEditorPropertyPanel();
        },
    });
    if (!editingState.showZoneProperties) {
        return rows;
    }
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
                const zoneKey = importZone(contents);
                const state = getState();
                state.zone = zones[zoneKey];
                state.floor = 0;
                enterAreaGrid(getState(), state.zone.floors[state.floor].grid);
            });
        },
    }, {
        name: 'Import from File',
        onClick() {
            readFromFile().then(contents => {
                const zoneKey = importZone(contents);
                const state = getState();
                state.zone = zones[zoneKey];
                state.floor = 0;
                enterAreaGrid(getState(), state.zone.floors[state.floor].grid);
            });
        },
    }]);

    rows.push([{
        name: 'zone',
        value: state.zone.key,
        values: Object.keys(zones),
        onChange(zoneKey: string) {
            if (state.zone.key !== zoneKey) {
                state.zone = zones[zoneKey];
                state.floor = 0;
                state.areaGrid = state.zone.floors[state.floor].grid;
                enterAreaGrid(state, state.areaGrid);
                displayTileEditorPropertyPanel();
            }
        }
    }, {
        name: '+',
        id: `add-new-zone`,
        onClick() {
            const newZoneKey = window.prompt('Enter the new zone key');
            if (zones[newZoneKey]) {
                return;
            }
            const zone: Zone = {
                key: newZoneKey,
                floors: [
                    {
                        grid: [[null]],
                    },
                ],
            };
            zones[newZoneKey] = zone;
            state.zone = zone;
            state.floor = 0;
            state.areaGrid = zone.floors[state.floor].grid;
            enterAreaGrid(state, state.areaGrid);
            displayTileEditorPropertyPanel();
        },
    }]);

    const floor = _.findIndex(state.zone.floors, {grid: state.areaGrid});
    rows.push([{
        name: 'floor',
        value: '' + (floor + 1),
        values: ([...new Array(state.zone.floors.length)].map((v, i) => '' + (i + 1))),
        onChange(floorString: string) {
            const floorNumber = parseInt(floorString, 10);
            const newGrid = state.zone.floors[floorNumber - 1].grid;
            state.floor = floorNumber;
            if (newGrid !== state.areaGrid) {
                enterAreaGrid(state, newGrid);
                displayTileEditorPropertyPanel();
            }
        }
    }, {
        name: '+',
        id: `add-zone-floor`,
        onClick() {
            const floor: Floor = {
                grid: []
            };
            for (let i = 0; i < state.areaGrid.length; i++) {
                floor.grid[i] = [];
                for (let j = 0; j < state.areaGrid[i].length; j++) {
                    floor.grid[i][j] = null;
                }
            }
            state.zone.floors.push(floor);
            state.floor = state.zone.floors.length - 1;
            enterAreaGrid(state, state.zone.floors[state.floor].grid);
            displayTileEditorPropertyPanel();
        },
    }]);

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
                for (let i = 0; i < state.areaGrid.length; i++) {
                    while (state.areaGrid[i].length < columns) {
                        state.areaGrid[i].push(null);
                    }
                    while (state.areaGrid[i].length > columns) {
                        state.areaGrid[i].pop();
                    }
                }
                enterAreaGrid(state, state.areaGrid);
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
                while (state.areaGrid.length < rows) {
                    state.areaGrid.push([...new Array(state.areaGrid[0].length)].map(() => null));
                }
                while (state.areaGrid.length > rows) {
                    state.areaGrid.pop();
                }
                enterAreaGrid(state, state.areaGrid);
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
        name: 'dark',
        value: !!state.areaInstance.definition.dark,
        onChange(dark: boolean) {
            state.areaInstance.definition.dark = dark;
        }
    });
    rows.push({
        name: 'Refresh Area',
        onClick() {
            // Calling this will instantiate the area again and place the player back in their current location.
            enterArea(state, state.areaInstance.definition, state.hero.x, state.hero.y);
        }
    });
    return rows;
}
