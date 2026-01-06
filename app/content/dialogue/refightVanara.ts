import { dialogueHash } from 'app/content/dialogue/dialogueHash';
import { altGolemState } from '../heroSavedStates';
import { alterHeroData } from 'app/utils/alterHeroData';

const aBosses: BossName[] = ["beetle", "golem", "idols", "guardian", "rush", "altGolem"];
const bBosses: BossName[] = aBosses.concat(["guardian", "rival2", "forest", "rush2"])
const cBosses: BossName[] = bBosses.concat(["flameBeast", "frostBeast", "stormBeast", "rush3"])
const bossRushNames: {[key in BossName]: string} = {
    none: "",
    beetle: "Beetle",
    golem: "Golem",
    idols: "Idols",
    guardian: "Guardian",
    rival2: "Rival 2",
    forest: "Idols 2",
    collector: "Collector",
    stormBeast: "Storm Beast",
    flameBeast: "Flame Beast",
    frostBeast: "Frost Beast",
    rush: "Boss Rush 1",
    rush2: "Boss Rush 2",
    rush3: "Boss Rush 3",
    altGolem: "Challenge - Golem"
}




export function travelToLocation(state: GameState, zoneKey: string, markerId: string): string {
  if (state.travel) {
    state.travel(zoneKey, markerId, {instant: false});
    return '';
  }
  console.log("Can't find travel function!")
}

function startRefight(state: GameState, boss: BossName, location: string): string {
    state.savedState.objectFlags["bossRefight"] = true,
    state.bossRushTrackers.bossStartTime = state.hero.savedData.playTime;
    state.bossRushTrackers.currentBoss = boss;
    return travelToLocation(state, 'bossRefights', location);
}

function getHighScores(state: GameState, bosses: BossName[]): string {
    let highScoreReturn: string = '';
    for (const boss of bosses) {
        let time = state.savedState.savedHeroData.bossRushTimes[boss]
        if (typeof time !== 'number' || !Number.isFinite(time)) {
            highScoreReturn = highScoreReturn.concat(bossRushNames[boss] + `: N/A[-]`);
        } else {
            highScoreReturn = highScoreReturn.concat(bossRushNames[boss] + `: ${Math.ceil(time / 1000)} seconds[-]`);
        }
    }
    return highScoreReturn;
}

