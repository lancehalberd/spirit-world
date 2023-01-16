import {
    andLogic,
    canCross6Gaps,
    hasAstralProjection,
    hasSomersault,
    hasSpiritSight,
    hasTeleportation,
    orLogic,
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
            {objectId: 'helixStairs2', logic: orLogic(hasTeleportation,
                // The pot puzzle can be passed by moving pots with astral projection
                // then teleporting across with the somersault.
                andLogic(hasAstralProjection, hasSomersault)
            )}
        ],
    },
    {
        zoneId,
        nodeId: 'helix3',
        checks: [],
        entranceIds: ['helixStairs2'],
        exits: [
            {objectId: 'helixStairs2'},
            {objectId: 'helix:2:0x0-pitEntrance-0', logic: orLogic(hasTeleportation,
                // astral projection is required to lift bushes/move pots.
                andLogic(hasAstralProjection, hasSomersault)
            )}
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
            {nodeId: 'helixEntranceSpiritPortal', logic: hasSpiritSight}
        ],
    },
    {
        zoneId,
        nodeId: 'helixEntranceSpiritPortal',
        paths: [
            {nodeId: 'helixEntrance', logic: hasSpiritSight},
            {nodeId: 'helixEntranceSpirit', logic: canCross6Gaps}
        ],
    },
    {
        zoneId,
        nodeId: 'helixEntranceSpirit',
        paths: [{nodeId: 'helixEntranceSpiritPortal', logic: canCross6Gaps}],
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
            {objectId: 'helixSpiritDoor1', logic: orLogic(hasTeleportation, hasSomersault)},
            {objectId: 'helixSpiritDoor2', logic: orLogic(hasTeleportation, hasSomersault)},
        ],
    },
    {
        zoneId,
        nodeId: 'helix3Spirit',
        entranceIds: ['helixSpiritDoor2'],
        exits: [
            {objectId: 'helixSpiritDoor2', logic: orLogic(hasTeleportation,
                // astral projection is required to lift bushes/move pots.
                andLogic(hasAstralProjection, hasSomersault)
            )},
        ],
        paths: [{nodeId: 'helix4Spirit', logic: orLogic(hasTeleportation, hasSomersault)}],
    },
    {
        zoneId,
        nodeId: 'helix4Spirit',
        npcs: [
            {
                loot: {type: 'dialogueLoot', id: 'helix:s3:0x0-npc-0', lootType: 'weapon'},
                progressFlags: ['elementalBeastsEscaped']
            },
        ],
        paths: [{nodeId: 'helix4', logic: hasSpiritSight}, {nodeId: 'helix3Spirit'}],
    },
    {
        zoneId,
        nodeId: 'helix4',
        paths: [{nodeId: 'helix4Spirit', logic: hasSpiritSight}],
        entranceIds: ['helixSkyEntrance'],
        exits: [
            {objectId: 'helixSkyEntrance'},
        ],
    },
];
