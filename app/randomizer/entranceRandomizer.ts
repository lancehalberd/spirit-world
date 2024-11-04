import { zoneEntranceMap } from 'app/content/dialogue/nimbusCloud';
import { overworldKeys } from 'app/gameConstants';
import SRandom from 'app/utils/SRandom';

import {
    everyObject, verifyNodeConnections
} from 'app/randomizer/utils';

// Warning: The terms entrance/exit don't seem to be used consistently in this file.
// Going forward we will try to use "entrances" for ids like 'overworld:peachCaveEntrance' (id of the object on the overworld)
// And "exits" for ids like 'peachCave:peachCaveEntrance' (id of the object in the peach cave.)

const ignoredZones = [
    // These zones are part of the 'Holy Sanctum' and should not be randomized.
    'fireSanctum', 'iceSanctum', 'lightningSanctum', 'holySanctumBack',
    // The void is part of the 'Tree' zone and should not be randomized.
    'void',
];

const outsideZones = overworldKeys;

// This stores a list of zone+object ids that should be ignored, (not target zone+object ids).
const disabledDoors = [
    // Money maze isn't designed to allow entering from the exit, so just disable this door.
    'overworld:moneyMazeExit',
    // Neither this door or its target are reachable in the game.
    // This door just exists as a reason for there to be corresponding cave in the spirit world.
    'sky:hypeCaveEntrance',
];

interface DoorLocation {
    location: ZoneLocation
    definition: EntranceDefinition
}

// These groups of entrances are not reachable except from one of the other exits, so at least
// one needs to be connected to a reachable entrance using a connected exit group.
const unreachableSpiritExitGroups = [
    // There is currently a ladder leading to this cave in the Spirit World.
    //['caves:caves-ascentExitSpirit'],
    ['holyCityInterior:jadeCityMazeExit'],
    ['skyPalace:skyPalaceWestEntrance', 'skyPalace:skyPalaceTowerEntrance', 'skyPalace:skyPalaceEastEntrance'],
];

interface ConnectedExitGroup {
    normalEntranceTargets?: string[]
    spiritEntranceTargets?: string[]
    immutableEntranceTargets?: string[]
}

// Exits that are logically connected. Eventually we should calculate this based on
// exploring nodes using only paths+non zone changing entrances, but I'm hardcoding it now
// for simplicity
const connectedExitGroups: ConnectedExitGroup[] = [
    {
        normalEntranceTargets: ['overworld:peachCaveTopEntrance', 'overworld:peachCaveWaterEntrance'],
    },
    {
        normalEntranceTargets: ['overworld:caves-ascentEntrance', 'sky:caves-ascentExit'],
    },
    {
        normalEntranceTargets: [
            'overworld:warTempleNortheastEntrance',
            'overworld:warTempleEastEntrance',
            'overworld:warTempleKeyDoor',
        ],
        // Main war temple entrance isn't actually immutable,
        // but the other entrances don't allow exiting from it.
        immutableEntranceTargets: ['overworld:warTempleEntrance'],
    },
    {
        normalEntranceTargets: ['lakeTunnel:helixEntrance', 'sky:helixSkyEntrance'],
    },
    {
        spiritEntranceTargets: ['sky:waterfallTowerTopEntrance'],
        immutableEntranceTargets: ['overworld:waterfallTowerEntrance'],
    },
    {
        normalEntranceTargets: ['overworld:riverTempleUpperEntrance'],
        immutableEntranceTargets: ['underwater:riverTempleWaterEntrance'],
    },
    {
        normalEntranceTargets: ['overworld:staffTowerEntrance', 'sky:staffTowerSkyEntrance',],
        spiritEntranceTargets: ['overworld:staffTowerSpiritEntrance', 'sky:staffTowerSpiritSkyEntrance'],
    },
    {
        spiritEntranceTargets: ['overworld:fertilityTempleSpiritEntrance', 'overworld:fertilityTempleExit'],
    },
    {
        spiritEntranceTargets: ['overworld:forestTempleLadder1', 'overworld:forestTempleLadder2'],
    },
    {
        spiritEntranceTargets: ['overworld:forestTempleLadder3', 'overworld:forestTempleLadder4'],
    },
    /* Although this could form a tunnel from entrance -> exit, the randomizer logic doesn't currently
    {
        spiritEntranceTargets: ['overworld:caves-ascentEntranceSpirit'],
        immutableEntranceTargets: ['sky:caves-ascentExitSpirit'],
    },*/
    /* Although this could form a tunnel from entrance -> exit, the randomizer logic doesn't currently
    have support for a one way tunnel, so this cannot currently function as a connected exit group.
    {
        spiritEntranceTargets: ['overworld:jadeCityMazeExit'],
        // It is not possible to reach the entrance door when entering from the exit door.
        immutableEntranceTargets: ['overworld:jadeCityWestDoor'],
    },*/
    /* Although this could form a tunnel from entrance -> exit, the randomizer logic doesn't currently
    have support for a one way tunnel, so this cannot currently function as a connected exit group.
    {
        spiritEntranceTargets: ['overworld:cloneCaveExit'],
        // It is not possible to reach the entrance door when entering from the exit door.
        immutableEntranceTargets: ['overworld:cloneCaveEntrance'],
    },*/
];

