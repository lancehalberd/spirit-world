export function updateBestTimes(state: GameState): string {
    if (state.savedState.objectFlags['rushMode']) {
        delete state.savedState.objectFlags['rushMode']; 
    }
    if (state.savedState.objectFlags['bossRefight']) {
        delete state.savedState.objectFlags['bossRefight'];
    }
    let currentBoss = state.bossRushTrackers.currentBoss;
    if (currentBoss != "none" ) {
        let finishTime = state.hero.savedData.playTime - state.bossRushTrackers.bossStartTime;
        const bestTime = state.savedState.savedHeroData.bossRushTimes[currentBoss] ?? Number.MAX_SAFE_INTEGER;
        if (bestTime > finishTime) {
            state.savedState.savedHeroData.bossRushTimes[currentBoss] = finishTime;
            state.bossRushTrackers.currentBoss = "none";
            return 'Congrats, that is a new high score!'
        } else {
            state.bossRushTrackers.currentBoss = "none"; 
            return 'Well done, but you\'ve been faster before.'
        }   
    }
    return ''
}