import { dialogueHash } from 'app/content/dialogue/dialogueHash';
import { appendCallback, appendScript, wait } from 'app/scriptEvents';
import { FRAME_LENGTH, isRandomizer } from 'app/gameConstants';
import { moveActor } from 'app/moveActor';
import { saveGame } from 'app/utils/saveGame';
import { updateCamera } from 'app/updateCamera';



function getRivalBoss(state: GameState): Enemy {
    const rival = state.areaInstance.enemies.find(t => t.definition.enemyType === 'rival2') as Enemy;
    if (!rival) {
        console.error('Could not find rival2');
    }
    return rival;
}

dialogueHash.rival = {
    key: 'rival',
    mappedOptions: {
        startFirstFight: (state: GameState) => {
            if (isRandomizer || state.savedState.objectFlags.skipRivalTombStory) {
                return '';
            }
            // If the hero escapes without entering the tomb or defeating the rival, the
            // rival will show this text on returning.
            if (state.savedState.objectFlags.tombRivalFightStarted) {
                return `Don't make me thump you again!`;
            }
            state.savedState.objectFlags.tombRivalFightStarted = true;
            saveGame(state);
            // This is the typical text as the bow is the easiest way to start the fight.
            if (state.hero.savedData.activeTools.bow) {
                return `Is that the Elder's Spirit Bow?{|}I can't let you leave with that!`;
            }
            return `Now you've done it!{|}Maybe a beating will knock some sense into you!`;
        },
        tombOpened: `Don't make me get the Elder!`,
        lostFirstFight: `That's enough, I'm telling the Elder about this!`,

        startSecondFight: (state: GameState) => {
            const rival = getRivalBoss(state);
            // Make the character walk north to get the rival on the screen.
            state.scriptEvents.activeEvents.push({
                type: 'update',
                update(state: GameState): boolean {
                    const hero = state.hero;
                    hero.d = 'up';
                    hero.action = 'walking';
                    hero.animationTime += FRAME_LENGTH;
                    const {my} = moveActor(state, hero, 0, -1, {
                        canSwim: true,
                        canJump: true,
                        direction: 'up',
                    });
                    if (!my || hero.y <= 96) {
                        hero.action = null;
                        return false;
                    }
                    updateCamera(state);
                    return true;
                },
            });
            state.scriptEvents.activeEvents.push({
                type: 'wait',
                time: 0,
                waitingOnActiveEvents: true,
                // Make sure the fight doesn't continue during this cutscene.
                blockFieldUpdates: true,
            });
            wait(state, 500);
            if (isRandomizer || state.savedState.objectFlags.skipRivalHelixStory) {
                return '';
            }
            appendScript(state, `
                So you're here just like the Commander said.
                {|}I can't believe they just invited you here while I had to force my way in.
                {|}All my life I've tried to be good and follow the rules while you outcasts just go about doing whatever you want...
            `);
            wait(state, 500);
            appendCallback(state, (state: GameState) => {
                rival.changeToAnimation('kneel');
            });
            wait(state, 200);
            appendScript(state, `
                {|}The Elder said the rules are to keep our village safe from the Humans, but it was all a lie.
                {|}You've seen how powerful the Vanara truly are haven't you?
                {|}It's the Humans and their so-called Gods that should be cowering in fear!
            `);
            wait(state, 200);
            appendCallback(state, (state: GameState) => {
                rival.changeToAnimation('idle');
            });
            wait(state, 200);
            appendScript(state, `
                {|}Well I've had it with these stupid rules, both Human and Vanaran.
                {|}Even if you have the Elder's permission, you still don't have mine!
                {|}A half-blood like you has no right to be here.
                {|}You shouldn't even exist!
            `);

            return '';
        },
        lostSecondFight: `
            Bah! I don't have time for this!
            {|}Go ahead and talk to the Commander.
            {|}Just try not to die before our next match.
        `,
    },
    options: [
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: [],
                zones: ['overworld'],
            },
            isExclusive: true,
            text: [
                {
                    dialogueIndex: 35,
                    text: `I'm in no mood for your tricks today!`,
                },
                {
                    dialogueIndex: 36,
                    text: `You're not getting me in trouble today!`,
                },
                {
                    dialogueIndex: 37,
                    text: `You know you're not allowed in here.`,
                },
            ],
        },
    ],
};
