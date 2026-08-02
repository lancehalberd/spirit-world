// While a screenshot test run is in progress, the real update/render loops (app/update.ts,
// app/client.ts) skip themselves entirely so they cannot interfere with the isolated GameState
// objects the tests render, and so tests never observe a half-updated live game underneath them.
export const screenshotTestState = {
    isRunning: false,
};
