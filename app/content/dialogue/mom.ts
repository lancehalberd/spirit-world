import { dialogueHash } from 'app/content/dialogue/dialogueHash';

dialogueHash.mom = {
    key: 'mom',
    options: [
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: [],
            },
            text: [
                `Welcome home son!
                {|}Our cave is under development, try again later!
                {|}Talk to me again if you want a hint.`,
                `I'm your mom. I'm a human disguised as a Vanara...
                {|}Actually I just don't have my own graphics yet!
                {|}You should head Southeast to the Vanara Village if you want to learn more about your powers.`,
                `That's all I have to tell you for now!`
            ],
            repeatIndex: 0,
        },
    ],
};
