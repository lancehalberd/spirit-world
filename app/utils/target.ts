import { getLedgeDelta } from 'app/movement/getLedgeDelta';
import { getTileBehaviors } from 'app/utils/getBehaviors';
import {getCardinalDirection} from 'app/utils/direction';

// Note this assumes the target is actually in the same area as the source.
// Limiting the set of possible targets is handled by the set of targets passed into various targeting functions.
export function isTargetVisible(
    state: GameState,
    source: EffectInstance | ObjectInstance,
    target: EffectInstance | ObjectInstance,
): boolean {
    return !!target && !!target.getHitbox && !target.isInvisible;
}

function getTargetingAnchor(target:EffectInstance | ObjectInstance): Point {
     if (target.getTargetingAnchorPoint) {
         return target.getTargetingAnchorPoint();
     }
     // For targeting we use the regular hitbox since most hitboxes treat y/z interchangeably.
     const hitbox = target.getHitbox();
     return {
         x: hitbox.x + hitbox.w / 2,
         y: hitbox.y + hitbox.h / 2,
     }
}

export function getNearbyTarget(state: GameState, source: EffectInstance | ObjectInstance, radius: number,
    targets: (EffectInstance | ObjectInstance)[], ignoreTargets: Set<EffectInstance | ObjectInstance> = null
): EffectInstance | ObjectInstance {
    const sourceAnchor = getTargetingAnchor(source);
    for (const target of targets) {
        if (!isTargetVisible(state, source, target) || ignoreTargets?.has(target)) {
            continue;
        }
        const targetAnchor = getTargetingAnchor(target);
        const dx = targetAnchor.x - sourceAnchor.x;
        const dy = targetAnchor.y - sourceAnchor.y;
        const mag = Math.sqrt(dx * dx + dy * dy);
        if (mag <= radius) {
            return target;
        }
    }
    return null;
}

export function getVectorToTarget(state: GameState, source: EffectInstance | ObjectInstance, target: EffectInstance | ObjectInstance):{x: number, y: number, mag: number} {
    const sourceAnchor = getTargetingAnchor(source);
    const targetAnchor = getTargetingAnchor(target);
    const dx = targetAnchor.x - sourceAnchor.x;
    const dy = targetAnchor.y - sourceAnchor.y;
    const mag = Math.sqrt(dx * dx + dy * dy);
    if (mag) {
        return {mag, x: dx / mag, y: dy / mag};
    }
    return {mag, x: 0, y: 1};
}

export function getCardinalDirectionToTarget(
    source: EffectInstance | ObjectInstance,
    target: EffectInstance | ObjectInstance,
    defaultDirection: CardinalDirection = 'down'
): CardinalDirection {
    const sourceAnchor = getTargetingAnchor(source);
    const targetAnchor = getTargetingAnchor(target);
    const dx = targetAnchor.x - sourceAnchor.x;
    const dy = targetAnchor.y - sourceAnchor.y;
    return getCardinalDirection(dx, dy, defaultDirection);
}

export function getVectorToMovementTarget(state: GameState, source: EffectInstance | ObjectInstance, target: EffectInstance | ObjectInstance):{x: number, y: number, mag: number} {
    const hitbox = source.getMovementHitbox();
    const targetHitbox = target.getMovementHitbox();
    const dx = (targetHitbox.x + targetHitbox.w / 2) - (hitbox.x + hitbox.w / 2);
    const dy = (targetHitbox.y + targetHitbox.h / 2) - (hitbox.y + hitbox.h / 2);
    const mag = Math.sqrt(dx * dx + dy * dy);
    if (mag) {
        return {mag, x: dx / mag, y: dy / mag};
    }
    return {mag, x: 0, y: 1};
}

export function getVectorToHitbox(source: Rect, target: Rect):{x: number, y: number, mag: number} {
    const dx = (target.x + target.w / 2) - (source.x + source.w / 2);
    const dy = (target.y + target.h / 2) - (source.y + source.h / 2);
    const mag = Math.sqrt(dx * dx + dy * dy);
    if (mag) {
        return {mag, x: dx / mag, y: dy / mag};
    }
    return {mag, x: 0, y: 1};
}

