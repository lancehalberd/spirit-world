import { specialBehaviorsHash } from 'app/content/specialBehaviors/specialBehaviorsHash';
import { variantSeed } from 'app/gameConstants';
import { removeObjectFromArea } from 'app/utils/objects';
import { Indicator } from 'app/content/objects/indicator';
import { addObjectToArea } from 'app/utils/objects';
import SRandom from 'app/utils/SRandom';


const warTempleRandom = SRandom.seed(variantSeed).addSeed(972356);

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

specialBehaviorsHash.warTempleSpiritPot = {
    type: 'pushPull',
    apply(state: GameState, object: ObjectInstance) {
        const index = warTempleRandom.addSeed(5).range(0, 3);
        if (object.definition.id === 'warTemplePot' + index) {
            removeObjectFromArea(state, object);
        } else {
            const indicator = new Indicator(state, {
                type: 'indicator', id: 'potIndicator', status: 'normal',
                targetObjectId: object.definition.id,  x: object.x, y: object.y
            });
            // The alternate area isn't defined in time to add it here, so this will cause the
            // indicator to swap worlds when possible.
            indicator.swapWorlds = true;
            addObjectToArea(state, object.area, indicator);
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
