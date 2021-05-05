import { dialogueHash } from 'app/content/dialogue/dialogueHash';

dialogueHash.tombGuardian = {
    key: 'tombGuardian',
    options: [
        {
            logicCheck: {
                requiredFlags: ['$teleportation'],
                excludedFlags: [],
                zones: ['cocoon'],
            },
            isExclusive: true,
            progressFlag: 'cocoonTeleporter',
            text: [
                `You can use your teleportation skill to leave here through that portal.
                {|} Move your Astral Body where you want to go and press {B_TOOL} to teleport.
                `
            ],
        },
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: ['$teleportation'],
                zones: ['cocoon'],
            },
            isExclusive: true,
            progressFlag: 'cocoonTeleporter',
            text: [
                `This is the Cocoon, but it is still under construction.
                {|}Normally you would need to fight a boss to get to me, but I'll just give you this for now.
                {teleportation:1}`
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
                `Press {B_PASSIVE} to gaze into the Spirit World and find a way to open the door.`,
            ],
        },
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: ['$spiritSight'],
            },
            isExclusive: true,
            progressFlag: 'tombTeleporter',
            text: [
                `You've come to learn more about your spirit powers?
                {|}I knew this day would come eventually...
                {|}I can teach you to look into the spirit realm,
                {|}but you won't be able to interact with it.
                {|}The summoners used special tools for their powers,
                {|}maybe your mother could tell you more.
                {spiritSight:1}`,
            ],
        },
        {
            logicCheck: {
                requiredFlags: ['$spiritSight'],
                excludedFlags: [],
            },
            isExclusive: true,
            progressFlag: 'tombTeleporter',
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
