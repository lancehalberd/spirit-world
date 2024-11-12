import { addSparkleAnimation } from 'app/content/effects/animationEffect';
import { Blast } from 'app/content/effects/blast';
import { Flame } from 'app/content/effects/flame';
import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import {
    squirrelAnimations,
    squirrelFlameAnimations,
    squirrelFrostAnimations,
    squirrelStormAnimations,
    superElectricSquirrelAnimations
} from 'app/content/enemyAnimations';
import { lifeLootTable } from 'app/content/lootTables';
import { directionMap, getCardinalDirection } from 'app/utils/direction';
import { addEffectToArea } from 'app/utils/effects';
import {
    moveEnemyFull,
} from 'app/utils/enemies';
import { getVectorToNearbyTarget } from 'app/utils/target'

interface SquirrelParams {
    element: MagicElement
    blastRadius?: number
}

function checkToSparkle(state: GameState, enemy: Enemy<SquirrelParams>, interval = 100){
    if (enemy.params.element && enemy.modeTime % interval === 0) {
        addSparkleAnimation(state, enemy.area, enemy.getHitbox(state), { element: enemy.params.element });
    }
}

function updateSquirrel(this: void, state: GameState, enemy: Enemy<SquirrelParams>) {
    if (enemy.activeAbility) {
        return;
    }
    enemy.isInvulnerable = (enemy.z > 4);
    enemy.touchHit = (enemy.z <= 0) ? enemy.enemyDefinition.touchHit : null;
    if (enemy.mode === 'pause') {
        checkToSparkle(state, enemy);
        enemy.changeToAnimation('idle');
        if (enemy.modeTime >= 1000) {
            enemy.setMode('chooseDirection');
        }
    } else if (enemy.mode === 'chooseDirection') {
        const theta = Math.floor(Math.random() * 4) * Math.PI / 2 + Math.PI / 4;
        enemy.vx = enemy.speed * Math.cos(theta);
        enemy.vy = enemy.speed * Math.sin(theta);
        enemy.d = getCardinalDirection(enemy.vx, enemy.vy);
        enemy.changeToAnimation('idle');
        enemy.setMode('run')
    } else if (enemy.mode === 'run') {
        // Revert theta back to 45 degree angle if it gets messed up from being knocked by a hit.
        const theta = (Math.round(Math.atan2(enemy.vy, enemy.vx) * 4 / 2 / Math.PI - 0.5) + 0.5) * Math.PI / 2;
        enemy.vx = enemy.speed * Math.cos(theta);
        enemy.vy = enemy.speed * Math.sin(theta);
        enemy.d = getCardinalDirection(enemy.vx, enemy.vy);
        checkToSparkle(state, enemy);
        enemy.changeToAnimation('move');
        // Pause sometime after moving for 4 seconds. Max time is theoretically 12s, but is likely much sooner.
        if (enemy.modeTime % 500 === 0 && Math.random() < (enemy.modeTime - 4000) / 8000) {
            enemy.setMode('pause');
            return;
        }
        enemy.useRandomAbility(state);
        if (enemy.activeAbility) {
            enemy.setMode('pause');
            return;
        }
        if (!moveEnemyFull(state, enemy, enemy.vx, 0, {canWiggle: false})) {
            enemy.vx = -enemy.vx;
        }
        if (!moveEnemyFull(state, enemy, 0, enemy.vy, {canWiggle: false})) {
            enemy.vy = -enemy.vy;
        }
        enemy.d = getCardinalDirection(enemy.vx, enemy.vy);
        //enemy.changeToAnimation('idle');
    } else if (enemy.mode === 'jumping') {
        enemy.changeToAnimation('climbing');
        checkToSparkle(state, enemy, 60);
        if (!moveEnemyFull(state, enemy, enemy.vx, 0, {})) {
            enemy.vx = -enemy.vx;
        }
        if (!moveEnemyFull(state, enemy, 0, enemy.vy, {})) {
            enemy.vy = -enemy.vy;
        }
        if (enemy.z <= 0) {
            enemy.z = 0;
            enemy.az = -0.5;
            enemy.setMode('recover');
        }
    } else if (enemy.mode === 'recover') {
        if (enemy.modeTime >= 500) {
            enemy.changeToAnimation('idle');
        }
        if (enemy.modeTime >= 1000) {
            enemy.setMode('chooseDirection');
        }
    }
}

