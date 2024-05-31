import {
    andLogic,
    canCross2Gaps,
    canCrossDynamic2Gaps,
    canCrossDynamic4Gaps,
    canCrossLightningBarriers,
    canHasTowerStaff,
    canMoveHeavyStairs,
    canRemoveLightStones,
    hasReleasedBeasts,
    hasBossWeapon,
    hasCloudBoots,
    hasClone,
    hasIce,
    hasLightning,
    hasInvisibility,
    hasSomersault,
    hasTeleportation,
    hasWeapon,
    orLogic,
} from 'app/content/logic';


const hasFixedElevator = {requiredFlags: ['elevatorFixed']};
// There are many ways to get over the fast escalators.
const canCrossEscalators = orLogic(canHasTowerStaff, hasIce, hasCloudBoots, hasSomersault, hasInvisibility);

const zoneId = 'staffTower';
export const staffTowerNodes: LogicNode[] = [
    {
        zoneId,
        nodeId: 'staffTowerF1Downstairs',
        checks: [
            {objectId: 'staffTowerEntranceSilver'},
            {objectId: 'staffTowerEntranceMoney'},
        ],
        paths: [
            {nodeId: 'staffTowerF1Upstairs', logic: orLogic(hasClone, canCrossEscalators)}
        ],
        entranceIds: ['staffTowerEntrance'],
        exits: [{objectId: 'staffTowerEntrance'}],
    },
    {
        zoneId,
        nodeId: 'staffTowerF1Upstairs',
        paths: [
            {nodeId: 'staffTowerF1Downstairs'},
            // Power is only on after the storm beast is released.
            {nodeId: 'staffTowerF1SpiritUpstairs', logic: hasReleasedBeasts},
        ],
        entranceIds: ['staffTowerBasementLadder'],
        exits: [{objectId: 'staffTowerBasementLadder', logic: orLogic(hasLightning, hasFixedElevator)}],
    },
    {
        zoneId,
        nodeId: 'staffTowerB1',
        checks: [
            // Lightning is required as the enemies are off+invulnerable after the boss is defeated.
            // They must be hit with lightning to be turned on and defeated.
            { objectId: 'staffTowerGold', logic: andLogic(hasLightning, hasBossWeapon) },
        ],
        entranceIds: ['staffTowerBasementLadder'],
        exits: [{objectId: 'staffTowerBasementLadder', logic: hasFixedElevator}],
    },
    {
        zoneId,
        nodeId: 'staffTowerF1SpiritUpstairs',
        paths: [
            // Power is only on after the storm beast is released.
            {nodeId: 'staffTowerF1Upstairs', logic: hasReleasedBeasts},
            {nodeId: 'staffTowerF1SpiritDownstairs'},
        ],
        entranceIds: ['staffTower1F2F', 'staffTowerSpiritEntrance'],
        exits: [{objectId: 'staffTower1F2F'}, {objectId: 'staffTowerSpiritEntrance'}],
    },
    {
        zoneId,
        nodeId: 'staffTowerF1SpiritDownstairs',
        flags: [{flag: 'staffTowerSpiritEntrance'}],
        paths: [
            {nodeId: 'staffTowerF1SpiritUpstairs', logic: orLogic(hasClone, canCrossEscalators)},
            // Always in logic since this is the default tower location
            {nodeId: 'mainSpiritWorld'},
            // Other exits don't need logic since they have to already be in logic to move the tower to them.
        ],
        entranceIds: ['staffTower1F2F', 'staffTowerSpiritEntrance', 'staffTowerLowerDoor'],
        exits: [{objectId: 'staffTower1F2F'}, {objectId: 'staffTowerSpiritEntrance'}, {objectId: 'staffTowerLowerDoor'}],
    },
    {
        zoneId,
        nodeId: 'staffTowerF1SpiritKeyRoom',
        checks: [{ objectId: 'staffTowerLowerKey', logic: hasWeapon }],
        entranceIds: ['staffTowerLowerDoor'],
        exits: [{objectId: 'staffTowerLowerDoor'}],
    },
    {
        zoneId,
        nodeId: 'staffTowerF2SpiritNorth',
        paths: [
            {nodeId: 'staffTowerF2SpiritSouth', logic: canRemoveLightStones},
        ],
        entranceIds: ['staffTower1F2F'],
        exits: [{objectId: 'staffTower1F2F'}],
    },
    {
        zoneId,
        // Technically this is East+West+South, but the requirements all need gloves.
        nodeId: 'staffTowerF2SpiritSouth',
        paths: [
            {nodeId: 'staffTowerF2SpiritNorth', logic: canRemoveLightStones},
            {nodeId: 'staffTowerF2SpiritElevator', logic: canMoveHeavyStairs},
            // Terminal is only on once the beasts are released
            // The roll/escalator logic actually applies to leaving the area right after you use the terminal.
            {nodeId: 'staffTowerF2', logic: andLogic(hasReleasedBeasts, orLogic(canCrossDynamic2Gaps, canCrossEscalators))},
        ],
    },
    {
        zoneId,
        nodeId: 'staffTowerF2SpiritElevator',
        paths: [
            {nodeId: 'staffTowerF2SpiritSouth'},
            {nodeId: 'staffTowerB1Spirit', logic: hasReleasedBeasts},
        ],
        entranceIds: ['tower2FMarker'],
    },
    {
        zoneId,
        nodeId: 'staffTowerF2SpiritMap',
        checks: [{ objectId: 'staffTowerMap'}],
        paths: [
            {nodeId: 'staffTowerF2SpiritSouth', logic: canRemoveLightStones},
        ],
    },
    {
        zoneId,
        nodeId: 'staffTowerF2',
        paths: [
            // Terminal is only on once the beasts are released
            {nodeId: 'staffTowerF2SpiritMap', logic: hasReleasedBeasts},
            {nodeId: 'staffTowerF2Elevator', logic: canMoveHeavyStairs},
        ],
        entranceIds: ['staffTower2F3F'],
        exits: [{objectId: 'staffTower2F3F'}],
    },
    {
        zoneId,
        nodeId: 'staffTowerF2Elevator',
        checks: [{ objectId: 'staffTowerPeachPiece' }],
        paths: [{nodeId: 'staffTowerF2'}],
        entranceIds: ['tower2FMarker'],
    },
    {
        zoneId,
        nodeId: 'staffTowerF3',
        checks: [
            // You have to cross a 4 gap from a conveyer belt to reach this chest.
            { objectId: 'staffTowerBigMoney1', logic: canCrossDynamic4Gaps },
        ],
        paths: [
            // Terminal is off until the beasts are released.
            // The weapon is required for defeating enemies after using the terminal
            {nodeId: 'staffTowerF3Spirit', logic: andLogic(hasReleasedBeasts, canCrossDynamic2Gaps, hasWeapon)},
        ],
        entranceIds: ['staffTower2F3F'],
        exits: [
            {objectId: 'staffTower2F3F'},
            {objectId: 'tower3FPit', logic: orLogic(hasIce, hasCloudBoots, hasSomersault, canHasTowerStaff)},
        ],
    },
    {
        zoneId,
        nodeId: 'staffTowerF3Spirit',
        paths: [
            // Terminal is off until the beasts are released, need to roll and defeat plants to reach terminal from door.
            {nodeId: 'staffTowerF3', logic: andLogic(hasReleasedBeasts, canCross2Gaps, hasWeapon)},
        ],
        exits: [{objectId: 'staffTower3F4F'}, {objectId: 'tower3FPit', logic: hasWeapon}],
        entranceIds: [
            'staffTower3F4F',
        ],
    },
    {
        zoneId,
        nodeId: 'staffTowerB1Spirit',
        checks: [
            { objectId: 'elevatorFixed', logic: hasBossWeapon },
        ],
        paths: [
            {nodeId: 'staffTowerF1SpiritDownstairs', logic: hasBossWeapon},
            {nodeId: 'staffTowerF2SpiritElevator', logic: hasBossWeapon},
            {nodeId: 'staffTowerF3SpiritElevator', logic: hasBossWeapon},
            {nodeId: 'staffTowerF4Spirit', logic: hasBossWeapon},
            {nodeId: 'staffTowerF5SpiritElevator', logic: hasBossWeapon},
        ],
    },
    {
        zoneId,
        nodeId: 'staffTowerF3SpiritElevator',
        checks: [ { objectId: 'staffTowerBigMoney2' }],
        paths: [{nodeId: 'staffTowerF3Spirit'} ],
    },
    {
        zoneId,
        nodeId: 'staffTowerF4',
        flags: [{flag: 'staffTowerSkyEntrance'}],
        entranceIds: ['staffTowerSkyEntrance', 'staffTower4F5F'],
        exits: [
            {objectId: 'staffTowerSkyEntrance'},
            {objectId: 'staffTower4F5F'},
        ],
    },
    {
        zoneId,
        nodeId: 'staffTowerF4Spirit',
        paths: [
            // Terminal is off until the beasts are released.
            {nodeId: 'staffTowerF4', logic: hasReleasedBeasts},
        ],
        entranceIds: [
            'staffTowerSpiritSkyEntrance',
            'staffTower3F4F',
        ],
        exits: [
            {objectId: 'staffTower3F4F'},
            {objectId: 'staffTowerSpiritSkyEntrance'},
        ],
    },
    {
        zoneId,
        nodeId: 'staffTowerF5SpiritElevator',
        paths: [
            // Terminal is off until the beasts are released.
            {nodeId: 'staffTowerF5South', logic: hasReleasedBeasts},
        ],
        exits: [
            // To reach the roof the player must use a terminal to travel to the material world and remove some stones.
            // Then they must return to the spirit world and use teleportation to reach the ladder.
            {objectId: 'staffTowerRoof', logic: andLogic(hasReleasedBeasts, hasTeleportation, canRemoveLightStones)},
        ],
    },
    {
        zoneId,
        nodeId: 'staffTowerF5North',
        checks: [ { objectId: 'staffTowerUpperKey' }],
        paths: [
            // Terminal is off until the beasts are released.
            {nodeId: 'staffTowerF5South', logic: canCrossLightningBarriers},
        ],
        entranceIds: ['staffTower4F5F'],
        exits: [
            {objectId: 'staffTower4F5F'},
        ],
    },
    {
        zoneId,
        nodeId: 'staffTowerF5South',
        paths: [
            {nodeId: 'staffTowerF5North', logic: canRemoveLightStones},
            // Terminal is off until the beasts are released.
            {nodeId: 'staffTowerF5SpiritElevator', logic: hasReleasedBeasts},
        ],
    },
    {
        zoneId,
        // This covers both spirit/material versions since they are both connected once the boss is defeated
        nodeId: 'staffTowerRoof',
        checks: [
            //
            { objectId: 'stormBeast', logic: hasBossWeapon },
        ],
        entranceIds: ['staffTowerRoof'],
    },
];
