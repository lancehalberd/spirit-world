import { AreaDefinition } from 'app/types';

export function exportAreaToClipboard(area: AreaDefinition): void {
    navigator.clipboard.writeText(serializeArea(area));
}

export function serializeArea(area: AreaDefinition) {
    const tileMap = {};
    let tileIndex = 0;
    const rowsByKey = {};
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
        rowsByKey[layer.key] = rows;
    });
    const lines = [];
    lines.push("import { AreaDefinition } from 'app/types';");
    lines.push("");
    const tileAssignments = [];
    for (let key in tileMap) {
        const data = tileMap[key];
        tileAssignments.push(`t${data.i} = {x: ${data.x}, y: ${data.y}}`);
    }
    lines.push(`const ${tileAssignments.join(', ')};`);
    lines.push('export const area: AreaDefinition = {');
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
            for (const row of rowsByKey[layer.key]) {
                lines.push(`                    [${row.join(',')}],`);
            }
            lines.push('                ],');
            lines.push('            },');
        }
        lines.push('        },');
    });
    lines.push('    ],');
    lines.push('};');
    return lines.join("\n");
}
window['serializeArea'] = serializeArea;