export function getVectorToNearbyTarget(state: GameState,
    source: EffectInstance | ObjectInstance, radius: number,
    targets: (EffectInstance | ObjectInstance)[]
): {x: number, y: number, mag: number, target: EffectInstance | ObjectInstance} | null {
    const sourceAnchor = getTargetingAnchor(source);
    for (const target of targets) {
        if (!isTargetVisible(state, source, target)) {
            continue;
        }
        const targetAnchor = getTargetingAnchor(target);
        const dx = targetAnchor.x - sourceAnchor.x;
        const dy = targetAnchor.y - sourceAnchor.y;
        const mag = Math.sqrt(dx * dx + dy * dy);
        if (mag <= radius) {
            if (mag) {
                return {mag, x: dx / mag, y: dy / mag, target};
            }
            return {mag, x: 0, y: 1, target};
        }
    }
    return null;
}

export function getVectorToNearestTargetOrRandom(state: GameState, source: EffectInstance | ObjectInstance,
    targets: (EffectInstance | ObjectInstance)[]
): {x: number, y: number} {
    const v = getVectorToNearbyTarget(state, source, 1000, targets);
    if (v) {
        return v;
    }
    const dx = Math.random();
    const dy = Math.random();
    if (!dx && !dy) {
        return {x: 0, y: 1};
    }
    const mag = Math.sqrt(dx * dx + dy * dy);
    return {x: dx / mag, y: dy / mag};
}

// Assuming a tile is solid, this will return true if the given movement properties allow moving over
// the solid tile.
export function canPassOverWall(behavior: TileBehaviors, movementProperties: MovementProperties): boolean {
    if (movementProperties.canPassWalls) {
        return true;
    }
    if (movementProperties.canPassMediumWalls) {
        return behavior.low || behavior.midHeight;
    }
    return movementProperties.canPassLowWalls && behavior.low;
}