const maxJumpSpeed = 5;
function jumpTowardsPoint(state: GameState, enemy: Enemy, {x: tx, y: ty}: Point, blastRadius = 32) {
    const enemyHitbox = enemy.getHitbox(state);
    const x = enemyHitbox.x + enemyHitbox.w / 2;
    const y = enemyHitbox.y + enemyHitbox.h / 2;
    enemy.vz = 3;
    enemy.az = -0.2;
    // This is in frames.
    const duration = -2 * enemy.vz / enemy.az;
    enemy.vx = (tx - x) / duration;
    enemy.vy = (ty - y) / duration;
    const mag = Math.sqrt(enemy.vx ** 2 + enemy.vy ** 2);
    if (mag > maxJumpSpeed) {
        enemy.vx = maxJumpSpeed * enemy.vx / mag;
        enemy.vy = maxJumpSpeed * enemy.vy / mag;
    }
    enemy.setMode('jumping');
    const blast = new Blast({
        x,
        y,
        damage: 2,
        element: enemy.params.element,
        tellDuration: 20 * duration,
        persistDuration: 200,
        radius: blastRadius,
        source: enemy,
    });
    addEffectToArea(state, enemy.area, blast);
}

const leaveFlameAbility: EnemyAbility<boolean> = {
    getTarget(this: void, state: GameState, enemy: Enemy): boolean {
        return true;
    },
    useAbility(this: void, state: GameState, enemy: Enemy, target: boolean): void {
        const hitbox = enemy.getHitbox(state);
        const flame = new Flame({
            x: hitbox.x + hitbox.w / 2,
            y: hitbox.y + hitbox.h / 2 - 1,
        });
        addEffectToArea(state, enemy.area, flame);
    },
    cooldown: 600,
    charges: 1,
};

const mediumBlastAbility: EnemyAbility<boolean> = {
    getTarget(this: void, state: GameState, enemy: Enemy): boolean {
        const tv = getVectorToNearbyTarget(state, enemy, enemy.aggroRadius, enemy.area.allyTargets);
        if (!tv) {
            return false;
        }
        // Only use this ability if the target is roughly in the direction the enemy is moving towards.
        const dv = directionMap[enemy.d];
        return (dv[0] * tv.x + dv[1] * tv.y) > 0
    },
    prepareAbility(this: void, state: GameState, enemy: Enemy) {
        // enemy.changeToAnimation('attack');
    },
    useAbility(this: void, state: GameState, enemy: Enemy<SquirrelParams>): void {
        const hitbox = enemy.getHitbox(state);
        const blast = new Blast({
            x: hitbox.x + hitbox.w / 2,
            y: hitbox.y + hitbox.h / 2,
            damage: 1,
            element: enemy.params.element,
            tellDuration: 800,
            persistDuration: 800,
            radius: 48,
            source: enemy,
        });
        //enemy.params.blast = blast;
        addEffectToArea(state, enemy.area, blast);
    },
    cooldown: 3000,
    initialCooldown: 2000,
    initialCharges: 0,
    charges: 1,
    chargesRecovered: 1,
    prepTime: 0,
    recoverTime: 0,
};

