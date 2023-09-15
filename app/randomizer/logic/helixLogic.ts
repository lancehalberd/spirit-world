import {
    andLogic,
    canCross6Gaps,
    hasGloves,
    hasStaff,
    canRemoveLightStones,
    hasMediumRange,
    hasFire,
    hasSomersault,
    canUseTeleporters,
    hasTeleportation,
    hasWeapon,
    orLogic,
} from 'app/content/logic';


// This logic does not appropriately support traversing the tower in reverse.
const zoneId = 'helix';
export const helixNodes: LogicNode[] = [
    {
        zoneId,
        nodeId: 'helix1',
        checks: [{objectId: 'helixBigChest'}],
        paths: [
            // You must stand on the staff while picking up stones to reach the portal to the spirit world.
            {nodeId: 'spiritHelix1', logic: andLogic(canUseTeleporters, hasStaff, hasGloves)},
        ],
        entranceIds: ['helixEntrance', 'helixStairs1'],
        exits: [
            {objectId: 'helixEntrance'},
            {objectId: 'helixStairs1'},
        ],
    },
    {
        zoneId,
        nodeId: 'helix2Stairs',
        paths: [
            {nodeId: 'helix2Ladder', logic: andLogic(hasTeleportation, canRemoveLightStones, hasGloves)},
        ],
        entranceIds: ['helixStairs1'],
        exits: [
            {objectId: 'helixStairs1'},
        ],
    },
    {
        zoneId,
        nodeId: 'helix2Ladder',
        paths: [
            {nodeId: 'helix2Stairs', logic: andLogic(hasTeleportation, canRemoveLightStones, hasGloves)},
        ],
        entranceIds: ['helixLadder'],
        exits: [
            {objectId: 'helixLadder'},
        ],
    },
    {
        zoneId,
        nodeId: 'helix3',
        checks: [],
        entranceIds: ['helixLadder'],
        exits: [
            {objectId: 'helixLadder'},
            {objectId: 'helixPitEntrance', logic: andLogic(canRemoveLightStones, orLogic(hasSomersault, hasTeleportation))}
        ],
    },
    {
        zoneId,
        nodeId: 'helixBigKey',
        checks: [{objectId: 'helixBigKey'}],
        entranceIds: ['helixMarker'],
        paths: [{nodeId: 'helix1'}],
    },
    {
        zoneId,
        nodeId: 'spiritHelix1',
        checks: [{objectId: 'helixMap', logic: hasWeapon}],
        paths: [
            {nodeId: 'helix1', logic: andLogic(canCross6Gaps, canRemoveLightStones)},
        ],
        entranceIds: ['helixSpiritDoor1'],
        exits: [
            {objectId: 'helixSpiritDoor1'},
        ],
    },
    {
        zoneId,
        nodeId: 'spiritHelix2',
        checks: [{objectId: 'helixBigMoney', logic: hasStaff}],
        entranceIds: ['helixSpiritDoor1', 'helixSpiritLadder'],
        exits: [
            {objectId: 'helixSpiritDoor1', logic: hasStaff},
            {objectId: 'helixSpiritLadder', logic: hasStaff},
        ],
    },
    {
        zoneId,
        nodeId: 'spiritHelix3',
        checks: [{objectId: 'helixSmallMoney', logic: orLogic(hasMediumRange, hasFire)}],
        entranceIds: ['helixSpiritLadder'],
        exits: [
            {objectId: 'helixSpiritLadder'},
            {objectId: 'helixSpiritPitEntrance', logic: andLogic(hasWeapon, canRemoveLightStones)},
        ],
    },
    {
        zoneId,
        nodeId: 'spiritHelixPortalToBridge',
        paths: [{nodeId: 'spiritHelix1'}],
        entranceIds: ['helixSpiritMarker', 'helixBridgeTeleporter'],
        exits: [
            {objectId: 'helixBridgeTeleporter', logic: canUseTeleporters},
        ],
    },
    {
        zoneId,
        nodeId: 'spiritHelixBridge',
        npcs: [
            {
                loot: {type: 'dialogueLoot', id: 'helixVanaraCommander', lootType: 'weapon'},
                progressFlags: ['elementalBeastsEscaped']
            },
        ],
        paths: [{nodeId: 'helixBridge', logic: canUseTeleporters}],
        entranceIds: ['helixBridgeTeleporter', 'helixSkySpiritEntrance'],
        exits: [
            {objectId: 'helixBridgeTeleporter'},
            {objectId: 'helixSkySpiritEntrance'},
        ],
    },
    {
        zoneId,
        nodeId: 'helixBridge',
        checks: [{objectId: 'helixSilver'}],
        paths: [{nodeId: 'spiritHelixBridge', logic: canUseTeleporters}],
        entranceIds: ['helixSkyEntrance'],
        exits: [
            {objectId: 'helixSkyEntrance'},
        ],
    },
];
