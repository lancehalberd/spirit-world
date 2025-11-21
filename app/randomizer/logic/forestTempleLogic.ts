import {
    andLogic,
    hasBossWeapon,
    hasBow,
    hasCloudBoots, hasIce, hasLongSomersault,
    canAvoidBossAttacks,
    orLogic,
} from 'app/content/logic';

const canPassLongCrumbleFloors = orLogic(hasCloudBoots, hasIce, hasLongSomersault);

// This logic does not appropriately support traversing the tower in reverse.
const zoneId = 'forestTemple';
export const forestTempleNodes: LogicNode[] = [
    {
        zoneId,
        nodeId: 'forestTempleEntranceSpirit',
        entranceIds: ['forestTempleEntranceSpirit', 'forestTempleEastTreeEntrance'],
        exits: [
            {objectId: 'forestTempleEntranceSpirit'},
            {objectId: 'forestTempleEastTreeEntrance'},
        ],
    },
    {
        zoneId,
        nodeId: 'forestTemple1BeforeLock',
        checks: [
            {objectId: 'forestTempleSmallKey1', logic: hasBow},
            {objectId: 'forestTempleSilver'},
            {objectId: 'forestTempleSmallMoney'},
        ],
        paths: [
            {nodeId: 'forestTemple1AfterLock', doorId: 'forestTempleLock1', logic: hasBossWeapon},
        ],
        entranceIds: ['forestTempleSoutheastLadder'],
        exits: [
            {objectId: 'forestTempleSoutheastLadder'},
        ],
    },
    {
        zoneId,
        nodeId: 'forestTemple1AfterLock',
        checks: [],
        paths: [
            {nodeId: 'forestTemple1BeforeLock', doorId: 'forestTempleLock1', logic: hasBossWeapon},
        ],
        entranceIds: ['forestTempleNortheastTreeEntance'],
        exits: [
            {objectId: 'forestTempleNortheastTreeEntance'}
        ],
    },
    {
        zoneId,
        nodeId: 'forestTempleDeadEnd',
        entranceIds: ['forestTempleNortheastCaveEntrance'],
        exits: [{objectId: 'forestTempleNortheastCaveEntrance'}],
    },
    {
        zoneId,
        nodeId: 'forestTemple2BeforeLock',
        checks: [
            {objectId: 'forestTempleSmallKey2'},
            {objectId: 'forestTempleMap'},
        ],
        paths: [
            {nodeId: 'forestTemple2AfterLock', doorId: 'forestTempleLock2'},
        ],
        entranceIds: [],
        exits: [{objectId: 'forestTempleNortheastCaveEntrance'}],
    },
    {
        zoneId,
        nodeId: 'forestTemple2AfterLock',
        paths: [
            {nodeId: 'forestTemple2BeforeLock', doorId: 'forestTempleLock2'},
        ],
        entranceIds: ['forestTempleNorthLadder'],
        exits: [{objectId: 'forestTempleNorthLadder'}],
    },
    {
        zoneId,
        nodeId: 'forestTemple3',
        checks: [],
        paths: [
            // The player can run over the crumble floors
            {nodeId: 'forestTempleBigChest', logic: canPassLongCrumbleFloors},
            // or use the big key to jump down the cliff and bypass the crumble floors.
            {nodeId: 'forestTempleBigChest', doorId: 'forestTempleBigLock'},
        ],
        entranceIds: ['forestTempleNorthwestTreeEntrance'],
        exits: [{objectId: 'forestTempleNorthwestTreeEntrance'}],
    },
    {
        zoneId,
        nodeId: 'forestTempleBigKey',
        checks: [{objectId: 'forestTempleBigKey'}],
        paths: [
            {nodeId: 'forestTemple3'},
        ],
        entranceIds: ['forestTempleBigKeyMarker'],
    },
    {
        zoneId,
        nodeId: 'forestTempleBigChest',
        checks: [
            {objectId: 'forestTempleBigChest'},
            {objectId: 'forestTempleBigMoney', logic: canPassLongCrumbleFloors},
        ],
        paths: [{nodeId: 'forestTemple3', logic: canPassLongCrumbleFloors}],
        entranceIds: [],
        exits: [],
    },
    {
        zoneId,
        nodeId: 'forestTempleSouthwest',
        paths: [{nodeId: 'forestTempleBigChest', logic: canPassLongCrumbleFloors}],
        entranceIds: ['forestTempleSouthwestCaveEntrance'],
        exits: [{objectId: 'forestTempleSouthwestCaveEntrance'}],
    },

    {
        zoneId,
        nodeId: 'forestTempleBack',
        entranceIds: ['forestTempleBackDoor'],
        paths: [{nodeId: 'forestTempleBoss', doorId: 'forestTempleBossDoor'}],
    },
    {
        zoneId,
        nodeId: 'forestTempleBoss',
        checks: [{objectId: 'forestTempleBoss', logic: andLogic(hasBossWeapon, canAvoidBossAttacks)}],
    },
];
