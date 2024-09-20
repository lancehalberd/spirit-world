import { burstAnimation, FieldAnimationEffect } from 'app/content/effects/animationEffect';
import { dialogueHash } from 'app/content/dialogue/dialogueHash';
import { FRAME_LENGTH } from 'app/gameConstants';
import { appendCallback, appendScript, runBlockingCallback, runPlayerBlockingCallback, hideHUD, showHUD } from 'app/scriptEvents';
import { createObjectInstance } from 'app/utils/createObjectInstance';
import { moveNPCToTargetLocation } from 'app/utils/npc';
import { updateCamera } from 'app/updateCamera';
import { addObjectToArea, removeObjectFromArea } from 'app/utils/objects';
import { addEffectToArea } from 'app/utils/effects';

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

dialogueHash.jadeChampion = {
    key: 'jadeChampion',
    mappedOptions: {
        firstConversation: (state: GameState) => {
            // add Jade Champion to the screen
            const jadeChampion = createObjectInstance(state, {
                id: 'jadeChampion',
                dialogueKey: 'jadeChampion',
                status: 'normal',
                x: 200,
                y: 216, // initially appear offscreen, walk south
                type: 'npc',
                behavior: 'none',
                style: 'jadeChampion',
                d: 'down',
            }) as NPC;
            jadeChampion.speed = 1.5;
            appendCallback(state, (state: GameState) => {
                addObjectToArea(state, state.hero.area, jadeChampion);
            });
            // hide HUD to show that player isn't controllable
            hideHUD(state, 20);
            // Move the player to a good x,y position before talking to the Jade Champion.
            // target coordinates: { x: 134, y: 446 }
            // FIX, TODO: camera movement is jerky
            runBlockingCallback(state, (state: GameState) => {
                const hero = state.hero;
                // fix x coordinate
                if (hero.x === 134) {
                    hero.d = 'up';
                    delete hero.action;
                    return false;
                }
                hero.action = 'walking';
                hero.animationTime += FRAME_LENGTH;
                if (hero.x < 134) {
                    hero.d = 'right';
                    hero.x = Math.min(hero.x + 1, 134);
                } else {
                    hero.d = 'left';
                    hero.x = Math.max(hero.x - 1, 134);
                }
                updateCamera(state);
                return true;
            });
            runBlockingCallback(state, (state: GameState) => {
                const hero = state.hero;
                // fix y coordinate
                if (hero.y === 446) {
                    hero.d = 'up';
                    delete hero.action;
                    return false;
                }
                hero.action = 'walking';
                hero.animationTime += FRAME_LENGTH;
                if (hero.y < 446) {
                    hero.d = 'down';
                    hero.y = Math.min(hero.y + 1, 446);
                } else {
                    hero.d = 'up';
                    hero.y = Math.max(hero.y - 1, 446);
                }
                updateCamera(state);
                return true;
            });
            // JC walks onscreen from the north
            // start: { x: 200, y: 216 }
            // 1: { x: 200, y: 348 }
            // 2: { x: 142, y: 348 }
            // end: { x: 142, y: 424 }
            // 1
            runPlayerBlockingCallback(state, (state: GameState) => {
                jadeChampion.animationTime += FRAME_LENGTH;
                if (moveNPCToTargetLocation(state, jadeChampion, 200, 348, 'move')) {
                    return true;
                }
                jadeChampion.changeToAnimation('idle');
            });
            // 2
            runPlayerBlockingCallback(state, (state: GameState) => {
                jadeChampion.animationTime += FRAME_LENGTH;
                if (moveNPCToTargetLocation(state, jadeChampion, 142, 348, 'move')) {
                    return true;
                }
                jadeChampion.changeToAnimation('idle');
            });
            // end
            runPlayerBlockingCallback(state, (state: GameState) => {
                jadeChampion.animationTime += FRAME_LENGTH;
                if (moveNPCToTargetLocation(state, jadeChampion, 142, 424, 'move')) {
                    return true;
                }
                jadeChampion.d = 'down';
                jadeChampion.changeToAnimation('idle');
            });
            appendScript(state, `You're that Vanara child the guards caught sneaking into the temple.
                {|}You really should know better than to come here by now.
                {|}It won't be my fault if you get chased out of town again.
                {|}Just stay away from the Spirit Gate or I'll have to kick you out myself.`);
            // JC teleports away
            appendScript(state, '{wait:500}');
            runPlayerBlockingCallback(state, (state: GameState) => {
                jadeChampion.animationTime += FRAME_LENGTH;
                if (jadeChampion.currentAnimationKey !== 'cast') {
                    jadeChampion.changeToAnimation('cast');
                    return true;
                }
            });
            appendScript(state, '{wait:400}');
            appendCallback(state, (state: GameState) => {
                addBurstEffect(state, jadeChampion, state.hero.area);
                removeObjectFromArea(state, jadeChampion);
            });
            appendScript(state, '{wait:700}');
            // show HUD to tell player that control of their character has returned
            showHUD(state, 20);
            return ``;
        },
    },
    options: [],
};
