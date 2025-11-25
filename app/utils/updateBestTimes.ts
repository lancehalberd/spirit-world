export function updateBestTimes(state: GameState): string {
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
}