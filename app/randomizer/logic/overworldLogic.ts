import {
    andLogic,
    beastsDefeated,
    canCross2Gaps, hasGloves,
    canCross4Gaps, canUseTeleporters, hasReleasedBeasts, canTravelFarUnderWater,
    hasCloudBoots, hasIronBoots, hasFire, canRemoveHeavyStones, canRemoveLightStones,
    hasMitts, hasIce, hasSomersault, hasTeleportation,
    hasMediumRange, hasNimbusCloud, hasSpiritSight, hasStaff, hasTrueSight, orLogic,
    hasInvisibility, hasLightningBlessing, hasLightning,
} from 'app/content/logic';


let zoneId = 'overworld';
export const mainOverworldNode: LogicNode = {
    zoneId,
    nodeId: 'overworldMain',
    complexNpcs: [
        {dialogueKey: 'streetVendor', optionKey: 'purchase1'},
        {dialogueKey: 'streetVendor', optionKey: 'purchase2', logic: hasReleasedBeasts},
        {dialogueKey: 'streetVendor', optionKey: 'purchase3', logic: beastsDefeated},
    ],
    paths: [
        { nodeId: 'overworldMountain', logic: canRemoveLightStones },
        { nodeId: 'forestArea' },
        { nodeId: 'warTempleArea' },
        { nodeId: 'nimbusCloud', logic: hasNimbusCloud},
        { nodeId: 'overworldLakeTunnel', logic: orLogic(canRemoveLightStones, hasTeleportation) },
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
        'peachCaveTopEntrance', 'peachCaveWaterEntrance',
        'staffTowerEntrance',
        'treeCaveEntrance',
        'tombEntrance', 'waterfallCaveEntrance', 'grandTempleEntrance',
        'moneyMazeEntrance',
        'overworld:holyCityFoodHouse', 'overworld:holyCityBridgeHouse',
        'overworld:holyCityGardenHouse', 'overworld:holyCityClothesHouse',
        'fertilityTempleEntrance',
        'frozenCaveEntrance',
    ],
    exits: [
        {objectId: 'sideArea:noToolEntrance'},
        {objectId: 'elderEntrance'},
        {objectId: 'peachCaveTopEntrance'},
        // This entrance becomes frozen while the frost beast is active.
        {objectId: 'peachCaveWaterEntrance', logic: orLogic({requiredFlags: ['frostBeast']}, hasFire)},
        {objectId: 'staffTowerEntrance'},
        {objectId: 'tombEntrance', logic: hasMediumRange},
        {objectId: 'waterfallCaveEntrance'},
        {objectId: 'grandTempleEntrance', logic: hasReleasedBeasts},
        {objectId: 'moneyMazeEntrance'},
        {objectId: 'overworld:holyCityFoodHouse'},
        {objectId: 'overworld:holyCityBridgeHouse'},
        {objectId: 'overworld:holyCityGardenHouse'},
        {objectId: 'overworld:holyCityClothesHouse'},
        {objectId: 'fertilityTempleEntrance'},
        {objectId: 'treeCaveEntrance'},
        {objectId: 'treeCavePit'},
        {
            objectId: 'frozenCaveEntrance',
            // This door is frozen until the beasts are released.
            // You can use fire magic to melt it, or medium range to use a nearby camp fire to melt it.
            logic: orLogic(hasReleasedBeasts, hasFire, hasMediumRange)
        },
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
            { nodeId: 'overworldMain', logic: orLogic(canRemoveLightStones, hasTeleportation) },
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
            { objectId: 'warTempleEastEntrance', logic: canRemoveLightStones },
            { objectId: 'warTempleEntrance', logic: orLogic(hasSpiritSight, hasTrueSight) },
            { objectId: 'warTempleNortheastEntrance' },
            { objectId: 'warTempleNorthEntrance' },
            { objectId: 'warTemplePeachEntrance', logic: canRemoveLightStones },
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
            {
                nodeId: 'overworldWaterfall',
                logic: orLogic(hasStaff, hasSomersault, hasTeleportation, canRemoveHeavyStones)
            },
            { nodeId: 'overworldMountainWater', logic: hasIronBoots },
        ],
        entranceIds: ['caves-ascentEntrance'],
        exits: [{objectId: 'caves-ascentEntrance' }],
    },
    {
        zoneId,
        nodeId: 'overworldWaterfall',
        paths: [
            { nodeId: 'overworldMountain', logic: orLogic(andLogic(hasGloves, canCross2Gaps), hasSomersault, hasStaff, hasTeleportation, hasIronBoots, canRemoveHeavyStones) },
        ],
        entranceIds: ['waterfallTowerEntrance'],
        exits: [{ objectId: 'waterfallTowerEntrance' }],
    },
    {
        zoneId,
        nodeId: 'overworldLakePiece',
        paths: [
            {nodeId: 'overworldMain'},
            {nodeId: 'mainSpiritWorld', logic: andLogic(canUseTeleporters, canRemoveLightStones)},
        ],
        checks: [
            { objectId: 'overworldLakePiece' },
        ],
    },
    {
        zoneId,
        nodeId: 'mainSpiritWorld',
        checks: [],
        paths: [
            { nodeId: 'spiritWorldMountain', logic: canRemoveLightStones },
            { nodeId: 'westSpiritWorld', logic: hasCloudBoots },
            { nodeId: 'overworldLakePiece', logic: andLogic(canUseTeleporters, canRemoveLightStones) },
            { nodeId: 'nimbusCloudSpirit', logic: hasNimbusCloud},
            { nodeId: 'warTempleSpiritArea', logic: orLogic(hasMitts, andLogic(hasTeleportation, canRemoveHeavyStones)) },
        ],
        entranceIds: [
            'fertilityTempleSpiritEntrance', 'staffTowerSpiritEntrance',
            'jadePalaceEntrance',
            'jadeCityNorthwestDoor', 'jadeCityWestDoor', 'jadeCitySouthwestDoor',
            'jadeCityNortheastDoor', 'jadeCitySoutheastDoor',
            'cloneCaveEntrance', 'cloneCaveExit', 'treeCaveSpiritEntrance'
        ],
        exits: [
            { objectId: 'jadePalaceEntrance' },
            { objectId: 'jadeCityNorthwestDoor' },
            { objectId: 'jadeCityWestDoor' },
            { objectId: 'jadeCitySouthwestDoor' },
            { objectId: 'jadeCityNortheastDoor' },
            { objectId: 'jadeCitySoutheastDoor' },
            { objectId: 'fertilityTempleSpiritEntrance' },
            { objectId: 'staffTowerSpiritEntrance', logic: {requiredFlags: ['staffTowerSpiritEntrance']} },
            { objectId: 'cloneCaveExit' },
            { objectId: 'treeCaveSpiritEntrance' },
        ],
    },
    {
        zoneId,
        nodeId: 'jadeCityMazeExit',
        checks: [{objectId: 'jadeCityMazePeachPiece'}],
        paths: [{ nodeId: 'mainSpiritWorld' }],
        entranceIds: ['jadeCityMazeExit'],
        exits: [{ objectId: 'jadeCityMazeExit' }],
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
            { nodeId: 'mainSpiritWorld', logic: canRemoveHeavyStones },
        ],
        entranceIds: [
            'warTempleEntranceSpirit',
            'warPalaceWestDoor'
        ],
        exits: [
            { objectId: 'warTempleEntranceSpirit' },
            { objectId: 'warPalaceWestDoor' },
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
        exits: [
            { objectId: 'forestTempleLadder4' },
            { objectId: 'forestTempleLadder5' },
            { objectId: 'forestTempleBigKeyEntrance' },
        ],
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
        // This is a special node for capturing the fact that you can fall from the sky
        // to reach this entrance without iron boots.
        zoneId,
        nodeId: 'overworldMountainWaterPitEntrance',
        paths: [],
        exits: [{ objectId: 'waterfallCavePitEntrance' }],
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
            // If you fall in the correct place, you can enter the pit entrance
            // underwater above the waterfall village.
            { nodeId: 'overworldMountainWaterPitEntrance', logic: hasCloudBoots}
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
            // Walk straight north on the right side to fall onto the small plateau next to the lake.
            { nodeId: 'overworldLakePiece'},
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
        nodeId: 'outsideForge',
        paths: [
            { nodeId: 'westSpiritWorldMountain' },
            { nodeId: 'skyCity'},
        ],
        entranceIds: ['caves-ascentExitSpirit', 'forgeEntrance'],
        exits: [
            { objectId: 'caves-ascentExitSpirit'}
            { objectId: 'forgeEntrance' },
        ],
    },
    {
        zoneId,
        nodeId: 'skyCity',
        paths: [
            { nodeId: 'outsideForge', logic: orLogic(
                // Even with the staff you still need to be able to cross a small gap.
                andLogic(hasIce, hasStaff, canCross2Gaps),
                hasSomersault
            ) },
            { nodeId: 'westSpiritWorldMountain' },
            { nodeId: 'spiritWorldMountain' },
            { nodeId: 'mainSpiritWorld'},
            { nodeId: 'desertTowerSkySpirit', logic: orLogic(hasIce, hasCloudBoots, hasSomersault) },
        ],
        entranceIds: ['waterfallTowerTopEntrance'],
        exits: [{ objectId: 'waterfallTowerTopEntrance' }],
    },
    {
        zoneId,
        nodeId: 'desertTowerSkySpirit',
        paths: [
            { nodeId: 'waterfallTowerSky', logic: orLogic(hasIce, hasCloudBoots, hasSomersault) },
            { nodeId: 'outsideHypeCave', logic: orLogic(hasIce, hasCloudBoots, hasSomersault) },
            { nodeId: 'forestTowerSkySpirit', logic: orLogic(hasIce, hasCloudBoots, hasSomersault) },
        ],
        entranceIds: ['staffTowerSpiritSkyEntrance', 'hypeCaveEntranceSpirit'],
        exits: [
            { objectId: 'staffTowerSpiritSkyEntrance' },
            { objectId: 'hypeCaveEntranceSpirit' },
        ],
    },
    {
        zoneId,
        nodeId: 'outsideHypeCave',
        paths: [
            { nodeId: 'desertTowerSkySpirit', logic: orLogic(hasIce, hasCloudBoots, hasSomersault) },
        ],
        entranceIds: ['hypeCaveEntranceSpirit'],
        exits: [
            { objectId: 'hypeCaveEntranceSpirit' },
        ],
    },
    {
        zoneId,
        nodeId: 'forestTowerSkySpirit',
        paths: [
            { nodeId: 'desertTowerSkySpirit', logic: orLogic(hasIce, hasCloudBoots, hasSomersault) },
            { nodeId: 'outsideSkyPalacePitEntrance', logic: orLogic(andLogic(hasIce, canCross2Gaps), hasCloudBoots, hasSomersault) },
        ],
        entranceIds: [],
        exits: [],
    },
    {
        zoneId,
        nodeId: 'outsideSkyPalacePitEntrance',
        paths: [],
        exits: [{ objectId: 'skyPalacePitEntrance', logic: canRemoveHeavyStones}],
    },
    {
        zoneId,
        nodeId: 'skyPalaceCourtyard',
        paths: [
            { nodeId: 'forestTowerSkySpirit', logic: orLogic(hasInvisibility, hasLightningBlessing, hasLightning) },
            { nodeId: 'skyOverLakeTemple', logic: canUseTeleporters }
        ],
        exits: [
            { objectId: 'skyPalaceSecretEntrance'},
            { objectId: 'skyPalaceEntrance'},
            {objectId: 'helixSkySpiritEntrance'},
        ],
        entranceIds: ['skyPalaceSecretEntrance', 'skyPalaceEntrance', 'helixSkySpiritEntrance']
    },
    {
        zoneId,
        nodeId: 'skyPalaceWalkway',
        paths: [{ nodeId: 'skyPalaceCourtyard'}],
        exits: [{ objectId: 'skyPalaceWestEntrance'}, { objectId: 'skyPalaceTowerEntrance'}, { objectId: 'skyPalaceEastEntrance'}],
        entranceIds: ['skyPalaceWestEntrance', 'skyPalaceTowerEntrance', 'skyPalaceEastEntrance'],
    },
];
