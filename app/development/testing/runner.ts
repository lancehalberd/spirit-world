import {screenshotTestState} from 'app/development/testing/pauseState';
import {screenshotTests} from 'app/development/testing/screenshotTests';
import {compareCanvases, drawImageToCanvas} from 'app/development/testing/compareImages';
import {loadGoldenImage} from 'app/development/testing/goldenIO';
import {FailureEntry, MissingGoldenEntry, showFailureStrip, showMissingGoldenPrompts} from 'app/development/testing/resultsPanel';
import {CANVAS_HEIGHT, CANVAS_WIDTH} from 'app/gameConstants';
import {renderInternal} from 'app/render';
import {setSaveFileToState} from 'app/scenes/fileSelect/setSaveFileToState';
import {getDefaultState} from 'app/state';
import {createCanvasAndContext} from 'app/utils/canvas';

// Runs every registered screenshot test (or just `filter`, if given a golden name) against its
// own fresh GameState and canvas, then reports any missing or mismatched goldens.
// Exposed as window.runScreenshotTests() for use from the browser console, matching the
// convention used by window.runAllTests() (app/development/tests.ts).
export async function runScreenshotTests(filter?: string): Promise<void> {
    if (screenshotTestState.isRunning) {
        console.warn('Screenshot tests are already running.');
        return;
    }
    screenshotTestState.isRunning = true;
    try {
        const missing: MissingGoldenEntry[] = [];
        const failures: FailureEntry[] = [];
        let testCount = 0;
        for (const goldenName in screenshotTests) {
            if (filter && goldenName !== filter) {
                continue;
            }
            testCount++;
            try {
                const [canvas, context] = createCanvasAndContext(CANVAS_WIDTH, CANVAS_HEIGHT);
                const state = getDefaultState();
                // State is not fully hydrated until a save file is set to it. In particular,
                // state.hero isnot defined on the default state.
                setSaveFileToState(state, 0, 'normal');
                const test = screenshotTests[goldenName];
                test.setup(state);
                renderInternal(context, state);
                const goldenImage = await loadGoldenImage(goldenName);
                if (!goldenImage) {
                    missing.push({goldenName, canvas});
                    continue;
                }
                const goldenCanvas = drawImageToCanvas(goldenImage);
                const {matches, diffCanvas} = compareCanvases(canvas, goldenCanvas);
                if (!matches) {
                    failures.push({goldenName, goldenCanvas, actualCanvas: canvas, diffCanvas});
                }
            } catch (e) {
                console.error(`Screenshot test "${goldenName}" failed to run:`, e);
            }
        }
        if (missing.length) {
            await showMissingGoldenPrompts(missing);
        }
        if (failures.length) {
            showFailureStrip(failures);
        } else if (!missing.length) {
            console.log(`All ${testCount} screenshot test(s) passed.`);
        }
    } finally {
        screenshotTestState.isRunning = false;
    }
}
window['runScreenshotTests'] = runScreenshotTests;
