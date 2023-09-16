import { zones } from 'app/content/zones';
import { showToast } from 'app/development/toast';
import { randomizerSeed, enemySeed, entranceSeed } from 'app/gameConstants';


export function exportZoneToClipboard(zone: Zone): void {
    navigator.clipboard.writeText(serializeZone(zone));
    showToast(`Exported Zone  ${zone.key}`);
}

export function serializeZone(zone: Zone) {
    if (randomizerSeed || enemySeed || entranceSeed) {
        throw new Error('Cannot export zone while randomizer is active, item placements will be changed.');
    }
    const emptyAreas = [];
    for (const floor of zone.floors) {
        for (const areaGrid of [floor.grid, floor.spiritGrid]) {
            for (const gridRow of areaGrid) {
                for (const area of gridRow) {
                    let isEmpty = true;
                    if (!area?.layers) {
                        continue;
                    }
                    area.layers.forEach(layer => {
                        for (let r = 0; r < layer.grid.h; r++) {
                            for (let c = 0; c < layer.grid.w; c++) {
                                if (layer.grid.tiles[r][c]) {
                                    isEmpty = false;
                                    return false;
                                }
                            }
                        }
                    });
                    if (isEmpty) {
                        emptyAreas.push(area);
                    }
                }
            }
        }
    }
    const lines = [];
    lines.push("import { zones } from 'app/content/zones/zoneHash';");
    lines.push("");
    for (let floorIndex = 0; floorIndex < zone.floors.length; floorIndex++) {
        const floor = zone.floors[floorIndex];
        for (const areaGrid of [floor.grid, floor.spiritGrid]) {
            const key = (areaGrid === floor.grid) ? 'f' : 'sf';
            for (let row = 0; row < areaGrid.length; row++) {
                for (let column = 0; column < areaGrid[row].length; column++) {
                    const area = areaGrid[row][column];
                    // Section indexes + map ids for maps won't get saved if we do this, so never set entire area definitions to null.
                    /*if (!area || (emptyAreas.includes(area) && !area.objects.length)) {
                        lines.push(`const ${key}${floorIndex}_${column}x${row}: AreaDefinition = null;`);
                        continue;
                    }*/
                    lines.push(`const ${key}${floorIndex}_${column}x${row}: AreaDefinition = {`);
                    if (key === 'sf') {
                        lines.push(`    isSpiritWorld: true,`);
                        lines.push(`    parentDefinition: f${floorIndex}_${column}x${row},`);
                    }
                    if (!area.layers || emptyAreas.includes(area)) {
                        // Setting the layers to null will initialize this to the
                        // default layers which inherits from parent area.
                        lines.push('    layers: null,');
                    } else {
                        lines.push('    layers: [');
                        area.layers.forEach(layer => {
                            lines.push('        {');
                            lines.push(`            key: '${layer.key}',`);
                            if (layer.x) lines.push(`            x: ${layer.x},`);
                            if (layer.y) lines.push(`            y: ${layer.y},`);
                            if (layer.drawPriority) lines.push(`            drawPriority: '${layer.drawPriority}',`);
                            if (layer.logicKey) lines.push(`            logicKey: '${layer.logicKey}',`);
                            if (layer.hasCustomLogic) {
                                lines.push(`            hasCustomLogic: true, customLogic: '${layer.customLogic || ''}',`);
                            }
                            if (layer.invertLogic) lines.push(`            invertLogic: true,`);
                            if (layer.grid) {
                                lines.push('            grid: {');
                                lines.push(`                w: ${layer.grid.w},`);
                                lines.push(`                h: ${layer.grid.h},`);
                                lines.push('                tiles: [');
                                for (let y = 0; y < layer.grid.h; y++) {
                                    const row = layer.grid.tiles[y];
                                    lines.push(`                    [${row.slice(0, layer.grid.w).map(v => v || 0).join(',')}],`);
                                }
                                lines.push('                ],');
                                lines.push('            },');
                            }
                            if (layer.mask && layer.mask.tiles.some(row => row?.some(element => element))) {
                                lines.push('            mask: {');
                                lines.push(`                w: ${layer.mask.w},`);
                                lines.push(`                h: ${layer.mask.h},`);
                                lines.push('                tiles: [');
                                for (let y = 0; y < layer.grid.h; y++) {
                                    const row = layer.mask.tiles[y];
                                    lines.push(`                    [${row?.slice(0, layer.grid.w).map(v => v || 0).join(',') || ''}],`);
                                }
                                lines.push('                ],');
                                lines.push('            },');
                            }
                            lines.push('        },');
                        });
                        lines.push('    ],');
                    }
                    lines.push('    objects: [');
                    for (const object of area.objects) {
                        lines.push(`        {${Object.keys(object).filter(k => object[k] !== undefined && object[k] !== null).map(k => `${k}: ${JSON.stringify(object[k])}` ).join(', ')}},`);
                    }
                    lines.push('    ],');
                    lines.push('    sections: [');
                    for (const section of area.sections) {
                        let extraFields = '';
                        if (section.index >= 0) {
                            extraFields += `, index: ${section.index}`;
                        }
                        if (section.hotLogic) {
                            extraFields += `, hotLogic: ${JSON.stringify(section.hotLogic)}`;
                        }
                        if (section.hideMap) {
                            extraFields += `, hideMap: ${section.hideMap}`;
                        }
                        if (section.mapId) {
                            extraFields += `, mapId: '${section.mapId}'`;
                        }
                        if (section.floorId) {
                            extraFields += `, floorId: '${section.floorId}'`;
                        }
                        if (section.entranceId) {
                            extraFields += `, entranceId: '${section.entranceId}'`;
                        }
                        if (section.mapX >= 0) {
                            extraFields += `, mapX: ${section.mapX}`;
                        }
                        if (section.mapY >= 0) {
                            extraFields += `, mapY: ${section.mapY}`;
                        }
                        lines.push(`        {x: ${section.x}, y: ${section.y}, w: ${section.w}, h: ${section.h}${extraFields}}, `);

                    }
                    lines.push('    ],');
                    if (area.dark) {
                        lines.push(`    dark: ${area.dark},`);
                    }
                    if (area.corrosiveLogic) {
                        lines.push(`    corrosiveLogic: ${JSON.stringify(area.corrosiveLogic)},`);
                    }
                    if (area.specialBehaviorKey) {
                        lines.push(`    specialBehaviorKey: '${area.specialBehaviorKey}',`);
                    }
                    lines.push('};');
                }
            }
        }
    }

    lines.push(`zones.${zone.key} = {`);
    lines.push(`    key: '${zone.key}',`);
    const {w, h} = zone.areaSize ?? {w:32, h: 32};
    lines.push(`    areaSize: {w: ${w}, h: ${h}},`);
    if (zone.surfaceKey) {
        lines.push(`    surfaceKey: '${zone.surfaceKey}',`);
    }
    if (zone.underwaterKey) {
        lines.push(`    underwaterKey: '${zone.underwaterKey}',`);
    }
    lines.push(`    floors: [`);
    for (let floorIndex = 0; floorIndex < zone.floors.length; floorIndex++) {
        let areaGrid = zone.floors[floorIndex].grid;
        let key = 'f';
        lines.push('        {');
        lines.push('            grid: [');
        for (let row = 0; row < areaGrid.length; row++) {
            let rowLine = '                [';
            for (let column = 0; column < areaGrid[row].length; column++) {
                rowLine += `${key}${floorIndex}_${column}x${row},`;
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
                rowLine += `${key}${floorIndex}_${column}x${row},`;
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
export function importZone(fileContents: string, currentZoneKey: string): string {
    // Remove all import lines.
    fileContents = fileContents.replace(/import[^;]*;/g, '');
    if (fileContents.includes('import')) {
        debugger;
    }
    // Remove all export tokens at the start of lines.
    fileContents = fileContents.replace(/\bexport /g, '');
    // Remove all type definitions.
    fileContents = fileContents.replace(/: [A-Z][a-zA-Z]+/g, '');

    const zoneKey = fileContents.match(/zones\.(\w+) = /)[1];
    if (zoneKey === currentZoneKey) {
        if (!window.confirm('Replace current area?')) {
            return;
        }
    }
    // console.log(fileContents);
    fileContents = fileContents.replace(/zones\./, 'localZones.');
    const localZones = {};
    try {
        eval(fileContents);
    } catch (error) {
        console.log(fileContents);
        throw error;
    }
    zones[zoneKey] = localZones[zoneKey];
    return zoneKey;
}
