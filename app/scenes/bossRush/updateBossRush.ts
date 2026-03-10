import { GAME_KEY } from 'app/gameConstants';
import {
    wasGameKeyPressed,
    wasConfirmKeyPressed,
} from 'app/userInput';
import { playSound } from 'app/utils/sounds';
import { getBossRushOptions, BossRushOption } from './bossRushOptions';
import { alterHeroData } from 'app/utils/alterHeroData';
import { fixCamera } from 'app/utils/fixCamera';
import {sceneHash} from 'app/scenes/sceneHash';
import { BossRushScene } from './bossRushScene';


const bossConditions = [
  "none",
  "daredevil",
  "weak"
] as const;

export function updateBossRushMenu(state: GameState, scene: BossRushScene) {
    const options = getBossRushOptions(state);
    if (wasGameKeyPressed(state, GAME_KEY.LEFT)) {
        let current = state.bossRushTrackers.currentCondition
        const index = bossConditions.indexOf(current);
        let nextIndex = (index - 1) % bossConditions.length;
        if (nextIndex == -1) {nextIndex = bossConditions.length - 1}
        state.bossRushTrackers.currentCondition = bossConditions[nextIndex];
        playSound('menuTick');
        return;
    }
    if (wasGameKeyPressed(state, GAME_KEY.RIGHT)) {
        let current = state.bossRushTrackers.currentCondition
        const index = bossConditions.indexOf(current);
        const nextIndex = (index + 1) % bossConditions.length;
        state.bossRushTrackers.currentCondition = bossConditions[nextIndex];
        playSound('menuTick');
        return;
    }
    if (wasGameKeyPressed(state, GAME_KEY.LEFT_TOOL) || wasGameKeyPressed(state, GAME_KEY.RIGHT_TOOL)) {
        state.travel("dream", "bossRefightReturn", {instant: true});
        state.sceneStack = [sceneHash.field, sceneHash.hud]; //Replace with call to showFieldScene?
        return
    }
    if (wasGameKeyPressed(state, GAME_KEY.UP)) {
        scene.cursorIndex = (scene.cursorIndex - 1 + options.length) % options.length;
        playSound('menuTick');
        changeBackground(state, options, scene);
    } else if (wasGameKeyPressed(state, GAME_KEY.DOWN)) {
        scene.cursorIndex = (scene.cursorIndex + 1) % options.length;
        playSound('menuTick');
        changeBackground(state, options, scene);
    }
    if (wasConfirmKeyPressed(state)) {
        playSound('menuTick');
        state.sceneStack = [sceneHash.field, sceneHash.hud]; //RE
        let selectedBoss = options[scene.cursorIndex].key
        state.bossRushTrackers.storedLife = state.hero.savedData.maxLife;
        if (options[state.menuIndex].playerState) {
            alterHeroData(state, options[scene.cursorIndex].playerState)
            state.savedState.usingBackup = true;
        }
        applyConditions(state);
        let selectedLocation = options[scene.cursorIndex].location[0];
        startRefight(state, selectedBoss, selectedLocation);
    }
}

function applyConditions(state: GameState) {
    if (state.bossRushTrackers.currentCondition == "daredevil") {
        if (state.hero.savedData.passiveTools.ironSkin = 1) {
            state.bossRushTrackers.hasIronSkin = true;
            state.hero.savedData.ironSkinLife = 0;
        }
        state.hero.savedData.maxLife = 2;
        state.hero.savedData.passiveTools.ironSkin = 0;
        state.hero.savedData.ironSkinLife = 0;
    }
    if (state.bossRushTrackers.currentCondition == "weak") {
        state.bossRushTrackers.hasWeaponUpgrades = state.hero.savedData.weaponUpgrades
        state.bossRushTrackers.weaponNumber = state.hero.savedData.weapon;
        state.hero.savedData.weaponUpgrades = {
            normalRange: false,
            normalDamage: false,
            spiritDamage: false,
            spiritRange: false,
        };
        state.hero.savedData.weapon = Math.min(1, state.hero.savedData.weapon);
        console.log(state.hero.savedData)
    }
}

function changeBackground(state: GameState, options: BossRushOption[], scene: BossRushScene) {
    let selectedLocation = options[scene.cursorIndex].location[0];
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