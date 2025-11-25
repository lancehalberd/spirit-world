import { dialogueHash } from 'app/content/dialogue/dialogueHash';


export function travelToLocation(state: GameState, zoneKey: string, markerId: string): string {
  if (state.travel) {
    state.travel(zoneKey, markerId, {instant: false});
    return '';
  }
  console.log("Can't find travel function!")
}

function startRefight(state: GameState, boss: BossName, location: string): string {
    console.log(state.savedState.savedHeroData.bossRushTrackers)
    state.savedState.objectFlags["bossRefight"] = true,
    state.savedState.savedHeroData.bossRushTrackers.bossStartTime = state.hero.savedData.playTime;
    state.savedState.savedHeroData.bossRushTrackers.currentBoss = boss;
    console.log(state.savedState.savedHeroData.bossRushTrackers)
    return travelToLocation(state, 'bossRefights', location)
}

dialogueHash.refightVanara = {
    key: 'refightVanara',
    mappedOptions: {
        /*updateBestTimes: (state: GameState) => {
            console.log(state.savedState.savedHeroData.bossRushTrackers)
            console.log(state.savedState.savedHeroData.bossRushTimes)
            if (state.savedState.objectFlags['rushMode']) {
                delete state.savedState.objectFlags['rushMode']; 
            }
            if (state.savedState.objectFlags['bossRefight']) {
                delete state.savedState.objectFlags['bossRefight'];
            }
            let currentBoss = state.savedState.savedHeroData.bossRushTrackers.currentBoss;
            if (currentBoss != "none" ) {
                let finishTime = state.hero.savedData.playTime - state.savedState.savedHeroData.bossRushTrackers.bossStartTime;
                console.log(currentBoss);
                console.log(finishTime);
                console.log(state.savedState.savedHeroData.bossRushTimes[currentBoss]);
                if (finishTime < state.savedState.savedHeroData.bossRushTimes[currentBoss]) {
                    state.savedState.savedHeroData.bossRushTimes[currentBoss] = finishTime;
                    state.savedState.savedHeroData.bossRushTrackers.currentBoss = "none";
                    return 'Congrats, that is a new high score!'
                } else {
                    state.savedState.savedHeroData.bossRushTrackers.currentBoss = "none"; 
                    return 'Well done, but you\'ve been faster before.'
                }   
            }
            return ''
        },*/
        chooseRefight1Early : (state: GameState) => {
            return `{choice:Fight who?
                    |Beetle:refightVanara.beetle
                    |Golem:refightVanara.golem
                    |Elemental Idols:refightVanara.idols
                    |Guardian:refightVanara.guardian
                    |Rush:refightVanara.rush
                    |Nevermind:refightVanara.no
                    }`;
        },
        chooseRefight1 : (state: GameState) => {
            return `{choice:Fight who?
                    |Beetle:refightVanara.beetle
                    |Golem:refightVanara.golem
                    |Elemental Idols:refightVanara.idols
                    |Guardian:refightVanara.guardian
                    |Rush:refightVanara.rush
                    |Next:refightVanara.chooseRefight2
                    |Nevermind:refightVanara.no
                    }`;
        },
        chooseRefight2 :(state: GameState) => {
            return `{choice:Fight who?
                    |Rival 2:refightVanara.rival2
                    |Collector:refightVanara.collector
                    |Forest Idols:refightVanara.forest
                    |Storm Beast:refightVanara.stormBeast
                    |Rush 2:refightVanara.rush2
                    |Back:refightVanara.chooseRefight1
                    |Nevermind:refightVanara.no
                    }`;
        },
        beetle: (state: GameState) => startRefight(state, 'beetle', 'beetleRefight'),
        golem: (state: GameState) => startRefight(state, 'golem', 'golemRefight'),
        idols: (state: GameState) => startRefight(state, 'idols', 'warTempleRefight'),
        rival2: (state: GameState) => startRefight(state, 'rival2', 'rival2Refight'),
        forest: (state: GameState) => startRefight(state, 'forest', 'forestTempleRefight'),
        collector: (state: GameState) => startRefight(state, 'collector', 'crystalCollectorRefight'),
        stormBeast: (state: GameState) => startRefight(state,  'stormBeast', 'stormBeastRefight'),
        guardian: (state: GameState) => startRefight(state, 'guardian', 'guardianRefight'),
        rush: (state: GameState) => (
            state.savedState.objectFlags["rushMode"] = true,
            state.savedState.savedHeroData.bossRushTrackers.rushPosition = 1,
            startRefight(state, 'rush', 'beetleRefight')
        ),
        rush2: (state: GameState) => (
            state.savedState.objectFlags["rushMode"] = true,
            state.savedState.savedHeroData.bossRushTrackers.rushPosition = 1,
            startRefight(state, 'rush2', 'forestTempleRefight')
        ),
        highScores: (state: GameState) => {
            if (state.savedState.savedHeroData.bossRushTimes['beetle'] == 10000000) {
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
                    {flag:refightVanara}`,
                },
            ],
        },
        {
            logicCheck: {
                requiredFlags: ['elementalBeastsEscaped'],
                excludedFlags: [],
            },
            text: [
                {
                    dialogueIndex: 197,
                    text:'{@refightVanara.chooseRefight1}'
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
                    dialogueIndex: 198,
                    text:'{@refightVanara.chooseRefight1Early}'
                },
            ],
        },

    ],
};
