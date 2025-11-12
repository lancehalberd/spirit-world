import {BITMAP_BOTTOM} from 'app/content/bitMasks';
import {evaluateFlagString} from 'app/content/logic';
import {everyArea, everyObject} from 'app/utils/every';
import {hitTargets} from 'app/utils/field';
import {getCompositeBehaviors} from 'app/utils/getBehaviors';
import {getDrawPriority} from 'app/utils/layers';
import {getObjectSaveTreatment} from 'app/utils/objects';
import {applyTileToBehaviorGrid} from 'app/utils/tileBehavior';
import {getAreaInstanceFromLocation} from 'app/content/areas';
import {getState} from 'app/state';

export const tests: {[key: string]: () => void} = {
    checkObjectsHaveIds() {
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
    checkLayersAreOrdered() {
        everyArea((location, zone, area) => {
            let foundForeground = false;
            for (let i = 0; i < area.layers.length; i++) {
                if (getDrawPriority(area.layers[i]) === 'foreground') {
                    foundForeground = true;
                } else if (foundForeground) {
                    console.error(`Non-foreground layer ${area.layers[i].key} found after foreground layer`, location);
                    break;
                }
            }
        });
    },
    checkEmptyTiles() {
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
    testTileBehaviorMerging() {
        const behaviorGrid: TileBehaviors[][] = [[{}]];
        applyTileToBehaviorGrid(behaviorGrid, {x: 0, y: 0}, {isLava: true}, false);
        applyTileToBehaviorGrid(behaviorGrid, {x: 0, y: 0}, {isGroundMap: BITMAP_BOTTOM}, false);
        const result = behaviorGrid[0][0];
        if (result.isLava || !result.isLavaMap || result.isLavaMap[0] !== 0xFFFF || result.isLavaMap[15] !== 0x0000) {
            console.error('Unexpected lava behavior(top half of tile is lava): ', result);
        }
        if (result.isGround || !result.isGroundMap || result.isGroundMap[0] !== 0x0000 || result.isGroundMap[15] !== 0xFFFF) {
            console.error('Unexpected ground behavior(bottom half of tile is ground): ', result);
        }
    },
    // There have been a few changes that caused the floor behavior in the fire sanctum to not count as safe ground.
    testFireSanctumGround() {
        const state = getState();
        const fireSanctum = getAreaInstanceFromLocation(state, {
            zoneKey: 'fireSanctum',
            floor: 0,
            areaGridCoords: {x: 0, y: 0},
            isSpiritWorld: true,
            x: 0, y: 0, d: 'down',
        });
        const safeBehavior = getCompositeBehaviors(state, fireSanctum, {x: 455, y: 328});
        const lavaBehavior = getCompositeBehaviors(state, fireSanctum, {x: 403, y: 365});
        if (safeBehavior.isLava) {
            console.error('Expected ground to not have lava: ', safeBehavior);
        }
        if (!lavaBehavior.isLava) {
            console.error('Expected ground to have lava: ', lavaBehavior);
        }
    },
    // There have been a few changes that caused the floor behavior in the fire sanctum to not count as safe ground.
    testCloudOnWallBehavior() {
        const state = getState();
        const sky = getAreaInstanceFromLocation(state, {
            zoneKey: 'sky',
            floor: 0,
            areaGridCoords: {x: 0, y: 0},
            isSpiritWorld: false,
            x: 0, y: 0, d: 'down',
        });
        const cloudOnWallBehavior = getCompositeBehaviors(state, sky, {x: 327, y: 139});
        if (!cloudOnWallBehavior.cloudGround || cloudOnWallBehavior.solid) {
            console.error('Unexpected behaviors for cloud over wall: ', cloudOnWallBehavior);
        }
    },
    // Make sure the boss freezing walls doesn't remove their solid behavior.
    testFreezingWarTempleWall() {
        const state = getState();
        const warTemple = getAreaInstanceFromLocation(state, {
            zoneKey: 'warTemple',
            floor: 2,
            areaGridCoords: {x: 0, y: 0},
            isSpiritWorld: false,
            x: 0, y: 0, d: 'down',
        });
        hitTargets(state, warTemple, {
            hitbox: {x: 224, y: 224, w: 32, h: 32},
            // Setting this to true causes the hit to freeze a wider range of tiles.
            hitAllies: true,
            hitTiles: true,
            element: 'ice',
            source: null,
        })
        const floorBehavior = getCompositeBehaviors(state, warTemple, {x: 232, y: 232});
        const eastWallBehavior = getCompositeBehaviors(state, warTemple, {x: 248, y: 232});
        const southWallBehavior = getCompositeBehaviors(state, warTemple, {x: 232, y: 248});
        if (!floorBehavior.slippery) {
            console.error('Expected floor to be frozen: ', floorBehavior);
        }
        if (!eastWallBehavior.solid) {
            console.error('Expected east wall to be solid: ', eastWallBehavior);
        }
        if (!southWallBehavior.solid) {
            console.error('Expected south wall to be solid: ', southWallBehavior);
        }
    },
    testEvaluateFlagString() {
        const state = getState();
        state.savedState.objectFlags.T = 1;
        for (const [string, expectedValue] of <const>[
            ['T', true],
            ['F', false],
            ['!T', false],
            ['!!T', true],
            ['(T)', true],
            ['!((F))', true],
            ['T || F', true],
            ['T && F', false],
            ['(T && F) || T', true],
            ['(T && F) && T', false],
            ['!((F && T)) || (F)', true],
            ['((T || F) && !(F && T))', true],
        ]) {
            if (evaluateFlagString(state, string) !== expectedValue) {
                console.error('Expected ', string, ' to evaluate to ', expectedValue);
            }
        }
    }
};
window['tests'] = tests;

export function runAllTests() {
    for (const key in tests) {
        try {
            console.log(`Test "${key}":`);
            tests[key]();
        } catch (e) {
            console.error(`Text ${key} failed:`, e.message);
        }
    }
}
window['runAllTests'] = runAllTests;
