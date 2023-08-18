import { CrystalSpike } from 'app/content/effects/arrow';
import { Flame } from 'app/content/effects/flame';
import { Frost } from 'app/content/effects/frost';
import { Spark } from 'app/content/effects/spark';
import { addEffectToArea } from 'app/utils/effects';


export const flameDefinition = {
    type: 'flame' as const,
    damage: 1,
    speed: 3,
};

export const enemyArrowDefinition = {
    type: 'enemyArrow' as const,
    damage: 1,
    speed: 4,
};

export const crystalSpikeDefinition = {
    type: 'crystalSpike' as const,
    damage: 1,
    speed: 3,
};

export const frostDefinition = {
    type: 'frost' as const,
    damage: 1,
    speed: 4,
    ttl: 1500,
};

export const sparkDefinition = {
    type: 'spark' as const,
    damage: 1,
    speed: 4,
};

export const sparkCircleDefinition = {
    type: 'sparkCircle' as const,
    damage: 1,
    speed: 4,
    hitCircle: {x: 0, y: 0, r: 10},
};

export type ProjectileDefinition
    = typeof enemyArrowDefinition
    | typeof crystalSpikeDefinition
    | typeof flameDefinition
    | typeof frostDefinition
    | typeof sparkDefinition
    | typeof sparkCircleDefinition


export function addRadialProjectiles(this: void,
    state: GameState, area: AreaInstance, definition: ProjectileDefinition,
    [x, y]: Coords, count: number, thetaOffset = 0,
): void {
    for (let i = 0; i < count; i++) {
        const theta = thetaOffset + i * 2 * Math.PI / count;
        const dx = Math.cos(theta);
        const dy = Math.sin(theta);
        shootProjectile(state, area, definition,
            [x + definition.speed * dx, y + definition.speed * dy], theta
        );
    }
}

export function addArcOfProjectiles(this: void,
    state: GameState, area: AreaInstance, definition: ProjectileDefinition,
    [x, y]: Coords, count: number, centerTheta = 0, thetaRadius = Math.PI / 4
): void {
    for (let i = 0; i < count; i++) {
        const theta = count === 1
            ? centerTheta
            : centerTheta - thetaRadius + i * 2 * thetaRadius / (count - 1);
        const dx = Math.cos(theta);
        const dy = Math.sin(theta);
        const spark = new Spark({
            x,
            y,
            vx: 4 * dx,
            vy: 4 * dy,
            ttl: 1000,
        });
        addEffectToArea(state, area, spark);
    }
}

export function shootProjectile(
    state: GameState, area: AreaInstance, definition: ProjectileDefinition,
    [x, y]: Coords, theta: number
) {
    const dx = Math.cos(theta), dy = Math.sin(theta);
    const commonProps = {
        x, y,
        vx: definition.speed * dx,
        vy: definition.speed * dy,
        damage: definition.damage,
    }
    if (definition.type === 'spark') {
        const spark = new Spark({
            ...commonProps,
        });
        addEffectToArea(state, area, spark);
    } else if (definition.type === 'sparkCircle') {
        const spark = new Spark({
            ...commonProps,
            hitCircle: definition.hitCircle,
        });
        addEffectToArea(state, area, spark);
    } else if (definition.type === 'frost') {
        const frost = new Frost({
            ...commonProps,
            ttl: definition.ttl,
        });
        addEffectToArea(state, area, frost);
    } else if (definition.type === 'flame') {
        const flame = new Flame({
            ...commonProps,
        });
        addEffectToArea(state, area, flame);
    } else if (definition.type === 'crystalSpike') {
        const crystalSpike = new CrystalSpike({
            ...commonProps,
        });
        addEffectToArea(state, area, crystalSpike);
    }
}
