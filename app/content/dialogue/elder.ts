import { moveNPCToTargetLocation, NPC } from 'app/content/objects/npc';
import { logicHash } from 'app/content/logic';
import { dialogueHash } from 'app/content/dialogue/dialogueHash';
import { FRAME_LENGTH, RIVAL_NAME } from 'app/gameConstants';
import { appendCallback, appendScript, wait } from 'app/scriptEvents';
import { saveGame } from 'app/utils/saveGame';
import { moveEnemyToTargetLocation } from 'app/utils/enemies';
import { addObjectToArea, removeObjectFromArea } from 'app/utils/objects';

import { Enemy, GameState } from 'app/types';

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
        tombRescue: (state: GameState) => {
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
                const elder = new NPC({
                    id: 'elder',
                    status: 'normal',
                    x: 64,
                    y: 272,
                    type: 'npc',
                    behavior: 'none',
                    style: 'vanaraGray',
                    d: 'up',
                });
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
                state.scriptEvents.activeEvents.push({
                    type: 'update',
                    update(state: GameState): boolean {
                        state.hero.animationTime += FRAME_LENGTH;
                        if (state.hero.x < 96) {
                            state.hero.action = 'walking';
                            state.hero.d = 'right';
                            state.hero.x += 2;
                            if (state.hero.y >= 200) {
                                state.hero.y--;
                            }
                            return true;
                        }
                        if (state.hero.y >= 200) {
                            state.hero.action = 'walking';
                            state.hero.d = 'up';
                            state.hero.y -= 2;
                            return true;
                        }
                        state.hero.d = 'left';
                        state.hero.action = null;
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
                appendScript(state, `Elder, they were trying to break into our sacred burial grounds!`);
                state.scriptEvents.queue.push({
                    type: 'callback',
                    callback(state: GameState) {
                        elder.d = (elder.x < state.hero.x) ? 'right' : 'left';
                        elder.changeToAnimation('idle');
                    }
                });
                for (let i = 0; i < 3; i++) {
                    wait(state, 500);
                    state.scriptEvents.queue.push({
                        type: 'callback',
                        callback(state: GameState) {
                            state.hero.life++;
                            state.scriptEvents.blockFieldUpdates = true;
                        }
                    });
                }
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
                    elder.d = (elder.x < state.hero.x) ? 'right' : 'left';
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
                `Oh ${RIVAL_NAME} won't let you enter the tomb?{|}
                I'm so sorry, he is just doing his job, I'll send word that he should let you pass.
                {flag:tombRivalAvoided}`,
            ],
        },
        {
            logicCheck: {
                requiredFlags: ['tombRivalAvoided'],
                excludedFlags: ['tombEntered'],
            },
            isExclusive: true,
            text: [
                `So sorry about the misunderstanding, you are free to enter the tomb now.`,
                `The Vanara Tomb is just to the north of here.`
            ],
        },
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: ['$bow', 'tombEntrance'],
            },
            isExclusive: true,
            text: [
                `So you want to learn more about your Spirit powers?
                {|}Seek out the Guardian in the Vanara Tomb to the north.
                {|}Search my cellar for a tool you will need to enter the Tomb.
                {flag:elderTomb}`,
                `Search my cellar for a tool you will need to enter the Tomb.`,
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
                `I see you decided to help yourself to my family heirloom.`,
                `You can use the Spirit Bow to enter the Vanara Tomb to the north.{flag:elderTomb}`,
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
                `You can use the Spirit Bow to enter the Vanara Tomb to the north.`,
            ],
        },
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: [],
            },
            text: [
                `I have done all that I can for you.`,
                `Please leave our village in peace.`
            ],
            notes: `This is fall back text.`
        }
    ],
};
