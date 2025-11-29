import {dialogueHash} from 'app/content/dialogue/dialogueHash';
import {beastsDefeated, isLogicValid, someBeastDefeated} from 'app/content/logic';

dialogueHash.vanaraScientist = {
    key: 'vanaraScientist',
    mappedOptions: {
        questions(state: GameState) {
            const questions: string[] = [
                'Spirit Beasts:vanaraScientist.spiritBeasts',
                'Your Research:vanaraScientist.research',
                'Your Enemy:vanaraScientist.enemy',
            ];
            return `
                {choice:What do you want to know?
                    ${questions.join('|')}
                |That's all:vanaraScientist.goodbye
                }`;
        },
        spiritBeasts(state: GameState) {
            if (isLogicValid(state, beastsDefeated)) {
                return `

                `;
            } else if (isLogicValid(state, someBeastDefeated)) {
                return `
                    Based on your encounter with the beast we have identified they are using some kind of artificial heart as a conduit to draw
                    energy from the Spirit Realm.
                    {|}These hearts appear to be Vanaran in origin.
                    {|}Be careful, whoever created these may have the ability to do something much worse!
                    {|}At least they were smart enough not to try and build the hearts directly into the Spirit Beasts...
                `;
            } else {
                return `
                    So you want to know about the Spirit Beasts?
                    {|}We cannot say anything for certain, but if what they say about the Spirit Beasts being able so survive in the material world,
                    then it is likely someone has been using our research for nefarious purposes.
                    {|}Summoned creatures like the Spirit Beasts were chosen for maximum force and required a constant stream of energy to be channeled
                    from the Spirit Realm to sustain them.
                    {|}Without a conduit for that energy, the Spirit Beasts should burn themselves out in moments if they don't return to the Spirit World.
                    {|}There must be something providing the Spirit Beasts with energy. When you find them, search for their energy source, otherwise I fear
                    they will be unstoppable.
                `;
            }
        },
        research: `
            Unlike the Vanara, life on this planet evolved separately in the material and spirit world.
            {|}Unfortunately, this differences makes the Vanaran ecosystem we brought with us incredibly invasive here.
            {|}Without our research efforts here, the local ecosystem would have been wiped out centuries ago.
            {|}Even now we must continue our work to preserve the delicate balance between ecosystems.
        `,
        enemy(state: GameState) {
            if (isLogicValid(state, beastsDefeated)) {
                return `
                    As expected, the War God is challenging us once again.
                    {|}As has ever been the case since we arrived on this planet, the War God's ambition vastly exceeds its reach.
                    {|}We ask you to accept the War God's challenge as our champion and defeat whatever monstrosity it has devised this time.
                    {|}Perhaps when fully confronted by the futility of this conflict the War God will finally be released from this obsession.
                `;
            } else {
                return `
                    When we first arrived on this world, we were attacked by the Summoner's War God and their Spirit Beasts.
                    {|}But the War God did not anticipate the inherent strength of Vanara spirit powers and was completely outmatched.
                    {|}Afterwards the use of the Spirit Beasts was banned by a peace treaty between the Vanara and the newly appointed Spirit King.
                    {|}Since then, worship of the War God dwindled, but as is its nature it is constantly seeking the power and opportunity to
                    challenge the Vanara again.
                    {|}Whether or not the War God is responsible for releasing the beasts it is certain it seeks to use this chance to attack us.
                `;
            }
        },
        // {|}Unfortunately, this means the Vanaran ecosystem we brought with us has been steadily outcompeting the local ecosystem.
        // the native spirit life here never evolved to live in the material world on this planet.
        // {|}Spirit beings can sometimes form symbiotic bonds with material organisms that sometimes let them channel energy from the Spirit World.
        goodbye(state: GameState) {
            if (!isLogicValid(state, beastsDefeated)) {
                return `Be careful hunting down those beasts, there's not telling what kind of strange powers they might have now!`;
            } else {
                return 'It looks like some of the locals may have run off with our research, be careful!'
            }
        }
    },
    options: [
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: ['helixTeleporterUnlocked'],
                zones: ['helix'],
            },
            isExclusive: true,
            text: [
                {
                    dialogueIndex: 226,
                    text: `
                        You can use this pod to visit the Dreaming after you've talked to the captain.
                    `,
                },
            ],
        },
        {
            logicCheck: {
                requiredFlags: ['helixTeleporterUnlocked'],
                excludedFlags: [],
                zones: ['helix'],
            },
            isExclusive: true,
            text: [
                {
                    dialogueIndex: 227,
                    text: `
                        Use this pod if you want to return to the Dreaming.
                    `,
                },
            ],
        },
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: ['jadePalaceTeleporterUnlocked'],
                zones: ['grandTemple'],
            },
            isExclusive: true,
            text: [
                {
                    dialogueType: 'quest',
                    dialogueIndex: 224,
                    text: `
                        Hold that thought, I'm almost finished up here...
                        {|}Got it! {flag:jadePalaceTeleporterUnlocked}
                        In light of the recent attacks, the Spirit King has agreed to
                        let us install these pods here.
                        {|}Feel free to use them if you ever want to travel to the Dreaming.
                    `,
                },
            ],
        },
        {
            logicCheck: {
                requiredFlags: ['jadePalaceTeleporterUnlocked'],
                excludedFlags: [],
                zones: ['grandTemple'],
            },
            isExclusive: true,
            text: [
                {
                    dialogueIndex: 225,
                    text: `
                        Depending on where you need to go, traveling through the Dreaming
                        may be the fastest way to get there.
                    `,
                },
            ],
        },
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: ['forestTempleTeleporterUnlocked'],
                zones: ['forestTemple'],
            },
            isExclusive: true,
            text: [
                {
                    dialogueType: 'quest',
                    dialogueIndex: 219,
                    text: `
                        One moment, I've almost got these fixed... 
                        {|}That should do it! {flag:forestTempleTeleporterUnlocked}
                        These pods were damage in the attack, but you should be able to use
                        now to visit the Dreaming and return here easily.
                    `,
                },
            ],
        },
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: ['$cloudBoots'],
                zones: ['forestTemple'],
            },
            isExclusive: true,
            text: [
                {
                    dialogueType: 'quest',
                    dialogueIndex: 220,
                    text: `
                        We'd hidden a tool here that should be useful to you on your quest
                        before the attack. I think you should still be able to find a way to
                        reach it, but you may have to fall down in certain places to make progress.
                    `,
                },
            ],
        },
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: ['forestTempleBoss'],
                zones: ['forestTemple'],
            },
            text: [
                {
                    dialogueIndex: 221,
                    text: `
                    Many of the researchers here have been working on secret projects.
                    {|}We know about some of them, but others are still a mystery.
                    {|}One of their "projects" has escaped containment and is giving
                    us some trouble so we've sealed it in the chamber to the south.
                    {|}It could be a serious incident if it gets out, so could you find
                    a way in and take care of it?
                    {|}Come back and talk to me once you are done and I'll give you
                    something good.
                    `,
                },
                {
                    dialogueIndex: null,
                    text: `
                    Come talk to me again once you've taken care of those monsters sealed
                    in the southwest chamber.
                    `,
                },
            ],
            repeatIndex: 1,
        },
        {
            logicCheck: {
                requiredFlags: ['forestTempleBoss'],
                excludedFlags: ['$clone'],
                zones: ['forestTemple'],
            },
            isExclusive: true,
            text: [
                {
                    dialogueType: 'quest',
                    dialogueIndex: 222,
                    text: `
                        Amazing, thanks for taking care of that!
                        {|}I think you are ready for something a little more complicated.
                        {|}Some of the more challenging ruins were intended for groups of explorers,
                        but we are a bit short handed at the moment, so you'll have to try using this instead.
                        {item:clone}
                    `,
                },
            ],
        },
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: ['beastsDefeated'],
                zones: ['forestTemple'],
            },
            isExclusive: true,
            text: [
                {
                    dialogueType: 'quest',
                    dialogueIndex: 223,
                    text: `
                        {choice:Was there something else?
                        |Yes:vanaraScientist.questions
                        |Not now:vanaraScientist.goodbye
                        }
                    `,
                },
            ],
        },
    ],
};
