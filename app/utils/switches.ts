import {activateTarget, getTargetObjectIdsByTypesAndArea} from 'app/utils/objects'


export function areAllSwitchesActivated(state: GameState, area: AreaInstance, definition: BaseSwitchDefinition): boolean {
    return !area.objects.some(o =>
        (o.definition?.type === 'ballGoal' || o.definition?.type === 'crystalSwitch' || o.definition?.type === 'floorSwitch') &&
        o.definition?.targetObjectId === definition.targetObjectId &&
        o.status !== 'active' && o.disabled !== true
    );
}

export function checkIfAllSwitchesAreActivated(
    state: GameState,
    area: AreaInstance,
    definition: BaseSwitchDefinition
): boolean {
    if (!definition.targetObjectId/* || switchInstance.status !== 'active'*/) {
        return false;
    }
    const requireAll = definition.requireAll ?? true;
    if (requireAll && !areAllSwitchesActivated(state, area, definition)) {
        return false;
    }
    let playChime = true;
    for (const object of [...area.objects, ...(area.alternateArea?.objects || [])]) {
        if (object.definition?.id === definition.targetObjectId) {
            activateTarget(state, object, playChime);
            // Only play chimes once per switch activation.
            playChime = false;
        }
    }
    return true;
}

const switchTargetTypes: ObjectType[] = [
    'door', 'chest', 'loot', 'airBubbles', 'beadGrate', 'beadCascade', 'keyBlock',
    'narration', 'pitEntrance', 'shieldingUnit',
    'teleporter', 'torch', 'escalator', 'airStream', 'anode',
];

export function getSwitchTargetIds(area: AreaDefinition, alternateArea: AreaDefinition): string[] {
    return [...new Set([
        'none',
        ...getTargetObjectIdsByTypesAndArea(area, switchTargetTypes),
        ...getTargetObjectIdsByTypesAndArea(alternateArea, switchTargetTypes),
    ])];
}
