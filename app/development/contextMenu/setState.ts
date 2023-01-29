import { cloneDeep } from 'lodash';

import { applySavedState, cleanState, getState } from 'app/state';
import { setSpawnLocation } from 'app/content/spawnLocations';
import {
    earlySpawnLocations,
    middleSpawnLocations,
    lateSpawnLocations,
    finalSpawnLocations,
    minimizerSpawnLocations,
    SpawnLocationOptions,
} from 'app/content/spawnStates';
import { returnToSpawnLocation } from 'app/utils/returnToSpawnLocation';

import { MenuOption } from 'app/types';

function getSpawnLocationOptions(spawnLocations: SpawnLocationOptions, useSavedState = false) {
    return Object.keys(spawnLocations).map(name => {
        return {
            label: `${name}`,
            onSelect() {
                const state = getState();
                if (useSavedState) {
                    applySavedState(state, cloneDeep(spawnLocations[name].savedState));
                }
                cleanState(state);
                setSpawnLocation(state, spawnLocations[name].location);
                returnToSpawnLocation(state);
                if (spawnLocations[name].savedState.savedHeroData.life) {
                    state.hero.life = spawnLocations[name].savedState.savedHeroData.life;
                }
                state.scene = 'game';
            }
        }
    });
}

export function getSpawnLocationContextMenuOption(): MenuOption {
    return {
        getLabel() {
            return 'Teleport...';
        },
        getChildren() {
            return [
                { label: 'Teleport To...'},
                {
                    label: 'Early',
                    getChildren() {
                        return getSpawnLocationOptions(earlySpawnLocations);
                    }
                },
                {
                    label: 'Mid',
                    getChildren() {
                        return getSpawnLocationOptions(middleSpawnLocations);
                    }
                },
                {
                    label: 'Late',
                    getChildren() {
                        return getSpawnLocationOptions(lateSpawnLocations);
                    }
                },
                {
                    label: 'Final',
                    getChildren() {
                        return getSpawnLocationOptions(finalSpawnLocations);
                    }
                },
            ];
        }
    }
}

export function getTestStateContextMenuOption(): MenuOption {
    return {
        getLabel() {
            return 'Test State...';
        },
        getChildren() {
            return [
                { label: 'Set State To...'},
                {
                    label: 'Early',
                    getChildren() {
                        return getSpawnLocationOptions(earlySpawnLocations, true);
                    }
                },
                {
                    label: 'Mid',
                    getChildren() {
                        return getSpawnLocationOptions(middleSpawnLocations, true);
                    }
                },
                {
                    label: 'Late',
                    getChildren() {
                        return getSpawnLocationOptions(lateSpawnLocations, true);
                    }
                },
                {
                    label: 'Final',
                    getChildren() {
                        return getSpawnLocationOptions(finalSpawnLocations, true);
                    }
                },
                {
                    label: 'Mini',
                    getChildren() {
                        return getSpawnLocationOptions(minimizerSpawnLocations, true);
                    }
                },
            ];
        }
    }
}
