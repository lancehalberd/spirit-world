export interface ScreenshotTest {
    // Builds/populates a fresh GameState for this test. Called on a GameState created fresh
    // for this test only (see runner.ts), never the live getState() singleton.
    setup: (state: GameState) => void
}

// Registry of screenshot tests, keyed by golden image name (without the .png extension).
// Individual test files (app/development/testing/tests/*.ts) assign themselves in here.
export const screenshotTests: {[goldenName: string]: ScreenshotTest} = {};
window['screenshotTests'] = screenshotTests;
