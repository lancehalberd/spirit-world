import { zones } from 'app/content/zones/zoneHash';

import { Zone } from 'app/types';

// Every zone needs to be imported here in order to be added to the zones hash.
export * from 'app/content/zones/zoneHash';
export * from 'app/content/zones/sky';
export * from 'app/content/zones/overworld';
export * from 'app/content/zones/underwater';
export * from 'app/content/zones/newPeachCave';
export * from 'app/content/zones/peachCaveWater';
export * from 'app/content/zones/peachCave';
export * from 'app/content/zones/tomb';
export * from 'app/content/zones/treeVillage';
export * from 'app/content/zones/warTemple';
export * from 'app/content/zones/cocoon';
export * from 'app/content/zones/lakeTunnel';
export * from 'app/content/zones/helix';
export * from 'app/content/zones/waterfallCave';
export * from 'app/content/zones/waterfallTower';
export * from 'app/content/zones/riverTemple';
export * from 'app/content/zones/riverTempleWater';
export * from 'app/content/zones/holyCityInterior';
// grand temple
// jade palace
// forge
// waterfall tower
// forest temple
// cloud temple
// crater
// river temple
// staff tower
// warship
export * from 'app/content/zones/demo/bow';
export * from 'app/content/zones/demo/clone';
export * from 'app/content/zones/demo/entrance';
export * from 'app/content/zones/demo/gloves';
export * from 'app/content/zones/demo/sight';

export function getZone(zoneKey: string): Zone {
    return zones[zoneKey];
}
