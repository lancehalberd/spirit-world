import {
    andLogic,
    canCross4Gaps, canUseTeleporters, hasReleasedBeasts, canTravelFarUnderWater,
    hasCloudBoots, hasIronBoots, hasFire, hasGloves, hasIce, hasMitts, hasSomersault, hasTeleportation,
    hasMediumRange, hasNimbusCloud, hasSpiritSight, hasTrueSight, orLogic,
    hasInvisibility, hasLightningBlessing, hasLightning,
} from 'app/content/logic';

import { LogicNode } from 'app/types';

let zoneId = 'overworld';
export const mainOverworldNode: LogicNode = {
    zoneId,
    nodeId: 'overworldMain',
    complexNpcs: [
        {dialogueKey: 'streetVendor', optionKey: 'purchase1'},
        {dialogueKey: 'streetVendor', optionKey: 'purchase2', logic: hasReleasedBeasts},
    ],
    paths: [
        { nodeId: 'overworldMountain', logic: hasGloves },
        { nodeId: 'forestArea' },
        { nodeId: 'warTempleArea' },
        { nodeId: 'nimbusCloud', logic: hasNimbusCloud},
        { nodeId: 'overworldLakeTunnel', logic: orLogic(hasGloves, hasTeleportation) },
        // This represents moving the tower to the forest position and using cloud boots to
        // fall on the river temple roof.
        { nodeId: 'forestTowerSky', logic: andLogic({requiredFlags: ['stormBeast']})},
        { nodeId: 'underLake', logic: andLogic(canTravelFarUnderWater,
            orLogic({requiredFlags: ['frostBeast']}, hasFire)
        )},
        { nodeId: 'underCity', logic: canTravelFarUnderWater},
    ],
    entranceIds: [
        'sideArea:noToolEntrance', 'tombTeleporter',
        'lakeTunnelEntrance', 'peachCaveTopEntrance', 'peachCaveWaterEntrance',
        'staffTowerEntrance',
        'tombEntrance', 'waterfallCaveEntrance', 'grandTempleEntrance',
        'moneyMazeEntrance',
        'overworld:holyCityFoodHouse', 'overworld:holyCityBridgeHouse',
        'overworld:holyCityGardenHouse', 'overworld:holyCityClothesHouse',
        'fertilityTempleEntrance',
    ],
    exits: [
        { objectId: 'sideArea:noToolEntrance'},
        { objectId: 'elderEntrance' },
        { objectId: 'peachCaveTopEntrance' },
        { objectId: 'peachCaveWaterEntrance' },
        { objectId: 'staffTowerEntrance' },
        { objectId: 'tombEntrance', logic: hasMediumRange },
        { objectId: 'waterfallCaveEntrance' },
        { objectId: 'grandTempleEntrance', logic: hasReleasedBeasts },
        { objectId: 'moneyMazeEntrance' },
        { objectId: 'overworld:holyCityFoodHouse' },
        { objectId: 'overworld:holyCityBridgeHouse'},
        { objectId: 'overworld:holyCityGardenHouse'},
        { objectId: 'overworld:holyCityClothesHouse'},
        { objectId: 'fertilityTempleEntrance' },
    ],
};
export const overworldNodes: LogicNode[] = [
    mainOverworldNode,
    {
        zoneId,
        nodeId: 'nimbusCloud',
        paths: [
            // Holy city, Vanara village and summoner ruins are all in this node.
            { nodeId: 'overworldMain' },
            { nodeId: 'riverTempleRoof' },
            { nodeId: 'mountainAscentExit' },
            { nodeId: 'grandTemple' },
        ],
    },
    {
        zoneId,
        nodeId: 'nimbusCloudSpirit',
        paths: [
            // holy city entrance or forest temple entrance.
            { nodeId: 'mainSpiritWorld' },
            // spirit shop entrance.
            { nodeId: 'westSpiritWorld' },
            // sky city entrance (really just the main spirit sky section).
            { nodeId: 'waterfallTowerSky' },
            { nodeId: 'jadePalace' },
        ],
    },
    {
        zoneId,
        nodeId: 'overworldLakeTunnel',
        entranceIds: ['lakeTunnelEntrance'],
        paths: [
            { nodeId: 'overworldMain', logic: orLogic(hasGloves, hasTeleportation) },
        ],
        exits: [
            { objectId: 'lakeTunnelEntrance'}
        ],
    },
    {
        zoneId,
        nodeId: 'riverTempleRoof',
        entranceIds: ['riverTempleUpperEntrance'],
        exits: [
            { objectId: 'riverTempleUpperEntrance'}
        ],
    },
    {
        zoneId,
        nodeId: 'forestArea',
        paths: [
            { nodeId: 'overworldMain' },
        ],
        entranceIds: [
            'elderEntrance',
            'northwestTreeEntrance',
            'northeastTreeEntrance',
            'southeastTreeEntrance',
        ],
        exits: [
            { objectId: 'elderEntrance' },
            { objectId: 'northwestTreeEntrance' },
            { objectId: 'northeastTreeEntrance' },
            { objectId: 'southeastTreeEntrance' },
            { objectId: 'treeVillageStoragePit' },
        ],
    },
    {
        zoneId,
        nodeId: 'warTempleArea',
        paths: [
            { nodeId: 'overworldMain' },
        ],
        entranceIds: [
            'warTempleChestEntrance',
            'warTempleEastEntrance',
            'warTempleEntrance',
            'warTempleNortheastEntrance',
            'warTempleNorthEntrance',
            'warTemplePeachEntrance',
            'warTempleKeyDoor',
        ],
        exits: [
            { objectId: 'warTempleChestEntrance' },
            { objectId: 'warTempleEastEntrance', logic: hasGloves },
            { objectId: 'warTempleEntrance', logic: orLogic(hasSpiritSight, hasTrueSight) },
            { objectId: 'warTempleNortheastEntrance' },
            { objectId: 'warTempleNorthEntrance' },
            { objectId: 'warTemplePeachEntrance', logic: hasGloves },
            { objectId: 'warTempleKeyDoor', logic: {requiredFlags: ['warTempleKeyDoor']} },
        ],
    },
    {
        zoneId,
        nodeId: 'overworldMountain',
        checks: [
            { objectId: 'overworldCliffPeachPiece' },
            { objectId: 'cityCliffMoney' },
        ],
        paths: [
            { nodeId: 'overworldMain' },
            { nodeId: 'overworldWaterfall', logic: orLogic(hasSomersault, hasTeleportation, hasMitts) },
            { nodeId: 'overworldMountainWater', logic: hasIronBoots },
        ],
        entranceIds: ['caves-ascentEntrance'],
        exits: [{objectId: 'caves-ascentEntrance' }],
    },
    {
        zoneId,
        nodeId: 'overworldWaterfall',
        paths: [
            { nodeId: 'overworldMountain', logic: orLogic(hasSomersault, hasTeleportation, hasIronBoots, hasMitts) },
        ],
        entranceIds: ['waterfallTowerEntrance'],
        exits: [{ objectId: 'waterfallTowerEntrance' }],
    },
    {
        zoneId,
        nodeId: 'overworldLakePiece',
        paths: [{nodeId: 'overworldMain'}],
        checks: [
            { objectId: 'overworldLakePiece' },
        ],
    },
    {
        zoneId,
        nodeId: 'mainSpiritWorld',
        checks: [],
        paths: [
            { nodeId: 'spiritWorldMountain', logic: hasGloves },
            { nodeId: 'westSpiritWorld', logic: hasCloudBoots },
            { nodeId: 'overworldLakePiece', logic: canUseTeleporters },
            { nodeId: 'nimbusCloudSpirit', logic: hasNimbusCloud},
            { nodeId: 'warTempleSpiritArea', logic: hasMitts },
        ],
        entranceIds: [
            'fertilityTempleSpiritEntrance', 'staffTowerSpiritEntrance', 'jadePalaceEntrance', 'jadeCitySoutheastDoor',
            'cloneCaveEntrance', 'cloneCaveExit',
            ],
        exits: [
            { objectId: 'jadePalaceEntrance' },
            { objectId: 'jadeCitySoutheastDoor' },
            { objectId: 'fertilityTempleSpiritEntrance' },
            { objectId: 'staffTowerSpiritEntrance', logic: {requiredFlags: ['staffTowerSpiritEntrance']} },
            { objectId: 'cloneCaveExit' },
        ],
    },
    {
        zoneId,
        nodeId: 'westSpiritWorld',
        checks: [
            { objectId: 'spiritShopSilver' },
            { objectId: 'spiritShopPeach' },
            { objectId: 'spiritShopLightningBlessing' },
        ],
        paths: [
            { nodeId: 'overworldMain', logic: canUseTeleporters },
            { nodeId: 'mainSpiritWorld', logic: hasCloudBoots },
            { nodeId: 'nimbusCloudSpirit', logic: hasNimbusCloud},
        ],
    },
    {
        zoneId,
        nodeId: 'spiritWorldMountain',
        exits: [{ objectId: 'cloneCaveEntrance' }, { objectId: 'bellCaveEntrance' }],
        entranceIds: ['bellCaveEntrance'],
        paths: [
            { nodeId: 'mainSpiritWorld' },
            { nodeId: 'westSpiritWorldMountain', logic: orLogic(hasSomersault, hasTeleportation) },
            { nodeId: 'nimbusCloudSpirit', logic: hasNimbusCloud},
        ],
    },
    {
        zoneId,
        nodeId: 'westSpiritWorldMountain',
        paths: [
            { nodeId: 'westSpiritWorld' },
            { nodeId: 'spiritWorldMountain', logic: orLogic(hasSomersault, hasTeleportation) },
            { nodeId: 'nimbusCloudSpirit', logic: hasNimbusCloud},
        ],
        entranceIds: ['caves-ascentEntranceSpirit'],
        exits: [{ objectId: 'caves-ascentEntranceSpirit' }],
    },
    {
        zoneId,
        nodeId: 'warTempleSpiritArea',
        paths: [
            { nodeId: 'mainSpiritWorld', logic: hasMitts },
        ],
        entranceIds: [
            'warTempleEntranceSpirit',
        ],
        exits: [
            { objectId: 'warTempleEntranceSpirit' },
        ],
    },
    {
        zoneId,
        nodeId: 'forestTempleSEArea',
        paths: [
            { nodeId: 'forestTempleSWArea', logic: orLogic(hasCloudBoots, hasIce) },
            { nodeId: 'forestTempleNEArea', logic: orLogic(hasCloudBoots, hasIce) },
            { nodeId: 'forestTempleNWArea', logic: orLogic(hasCloudBoots, hasIce) },
        ],
        entranceIds: ['forestTempleLadder1', 'fertilityTempleExit'],
        exits: [{ objectId: 'forestTempleLadder1' }, { objectId: 'fertilityTempleExit' }],
    },
    {
        zoneId,
        nodeId: 'forestTempleNEArea',
        entranceIds: ['forestTempleLadder2', 'forestTempleLadder3'],
        exits: [{ objectId: 'forestTempleLadder2' }, { objectId: 'forestTempleLadder3' }],
    },
    {
        zoneId,
        nodeId: 'forestTempleNWArea',
        entranceIds: ['forestTempleLadder4', 'forestTempleLadder5'],
        exits: [{ objectId: 'forestTempleLadder4' }, { objectId: 'forestTempleLadder5' }],
    },
    {
        zoneId,
        nodeId: 'forestTempleSWArea',
        entranceIds: ['elderSpiritEntrance'],
        exits: [{ objectId: 'elderSpiritEntrance' }],
    },
];

