import { everyObject } from 'app/utils/every';

export const tests: {[key: string]: () => void} = {
    checkObjectsHaveIds() {
        console.log('Test "checkObjectsHaveIds":')
        everyObject((location, zone, area, objectDefinition) => {
            if (objectDefinition.saveStatus === 'never') {
                return;
            }
            if (!objectDefinition.saveStatus
                && objectDefinition.type !== 'boss'
                && objectDefinition.type !== 'enemy'
                && objectDefinition.type !== 'saveStatue'
                && objectDefinition.type !== 'narration'
                && objectDefinition.type !== 'pushStairs'
            ) {
                return;
            }
            if (!objectDefinition.id) {
                console.error(`Missing object id`, location, objectDefinition);
            }
        });
    }
};
window['tests'] = tests;

export function runAllTests() {
    for (const key in tests) {
        try {
            tests[key]();
        } catch (e) {
            console.error(`Text ${key} failed:`, e.message);
        }
    }
}
window['runAllTests'] = runAllTests;
