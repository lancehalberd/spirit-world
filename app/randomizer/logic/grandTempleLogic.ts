import {
    canPressHeavySwitches,
    canUseTeleporters,
    hasReleasedBeasts,
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
            { objectId: 'gauntletEntrance', logic: canPressHeavySwitches },
        ],
    },
    {
        zoneId,
        nodeId: 'jadePalace',
        paths: [
            { nodeId: 'grandTemple', logic: canUseTeleporters }
        ],
        // The NPC for opening the pod only appears after the beasts have escaped.
        flags: [{flag: 'jadePalaceTeleporterUnlocked', logic: hasReleasedBeasts}],
        entranceIds: [
            'jadePalaceEntrance',
            'holySanctumEntrance',
            'jadePalaceDreamTeleporter',
        ],
        exits: [
            { objectId: 'jadePalaceEntrance' },
            { objectId: 'holySanctumEntrance' },
            { objectId: 'jadePalaceDreamTeleporter' },
        ],
    },
];
