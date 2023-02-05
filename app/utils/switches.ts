import { activateTarget } from 'app/utils/objects'

import { AreaInstance, BallGoal, CrystalSwitch, FloorSwitch, GameState } from 'app/types';

export function areAllSwitchesActivated(state: GameState, area: AreaInstance, switchInstance: BallGoal | CrystalSwitch | FloorSwitch): boolean {
    return !area.objects.some(o =>
        (o.definition?.type === 'ballGoal' || o.definition?.type === 'crystalSwitch' || o.definition?.type === 'floorSwitch') &&
        o.definition?.targetObjectId === switchInstance.definition.targetObjectId &&
        o.status !== 'active' && o.disabled !== true
    );
}

export function checkIfAllSwitchesAreActivated(state: GameState, area: AreaInstance, switchInstance: BallGoal | CrystalSwitch | FloorSwitch): void {
    if (!areAllSwitchesActivated(state, area, switchInstance)) {
        return;
    }
    for (const object of area.objects) {
        if (switchInstance.definition.targetObjectId && object.definition?.id !== switchInstance.definition.targetObjectId) {
            continue;
        }
        activateTarget(state, object, true);
    }
}

