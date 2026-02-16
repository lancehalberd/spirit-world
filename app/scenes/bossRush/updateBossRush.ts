import { GAME_KEY } from 'app/gameConstants';
import {
    wasGameKeyPressed,
    wasConfirmKeyPressed,
} from 'app/userInput';
import { playSound } from 'app/utils/sounds';
import { getBossRushOptions, BossRushOption } from './bossRushOptions';
import { alterHeroData } from 'app/utils/alterHeroData';
import { fixCamera } from 'app/utils/fixCamera';


const bossConditions = [
  "none",
  "daredevil",
] as const;

export function updateBossRushMenu(state: GameState) {
    const options = getBossRushOptions(state);
    if (wasGameKeyPressed(state, GAME_KEY.LEFT) || wasGameKeyPressed(state, GAME_KEY.RIGHT)) {
        let current = state.bossRushTrackers.currentCondition
        const index = bossConditions.indexOf(current);
        const nextIndex = (index + 1) % bossConditions.length;
        state.bossRushTrackers.currentCondition = bossConditions[nextIndex];
        playSound('menuTick');
        return;
    }
    if (wasGameKeyPressed(state, GAME_KEY.LEFT_TOOL) || wasGameKeyPressed(state, GAME_KEY.RIGHT_TOOL)) {
        state.travel("dream", "bossRefightReturn", {instant: true});
        state.scene = 'game';
        return
    }
    if (wasGameKeyPressed(state, GAME_KEY.UP)) {
        state.menuIndex = (state.menuIndex - 1 + options.length) % options.length;
        playSound('menuTick');
        changeBackground(state, options);
    } else if (wasGameKeyPressed(state, GAME_KEY.DOWN)) {
        state.menuIndex = (state.menuIndex + 1) % options.length;
        playSound('menuTick');
        changeBackground(state, options);
    }
    if (wasConfirmKeyPressed(state)) {
        playSound('menuTick');
        state.scene = 'game';
        let selectedBoss = options[state.menuIndex].key
        state.bossRushTrackers.storedLife = state.savedState.savedHeroData.maxLife;
        if (options[state.menuIndex].playerState) {
            alterHeroData(state, options[state.menuIndex].playerState)
            state.savedState.usingBackup = true;
        }
        applyConditions(state);
        let selectedLocation = options[state.menuIndex].location[0];
        startRefight(state, selectedBoss, selectedLocation);
    }
}

function applyConditions(state: GameState) {
    if (state.bossRushTrackers.currentCondition == "daredevil") {
        if (state.savedState.savedHeroData.passiveTools.ironSkin = 1) {
            state.bossRushTrackers.hasIronSkin = true;
            state.savedState.savedHeroData.ironSkinLife = 0;
        }
        state.savedState.savedHeroData.maxLife = 2;
        state.savedState.savedHeroData.passiveTools.ironSkin = 0;
        state.savedState.savedHeroData.ironSkinLife = 0;
        state.hero.applySavedHeroData(state.savedState.savedHeroData);
    }
}

function changeBackground(state: GameState, options: BossRushOption[]) {
    let selectedLocation = options[state.menuIndex].location[0];
    state.travel("bossRefights", selectedLocation, {instant: true});
    fixCamera(state);
}

function startRefight(state: GameState, boss: BossName, location: string): void {
    state.hero.isInvisible = false;
    state.savedState.objectFlags["bossRefight"] = true;
    state.bossRushTrackers.bossStartTime = state.hero.savedData.playTime;
    state.bossRushTrackers.currentBoss = boss;
    return;
}