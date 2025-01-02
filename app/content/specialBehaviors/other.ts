import {specialBehaviorsHash} from 'app/content/specialBehaviors/specialBehaviorsHash';
import {removeObjectFromArea} from 'app/utils/objects';

// Only display the money prize in the money maze once the Peach has been collected
// but not immediately after collecting it, only on entering the area again later.
specialBehaviorsHash.moneyMazeMoneyPrize = {
    type: 'loot',
    apply(state: GameState, object: ObjectInstance) {
        if (!state.savedState.objectFlags.moneyMazePeachPiece) {
            removeObjectFromArea(state, object);
        }
    },
};
