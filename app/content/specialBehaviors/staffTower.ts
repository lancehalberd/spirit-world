import { refreshAreaLogic } from 'app/content/areas';
import { dialogueHash } from 'app/content/dialogue/dialogueHash';
import { specialBehaviorsHash } from 'app/content/specialBehaviors/specialBehaviorsHash';
import { Sign } from 'app/content/objects/sign';
import { StaffTower } from 'app/content/objects/staffTower';
import { showMessage } from 'app/scriptEvents';
import { saveGame } from 'app/utils/saveGame';


specialBehaviorsHash.staffTower = {
    type: 'area',
    apply(state: GameState, area: AreaInstance) {
        this.onRefreshLogic(state, area);
    },
    onRefreshLogic(state: GameState, area: AreaInstance) {
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
                    if (object.isEnemyTarget) {
                        const enemy = object as Enemy;
                        if (enemy.definition.enemyType === 'lightningDrone' || enemy.definition.enemyType === 'sentryBot') {
                            object.status = 'off';
                        }
                    }
                }
            }
        }
    },
};
specialBehaviorsHash.towerTeleporter = {
    type: 'sign',
    apply(state: GameState, object: Sign) {
        this.onRefreshLogic(state, object);
    },
    onRefreshLogic(state: GameState, object: Sign) {
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
        this.onRefreshLogic(state, object);
    },
    onRefreshLogic(state: GameState, object: Sign) {
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
        this.onRefreshLogic(state, object, true);
    },
    onRefreshLogic(state: GameState, object: Sign, fresh = false) {
        const terminalLocation = object.definition.id.split(':')[1] as StaffTowerLocation;
        const staffIsInInventory = state.hero.savedData.activeTools.staff >= 2;
        const towerIsHere = !staffIsInInventory && terminalLocation === state.savedState.staffTowerLocation;
        const towerIsOn = !!state.savedState.objectFlags.elementalBeastsEscaped;
        //console.log(state.savedState.staffTowerLocation, object.definition.id, {staffIsInInventory, towerIsHere, towerIsOn})
        if (!towerIsOn && towerIsHere) {
            object.status = 'off';
            return;
        }
        if (!towerIsHere && !staffIsInInventory) {
            object.status = 'hidden';
            return;
        }
        object.status = 'normal';
    },
    onRead(state: GameState, object: Sign) {
        const terminalLocation = object.definition.id.split(':')[1] as StaffTowerLocation;
        const staffIsInInventory = state.hero.savedData.activeTools.staff >= 2;
        const towerIsHere = !staffIsInInventory && terminalLocation === state.savedState.staffTowerLocation;
        const towerIsOn = !!state.savedState.objectFlags.elementalBeastsEscaped;
        //console.log(state.savedState.staffTowerLocation, object.definition.id, {staffIsInInventory, towerIsHere, towerIsOn})
        if (!towerIsOn && towerIsHere) {
            return;
        }
        if (!towerIsHere && !staffIsInInventory) {
            return;
        }
        if (staffIsInInventory) {
            dialogueHash.towerExteriorTerminal.mappedOptions.deploy = (state: GameState) => {
                state.savedState.staffTowerLocation = terminalLocation;
                state.hero.savedData.activeTools.staff &= ~2;
                // Unequip the staff if the hero has no remaining staff.
                if (!state.hero.savedData.activeTools.staff) {
                    if (state.hero.savedData.leftTool === 'staff') {
                        delete state.hero.savedData.leftTool;
                    }
                    if (state.hero.savedData.rightTool === 'staff') {
                        delete state.hero.savedData.rightTool;
                    }
                }
                refreshAreaLogic(state, state.hero.area, true);
                saveGame(state);
                for (const object of state.areaInstance.objects) {
                    if (object.definition.type === 'staffTower') {
                        (object as StaffTower).deploy(state);
                        return '';
                    }
                }
                return '';
            };
            return showMessage(state, `
                DEPLOY THE TOWER TO THIS LOCATION?
                {choice:DEPLOY?|Yes:towerExteriorTerminal.deploy|No}
            `);
        }
        if (!state.savedState.objectFlags.stormBeast) {
            return showMessage(state, `
                !WARNING![-]
                ENERGY SURGES HAVE COMPROMISED PRIMARY FUNCTIONS.
            `);
        }
        if (!state.savedState.objectFlags.staffTowerActivated) {
            return showMessage(state, `
                THIS TERMINAL CONTROLS TOWER DEPLOYMENT.{|}
                UNAUTHORIZED OPERATION IS PROHIBITED.
            `);
        }
        return showMessage(state, `
            THIS TERMINAL CONTROLS TOWER DEPLOYMENT.{|}
            COLLAPSE TOWER FOR RELOCATION?
            {choice:COLLAPSE?|Yes:towerExteriorTerminal.collapse|No}
        `);
    }
};
dialogueHash.towerExteriorTerminal = {
    key: 'towerTeleporter',
    mappedOptions: {
        collapse(state: GameState) {
            for (const object of state.areaInstance.objects) {
                if (object.definition.type === 'staffTower') {
                    (object as StaffTower).collapse(state);
                    return '';
                }
            }
            return '';
        }
    },
    options: [],
};
