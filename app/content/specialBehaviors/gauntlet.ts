import { specialBehaviorsHash } from 'app/content/specialBehaviors/specialBehaviorsHash';
import { variantSeed } from 'app/gameConstants';
import SRandom from 'app/utils/SRandom';


const gauntletRandom = SRandom.seed(variantSeed).addSeed(726235);

specialBehaviorsHash.gauntletSwitch = {
    type: 'floorSwitch',
    apply(state: GameState, object: ObjectInstance) {
        const random = gauntletRandom.addSeed(object.definition.x + object.definition.y);
        object.x = object.definition.x + 16 * Math.floor(5 * random.generateAndMutate());
        object.y = object.definition.y + 16 * Math.floor(5 * random.generateAndMutate());
    }
};

/**
 * This special behavior disables all ball goals in the spirit world and all but 2 ball goals
 * in the material world. The goal is that the player will have to activate the 2 goals
 * from the material world (as the material balls cannot be freed from the spirit world),
 * but they will not be able to determine which goals to activate without spirit sight.
 */
// This needs to be manually set to match the number of goals created.
const totalGoals = 12;
specialBehaviorsHash.gauntletBallGoal = {
    type: 'ballGoal',
    apply(state: GameState, object: ObjectInstance) {
        if (object.area.definition.isSpiritWorld) {
            object.disabled = true;
            return;
        }
        const allGoals = object.area.objects.filter(o => o.definition?.type === 'ballGoal' && o.definition.specialBehaviorKey === 'gauntletBallGoal');
        const index = allGoals.indexOf(object);
        const random = gauntletRandom.addSeed(975324);
        const goal1 = random.range(0, totalGoals - 1);
        random.generateAndMutate();
        const goal2 = random.range(0, totalGoals - 1);
        if (index === goal1 || index === goal2) {
            object.showTrueSightIndicator = true;
        } else {
            object.disabled = true;
        }
    }
};
