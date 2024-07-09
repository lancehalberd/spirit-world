import {
    andLogic, canCross2Gaps, canCrossPrecise2Gaps, canHasSpikeBoots, canHasFlyingBoots, hasIronBoots, canHasTowerStaff, hasSpiritBarrier, hasClone,
    hasRangedPush, hasWeapon, hasCatEyes, hasFireBlessing, hasIce, hasInvisibility, hasLongSomersault, hasStaff,
    hasMediumRange, canRemoveHeavyStones, hasPhoenixCrown, hasSomersault, hasTeleportation,
    orLogic,
} from 'app/content/logic';

import { variantLogic } from 'app/utils/variants';


export const treeVillageNodes: LogicNode[] = [
    {
        zoneId: 'treeVillage',
        nodeId: 'elderEntrance',
        entranceIds: [
            'elderEntrance',
            'elderDownstairs',
        ],
        exits: [
            { objectId: 'elderEntrance' },
            { objectId: 'elderDownstairs' },
        ],
    },
    {
        zoneId: 'treeVillage',
        nodeId: 'elderDownstairs',
        checks: [
            { objectId: 'elderPeachPiece', logic: hasMediumRange },
            { objectId: 'treeVillageBow', logic: hasCatEyes },
        ],
        entranceIds: [
            'elderUpstairs',
        ],
        exits: [
            { objectId: 'elderUpstairs' },
        ],
    },
    {
        zoneId: 'treeVillage',
        nodeId: 'northwestTree',
        entranceIds: [
            'northwestTreeEntrance',
        ],
        exits: [
            { objectId: 'northwestTreeEntrance' },
        ],
    },
    {
        zoneId: 'treeVillage',
        nodeId: 'northeastTreeEntrance',
        entranceIds: [
            'northeastTreeEntrance',
        ],
        exits: [
            { objectId: 'northeastTreeEntrance' },
        ],
    },
    {
        zoneId: 'treeVillage',
        nodeId: 'southeastTree',
        complexNpcs: [{
            dialogueKey: 'storageVanara',
            optionKey: 'peachReward',
            logic: {requiredFlags: ['clearedTreeVillageStorageRoom']},
        }],
        entranceIds: [
            'southeastTreeEntrance',
            'vanaraStorageStairs',
        ],
        exits: [
            { objectId: 'southeastTreeEntrance' },
        ],
    },
    {
        zoneId: 'treeVillage',
        nodeId: 'treeVillageStorageRoom',
        checks: [
            {objectId: 'treeVillageMoneyA'},
            {objectId: 'treeVillageMoneyB'},
            {objectId: 'treeVillageEmptyChest'},
        ],
        flags: [{flag: 'clearedTreeVillageStorageRoom', logic: hasWeapon }],
        entranceIds: [
            'treeVillageStorageMarker',
        ],
        exits: [
            { objectId: 'vanaraStorageStairs' },
        ],
    },
    {
        zoneId: 'treeVillage',
        nodeId: 'elderSpiritEntrance',
        entranceIds: [
            'elderSpiritEntrance',
            'elderSpiritStairs',
        ],
        exits: [
            { objectId: 'elderSpiritEntrance' },
            { objectId: 'elderSpiritStairs' },
        ],
    },
    {
        zoneId: 'treeVillage',
        nodeId: 'elderSpiritDownstairs',
        entranceIds: [
            'elderSpiritStairs',
            'forestTempleBackDoor',
        ],
        exits: [
            { objectId: 'elderSpiritStairs' },
            { objectId: 'forestTempleBackDoor', logic: andLogic(hasMediumRange, canCross2Gaps) }
        ],
    },
];

