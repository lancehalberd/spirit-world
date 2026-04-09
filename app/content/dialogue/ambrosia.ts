import {dialogueHash} from 'app/content/dialogue/dialogueHash';

const FIRST_PEACH_QUEST_GOAL = 20;
const OTHER_PEACH_QUEST_GOAL = 30;

dialogueHash.ambrosia = {
    key: 'ambrosia',
    mappedOptions: {
        help: `Great!
            {|}Take this basket to collect peaches. If you bring me ${FIRST_PEACH_QUEST_GOAL} peaches I'll give you a treat!
            {@ambrosia.helpItem}`,
        helpItem: `{item:peachBasket}{flag:helpAmbrosia}`,
        // This reward can be randomized.
        questItem: `{item:healthPotion}{flag:peachQuestCompleted}`,
        noHelp: 'Oh okay. You can always come back if you change your mind.',
        firstQuest(state: GameState) {
            if (state.hero.savedData.collectibles.peach >= FIRST_PEACH_QUEST_GOAL) {
                state.hero.savedData.collectibles.peach -= FIRST_PEACH_QUEST_GOAL;
                if (state.randomizerState) {
                    return `{@ambrosia.questItem}`;
                }
                return `Wow, look at all these delicious peaches. Hang on one second...
                    {wait:500}
                    Here's your reward, this might save you in a pinch!
                    {@ambrosia.questItem}`
            }
            return `Looks like you still need to find a few more.`
        },
        secondQuest(state: GameState) {
            if (state.hero.savedData.collectibles.peach >= OTHER_PEACH_QUEST_GOAL) {
                state.hero.savedData.collectibles.peach -= OTHER_PEACH_QUEST_GOAL;
                // Note that this reward is never randomized.
                return `You brought more? Okay, hang on a second...
                    {wait:500}
                    Here's your treat!
                    {item:healthPotion}`
            }
            return `Looks like you haven't gathered enough yet.`
        },
    },
    options: [
        {
            logicCheck: {
                requiredFlags: [],
                // In the base game we could use $peachBasket here, but for randomizer, we need to keep
                // this dialogue until the player gets the first check from her.
                excludedFlags: ['helpAmbrosia'],
            },
            isExclusive: true,
            text: [
                {
                    dialogueIndex: 229,
                    dialogueType: 'quest',
                    text: (state: GameState) => {
                        // No need for this dialogue in randomizer.
                        if (state.randomizerState) {
                            return `{@ambrosia.helpItem}`;
                        }
                        return `You look like you need something to do to keep you out of trouble.
                        {|}If you help me collect some peaches, I'll give you something good.
                        {choice: Help gather peaches?|Yes:ambrosia.help|No:ambrosia.noHelp}`;
                    },
                },
            ],
        },
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: ['peachQuestCompleted', '$peachBasket'],
            },
            isExclusive: true,
            text: [
                {
                    // This dialogue should only occur in randomizer.
                    dialogueIndex: 201,
                    dialogueType: 'subquest',
                    text: 'If you find a peach basket out there you can bring me some peaches for another prize.',
                },
            ],
        },
        {
            logicCheck: {
                requiredFlags: ['$peachBasket'],
                excludedFlags: ['peachQuestCompleted'],
            },
            isExclusive: true,
            text: [
                {
                    dialogueIndex: 230,
                    dialogueType: 'subquest',
                    text: (state: GameState) => {
                        // No need for this dialogue in randomizer.
                        if (state.randomizerState) {
                            return `{@ambrosia.firstQuest}`;
                        }
                        return 'Did bring the peaches already?{@ambrosia.firstQuest}';
                    },
                },
                {
                    dialogueIndex: 231,
                    dialogueType: 'hint',
                    text: `Make sure you aren't hurt when you collect peaches, otherwise you won't be able resist eating them yourself.`,
                },
            ],
        },
        {
            logicCheck: {
                requiredFlags: ['$peachBasket', 'peachQuestCompleted'],
                excludedFlags: [],
            },
            isExclusive: true,
            text: [
                {
                    dialogueIndex: 232,
                    dialogueType: 'subquest',
                    text: `If you bring me ${OTHER_PEACH_QUEST_GOAL} I'll make you another drink.{@ambrosia.secondQuest}`,
                },
                {
                    dialogueIndex: 233,
                    text: `No freebies, if you want a treat, you'll have to work for it!`,
                },
            ],
        },
    ],
};
