
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
    } else if (zoneKey === 'grandTemple') {
        logicalZoneKey = isSpiritWorld ? 'jadePalace' : 'grandTemple';
    } else if (zoneKey === 'gauntlet' || zoneKey === 'gauntletWater') {
        logicalZoneKey = 'gauntlet';
    } else if (zoneKey === 'overworld' || zoneKey === 'underwater') {
        logicalZoneKey = isSpiritWorld ? 'spiritWorld' : 'overworld';
    } else if (zoneKey === 'forest' || zoneKey === 'forestWater') {
        logicalZoneKey = isSpiritWorld ? 'spiritForest' : 'forest';
    } else if (zoneKey === 'peachCave' || zoneKey === 'peachCaveWater') {
        logicalZoneKey = isSpiritWorld ? 'peachCaveSpirit' : 'peachCave';
    } else if (zoneKey === 'riverTemple' || zoneKey === 'riverTempleWater') {
        logicalZoneKey = 'riverTemple';
    } else if (zoneKey === 'sky') {
        if (isSpiritWorld && areaGridCoords.x === 1 && areaGridCoords.y === 1) {
            logicalZoneKey = 'skyPalace';
        } else {
            logicalZoneKey = isSpiritWorld ? 'spiritSky' : 'sky';
        }
    } else if (zoneKey === 'treeVillage' || zoneKey === 'forestTemple') {
        logicalZoneKey = isSpiritWorld ? 'forestTemple' : 'treeVillage';
    } else if (zoneKey === 'holyCityInterior') {
        logicalZoneKey = isSpiritWorld ? 'jadeCityInterior' : 'holyCityInterior';
    }  else if (zoneKey === 'warTemple') {
        logicalZoneKey = isSpiritWorld ? 'warPalace' : 'warTemple';
    } else if (
        zoneKey === 'holySanctum' || zoneKey === 'holySanctumBack'
        || zoneKey === 'fireSanctum' || zoneKey === 'lightningSanctum' || zoneKey === 'iceSanctum'
    ) {
        logicalZoneKey = 'holySanctum';
    } else if (zoneKey === 'tree' || zoneKey === 'treeWater') {
        logicalZoneKey = isSpiritWorld ? 'treeSpirit' : 'tree';
    } else if (zoneKey === 'waterfallCaveWater') {
        logicalZoneKey = 'waterfallCave';
    }
    return {
        ...location,
        logicalZoneKey,
    }
}

// Returns a name for the location that is at most 12 characters to fit in the save select screen.
export function getShortZoneName(location: ZoneLocation): string {
    const {logicalZoneKey} = getFullZoneLocation(location);
    switch (logicalZoneKey) {
        case 'ascentCaveSpirit': return 'Spirit Cave';
        case 'ascentCave': return 'Cave';
        case 'bushCave': return 'Cave';
        case 'frozenCave': return 'Cave';
        case 'treeCave': return 'Cave';
        case 'fertilityShrineSpirit': return 'SpiritShrine';
        case 'fertilityShrine': return 'Shrine';
        case 'jadePalace': return 'Jade Palace';
        case 'grandTemple': return 'Grand Temple';
        case 'peachCave': return 'Peach Cave';
        case 'peachCaveSpirit': return 'Spirit Cave';
        case 'hypeCave': return 'Spirit Cave';
        case 'bellCave': return 'Spirit Cave';
        case 'cloneCave': return 'Spirit Cave';
        case 'riverTemple': return 'Lake Ruins';
        case 'sky': return 'Sky';
        case 'spiritSky': return 'Spirit Sky';
        case 'sky': return 'in the sky';
        case 'overworld': return 'Outside';
        case 'spiritWorld': return 'Spirit World';
        case 'holyCityInterior': return 'Holy City';
        case 'jadeCityInterior': return 'Jade City';
        case 'waterfallCave': return 'Home';
        case 'treeVillage': return 'Village';
        case 'tomb': return 'Vanara Tomb';
        case 'warTemple': return 'War Temple';
        case 'cocoon': return 'Cocoon';
        case 'lakeTunnel': return 'Lake Tunnel';
        case 'helix': return 'Helix';
        case 'forestTemple': return 'F. Temple';
        case 'waterfallTower': return 'W. Tower';
        case 'forge': return 'Forge';
        case 'skyPalace': return 'Sky Palace';
        case 'crater': return 'Crater';
        case 'staffTower': return 'Staff Tower';
        case 'warPalace': return 'War Palace';
        case 'lab': return 'Hidden Lab';
        case 'tree': return 'World Tree';
        case 'treeSpirit': return 'World Tree';
        case 'void': return 'Abyss';
        case 'gauntlet': return 'Gauntlet';
        case 'holySanctum': return 'Holy Sanctum';
        case 'dream': return 'Dream';
        case 'forest': return 'Forest';
        case 'spiritForest': return 'Forest';
        case 'warPalaceWestRoom': return 'Palace';
    }
    // This should be typed as `never` by the compiler.
    logicalZoneKey;
    return '???';
}
