import { Door } from 'app/content/objects/door';
import { Sign } from 'app/content/objects/sign';
import { allSections } from 'app/content/sections';
import { specialBehaviorsHash } from 'app/content/specialBehaviors/specialBehaviorsHash';
import { dialogueHash } from 'app/content/dialogue/dialogueHash';
import { setScript } from 'app/scriptEvents';
import { textScriptToString } from 'app/render/renderMessage';


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
            {|}POSSIBLE SHORT DETECTED IN BASEMENT.
            EMERGENCY ESCAPE HATCH OPENED IN BASEMENT.
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

function getElevatorFloor(state: GameState): number {
    const elevatorFixed = !!state.savedState.objectFlags.elevatorFixed;
    const elevatorDropped = !!state.savedState.objectFlags.elevatorDropped;
    const startingFloor = elevatorDropped ? 0 : 2;
    // Elevator is broken down at level 2 by default. 0 = basement, 1 = first floor, etc.
     return elevatorFixed
            ? state.savedState.objectFlags.elevatorFloor as number ?? startingFloor
            : startingFloor;
}

specialBehaviorsHash.elevatorControls = {
    type: 'sign',
    apply(state: GameState, sign: Sign) {
        this.onRefreshLogic(state, sign);
    },
    onRefreshLogic(state: GameState, sign: Sign) {
        const elevatorFalling = !!state.savedState.objectFlags.elevatorFalling;
        // Elevator controls don't work while the elevator is falling.
        if (elevatorFalling) {
            sign.message = '';
            return;
        }
        const elevatorFixed = !!state.savedState.objectFlags.elevatorFixed;
        const elevatorDropped = !!state.savedState.objectFlags.elevatorDropped;
        if (!elevatorFixed) {
            sign.message = textScriptToString(state, elevatorDropped
                ? dialogueHash.elevator.mappedOptions.powerFailureDropped
                : dialogueHash.elevator.mappedOptions.powerFailure);
            return;
        }
        // After the elevator is fixed, it functions normally.
        sign.message = textScriptToString(state, dialogueHash.elevator.mappedOptions.chooseFloor);
        const elevatorFloor = getElevatorFloor(state);
        // Set the results of choosing a floor based on the current floor the elevator is on:
        for (let i = 0; i < 6; i++) {
            dialogueHash.elevator.mappedOptions[`f${i}`] = (i === elevatorFloor)
                // Just play a confirm sound and do nothing if it is on this floor.
                ? `{playSound:switch}`
                // Do the move elevator sequence.
                : `
                    {playSound:switch}
                    {flag:elevatorClosed}
                    {wait:200}
                    {startScreenShake:1:0:elevator}
                    {wait:1500}
                    {stopScreenShake:elevator}
                    {wait:200}
                    {playSound:switch}
                    {clearFlag:elevatorClosed}
                    {flag:elevatorFloor=${i}}
                `;
        }
    },
};

const elevatorSectionIndex = 458;

specialBehaviorsHash.elevatorDoor = {
    type: 'door',
    apply(state: GameState, door: Door) {
        this.onRefreshLogic(state, door);
    },
    onRefreshLogic(state: GameState, door: Door) {
        const elevatorFixed = !!state.savedState.objectFlags.elevatorFixed;
        const elevatorDropped = !!state.savedState.objectFlags.elevatorDropped;
        const elevatorClosed = !!state.savedState.objectFlags.elevatorClosed;
        const elevatorFloor = getElevatorFloor(state);
        // Move the elevator section to the current floor so that the map looks correct.
        allSections[elevatorSectionIndex].section.floorId = ['B1', '1F', '2F', '3F', '4F', '5F'][elevatorFloor];
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
                const doorFloor = parseInt(door.definition.id.substring('elevatorDoor'.length), 10);
                // Interacting with the closed door will call the door to the current floor if the elevator is fixed.
                door.onGrab = (state: GameState) => {
                    setScript(state, !elevatorFixed
                        ? `The door won't open.`
                        : `
                        {playSound:switch}
                        {wait:500}
                        {playSound:switch}
                        {flag:elevatorFloor=${doorFloor}}`
                    );
                    state.hero.action = null;
                };
            }
        }
    },
};
