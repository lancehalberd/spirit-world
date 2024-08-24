import { burstAnimation, FieldAnimationEffect } from 'app/content/effects/animationEffect';
import { dialogueHash } from 'app/content/dialogue/dialogueHash';
import { FRAME_LENGTH } from 'app/gameConstants';
import { appendCallback, appendScript, runPlayerBlockingCallback } from 'app/scriptEvents';
import { createObjectInstance } from 'app/utils/createObjectInstance';
import { moveNPCToTargetLocation } from 'app/utils/npc';
import { addObjectToArea, removeObjectFromArea } from 'app/utils/objects';
import { addEffectToArea } from 'app/utils/effects';
import { enterZoneByTarget } from 'app/utils/enterZoneByTarget';
import {findObjectInstanceById} from 'app/utils/findObjectInstanceById';

function addBurstEffect(this: void, state: GameState, npc: NPC, area: AreaInstance): void {
    const hitbox = npc.getHitbox();
    const animation = new FieldAnimationEffect({
        animation: burstAnimation,
        drawPriority: 'background',
        drawPriorityIndex: 1,
        x: hitbox.x + hitbox.w / 2 - burstAnimation.frames[0].w / 2,
        y: hitbox.y + hitbox.h / 2 - burstAnimation.frames[0].h / 2,
    });
    addEffectToArea(state, area, animation);
}

function npcAndHeroTeleportAnimation(state: GameState, npc: NPC) {
    appendScript(state, '{wait:500}');
    runPlayerBlockingCallback(state, (state: GameState) => {
        npc.animationTime += FRAME_LENGTH;
        if (npc.currentAnimationKey !== 'idle') {
            npc.changeToAnimation('idle');
            return true;
        }
    });
    appendScript(state, '{wait:100}');
    runPlayerBlockingCallback(state, (state: GameState) => {
        state.hero.animationTime += FRAME_LENGTH;
        state.hero.d = 'down';
        if (state.hero.action !== 'kneel') {
            state.hero.action = 'kneel';
            return true;
        }
    });
    appendScript(state, '{wait:500}');
    runPlayerBlockingCallback(state, (state: GameState) => {
        npc.animationTime += FRAME_LENGTH;
        if (npc.currentAnimationKey !== 'cast') {
            npc.changeToAnimation('cast');
            return true;
        }
    });
    appendScript(state, '{wait:400}');
    appendCallback(state, (state: GameState) => {
        addBurstEffect(state, npc, state.hero.area);
        state.hero.renderParent = npc;
        removeObjectFromArea(state, npc);
    });
    appendScript(state, '{wait:700}');
}

