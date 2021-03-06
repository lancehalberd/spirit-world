import { zones } from 'app/content/zones';

import { AreaGrid, Zone } from 'app/types';

export function exportZoneToClipboard(zone: Zone): void {
    navigator.clipboard.writeText(serializeZone(zone));
    console.log('Exported Zone', zone.key);
}

export function serializeZone(zone: Zone) {
    const tileMap = {};
    let tileIndex = 0;
    const emptySpiritAreas = [];
    let usedEmptyTile = false;
    for (const floor of zone.floors) {
        for (const areaGrid of [floor.grid, floor.spiritGrid]) {
            const key = (areaGrid === floor.grid) ? 'f' : 'sf';
            for (const gridRow of areaGrid) {
                for (const area of gridRow) {
                    let isEmpty = true;
                    if (!area) {
                        continue;
                    }
                    area[key] = {};
                    let usedEmptyTileInternally = false;
                    area.layers.map(layer => {
                        const rows = [];
                        for (let r = 0; r < layer.grid.tiles.length; r++) {
                            rows[r] = [];
                            for (let c = 0; c < layer.grid.tiles[r].length; c++) {
                                const tile = layer.grid.tiles[r][c];
                                // Spirit world tiles will be null when they should inherit from the physical world.
                                if (!tile) {
                                    rows[r][c] = 'e';
                                    usedEmptyTileInternally = true;
                                    continue;
                                }
                                isEmpty = false;
                                const {x, y} = tile;
                                if (!tileMap[`${x}x${y}`]) {
                                    tileMap[`${x}x${y}`] = {
                                        x, y, i: tileIndex++,
                                    };
                                }
                                rows[r][c] = 't' + tileMap[`${x}x${y}`].i;
                            }
                        }
                        area[key][layer.key] = rows;
                    });
                    if (isEmpty) {
                        emptySpiritAreas.push(area);
                    } else if (usedEmptyTileInternally) {
                        usedEmptyTile = true;
                    }
                }
            }
        }
    }
    const lines = [];
    lines.push("import { zones } from 'app/content/zones/zoneHash';");
    lines.push("");
    lines.push("import { AreaDefinition } from 'app/types';");
    lines.push("");
    const tileAssignments = [];
    // Only add the empty tile if it was used.
    if (usedEmptyTile) {
        tileAssignments.push('e = null');
    }
    for (let key in tileMap) {
        const data = tileMap[key];
        tileAssignments.push(`t${data.i} = {x: ${data.x}, y: ${data.y}}`);
    }
    lines.push(`const ${tileAssignments.join(', ')};`);
    for (let floorIndex = 0; floorIndex < zone.floors.length; floorIndex++) {
        const floor = zone.floors[floorIndex];
        for (const areaGrid of [floor.grid, floor.spiritGrid]) {
            const key = (areaGrid === floor.grid) ? 'f' : 'sf';
            for (let row = 0; row < areaGrid.length; row++) {
                for (let column = 0; column < areaGrid[row].length; column++) {
                    const area = areaGrid[row][column];
                    if (!area || emptySpiritAreas.includes(area)) {
                        lines.push(`const ${key}${floorIndex}_${row}x${column}: AreaDefinition = null;`);
                        continue;
                    }
                    lines.push(`const ${key}${floorIndex}_${row}x${column}: AreaDefinition = {`);
                    if (key === 'sf') {
                        lines.push(`    isSpiritWorld: true,`);
                        lines.push(`    parentDefinition: f${floorIndex}_${row}x${column},`);
                    }
                    lines.push('    layers: [');
                    area.layers.map(layer => {
                        lines.push('        {');
                        lines.push(`            key: '${layer.key}',`);
                        if (layer.x) lines.push(`            x: ${layer.x},`);
                        if (layer.y) lines.push(`            y: ${layer.y},`);
                        if (layer.grid) {
                            lines.push('            grid: {');
                            lines.push(`                w: ${layer.grid.w},`);
                            lines.push(`                h: ${layer.grid.h},`);
                            lines.push(`                palette: '${layer.grid.palette}',`);
                            lines.push('                tiles: [');
                            for (const row of area[key][layer.key]) {
                                lines.push(`                    [${row.join(',')}],`);
                            }
                            lines.push('                ],');
                            lines.push('            },');
                        }
                        lines.push('        },');
                    });
                    lines.push('    ],');
                    lines.push('    objects: [');
                    for (const object of area.objects) {
                        lines.push(`        {${Object.keys(object).map(k => `${k}: ${JSON.stringify(object[k])}` ).join(', ')}},`);
                    }
                    lines.push('    ],');
                    lines.push('    sections: [');
                    for (const section of area.sections) {
                        lines.push(`        {x: ${section.x}, y: ${section.y}, w: ${section.w}, h: ${section.h}},`);
                    }
                    lines.push('    ],');
                    if (area.dark) {
                        lines.push('    dark: true,');
                    }
                    lines.push('};');
                }
            }
        }
    }

    lines.push(`zones.${zone.key} = {`);
    lines.push(`    key: '${zone.key}',`);
    lines.push(`    floors: [`);
    for (let floorIndex = 0; floorIndex < zone.floors.length; floorIndex++) {
        let areaGrid = zone.floors[floorIndex].grid;
        let key = 'f';
        lines.push('        {');
        lines.push('            grid: [');
        for (let row = 0; row < areaGrid.length; row++) {
            let rowLine = '                [';
            for (let column = 0; column < areaGrid[row].length; column++) {
                rowLine += `${key}${floorIndex}_${row}x${column},`;
            }
            lines.push(rowLine + '],');
        }
        lines.push('            ],');
        lines.push('            spiritGrid: [');
        areaGrid = zone.floors[floorIndex].spiritGrid;
        key = 'sf';
        for (let row = 0; row < areaGrid.length; row++) {
            let rowLine = '                [';
            for (let column = 0; column < areaGrid[row].length; column++) {
                rowLine += `${key}${floorIndex}_${row}x${column},`;
            }
            lines.push(rowLine + '],');
        }
        lines.push('            ],');
        lines.push('        },');
    }
    lines.push(`    ],`);
    lines.push('};');
    lines.push('');

    return lines.join("\n");
}
window['serializeZone'] = serializeZone;


