import { dialogueHash } from 'app/content/dialogue/dialogueHash';

dialogueHash.vanaraCommander = {
    key: 'vanaraCommander',
    options: [
        {
            logicCheck: {
                requiredFlags: ['$charge'],
                excludedFlags: [],
                zones: [],
            },
            isExclusive: true,
            text: [
                `If you use the portal behind me to return to the Material World, you will find a shortcut
                back to the lake, but I warn you, it isn't for the faint of heart!
                `
            ],
        },
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: ['$charge'],
                zones: [],
            },
            isExclusive: true,
            text: [
                `I'm impressed that you've made it all the way to the top of the Helix!
                {|}You might have already realized this, but we Vanara aren't from this world,
                we traveled the stars on this ship, but there was an accident and we crashed here.
                {|}I'm sure you have many questions, but we detected a big problem while you were climbing the Helix.
                {|}Several powerful Spirit Beasts have escaped into the Material Realm and are attacking the Holy City.
                {|}Unfortunately, it appears another Vanara is responsible for releasing them.
                {|}Take this and go to Holy City and see if you can help their Hero protect the people.
                {flag:elementalBeastsEscaped}
                {item:charge:1}`
            ],
        },
    ],
};
