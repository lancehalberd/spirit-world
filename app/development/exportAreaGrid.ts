import { AreaGrid } from 'app/types';

export function exportAreaGridToClipboard(areaGrid: AreaGrid): void {
    navigator.clipboard.writeText(serializeAreaGrid(areaGrid));
    console.log('Exported Area Grid');
}

export function serializeAreaGrid(areaGrid: AreaGrid) {
    const tileMap = {};
    let tileIndex = 0;
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
    const lines = [];
    lines.push("import { AreaDefinition, AreaGrid } from 'app/types';");
    lines.push("");
    const tileAssignments = [];
    for (let key in tileMap) {
        const data = tileMap[key];
        tileAssignments.push(`t${data.i} = {x: ${data.x}, y: ${data.y}}`);
    }
    lines.push(`const ${tileAssignments.join(', ')};`);
    for (let row = 0; row < areaGrid.length; row++) {
        for (let column = 0; column < areaGrid[row].length; column++) {
            const area = areaGrid[row][column];
            if (!area) {
                lines.push(`const a${row}x${column}: AreaDefinition = null;`);
                continue;
            }
            lines.push(`const a${row}x${column}: AreaDefinition = {`);
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
            lines.push('};');
        }
    }

    lines.push('export const worldMap: AreaGrid = [');
    for (let row = 0; row < areaGrid.length; row++) {
        let rowLine = '    [';
        for (let column = 0; column < areaGrid[row].length; column++) {
            rowLine += `a${row}x${column},`;
        }
        lines.push(rowLine + '],');
    }
    lines.push('];');
    return lines.join("\n");
}
window['serializeAreaGrid'] = serializeAreaGrid;
