import {
    andLogic,
    hasBossWeapon,
    hasChakram,
    hasGloves, hasIronBoots,
    hasMediumRange, hasRoll,
    hasLightning,
    hasStaff,
    hasWeapon,
    hasWaterBlessing,
    orLogic,
} from 'app/content/logic';


// Magic is drained inside the waterfall tower unless you have the water blessing,
// So the chakram is the only useable weapon without the water blessing.
const hasWaterfallWeapon = orLogic(hasChakram, andLogic(hasWaterBlessing, hasWeapon));
const hasWaterfallBossWeapon = orLogic(hasChakram, andLogic(hasWaterBlessing, hasBossWeapon));

const zoneId = 'waterfallTower';
export const waterfallTowerNodes: LogicNode[] = [
    {
        zoneId,
        nodeId: 'waterfallTowerEntrance',
        paths: [
            {nodeId: 'waterfallTowerFirstKey', logic: andLogic(hasGloves, hasRoll)},
            {nodeId: 'waterfallTowerFirstKey', logic: hasIronBoots},
        ],
        entranceIds: ['waterfallTowerEntrance'],
        exits: [{objectId: 'waterfallTowerEntrance'}],
    },
    {
        zoneId,
        nodeId: 'waterfallTowerFirstKey',
        checks: [
            {objectId: 'waterfallTower:s0:0x1-smallKey-0'},
        ],
        paths: [
            // Key blocks aren't technically doors, but they function the same way as far as the logic is concerned.
            // There is a switch the hero must hit after the block to advance to the next section requiring medium range.
            {
                nodeId: 'waterfallTowerAfterFirstLock',
                logic: andLogic(hasGloves, orLogic(hasChakram, andLogic(hasWaterBlessing, hasMediumRange))),
                doorId: 'waterfallTowerKeyBlock'
            },
            // Can just walk through the flows if you posess iron boots.
            {nodeId: 'waterfallTowerAfterFirstLock', logic: hasIronBoots},

        ],
    },
    {
        zoneId,
        nodeId: 'waterfallTowerAfterFirstLock',
        paths: [
            // Must have a weapon to defeat the crystal guardian in order to hit the switch to advance.
            {nodeId: 'waterfallTowerAfterGuardian', logic: hasWaterfallWeapon},
            // Lightning can be used to turn off the waterfall blocking the entrance to the top of the tower,
            // which gives easy access to all three of these areas and the back.
            {nodeId: 'waterfallTowerAfterGuardian', logic: orLogic(andLogic(hasWaterBlessing, hasRoll), hasIronBoots, hasLightning)},
            // You can run up the center with the iron boots to reach the big key area directly.
            {nodeId: 'waterfallTowerBigKey', logic: orLogic(andLogic(hasWaterBlessing, hasRoll), hasIronBoots, hasLightning)},
            // Just cross the middle stream to reach the big chest area with iron boots or roll across with water blessing.
            {nodeId: 'waterfallTowerBigChest', logic: orLogic(andLogic(hasWaterBlessing, hasRoll), hasIronBoots, hasLightning)},
        ],
        entranceIds: ['waterfallTower-backEntrance'],
        exits: [{objectId: 'waterfallTower-backEntrance', logic: orLogic(hasIronBoots, hasLightning)}],
    },
    {
        zoneId,
        nodeId: 'waterfallTowerAfterGuardian',
        checks: [
            // This is obtainable without iron boots, but it is annoying, so setting iron boots as the default logic.
            {objectId: 'waterfallTower:s0:0x0-money-0', logic: hasIronBoots},
        ],
        paths: [
            // Stones block the path to the big key area.
            {nodeId: 'waterfallTowerBeforeRustySwitch', logic: hasGloves},
        ],
    },
    {
        zoneId,
        nodeId: 'waterfallTowerBeforeRustySwitch',
        // Just jump off the ledge to reach the nextarea.
        paths: [
            // Key blocks aren't technically doors, but they function the same way as far as the logic is concerned.
            // There is a switch the hero must hit after the block to advance to the next section requiring medium range.
            {
                nodeId: 'waterfallTowerBehindBigKeyBlock',
                // Either you need to walk across with iron boots or use roll/staff to cross the water with the water blessing.
                logic: orLogic(hasIronBoots, andLogic(hasWaterBlessing, hasRoll), andLogic(hasWaterBlessing, hasStaff)),
                doorId: 'waterfallTowerBigKeyBlock'
            },
            {nodeId: 'waterfallTowerBeforeSecondGuardian'},
        ],
    },
    {
        zoneId,
        nodeId: 'waterfallTowerBehindBigKeyBlock',
        checks: [{objectId: 'waterfallTower:s0:0x0-peachOfImmortalityPiece-0'}],
    },
    {
        zoneId,
        nodeId: 'waterfallTowerBeforeSecondGuardian',
        // You have to defeat the crystal guardian to reach the big key from here.
        paths: [{nodeId: 'waterfallTowerBigKey', logic: hasWaterfallWeapon}],
    },
    {
        zoneId,
        nodeId: 'waterfallTowerBigKey',
        checks: [{objectId: 'waterfallTower:s0:0x0-bigKey-0'}],
    },
    {
        zoneId,
        nodeId: 'waterfallTowerBigChest',
        checks: [{objectId: 'waterfallTower-ironBoots'}],
    },
    {
        zoneId,
        nodeId: 'waterfallTowerBack',
        paths: [
            // Just need to defeat the floor eyes to reach the boss chamber.
            {nodeId: 'waterfallTowerBoss', logic: hasWaterfallWeapon},
        ],
        entranceIds: ['waterfallTower-backEntrance'],
        exits: [{objectId: 'waterfallTower-backEntrance'}],
    },
    {
        zoneId,
        nodeId: 'waterfallTowerBoss',
        checks: [
            {objectId: 'waterfallTowerBoss', logic: andLogic(hasWaterfallBossWeapon, hasIronBoots)},
        ],
        paths: [
            // Defeating the boss opens the door to the throne room
            {nodeId: 'waterfallTowerThroneRoom', logic: andLogic(hasWaterfallBossWeapon, hasIronBoots)},
        ],
    },
    {
        zoneId,
        nodeId: 'waterfallTowerThroneRoom',
        npcs: [
            {loot: {type: 'dialogueLoot', id: 'waterfallDragon', lootType: 'cloak'}, progressFlags: ['waterfallTowerThroneDoor']},
        ],
        paths: [
            {nodeId: 'waterfallTowerOutsideThroneRoom'},
        ],
    },
    {
        zoneId,
        nodeId: 'waterfallTowerOutsideThroneRoom',
        paths: [
            // Fall into the pit to the entrance
            {nodeId: 'waterfallTowerEntrance'},
            // There is a path to the throne room, but only after completing the dungeon.
        ],
        entranceIds: ['waterfallTowerTopEntrance'],
        exits: [{objectId: 'waterfallTowerTopEntrance'}],
    },
];
