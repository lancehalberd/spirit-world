import { GAME_KEY } from 'app/gameConstants';
import {
    wasGameKeyPressed,
    wasConfirmKeyPressed,
} from 'app/userInput';
import { playSound } from 'app/utils/sounds';
import { getBossRushOptions } from './renderBossRush';
import { altGolemState } from 'app/content/heroSavedStates';
import { alterHeroData } from 'app/utils/alterHeroData';


const aBosses: BossName[] = ["beetle", "golem", "idols", "guardian", "rush", "altGolem"];
const bBosses: BossName[] = aBosses.concat(["rival2", "forest", "collector", "rush2"])
const cBosses: BossName[] = bBosses.concat(["flameBeast", "frostBeast", "stormBeast", "rush3"])



const bossLocations: string[] = [
    'beetleRefight', 'golemRefight', 'warTempleRefight', 'guardianRefight', 'beetleRefight', 'golemRefight',
    'rival2Refight', 'forestTempleRefight', 'collectorRefight', 'forestTempleRefight',
    'flameBeastRefight', 'frostBeastRefight', 'stormBeastRefight', 'frostBeastRefight'
]

export function updateBossRushMenu(state: GameState) {
    const options = getBossRushOptions(state);
    if (wasGameKeyPressed(state, GAME_KEY.PASSIVE_TOOL)) {
        state.scene = 'game';
        return
    }
    if (wasGameKeyPressed(state, GAME_KEY.UP)) {
        state.menuIndex = (state.menuIndex - 1 + options.length) % options.length;
        playSound('menuTick');
    } else if (wasGameKeyPressed(state, GAME_KEY.DOWN)) {
        state.menuIndex = (state.menuIndex + 1) % options.length;
        playSound('menuTick');
    }
    if (wasConfirmKeyPressed(state)) {
        playSound('menuTick');
        state.scene = 'game';
        let selectedBoss = cBosses[state.menuIndex];
        if (selectedBoss === "altGolem") {
            alterHeroData(state, altGolemState);
            state.savedState.usingBackup = true;
            startRefight(state, selectedBoss, "golemRefight")
            return;
        } if (selectedBoss === "rush") {
            state.savedState.objectFlags["rushMode"] = true,
            state.bossRushTrackers.rushPosition = 0,
            startRefight(state, 'rush', 'beetleRefight')
            return;
        } if (selectedBoss === "rush2") {
            state.savedState.objectFlags["rushMode"] = true,
            state.bossRushTrackers.rushPosition = 4,
            startRefight(state, 'rush', 'beetleRefight')
            return;
        } if (selectedBoss === "rush3") {
            state.savedState.objectFlags["rushMode"] = true,
            state.bossRushTrackers.rushPosition = 7,
            startRefight(state, 'rush', 'beetleRefight')
            return;
        }
        let selectedLocation = bossLocations[state.menuIndex];
        startRefight(state, selectedBoss, selectedLocation);
    }
}


function travelToLocation(state: GameState, zoneKey: string, markerId: string): string {
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
