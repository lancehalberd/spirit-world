import { specialBehaviorsHash } from 'app/content/specialBehaviors/specialBehaviorsHash';
import { randomizerSeed } from 'app/gameConstants';
import SRandom from 'app/utils/SRandom';

import { GameState, ObjectInstance } from 'app/types';

const jadePalaceRandom = SRandom.seed(randomizerSeed).addSeed(726235);

specialBehaviorsHash.jadePalaceSwitch = {
    type: 'floorSwitch',
    apply(state: GameState, object: ObjectInstance) {
        const random = jadePalaceRandom.addSeed(object.definition.x + object.definition.y);
        object.x = object.definition.x + 16 * Math.floor(5 * random.generateAndMutate());
        object.y = object.definition.y + 16 * Math.floor(5 * random.generateAndMutate());
    }
};
