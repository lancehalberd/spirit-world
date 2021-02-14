import { zones } from 'app/content/zones/zoneHash';

import { Zone } from 'app/types';

export * from 'app/content/zones/zoneHash';
// Every zone needs to be imported here in order to be added to the zones hash.
export * from 'app/content/zones/peachCave';
export * from 'app/content/zones/overworld';
export * from 'app/content/zones/demo/clone';
export * from 'app/content/zones/demo/entrance';
export * from 'app/content/zones/demo/gloves';
export * from 'app/content/zones/demo/sight';

export function getZone(zoneKey: string): Zone {
    return zones[zoneKey];
}
