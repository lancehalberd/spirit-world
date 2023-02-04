import {
    hasSpiritSight,
} from 'app/content/logic';

import { LogicNode } from 'app/types';

const zoneId = 'grandTemple';
export const grandTempleNodes: LogicNode[] = [
    {
        zoneId,
        nodeId: 'grandTemple',
        npcs: [
            {loot: {type: 'dialogueLoot', id: 'generousPriest', lootType: 'money', lootAmount: 10}},
        ],
        paths: [
            { nodeId: 'jadePalace', logic: hasSpiritSight }
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
            { nodeId: 'grandTemple', logic: hasSpiritSight }
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
