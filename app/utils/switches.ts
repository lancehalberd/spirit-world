import { activateTarget } from 'app/utils/objects'

import { AreaInstance, BallGoal, CrystalSwitch, FloorSwitch, GameState } from 'app/types';

export function checkIfAllSwitchesAreActivated(state: GameState, area: AreaInstance, switchInstance: BallGoal | CrystalSwitch | FloorSwitch): void {
    // Do nothing if there still exists a switch with the same target that is not active.
    if (area.objects.some(o =>
        (o.definition?.type === 'ballGoal' || o.definition?.type === 'crystalSwitch' || o.definition?.type === 'floorSwitch') &&
        o.definition?.targetObjectId === switchInstance.definition.targetObjectId &&
        o.status !== 'active' && o.disabled !== true
    )) {
        return;
    }

    for (const object of area.objects) {
        if (switchInstance.definition.targetObjectId && object.definition?.id !== switchInstance.definition.targetObjectId) {
            continue;
        }
        activateTarget(state, object, true);
    }
}

