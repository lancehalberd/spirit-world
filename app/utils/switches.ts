import { activateTarget } from 'app/utils/objects'


export function areAllSwitchesActivated(state: GameState, area: AreaInstance, switchInstance: BallGoal | CrystalSwitch | FloorSwitch): boolean {
    return !area.objects.some(o =>
        (o.definition?.type === 'ballGoal' || o.definition?.type === 'crystalSwitch' || o.definition?.type === 'floorSwitch') &&
        o.definition?.targetObjectId === switchInstance.definition.targetObjectId &&
        o.status !== 'active' && o.disabled !== true
    );
}

export function checkIfAllSwitchesAreActivated(state: GameState, area: AreaInstance, switchInstance: BallGoal | CrystalSwitch | FloorSwitch): boolean {
    if (!switchInstance.definition.targetObjectId) {
        return false;
    }
    if (!areAllSwitchesActivated(state, area, switchInstance)) {
        return false;
    }
    for (const object of [...area.objects, ...(area.alternateArea?.objects || [])]) {
        if (object.definition?.id === switchInstance.definition.targetObjectId) {
            activateTarget(state, object, true);
        }
    }
    return true;
}

function getTargetObjectIdsByTypesAndArea(area: AreaInstance, types: ObjectType[]): string[] {
    if (!area) {
        return [];
    }
    return area.objects.filter(object => types.includes(object.definition?.type)).map(object => object.definition?.id).filter(id => id);
}

export function getSwitchTargetIds(area: AreaInstance): string[] {
    return [
        'none',
        ...getTargetObjectIdsByTypesAndArea(area,
            [
                'door', 'chest', 'loot', 'airBubbles', 'beadGrate', 'beadCascade',
                'narration', 'pitEntrance', 'shieldingUnit',
                'teleporter', 'torch', 'escalator', 'airStream', 'anode',
            ]
        )
    ];
}
