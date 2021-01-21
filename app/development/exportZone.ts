import { zones } from 'app/content/zones';

import { AreaGrid, Zone } from 'app/types';

export function exportZoneToClipboard(zone: Zone): void {
    navigator.clipboard.writeText(serializeZone(zone));
    console.log('Exported Zone', zone.key);
}

export function serializeZone(zone: Zone) {
    const tileMap = {};
    let tileIndex = 0;
    for (const floor of zone.floors) {
        const areaGrid = floor.grid;
        for (const gridRow of areaGrid) {
            for (const area of gridRow) {
                if (!area) {
                    continue;
                }
                area['rowsByKey'] = {};
                area.layers.map(layer => {
                    const rows = [];
                    for (let r = 0; r < layer.grid.tiles.length; r++) {
                        rows[r] = [];
                        for (let c = 0; c < layer.grid.tiles[r].length; c++) {
                            const {x, y} = layer.grid.tiles[r][c];
                            if (!tileMap[`${x}x${y}`]) {
                                tileMap[`${x}x${y}`] = {
                                    x, y, i: tileIndex++,
                                };
                            }
                            rows[r][c] = 't' + tileMap[`${x}x${y}`].i;
                        }
                    }
                    area['rowsByKey'][layer.key] = rows;
                });
            }
        }
    }
    const lines = [];
    lines.push("import { zones } from 'app/content/zones/zoneHash';");
    lines.push("");
    lines.push("import { AreaDefinition } from 'app/types';");
    lines.push("");
    const tileAssignments = [];
    for (let key in tileMap) {
        const data = tileMap[key];
        tileAssignments.push(`t${data.i} = {x: ${data.x}, y: ${data.y}}`);
    }
    lines.push(`const ${tileAssignments.join(', ')};`);
    for (let floorIndex = 0; floorIndex < zone.floors.length; floorIndex++) {
        const areaGrid = zone.floors[floorIndex].grid;
        for (let row = 0; row < areaGrid.length; row++) {
            for (let column = 0; column < areaGrid[row].length; column++) {
                const area = areaGrid[row][column];
                if (!area) {
                    lines.push(`const f${floorIndex}_${row}x${column}: AreaDefinition = null;`);
                    continue;
                }
                lines.push(`const f${floorIndex}_${row}x${column}: AreaDefinition = {`);
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
                        for (const row of area['rowsByKey'][layer.key]) {
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

    lines.push('zones.peachCave = {');
    lines.push(`    key: '${zone.key}',`);
    lines.push(`    floors: [`);
    for (let floorIndex = 0; floorIndex < zone.floors.length; floorIndex++) {
        const areaGrid = zone.floors[floorIndex].grid;
        lines.push('        {');
        lines.push('            grid: [');
        for (let row = 0; row < areaGrid.length; row++) {
            let rowLine = '                [';
            for (let column = 0; column < areaGrid[row].length; column++) {
                rowLine += `f${floorIndex}_${row}x${column},`;
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
