import type {DefeatedMenuScene} from 'app/scenes/defeated/defeatedMenuScene';
import type {DefeatedScene} from 'app/scenes/defeated/defeatedScene';
import type {FieldScene} from 'app/scenes/field/fieldScene';
import type {FileSelectScene} from 'app/scenes/fileSelect/fileSelectScene';
import type {HudScene} from 'app/scenes/hud/hudScene';
import type {IntroScene} from 'app/scenes/intro/introScene';
import type {MapScene} from 'app/scenes/map/mapScene';
import type {PrologueScene} from 'app/scenes/prologue/prologueScene';
import type {TitleScene} from 'app/scenes/title/titleScene';

interface AllScenes {
    defeated: DefeatedScene
    defeatedMenu: DefeatedMenuScene
    field: FieldScene
    fileSelect: FileSelectScene
    hud: HudScene
    intro: IntroScene
    map: MapScene
    prologue: PrologueScene
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