export const waterfallCaveNodes: LogicNode[] = [
    {
        zoneId: 'waterfallCave',
        nodeId: 'waterfallCaveEntrance',
        entranceIds: [
            'waterfallCaveEntrance',
            'waterfallCaveLeftMain', 'waterfallCaveRightMain',
            'waterfallCaveLeft', 'waterfallCaveRight',
            'waterfallCaveBackLeft', 'waterfallCaveBackRight',
        ],
        exits: [
            { objectId: 'waterfallCaveEntrance' },
            { objectId: 'waterfallCaveLeftMain' },
            { objectId: 'waterfallCaveRightMain' },
            { objectId: 'waterfallCaveBackLeft' },
            { objectId: 'waterfallCaveBackRight' },
            { objectId: 'waterfallCaveLeft' },
            { objectId: 'waterfallCaveRight' },

        ],
    },
    {
        zoneId: 'waterfallCave',
        nodeId: 'waterfallCaveBackLeft',
        checks: [
            { objectId: 'waterfallCaveBigMoney' },
            { objectId: 'waterfallCaveLittleMoney'} ,
        ],
        entranceIds: ['waterfallCaveBackLeft'],
        exits: [{ objectId: 'waterfallCaveBackLeft' }],
    },
    {
        zoneId: 'waterfallCave',
        nodeId: 'waterfallCaveBackRight',
        entranceIds: ['waterfallCaveBackRight'],
        exits: [{ objectId: 'waterfallCaveBackRight' }],
    },
    {
        zoneId: 'waterfallCave',
        nodeId: 'waterfallCaveLeft',
        checks: [{ objectId: 'waterfallCaveEmptyChest' }],
        entranceIds: ['waterfallCaveLeft'],
        exits: [{ objectId: 'waterfallCaveLeft' }],
    },
    {
        zoneId: 'waterfallCave',
        nodeId: 'waterfallCaveRight',
        checks: [{ objectId: 'waterfallCaveBiggerMoney' }],
        entranceIds: ['waterfallCaveRight'],
        exits: [{ objectId: 'waterfallCaveRight' }],
    },
    {
        zoneId: 'waterfallCave',
        nodeId: 'waterfallCaveMain',
        entranceIds: ['waterfallCaveLeftMain', 'waterfallCaveRightMain'],
        exits: [{ objectId: 'waterfallCaveLeftMain' }, { objectId: 'waterfallCaveRightMain' }],
    },
    {
        zoneId: 'waterfallCave',
        nodeId: 'waterfallCaveTop',
        checks: [{ objectId: 'waterfallCavePeachPiece' }],
        paths: [{ nodeId:'waterfallCaveEntrance' }],
        entranceIds: ['waterfallCaveMarker'],
    }
];

