import { zones } from 'app/content/zones/zoneHash';

import { Zone } from 'app/types';

// Every zone needs to be imported here in order to be added to the zones hash.
export * from 'app/content/zones/zoneHash';
export * from 'app/content/zones/newPeachCave';
export * from 'app/content/zones/peachCave';
export * from 'app/content/zones/overworld';
export * from 'app/content/zones/tomb';
export * from 'app/content/zones/treeVillage';
export * from 'app/content/zones/warTemple';
export * from 'app/content/zones/demo/bow';
export * from 'app/content/zones/demo/clone';
export * from 'app/content/zones/demo/entrance';
export * from 'app/content/zones/demo/gloves';
export * from 'app/content/zones/demo/sight';

export function getZone(zoneKey: string): Zone {
    return zones[zoneKey];
}
