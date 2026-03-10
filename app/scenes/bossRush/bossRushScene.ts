import { updateBossRushMenu } from "./updateBossRush";
import { renderBossRushMenu } from "./renderBossRush";
import { sceneHash } from "../sceneHash";
import { playTrack } from "app/utils/sounds";


export class BossRushScene implements GameScene {
    blocksInput = true;
    blocksUpdates = true;
    cursorIndex = 0;
    update(state: GameState) {
        updateBossRushMenu(state, this);
    }

    updateMusic(state: GameState) {
        playTrack('mainTheme', 0);
        return true;
    }

    render(context: CanvasRenderingContext2D, state: GameState): void {
        renderBossRushMenu(context, state, this);
    }
}


export function showBossRushScene(state: GameState) {
    sceneHash.bossRush.cursorIndex = 0;
    state.sceneStack = [sceneHash.field, sceneHash.bossRush];
}

sceneHash.bossRush = new BossRushScene();