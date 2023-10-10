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
        nodeId: 'forestTemple1BeforeLock',
        checks: [
            {objectId: 'forestTempleSmallKey1', logic: hasBow},
            {objectId: 'forestTempleSilver'},
            {objectId: 'forestTempleSmallMoney'},
        ],
        paths: [
            {nodeId: 'forestTemple1AfterLock', doorId: 'forestTempleLock1', logic: hasBossWeapon},
        ],
        entranceIds: ['forestTempleLadder1'],
        exits: [
            {objectId: 'forestTempleLadder1'},
        ],
    },
    {
        zoneId,
        nodeId: 'forestTemple1AfterLock',
        checks: [],
        paths: [
            {nodeId: 'forestTemple1BeforeLock', doorId: 'forestTempleLock1', logic: hasBossWeapon},
        ],
        entranceIds: ['forestTempleLadder2'],
        exits: [
            {objectId: 'forestTempleLadder2'}
        ],
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
        entranceIds: ['forestTempleLadder3'],
        exits: [{objectId: 'forestTempleLadder3'}],
    },
    {
        zoneId,
        nodeId: 'forestTemple2AfterLock',
        paths: [
            {nodeId: 'forestTemple2BeforeLock', doorId: 'forestTempleLock2'},
        ],
        entranceIds: ['forestTempleLadder4'],
        exits: [{objectId: 'forestTempleLadder4'}],
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
        entranceIds: ['forestTempleLadder5'],
        exits: [{objectId: 'forestTempleLadder5'}],
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
