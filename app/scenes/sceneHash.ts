import type {FieldScene} from 'app/scenes/field/fieldScene';
import type {FileSelectScene} from 'app/scenes/fileSelect/fileSelectScene';
import type {IntroScene} from 'app/scenes/intro/introScene';
import type {MapScene} from 'app/scenes/map/mapScene';
import type {TitleScene} from 'app/scenes/title/titleScene';

interface AllScenes {
    field: FieldScene
    fileSelect: FileSelectScene
    intro: IntroScene
    map: MapScene
    title: TitleScene
}

// Each scene
export const sceneHash = {} as AllScenes;

export function isSceneActive(state: GameState, scene: GameScene): boolean {
    for (let i = state.sceneStack.length - 1; i >= 0; i--) {
        const currentScene = state.sceneStack[i];
        if (currentScene === scene) {
            return true;
        }
        if (currentScene.blocksUpdates) {
            return false;
        }
    }
    return false;
}

export function pushScene(state: GameState, scene: GameScene) {
    // Don't double up on the same scene in the stack.
    if (state.sceneStack[state.sceneStack.length - 1] === scene) {
        return;
    }
    state.sceneStack.push(scene);
}
