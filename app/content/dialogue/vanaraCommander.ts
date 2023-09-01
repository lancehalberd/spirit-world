import { dialogueHash } from 'app/content/dialogue/dialogueHash';

dialogueHash.vanaraCommander = {
    key: 'vanaraCommander',
    options: [
        {
            logicCheck: {
                requiredFlags: ['vanaraCommanderBeasts'],
                excludedFlags: [],
                zones: [],
            },
            isExclusive: true,
            text: [
                {
                    dialogueIndex: 69,
                    dialogueType: 'hint',
                    text: `If you use the portal behind me to return to the Material World, you will find a shortcut
                    back to the lake, but I warn you, it isn't for the faint of heart!
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
                zones: [],
            },
            isExclusive: true,
            text: [
                {
                    dialogueIndex: 73,
                    dialogueType: 'quest',
                    text: `I'm impressed that you've made it here already!
                    {|}You might have already realized this, but we Vanara aren't from this world.
                    {|}We traveled the stars on this ship, but there was an accident and we crashed here.
                    {|}I'm sure you have many questions, but we detected a big problem while you were climbing the Helix.
                    {|}Several powerful Spirit Beasts have escaped into the Material Realm and are attacking the Holy City.
                    {|}Unfortunately, it appears another Vanara is responsible for releasing them.
                    {|}We cannot hunt the beasts ourselves so we would like to send you to help.
                    {|}North of the Holy City is the Grand Temple.
                    {|}At its heart is a portal that will take you to the Jade Palace.
                    {|}Go there and speak with the Spirit King, I'm sure you will be expected.
                    {|}And here, take this with you before you go.
                    {flag:elementalBeastsEscaped}
                    {flag:vanaraCommanderBeasts}
                    {item:weapon=2}`,
                },
            ],
        },
    ],
};