// The flameBeast flag is set correctly during simulation, so this logic works as expected.
const canAscendToCrater = orLogic(canRemoveHeavyStones, hasIce, hasInvisibility, {requiredFlags: ['flameBeast']});
const canAscendToCraterSpirit = orLogic(hasInvisibility, hasFireBlessing, hasPhoenixCrown, {requiredFlags: ['flameBeast']});
export const cavesNodes: LogicNode[] = [
    // This cave connects the NW corner of the overworld to the sky and is one way.
    // It is filled with lava while the fire beast is active.
    {
        zoneId: 'caves',
        nodeId: 'noToolCave',
        checks: [
            { objectId: 'caves:0:1x0-money-0'},
        ],
        entranceIds: ['caves:noToolSideArea'],
        exits: [
            { objectId: 'caves:noToolSideArea'},
        ],
    },
    {
        zoneId: 'caves',
        nodeId: 'ascentCaveBottom',
        paths: [
            {nodeId: 'ascentCaveTop', logic: canAscendToCrater },
        ],
        entranceIds: ['caves-ascentEntrance'],
        exits: [
            { objectId: 'caves-ascentEntrance'}
        ],
    },
    {
        zoneId: 'caves',
        nodeId: 'ascentCaveTop',
        paths: [
            {nodeId: 'ascentCaveBottom', logic: canAscendToCrater },
        ],
        checks: [
            { objectId: 'caves-ascentPeachPiece', logic: canCross2Gaps},
        ],
        entranceIds: ['caves-ascentExit'],
        exits: [
            { objectId: 'caves-ascentExit' },
        ],
    },
    {
        zoneId: 'caves',
        nodeId: 'ascentCavesSpirit',
        entranceIds: ['caves-ascentEntranceSpirit', 'caves-ascentExitSpirit'],
        exits: [
            { objectId: 'caves-ascentExitSpirit', logic:canAscendToCraterSpirit },
            { objectId: 'caves-ascentEntranceSpirit'}
        ],
    },

    // Fertility Temple
    {
        zoneId: 'caves',
        nodeId: 'normalFertilityTemple',
        entranceIds: ['fertilityTempleEntrance'],
        exits: [
            { objectId: 'fertilityTempleEntrance' },
        ],
    },
    {
        zoneId: 'caves',
        nodeId: 'spiritFertilityTemple',
        entranceIds: ['fertilityTempleSpiritEntrance', 'fertilityTempleExit'],
        exits: [
            { objectId: 'fertilityTempleSpiritEntrance' },
            { objectId: 'fertilityTempleExit' },
        ],
    },

    // Lake Tunnel
    {
        zoneId: 'lakeTunnel',
        nodeId: 'lakeTunnelFront',
        paths: [{ nodeId: 'lakeTunnelBack', logic: andLogic(orLogic(hasSomersault, hasTeleportation), hasSpiritBarrier)}],
        entranceIds: ['lakeTunnelEntrance'],
        exits: [
            { objectId: 'lakeTunnelEntrance' },
        ],
    },
    {
        zoneId: 'lakeTunnel',
        nodeId: 'lakeTunnelBack',
        checks: [{objectId: 'helixRivalBoss', logic: hasSpiritBarrier}],
        paths: [{ nodeId: 'lakeTunnelFront', logic: andLogic(orLogic(hasSomersault, hasTeleportation), hasSpiritBarrier)}],
        entranceIds: ['helixEntrance'],
        exits: [
            { objectId: 'helixEntrance' },
        ],
    },

    // Tree Cave
    {
        zoneId: 'treeCave',
        nodeId: 'treeCaveFront',
        entranceIds: ['treeCaveEntrance'],
        exits: [
            { objectId: 'treeCaveEntrance' },
        ],
    },
    {
        zoneId: 'treeCave',
        nodeId: 'treeCaveFrontSpirit',
        entranceIds: ['treeCaveSpiritEntrance'],
        exits: [
            { objectId: 'treeCaveSpiritEntrance' },
        ],
    },
    {
        zoneId: 'treeCave',
        nodeId: 'treeCaveBack',
        // It is a bit tricky, but you can use clone explosion to push the rolling ball in this room.
        checks: [{objectId: 'treeCaveSilver', logic: andLogic(hasStaff, orLogic(hasRangedPush, hasClone))}],
        paths: [{ nodeId: 'treeCaveFront'}],
        entranceIds: ['treeCaveMarker'],
    },

    // Frozen Cave
    {
        zoneId: 'frozenCave',
        nodeId: 'frozenCaveFront',
        paths: [{ nodeId: 'frozenCaveBack', logic:
            orLogic(
                andLogic(orLogic(canHasSpikeBoots, hasIronBoots), canCrossPrecise2Gaps),
                canHasFlyingBoots,
                hasLongSomersault,
            )}],
        checks: [{objectId: 'frozenCaveSpikeBoots'}],
        entranceIds: ['frozenCaveEntrance'],
        exits: [
            { objectId: 'frozenCaveEntrance' },
        ],
    },
    {
        zoneId: 'frozenCave',
        nodeId: 'frozenCaveBack',
        checks: [{objectId: 'frozenCaveGold'}, {objectId: 'frozenCaveMoney'}],
    },

    // Clone Cave
    {
        zoneId: 'cloneCave',
        nodeId: 'cloneCaveEntrance',
        checks: [{objectId: 'cloneCaveMoney', logic: hasClone}],
        paths: [{ nodeId: 'cloneCaveExit'}],
        entranceIds: ['cloneCaveEntrance'],
        exits: [
            { objectId: 'cloneCaveEntrance' },
        ],
    },
    {
        zoneId: 'cloneCave',
        nodeId: 'cloneCaveExit',
        entranceIds: ['cloneCaveExit'],
        exits: [
            { objectId: 'cloneCaveExit' },
        ],
    },

    // Hype Cave
    {
        zoneId: 'hypeCave',
        nodeId: 'hypeCave',
        checks: [
            {objectId: 'hypeCaveMoney1'},
            {objectId: 'hypeCaveMoney2'},
            {objectId: 'hypeCaveMoney3'},
            {objectId: 'hypeCaveMoney4'},
            {objectId: 'hypeCavePeachPiece', logic: orLogic(hasSomersault, canHasTowerStaff)},
        ],
        entranceIds: ['hypeCaveEntranceSpirit'],
        exits: [
            { objectId: 'hypeCaveEntranceSpirit' },
        ],
    },
    {
        zoneId: 'bellCave',
        nodeId: 'bellCave',
        exits: [{ objectId: 'bellCaveEntrance' }],
        entranceIds: ['bellCaveEntrance'],
    },
];


