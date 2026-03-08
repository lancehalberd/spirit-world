import {pushScene, sceneHash} from 'app/scenes/sceneHash';

export function showChoiceScene(state: GameState, prompt: TextPage, choices: ChoiceOption[]) {
    sceneHash.choice.cursorIndex = 0;
    sceneHash.choice.prompt = prompt;
    sceneHash.choice.choices = choices;
    pushScene(state, sceneHash.choice)
}
