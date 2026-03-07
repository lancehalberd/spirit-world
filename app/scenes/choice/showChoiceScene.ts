import {pushScene, sceneHash} from 'app/scenes/sceneHash';

export function showChoiceScene(state: GameState, prompt: TextPage,
    choices: {
        text: string
        key: string
    }[]
) {
    sceneHash.choice.cursorIndex = 0;
    sceneHash.choice.prompt = prompt;
    sceneHash.choice.choices = choices;
    pushScene(state, sceneHash.choice)
}
