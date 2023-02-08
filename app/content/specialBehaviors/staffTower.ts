import { dialogueHash } from 'app/content/dialogue/dialogueHash';
import { specialBehaviorsHash } from 'app/content/specialBehaviors/specialBehaviorsHash';
import { Sign } from 'app/content/objects/sign';

import { AreaInstance, Enemy, Escalator, GameState } from 'app/types';

specialBehaviorsHash.staffTower = {
    type: 'area',
    apply(state: GameState, area: AreaInstance) {
        const towerIsOn = !!state.savedState.objectFlags.elementalBeastsEscaped;
        const towerIsHaywire = towerIsOn && !state.savedState.objectFlags.stormBeast;
        if (!towerIsOn) {
            // Before the tower is turned on, everything is off and dark.
            area.dark = Math.max(area.definition.dark || 0, 50);
            for (const object of area.objects) {
                if (object.isEnemyTarget) {
                    const enemy = object as Enemy;
                    if (enemy.definition.enemyType === 'lightningDrone' || enemy.definition.enemyType === 'sentryBot') {
                        object.status = 'off';
                    }
                }
                switch (object.definition.type) {
                    case 'sign':
                    case 'escalator':
                        object.status = 'off';
                }
            }
        } else {
            // Once the elevator is fixed, the basement gets brighter.
            if (state.savedState.objectFlags.elevatorFixed) {
                area.dark = Math.min(area.dark, 50);
            }
            if (!towerIsHaywire) {
                // After the tower is fixed, most things are on, but traps/obstacles are disbabled.
                for (const object of area.objects) {
                    if (object?.definition.type === 'escalator') {
                        (object as Escalator).speed = 'slow';
                    } else if (object?.definition.type === 'anode') {
                        object.status = 'off';
                    }
                }
            }
        }
    },
};
specialBehaviorsHash.towerTeleporter = {
    type: 'sign',
    apply(state: GameState, object: Sign) {
        object.message = object.area.definition.isSpiritWorld
            ? 'THIS TERMINAL CONTROLS TRANSFER TO THE CORE?{choice:TRANSFER?|Yes:towerTeleporter.teleport|No}'
            : 'THIS TERMINAL CONTROLS TRANSFER TO THE PERIPHERY.{choice:TRANSFER?|Yes:towerTeleporter.teleport|No}'
    }
};

dialogueHash.towerTeleporter = {
    key: 'towerTeleporter',
    mappedOptions: {
        // Use this when we can enable terminal for the astral projection.
        failToTeleport: `ERROR ACQUIRING TARGET FOR TRANSFER.`,
        teleport: `{teleport}`,
    },
    options: [],
};

specialBehaviorsHash.towerLargeTerminal = {
    type: 'sign',
    apply(state: GameState, object: Sign) {
        const towerIsHaywire = !state.savedState.objectFlags.stormBeast;
        if (towerIsHaywire) {
            object.message = `
                !WARNING![-]
                ENERGY SURGES HAVE COMPROMISED PRIMARY FUNCTIONS.{|}
                UNABLE TO COMPENSATE.{|}
                MANUAL REPAIRS MAY BE REQUIRED IF ENERGY SURGES DO NOT DISPERSE.
            `;
            return;
        }
        if (!state.savedState.objectFlags.staffTowerActivated) {
            object.message = `
                PRIMARY FUNCTION RESTORED[-]
                ...{|}
                OPERATIONAL MANIFEST CORRUPTED, CREATE NEW MANIFEST?
                {choice:CREATE MANIFEST?|Yes:towerLargeTerminal.initialize|No:towerLargeTerminal.no}
            `;
            return;
        }
        object.message = 'TOWER CONTROLS TRANSFERED TO NEW OPERATOR.[-]USE EXTERIOR TERMINAL TO MOVE TOWER.';
    }
};
dialogueHash.towerLargeTerminal = {
    key: 'towerTeleporter',
    mappedOptions: {
        no: `OPERATIONAL MANIFEST CORRUPTED, AWAITING NEW MANIFEST.`,
        notOperator: `
            UNABLE TO COMPLETE OPERATION.[-]
            NEW OPERATOR MUST BE PRESENT FOR SCANNING.
        `,
        initializeFailure: `
            CREATING NEW MANIFEST[-]
            ARE YOU THE OPERATOR?
            {choice:CONFIRM?|Yes:towerLargeTerminal.assignOperatorFailure|No:towerLargeTerminal.notOperator}
        `,
        initialize: `
            CREATING NEW MANIFEST[-]
            ARE YOU THE OPERATOR?
            {choice:CONFIRM?|Yes:towerLargeTerminal.assignOperator|No:towerLargeTerminal.notOperator}
        `,
        // Use this when we can allow the astral projection to read the terminal.
        assignOperatorFailure: `
            INITIALIZING SCAN[-]
            ...
            {wait:500}
            ERROR AQUIRING TARGET FOR SCANNING, ABORTING OPERATION.
        `,
        assignOperator: `
            INITIALIZING SCAN[-]
            ...
            {wait:500}
            SCAN COMPLETE[-]
            {flag:staffTowerActivated}
            ...
            TOWER CONTROLS TRANSFERED TO NEW OPERATOR.[-]
            USE EXTERIOR TERMINAL TO MOVE TOWER.
        `,
    },
    options: [],
};

specialBehaviorsHash.towerExteriorTerminal = {
    type: 'sign',
    apply(state: GameState, object: Sign) {
        const towerIsOn = !!state.savedState.objectFlags.elementalBeastsEscaped;
        if (!towerIsOn) {
            object.status = 'off';
            return;
        }
        if (!state.savedState.objectFlags.stormBeast) {
            object.message = `
                !WARNING![-]
                ENERGY SURGES HAVE COMPROMISED PRIMARY FUNCTIONS.
            `;
            return;
        }
        if (!state.savedState.objectFlags.staffTowerActivated) {
            object.message = `
                THIS TERMINAL CONTROLS TOWER DEPLOYMENT.{|}
                UNAUTHORIZED OPERATION IS PROHIBITED.
            `;
            return;
        }
        object.message = `
            THIS TERMINAL CONTROLS TOWER DEPLOYMENT.{|}
            COLLAPSE TOWER FOR RELOCATION?
            {choice:COLLAPSE?|Yes:towerExteriorTerminal.collapse|No}
        `;
    }
};
dialogueHash.towerExteriorTerminal = {
    key: 'towerTeleporter',
    mappedOptions: {
        collapse: `{item:staff=2}`,
    },
    options: [],
};
