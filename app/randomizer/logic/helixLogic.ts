import {
    canCross6Gaps,
    hasTeleportation,
} from 'app/content/logic';

import { LogicNode } from 'app/types';

// This logic does not appropriately support traversing the tower in reverse.
const zoneId = 'helix';
export const helixNodes: LogicNode[] = [
    {
        zoneId,
        nodeId: 'helixEntrance',
        paths: [
            {nodeId: 'helixEntranceStaff', logic: canCross6Gaps},
            {nodeId: 'helixEntrancePortal', logic: canCross6Gaps},
        ],
        entranceIds: ['helixEntrance', 'helixStairs1'],
        exits: [{objectId: 'helixEntrance'}, {objectId: 'helixStairs1'}],
    },
    {
        zoneId,
        nodeId: 'helix2',
        checks: [],
        entranceIds: ['helixStairs1', 'helixStairs2'],
        exits: [
            {objectId: 'helixStairs1'},
            {objectId: 'helixStairs2', logic: hasTeleportation}
        ],
    },
    {
        zoneId,
        nodeId: 'helix3',
        checks: [],
        entranceIds: ['helixStairs2'],
        exits: [
            {objectId: 'helixStairs2'},
            {objectId: 'helix:2:0x0-pitEntrance-0', logic: hasTeleportation}
        ],
    },
    {
        zoneId,
        nodeId: 'helixEntranceStaff',
        checks: [{objectId: 'helix:0:0x0-staff-0'}],
        entranceIds: ['helixMarker'],
        paths: [{nodeId: 'helixEntrance', logic: canCross6Gaps}],
    },
    {
        zoneId,
        nodeId: 'helixEntrancePortal',
        paths: [
            {nodeId: 'helixEntrance', logic: canCross6Gaps},
            {nodeId: 'helixEntranceSpirit'}
        ],
    },
    {
        zoneId,
        nodeId: 'helixEntranceSpirit',
        // Just jump off the ledge to reach the nextarea.
        paths: [{nodeId: 'helixEntrance', logic: canCross6Gaps}],
        entranceIds: ['helixSpiritDoor1'],
        exits: [
            {objectId: 'helixSpiritDoor1', logic: canCross6Gaps},
        ],
    },
    {
        zoneId,
        nodeId: 'helix2Spirit',
        entranceIds: ['helixSpiritDoor1', 'helixSpiritDoor2'],
        exits: [
            {objectId: 'helixSpiritDoor1'},
            {objectId: 'helixSpiritDoor2', logic: canCross6Gaps},
        ],
    },
    {
        zoneId,
        nodeId: 'helix3Spirit',
        entranceIds: ['helixSpiritDoor2'],
        exits: [
            {objectId: 'helixSpiritDoor2'},
        ],
        paths: [{nodeId: 'helix4Spirit', logic: hasTeleportation}],
    },
    {
        zoneId,
        nodeId: 'helix4Spirit',
        npcs: [
            {
                loot: {type: 'dialogueLoot', id: 'helix:s3:0x0-npc-0', lootType: 'charge'},
                progressFlags: ['elementalBeastsEscaped']
            },
        ],
        paths: [{nodeId: 'helix4'}, {nodeId: 'helix3Spirit'}],
    },
    {
        zoneId,
        nodeId: 'helix4',
        paths: [{nodeId: 'helix4Spirit'}],
        entranceIds: ['helixSkyEntrance'],
        exits: [
            {objectId: 'helixSkyEntrance'},
        ],
    },
];
