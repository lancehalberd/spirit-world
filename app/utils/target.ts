import {
    Direction, EffectInstance, GameState, Hero, ObjectInstance,
} from 'app/types';

export function isTargetVisible(state: GameState, source: EffectInstance | ObjectInstance, target: EffectInstance | ObjectInstance): boolean {
    return !!target && !!target.getHitbox && !target.isInvisible;
    // We were checking area, but in some cases we want enemies to see target in the alternate area.
    // If we need this, we could add a flag to enemies indicating they can see into the alternate area to ignore this check.
    // target.area === source.area
}

export function getNearbyTarget(state: GameState, source: EffectInstance | ObjectInstance, radius: number,
    targets: (EffectInstance | ObjectInstance)[], ignoreTargets: Set<EffectInstance | ObjectInstance> = null
): EffectInstance | ObjectInstance {
    const hitbox = source.getHitbox(state);
    for (const target of targets) {
        if (!isTargetVisible(state, source, target) || ignoreTargets?.has(target)) {
            continue;
        }
        const targetHitbox = target.getHitbox(state);
        const dx = (targetHitbox.x + targetHitbox.w / 2) - (hitbox.x + hitbox.w / 2);
        const dy = (targetHitbox.y + targetHitbox.h / 2) - (hitbox.y + hitbox.h / 2);
        const mag = Math.sqrt(dx * dx + dy * dy);
        if (mag <= radius) {
            return target;
        }
    }
    return null;
}

export function getVectorToTarget(state: GameState, source: EffectInstance | ObjectInstance, target: EffectInstance | ObjectInstance):{x: number, y: number, mag: number} {
    const hitbox = source.getHitbox(state);
    const targetHitbox = target.getHitbox(state);
    const dx = (targetHitbox.x + targetHitbox.w / 2) - (hitbox.x + hitbox.w / 2);
    const dy = (targetHitbox.y + targetHitbox.h / 2) - (hitbox.y + hitbox.h / 2);
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
    const hitbox = source.getHitbox(state);
    for (const target of targets) {
        if (!isTargetVisible(state, source, target)) {
            continue;
        }
        const targetHitbox = target.getHitbox(state);
        const dx = (targetHitbox.x + targetHitbox.w / 2) - (hitbox.x + hitbox.w / 2);
        const dy = (targetHitbox.y + targetHitbox.h / 2) - (hitbox.y + hitbox.h / 2);
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

export function getLineOfSightTargetAndDirection(
    state: GameState,
    source: EffectInstance | ObjectInstance,
    direction: Direction = null,
    projectile: boolean = false
): {d: Direction, hero: Hero} {
    const hitbox = source.getHitbox(state);
    for (const hero of [state.hero, state.hero.astralProjection, ...state.hero.clones]) {
        if (!isTargetVisible(state, source, hero)) {
            continue;
        }
        // Reduce dimensions of hitbox for these checks so that the hero is not in line of sight when they are most of a tile
        // off (like 0.5px in line of sight), otherwise the hero can't hide from line of sight on another tile if
        // they aren't perfectly lined up with the tile.
        if (hitbox.x + 1 < hero.x + hero.w && hitbox.x + hitbox.w - 1 > hero.x && (direction !== 'left' && direction !== 'right')) {
            if ((hero.y < hitbox.y && direction === 'down') || (hero.y > hitbox.y && direction === 'up')) {
                continue
            }
            const x = Math.floor(hitbox.x / 16);
            const y1 = Math.floor(hero.y / 16), y2 = Math.floor(hitbox.y / 16);
            const minY = Math.min(y1, y2);
            const maxY = Math.max(y1, y2);
            let blocked = false;
            for (let y = minY; y <= maxY; y++) {
                const tileBehavior = {...(source.area?.behaviorGrid[y]?.[x] || {})};
                if (tileBehavior.solid || (!projectile && (tileBehavior.pit || tileBehavior.water))) {
                    blocked = true;
                    break;
                }
            }
            if (!blocked) {
                return {
                    d: hero.y < hitbox.y ? 'up' : 'down',
                    hero,
                };
            }
        }
        if (hitbox.y + 1 < hero.y + hero.h && hitbox.y + hitbox.h - 1 > hero.y && (direction !== 'up' && direction !== 'down')) {
            if ((hero.x < hitbox.x && direction === 'right') || (hero.x > hitbox.x && direction === 'left')) {
                continue
            }
            const y = Math.floor(hitbox.y / 16);
            const x1 = Math.floor(hero.x / 16), x2 = Math.floor(hitbox.x / 16);
            const minX = Math.min(x1, x2);
            const maxX = Math.max(x1, x2);
            let blocked = false;
            for (let x = minX; x <= maxX; x++) {
                const tileBehavior = {...(source.area?.behaviorGrid[y]?.[x] || {})};
                if (tileBehavior.solid || (!projectile && (tileBehavior.pit || tileBehavior.water))) {
                    blocked = true;
                    break;
                }
            }
            if (!blocked) {
                return {
                    d: hero.x < hitbox.x ? 'left' : 'right',
                    hero,
                };
            }
        }
    }
    return {d: null, hero: null};
}