dialogueHash.jadeChampionWarTemple = {
    key: 'jadeChampionWarTemple',
    mappedOptions: {
        warTempleEncounter: (state: GameState) => {
            appendScript(state, '{playTrack:village}{wait:100');
            // add Jade Champion to the screen
            const jadeChampion = createObjectInstance(state, {
                id: 'jadeChampion',
                dialogueKey: 'jadeChampionWarTemple',
                status: 'normal',
                x: 86,
                y: 474,
                type: 'npc',
                behavior: 'none',
                style: 'jadeChampion',
                d: 'down',
            }) as NPC;
            jadeChampion.speed = 1.75;
            appendCallback(state, (state: GameState) => {
                addObjectToArea(state, state.hero.area, jadeChampion);
            });
            runPlayerBlockingCallback(state, (state: GameState) => {
                jadeChampion.speed = 1;
                jadeChampion.animationTime += FRAME_LENGTH;
                if (moveNPCToTargetLocation(state, jadeChampion, 162, 476, 'move')) {
                    return true;
                }
                jadeChampion.changeToAnimation('idle');
            });
            appendScript(state, '{wait:500}');
            appendScript(state, `Stop right there!`);
            runPlayerBlockingCallback(state, (state: GameState) => {
                jadeChampion.speed = 1.75;
                jadeChampion.animationTime += FRAME_LENGTH;
                if (moveNPCToTargetLocation(state, jadeChampion, 234, 476, 'move')) {
                    return true;
                }
                jadeChampion.changeToAnimation('idle');
            });
            runPlayerBlockingCallback(state, (state: GameState) => {
                jadeChampion.animationTime += FRAME_LENGTH;
                if (moveNPCToTargetLocation(state, jadeChampion, 234, 394, 'move')) {
                    return true;
                }
                jadeChampion.d = 'right';
                jadeChampion.changeToAnimation('idle');
            });
            appendScript(state, `
                What did you do to the Spirit Beasts?
                {|}Why would a Vanara child go poking around in the Spirit World?
                {|}I'm sorry, but you'll have to explain yourself to the Spirit King.
                {|}Come with me.
                `
            );
            runPlayerBlockingCallback(state, (state: GameState) => {
                jadeChampion.animationTime += FRAME_LENGTH;
                if (moveNPCToTargetLocation(state, jadeChampion, 256, 394, 'move')) {
                    return true;
                }
                jadeChampion.d = 'up';
                jadeChampion.changeToAnimation('idle');
            });
            npcAndHeroTeleportAnimation(state, jadeChampion);
            // ****
            // Grand Priest Conversation
            // ****
            let grandPriest: NPC;
            appendCallback(state, (state: GameState) => {
                enterZoneByTarget(state, 'grandTemple', 'grandPriestMarker', null, false, (state) => {
                    if (state.hero.renderParent && state.hero.renderParent.area !== state.hero.area) {
                        delete state.hero.renderParent;
                    }
                    jadeChampion.x = 250;
                    jadeChampion.y = 346;
                    jadeChampion.speed = 1.25;
                    addObjectToArea(state, state.hero.area, jadeChampion);
                    grandPriest = findObjectInstanceById(state.hero.area, 'grandPriest') as NPC;
                });
            });
            appendScript(state, '{wait:100}');
            runPlayerBlockingCallback(state, (state: GameState) => {
                jadeChampion.animationTime += FRAME_LENGTH;
                if (moveNPCToTargetLocation(state, jadeChampion, 220, 346, 'move')) {
                    return true;
                }
                jadeChampion.changeToAnimation('idle');
            });
            appendScript(state, '{wait:50}');
            runPlayerBlockingCallback(state, (state: GameState) => {
                jadeChampion.animationTime += FRAME_LENGTH;
                if (moveNPCToTargetLocation(state, jadeChampion, 254, 300, 'move')) {
                    return true;
                }
                jadeChampion.d = 'up';
                jadeChampion.changeToAnimation('idle');
            });
            appendScript(state, '{wait:200}');
            appendScript(state, `I have brought you the Vanara child, Grand Priest.`);
            appendCallback(state, (state: GameState) => {
                state.hero.d = 'up';
            });
            appendScript(state, '{wait:500}');
            runPlayerBlockingCallback(state, (state: GameState) => {
                jadeChampion.animationTime += FRAME_LENGTH;
                if (moveNPCToTargetLocation(state, jadeChampion, 208, 276, 'move')) {
                    return true;
                }
                jadeChampion.d = 'right';
                jadeChampion.changeToAnimation('idle');
            });
            // UPDATE DIALOGUE
            // grandPriest: What do you know of the disappearance of the Spirit Beasts, child?
            // I can see that you don't know of what I speak.
            // JC: But this child was in the War Temple when the Beasts vanished!
            // That can't be a coincidence.
            // priest to JC: Peace, Champion. Nothing that happens is merely a coincidence.
            // That doesn't mean that this Vanara is responsible.
            // priest to hero: Child, the Spirit King tells me to set you free.
            // JC: How can this be? A Vanara child will be left to freely roam the Spirit World?
            // priest: Silence! My commands are beyond the understanding of mortals.
            // Champion, seek out the Spirit Beasts. The Spirit Gods shall watch the Vanara child themselves.
            // Return this Vanara to the borders of our Holy City. This is my command.
            // JC: Yes, Grand Priest.
            // JC approaches the hero and teleports them to the Holy City
            runPlayerBlockingCallback(state, (state: GameState) => {
                grandPriest.animationTime += FRAME_LENGTH;
                if (moveNPCToTargetLocation(state, grandPriest, 256, 300, 'move')) {
                    return true;
                }
                grandPriest.d = 'down';
                grandPriest.changeToAnimation('idle');
            });
            appendScript(state, `What do you know of the disappearance of the Spirit Beasts, child?
                {|}I can see that you don't know of what I speak.`);
            runPlayerBlockingCallback(state, (state: GameState) => {
                grandPriest.animationTime += FRAME_LENGTH;
                if (moveNPCToTargetLocation(state, grandPriest, 256, 250, 'move')) {
                    return true;
                }
                grandPriest.d = 'down';
                grandPriest.changeToAnimation('idle');
            });
            appendScript(state, '{wait:500}');
            runPlayerBlockingCallback(state, (state: GameState) => {
                jadeChampion.animationTime += FRAME_LENGTH;
                jadeChampion.speed = 1.25;
                if (moveNPCToTargetLocation(state, jadeChampion, 256, 300, 'move')) {
                    return true;
                }
                jadeChampion.d = 'up';
                jadeChampion.changeToAnimation('idle');
            });
            appendScript(state, `But this child was in the War Temple when the Beasts vanished!
                {|}That can't be a coincidence.`);
            runPlayerBlockingCallback(state, (state: GameState) => {
                grandPriest.animationTime += FRAME_LENGTH;
                if (moveNPCToTargetLocation(state, grandPriest, 256, 270, 'move')) {
                    return true;
                }
                grandPriest.d = 'down';
                grandPriest.changeToAnimation('idle');
            });
            appendScript(state, `Peace, Champion. Nothing that happens is merely a coincidence.
                {|}That doesn't mean that this Vanara is responsible.`);
            appendScript(state, '{wait:500}');
            runPlayerBlockingCallback(state, (state: GameState) => {
                jadeChampion.animationTime += FRAME_LENGTH;
                jadeChampion.speed = 1;
                if (moveNPCToTargetLocation(state, jadeChampion, 208, 276, 'move')) {
                    return true;
                }
                jadeChampion.d = 'right';
                jadeChampion.changeToAnimation('idle');
            });
            runPlayerBlockingCallback(state, (state: GameState) => {
                grandPriest.animationTime += FRAME_LENGTH;
                if (moveNPCToTargetLocation(state, grandPriest, 256, 250, 'move')) {
                    return true;
                }
                grandPriest.d = 'down';
                grandPriest.changeToAnimation('idle');
            });
            appendScript(state, `Child, the Spirit King tells me to set you free.`);
            // the hero stands up and faces the grand priest
            appendCallback(state, (state: GameState) => {
                state.hero.action = null;
                state.hero.d = 'up';
            });
            appendScript(state, '{wait:500}');
            runPlayerBlockingCallback(state, (state: GameState) => {
                jadeChampion.animationTime += FRAME_LENGTH;
                jadeChampion.speed = 1.5;
                if (moveNPCToTargetLocation(state, jadeChampion, 256, 300, 'move')) {
                    return true;
                }
                jadeChampion.d = 'up';
                jadeChampion.changeToAnimation('idle');
            });
            appendScript(state, `I cannot let a Vanara child freely roam the Spirit World.
                {|}It is my duty as the Jade Champion to protect the Spirit World!`);
            runPlayerBlockingCallback(state, (state: GameState) => {
                grandPriest.animationTime += FRAME_LENGTH;
                if (moveNPCToTargetLocation(state, grandPriest, 256, 240, 'move')) {
                    return true;
                }
                grandPriest.d = 'up';
                grandPriest.changeToAnimation('idle');
            });
            appendScript(state, `Silence! My commands are beyond the understanding of mortals.`);
            appendScript(state, '{wait:500}');
            runPlayerBlockingCallback(state, (state: GameState) => {
                jadeChampion.animationTime += FRAME_LENGTH;
                jadeChampion.speed = 1;
                if (moveNPCToTargetLocation(state, jadeChampion, 208, 276, 'move')) {
                    return true;
                }
                jadeChampion.d = 'right';
                jadeChampion.changeToAnimation('idle');
            });
            appendScript(state, '{wait:300}');
            runPlayerBlockingCallback(state, (state: GameState) => {
                grandPriest.animationTime += FRAME_LENGTH;
                if (moveNPCToTargetLocation(state, grandPriest, 256, 276, 'move')) {
                    return true;
                }
                grandPriest.d = 'left';
                grandPriest.changeToAnimation('idle');
            });
            appendScript(state, `Champion, seek out the Spirit Beasts.
                {|}The Spirit Gods shall watch the Vanara child themselves.`);
            appendScript(state, '{wait:300}');
            runPlayerBlockingCallback(state, (state: GameState) => {
                grandPriest.animationTime += FRAME_LENGTH;
                if (moveNPCToTargetLocation(state, grandPriest, 256, 250, 'move')) {
                    return true;
                }
                grandPriest.d = 'down';
                grandPriest.changeToAnimation('idle');
            });
            appendScript(state, `Return this Vanara to the gates of our Holy City.
                {|}This is my command.`);
            appendScript(state, '{wait:500}');
            runPlayerBlockingCallback(state, (state: GameState) => {
                jadeChampion.animationTime += FRAME_LENGTH;
                jadeChampion.speed = 1;
                if (moveNPCToTargetLocation(state, jadeChampion, 256, 300, 'move')) {
                    return true;
                }
                jadeChampion.d = 'up';
                jadeChampion.animationTime += FRAME_LENGTH*2;
                jadeChampion.changeToAnimation('bow');
            });
            appendScript(state, '{wait:700}');
            appendScript(state, `Yes, Grand Priest.`);
            appendScript(state, '{wait:300}');
            runPlayerBlockingCallback(state, (state: GameState) => {
                jadeChampion.animationTime += FRAME_LENGTH;
                jadeChampion.speed = 1.25;
                if (moveNPCToTargetLocation(state, jadeChampion, 220, 332, 'move')) {
                    return true;
                }
                jadeChampion.d = 'right';
                jadeChampion.changeToAnimation('idle');
            });
            appendScript(state, `Come child, I will take you out of the city.`);
            // JC moves to cast teleport
            runPlayerBlockingCallback(state, (state: GameState) => {
                jadeChampion.animationTime += FRAME_LENGTH;
                jadeChampion.speed = 1.25;
                if (moveNPCToTargetLocation(state, jadeChampion, 240, 332, 'move')) {
                    return true;
                }
                jadeChampion.d = 'right';
                jadeChampion.changeToAnimation('idle');
            });
            npcAndHeroTeleportAnimation(state, jadeChampion);
            // JC teleports the hero to the Holy City
            appendCallback(state, (state: GameState) => {
                enterZoneByTarget(state, 'overworld', 'holyCityCentralGateMarker', null, false, (state) => {
                    if (state.hero.renderParent && state.hero.renderParent.area !== state.hero.area) {
                        delete state.hero.renderParent;
                    }
                    jadeChampion.x = 90;
                    jadeChampion.y = 20;
                    jadeChampion.speed = 1.75;
                    addObjectToArea(state, state.hero.area, jadeChampion);
                });
            });
            appendScript(state, '{wait:700}');
            appendCallback(state, (state: GameState) => {
                state.hero.action = null;
            });
            appendScript(state, `Farewell. Please try not to cause any further trouble, little one.`);
            // JC walks back into the city, then vanishes
            runPlayerBlockingCallback(state, (state: GameState) => {
                jadeChampion.animationTime += FRAME_LENGTH;
                jadeChampion.speed = 1.25;
                if (moveNPCToTargetLocation(state, jadeChampion, 100, -40, 'move')) {
                    return true;
                }
                jadeChampion.changeToAnimation('idle');
            });
            removeObjectFromArea(state, jadeChampion);
            appendScript(state, '{wait:300}');
            // remove jadeChampion object
            // hero.renderParent = jadeChampion -> to make hero vanish during teleports
            // HIGH: removeobjectfromarea to get rid of champ
            // or, teleport hero+champ OUTSIDE of gate to south, then have Champ walk north into gate, will auto vanish
            // HIGH: Make hero+champion disappear any time the burst effect is added.
            // MED: Reduce delay when teleporting the first time
            // LOW: Maybe MC+Champ should walk out of temple since it isn't far.
            return ``;
        },
    },
    options: [
        {
            text: [
                {
                    dialogueIndex: undefined,
                    text: `Speak to the Grand Priest.`,
                },
                {
                    dialogueIndex: undefined,
                    text: `Something seems terribly wrong, and you are involved somehow.
                    {|}We will get to the bottom of this.`,
                },
            ],
        },
    ],
};
