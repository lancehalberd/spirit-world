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
    checkEmptyTiles() {
        console.log('Test "checkEmptyTiles":')
        const updatedZones = new Set<string>();
        everyArea((location, zone, area) => {
            for (let i = 0; i < area.layers.length; i++) {
                const layer = area.layers[i];
                const parentLayer = area.parentDefinition?.layers?.[i];
                if (parentLayer && parentLayer.key !== layer.key) {
                    console.error('layer key mismatch', location, area.layers, area.parentDefinition.layers);
                }
                const tiles = layer.grid.tiles;
                const parentTiles = parentLayer?.grid.tiles;
                for (let y = 0; y < tiles.length; y++) {
                    if (!tiles[y]) {
                        continue;
                    }
                    for (let x = 0; x < tiles[y].length; x++) {
                        // The `1` tile is valid in the spirit world as long as the parent tiles is
                        // not falsey or 1.
                        if (area.isSpiritWorld && parentTiles?.[y]?.[x] && parentTiles?.[y]?.[x] !== 1) {
                            continue;
                        }
                        if (tiles[y][x] === 1) {
                            tiles[y][x] = 0;
                            updatedZones.add(zone.key);
                        }
                    }
                }
            }
        });
        if (updatedZones.size) {
            console.error('Removed bad empty tiles in: ', [...updatedZones]);
        }
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
