
import { enemyTypes } from 'app/content/enemies';
import {
    SPAWN_LOCATION_DEMO,
    SPAWN_LOCATION_FULL,
    SPAWN_LOCATION_WATERFALL_VILLAGE,
} from 'app/content/spawnLocations';

import { mainOverworldNode } from 'app/randomizer/logic/overworldLogic';
import { allNodes } from 'app/randomizer/allNodes';
import {
    applyLootAssignments, everyObject,
    reverseFill
} from 'app/randomizer/utils';
import { randomizeEntrances } from 'app/randomizer/entranceRandomizer';
import SRandom from 'app/utils/SRandom';

import { randomizerSeed, enemySeed, entranceSeed } from 'app/gameConstants';

if (enemySeed) {
    const enemyRandom = SRandom.seed(enemySeed)
    everyObject((location, zone, area, object) => {
        if (object.type === 'enemy') {
            object.enemyType = enemyRandom.element([...enemyTypes]);
            enemyRandom.generateAndMutate();
        }
    });
}

if (entranceSeed) {
    randomizeEntrances(SRandom.seed(entranceSeed));
}

if (randomizerSeed) {
    try {
        const assignmentsState = reverseFill(SRandom.seed(randomizerSeed), allNodes, [mainOverworldNode]);
        applyLootAssignments(assignmentsState.assignments);
    } catch (e) {
        console.error('Failed to generate seed', e);
    }
    for (let key in SPAWN_LOCATION_WATERFALL_VILLAGE) {
        SPAWN_LOCATION_DEMO[key] = SPAWN_LOCATION_WATERFALL_VILLAGE[key];
        SPAWN_LOCATION_FULL[key] = SPAWN_LOCATION_WATERFALL_VILLAGE[key];
    }
}
