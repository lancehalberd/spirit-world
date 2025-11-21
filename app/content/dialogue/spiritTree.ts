import {dialogueHash} from 'app/content/dialogue/dialogueHash';
import {isRandomizer} from 'app/gameConstants';

dialogueHash.spiritTree = {
    key: 'spiritTree',
    mappedOptions: {
        interact(state: GameState) {
            if (isRandomizer) {
                return '{@spiritTree.randomizerReward}';
            }
            if (!state.hero.savedData.passiveTools.teleportation) {
                return '{@spiritTree.welcome}';
            }
            if (!state.savedState.objectFlags.teleportationTutorialSwitch) {
                return 'Now that you appear in your material body, you will need to use your teleportation skill to leave here.';
            }
            return `
                {choice:Do you seek answers?
                |Yes:spiritTree.questions
                |No:spiritTree.goodbye
                }
            `;
        },
        randomizerReward: '{item:teleportation}',
        goodbye(state: GameState) {
            return 'The Spirits of the Vanara watch over you.';
        },
        welcome(state: GameState) {
            return `
                Welcome child, your arrival in the dreaming has been greatly anticipated.
                {|}I am the Spirit Tree, guardian of the Vanara and the Dream World.
                {|}Thank you for bringing my daughter's warning.
                {|}We know of the danger although its cause remains elusive.
                {|}Perhaps you would aid us further?
                {|}But first, is there anything you wish to ask of me?
                {@spiritTree.questions}
            `;
        },
        questions(state: GameState) {
            return `
                {choice:Ask a question?
                |Your daughter?:spiritTree.daughterTree
                |What danger?:spiritTree.whatDanger
                |Why me?:spiritTree.whyMe
                |Not now.:spiritTree.noQuestion
                }
            `;
        },
        daughterTree(state: GameState) {
            return `
                The daughter trees were made in my image but will never fully mature.
                {|}They are my companions and help support the dreaming and enhance my senses.
                {|}Have you found any of the others?
                {|}Many were once hidden throughout the land, but one by one their voices disappeared until none were left.
                {|}Something unnatural has befallen them leaving my senses dulled and the dreaming
                a shell of what it once was.
                {|}If you wish, you may be able to help us revive them.
                {@spiritTree.questions}
            `;
        },
        whatDanger(state: GameState) {
            return `
                The death of the daughter trees was no accident.
                {|}I cannot tell you much more at this time, but we know the Vanara have an enemy that seeks to destroy us or worse.
                {|}The enemy must both fear and desire the power of the Vanara. It does not confront us directly, always attacking from
                the shadows, biding its time.
                {|}The enemy is subtle and patient. We have contested it for many generations but still it does not reveal itself.
                Even if you agree to help us, there may be many things you can never truly understand about its nature.
                {@spiritTree.questions}
            `;
        },
        whyMe(state: GameState) {
            return `
                It is true that there are powerful Vanara who know much more than you.
                So why would we seek the aid of a child such as you?
                {|}There is much that I cannot say about this yet, but there are rules that constrain what others may do.
                {|}You are weaker than other Vanara, but you are also different in other important ways.
                The rules that bind others do not necessarily apply to you. You are free to take actions and make choices that others cannot.
                {|}This is all I can say for now.
                {@spiritTree.questions}
            `;
        },
        noQuestion(state: GameState) {
            if (state.hero.savedData.passiveTools.teleportation) {
                return '{@spiritTree.goodbye}';
            }
            return `
                As you wish.
                {|}Now I have a request for you.
                {|}There is still much that I cannot share with you.
                {|}The knowledge and fate of our people cannot be entrusted to a child.
                {|}You have already accomplished much and, for better or worse, you have learned many things that will forever change you.
                {|}However, to go further, you must be prepared to take full responsibility for your powers as a Vanara.
                {|}If you continue on this path, the fate of our people, perhaps even our world, may fall on you some day.
                {|}Long ago, Vanara of age would undergo a trial to claim their place as an adult.
                {|}To accept our call, you must prove yourself once more by facing the trial of the Helix.
                {|}There is a cave near the portal by the lake which only Vanara can traverse.
                {|}I will grant you my blessing so that you too may pass.
                {|}While you have wandered the dreaming I have been integrating the structure of your body into the dreaming.
                {|}With this you will be able to materialize your body wherever your Spirit goes.
                {|}Use this power to scale the Helix and embrace your destiny!
                {item:teleportation}
            `;
        },
    },
    options: [],
};
