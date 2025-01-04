import {everyArea, everyObject} from 'app/utils/every';
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
    },
    checkEmptyMaterialTiles() {
        console.log('Test "checkEmptyMaterialTiles":')
        const updatedZones = new Set<string>();
        everyArea((location, zone, area) => {
            if (area.isSpiritWorld) {
                return;
            }
            for (const layer of area.layers) {
                const tiles = layer.grid.tiles;
                for (let y = 0; y < tiles.length; y++) {
                    if (!tiles[y]) {
                        continue;
                    }
                    for (let x = 0; x < tiles[y].length; x++) {
                        if (tiles[y][x] === 1) {
                            tiles[y][x] = 0;
                            updatedZones.add(zone.key);
                        }
                    }
                }
            }
        });
        console.log('Removed bad empty tiles from material world in: ', [...updatedZones]);
    },
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
