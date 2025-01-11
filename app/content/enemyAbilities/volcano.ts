import {Flame} from 'app/content/effects/flame';
import {addEffectToArea} from 'app/utils/effects';
import {getTargetingAnchor, getVectorToNearbyTarget} from 'app/utils/target';

export function useVolcanoAbility(state: GameState, enemy: Enemy, target: Target, anchorDelta: Point = {x:0, y:0}): void {
    enemy.changeToAnimation('attack');
    const baseTheta = Math.random() * 2 * Math.PI;
    const targetAnchor = getTargetingAnchor(target);
    let {x, y} = getTargetingAnchor(enemy);
    x += anchorDelta.x;
    y += anchorDelta.y;
    //const v = getVectorToNearbyTarget(state, enemy, 2000, enemy.area.allyTargets);
    const count = 5;
    const baseTx = (x + 2 * targetAnchor.x) / 3;
    const baseTy = (y + 2 * targetAnchor.y) / 3;
    for (let i = 0; i < count; i++) {
        const theta = baseTheta + i * 2 * Math.PI / count - Math.PI / count / 2 + Math.random() * Math.PI / count;
        const mag = 32 + 8 * i - 8 + Math.random() * 16;
        const tx = baseTx + mag * Math.cos(theta), ty = baseTy + mag * Math.sin(theta);
        const vz = 3 + i / 2;
        const az = -0.1;
        const duration = -2 * vz / az;

        const flame = new Flame({
            x, y, z: 20,
            vx: (tx - x) / duration / 2,
            vy: (ty - y) / duration / 2,
            vz,
            az,
            minVz: -1,
            damage: 1,
            scale: 1.5,
            ttl: 6000,
            groundFriction: 1,
            source: enemy,
        })
        addEffectToArea(state, enemy.area, flame);
    }
}

export const volcanoAbility: EnemyAbility<Target> = {
    getTarget(state: GameState, enemy: Enemy): Target {
        return getVectorToNearbyTarget(state, enemy, enemy.aggroRadius, enemy.area.allyTargets)?.target;
    },
    prepareAbility(state: GameState, enemy: Enemy, target: Target) {
        enemy.changeToAnimation('prepare');
    },
    useAbility: useVolcanoAbility,
    cooldown: 5000,
    initialCooldown: 1000,
    charges: 1,
    initialCharges: 0,
    prepTime: 200,
    recoverTime: 200,
};


export function useFastVolcanoAbility(state: GameState, enemy: Enemy, target: Target, anchorDelta: Point = {x:0, y:0}): void {
    enemy.changeToAnimation('attack');
    const baseTheta = Math.random() * 2 * Math.PI;
    const targetAnchor = getTargetingAnchor(target);
    let {x, y} = getTargetingAnchor(enemy);
    x += anchorDelta.x;
    y += anchorDelta.y;
    //const v = getVectorToNearbyTarget(state, enemy, 2000, enemy.area.allyTargets);
    const count = 5;
    const baseTx = (x + 2 * targetAnchor.x) / 3;
    const baseTy = (y + 2 * targetAnchor.y) / 3;
    for (let i = 0; i < count; i++) {
        const theta = baseTheta + i * 2 * Math.PI / count - Math.PI / count / 2 + Math.random() * Math.PI / count;
        const mag = 32 + 8 * i - 8 + Math.random() * 16;
        const tx = baseTx + mag * Math.cos(theta), ty = baseTy + mag * Math.sin(theta);
        const vz = 8 + i / 2;
        const az = -0.5;
        const duration = -2 * vz / az;

        const flame = new Flame({
            delay: 60 * i,
            x, y, z: 20,
            vx: (tx - x) / duration / 2,
            vy: (ty - y) / duration / 2,
            vz,
            az,
            minVz: -3,
            damage: 1,
            scale: 1.5,
            ttl: 4000,
            groundFriction: 1,
            source: enemy,
        })
        addEffectToArea(state, enemy.area, flame);
    }
}

export const fastVolcanoAbility: EnemyAbility<Target> = {
    getTarget(state: GameState, enemy: Enemy): Target {
        return getVectorToNearbyTarget(state, enemy, enemy.aggroRadius, enemy.area.allyTargets)?.target;
    },
    prepareAbility(state: GameState, enemy: Enemy, target: Target) {
        enemy.changeToAnimation('prepare');
    },
    useAbility: useFastVolcanoAbility,
    cooldown: 1200,
    initialCooldown: 600,
    charges: 1,
    initialCharges: 0,
    prepTime: 200,
    recoverTime: 200,
};
