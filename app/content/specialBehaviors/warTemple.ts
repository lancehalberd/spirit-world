import { specialBehaviorsHash } from 'app/content/specialBehaviors/specialBehaviorsHash';
import { randomizerSeed } from 'app/gameConstants';
import SRandom from 'app/utils/SRandom';

import { GameState, ObjectInstance } from 'app/types';

const warTempleRandom = SRandom.seed(randomizerSeed).addSeed(972356);

specialBehaviorsHash.warTempleEntranceSwitch = {
    type: 'floorSwitch',
    apply(state: GameState, object: ObjectInstance) {
        const random = warTempleRandom.addSeed(object.definition.x + object.definition.y);
        object.x = object.definition.x + 16 * Math.floor(2 * random.generateAndMutate());
        object.y = object.definition.y + 16 * Math.floor(3 * random.generateAndMutate());
    }
};

specialBehaviorsHash.warTempleEntrancePot = {
    type: 'pushPull',
    apply(state: GameState, object: ObjectInstance) {
        const offsets = [[0, 0], [16, 0], [0, 16]];
        if (object.definition.id === 'overworldWarTemplePotA') {
            const [x, y] = warTempleRandom.addSeed(3).element(offsets);
            object.x = object.definition.x + x;
            object.y = object.definition.y + y;
        }
        if (object.definition.id === 'overworldWarTemplePotB') {
            const [x, y] = warTempleRandom.addSeed(4).element(offsets);
            object.x = object.definition.x - x;
            object.y = object.definition.y + y;
        }
    }
};

specialBehaviorsHash.warTempleCrackedPot = {
    type: 'tippable',
    apply(state: GameState, object: ObjectInstance) {
        const offsets = [[0, 0], [16, -16], [16, 16], [32, 0]];
        const [x, y] = warTempleRandom.addSeed(3).element(offsets);
        object.x = object.definition.x + x;
        object.y = object.definition.y + y;
    }
};
