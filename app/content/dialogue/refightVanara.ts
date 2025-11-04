import { dialogueHash } from 'app/content/dialogue/dialogueHash';
import { enterZoneByTarget } from 'app/utils/enterZoneByTarget';

function travelToLocation(state: GameState, zoneKey: string, markerId: string): string {
    if (enterZoneByTarget(state, zoneKey, markerId, {instant: false})) {
    }
    return '';
}

dialogueHash.refightVanara = {
    key: 'refightVanara',
    mappedOptions: {
        chooseRefight: (state: GameState) => {
            delete state.savedState.objectFlags['beetleRefight'];
            delete state.savedState.objectFlags['golemRefight'];
            delete state.savedState.objectFlags['warTempleRefight'];
            delete state.savedState.objectFlags['rival2Refight'];
            delete state.savedState.objectFlags['rushMode'];
            return `{choice:Where to?
                    |Beetle:refightVanara.beetle
                    |Golem:refightVanara.golem
                    |Elemental Idols:refightVanara.idols
                    |Rival 2:refightVanara.rival2
                    |Rush:refightVanara.rush
                    |Nevermind:refightVanara.no
                    }`;
            },
            beetle: (state: GameState) => travelToLocation(state, 'bossRefights', 'beetleRefight'),
            golem: (state: GameState) => travelToLocation(state, 'bossRefights', 'golemRefight'),
            idols: (state: GameState) => travelToLocation(state, 'bossRefights', 'warTempleRefight'),
            rival2: (state: GameState) => travelToLocation(state, 'bossRefights', 'rival2Refight'),
            rush: (state: GameState) => (
                state.savedState.objectFlags["rushMode"] = true,
                travelToLocation(state, 'bossRefights', 'beetleRefight')
            ),
            no: '',
        },
    options: [
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: [],
            },
            text: [
                {
                    dialogueIndex: 195,
                    text: `I see you have fought many tough battles in your travels.
                    {|}If you want, I can let you reexperience any of them you want to refight.
                    {@refightVanara.chooseRefight}`,
                },
            ],
        },
    ],
};
