import {screenshotTests} from 'app/development/testing/screenshotTests';
import {showTitleScene} from 'app/scenes/title/showTitleScene';

screenshotTests.titleScene = {
    setup(state: GameState) {
        showTitleScene(state);
    },
};
