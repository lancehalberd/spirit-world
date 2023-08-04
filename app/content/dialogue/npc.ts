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
                {
                    dialogueIndex: 29,
                    text: `Those gloves are gorgeous! Let's take them to a museum.{|} What, you're putting them on? Stop!`,
                },
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
                {
                    dialogueIndex: 30,
                    dialogueType: 'hint',
                    text: `Does your key fit in the lock?`,
                },
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
                {
                    dialogueIndex: 31,
                    dialogueType: 'hint',
                    text: `We've tried picking the lock and breaking it open,{|} but nobody could open this chest!`,
                },
            ],
            notes: `The citizen tells the player this is an interesting chest to try and open`
        },
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: [],
            },
            text: [
                {
                    dialogueIndex: 32,
                    text: `Hello.`,
                },
                {
                    dialogueIndex: 33,
                    text: `It's a lovely day.`,
                },
                {
                    dialogueIndex: 34,
                    text: `It's nice to see a friendly face.`,
                },
            ],
            repeatIndex: 1,
        },
    ],
};