export function getLineOfSightTargetAndDirection(
    state: GameState,
    source: EffectInstance | ObjectInstance,
    targets: (EffectInstance | ObjectInstance)[],
    direction: CardinalDirection = null,
    // By default enemies will not aggro you from much further than half a screen.
    distance = 128,
    movementProperties: MovementProperties = {},
): {d: CardinalDirection, target: EffectInstance | ObjectInstance} {
    if (!source.area) {
        return {d: null, target: null};
    }
    const hitbox = source.getHitbox(state);
    for (const target of targets) {
        if (!isTargetVisible(state, source, target)) {
            continue;
        }
        if (getVectorToTarget(state, source, target).mag > distance) {
            continue;
        }
        const targetHitbox = target.getHitbox();
        if (hitbox.x <= targetHitbox.x + targetHitbox.w / 2
            && hitbox.x + hitbox.w >= target.x + targetHitbox.w / 2
            && (direction !== 'left' && direction !== 'right')
        ) {
            if ((targetHitbox.y < hitbox.y && direction === 'down') || (targetHitbox.y > hitbox.y && direction === 'up')) {
                continue
            }

            const x = hitbox.x + hitbox.w / 2;
            const tx = Math.floor(x / 16);
            const y1 = targetHitbox.y + targetHitbox.h / 2, y2 = hitbox.y + hitbox.h / 2;
            const minY = Math.min(y1, y2);
            const maxY = Math.max(y1, y2);
            let blocked = false;
            let lastPoint: Point;
            for (let y = minY; true; y += 4) {
                const ty = Math.floor(y / 16);
                const tileBehavior = {...(source.area?.behaviorGrid[ty]?.[tx] || {})};
                if ((tileBehavior.solid || tileBehavior.solidMap) && !(tileBehavior.pickupWeight <= movementProperties.crushingPower)) {
                    if (!canPassOverWall(tileBehavior, movementProperties)) {
                        blocked = true;
                        break;
                    }
                }
                if ((tileBehavior.pit || tileBehavior.pitMap) && !movementProperties.canFall) {
                    blocked = true;
                    break;
                }
                if (tileBehavior.water && !movementProperties.canSwim) {
                    blocked = true;
                    break;
                }
                const point = {x, y};
                if (lastPoint) {
                    const ledgeDelta = getLedgeDelta(state, source.area, lastPoint, point);
                    if (ledgeDelta != 0) {
                        blocked = true;
                        break;
                    }
                }
                lastPoint = point;
                if (y >= maxY) {
                    break;
                }
            }
            if (!blocked) {
                return {
                    d: target.y < hitbox.y ? 'up' : 'down',
                    target,
                };
            }
        }
        if (hitbox.y <= targetHitbox.y + targetHitbox.h / 2
            && hitbox.y + hitbox.h >= target.y + targetHitbox.h / 2
            && (direction !== 'up' && direction !== 'down')
        ) {
            if ((target.x < hitbox.x && direction === 'right') || (target.x > hitbox.x && direction === 'left')) {
                continue
            }
            const y = hitbox.y + hitbox.h / 2;
            const ty = Math.floor(y / 16);
            const x1 = targetHitbox.x + targetHitbox.w / 2, x2 = hitbox.x + hitbox.w / 2;
            const minX = Math.min(x1, x2);
            const maxX = Math.max(x1, x2);
            let blocked = false;
            let lastPoint: Point;
            for (let x = minX; true; x += 4) {
                const tx = Math.floor(x / 16);
                const tileBehavior = {...(source.area?.behaviorGrid[ty]?.[tx] || {})};
                if ((tileBehavior.solid || tileBehavior.solidMap) && !(tileBehavior.pickupWeight <= movementProperties.crushingPower)) {
                    if (!canPassOverWall(tileBehavior, movementProperties)) {
                        blocked = true;
                        break;
                    }
                }
                if ((tileBehavior.pit || tileBehavior.pitMap) && !movementProperties.canFall) {
                    blocked = true;
                    break;
                }
                if (tileBehavior.water && !movementProperties.canSwim) {
                    blocked = true;
                    break;
                }
                const point = {x, y};
                if (lastPoint) {
                    const ledgeDelta = getLedgeDelta(state, source.area, lastPoint, point);
                    if (ledgeDelta != 0) {
                        blocked = true;
                        break;
                    }
                }
                lastPoint = point;
                if (x >= maxX) {
                    break;
                }
            }
            if (!blocked) {
                return {
                    d: target.x < hitbox.x ? 'left' : 'right',
                    target,
                };
            }
        }
    }
    return {d: null, target: null};
}

export function getEndOfLineOfSight(state: GameState, enemy: Enemy, tx: number, ty: number): {
    x: number
    y: number
    mag: number
    targetIsBelow?: boolean;
    blocked?: boolean
} {
    const hitbox = enemy.getHitbox(state);
    const cx = hitbox.x + hitbox.w / 2;
    const cy = hitbox.y + hitbox.h / 2;
    const dx = tx - cx, dy = ty - cy;
    const mag = Math.sqrt(dx * dx + dy * dy);
    let ledgeDeltaSum = 0, lastPoint: Point;
    for (let i = 0; i < mag; i += 4) {
        const point = {
            x: cx + i * dx / mag,
            y: cy + i * dy / mag,
        };
        const { tileBehavior } = getTileBehaviors(state, enemy.area, point);
        if (!tileBehavior?.low && tileBehavior?.solid) {
            return {x: point.x, y: point.y, mag: i - 4, blocked: true};
        }
        if (lastPoint) {
            const ledgeDelta = getLedgeDelta(state, enemy.area, lastPoint, point);
            if (ledgeDelta < 0) {
                ledgeDeltaSum--;
            }
            if (ledgeDelta > 0) {
                ledgeDeltaSum++;
            }
            // Line of site is blocked when
            if (ledgeDeltaSum > 0) {
                return {x: point.x, y: point.y, mag: i - 4, blocked: true};
            }
        }
        lastPoint = point;
    }
    return {x: tx, y: ty, mag, targetIsBelow: ledgeDeltaSum < 0};
}