zoneId = 'underwater';
export const underwaterNodes: LogicNode[] = [
    {
        zoneId,
        nodeId: 'underLake',
        paths: [
            {nodeId: 'overworldMain', logic: {requiredFlags: ['frostBeast']}},
        ],
        entranceIds: [
            'peachCaveUnderwaterEntrance', 'riverTempleWaterEntrance',
        ],
        exits: [
            { objectId: 'peachCaveUnderwaterEntrance', logic: canTravelFarUnderWater  },
            { objectId: 'riverTempleWaterEntrance', logic: canTravelFarUnderWater  },
        ],
    },
    {
        zoneId,
        nodeId: 'overworldMountainWater',
        paths: [
            {nodeId: 'overworldMain', logic: hasIronBoots},
            {nodeId: 'overworldWaterfall', logic: hasIronBoots},
        ],
        exits: [
            { objectId: 'waterfallCavePitEntrance', logic: hasIronBoots  },
        ],
    },
    {
        zoneId,
        nodeId: 'underCity',
        checks: [{objectId: 'underwaterMoney'}],
        paths: [{nodeId: 'overworldMain'}],
        entranceIds: [
            'gauntletWaterEntrance',
        ],
        exits: [
            { objectId: 'gauntletWaterEntrance', logic: canTravelFarUnderWater  },
        ],
    },
];

