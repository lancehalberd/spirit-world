import { zones } from 'app/content/zones/zoneHash';

import { Zone } from 'app/types';

export * from 'app/content/zones/zoneHash';
// Every zone needs to be imported here in order to be added to the zones hash.
export * from 'app/content/zones/peachCave';

export function getZone(zoneKey: string): Zone {
    return zones[zoneKey];
}
