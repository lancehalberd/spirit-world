import { dialogueHash } from 'app/content/dialogue/dialogueHash';
import { addBurstEffect } from 'app/content/effects/animationEffect';
import { removeObjectFromArea } from 'app/utils/objects';

dialogueHash.tombGuardian = {
    key: 'tombGuardian',
    mappedOptions: {
        teleport: (state: GameState) => {
            const guardian = state.areaInstance.objects.find(t => t.definition?.id === 'cocoonGuardian') as NPC;
            addBurstEffect(state, guardian);
            removeObjectFromArea(state, guardian);
            return '';
        },
    },
    options: [
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: ['$catEyes'],
            },
            isExclusive: true,
            text: [
                {
                    dialogueIndex: 174,
                    text: `Aren't you a curious one?`,
                },
                {
                    dialogueIndex: 175,
                    text: `Seeing you here like this makes me wonder what else you could accomplish?`,
                },
                {
                    dialogueIndex: 176,
                    text: `Don't expect any advice from me though, you clearly don't need it.`,
                },
            ],
            repeatIndex: 2,
        },
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
                    {@tombGuardian.teleport}
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
                    text:`Now that you can teleport you can travel through the Dreaming to reach
                    different places.{|}Look for a portal in the Dreaming that will take you back to the lake.
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
            allowSpirit: true,
            isExclusive: true,
            text: [
                {
                    dialogueIndex: 98,
                    text:`I am impressed!{|}
                    Step through the portal and I'll show you the way to the Spirit Tree.`
                },
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
                {
                    dialogueIndex: 62,
                    dialogueType: 'quest',
                    text:`You have proven you are ready to meet the Spirit Tree, but you will not find her even here in the Spirit World.{|}
                    She presides over the Realm of the Dreaming where the Vanara rest and prepare to join our waking world.{|}
                    You may now use one of these empty pods to visit the Dreaming yourself.
                    {addCue: Face a pod and press [B_PASSIVE] to get in}`,
                },
            ],
        },
        {
            logicCheck: {
                requiredFlags: ['$spiritSight', '$astralProjection'],
                excludedFlags: ['tombExit'],
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
                requiredFlags: ['$spiritSight', 'tombTeleporter'],
                excludedFlags: ['tombExit'],
            },
            isExclusive: true,
            text: [
                {
                    dialogueIndex: 177,
                    dialogueType: 'quest',
                    text:`There may be a way to enhance your powers further.
                    {|}Did you know your mother is a descendant of the summoner clan?
                    {|}They weren't supposed to pass their knowledge on but it still survives in certain families.
                    {|}The summoners used special tools to enhance their powers,
                    perhaps your mother could tell you more.`,
                },
            ],
        },
        {
            logicCheck: {
                requiredFlags: ['spiritSightTraining'],
                excludedFlags: ['$spiritSight', 'tombExit'],
            },
            isExclusive: true,
            text: [
                {
                    dialogueIndex: 178,
                    dialogueType: 'quest',
                    text: `Approach the pots and await my instructions.`,
                },
            ],
        },
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: ['spiritSightTraining', '$spiritSight'],
            },
            isExclusive: true,
            text: [
                {
                    dialogueIndex: 65,
                    dialogueType: 'quest',
                    text: `
                    {playTrack:vanaraDreamTheme}
                    Well done young one, I am the Vanara Guardian.
                    I protect the resting place of the Vanara.
                    {|}You were given a warning for the Spirit Tree?
                    {|}The Spirit Tree watches over all Vanara, even the little rebels in your village.
                    {|}So relax and know that your warning has reached her already, however...
                    {|}If you wish to see her yourself, I can help you unlock your spirit powers.
                    {|}Indeed you have already awakened your Spirit Sight, but you have not yet learned to look beyond what you see.
                    {|}The Spirit World is all around us and you can see it already, you just have to bring it into focus.
                    {flag:spiritSightTraining}`,
                },
            ],
        },
        // Unused text for Spirit Sight training.
        //"Look at these pots."
        //"To normal eyes, they are identical, but you can see beyond the material."
        //"The difference feels subtle, but once you bring it into focus, it will be as night and day."
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
                    {|}The pot is not the only thing hidden in the Spirit World.
                    `,
                },
            ],
        },
        {
            logicCheck: {
                requiredFlags: ['tombTeleporter'],
                excludedFlags: ['$astralProjection'],
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
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: [],
            },
            isExclusive: true,
            text: [
                {
                    dialogueIndex: 163,
                    text: `We guardians help the Spirit Tree watch over this world.`,
                },
                {
                    dialogueIndex: 164,
                    text: `It is not our place to interfere even when we wish we could.`,
                },
            ],
            repeatIndex: 0,
        },
    ],
};
