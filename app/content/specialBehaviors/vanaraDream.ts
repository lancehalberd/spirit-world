import {specialBehaviorsHash} from 'app/content/specialBehaviors/specialBehaviorsHash';
import {removeObjectFromArea} from 'app/utils/objects';

import {getVectorToTarget} from 'app/utils/target';


specialBehaviorsHash.ephemeral = {
    type: 'npc',
    apply(state: GameState, npc: NPC) {
        this.update(state, npc);
    },
    update(state: GameState, npc: NPC) {
        // Ephemeral NPCs fade away and disappear instead of cycling through dialog.
        if (!state.scriptEvents.activeEvents?.length && !state.scriptEvents.queue?.length && npc.hasFinishedDialog) {
            npc.messageAlpha = npc.alpha = Math.max(npc.alpha - 0.05, 0);
            if (npc.alpha <= 0) {
                removeObjectFromArea(state, npc);
            }
            return;
        }
        const {mag} = getVectorToTarget(state, npc, state.hero);
        npc.messageAlpha = npc.alpha = Math.min(1, Math.max(0, 1 - (mag - 32) / 64));
    }
};