// Importing a zone will override the zones hash entry for the zone.
export function importZone(fileContents: string): string {
    if (!window.confirm('Replace current area?')) {
        return;
    }
    worldMap = null;
    // Remove all import lines.
    fileContents = fileContents.replace(/import.*\n/g, '');
    // Remove all export tokens at the start of lines.
    fileContents = fileContents.replace(/\bexport /g, '');
    // Remove all type definitions.
    fileContents = fileContents.replace(/: [A-Z][a-zA-Z]+/g, '');

    const zoneKey = fileContents.match(/zones\.(\w+) = /)[1];
    // console.log(fileContents);
    fileContents = fileContents.replace(/zones\./, 'localZones.');
    const localZones = {};
    eval(fileContents);
    zones[zoneKey] = localZones[zoneKey];
    return zoneKey;
}

let worldMap: AreaGrid;
export function importAreaGrid(fileContents: string): AreaGrid {
    if (!window.confirm('Replace current area?')) {
        return;
    }
    worldMap = null;
    // Remove all import lines.
    fileContents = fileContents.replace(/import.*\n/g, '');
    // Remove all export tokens at the start of lines.
    fileContents = fileContents.replace(/\bexport /g, '');
    // Remove all type definitions.
    fileContents = fileContents.replace(/: [A-Z][a-zA-Z]+/g, '');
    // Remove const declaration so we will set the local `worldMap` variable instead.
    fileContents = fileContents.replace(/const worldMap/g, 'worldMap');
    // console.log(fileContents);
    eval(fileContents);
    return worldMap;
}
