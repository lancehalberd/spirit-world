import { specialBehaviorsHash } from 'app/content/specialBehaviors/specialBehaviorsHash';
import { randomizerSeed } from 'app/gameConstants';
import SRandom from 'app/utils/SRandom';

import { GameState, ObjectInstance } from 'app/types';

const warTempleRandom = SRandom.seed(randomizerSeed).addSeed(972356);

specialBehaviorsHash.warTempleEntranceSwitch = {
    type: 'floorSwitch',
    apply(state: GameState, object: ObjectInstance) {
        if (object.definition.id === 'overworldWarTempleSwitchA') {
            const random = warTempleRandom.addSeed(1);
            object.x += 16 * Math.floor(2 * random.generateAndMutate());
            object.y += 16 * Math.floor(3 * random.generateAndMutate());
        }
        if (object.definition.id === 'overworldWarTempleSwitchB') {
            const random = warTempleRandom.addSeed(2);
            object.x += 16 * Math.floor(2 * random.generateAndMutate());
            object.y += 16 * Math.floor(3 * random.generateAndMutate());
        }
    }
};

specialBehaviorsHash.warTempleEntrancePot = {
    type: 'pushPull',
    apply(state: GameState, object: ObjectInstance) {
        const offsets = [[0, 0], [16, 0], [0, 16]];
        if (object.definition.id === 'overworldWarTemplePotA') {
            const [x, y] = warTempleRandom.addSeed(3).element(offsets);
            object.x += x;
            object.y += y;
        }
        if (object.definition.id === 'overworldWarTemplePotB') {
            const [x, y] = warTempleRandom.addSeed(4).element(offsets);
            object.x -= x;
            object.y += y;
        }
    }
};
