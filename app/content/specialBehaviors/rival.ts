import { refreshAreaLogic } from 'app/content/areas';
import { specialBehaviorsHash } from 'app/content/specialBehaviors/specialBehaviorsHash';
import { saveGame } from 'app/utils/saveGame';

import { GameState, ObjectInstance } from 'app/types';

specialBehaviorsHash.tombEntranceSwitch = {
    type: 'crystalSwitch',
    onActivate(state: GameState, object: ObjectInstance) {
        // The first time a switch for the tomb entrance is activated, the rival,
        // who is guarding the tomb, becomes enraged triggering a small boss fight.
        if (!state.savedState.objectFlags.tombRivalEnraged) {
            state.savedState.objectFlags.tombRivalEnraged = true;
            refreshAreaLogic(state, object.area);
            saveGame(state);
        }
    },
};
