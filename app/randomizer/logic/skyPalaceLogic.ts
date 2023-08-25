import {
    canCross2Gaps, canDefeatBalloonMegapede,
    hasBossWeapon, hasClone, hasIce, hasInvisibility,
    hasLightning, hasLightningBlessing, canRemoveHeavyStones,
    hasSomersault, hasTowerStaff, hasTrueSight,
    orLogic,
} from 'app/content/logic';


const zoneId = 'skyPalace';
export const skyPalaceNodes: LogicNode[] = [
    {
        zoneId,
        nodeId: 'skyPalaceSecretEntrance',
        checks: [
            { objectId: 'skyPalaceSmallMoney', logic: canCross2Gaps},
            { objectId: 'skyPalacePeachPiece', logic: orLogic(hasTrueSight, hasSomersault, hasTowerStaff)},
        ],
        entranceIds: ['skyPalaceEntranceMarker', 'skyPalaceSecretEntrance'],
        exits: [
            {objectId: 'skyPalaceSecretEntrance'},
        ],
    },
    {
        zoneId,
        nodeId: 'skyPalaceEntrance',
        checks: [{objectId: 'skyPalaceMap'}],
        paths: [
            { nodeId: 'skyPalaceKeyBlockArea', logic: hasSomersault},
            { nodeId: 'skyPalaceKeyArea', logic: hasSomersault},
            { nodeId: 'skyPalaceNorthwestLedge', logic: orLogic(hasLightningBlessing, hasLightning, hasInvisibility)},
            { nodeId: 'skyPalaceSouthwestLedge', logic: orLogic(hasIce, hasClone)},
            { nodeId: 'skyPalaceEastLedge', logic: canRemoveHeavyStones},
        ],
        entranceIds: ['skyPalaceEntrance'],
        exits: [
            {objectId: 'skyPalaceEntrance'},
        ],
    },
    {
        zoneId,
        nodeId: 'skyPalaceKeyBlockArea',
        paths: [
            { nodeId: 'skyPalaceEntrance', logic: hasSomersault},
            { nodeId: 'skyPalaceKeyArea', logic: hasSomersault},
            { nodeId: 'skyPalaceAfterKeyBlock', doorId: 'skyPalaceLock'},
        ],
    },
    {
        zoneId,
        nodeId: 'skyPalaceKeyArea',
        checks: [{objectId: 'skyPalaceSmallKey'}],
        paths: [
            { nodeId: 'skyPalaceEntrance', logic: hasSomersault},
            { nodeId: 'skyPalaceKeyBlockArea', logic: hasSomersault},
        ],
        entranceIds: ['skyPalaceBigChestMarker'],
    },
    {
        zoneId,
        nodeId: 'skyPalaceAfterKeyBlock',
        paths: [
            { nodeId: 'skyPalaceKeyBlockArea'},
            { nodeId: 'skyPalaceBossPit', doorId: 'skyPalaceBigLock'},
        ],
    },
    {
        zoneId,
        nodeId: 'skyPalaceBossPit',
        paths: [
            { nodeId: 'skyPalaceAfterKeyBlock'},
        ],
        exits: [
            {objectId: 'skyPalaceBossPit'},
        ],
    },
    {
        zoneId,
        nodeId: 'skyPalaceBoss',
        checks: [
            { objectId: 'skyPalaceBoss', logic: canDefeatBalloonMegapede},
        ],
        entranceIds: ['skyPalaceBossMarker'],
        exits: [
            {objectId: 'skyPalaceNimbusCloudPit', logic: canDefeatBalloonMegapede},
        ],
    },
    {
        zoneId,
        nodeId: 'skyPalaceNimbusCloud',
        checks: [
            { objectId: 'skyPalaceNimbusCloud'},
        ],
        entranceIds: ['skyPalaceNimbusCloudMarker'],
    },
    {
        zoneId,
        nodeId: 'skyPalaceNorthwestLedge',
        paths: [
            { nodeId: 'skyPalaceBigKey'},
            { nodeId: 'skyPalaceEntrance', logic: orLogic(hasLightningBlessing, hasLightning, hasInvisibility)},
        ],
    },
    {
        zoneId,
        nodeId: 'skyPalaceBigKey',
        checks: [{objectId: 'skyPalaceBigKey'}],
        paths: [{ nodeId: 'skyPalaceEastLedge'}],
    },
    {
        zoneId,
        nodeId: 'skyPalaceSouthwestLedge',
        paths: [
            { nodeId: 'skyPalaceEntrance'},
        ],
        entranceIds: ['skyPalaceWestEntrance'],
        exits: [
            {objectId: 'skyPalaceWestEntrance'},
        ],
    },
    {
        zoneId,
        nodeId: 'skyPalaceEastLedge',
        paths: [
            { nodeId: 'skyPalaceEntrance'},
            { nodeId: 'skyPalaceBigKey', logic: hasBossWeapon},
        ],
        entranceIds: ['skyPalaceEastEntrance'],
        exits: [
            {objectId: 'skyPalaceEastEntrance'},
        ],
    },
    {
        zoneId,
        nodeId: 'skyPalaceTower1Entrance',
        paths: [{nodeId: 'skyPalaceTower1Exit', logic: canCross2Gaps}],
        entranceIds: ['skyPalaceTowerEntrance'],
        exits: [
            {objectId: 'skyPalaceTowerEntrance'},
        ],
    },
    {
        zoneId,
        nodeId: 'skyPalaceTower1Exit',
        entranceIds: ['skyPalaceStairs1'],
        exits: [{objectId: 'skyPalaceStairs1'}],
    },
    {
        zoneId,
        nodeId: 'skyPalaceTower2',
        entranceIds: ['skyPalaceStairs1', 'skyPalaceStairs2'],
        exits: [
            {objectId: 'skyPalaceStairs1'},
            {objectId: 'skyPalaceStairs2', logic: hasBossWeapon},
        ],
    },
    {
        zoneId,
        nodeId: 'skyPalaceBigChest',
        checks: [{ objectId: 'skyPalaceRoll'}],
        entranceIds: ['skyPalaceStairs2'],
        exits: [
            {objectId: 'skyPalaceStairs2'},
            {objectId: 'skyPalaceBigChestPit'},
        ],
    },
];
