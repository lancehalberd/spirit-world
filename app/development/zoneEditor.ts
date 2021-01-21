import _ from 'lodash';
import {
    enterAreaGrid, setAreaSection,
} from 'app/content/areas';
import { zones } from 'app/content/zones';
import { exportZoneToClipboard, importZone, serializeZone } from 'app/development/exportZone';
import { displayTileEditorPropertyPanel, EditingState } from 'app/development/tileEditor';
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
                enterAreaGrid(getState(), state.zone.floors[0].grid);
            });
        },
    }, {
        name: 'Import from File',
        onClick() {
            readFromFile().then(contents => {
                const zoneKey = importZone(contents);
                const state = getState();
                state.zone = zones[zoneKey];
                enterAreaGrid(getState(), state.zone.floors[0].grid);
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
                state.areaGrid = state.zone.floors[0].grid;
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
            state.areaGrid = zone.floors[0].grid;
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
            enterAreaGrid(state, floor.grid);
            displayTileEditorPropertyPanel();
        },
    }]);


    rows.push({
        name: 'sections',
        value: 'Change Layout',
        values: ['Change Layout', ...Object.keys(sectionLayouts)],
        onChange(sectionType: string) {
            state.areaInstance.definition.sections = sectionLayouts[sectionType];
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
    return rows;
}
