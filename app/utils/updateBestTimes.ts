import { getKarmaTimeByKey, getKarmaForKey } from "app/scenes/bossRush/bossRushOptions";

export function returnFromBoss(state: GameState): string {
    let returnString = updateBestTimes(state);
    return returnString;
}

export function removeConditions(state: GameState) {
    if (state.savedState.objectFlags['bossRefight']) {
        delete state.savedState.objectFlags['bossRefight'];
        //Note: currently all bossRefight flag does is make it so you don't get a true 'game over' dying in boss rush
    }
    if (state.bossRushTrackers.currentCondition == 'daredevil') {
        state.hero.savedData.maxLife = state.bossRushTrackers.storedLife
        if (state.bossRushTrackers.hasIronSkin) 
            {state.hero.savedData.passiveTools.ironSkin = 1}
    }
    if (state.bossRushTrackers.currentCondition == 'weak') {
        state.hero.savedData.weaponUpgrades = state.bossRushTrackers.hasWeaponUpgrades;
        state.hero.savedData.weapon = state.bossRushTrackers.weaponNumber;
    }
    
    console.log(state.hero.savedData)
    state.bossRushTrackers.currentCondition = "none";
}


function updateBestTimes(state: GameState): string {
    console.log(state.hero.savedData.playTime)
    console.log(state.bossRushTrackers.bossStartTime)
    let currentBoss = state.bossRushTrackers.currentBoss;
    if (currentBoss != "none" ) {
        let condition = state.bossRushTrackers.currentCondition
        let finishTime = state.hero.savedData.playTime - state.bossRushTrackers.bossStartTime;
        const bestTime = state.savedState.bossRushTimes[condition][currentBoss] ?? Number.MAX_SAFE_INTEGER;
        if (bestTime == Number.MAX_SAFE_INTEGER) {
            console.log('REWARDING KARMA')
            rewardKarma(state) //WIP: Add message?
        }
        if (bestTime > finishTime) {
            console.log(finishTime)
            let returnString = "";
            let karmaTime = getKarmaTimeByKey(currentBoss);
            state.bossRushTrackers.currentBoss = "none";
            returnString = returnString.concat('Congrats, that is a new high score!')
            if (bestTime > karmaTime && karmaTime > finishTime && condition == 'none') {
                returnString = returnString.concat('{|}You earned Karma for beating my best time!')
                state.hero.savedData.karma += 1;
                console.log(state.hero.savedData)
            }
            state.savedState.bossRushTimes[condition][currentBoss] = finishTime;
            console.log(returnString)
            return returnString;
        } else {
            state.bossRushTrackers.currentBoss = "none"; 
            return 'Well done, but you\'ve been faster before.'
        }   
    }
}

function rewardKarma(state: GameState) {
    let boss = state.bossRushTrackers.currentBoss;
    state.hero.savedData.karma += getKarmaForKey(boss, state.bossRushTrackers.currentCondition)
}
