import { dialogueHash } from 'app/content/dialogue/dialogueHash';

dialogueHash.tombGuardian = {
    key: 'tombGuardian',
    options: [
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
                {|}Use the teleporter to return once you can touch the Spirit World.`,
                `Talk to your mother to learn more about the summoners.
                {|}The door in the back will take you to the surface.`,
            ],
        },
    ],
};
