import {
    canUseTeleporters,
} from 'app/content/logic';


const zoneId = 'grandTemple';
export const grandTempleNodes: LogicNode[] = [
    {
        zoneId,
        nodeId: 'grandTemple',
        npcs: [
            {loot: {type: 'dialogueLoot', id: 'generousPriest', lootType: 'money', lootAmount: 10}},
        ],
        paths: [
            { nodeId: 'jadePalace', logic: canUseTeleporters }
        ],
        entranceIds: [
            'grandTempleEntrance',
            'gauntletEntrance',
        ],
        exits: [
            { objectId: 'grandTempleEntrance' },
            { objectId: 'gauntletEntrance' },
        ],
    },
    {
        zoneId,
        nodeId: 'jadePalace',
        paths: [
            { nodeId: 'grandTemple', logic: canUseTeleporters }
        ],
        entranceIds: [
            'jadePalaceEntrance',
            'holySanctumEntrance',
        ],
        exits: [
            { objectId: 'jadePalaceEntrance' },
            { objectId: 'holySanctumEntrance' },
        ],
    },
];
