import { FullZoneLocation, LogicalZoneKey, ZoneLocation } from 'app/types';

export function getFullZoneLocation(location: ZoneLocation): FullZoneLocation {
    const { zoneKey, isSpiritWorld, areaGridCoords } = location;
    // There is one frame after the transition finishes where the coordinates can be out
    // of range, but work correctly if taken mod 512.
    // const x = (location.x + 512) % 512; // This isn't needed so far.
    const y = (location.y + 512) % 512;
    let logicalZoneKey: LogicalZoneKey = location.zoneKey as LogicalZoneKey;
    if (zoneKey === 'caves') {
        if (areaGridCoords.x === 0) {
            logicalZoneKey = isSpiritWorld ? 'ascentCaveSpirit' : 'ascentCave';
        } else {
            if (y < 256) {
                logicalZoneKey = 'bushCave';
            } else {
                logicalZoneKey = isSpiritWorld ? 'fertilityShrineSpirit' : 'fertilityShrine';
            }
        }
    } else if (zoneKey === 'grandTemple' || zoneKey === 'grandTempleWater') {
        logicalZoneKey = isSpiritWorld ? 'jadePalace' : 'grandTemple';
    } else if (zoneKey === 'overworld' || zoneKey === 'underwater') {
        logicalZoneKey = isSpiritWorld ? 'spiritWorld' : 'overworld';
    } else if (zoneKey === 'peachCave' || zoneKey === 'peachCaveWater') {
        logicalZoneKey = isSpiritWorld ? 'peachCaveSpirit' : 'peachCave';
    } else if (zoneKey === 'riverTemple' || zoneKey === 'riverTempleWater') {
        logicalZoneKey = 'riverTemple';
    } else if (zoneKey === 'sky') {
        logicalZoneKey = isSpiritWorld ? 'spiritSky' : 'sky';
    } else if (zoneKey === 'treeVillage') {
        logicalZoneKey = isSpiritWorld ? 'forestTemple' : 'treeVillage';
    } else if (zoneKey === 'holyCityInterior') {
        logicalZoneKey = isSpiritWorld ? 'jadeCityInterior' : 'holyCityInterior';
    }  else if (zoneKey === 'warTemple') {
        logicalZoneKey = isSpiritWorld ? 'warPalace' : 'warTemple';
    } else if (
        zoneKey === 'holySanctum'
        || zoneKey === 'fireSanctum' || zoneKey === 'lightningSanctum' || zoneKey === 'iceSanctum'
    ) {
        logicalZoneKey = 'holySanctum';
    }
    return {
        ...location,
        logicalZoneKey,
    }
}
