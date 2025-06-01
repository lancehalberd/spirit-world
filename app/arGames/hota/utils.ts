import {addModifierEffectToUnit, doesEffectApplyToUnit} from 'app/arGames/hota/modifiers';


export const fieldWidth = 224;
export const rowHeight = 48;
export const fieldHeight = 3 * rowHeight;
export const towerRadius = 12;




export function addUnitToLane(state: GameState, gameState: HotaState, savedState: HotaSavedState, lane: HotaLane, unit: BattleObject) {
    lane.objects.push(unit);
    // Apply existing effects to new units as they enter the battlefield.
    for (const effect of gameState.modifierEffects) {
        if (doesEffectApplyToUnit(unit, effect)) {
            addModifierEffectToUnit(unit, effect);
        }
    }
    // Apply any effects caused by this unit entering the battlefield.
    unit.onEnter?.(state, gameState, savedState);
}


export function drawUnitLifebar(context: CanvasRenderingContext2D, gameState: HotaState, unit: BaseBattleUnit, dy = -2) {
    const p = Math.max(0, Math.min(1, unit.getLife() / unit.getMaxLife(gameState)))
    if (p <= 0 || p >= 1) {
        return;
    }
    const w = Math.max(10, unit.radius * 2);
    context.fillStyle = '#000';
    context.fillRect(unit.x - w / 2, unit.y - unit.radius + dy, w, 1);
    context.fillStyle = '#444';
    context.fillRect(unit.x - w / 2, unit.y - unit.radius + dy + 1, w, 1);
    context.fillStyle = '#0A0';;
    context.fillRect(unit.x - w / 2, unit.y - unit.radius + dy, Math.ceil(p * w), 2);
}

export function getDistance(o1: BattleObject, o2: BattleObject): number {
    //return Math.max(0, Math.abs(o1.x - o2.x) - o1.radius - o2.radius);
    const dx = o1.x - o2.x, dy = o1.y - o2.y;
    return Math.max(0, Math.sqrt(dx * dx + dy * dy) - o1.radius - o2.radius);
}


export function updateTarget(attacker: BattleObject, targets: BattleObject[]) {
    const range = attacker.getRange();
    // Remove current target if it is invalid.
    if (attacker.target && (attacker.target.getLife() <= 0 || getDistance(attacker, attacker.target) > range)) {
        delete attacker.target;
    }
    // Find a new target if none is assigned.
    if (!attacker.target) {
        let bestDistance = range;
        for (const target of targets) {
            const distance = getDistance(attacker, target);
            if (distance < bestDistance) {
                bestDistance = distance;
                attacker.target = target;
            }
        }
    }
}
