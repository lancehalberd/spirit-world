import { GAME_KEY } from 'app/gameConstants';
import {
    wasGameKeyPressed,
    wasConfirmKeyPressed,
} from 'app/userInput';
import { playSound } from 'app/utils/sounds';
import { getBossRushOptions, BossRushOption } from './bossRushOptions';
import { alterHeroData } from 'app/utils/alterHeroData';

export function updateBossRushMenu(state: GameState) {
    const options = getBossRushOptions(state);
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
        if (options[state.menuIndex].playerState) {
            alterHeroData(state, options[state.menuIndex].playerState)
            state.savedState.usingBackup = true;
        }
        let selectedLocation = options[state.menuIndex].location[0]
        startRefight(state, selectedBoss, selectedLocation);
    }
}

function changeBackground(state: GameState, options: BossRushOption[]) {
    let selectedLocation = options[state.menuIndex].location[0];
    state.travel("bossRefights", selectedLocation, {instant: true});
}

function startRefight(state: GameState, boss: BossName, location: string): void {
    state.savedState.objectFlags["bossRefight"] = true,
    state.bossRushTrackers.bossStartTime = state.hero.savedData.playTime;
    state.bossRushTrackers.currentBoss = boss;
    return;
}