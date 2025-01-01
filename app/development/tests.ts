import {everyObject} from 'app/utils/every';
import {getObjectSaveTreatment} from 'app/utils/objects';

export const tests: {[key: string]: () => void} = {
    checkObjectsHaveIds() {
        console.log('Test "checkObjectsHaveIds":')
        everyObject((location, zone, area, objectDefinition) => {
            if (getObjectSaveTreatment(objectDefinition) === 'never') {
                return;
            }
            // Without an id, the status of this object cannot be saved, but the definition says the object
            // status should be saved. Fix this by adding an id to the object or changing the definition
            // to never save the object status either through the editor, or adding a new default treatment
            // for the object type to `getObjectSaveTreatment`.
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
