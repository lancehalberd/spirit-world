import { zones } from 'app/content/zones/zoneHash';

export function everyZone(callback: (location: Partial<ZoneLocation>, zone: Zone) => void ) {
    for (const zoneKey in zones) {
        callback({zoneKey}, zones[zoneKey]);
    }
}

export function everyAreaInZone(zone: Zone, callback: (location: ZoneLocation, area: AreaDefinition) => void): void {
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
                        zoneKey: zone.key,
                        floor,
                        isSpiritWorld,
                        areaGridCoords: {x, y},
                        x: 0, y: 0, d: 'up',
                    }, grid[y][x]);
                }
            }
        }
    }
}

export function everyArea(callback: (location: ZoneLocation, zone: Zone, area: AreaDefinition) => void ) {
    everyZone((location, zone) => {
        everyAreaInZone(zone, (location, area) => callback(location, zone, area));
    });
}
export function everyObject(callback: (location: ZoneLocation, zone: Zone, area: AreaDefinition, objectDefinition: ObjectDefinition) => void) {
    everyArea((location, zone, area) => {
        for (let i = 0; i < area.objects.length; i++) {
            callback(location, zone, area, area.objects[i]);
        }
    });
}
