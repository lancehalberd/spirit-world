import {setSpawnLocation} from 'app/content/spawnLocations';
import {sceneHash} from "app/scenes/sceneHash";
import {appendCallback, showMessage} from 'app/scriptEvents';
import {backupHeroData, restoreHeroData} from 'app/utils/alterHeroData';
import {enterZoneByTarget} from 'app/utils/enterZoneByTarget';
import {fixCamera} from 'app/utils/fixCamera';
import {formatMinutesAndSeconds} from 'app/utils/formatters';
import {saveGame} from 'app/utils/saveGame';


export const bossSpawnPoints: {[key in BossKey]: string} = {
    beetle: 'beetleHeroSpawnPoint',
    golem: 'golemHeroSpawnPoint',
    idols: 'idolsHeroSpawnPoint',
    guardian: 'guardianHeroSpawnPoint',
    rival2: 'helixRivalHeroSpawnPoint',
    forestTempleBoss: 'forestTempleBossHeroSpawnPoint',
    collector: 'collectorHeroSpawnPoint',
    stormBeast: 'stormBeastHeroSpawnPoint',
    flameBeast: 'flameBeastHeroSpawnPoint',
    frostBeast: 'frostBeastHeroSpawnPoint',
};

// Initialize and show the boss rush menu scene.
export function showBossRushScene(state: GameState) {
    sceneHash.bossRush.showConditionsMenu = false;
    sceneHash.bossRush.bossRushIndex = 0;
    sceneHash.bossRush.conditionsIndex = 0;
    // This spawn location will be used when returning the player to the location they started the boss rush from.
    setSpawnLocation(state, {...state.location});
    backupHeroData(state);
    sceneHash.bossRush.updateBackground(state);
    state.sceneStack = [sceneHash.field, sceneHash.hud, sceneHash.bossRush];
}

export function onBossRushBossDefeated(state: GameState) {
    if (state.bossRushState.remainingBosses.length) {
        startNextBoss(state);
        return;
    }
    const timeMessage = updateBestTimes(state);
    showMessage(state, timeMessage);
    // Show the Boss Rush Menu again after all the text is displayed.
    appendCallback(state, (state: GameState) => {
        // Save game in case hero set any records. This should be done right before
        // returning to the menu since this will reset the hero stats and remove them
        // from the current area.
        restoreHeroData(state);
        saveGame(state);
        backupHeroData(state);
        returnToBossRushMenu(state);
    });
}


export function startNextBoss(state: GameState): void {
    const nextBoss = state.bossRushState.remainingBosses.shift();
    const markerId = bossSpawnPoints[nextBoss];
    enterZoneByTarget(state, 'bossRush', markerId, {transitionType: 'fade', transitionColor: '#FFF'});
    fixCamera(state);
}


// Return to the boss rush menu from a boss rush.
export function returnToBossRushMenu(state: GameState) {
    delete state.bossRushState;
    sceneHash.bossRush.updateBackground(state);
    sceneHash.bossRush.updatePlayerState(state);
    state.sceneStack = [sceneHash.field, sceneHash.hud, sceneHash.bossRush];
}

function updateBestTimes(state: GameState): string {
    const option = state.bossRushState.bossRushOption
    const finishTime = state.hero.savedData.playTime - state.bossRushState.bossStartTime;
    const {
        bestTime, highScore
    } = getSavedBossRushData(state, option.key);
    let currentScore = option.karma;
    if (finishTime < option.targetTime) {
        currentScore *= 2;
    }
    let conditionMultiplier = 1;
    for (const condition of [...state.bossRushState.activeConditions]) {
        conditionMultiplier += condition.modifier;
    }
    currentScore *= conditionMultiplier;
    const updatedBossRushData = {
        bestTime,
        highScore,
    }
    let returnLines: string[] = [];
    if (!bestTime || finishTime <= bestTime) {
        returnLines.push('New speed record: ' + formatMinutesAndSeconds(finishTime) + '!');
        updatedBossRushData.bestTime = finishTime;
    }
    if (!highScore || currentScore >= highScore) {
        returnLines.push('New high score: ' + currentScore + '!');
        updatedBossRushData.highScore = currentScore;
    }
    return returnLines.join('{|}');
}

export function getSavedBossRushData(state: GameState, key: BossRushKey) {
    const {highScore = 0, bestTime = 0} = state.savedState.bossRushData[key] ?? {};
    return {highScore, bestTime};
}