zoneId = 'sky';
export const skyNodes: LogicNode[] = [
    {
        zoneId,
        nodeId: 'mountainAscentExit',
        paths: [
            { nodeId: 'outsideCrater' },
        ],
        entranceIds: ['caves-ascentExit'],
        exits: [
            { objectId: 'caves-ascentExit'}
        ],
    },
    {
        zoneId,
        nodeId: 'mainCloudPath',
        paths: [
            { nodeId: 'outsideCrater', logic: hasCloudBoots },
            { nodeId: 'outsideHelix', logic: hasCloudBoots },
            { nodeId: 'skyTreasure', logic: hasCloudBoots },
            { nodeId: 'desertTowerSky', logic: hasCloudBoots },
        ],
    },
    {
        zoneId,
        nodeId: 'outsideCrater',
        paths: [
            { nodeId: 'overworldMountain' },
            { nodeId: 'mainCloudPath', logic: hasCloudBoots },
            // Jump down on the far right.
            { nodeId: 'overworldWaterfall'},
        ],
        entranceIds: ['craterEntrance'],
        exits: [
            { objectId: 'craterEntrance', logic: hasReleasedBeasts },
        ],
    },
    {
        zoneId,
        nodeId: 'skyTreasure',
        paths: [
            { nodeId: 'mainCloudPath', logic: hasCloudBoots },
        ],
        checks: [{ objectId: 'skyMoney'}],
        entranceIds: ['craterSecretEntrance'],
        exits: [{ objectId: 'craterSecretEntrance' }],
    },
    {
        zoneId,
        nodeId: 'outsideHelix',
        paths: [
            { nodeId: 'mainCloudPath', logic: hasCloudBoots },
        ],
        entranceIds: ['helixSkyEntrance'],
        exits: [
            { objectId: 'helixSkyEntrance' },
        ],
    },
    {
        zoneId,
        nodeId: 'desertTowerSky',
        paths: [
            { nodeId: 'mainCloudPath', logic: hasCloudBoots },
        ],
        entranceIds: ['staffTowerSkyEntrance'],
        exits: [
            { objectId: 'staffTowerSkyEntrance', logic: {requiredFlags: ['staffTowerSkyEntrance']} },
        ],
    },
    {
        zoneId,
        nodeId: 'forestTowerSky',
        // This is the tower node in the sky over the forest. You can walk over a cloud to reach the small
        // section above the lake temple.
        paths: [{ nodeId: 'skyOverLakeTemple', logic: andLogic({requiredFlags: ['stormBeast']}, hasCloudBoots)}],
    },
    {
        zoneId,
        nodeId: 'skyOverLakeTemple',
        paths: [
            { nodeId: 'riverTempleRoof' },
            { nodeId: 'forestTowerSky', logic: andLogic({requiredFlags: ['stormBeast']}, hasCloudBoots) },
        ],
    },
    // Spirit sky nodes
    {
        zoneId,
        nodeId: 'mountainAscentSpiritExit',
        paths: [
            { nodeId: 'outsideForge' },
        ],
        entranceIds: ['caves-ascentExitSpirit'],
        exits: [
            { objectId: 'caves-ascentExitSpirit'}
        ],
    },
    {
        zoneId,
        nodeId: 'outsideForge',
        paths: [
            { nodeId: 'westSpiritWorldMountain' },
            { nodeId: 'waterfallTowerSky'},
            { nodeId: 'skyPalaceCourtyard'},
        ],
        entranceIds: ['caves-ascentExitSpirit', 'forgeEntrance'],
        exits: [
            { objectId: 'forgeEntrance' },
        ],
    },
    {
        zoneId,
        nodeId: 'waterfallTowerSky',
        paths: [
            { nodeId: 'outsideForge' },
            { nodeId: 'spiritWorldMountain' },
            { nodeId: 'outsideSkyPalaceHole', logic: orLogic(hasCloudBoots, canCross4Gaps) },
            { nodeId: 'nimbusCloudSpirit', logic: hasNimbusCloud},
            // Most of the forest temple areas can be accessed by falling in the right place
            { nodeId: 'forestTempleNEArea'},
            { nodeId: 'forestTempleSEArea'},
            { nodeId: 'forestTempleSWArea'},
            { nodeId: 'mainSpiritWorld'},
            { nodeId: 'westSpiritWorld'},
            { nodeId: 'westSpiritWorldMountain' },
            { nodeId: 'spiritWorldMountain' },
            { nodeId: 'desertTowerSkySpirit' },
            { nodeId: 'skyPalaceCourtyard', logic: orLogic(hasInvisibility, hasLightningBlessing, hasLightning)}
        ],
        entranceIds: ['waterfallTowerTopEntrance'],
        exits: [{ objectId: 'waterfallTowerTopEntrance' }],
    },
    {
        zoneId,
        nodeId: 'outsideSkyPalaceHole',
        paths: [
            { nodeId: 'waterfallTowerSky', logic: orLogic(hasCloudBoots, canCross4Gaps) },
        ],
        exits: [{ objectId: 'skyPalacePitEntrance', logic: hasMitts}],
    },
    {
        zoneId,
        nodeId: 'skyPalaceCourtyard',
        paths: [
            { nodeId: 'waterfallTowerSky', logic: orLogic(hasInvisibility, hasLightningBlessing, hasLightning) },
            { nodeId: 'skyOverLakeTemple', logic: canUseTeleporters }
        ],
        exits: [{ objectId: 'skyPalaceSecretEntrance'}, { objectId: 'skyPalaceEntrance'}, {objectId: 'helixSkySpiritEntrance'}],
        entranceIds: ['skyPalaceSecretEntrance', 'skyPalaceEntrance', 'helixSkySpiritEntrance']
    },
    {
        zoneId,
        nodeId: 'skyPalaceWalkway',
        paths: [{ nodeId: 'skyPalaceCourtyard'}],
        exits: [{ objectId: 'skyPalaceWestEntrance'}, { objectId: 'skyPalaceTowerEntrance'}, { objectId: 'skyPalaceEastEntrance'}],
        entranceIds: ['skyPalaceWestEntrance', 'skyPalaceTowerEntrance', 'skyPalaceEastEntrance'],
    },
    {
        zoneId,
        nodeId: 'desertTowerSkySpirit',
        paths: [
            { nodeId: 'waterfallTowerSky' },
        ],
        entranceIds: ['staffTowerSpiritSkyEntrance', 'hypeCaveEntranceSpirit'],
        exits: [
            { objectId: 'staffTowerSpiritSkyEntrance' },
            { objectId: 'hypeCaveEntranceSpirit' },
        ],
    },
];
