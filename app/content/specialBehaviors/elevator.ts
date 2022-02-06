import { Door } from 'app/content/objects/door';
import { Sign } from 'app/content/objects/sign';
import { specialBehaviorsHash } from 'app/content/specialBehaviors/specialBehaviorsHash';
import { dialogueHash } from 'app/content/dialogue/dialogueHash';
import { setScript } from 'app/scriptEvents';

import { GameState } from 'app/types';

dialogueHash.elevator = {
    key: 'elevator',
    mappedOptions: {
        powerFailure: `
            !WARNING![-]POWER FAILURE DETECTED
            {|}EMERGENCY BREAK ACTIVATED
            {choice:RELEASE BREAK?|Yes:elevator.releaseBreak|No}
        `,
        powerFailureDropped: `
            !WARNING![-]POWER FAILURE DETECTED
            {|}ACTIVATE BACKUP GENERATOR IN BASEMENT.
        `,
        releaseBreak: `
            {flag:elevatorFalling}
            {playSound:switch}
            {flag:elevatorClosed}
            {wait:1000}
            {startScreenShake:2:0:elevator}
            {playSound:enemyDeath}{wait:600}
            {playSound:enemyDeath}{wait:400}
            {playSound:enemyDeath}{wait:400}
            {playSound:enemyDeath}{wait:200}
            {playSound:enemyDeath}{wait:600}
            {screenShake:0:10:500}
            {playSound:cloneExplosion}{wait:500}
            {stopScreenShake:elevator}{wait:500}
            {clearFlag:elevatorClosed}
            {flag:elevatorDropped}
            {clearFlag:elevatorFalling}
        `,
        chooseFloor: `
            {choice:SELECT FLOOR|B1:elevator.f0|1F:elevator.f1|2F:elevator.f2|3F:elevator.f3|4F:elevator.f4|5F:elevator.f5}
        `
    },
    options: [],
}

specialBehaviorsHash.elevatorControls = {
    type: 'sign',
    apply(state: GameState, sign: Sign) {
        const elevatorFalling = !!state.savedState.objectFlags.elevatorFalling;
        // Elevator controls don't work while the elevator is falling.
        if (elevatorFalling) {
            sign.message = '';
            return;
        }
        const elevatorFixed = !!state.savedState.objectFlags.elevatorFixed;
        const elevatorDropped = !!state.savedState.objectFlags.elevatorDropped;
        if (!elevatorFixed) {
            sign.message = elevatorDropped
                ? dialogueHash.elevator.mappedOptions.powerFailureDropped
                : dialogueHash.elevator.mappedOptions.powerFailure;
            return;
        }
        // After the elevator is fixed, it functions normally.
        sign.message = dialogueHash.elevator.mappedOptions.chooseFloor;
        const elevatorFloor = state.savedState.objectFlags.elevatorFloor || 2;
        // Set the results of choosing a floor based on the current floor the elevator is on:
        for (let i = 0; i < 6; i++) {
            dialogueHash.elevator.mappedOptions[`f${i}`] = (i === elevatorFloor)
                // Just play a confirm sound and do nothing if it is on this floor.
                ? `{playSound:switch}`
                // Do the move elevator sequence.
                : `{playSound:switch}{flag:elevatorClosed}{wait:1500}{clearFlag:elevatorClosed}{flag:elevatorFloor=${i}}`;
        }
    },
};

specialBehaviorsHash.elevatorDoor = {
    type: 'door',
    apply(state: GameState, door: Door) {
        const elevatorFixed = !!state.savedState.objectFlags.elevatorFixed;
        const elevatorDropped = !!state.savedState.objectFlags.elevatorDropped;
        const elevatorClosed = !!state.savedState.objectFlags.elevatorClosed;
        // Elevator is broken down at level 2 by default. 0 = basement, 1 = first floor, etc.
        const elevatorFloor = elevatorFixed
            ? (state.savedState.objectFlags.elevatorFloor || 2)
            : (elevatorDropped ? 0 : 2);
        // The interior elevator door.
        if (door.definition.id === 'elevatorDoor') {
            door.changeStatus(state, elevatorClosed ? 'closed' : 'normal');
            if (!elevatorFixed) {
                // The broken elevator is stuck at floor 2 and then drops to floor 0(basement)
                door.definition.targetObjectId = elevatorDropped
                    ? 'elevatorDoor0' : 'elevatorDoor2';
            } else {
                door.definition.targetObjectId = `elevatorDoor${elevatorFloor}`;
            }
        } else {
            // The outside door is closed unless the elevator is on this floor
            if (door.definition.id === `elevatorDoor${elevatorFloor}`) {
                door.changeStatus(state, 'normal');
            } else {
                door.changeStatus(state, 'closed');
                const doorFloor = parseInt(door.definition.id, 10);
                // Interacting with the closed door will call the door to the current floor if the elevator is fixed.
                door.onGrab = (state: GameState) => {
                    setScript(state, elevatorFixed
                        ? `The door won't open.`
                        : `{playSound:switch}{wait:1500}{flag:elevatorFloor=${doorFloor}}`
                    );
                    state.hero.action = null;
                };
            }
        }
    },
};
