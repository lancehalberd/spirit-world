import {GAME_KEY} from 'app/gameConstants';
import {isSceneActive, sceneHash} from "app/scenes/sceneHash";
import {bossRushConditions, getBossRushOptions} from 'app/scenes/bossRush/bossRushOptions';
import {bossSpawnPoints, getSavedBossRushData, startNextBoss} from 'app/scenes/bossRush/showBossRushScene';
import {renderBossRushMenu, renderConditionsMenu} from "app/scenes/bossRush/renderBossRush";
import {showFieldScene} from 'app/scenes/field/showFieldScene';
import {updateTransition} from 'app/scenes/field/updateTransition';
// import {playTrack} from "app/utils/sounds";
import {
    wasGameKeyPressed,
    wasConfirmKeyPressed,
} from 'app/userInput';
import {alterHeroData, getRealSavedHeroData, restoreHeroData} from 'app/utils/alterHeroData';
import {enterZoneByTarget} from 'app/utils/enterZoneByTarget';
import {returnToSpawnLocation} from 'app/utils/returnToSpawnLocation';
import {playSound} from 'app/utils/sounds';


export class BossRushScene implements GameScene {
    activeConditions = new Set<BossRushCondition>();
    blocksInput = true;
    blocksUpdates = true;
    showConditionsMenu = false;
    conditionsIndex = 0;
    bossRushIndex = 0;
    update(state: GameState, interactive: boolean) {
        if (state.transitionState && !state.areaInstance?.priorityObjects?.length) {
            updateTransition(state);
        }
        if (!interactive) {
            return;
        }
        // Regardless of which menu you are in, pressing left/right toggles the menu.
        if (wasGameKeyPressed(state, GAME_KEY.LEFT) || wasGameKeyPressed(state, GAME_KEY.RIGHT)) {
            playSound('menuTick');
            this.showConditionsMenu = !this.showConditionsMenu;
            this.updatePlayerState(state);
        } else if (!this.showConditionsMenu) {
            this.updateBossRushMenu(state);
        } else {
            this.updateConditionsMenu(state);
        }

    }

    updatePlayerState(state: GameState) {
        const option = getBossRushOptions(state)[this.bossRushIndex];
        // Reset the hero to their baseline stats before applying and modifiers.
        alterHeroData(state, state.backupHeroData);
        // Player is given a revive by default.
        state.hero.savedData.hasRevive = true;
        // If we are viewing the boss rush menu, and the selected option has a specific state configured,
        // then we just apply the conigured state for the given boss rush option.
        if (!this.showConditionsMenu && option.playerState) {
            alterHeroData(state, option.playerState)
        } else {
            for (const condition of [...this.activeConditions]) {
                condition.apply(state);
            }
        }
    }

    updateBossRushMenu(state: GameState) {
        if (wasGameKeyPressed(state, GAME_KEY.CANCEL)
            || wasGameKeyPressed(state, GAME_KEY.LEFT_TOOL)
            || wasGameKeyPressed(state, GAME_KEY.RIGHT_TOOL)
        ) {
            closeBossRushScene(state);
            return;
        }
        const options = getBossRushOptions(state);
        if (wasGameKeyPressed(state, GAME_KEY.UP)) {
            this.bossRushIndex = (this.bossRushIndex - 1 + options.length) % options.length;
            playSound('menuTick');
            this.updateBackground(state);
            this.updatePlayerState(state);
        } else if (wasGameKeyPressed(state, GAME_KEY.DOWN)) {
            this.bossRushIndex = (this.bossRushIndex + 1) % options.length;
            playSound('menuTick');
            this.updateBackground(state);
            this.updatePlayerState(state);
        }
        if (wasConfirmKeyPressed(state)) {
            playSound('menuTick');
            startBossRush(state, options[this.bossRushIndex], this.activeConditions);
        }
    }

    updateConditionsMenu(state: GameState) {
        if (wasGameKeyPressed(state, GAME_KEY.CANCEL)
            || wasGameKeyPressed(state, GAME_KEY.LEFT_TOOL)
            || wasGameKeyPressed(state, GAME_KEY.RIGHT_TOOL)
        ) {
            this.showConditionsMenu = false;
            this.updatePlayerState(state);
            return;
        }
        if (wasGameKeyPressed(state, GAME_KEY.UP)) {
            this.conditionsIndex = (this.conditionsIndex + bossRushConditions.length - 1) % bossRushConditions.length;
            playSound('menuTick');
        } else if (wasGameKeyPressed(state, GAME_KEY.DOWN)) {
            this.conditionsIndex = (this.conditionsIndex + 1) % bossRushConditions.length;
            playSound('menuTick');;
        }
        if (wasConfirmKeyPressed(state)) {
            playSound('menuTick');
            const condition = bossRushConditions[this.conditionsIndex];
            if (this.activeConditions.has(condition)) {
                this.activeConditions.delete(condition);
            } else {
                this.activeConditions.add(condition);
            }
            this.updatePlayerState(state);
        }
    }

    updateBackground(state: GameState) {
        const option = getBossRushOptions(state)[this.bossRushIndex];
        const markerId = bossSpawnPoints[option.bosses[0]];
        enterZoneByTarget(state, 'bossRush', markerId, {transitionType: 'fastFade', callback: (state: GameState) => {
            // Remove the hero from the area.
            delete state.hero.area;
            option.fixPreview?.(state);
        }});
        // fixCamera(state);
    }

    /*updateMusic(state: GameState) {
        playTrack('mainTheme', 0);
        return true;
    }*/

    render(context: CanvasRenderingContext2D, state: GameState): void {
        // This is a bit of a hack to prevent rendering Boss Rush menus when text boxes are showing.
        if (!isSceneActive(state, sceneHash.bossRush)) {
            return;
        }
        if (!this.showConditionsMenu) {
            renderBossRushMenu(context, state, this);
        } else {
            renderConditionsMenu(context, state, this);
        }
    }
}
sceneHash.bossRush = new BossRushScene();

function closeBossRushScene(state: GameState) {
    restoreHeroData(state);
    returnToSpawnLocation(state);
    showFieldScene(state);
}



function startBossRush(state: GameState, option: BossRushOption, activeConditions: Set<BossRushCondition>): void {
    state.sceneStack = [sceneHash.field, sceneHash.hud]; //RE
    state.bossRushState = {
        bossRushOption: option,
        activeConditions,
        remainingBosses: [...option.bosses],
        bossStartTime: state.hero.savedData.playTime,
    };
    startNextBoss(state);
}


// Recalculate karma for the current game state.
// Karma is gained by completed certain side quests and performing well in mini games in the Dreaming.
export function updateKarma(state: GameState) {
    const realSavedHeroData = getRealSavedHeroData(state);
    realSavedHeroData.karma = 0;
    // TODO: Add karma bonuses for reviving the daughter trees.
    // TODO: Add karam bonuses for other side quets
    for (const bossRushOption of getBossRushOptions(state)) {
        const {highScore} = getSavedBossRushData(state, bossRushOption.key);
        const score = Math.min(bossRushOption.karma * 10, highScore);
        realSavedHeroData.karma += score;
    }
    // TODO: Add karma bonuses for other mini game results.
}



