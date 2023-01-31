import { zones } from 'app/content/zones/zoneHash';

import { Zone } from 'app/types';

// Every zone needs to be imported here in order to be added to the zones hash.
export * from 'app/content/zones/zoneHash';
export * from 'app/content/zones/sky';
export * from 'app/content/zones/overworld';
export * from 'app/content/zones/underwater';
export * from 'app/content/zones/caves';
export * from 'app/content/zones/holyCityInterior';
export * from 'app/content/zones/waterfallCave';
export * from 'app/content/zones/treeVillage';
export * from 'app/content/zones/peachCave';
export * from 'app/content/zones/peachCaveWater';
export * from 'app/content/zones/tomb';
export * from 'app/content/zones/warTemple';
export * from 'app/content/zones/cocoon';
export * from 'app/content/zones/lakeTunnel';
export * from 'app/content/zones/helix';
export * from 'app/content/zones/forestTemple';
export * from 'app/content/zones/waterfallTower';
export * from 'app/content/zones/forge';
export * from 'app/content/zones/skyPalace';
export * from 'app/content/zones/grandTemple';
export * from 'app/content/zones/grandTempleWater';
export * from 'app/content/zones/grandTemple2';
export * from 'app/content/zones/fireSanctum';
// jade palace
export * from 'app/content/zones/riverTemple';
export * from 'app/content/zones/riverTempleWater';
export * from 'app/content/zones/crater';
export * from 'app/content/zones/staffTower';
export * from 'app/content/zones/lab';
export * from 'app/content/zones/tree';
export * from 'app/content/zones/void';
// minimizer zones
export * from 'app/content/zones/minimizer/light1';

export function getZone(zoneKey: string): Zone {
    if (!zones[zoneKey]) {
        console.error('Missing zone: ', zoneKey);
    }
    return zones[zoneKey];
}
