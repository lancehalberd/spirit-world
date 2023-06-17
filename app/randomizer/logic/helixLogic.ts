import {
    andLogic,
    canCross2Gaps,
    canCross6Gaps,
    hasAstralProjection,
    hasGloves,
    hasSomersault,
    canUseTeleporters,
    hasTeleportation,
    orLogic,
} from 'app/content/logic';


// This logic does not appropriately support traversing the tower in reverse.
const zoneId = 'helix';
export const helixNodes: LogicNode[] = [
    {
        zoneId,
        nodeId: 'helixEntrance',
        paths: [
            {nodeId: 'helixEntranceStaff', logic: andLogic(canCross6Gaps, hasGloves)},
            {nodeId: 'helixEntrancePortal', logic: andLogic(canCross6Gaps, hasGloves)},
        ],
        entranceIds: ['helixEntrance', 'helixStairs1'],
        exits: [
            {objectId: 'helixEntrance'},
            {objectId: 'helixStairs1', logic: canCross2Gaps},
        ],
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
        paths: [{nodeId: 'helixEntrance', logic: andLogic(canCross6Gaps, hasGloves)}],
    },
    {
        zoneId,
        nodeId: 'helixEntrancePortal',
        paths: [
            {nodeId: 'helixEntrance', logic: andLogic(canCross6Gaps, hasGloves)},
            {nodeId: 'helixEntranceSpiritPortal', logic: canUseTeleporters}
        ],
    },
    {
        zoneId,
        nodeId: 'helixEntranceSpiritPortal',
        paths: [
            {nodeId: 'helixEntrancePortal', logic: canUseTeleporters},
            {nodeId: 'helixEntranceSpirit', logic: andLogic(canCross6Gaps, hasGloves)}
        ],
    },
    {
        zoneId,
        nodeId: 'helixEntranceSpirit',
        paths: [{nodeId: 'helixEntranceSpiritPortal', logic: andLogic(canCross6Gaps, hasGloves)}],
        entranceIds: ['helixSpiritDoor1'],
        exits: [
            {objectId: 'helixSpiritDoor1', logic: canCross2Gaps},
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
        paths: [{nodeId: 'helix4', logic: canUseTeleporters}, {nodeId: 'helix3Spirit'}],
        entranceIds: ['helixSkySpiritEntrance'],
        exits: [
            {objectId: 'helixSkySpiritEntrance'},
        ],
    },
    {
        zoneId,
        nodeId: 'helix4',
        paths: [{nodeId: 'helix4Spirit', logic: canUseTeleporters}],
        entranceIds: ['helixSkyEntrance'],
        exits: [
            {objectId: 'helixSkyEntrance'},
        ],
    },
];
