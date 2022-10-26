import {
    andLogic,
    canCross4Gaps, canReleaseBeasts, canTravelFarUnderWater,
    hasCloudBoots, hasIronBoots, hasGloves, hasIce, hasMitts, hasSomersault, hasTeleportation,
    hasMediumRange, hasNimbusCloud, hasSpiritSight, hasTowerStaff, orLogic,
} from 'app/content/logic';

import { LogicNode } from 'app/types';


let zoneId = 'overworld';
export const overworldNodes: LogicNode[] = [
    {
        zoneId,
        nodeId: 'overworldMain',
        complexNpcs: [
            {dialogueKey: 'streetVendor', optionKey: 'purchase1'},
            {dialogueKey: 'streetVendor', optionKey: 'purchase2', logic: { requiredFlags: ['$maxLife:7'] }},
        ],
        paths: [
            { nodeId: 'overworldMountain', logic: hasGloves },
            { nodeId: 'warTempleArea' },
            { nodeId: 'mainSpiritWorld', logic: orLogic(hasSomersault, hasTeleportation) },
            { nodeId: 'nimbusCloud', logic: hasNimbusCloud},
            // This represents moving the tower to the forest position and using cloud boots to
            // fall on the river temple roof.
            { nodeId: 'riverTempleRoof', logic: andLogic({requiredFlags: ['stormBeast']}, hasCloudBoots)}
        ],
        entranceIds: [
            'sideArea:noToolEntrance', 'elderEntrance', 'tombTeleporter',
            'lakeTunnelEntrance', 'peachCaveTopEntrance', 'peachCaveWaterEntrance',
            'staffTowerEntrance',
            'tombEntrance', 'waterfallCaveEntrance', 'templeCrackedDoor', 'templeDoor',
            'moneyMazeEntrance', 'overworld:holyCityFoodHouse',
        ],
        exits: [
            { objectId: 'sideArea:noToolEntrance'},
            { objectId: 'elderEntrance' },
            { objectId: 'lakeTunnelEntrance', logic: hasGloves },
            { objectId: 'peachCaveTopEntrance' },
            { objectId: 'peachCaveWaterEntrance' },
            { objectId: 'staffTowerEntrance' },
            { objectId: 'tombEntrance', logic: hasMediumRange },
            { objectId: 'waterfallCaveEntrance' },
            { objectId: 'templeCrackedDoor' },
            { objectId: 'templeDoor' },
            { objectId: 'moneyMazeEntrance' },
            { objectId: 'overworld:holyCityFoodHouse' },
        ],
    },
    {
        zoneId,
        nodeId: 'nimbusCloud',
        paths: [
            { nodeId: 'riverTempleRoof' },
            { nodeId: 'mountainAscentExit' },
            // Holy city, Vanara village and summoner ruins
            // are all accessible without the cloud, so don't bother with them here.
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
            { objectId: 'warTempleEntrance', logic: hasSpiritSight },
            { objectId: 'warTempleNortheastEntrance' },
            { objectId: 'warTempleNorthEntrance' },
            { objectId: 'warTemplePeachEntrance', logic: hasGloves },
            // This is a one way door that stays open once you leave it, so we don't need to include this direction
            //{ objectId: 'warTempleKeyDoor', logic: hasSpiritSight },
        ],
    },
    {
        zoneId,
        nodeId: 'overworldMountain',
        checks: [
            { objectId: 'overworldCliffPeachPiece' },
        ],
        paths: [
            { nodeId: 'overworldMain' },
            { nodeId: 'overworldWaterfall', logic: orLogic(hasSomersault, hasTeleportation, hasIronBoots, hasMitts) },
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
        checks: [
            { objectId: 'overworldLakePiece' },
        ],
    },
    {
        zoneId,
        nodeId: 'mainSpiritWorld',
        checks: [
            { objectId: 'spiritChakram' },
        ],
        paths: [
            { nodeId: 'spiritWorldMountain', logic: hasGloves },
            { nodeId: 'westSpiritWorld', logic: hasCloudBoots },
            { nodeId: 'overworldLakePiece' },
            // For door randomizer I would need to add the small fertility area in between here.
            // I will need to add it eventually when I add checks to the fertility temple.
            { nodeId: 'forestTempleSEArea' },
            { nodeId: 'nimbusCloudSpirit', logic: hasNimbusCloud},
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
            { nodeId: 'mainSpiritWorld', logic: hasCloudBoots },
            { nodeId: 'nimbusCloudSpirit', logic: hasNimbusCloud},
        ],
    },
    {
        zoneId,
        nodeId: 'spiritWorldMountain',
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
        nodeId: 'forestTempleSEArea',
        paths: [
            { nodeId: 'mainSpiritWorld' },
            { nodeId: 'forestTempleSWArea', logic: orLogic(hasCloudBoots, hasIce) },
            { nodeId: 'forestTempleNEArea', logic: orLogic(hasCloudBoots, hasIce) },
            { nodeId: 'forestTempleNWArea', logic: orLogic(hasCloudBoots, hasIce) },
        ],
        entranceIds: ['forestTempleLadder1'],
        exits: [{ objectId: 'forestTempleLadder1' }],
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
            // This logic doesn't work since the randomizer doesn't currently set flags when simulating.
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
        nodeId: 'outsideCrater',
        paths: [
            { nodeId: 'overworldMountain' },
            { nodeId: 'outsideHelix', logic: hasCloudBoots },
            { nodeId: 'skyTreasure', logic: hasCloudBoots },
        ],
        entranceIds: ['craterEntrance'],
        exits: [
            { objectId: 'craterEntrance', logic: canReleaseBeasts },
        ],
    },
    {
        zoneId,
        nodeId: 'skyTreasure',
        checks: [{ objectId: 'skyMoney'}],
    },
    {
        zoneId,
        nodeId: 'outsideHelix',
        paths: [
            { nodeId: 'outsideCrater', logic: hasCloudBoots },
            { nodeId: 'skyTreasure', logic: hasCloudBoots },
        ],
        entranceIds: ['helixSkyEntrance'],
        exits: [
            { objectId: 'helixSkyEntrance' },
        ],
    },
    {
        zoneId,
        nodeId: 'desertTowerSky',
        // This door is closed from the inside in the material world.
        entranceIds: ['staffTowerSkyEntrance'],
    },
    // Spirit sky nodes
    {
        zoneId,
        nodeId: 'outsideForge',
        paths: [
            { nodeId: 'westSpiritWorldMountain' },
            { nodeId: 'waterfallTowerSky'},
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
            { nodeId: 'outsideSkyPalace', logic: orLogic(hasCloudBoots, canCross4Gaps) },
            { nodeId: 'nimbusCloudSpirit', logic: hasNimbusCloud},
        ],
        entranceIds: ['waterfallTowerTopEntrance'],
        exits: [{ objectId: 'waterfallTowerTopEntrance' }],
    },
    {
        zoneId,
        nodeId: 'outsideSkyPalace',
        paths: [
            { nodeId: 'waterfallTowerSky', logic: orLogic(hasCloudBoots, canCross4Gaps) },
            { nodeId: 'nimbusCloudSpirit', logic: hasNimbusCloud},
        ],
        entranceIds: ['skyPalaceEntrance'],
        exits: [{ objectId: 'skyPalaceEntrance', logic:
            // This logic is probably a good default
            orLogic(hasMitts, andLogic(hasTeleportation, hasTowerStaff)),
            // Could use this as advance logic
            /*orLogic(
                // Simple path, lift the stones to enter
                hasMitts,
                // Subtle path, somersault in from the right
                hasSomersault,
                // Hard path, use tower staff or cloud boots + tower staff to make
                // solid ground right of the tower then teleport in.
                andLogic(
                    hasTeleportation,
                    orLogic(hasTowerStaff, andLogic(hasCloudBoots, hasStaff))
                )
            )*/
        }],
    },
    {
        zoneId,
        nodeId: 'desertTowerSkySpirit',
        entranceIds: ['staffTowerSpiritSkyEntrance'],
        exits: [{ objectId: 'staffTowerSpiritSkyEntrance' }],
    },
    // Over river temple is not implemented yet
    // outside waterfall tower is not interesting in the material world currently.
];
