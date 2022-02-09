import { dialogueHash } from 'app/content/dialogue/dialogueHash';
import { specialBehaviorsHash } from 'app/content/specialBehaviors/specialBehaviorsHash';
import { Escalator } from 'app/content/objects/escalator';
import { Anode } from 'app/content/objects/lightningBarrier';
import { Sign } from 'app/content/objects/sign';

import { AreaInstance, Enemy, GameState } from 'app/types';

specialBehaviorsHash.staffTower = {
    type: 'area',
    apply(state: GameState, area: AreaInstance) {
        const towerIsOn = !!state.savedState.objectFlags.elementalBeastsEscaped;
        const towerIsHaywire = towerIsOn && !state.savedState.objectFlags.stormBeast;
        if (!towerIsOn) {
            // Before the tower is turned on, everything is off and dark.
            area.dark = Math.max(area.definition.dark || 0, 50);
            for (const object of area.objects) {
                if (object instanceof Enemy) {
                    if (object.definition.enemyType === 'lightningDrone' || object.definition.enemyType === 'sentryBot') {
                        object.status = 'off';
                    }
                }
                switch (object.definition.type) {
                    case 'sign':
                    case 'escalator':
                        object.status = 'off';
                }
            }
        } else {
            // Once the elevator is fixed, the basement gets brighter.
            if (state.savedState.objectFlags.elevatorFixed) {
                area.dark = Math.min(area.dark, 50);
            }
            if (!towerIsHaywire) {
                // After the tower is fixed, most things are on, but traps/obstacles are disbabled.
                for (const object of area.objects) {
                    if (object instanceof Escalator) {
                        object.speed = 'slow';
                    } else if (object instanceof Anode) {
                        object.status = 'off';
                    }
                }
            }
        }
    },
};
specialBehaviorsHash.towerTeleporter = {
    type: 'sign',
    apply(state: GameState, object: Sign) {
        object.message = object.area.definition.isSpiritWorld
            ? 'THIS TERMINAL CONTROLS TRANSFER TO THE CORE?{choice:TRANSFER?|Yes:towerTeleporter.teleport|No}'
            : 'THIS TERMINAL CONTROLS TRANSFER TO THE PERIPHERY.{choice:TRANSFER?|Yes:towerTeleporter.teleport|No}'
    }
}

dialogueHash.towerTeleporter = {
    key: 'towerTeleporter',
    mappedOptions: {
        teleport: `{teleport}`,
    },
    options: [],
}
