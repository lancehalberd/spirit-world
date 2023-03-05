import { specialBehaviorsHash } from 'app/content/specialBehaviors/specialBehaviorsHash';

import { AreaInstance, GameState } from 'app/types';

specialBehaviorsHash.peachCave = {
    type: 'area',
    apply(state: GameState, area: AreaInstance) {
        const bossDefeated = !!state.savedState.objectFlags.peachCaveBoss;
        if (bossDefeated) {
            area.dark = Math.max(area.definition.dark, 90);
        }
    },
};
