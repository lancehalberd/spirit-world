import {
    hasTeleportation,
} from 'app/content/logic';


const zoneId = 'dream';
export const dreamNodes: LogicNode[] = [
    {
        zoneId,
        // We only need one node for the main area because either you have teleportation or you can float over the pits.
        // Note that the tutorial walls are just removed in randomizer.
        nodeId: 'dreamMain',
        paths: [
            {nodeId: 'dreamEntranceInner', logic: hasTeleportation},
        ],
        entranceIds: ['cocoonTeleporter', 'helixTeleporter'],
        exits: [
            // Don't include this as it can only be opened from beating the cocoon boss.
            //{objectId: 'cocoonTeleporter', logic: hasTeleportation},
            // Don't include this as it can only be opened from releasing the beasts.
            //{objectId: 'helixTeleporter', logic: hasTeleportation},
        ],
        complexNpcs: [
            // Note that currently the spirit tree is actually a decoration that behaves like an NPC.
            {dialogueKey: 'spiritTree', optionKey: 'randomizerReward'},
        ],
    },
    {
        zoneId,
        nodeId: 'dreamEntranceInner',
        checks: [{objectId: 'dreamSmallMoney'}],
        paths: [
            {nodeId: 'dreamMain', logic: hasTeleportation},
        ],
        entranceIds: ['tombTeleporter', 'lakeTeleporter'],
        exits: [
            {objectId: 'tombTeleporter', logic: hasTeleportation},
            {objectId: 'lakeTeleporter', logic: hasTeleportation},
        ],
    },
];