function jumpOnHit(state: GameState, enemy: Enemy<SquirrelParams>, hit: HitProperties): HitResult {
    // Cannot be hit while jumping.
    if (enemy.mode === 'jumping') {
        return {};
    }
    if (enemy.mode !== 'recover') {
        if (hit.source?.getHitbox) {
            // If the hit has a source, try jumping to it
            const hitbox = hit.source.getHitbox(state);
            jumpTowardsPoint(state, enemy, {x: hitbox.x + hitbox.w / 2, y: hitbox.y + hitbox.h / 2}, enemy.params.blastRadius);
        } else if (hit.knockback?.vx || hit.knockback?.vy) {
            // If the hit would knock the enemy back in a direction, jump in the opposite direction
            const enemyHitbox = enemy.getHitbox(state);
            const x = enemyHitbox.x + enemyHitbox.w / 2;
            const y = enemyHitbox.y + enemyHitbox.h / 2;
            jumpTowardsPoint(state, enemy, {x: x - 48 * (hit.knockback.vx || 0), y: y - 48 * (hit.knockback.vy || 0)}, enemy.params.blastRadius);
        } else {
            // Jumpin a random direction otherwise.
            const theta = 2 * Math.PI * Math.random();
            const enemyHitbox = enemy.getHitbox(state);
            const x = enemyHitbox.x + enemyHitbox.w / 2;
            const y = enemyHitbox.y + enemyHitbox.h / 2;
            jumpTowardsPoint(state, enemy, {x: x + 48 * Math.cos(theta), y: y + 48 * Math.sin(theta)}, enemy.params.blastRadius);
        }
        return {};
    }
    return enemy.defaultOnHit(state, hit);
}


enemyDefinitions.squirrel = {
    animations: squirrelAnimations,
    speed: 1.5,
    life: 2, touchHit: { damage: 1},
    lootTable: lifeLootTable,
    initialMode: 'pause',
    hybrids: {
        elementalFlame: 'squirrelFlame',
        elementalFrost: 'squirrelFrost',
        elementalStorm: 'squirrelStorm',
    },
    update: updateSquirrel,
};

enemyDefinitions.squirrelFlame = {
    animations: squirrelFlameAnimations,
    aggroRadius: 112,
    speed: 2.5,
    life: 5,
    abilities: [leaveFlameAbility],
    params: {
        element: 'fire',
    },
    touchHit: { damage: 2, element: 'fire'},
    baseMovementProperties: {canMoveInLava: true},
    immunities: ['fire'],
    lootTable: lifeLootTable,
    initialMode: 'pause',
    update: updateSquirrel,
};

enemyDefinitions.squirrelFrost = {
    animations: squirrelFrostAnimations,
    aggroRadius: 112,
    speed: 2,
    life: 6,
    abilities: [mediumBlastAbility],
    params: {
        element: 'ice',
    },
    touchHit: { damage: 2, element: 'ice'},
    immunities: ['ice'],
    lootTable: lifeLootTable,
    initialMode: 'pause',
    update: updateSquirrel,
};

enemyDefinitions.squirrelStorm = {
    animations: squirrelStormAnimations,
    acceleration: 0.2,
    aggroRadius: 112,
    speed: 3,
    life: 4, touchHit: { damage: 2, element: 'lightning'},
    immunities: ['lightning'],
    params: {
        element: 'lightning',
        blastRadius: 32,
    },
    lootTable: lifeLootTable,
    initialMode: 'pause',
    onHit: jumpOnHit,
    update: updateSquirrel,
};

enemyDefinitions.superSquirrel = {
    animations: superElectricSquirrelAnimations,
    acceleration: 0.2, aggroRadius: 112, speed: 2.5, scale: 2,
    life: 12, touchHit: { damage: 2, element: 'lightning'},
    immunities: ['lightning'],
    params: {
        element: 'lightning',
        blastRadius: 48,
    },
    lootTable: lifeLootTable,
    initialMode: 'pause',
    onHit: jumpOnHit,
    update(this: void, state: GameState, enemy: Enemy) {
        if (enemy.area !== state.hero.area) {
            enemy.healthBarTime = 0;
            enemy.setMode('hidden');
            return;
        }
        updateSquirrel(state, enemy);
    }
};
