import { addBurstEffect } from 'app/content/effects/animationEffect';
import { dialogueHash } from 'app/content/dialogue/dialogueHash';
import { FRAME_LENGTH } from 'app/gameConstants';
import { appendCallback, appendScript, runPlayerBlockingCallback, hideHUD, showHUD } from 'app/scriptEvents';
import { createObjectInstance } from 'app/utils/createObjectInstance';
import { moveNPCToTargetLocation } from 'app/utils/npc';
import { addObjectToArea, removeObjectFromArea } from 'app/utils/objects';
import { enterZoneByTarget } from 'app/utils/enterZoneByTarget';
import {findObjectInstanceById} from 'app/utils/findObjectInstanceById';

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
            // hide HUD to show that player isn't controllable
            hideHUD(state);
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
                if (moveNPCToTargetLocation(state, jadeChampion, 234, 396, 'move')) {
                    return true;
                }
                jadeChampion.changeToAnimation('idle', 'right');
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
                if (moveNPCToTargetLocation(state, jadeChampion, 256, 400, 'move')) {
                    return true;
                }
                jadeChampion.changeToAnimation('idle', 'up');
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
                    // Change the priests behavior to none so that the updates don't interfere
                    // with the cutscene.
                    grandPriest.definition = {
                        ...grandPriest.definition,
                        behavior: 'none',
                    }
                    grandPriest.speed = 1;
                });
            });
            appendScript(state, '{wait:100}');
            runPlayerBlockingCallback(state, (state: GameState) => {
                jadeChampion.animationTime += FRAME_LENGTH;
                if (moveNPCToTargetLocation(state, jadeChampion, 220, 346, 'move')) {
                    return true;
                }
                jadeChampion.changeToAnimation('idle', 'up');
            });
            appendScript(state, '{wait:50}');
            runPlayerBlockingCallback(state, (state: GameState) => {
                jadeChampion.animationTime += FRAME_LENGTH;
                if (moveNPCToTargetLocation(state, jadeChampion, 254, 300, 'move')) {
                    return true;
                }
                jadeChampion.changeToAnimation('idle', 'up');
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
                jadeChampion.changeToAnimation('idle', 'right');
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
            // JC: It is my duty as the Jade Champion to protect the Spirit World!
            // I cannot let a Vanara child roam it freely.
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
                grandPriest.changeToAnimation('idle', 'down');
            });
            appendScript(state, `What do you know of the disappearance of the Spirit Beasts, child?
                {|}...
                {|}I can see that you don't know of what I speak.`);
            runPlayerBlockingCallback(state, (state: GameState) => {
                grandPriest.animationTime += FRAME_LENGTH;
                if (moveNPCToTargetLocation(state, grandPriest, 256, 250, 'move')) {
                    return true;
                }
                grandPriest.changeToAnimation('idle', 'down');
            });
            appendScript(state, '{wait:500}');
            // JC is shocked, steps forward slightly to speak
            // JC resting: 208, 276
            // NPC talking: 256, 300
            runPlayerBlockingCallback(state, (state: GameState) => {
                jadeChampion.animationTime += FRAME_LENGTH;
                jadeChampion.speed = 1.5;
                if (moveNPCToTargetLocation(state, jadeChampion, 224, 286, 'move')) {
                    return true;
                }
                jadeChampion.changeToAnimation('idle', 'right');
            });
            appendScript(state, `But this child was in the War Temple when the Beasts vanished!
                {|}That can't be a coincidence.`);
            runPlayerBlockingCallback(state, (state: GameState) => {
                grandPriest.animationTime += FRAME_LENGTH;
                if (moveNPCToTargetLocation(state, grandPriest, 256, 286, 'move')) {
                    return true;
                }
                grandPriest.changeToAnimation('idle', 'left');
            });
            appendScript(state, '{wait:300}');
            appendScript(state, `Peace, Champion. Nothing that happens is merely a coincidence.
                {|}That doesn't mean that this Vanara is responsible.`);
            appendScript(state, '{wait:500}');
            runPlayerBlockingCallback(state, (state: GameState) => {
                grandPriest.animationTime += FRAME_LENGTH;
                if (moveNPCToTargetLocation(state, grandPriest, 256, 250, 'move')) {
                    return true;
                }
                grandPriest.changeToAnimation('idle', 'down');
            });
            appendScript(state, '{wait:300}');
            appendScript(state, `Child, the Spirit King tells me to set you free.`);
            // the hero stands up, no longer kneeling to signify that he is free
            appendCallback(state, (state: GameState) => {
                state.hero.action = null;
                state.hero.d = 'up';
            });
            appendScript(state, '{wait:500}');
            // JC is angered to speech again, steps forward all of the way
            runPlayerBlockingCallback(state, (state: GameState) => {
                jadeChampion.animationTime += FRAME_LENGTH;
                jadeChampion.speed = 1.5;
                if (moveNPCToTargetLocation(state, jadeChampion, 256, 300, 'move')) {
                    return true;
                }
                jadeChampion.changeToAnimation('idle', 'up');
            });
            appendScript(state, `It is my duty as the Jade Champion to protect the Spirit World!
                {|}I cannot let a Vanara child roam it freely.`);
            runPlayerBlockingCallback(state, (state: GameState) => {
                grandPriest.animationTime += FRAME_LENGTH;
                if (moveNPCToTargetLocation(state, grandPriest, 256, 240, 'move')) {
                    return true;
                }
                grandPriest.changeToAnimation('idle', 'up');
            });
            appendScript(state, `Silence! My commands are beyond the understanding of mortals.`);
            appendScript(state, '{wait:500}');
            // JC is chastised, returns to her resting spot
            runPlayerBlockingCallback(state, (state: GameState) => {
                jadeChampion.animationTime += FRAME_LENGTH;
                jadeChampion.speed = .75;
                if (moveNPCToTargetLocation(state, jadeChampion, 208, 276, 'move')) {
                    return true;
                }
                jadeChampion.changeToAnimation('idle', 'right');
            });
            appendScript(state, '{wait:500}');
            runPlayerBlockingCallback(state, (state: GameState) => {
                grandPriest.animationTime += FRAME_LENGTH;
                grandPriest.speed = 1;
                if (moveNPCToTargetLocation(state, grandPriest, 256, 276, 'move')) {
                    return true;
                }
                grandPriest.changeToAnimation('idle', 'left');
            });
            appendScript(state, `Champion, seek out the Spirit Beasts.
                {|}The Spirit Gods shall watch the Vanara child themselves.`);
            appendScript(state, '{wait:300}');
            runPlayerBlockingCallback(state, (state: GameState) => {
                grandPriest.animationTime += FRAME_LENGTH;
                if (moveNPCToTargetLocation(state, grandPriest, 256, 250, 'move')) {
                    return true;
                }
                grandPriest.changeToAnimation('idle', 'down');
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
                // Question for Hillary: Should this be after the call to change animation?
                // jadeChampion.animationTime += FRAME_LENGTH * 2;
                jadeChampion.changeToAnimation('bow', 'up');
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
                jadeChampion.changeToAnimation('idle', 'right');
            });
            appendScript(state, `Come child, I will take you out of the city.`);
            // JC and hero position for teleport
            runPlayerBlockingCallback(state, (state: GameState) => {
                jadeChampion.animationTime += FRAME_LENGTH;
                jadeChampion.speed = 1.25;
                if (moveNPCToTargetLocation(state, jadeChampion, 240, 332, 'move')) {
                    return true;
                }
                jadeChampion.changeToAnimation('idle', 'right');
                state.hero.d = 'left';
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
                jadeChampion.animationTime += FRAME_LENGTH;
                jadeChampion.changeToAnimation('idle');
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
                removeObjectFromArea(state, jadeChampion);
            });
            appendScript(state, '{wait:300}{stopTrack}');
            // show HUD to tell player that control of their character has returned
            showHUD(state);
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
                /*{
                    dialogueIndex: undefined,
                    text: `Speak to the Grand Priest.`,
                },
                {
                    dialogueIndex: undefined,
                    text: `Something seems terribly wrong, and you are involved somehow.
                    {|}We will get to the bottom of this.`,
                },*/
            ],
        },
    ],
};
