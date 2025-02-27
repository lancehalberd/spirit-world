import { logicHash } from 'app/content/logic';
import { dialogueHash } from 'app/content/dialogue/dialogueHash';
import { FRAME_LENGTH, RIVAL_NAME } from 'app/gameConstants';
import {getMovementAnchor, moveActorTowardsLocation} from 'app/movement/moveActor';
import {appendCallback, appendScript, runBlockingCallback, runPlayerBlockingCallback, wait} from 'app/scriptEvents';
import { updateGenericHeroState } from 'app/updateActor';
import {faceTarget} from 'app/utils/actor';
import { createObjectInstance } from 'app/utils/createObjectInstance';
import { saveGame } from 'app/utils/saveGame';
import { moveEnemyToTargetLocation } from 'app/utils/enemies';
import { moveNPCToTargetLocation } from 'app/utils/npc';
import { addObjectToArea, removeObjectFromArea } from 'app/utils/objects';


function getRivalBoss(state: GameState): Enemy {
    const rival = state.areaInstance.enemies.find(t => t.definition?.id === 'tombRivalBoss') as Enemy;
    if (!rival) {
        console.error('Could not find tombRivalBoss');
    }
    return rival;
}

dialogueHash.elder = {
    key: 'elder',
    mappedOptions: {
        tombRescue(state: GameState) {
            state.savedState.objectFlags.tombRivalRescued = true;
            //state.hero.action = null;
            //state.scriptEvents.blockFieldUpdates = true;
            //state.scriptEvents.handledInput = true;
            //state.hero.invulnerableFrames = 0;
            //state.hero.z = 0;
            //state.hero.vx = state.hero.vy = state.hero.vz = 0;
            //state.screenShakes = [];
            const rival = getRivalBoss(state);
            if (!rival) {
                return '';
            }
            rival.activeAbility = null;
            //rival.z = 0;
            rival.healthBarTime = -10000;
            state.scriptEvents.overrideMusic = 'vanaraForestTheme';
            //rival.invulnerableFrames = 0;
            // Remove any attack effects on defeat.
            // rival.area.effects = rival.area.effects.filter(effect => !effect.isEnemyAttack);
            //rival.changeToAnimation('idle');
            saveGame(state);
            // Wait a moment for the battle to calm down.
            state.scriptEvents.activeEvents.push({
                type: 'wait',
                blockPlayerInput: true,
                time: 0,
                callback(state: GameState) {
                    if (state.areaInstance.effects.find(effect => effect.isEnemyAttack)) {
                        return true;
                    }
                    if (state.hero.invulnerableFrames > 0 || rival.invulnerableFrames > 0
                        || state.hero.z > 0 || rival.z > 0
                        || state.screenShakes.length
                    ) {
                        return true;
                    }
                    // Wait at least 1 second.
                    return this.time > 1000;
                }
            });
            appendScript(state, '{removeCue}');
            appendScript(state, `That's enough!`);
            appendCallback(state, (state: GameState) => {
                const elder = createObjectInstance(state, {
                    id: 'elder',
                    status: 'normal',
                    x: 64,
                    y: 272,
                    type: 'npc',
                    behavior: 'none',
                    style: 'vanaraGray',
                    d: 'up',
                }) as NPC;
                elder.speed = 1.5;
                addObjectToArea(state, state.hero.area, elder);
                state.scriptEvents.activeEvents.push({
                    type: 'update',
                    update(state: GameState): boolean {
                        elder.animationTime += FRAME_LENGTH;
                        if (moveNPCToTargetLocation(state, elder, 64, 208, 'move')) {
                            return true;
                        }
                        elder.changeToAnimation('idle');
                    },
                });
                state.scriptEvents.activeEvents.push({
                    type: 'update',
                    update(state: GameState): boolean {
                        rival.animationTime += FRAME_LENGTH;
                        if (moveEnemyToTargetLocation(state, rival, 64, 176, 'move')) {
                            return true;
                        }
                        rival.d = 'down';
                        rival.changeToAnimation('idle');
                        return false;
                    },
                });
                const anchor = getMovementAnchor(state.hero);
                // Move the hero out of the line between where the rival and elder will stand during the cutscene.
                const targetX = anchor.x < 60 ? Math.min(32, anchor.x) : Math.max(86, anchor.x);
                // Make sure the hero is far enough south that the text box is render on the top half of the screen, otherwise
                // the rival and the elder will be covered up.
                const targetY = Math.max(175, Math.min(200, anchor.y));
                runPlayerBlockingCallback(state, (state: GameState) => {
                    state.hero.action = 'walking';
                    // state.hero.d = 'down';
                    state.hero.animationTime += FRAME_LENGTH;
                    const heroIsMoving = moveActorTowardsLocation(state, state.hero, {x: targetX, y: targetY}, 1.5) > 0;
                    if (heroIsMoving) {
                        return true;
                    }
                    delete state.hero.action;
                    faceTarget(state, state.hero, elder);
                });
                state.scriptEvents.activeEvents.push({
                    type: 'wait',
                    time: 0,
                    waitingOnActiveEvents: true,
                    // Make sure the fight doesn't continue during this cutscene.
                    blockFieldUpdates: true,
                });
                appendScript(state, `Elder, they were trying to break into our sacred burial grounds!`);
                state.scriptEvents.queue.push({
                    type: 'callback',
                    callback(state: GameState) {
                        faceTarget(state, elder, state.hero);
                        elder.changeToAnimation('idle');
                    }
                });
                appendScript(state, `Here, drink this.`);
                appendCallback(state, () => {
                    faceTarget(state, state.hero, elder);
                });
                wait(state, 1000);
                appendCallback(state, () => {
                    state.hero.life = state.hero.savedData.maxLife;
                });
                runBlockingCallback(state, () => {
                    updateGenericHeroState(state, state.hero);
                    return state.hero.displayLife < state.hero.life
                });

                wait(state, 500);
                state.scriptEvents.queue.push({
                    type: 'callback',
                    callback(state: GameState) {
                        elder.d = 'up';
                        elder.changeToAnimation('idle');
                    }
                });
                // We probably
                appendScript(state, `${RIVAL_NAME}, you know you aren't supposed to use lethal force.
                    {|}You should have come to me instead of fighting.`);
                appendScript(state, `But...!`);
                appendScript(state, `If you asked me you would know that they came with my blessing.`);
                wait(state, 500);
                appendCallback(state, (state: GameState) => {
                    faceTarget(state, elder, state.hero);
                    elder.changeToAnimation('idle');
                });
                appendScript(state, `Child, I appologize, I should have told ${RIVAL_NAME} you would be coming.`);
                appendCallback(state, (state: GameState) => {
                    elder.d = 'up';
                    elder.changeToAnimation('idle');
                });
                appendScript(state, `${RIVAL_NAME}, come with me back to the village and I will explain everything.`);

                appendCallback(state, (state: GameState) => {
                    state.scriptEvents.activeEvents.push({
                        type: 'update',
                        update(state: GameState): boolean {
                            elder.animationTime += FRAME_LENGTH;
                            if (moveNPCToTargetLocation(state, elder, 64, 300, 'move')) {
                                return true;
                            }
                            removeObjectFromArea(state, elder);
                            return false;
                        },
                    });
                    state.scriptEvents.activeEvents.push({
                        type: 'update',
                        update(state: GameState): boolean {
                            rival.animationTime += FRAME_LENGTH;
                            if (moveEnemyToTargetLocation(state, rival, 64, 288, 'move')) {
                                return true;
                            }
                            removeObjectFromArea(state, rival);
                            delete state.scriptEvents.overrideMusic;
                            return false;
                        },
                    });
                    state.scriptEvents.activeEvents.push({
                        type: 'wait',
                        time: 0,
                        waitingOnActiveEvents: true,
                        // Make sure the fight doesn't continue during this cutscene.
                        blockFieldUpdates: true,
                    });
                });
            });
            return ``;
        },
    },
    options: [
        {
            logicCheck: logicHash.tombRivalBoss,
            isExclusive: true,
            text: [
                {
                    dialogueIndex: 1,
                    dialogueType: 'quest',
                    text: `Oh ${RIVAL_NAME} won't let you enter the tomb?{|}
                    I'm so sorry, he is just doing his job, I'll send word that he should let you pass.
                    {flag:tombRivalAvoided}`,
                },
            ],
        },
        {
            logicCheck: {
                requiredFlags: ['tombRivalAvoided'],
                excludedFlags: ['tombEntered'],
            },
            isExclusive: true,
            text: [
                {
                    dialogueIndex: 2,
                    dialogueType: 'reminder',
                    text: `So sorry about the misunderstanding, you are free to enter the tomb now.`,
                },
                {
                    dialogueIndex: 3,
                    dialogueType: 'reminder',
                    text: `The Vanara Tomb is just to the north of here.`,
                },
            ],
        },
        {
            logicCheck: {
                requiredFlags: ['$catEyes'],
                excludedFlags: ['$bow', 'tombEntrance'],
            },
            isExclusive: true,
            text: [
                {
                    dialogueIndex: 4,
                    dialogueType: 'quest',
                    text: `Greetings young one, I can sense there is something different about you today.
                    {|}A warning about the Spirit Tree?
                    {|}No no, I believe you, this is too strange even for one of your tales.
                    {|}*sigh* Your father didn't pay much attention to rules so I'm sure he has told you stories about my spirit powers.
                    {|}Stories like that are often hard to believe, but I suspect you are starting to wonder if there is any truth to them.
                    {|}Unfortunately, it is not my place to teach you more about the Spirit World.
                    {|}To be honest my spirit powers are quite weak anyway, just enough to keep careful watch over this village.
                    {|}However, there is one I know of who can teach you more if you wish.
                    {|}To learn more about the Spirit World, seek out the Guardian in the Vanara Tomb to the north.
                    {|}Search my cellar for a tool that will help you unlock the Tomb.
                    {flag:elderTomb}`,
                },
                {
                    dialogueIndex: 5,
                    dialogueType: 'reminder',
                    text: `Search my cellar for a tool that will help you unlock the Tomb.`,
                },
            ],
            notes: `If this flag is set the elder will rescue you if you are defeated
                by your rival outside the tomb.`
        },
        {
            logicCheck: {
                requiredFlags: ['$bow'],
                excludedFlags: ['elderTomb', 'tombEntrance'],
            },
            isExclusive: true,
            text: [
                {
                    dialogueIndex: 6,
                    text: `I see you decided to help yourself to my family heirloom.`,
                },
                {
                    dialogueIndex: 0,
                    dialogueType: 'quest',
                    text: `You can use the Spirit Bow to enter the Vanara Tomb to the north.{flag:elderTomb}`,
                },
            ],
            notes: `The elder won't help you with the rival fight until you listen to the line where they tell you
                    to visit the tomb`,
        },
        {
            logicCheck: {
                requiredFlags: ['$bow', 'elderTomb'],
                excludedFlags: ['tombEntrance'],
            },
            isExclusive: true,
            text: [
                {
                    dialogueIndex: 7,
                    dialogueType: 'reminder',
                    text: `You can use the Spirit Bow to enter the Vanara Tomb to the north.`,
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
                    dialogueIndex: 8,
                    text: `I have done all that I can for now.`},
                {
                    dialogueIndex: 9,
                    text: `Please leave our village in peace.`}
            ],
            notes: `This is fall back text.`
        }
    ],
};
