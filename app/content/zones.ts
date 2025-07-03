import { zones } from 'app/content/zones/zoneHash';

// Every zone needs to be imported here in order to be added to the zones hash.
export * from 'app/content/zones/zoneHash';
export * from 'app/content/zones/sky';
export * from 'app/content/zones/overworld';
export * from 'app/content/zones/underwater';
export * from 'app/content/zones/caves';
export * from 'app/content/zones/frozenCave';
export * from 'app/content/zones/hypeCave';
export * from 'app/content/zones/bellCave';
export * from 'app/content/zones/treeCave';
export * from 'app/content/zones/holyCityInterior';
export * from 'app/content/zones/grandTemple';
export * from 'app/content/zones/waterfallCave';
export * from 'app/content/zones/waterfallCaveWater';
export * from 'app/content/zones/treeVillage';
export * from 'app/content/zones/dream';
export * from 'app/content/zones/cloneCave';
export * from 'app/content/zones/peachCave';
export * from 'app/content/zones/peachCaveWater';
export * from 'app/content/zones/tomb';
export * from 'app/content/zones/warTemple';
export * from 'app/content/zones/cocoon';
export * from 'app/content/zones/lakeTunnel';
export * from 'app/content/zones/helix';
export * from 'app/content/zones/forestTemple';
export * from 'app/content/zones/gauntlet';
export * from 'app/content/zones/gauntletWater';
export * from 'app/content/zones/waterfallTower';
export * from 'app/content/zones/forge';
export * from 'app/content/zones/skyPalace';
export * from 'app/content/zones/holySanctum';
export * from 'app/content/zones/fireSanctum';
export * from 'app/content/zones/lightningSanctum';
export * from 'app/content/zones/iceSanctum';
export * from 'app/content/zones/holySanctumBack';
// jade palace
export * from 'app/content/zones/riverTemple';
export * from 'app/content/zones/riverTempleWater';
export * from 'app/content/zones/crater';
export * from 'app/content/zones/staffTower';
export * from 'app/content/zones/lab';
export * from 'app/content/zones/tree';
export * from 'app/content/zones/void';
// debugging zones
export * from 'app/content/zones/tileMapping';
// minimizer zones
export * from 'app/content/zones/minimizer/light1';
// title screen zone
export * from 'app/content/zones/title';
export * from 'app/content/zones/title-noBottomWall';
// WIP zones
export * from 'app/content/zones/dream';
export * from 'app/content/zones/fertility';
export * from 'app/content/zones/delve';

export function getZone(zoneKey: string): Zone {
    if (!zones[zoneKey]) {
        console.error('Missing zone: ', zoneKey);
    }
    return zones[zoneKey];
}
