import {dodgerGame} from 'app/arGames/dodger/dodger';
import {hotaGame} from 'app/arGames/hota/hota';
import {targetPracticeGame} from 'app/arGames/target_practice/target_practice_game';
import {fpsGame} from 'app/arGames/target_practice/fps/fps_game';
import {GAME_KEY} from 'app/gameConstants';
import {showChoiceScene} from 'app/scenes/choice/showChoiceScene';
import {translateContextForAreaAndCamera} from 'app/scenes/field/renderField';
import {showFieldScene} from 'app/scenes/field/showFieldScene';
import {parseScriptAsTextPage} from 'app/scriptEvents';
import {sceneHash} from 'app/scenes/sceneHash';
import {wasGameKeyPressed} from 'app/userInput';
import {playTrack} from 'app/utils/sounds';

function getARGame(gameId: ARGameID): ARGame {
    if (gameId === 'dodger') {
        return dodgerGame;
    }
    if (gameId === 'hota') {
        return hotaGame;
    }
    if (gameId === 'target') {
        return targetPracticeGame;
    }
    if (gameId === 'targetFPS') {
        return fpsGame;
    }
}

export class ARGameScene implements GameScene {
    sceneType = 'ar';
    game: ARGame
    blocksInput = false;
    blocksUpdates = false;
    closeScene(state: GameState) {
        state.arState.active = false;
        state.areaInstance.needsLogicRefresh = true;
        // Some games hide the HUD, so make sure we show it again on quitting.
        state.hideHUD = false;
        showFieldScene(state);
    }
    updateMusic(state: GameState) {
        playTrack('towerTheme', 0);
        return true;
    }
    showQuitPrompt(state: GameState) {
        showChoiceScene(state, parseScriptAsTextPage(state, 'Quit AR?'),
            [{
                text: 'No',
                activate: (state: GameState) => {
                    return;
                },
            },{
                text: 'Yes',
                activate: (state: GameState) => {
                    this.closeScene(state);
                },
            }]
        );
    }
    update(state: GameState, interactive: boolean) {
        if (interactive &&  (wasGameKeyPressed(state, GAME_KEY.MENU) || wasGameKeyPressed(state, GAME_KEY.MAP))) {
            this.blocksInput = true;
            this.showQuitPrompt(state);
            return;
        }
        this.blocksInput = !!this.game.disablesPlayerMovement;
        this.game.update(state);
    }
    render(context: CanvasRenderingContext2D, state: GameState): void {
        context.save();
            translateContextForAreaAndCamera(context, state, state.areaInstance);
            this.game.render(context, state);
        context.restore();
    }
}

// This scene will render over the normal HUD for the game
export class ARHudScene implements GameScene {
    sceneType = 'arhud';
    blocksInput = false;
    blocksUpdates = false;
    constructor(public arGameScene: ARGameScene) {}
    render(context: CanvasRenderingContext2D, state: GameState): void {
        this.arGameScene.game?.renderHUD?.(context, state);
    }
}

const arScene = new ARGameScene();
const arHudScene = new ARHudScene(arScene);

export function showARGameScene(state: GameState, gameId: ARGameID) {
    const arGame = getARGame(gameId);
    if (!arGame) {
        return;
    }
    arScene.game = arGame;
    arScene.game.start(state);
    state.sceneStack = [sceneHash.field, arScene, sceneHash.hud, arHudScene];
    state.arState.active = true;
    state.areaInstance.needsLogicRefresh = true;
}