// Loopable entrance pairs occur when a zone contains both an entrance and an exit.
// If such a zone pairs its entrance and exit together, or multiple zones form a loop,
// then they will disconnected from the rest of the map.
const normalLoopableEntrancePairs = [
    // Tomb -> Cocoon
    {outerTarget: 'overworld:tombEntrance', innerTarget: 'cocoon:cocoonEntrance'},
    // Lake Tunnel -> Helix
    {outerTarget: 'overworld:lakeTunnelEntrance', innerTarget: 'helix:helixEntrance'},
    // Grand temple -> Gauntlet
    {outerTarget: 'overworld:grandTempleEntrance', innerTarget: 'gauntlet:gauntletEntrance'},
];
const spiritLoopableEntrancePairs = [
    // Elder Spirit -> Forest Temple Back
    {outerTarget: 'overworld:elderSpiritEntrance', innerTarget: 'forestTemple:forestTempleBackDoor'},
    // War Temple Spirit -> Lab
    {outerTarget: 'overworld:warTempleEntranceSpirit', innerTarget: 'lab:labEntrance'},
    // Lab -> Tre
    {outerTarget: 'warTemple:labEntrance', innerTarget: 'tree:treeEntrance'},
    // Jade Palace -> Holy Sanctum
    {outerTarget: 'overworld:jadePalaceEntrance', innerTarget: 'holySanctum:holySanctumEntrance'},
];

