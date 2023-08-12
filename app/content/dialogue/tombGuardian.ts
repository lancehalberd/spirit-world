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
                {
                    dialogueIndex: 60,
                    dialogueType: 'quest',
                    text: `You have come far, but there is no going back after this step.
                    {|}Show me your determination if you wish to proceed!
                    {flag:cocoonBossStarted}
                    `,
                },
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
                {
                    dialogueIndex: 61,
                    dialogueType: 'hint',
                    text:`You can use your teleportation skill to leave here through that portal.
                    {|} Move your Astral Body where you want to go and press [B_TOOL] to teleport.
                    `,
                },
            ],
        },
        {
            logicCheck: {
                requiredFlags: ['cocoonBoss', '$isSpirit'],
                excludedFlags: ['$teleportation'],
                zones: ['cocoon'],
            },
            isExclusive: true,
            text: [
                {
                    dialogueIndex: 98,
                    text:`I am impressed!{|}
                    Step through the portal and speak to me to learn my final technique.`
                },
            ],
        },
        {
            logicCheck: {
                requiredFlags: ['cocoonBoss'],
                excludedFlags: ['$teleportation', '$isSpirit'],
                zones: ['cocoon'],
            },
            isExclusive: true,
            text: [
                {
                    dialogueIndex: 62,
                    dialogueType: 'quest',
                    text:`You are ready to learn my final technique.{|}
                    You won't be able to travel between the material and spirit worlds as freely
                    as a pure blooded Vanara, but this should be enough for you to climb the Helix.
                    {item:teleportation}`,
                },
            ],
        },
        {
            logicCheck: {
                requiredFlags: ['$spiritSight', '$astralProjection'],
                excludedFlags: [],
            },
            isExclusive: true,
            text: [
                {
                    dialogueIndex: 63,
                    dialogueType: 'quest',
                    text:`Now that you can touch the Spirit World you can open the door behind me.
                    {|}Be warned though, there is a reason this place is so hidden.`,
                },
                {
                    dialogueIndex: 64,
                    dialogueType: 'hint',
                    text: `Press [B_MEDITATE] to gaze into the Spirit World and find a way to open the door.`,
                },
            ],
        },
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: ['$spiritSight'],
            },
            isExclusive: true,
            text: [
                {
                    dialogueIndex: 65,
                    dialogueType: 'quest',
                    text: `Well done young one, I am the Vanara Guardian.
                    {|}I protect the resting place of the Vanara.
                    {|}You've come to learn more about your spirit powers?
                    {|}I knew this day would come eventually...
                    {|}I can teach you to look into the spirit realm,
                    {|}but you won't be able to interact with it.
                    {item:spiritSight}
                    There may be a way to enhance your powers further.
                    {|}Did you know your mother is a descendant of the summoner clan?
                    {|}They weren't supposed to pass their knowledge on but it still survives in certain families.
                    {|}The summoners used special tools to enhance their powers,
                    {|}perhaps your mother could tell you more.
                    `,
                },
            ],
        },
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: ['tombTeleporter'],
            },
            isExclusive: true,
            text: [
                {
                    dialogueIndex: 66,
                    dialogueType: 'hint',
                    text:`You can use your Spirit Sight to exit this room.
                    {|}One of these pots is not like the other.
                    {addCue: One of the pots is special. Hold [B_MEDITATE] to gaze into the spirit world.}
                    `,
                },
            ],
        },
        {
            logicCheck: {
                requiredFlags: ['tombTeleporter'],
                excludedFlags: [],
            },
            isExclusive: true,
            text: [
                {
                    dialogueIndex: 67,
                    dialogueType: 'quest',
                    text:`I've tought you all I can for now.
                    {|}Step into this teleporter to return to the lake.
                    {|}Use the teleporter to return here once you can touch the Spirit World.`,
                },
                {
                    dialogueIndex: 68,
                    dialogueType: 'reminder',
                    text: `Talk to your mother to learn more about the summoners.
                    {|}Step into the teleporter to return to the lake.
                    {|}Use the teleporter to return here once you can touch the Spirit World.`,
                },
            ],
        },
    ],
};
