import {
    dreamSpiritWorld,
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
            // This portal only appears once dream pods have been unlocked
            // that connect to the Spirit World in the dream.
            {nodeId: 'dreamSpirit', logic: dreamSpiritWorld},
            {nodeId: 'dreamEntranceInner', logic: hasTeleportation},
        ],
        entranceIds: ['cocoonTeleporter', 'helixTeleporter'],
        exits: [
            {objectId: 'cocoonTeleporter'},
            {objectId: 'helixTeleporter'},
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
            {objectId: 'tombTeleporter'},
            {objectId: 'lakeTeleporter'},
        ],
    },
    {
        zoneId,
        nodeId: 'dreamSpirit',
        paths: [
            // This portal only appears once dream pods have been unlocked
            // that connect to the Spirit World in the dream.
            {nodeId: 'dreamMain', logic: dreamSpiritWorld},
        ],
        entranceIds: ['forestTempleTeleporter', 'jadePalaceTeleporter'],
        exits: [
            {objectId: 'forestTempleTeleporter'},
            {objectId: 'jadePalaceTeleporter'},
        ],
        complexNpcs: [
            // Note that currently the spirit tree is actually a decoration that behaves like an NPC.
            {dialogueKey: 'spiritTree', optionKey: 'randomizerReward'},
        ],
    },
];