export function randomizeEntrances(random: typeof SRandom) {
    const connectedNormalEntrances = new Set<string>();
    const connectedSpiritEntrances = new Set<string>();
    const normalEntrances = new Set<string>();
    const spiritEntrances = new Set<string>();
    const waterEntrances = new Set<string>();
    const normalExits = new Set<string>();
    const spiritExits = new Set<string>();
    const waterExits = new Set<string>();
    const normalPitEntrances: EntranceDefinition[] = [];
    const spiritPitEntrances: EntranceDefinition[] = [];
    const normalPitTargets = new Set<string>();
    const spiritPitTargets = new Set<string>();
    const targetIdMap: {[key in string]: DoorLocation[]} = {};
    const allTargetedKeys = new Set<string>();
    const fixedNimbusCloudZones = new Set<string>();
    everyObject((location, zone: Zone, area: AreaDefinition, object) => {
        if (ignoredZones.includes(zone.key)) {
            return;
        }
        if (object.type === 'pitEntrance') {
            if (!object.targetZone || object.targetZone === zone.key) {
                return;
            }
            const targetKey = `${object.targetZone}:${object.targetObjectId}`;
            if (area.isSpiritWorld) {
                spiritPitTargets.add(targetKey);
                spiritPitEntrances.push(object);
            } else {
                normalPitTargets.add(targetKey);
                normalPitEntrances.push(object);
            }
            return;
        }
        if (object.type !== 'door' && object.type !== 'staffTower') {
            return;
        }
        if (!object.targetZone || object.targetZone === zone.key) {
            return;
        }
        if (ignoredZones.includes(object.targetZone)) {
            return;
        }
        const key = `${zone.key}:${object.id}`;
        const targetKey = `${object.targetZone}:${object.targetObjectId}`;
        if (!object.id) {
            console.log('missing object ID:', key, targetKey);
        }
        if (disabledDoors.includes(key) || disabledDoors.includes(targetKey)) {
            return;
        }
        targetIdMap[targetKey] = targetIdMap[targetKey] || [];
        targetIdMap[targetKey].push({ definition: object, location });
        allTargetedKeys.add(targetKey);
        if (zone.surfaceKey) {
            if (zone.key === 'underwater') {
                waterExits.add(targetKey);
            } else {
                waterEntrances.add(targetKey);
            }
            return;
        }
        if (outsideZones.includes(zone.key)
            // There are a few special "entrances" inside other zones
            || zone.key === 'tomb' && object.targetZone === 'cocoon'
            || zone.key === 'treeVillage' && object.targetZone === 'forestTemple'
            || zone.key === 'lakeTunnel' && object.targetZone === 'helix'
            || zone.key === 'warTemple' && object.targetZone === 'lab'
            || zone.key === 'lab' && object.targetZone === 'tree'
            || zone.key === 'grandTemple' && object.targetZone === 'gauntlet'
            || zone.key === 'grandTemple' && object.targetZone === 'holySanctum'
        ) {
            if (outsideZones.includes(zone.key)) {
                if (area.isSpiritWorld) {
                   connectedSpiritEntrances.add(targetKey);
                } else {
                   connectedNormalEntrances.add(targetKey);
                }
            }
            if (area.isSpiritWorld) {
                spiritExits.add(targetKey);
            } else {
                normalExits.add(targetKey);
            }
        } else {
            if (area.isSpiritWorld) {
                spiritEntrances.add(targetKey);
            } else {
                normalEntrances.add(targetKey);
            }
        }
    });
    if (normalEntrances.size !== normalExits.size) {
        console.error(`initial normal entrances/exits: ${normalEntrances.size}/${normalExits.size}`);
        console.error([...normalEntrances]);
        console.error([...normalExits]);
        return;
    }
    if (spiritEntrances.size !== spiritExits.size) {
        console.error(`initial spirit entrances/exits: ${spiritEntrances.size}/${spiritExits.size}`);
        console.error([...spiritEntrances]);
        console.error([...spiritExits]);
        return;
    }

    // Collect a list of all unreachable spirit entrance targets so we can easily exclude them from invalid assignments.
    const allUnreachableSpiritExits: string[] = [];
    for (const unreachableExit of unreachableSpiritExitGroups) {
        allUnreachableSpiritExits.push(...unreachableExit);
    }
    const forbiddenSpiritExitsKeysByEntranceKey: {[key: string]: string[]} = {};

    //console.log('EXIT ONLY ENTRANCE ASSIGNMENTS:');
    // Assign all unreachable entrances first to a random entrance with other connections.
    // Currently this is only done for the Spirit World as the only unreachable exit in the material world
    // is the top of the money maze which has no checks or other entrances.
    for (const unreachableExits of unreachableSpiritExitGroups) {
        // Choose one entrance in the group to assign as a forced connection through a reachable
        // exit.
        const unreachableExit = random.shuffle(unreachableExits)[0];
        for (const exitGroup of random.shuffle(connectedExitGroups)) {
            const spiritExits = exitGroup.spiritEntranceTargets?.length ?? 0;
            const normalExits = exitGroup.normalEntranceTargets?.length ?? 0;
            const immutableExits = exitGroup.immutableEntranceTargets?.length ?? 0;
            // This group is no longer useable if all but one entrances have been assigned
            // to unreachable entrances.
            if (!exitGroup.spiritEntranceTargets?.length
                || spiritExits + normalExits + immutableExits < 2
            ) {
                continue;
            }
            const entrance = random.removeElement(exitGroup.spiritEntranceTargets);
            assignEntranceExitPair(unreachableExit, entrance);
            // If only spirit world exits remain, mark them all as forbidden to match with
            // any other unreachable spirit entrange targets, otherwise this strategy may fail
            // to actually connect this unreachable exit group to reachable areas.
            // For example, it may pair the other end with another unreachable exit group or even to
            // another door in the same unreachable exit group.
            if (normalExits + immutableExits <= 0) {
                for (const otherEntrance of exitGroup.spiritEntranceTargets) {
                    forbiddenSpiritExitsKeysByEntranceKey[otherEntrance] = allUnreachableSpiritExits;
                }
            }
            break;
        }
    }

    //console.log('NORMAL LOOPABLE ENTRANCE ASSIGNMENTS:');
    // Assign loopable entrances first to make sure the entire graph is connected.
    for (const loopableEntrancePair of random.shuffle(normalLoopableEntrancePairs)) {
        const exit = random.element([...connectedNormalEntrances]);
        assignEntranceExitPair(loopableEntrancePair.outerTarget, exit);
        connectedNormalEntrances.add(loopableEntrancePair.innerTarget);
    }
    //console.log('SPIRIT LOOPABLE ENTRANCE ASSIGNMENTS:');
    for (const loopableEntrancePair of random.shuffle(spiritLoopableEntrancePairs)) {
        const exit = random.element([...connectedSpiritEntrances]);
        assignEntranceExitPair(loopableEntrancePair.outerTarget, exit);
        connectedSpiritEntrances.add(loopableEntrancePair.innerTarget);
    }

    function assignEntranceExitPair(targetIdOfEntrance: string, targetIdOfExit: string) {
        let entranceZone: string, entranceTarget: string, exitZone: string, exitTarget: string;
        if (!targetIdMap[targetIdOfEntrance]) {
            debugger;
        }
        for (const entrance of targetIdMap[targetIdOfEntrance]) {
            if (allTargetedKeys.has(entrance.location.zoneKey + ':' + entrance.definition.id)) {
                entranceZone = entrance.location.zoneKey;
                entranceTarget = entrance.definition.id;
            }
        }
        if (!entranceZone) {
            console.error('Could not find a targeted entrance that targets', targetIdOfEntrance);
            return;
        }
        if (!targetIdMap[targetIdOfExit]) {
            debugger;
        }
        for (const entrance of targetIdMap[targetIdOfExit]) {
            if (allTargetedKeys.has(entrance.location.zoneKey + ':' + entrance.definition.id)) {
                exitZone = entrance.location.zoneKey;
                exitTarget = entrance.definition.id;
            }
        }

        if (!exitZone) {
            console.error('Could not find a targeted exit that targets', targetIdOfExit);
            return;
        }

        for (const zone in zoneEntranceMap) {
            if (fixedNimbusCloudZones.has(zone)) {
                continue;
            }
            if (zoneEntranceMap[zone] === targetIdOfEntrance) {
                zoneEntranceMap[zone] = `${exitZone}:${exitTarget}`;
                // console.log(zone + ' => ' + zoneEntranceMap[zone]);
                fixedNimbusCloudZones.add(zone);
            }
        }

        if (!targetIdMap[targetIdOfEntrance]) {
            debugger;
        }

        for (const entrance of targetIdMap[targetIdOfEntrance]) {
            /*console.log(
                `${entrance.location.zoneKey}::${entrance.definition.id}`, '=>',
                `${exitZone}::${exitTarget}`
            );*/
            entrance.definition.targetZone = exitZone;
            entrance.definition.targetObjectId = exitTarget;
            if (entrance.definition.status === 'cracked') {
                entrance.definition.status = 'blownOpen';
            }
        }
        for (const exit of targetIdMap[targetIdOfExit]) {
            /*console.log(
                `${exit.location.zoneKey}::${exit.definition.id}`, '=>',
                `${entranceZone}::${entranceTarget}`
            );*/
            exit.definition.targetZone = entranceZone;
            exit.definition.targetObjectId = entranceTarget;
        }
        // Remove assigned targets so they cannot be used in the pool any longer.
        for (const set of [
            normalEntrances, spiritEntrances, normalExits, spiritExits,
            connectedNormalEntrances, connectedSpiritEntrances,
        ]) {
            set.delete(targetIdOfExit);
            set.delete(targetIdOfEntrance);
        }

        if (normalEntrances.size !== normalExits.size) {
            console.error(`after assignEntranceExitPair ${targetIdOfEntrance} -> ${targetIdOfExit}`);
            console.error(`normal entrances/exits: ${normalEntrances.size}/${normalExits.size}`);
            console.error([...normalEntrances]);
            console.error([...normalExits]);
            return;
        }
        if (spiritEntrances.size !== spiritExits.size) {
            console.error(`after assignEntranceExitPair ${targetIdOfEntrance} -> ${targetIdOfExit}`);
            console.error(`spirit entrances/exits: ${spiritEntrances.size}/${spiritExits.size}`);
            console.error([...spiritEntrances]);
            console.error([...spiritExits]);
            return;
        }
        if (waterEntrances.size !== waterExits.size) {
            console.error(`after assignEntranceExitPair ${targetIdOfEntrance} -> ${targetIdOfExit}`);
            console.error(`water entrances/exits: ${waterEntrances.size}/${waterExits.size}`);
            console.error([...waterEntrances]);
            console.error([...waterExits]);
            return;
        }
    }

    //console.log('RESTRICTED ASSIGNMENTS:');
    // Make sure any spirit exits with entrance restrictions are assigned first to make sure
    // an option that satisfies the restrictions will be available.
    for (const spiritEntranceId of Object.keys(forbiddenSpiritExitsKeysByEntranceKey)) {
        const badEntrances = forbiddenSpiritExitsKeysByEntranceKey[spiritEntranceId];
        const spiritExitId = random.shuffle([...spiritExits]).filter(entrance => !badEntrances.includes(entrance))[0];
        assignEntranceExitPair(spiritEntranceId, spiritExitId);
    }

    //console.log('GENERAL ASSIGNMENTS:');
    for (const entrancePairing of [
        [normalEntrances, normalExits],
        [spiritEntrances, spiritExits],
        [waterEntrances, waterExits],
    ]) {
        const [entrances, exits] = entrancePairing;
        const exitIds = [...exits];
        for (const entranceId of random.shuffle([...entrances])) {
            const exitId = exitIds.pop();
            assignEntranceExitPair(entranceId, exitId);
        }
    }
    for (const [pitTargets, pitEntrances] of [
        <const>[normalPitTargets, normalPitEntrances],
        <const>[spiritPitTargets, spiritPitEntrances],
    ]) {
        const targetIds = [...pitTargets];
        for (const pitEntrance of random.shuffle(pitEntrances)) {
            const exitId = targetIds.pop();
            const [zone, objectId] = exitId.split(':');
            pitEntrance.targetZone = zone;
            pitEntrance.targetObjectId = objectId;
        }
    }
    verifyNodeConnections();
}

