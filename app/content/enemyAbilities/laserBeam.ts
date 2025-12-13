import {LaserBeam} from 'app/content/effects/laserBeam';
import {FRAME_LENGTH} from 'app/gameConstants';
import {addEffectToArea} from 'app/utils/effects';
import {getEndOfLineOfSight, getVectorToNearbyTarget} from 'app/utils/target';


export const laserBeamAbility: EnemyAbility<Point> = {
    getTarget(this: void, state: GameState, enemy: Enemy): Point {
        const vector = getVectorToNearbyTarget(state, enemy, enemy.aggroRadius, enemy.area.allyTargets);
        if (!vector) {
            return;
        }
        const {x, y, mag} = vector;
        const hitbox = enemy.getHitbox();
        const tx = hitbox.x + hitbox.w / 2 + x * 1000, ty = hitbox.y + hitbox.h / 2 + y * 1000;
        const { mag: sightDistance, targetIsBelow } = getEndOfLineOfSight(state, enemy, tx, ty);
        if (targetIsBelow || sightDistance < mag) {
            return;
        }
        // The idea here is to target as far as possible beyond the target.
        return {x: tx, y: ty};
    },
    useAbility(this: void, state: GameState, enemy: Enemy, target: Point): void {
        const hitbox = enemy.getHitbox();
        const cx = hitbox.x + hitbox.w / 2;
        const cy = hitbox.y + hitbox.h / 2;
        addEffectToArea(state, enemy.area, new LaserBeam({
            sx: cx, sy: cy,
            tx: target.x, ty: target.y,
            radius: 5, damage: 4, duration: 200, tellDuration: 800,
            source: enemy,
        }));
    },
    cooldown: 3000,
    prepTime: 0,
    recoverTime: 1000,
};

export const bossLaserBeamAbility: EnemyAbility<number> = {
    getTarget(this: void, state: GameState, enemy: Enemy): number {
        const vector = getVectorToNearbyTarget(state, enemy, enemy.aggroRadius, enemy.area.allyTargets);
        if (!vector) {
            return;
        }
        return Math.atan2(vector.y, vector.x);
    },
    useAbility(this: void, state: GameState, enemy: Enemy, angle: number): void {
        const laserBeam = new LaserBeam({
            sx: 0, sy: 0, tx: 0, ty: 0,
            radius: 12, damage: 4, duration: 200, tellDuration: 800,
            source: enemy,
            ignoreWalls: true,
        });
        setLaserBeamByTargetAndAngle(laserBeam, enemy, angle);
        addEffectToArea(state, enemy.area, laserBeam);
    },
    cooldown: 4000,
    prepTime: 0,
    recoverTime: 1000,
};

function setLaserBeamByTargetAndAngle(laserBeam: LaserBeam, target: ObjectInstance, theta: number) {
    const hitbox = target.getHitbox();
    const cx = hitbox.x + hitbox.w / 2;
    const cy = hitbox.y + hitbox.h / 2;
    const dx = Math.cos(theta), dy = Math.sin(theta);
    laserBeam.sx = cx + dx * hitbox.w / 2;
    laserBeam.sy = cy + dy * hitbox.h / 2;
    laserBeam.tx = laserBeam.sx + 1000 * dx;
    laserBeam.ty = laserBeam.sy + 1000 * dy;
}

function stickLaserBeamToTarget(laserBeam: LaserBeam, target: ObjectInstance, theta: number) {
    setLaserBeamByTargetAndAngle(laserBeam, target, theta);
    laserBeam.beforeUpdate = (state: GameState, laserBeam: LaserBeam) => {
        setLaserBeamByTargetAndAngle(laserBeam, target, theta);
    };
}
function rotateLaserBeamAroundTarget(laserBeam: LaserBeam, target: ObjectInstance, theta: number, thetaV: number) {
    setLaserBeamByTargetAndAngle(laserBeam, target, theta);
    laserBeam.beforeUpdate = (state: GameState, laserBeam: LaserBeam) => {
        theta += thetaV * FRAME_LENGTH / 1000;
        setLaserBeamByTargetAndAngle(laserBeam, target, theta);
    };
}

export const bossQuadStepLaserBeamAbility: EnemyAbility<number> = {
    getTarget(this: void, state: GameState, enemy: Enemy): number {
        const vector = getVectorToNearbyTarget(state, enemy, enemy.aggroRadius, enemy.area.allyTargets);
        if (!vector) {
            return;
        }
        return Math.atan2(vector.y, vector.x);
    },
    useAbility(this: void, state: GameState, enemy: Enemy, baseTheta: number): void {
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                const theta = baseTheta + i * Math.PI / 8 + j * Math.PI / 2;
                const laserBeam = new LaserBeam({
                    delay: 400 * i,
                    sx: 0, sy: 0, tx: 0, ty: 0,
                    radius: 12, damage: 4, duration: 200, tellDuration: 800,
                    source: enemy,
                    ignoreWalls: true,
                });
                stickLaserBeamToTarget(laserBeam, enemy, theta);
                addEffectToArea(state, enemy.area, laserBeam);
            }
        }
    },
    cooldown: 4000,
    prepTime: 0,
    recoverTime: 1000,
};

export const bossQuadRotatingLaserBeamAbility: EnemyAbility<number> = {
    getTarget(this: void, state: GameState, enemy: Enemy): number {
        const vector = getVectorToNearbyTarget(state, enemy, enemy.aggroRadius, enemy.area.allyTargets);
        if (!vector) {
            return;
        }
        return Math.atan2(vector.y, vector.x);
    },
    useAbility(this: void, state: GameState, enemy: Enemy, baseTheta: number): void {
        for (let j = 0; j < 4; j++) {
            const theta = baseTheta + j * Math.PI / 2;
            const laserBeam = new LaserBeam({
                sx: 0, sy: 0, tx: 0, ty: 0,
                radius: 12, damage: 4, duration: 4000, tellDuration: 1000,
                source: enemy,
                ignoreWalls: true,
            });
            rotateLaserBeamAroundTarget(laserBeam, enemy, theta, Math.PI / 4);
            addEffectToArea(state, enemy.area, laserBeam);
        }
    },
    cooldown: 4000,
    prepTime: 0,
    recoverTime: 1000,
};

export const bossLaserBeamBlenderbility: EnemyAbility<number> = {
    getTarget(this: void, state: GameState, enemy: Enemy): number {
        const vector = getVectorToNearbyTarget(state, enemy, enemy.aggroRadius, enemy.area.allyTargets);
        if (!vector) {
            return;
        }
        return Math.atan2(vector.y, vector.x);
    },
    useAbility(this: void, state: GameState, enemy: Enemy, baseTheta: number): void {
        const numLasers = 3;
        for (let j = 0; j < numLasers; j++) {
            for (const direction of [1, -1]) {
                const theta = baseTheta + j * 2 * Math.PI / numLasers + (direction === -1 ? Math.PI / numLasers: 0);
                const laserBeam = new LaserBeam({
                    sx: 0, sy: 0, tx: 0, ty: 0,
                    radius: 12, damage: 4, duration: 4000, tellDuration: 1000,
                    source: enemy,
                    ignoreWalls: true,
                });
                rotateLaserBeamAroundTarget(laserBeam, enemy, theta, direction * Math.PI / 4);
                addEffectToArea(state, enemy.area, laserBeam);
            }
        }
    },
    cooldown: 4000,
    prepTime: 0,
    recoverTime: 1000,
};
