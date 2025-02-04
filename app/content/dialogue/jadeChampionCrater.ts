import {addBurstEffect} from 'app/content/effects/animationEffect';
import {dialogueHash} from 'app/content/dialogue/dialogueHash';
import {JadeChampion} from 'app/content/objects/jadeChampion';
import {findObjectInstanceById} from 'app/utils/findObjectInstanceById';
import {addObjectToArea, removeObjectFromArea} from 'app/utils/objects';


dialogueHash.jadeChampionCrater = {
    key: 'jadeChampionCrater',
    mappedOptions: {
        flameBeast(state: GameState) {
            const jadeChampionNPC = findObjectInstanceById(state.hero.area, 'jadeChampion') as NPC;
            if (!jadeChampionNPC) {
                console.log('Could not find Jade Champion NPC');
                return '';
            }
            const jadeChampion = new JadeChampion(state, {
                type: 'jadeChampion',
                x: jadeChampionNPC.x,
                y: jadeChampionNPC.y,
                d: jadeChampionNPC.d,
            });
            removeObjectFromArea(state, jadeChampionNPC);
            addObjectToArea(state, state.hero.area.alternateArea, jadeChampion);
            // Add a burst to indicate the Jade Champion is teleporting to the spirit world.
            addBurstEffect(state, jadeChampion, state.hero.area);
            return '';
        },
        entrance(state: GameState) {
            // Add a scene outside of the Crater.
            return '';
        },
    },
    options: [
        {
            text: [
            ],
        },
    ],
};