export const holyCityNodes: LogicNode[] = [
    {
        zoneId: 'holyCityInterior',
        nodeId: 'moneyMaze',
        checks: [
            { objectId: 'moneyMazePeachPiece' },
        ],
        entranceIds: ['moneyMazeEntrance'],
        exits: [{ objectId: 'moneyMazeEntrance' }],
    },
    {
        zoneId: 'holyCityInterior',
        nodeId: 'kitchen',
        npcs: [
            {loot: {type: 'dialogueLoot', id: 'meanPerson', lootType: 'money', lootAmount: 1}},
        ],
        entranceIds: ['foodHouse'],
        exits: [{ objectId: 'foodHouse' }],
    },
    {
        zoneId: 'holyCityInterior',
        nodeId: 'bridgeHouse',
        entranceIds: ['bridgeHouse'],
        exits: [{ objectId: 'bridgeHouse'}],
    },
    {
        zoneId: 'holyCityInterior',
        nodeId: 'gardenHouse',
        complexNpcs: [
            {
                dialogueKey: 'citySmith',
                optionKey: 'citySmithReward',
                // Must fully upgrade the normal chakram and have cloud boots to obtain this reward.
                // Upgrading costs 5 silver, but you could spend an additional 7 upgrading the magic chakram and spike boots.
                logic: { requiredFlags: ['$weapon:1', '$cloudBoots', '$totalSilverOre:12']},
            },
        ],
        flags: [{flag: 'canReachCitySmith'}],
        entranceIds: ['gardenHouse'],
        exits: [{ objectId: 'gardenHouse'}],
    },
    {
        zoneId: 'holyCityInterior',
        nodeId: 'holyCityClothesHouse',
        entranceIds: ['clothesHouse'],
        exits: [{ objectId: 'clothesHouse'}],
    },

    // Jade city
    {
        zoneId: 'holyCityInterior',
        nodeId: 'jadeCityNorthwestHouse',
        entranceIds: ['jadeCityNorthwestDoor'],
        exits: [{ objectId: 'jadeCityNorthwestDoor'}],
    },
    {
        zoneId: 'holyCityInterior',
        nodeId: 'jadeCityMaze',
        paths: [{nodeId: 'jadeCityMazeSmallMoney', logic: variantLogic('jadeCityMazeBlock1')}],
        entranceIds: ['jadeCityWestDoor'],
        exits: [{ objectId: 'jadeCityWestDoor'}],
    },
    {
        zoneId: 'holyCityInterior',
        nodeId: 'jadeCityMazeSmallMoney',
        checks: [{objectId: 'jadeCityMazeSmallMoney'}],
        paths: [{nodeId: 'jadeCityMazeBack', logic: variantLogic('jadeCityMazeSwitch')}]
    },
    {
        zoneId: 'holyCityInterior',
        nodeId: 'jadeCityMazeBack',
        checks: [{objectId: 'jadeCityMazeBigMoney', logic: variantLogic('jadeCityMazeBlock2')}],
        entranceIds: ['jadeCityMazeExit'],
        exits: [{ objectId: 'jadeCityMazeExit'}],
    },
    {
        zoneId: 'holyCityInterior',
        nodeId: 'jadeCitySouthwestHouse',
        npcs: [
            {loot: {type: 'dialogueLoot', id: 'helpfulSpirit', lootType: 'money', lootAmount: 50}},
        ],
        entranceIds: ['jadeCitySouthwestDoor'],
        exits: [{ objectId: 'jadeCitySouthwestDoor'}],
    },
    {
        zoneId: 'holyCityInterior',
        nodeId: 'jadeCityNortheastHouse',
        entranceIds: ['jadeCityNortheastDoor'],
        exits: [{ objectId: 'jadeCityNortheastDoor'}],
    },
    {
        zoneId: 'holyCityInterior',
        nodeId: 'jadeCitySoutheastHouse',
        checks: [{objectId: 'jadeCityPeachPiece'}],
        entranceIds: ['jadeCitySoutheastDoor'],
        exits: [{ objectId: 'jadeCitySoutheastDoor'}],
    },
];
