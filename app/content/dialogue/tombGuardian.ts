import { dialogueHash } from 'app/content/dialogue/dialogueHash';

dialogueHash.tombGuardian = {
    key: 'tombGuardian',
    options: [
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: ['cocoonBossStarted'],
                zones: ['cocoon'],
            },
            isExclusive: true,
            text: [
                `You have come so far in such a short time, but are you worthy of taking the next step?
                {|}Prove your worth and show me what you've learned!
                {flag:cocoonBossStarted}
                `
            ],
        },
        {
            logicCheck: {
                requiredFlags: ['$teleportation'],
                excludedFlags: [],
                zones: ['cocoon'],
            },
            isExclusive: true,
            text: [
                `You can use your teleportation skill to leave here through that portal.
                {|} Move your Astral Body where you want to go and press [B_TOOL] to teleport.
                `
            ],
        },
        {
            logicCheck: {
                requiredFlags: ['cocoonBoss'],
                excludedFlags: ['$teleportation'],
                zones: ['cocoon'],
            },
            isExclusive: true,
            text: [
                `You are ready to learn my final technique.{|}
                You won't be able to travel between the material and spirit worlds as freely
                as a pure blooded Vanara, but this should be enough for you to climb the Helix.
                {item:teleportation}`
            ],
        },
        {
            logicCheck: {
                requiredFlags: ['$spiritSight', '$astralProjection'],
                excludedFlags: [],
            },
            isExclusive: true,
            text: [
                `Now that you can touch the Spirit World you can open the door behind me.`,
                `Press [B_PASSIVE] to gaze into the Spirit World and find a way to open the door.`,
            ],
        },
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: ['$spiritSight'],
            },
            isExclusive: true,
            text: [
                `You've come to learn more about your spirit powers?
                {|}I knew this day would come eventually...
                {|}I can teach you to look into the spirit realm,
                {|}but you won't be able to interact with it.
                {|}The summoners used special tools for their powers,
                {|}maybe your mother could tell you more.
                {item:spiritSight}`,
            ],
        },
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: ['tombTeleporter'],
            },
            isExclusive: true,
            text: [
                `You can use your Spirit Sight to exit this room.
                {|} One of these pots is not like the other.
                {addCue: One of the pots is special. Hold [B_MEDITATE] to gaze into the spirit world.}
                `,
            ],
        },
        {
            logicCheck: {
                requiredFlags: ['tombTeleporter'],
                excludedFlags: [],
            },
            isExclusive: true,
            text: [
                `I've tought you all I can for now.
                {|}Step into this teleporter to return to the lake.
                {|}Use the teleporter to return here once you can touch the Spirit World.`,
                `Talk to your mother to learn more about the summoners.
                {|}Step into the teleporter to return to the lake.
                {|}Use the teleporter to return here once you can touch the Spirit World.`,
            ],
        },
    ],
};
