import {dialogueHash} from 'app/content/dialogue/dialogueHash';

dialogueHash.vanaraCommander = {
    key: 'vanaraCommander',
    options: [
        {
            logicCheck: {
                requiredFlags: ['spiritKingForestTemple'],
                excludedFlags: [],
            },
            isExclusive: true,
            text: [
                {
                    dialogueIndex: 228,
                    text: `
                        One day I'll have a lot to talk to you about, but for now just go out and enjoy your adventure.
                    `,
                },
            ],
        },
        {
            logicCheck: {
                requiredFlags: ['vanaraCommanderBeasts'],
                excludedFlags: ['spiritKingForestTemple'],
            },
            isExclusive: true,
            text: [
                {
                    dialogueIndex: 69,
                    dialogueType: 'hint',
                    text: `There is a portal to the Material World here on the bridge.
                    {|}If you use it, you can find a shortcut back to the lake, but I warn you, it isn't for the faint of heart!
                    `,
                },
                {
                    dialogueIndex: 70,
                    dialogueType: 'reminder',
                    text: `The Spirit King will request your help to defeat the Spirit Beasts, I'm certain of it.
                    {|}You can reach the Spirit King by traveling through the portal in the Grand Temple to the Spirit World.
                    {|}The Grand Temple is just north of the Holy City in the Northeast.`,
                },
                {
                    dialogueIndex: 71,
                    dialogueType: 'reminder',
                    text: `Remember to check your map if you are ever uncertain of where to go.`,
                },
                {
                    dialogueIndex: 72,
                    text: `I know you have many questions, but we will have to talk more later.`,
                },
            ],
            repeatIndex: 0,
        },
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: ['vanaraCommanderBeasts'],
            },
            isExclusive: true,
            text: [
                {
                    dialogueIndex: 73,
                    dialogueType: 'quest',
                    text: `
                    Congratulations on scaling the Helix!
                    {|}With this you have accepted your powers and responsibilities as a true Vanara and will be granted
                    knowledge that very few are trusted with.
                    {|}You might have already realized this, but we Vanara aren't from this world.
                    {|}We traveled the stars on this ship, but there was an accident and we crashed here.
                    {|}I'm sure you have many questions, but we detected a big problem while you were climbing the Helix.
                    {|}Several powerful Spirit Beasts have escaped into the Material Realm and are attacking the Holy City.
                    {|}Unfortunately, it appears another Vanara is responsible for releasing them.
                    {|}We cannot hunt the beasts ourselves so we would like to send you to help.
                    {|}North of the Holy City is the Grand Temple.
                    At its heart is a portal that will take you to the Jade Palace.
                    {|}Go there and speak with the Spirit King, I'm sure you will be expected.
                    {|}And here, take this with you before you go.
                    {flag:elementalBeastsEscaped}
                    {flag:helixTeleporterUnlocked}
                    {flag:vanaraCommanderBeasts}
                    {item:weapon=2}`,
                },
            ],
        },
    ],
};
