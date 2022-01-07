import { dialogueHash } from 'app/content/dialogue/dialogueHash';

// $ means an item
// no $ is a progress flag
// $warTemple:bigKey this is a zone specific item

dialogueHash.npc = {
    key: 'npc',
    options: [
        {
            logicCheck: {
                requiredFlags: ['$gloves', '$warTemple:bigKey'],
                excludedFlags: [],
                zones: ['warTemple'],
            },
            text: [
                `Those gloves are gorgeous! Let's take them to a museum.{|} What, you're putting them on? Stop!`
            ],
            notes: `The citizen is amazed that you opened the chest.`
        },
        {
            logicCheck: {
                requiredFlags: ['$warTemple:bigKey'],
                excludedFlags: ['$gloves'],
                zones: ['warTemple'],
            },
            text: [
                `Does your key fit in the lock?`
            ],
            notes: `The citizen is curious about the key.`
        },
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: ['$warTemple:bigKey'],
                zones: ['warTemple'],
            },
            text: [
                `We've tried picking the lock and breaking it open,{|} but nobody could open this chest!`,
            ],
            notes: `The citizen tells the player this is an interesting chest to try and open`
        },
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: [],
            },
            text: [
                `Hello.`,
                `It's a lovely day.`,
                `It's nice to see a friendly face.`,
            ],
            repeatIndex: 1,
        },
    ],
};
