import type {FieldScene} from 'app/scenes/field/fieldScene';
import type {IntroScene} from 'app/scenes/intro/introScene';
import type {TitleScene} from 'app/scenes/title/titleScene';

interface AllScenes {
    field: FieldScene
    intro: IntroScene
    title: TitleScene
}

// Each scene
export const sceneHash = {} as AllScenes;
