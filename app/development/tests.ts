import { zones } from 'app/content/zones/zoneHash';

import { AreaDefinition, ObjectDefinition, Zone, ZoneLocation } from 'app/types';

function everyZone(callback: (location: Partial<ZoneLocation>, zone: Zone) => void ) {
    for (const zoneKey in zones) {
        callback({zoneKey}, zones[zoneKey]);
    }
}
function everyArea(callback: (location: ZoneLocation, zone: Zone, area: AreaDefinition) => void ) {
    everyZone((location, zone) => {
        for (let floor = 0; floor < zone.floors.length; floor++) {
            for (const grid of [zone.floors[floor].grid, zone.floors[floor].spiritGrid]) {
                if (!grid) {
                    continue;
                }
                const isSpiritWorld = grid === zone.floors[floor].spiritGrid;
                for (let y = 0; y < grid.length; y++) {
                    for (let x = 0; x < grid[y].length; x++) {
                        if (!grid[y][x]) {
                            continue;
                        }
                        callback({
                            zoneKey: location.zoneKey,
                            floor,
                            isSpiritWorld,
                            areaGridCoords: {x, y},
                            x: 0, y: 0, d: 'up',
                        }, zone, grid[y][x]);
                    }
                }
            }
        }
    });
}
function everyObject(callback: (location: ZoneLocation, zone: Zone, area: AreaDefinition, objectDefinition: ObjectDefinition) => void) {
    everyArea((location, zone, area) => {
        for (let i = 0; i < area.objects.length; i++) {
            callback(location, zone, area, area.objects[i]);
        }
    });
}

export const tests: {[key: string]: () => void} = {
    checkObjectsHaveIds() {
        everyObject((location, zone, area, objectDefinition) => {
            if (objectDefinition.saveStatus === 'never') {
                return;
            }
            if (!objectDefinition.saveStatus && objectDefinition.type !== 'boss' && objectDefinition.type !== 'enemy') {
                return;
            }
            if (!objectDefinition.id) {
                console.error(`Missing object id`, location, objectDefinition);
            }
        });
    }
};
window['tests'] = tests;

export function runAllTests() {
    for (const key in tests) {
        try {
            tests[key]();
        } catch (e) {
            console.error(`Text ${key} failed:`, e.message);
        }
    }
}
window['runAllTests'] = runAllTests;
