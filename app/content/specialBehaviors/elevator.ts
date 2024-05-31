import { specialBehaviorsHash } from 'app/content/specialBehaviors/specialBehaviorsHash';
import { dialogueHash } from 'app/content/dialogue/dialogueHash';

dialogueHash.elevator = {
    key: 'elevator',
    mappedOptions: {

    },
    options: [],
}

specialBehaviorsHash.staffTowerElevator = {
    type: 'elevator',
    apply(state: GameState, elevator: Elevator) {
        this.onRefreshLogic(state, elevator);
    },
    onRefreshLogic(state: GameState, elevator: Elevator) {
        const elevatorFixed = !!state.savedState.objectFlags.elevatorFixed;
        // Clear the crashed status once the elevator is fixed.
        if (elevator.specialStatus === 'crashed' && elevatorFixed) {
            delete elevator.specialStatus;
            return;
        }
        // Do not override other special statuses of the elevator once it is set.
        if (elevator.specialStatus) {
            return;
        }
        const towerIsOn = !!state.savedState.objectFlags.elementalBeastsEscaped;
        if (!towerIsOn) {
            elevator.specialStatus = 'off';
            return;
        }

        if (!elevatorFixed) {
            elevator.specialStatus = 'stuck';
            return;
        }
    },
};
