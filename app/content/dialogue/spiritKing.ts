import { dialogueHash } from 'app/content/dialogue/dialogueHash';

dialogueHash.spiritKing = {
    key: 'elder',
    mappedOptions: {

    },
    options: [
        {
            logicCheck: {
                requiredFlags: ['spiritKingForestTemple'],
                excludedFlags: [],
            },
            text: [
                {
                    dialogueIndex: 53,
                    dialogueType: 'quest',
                    text:`The Fertility Temple is far to the Southwest.
                    {|}Once you are done there I suggest you continue gathering better equipment before you search for the Spirit Beasts.
                    `,
                },
                {
                    dialogueIndex: 54,
                    dialogueType: 'quest',
                    text:`There is a training Gauntlet that our Champion uses underneath the Grand Temple in the material world.
                    {|}The entrance is in the back of the temple.`,
                },
                {
                    dialogueIndex: 55,
                    dialogueType: 'quest',
                    text:`There are several facilities you can find if you can reach the sky in the spirit world.`,
                },
                {
                    dialogueIndex: 56,
                    dialogueType: 'quest',
                    text:`Behind me is the Holy Sanctum where we've stored our most powerful relics.
                    {|}You'll have no luck obtaining them unless you possess the power of the elements.`,
                },
            ],
            repeatIndex: 0,
        },
        {
            logicCheck: {
                requiredFlags: ['vanaraCommanderBeasts'],
                excludedFlags: ['spiritKingForestTemple'],
            },
            text: [
                {
                    dialogueIndex: 57,
                    dialogueType: 'quest',
                    text:`Welcome child, I am the Spirit King.
                    {|}You have been sent by the Vanara to deal with the Spirit Beasts, yes?
                    {|}I will be frank, we do not trust you or the Vanara, but this situation is desperate.
                    {|}The beasts should not be able to survive long in the material world, but something is different about them.
                    {|}They appear to be growing stronger instead and are now hiding in the material world, biding their time.
                    {|}I fear you are not prepared to track down the beasts, let alone banish them from the material world.
                    {|}I have instructed the other Spirit Gods to provide aid and training if you approach them.
                    {|}I suspect you will do as you please, but we suggest visiting the Fertility Temple to the Southwest.
                    {|}In addition to providing you with new tools, you may ask if the researchers there know how the
                    Spirit Beasts are able to stay in the material world.
                    {flag:spiritKingForestTemple}
                    `,
                },
            ],
        },
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: [],
            },
            text: [
                {
                    dialogueIndex: 58,
                    dialogueType: 'quest',
                    text:`I see you've found your own way in the world so far.
                    {|}Despite what you may think, you are not forbidden from exploring the Spirit World.
                    {|}Some of the Spirit Gods may personally resent the intrusion, but all are aware of you
                    and have been ordered to help should you approach them.`,
                },
                {
                    dialogueIndex: 59,
                    text:`We will be watching your actions closely little one.`,
                },
            ],
            repeatIndex: 1,
        },
    ],
};