dialogueHash.refightVanara = {
    key: 'refightVanara',
    mappedOptions: { //A is for initial set of bosses, B is for bosses unlocked after freeing the beasts, C will be for beasts
        chooseRefight1A : (state: GameState) => {
            return `{choice:Fight who?
                    |Beetle:refightVanara.beetle
                    |Golem:refightVanara.golem
                    |Idols:refightVanara.idols
                    |Guardian:refightVanara.guardian
                    |Rush:refightVanara.rush
                    |High Scores:refightVanara.highScoresA
                    |Nevermind:refightVanara.no
                    }`;
        },
        chooseRefight1B : (state: GameState) => {
            return `{choice:Fight who?
                    |Beetle:refightVanara.beetle
                    |Golem:refightVanara.golem
                    |Idols:refightVanara.idols
                    |Guardian:refightVanara.guardian
                    |Alt Golem:refightVanara.altGolem
                    |Rush:refightVanara.rush
                    |Next:refightVanara.chooseRefight2B
                    |Nevermind:refightVanara.no
                    }`;
        },
        chooseRefight2B :(state: GameState) => {
            return `{choice:Fight who?
                    |Rival 2:refightVanara.rival2
                    |Collector:refightVanara.collector
                    |Forest Idols:refightVanara.forest
                    |Rush 2:refightVanara.rush2
                    |High Scores:refightVanara.highScoresB
                    |Back:refightVanara.chooseRefight1B
                    |Nevermind:refightVanara.no
                    }`;
        },
        chooseRefight1C : (state: GameState) => {
            return `{choice:Fight who?
                    |Beetle:refightVanara.beetle
                    |Golem:refightVanara.golem
                    |Idols:refightVanara.idols
                    |Guardian:refightVanara.guardian
                    |Alt Golem:refightVanara.altGolem
                    |Rush:refightVanara.rush
                    |Next:refightVanara.chooseRefight2C
                    |Nevermind:refightVanara.no
                    }`;
        }, chooseRefight2C :(state: GameState) => {
            return `{choice:Fight who?
                    |Rival 2:refightVanara.rival2
                    |Collector:refightVanara.collector
                    |Idols 2:refightVanara.forest
                    |Rush 2:refightVanara.rush2
                    |Next:refightVanara.chooseRefight3C
                    |Back:refightVanara.chooseRefight1C
                    |Nevermind:refightVanara.no
                    }`;
        }, chooseRefight3C :(state: GameState) => {
            return `{choice:Fight who?
                    |Frost Beast:refightVanara.frostBeast
                    |Flame Beast:refightVanara.flameBeast
                    |Storm Beast:refightVanara.stormBeast
                    |Rush 3:refightVanara.rush3
                    |High Scores:refightVanara.highScoresC
                    |Back:refightVanara.chooseRefight2C
                    |Nevermind:refightVanara.no
                    }`;
        },
        beetle: (state: GameState) => startRefight(state, 'beetle', 'beetleRefight'),
        golem: (state: GameState) => startRefight(state, 'golem', 'golemRefight'),
        idols: (state: GameState) => startRefight(state, 'idols', 'warTempleRefight'),
        rival2: (state: GameState) => startRefight(state, 'rival2', 'rival2Refight'),
        forest: (state: GameState) => startRefight(state, 'forest', 'forestTempleRefight'),
        collector: (state: GameState) => startRefight(state, 'collector', 'crystalCollectorRefight'),
        flameBeast: (state: GameState) => startRefight(state, 'flameBeast', 'flameBeastRefight'),
        frostBeast: (state: GameState) => startRefight(state, 'frostBeast', 'frostBeastRefight'),
        stormBeast: (state: GameState) => startRefight(state,  'stormBeast', 'stormBeastRefight'),
        guardian: (state: GameState) => startRefight(state, 'guardian', 'guardianRefight'),
        altGolem: (state:GameState) => (
            alterHeroData(state, altGolemState),
            state.savedState.usingBackup = true,
            startRefight(state, 'altGolem', 'golemRefight') //WIP: make AltGolem be stored seperately from guardian in time attack
        ),
        rush: (state: GameState) => (
            state.savedState.objectFlags["rushMode"] = true,
            state.bossRushTrackers.rushPosition = 0,
            startRefight(state, 'rush', 'beetleRefight')
        ),
        rush2: (state: GameState) => (
            state.savedState.objectFlags["rushMode"] = true,
            state.bossRushTrackers.rushPosition = 4,
            startRefight(state, 'rush2', 'forestTempleRefight')
        ),
        rush3: (state: GameState) => (
            state.savedState.objectFlags["rushMode"] = true,
            state.bossRushTrackers.rushPosition = 7,
            startRefight(state, 'rush3', 'frostBeastRefight')
        ),
        highScoresA: (state: GameState) => {
            return getHighScores(state, aBosses)
        },
        highScoresB: (state: GameState) => {
            return getHighScores(state, bBosses)
        },
        highScoresC: (state: GameState) => {
            return getHighScores(state, cBosses)
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
                requiredFlags: ['frostBeast', 'flameBeast', 'stormBeast'],
                excludedFlags: [],
            },
            text: [
                {
                    dialogueIndex: 200,
                    text:'{@refightVanara.chooseRefight1C}'
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
                    dialogueIndex: 199,
                    text:'{@refightVanara.chooseRefight1B}'
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
                    text:'{@refightVanara.chooseRefight1A}'
                },
            ],
        },

    ],
};
