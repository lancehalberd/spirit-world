import { dialogueHash } from 'app/content/dialogue/dialogueHash';
import { enterZoneByTarget } from 'app/utils/enterZoneByTarget';

function travelToLocation(state: GameState, zoneKey: string, markerId: string): string {
    if (enterZoneByTarget(state, zoneKey, markerId, {instant: false})) {
    }
    return '';
}

function startRefight(state: GameState, boss: BossName, location: string): string {
    state.savedState.objectFlags["bossRefight"] = true,
    state.savedState.savedHeroData.bossRushTimes.bossStartTime = state.hero.savedData.playTime;
    state.savedState.savedHeroData.bossRushTimes.currentBoss = boss;
    return travelToLocation(state, 'bossRefights', location)
}

dialogueHash.refightVanara = {
    key: 'refightVanara',
    mappedOptions: {
        updateBestTimes: (state: GameState) => {
            if (state.savedState.objectFlags['rushMode']) {
                delete state.savedState.objectFlags['rushMode']; 
            }
            if (state.savedState.objectFlags['bossRefight']) {
                delete state.savedState.objectFlags['bossRefight'];
            }
            let currentBoss = state.savedState.savedHeroData.bossRushTimes.currentBoss;
            if (currentBoss != "none" ) {
                let finishTime = state.hero.savedData.playTime - state.savedState.savedHeroData.bossRushTimes.bossStartTime;
                console.log(currentBoss);
                console.log(finishTime);
                console.log(state.savedState.savedHeroData.bossRushTimes[currentBoss]);
                if (finishTime < state.savedState.savedHeroData.bossRushTimes[currentBoss]) {
                    state.savedState.savedHeroData.bossRushTimes[currentBoss] = finishTime;
                    state.savedState.savedHeroData.bossRushTimes.currentBoss = "none";
                    return 'Congrats, that is a new high score!'
                } else {
                    state.savedState.savedHeroData.bossRushTimes.currentBoss = "none"; 
                    return 'Well done, but you\'ve been faster before.'
                }   
            }
            return ''
        },
        chooseRefight: (state: GameState) => {
            console.log(state.savedState.savedHeroData.bossRushTimes);
            return `{choice:Fight who?
                    |Beetle:refightVanara.beetle
                    |Golem:refightVanara.golem
                    |Elemental Idols:refightVanara.idols
                    |Guardian:refightVanara.guardian
                    |Rival 2:refightVanara.rival2
                    |Collector:refightVanara.collector
                    |Storm Beast:refightVanara.stormBeast
                    |Rush:refightVanara.rush
                    |High Scores:refightVanara.highScores
                    |Nevermind:refightVanara.no
                    }`;
            },
            beetle: (state: GameState) => startRefight(state, 'beetle', 'beetleRefight'),
            golem: (state: GameState) => startRefight(state, 'golem', 'golemRefight'),
            idols: (state: GameState) => startRefight(state, 'idols', 'warTempleRefight'),
            rival2: (state: GameState) => startRefight(state, 'rival2', 'rival2Refight'),
            collector: (state: GameState) => startRefight(state, 'collector', 'crystalCollectorRefight'),
            stormBeast: (state: GameState) => startRefight(state,  'stormBeast', 'stormBeastRefight'),
            guardian: (state: GameState) => startRefight(state, 'guardian', 'guardianRefight'),
            rush: (state: GameState) => (
                state.savedState.objectFlags["rushMode"] = true,
                startRefight(state, 'rush', 'beetleRefight')
            ),
            highScores: (state: GameState) => {
                if (state.savedState.savedHeroData.bossRushTimes['beetle'] == Infinity) {
                    return `You haven't beaten the beetle yet!`
                } else {
                    return `Your fastest time for the beetle fight is 
                    ${Math.ceil(state.savedState.savedHeroData.bossRushTimes['beetle'] / 1000)} seconds`
                }
            },
            no: '',
        },
    options: [
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: ['refightVanara'],
            },
            text: [
                {
                    dialogueIndex: 195,
                    text: `I see you have fought many tough battles in your travels.
                    {|}If you want, I can let you reexperience any of them you want to refight.
                    {flag:refightVanara}{@refightVanara.chooseRefight}`,
                },
            ],
        },
        {
            logicCheck: {
                requiredFlags: [],
                excludedFlags: [],
            },
            text: [
                {
                    dialogueIndex: 197,
                    text: `{@refightVanara.updateBestTimes}
                    {@refightVanara.chooseRefight}`,
                },
            ],
        }
    ],
};
