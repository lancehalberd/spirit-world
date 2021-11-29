import { addObjectToArea } from 'app/content/areas';
import { GroundSpike } from 'app/content/effects/groundSpike';
import { SpikePod } from 'app/content/effects/spikePod';
import { getNearbyTarget } from 'app/content/enemies';
import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import { beetleAnimations } from 'app/content/enemyAnimations';
import { FRAME_LENGTH } from 'app/gameConstants';
import { playSound } from 'app/utils/sounds';
import Random from 'app/utils/Random';


import { AreaInstance, Enemy, GameState, Hero, HitProperties, HitResult } from 'app/types';

const maxShieldLife = 6;

enemyDefinitions.crystalCollector = {
    animations: beetleAnimations, life: 24, scale: 2, touchDamage: 0, update: updateCrystalCollector, params: {
        shieldLife: maxShieldLife,
        enrageLevel: 0,
        enrageTime: 0,
    },
    hasShadow: false,
    initialMode: 'initial',
    renderOver(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy): void {
        if (enemy.mode === 'initial' || enemy.mode === 'sleeping') {
            return;
        }
        if (enemy.params.shieldLife <= 0) {
            return;
        }
        const hitbox = enemy.getHitbox(state);
        context.save();
            context.globalAlpha *= (0.4 + 0.4 * enemy.params.shieldLife / maxShieldLife);
            context.fillStyle = 'white';
            context.fillRect(hitbox.x, hitbox.y, hitbox.w, hitbox.h);
        context.restore();
    },
    render(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy): void {
        if (enemy.mode === 'initial' || enemy.mode === 'sleeping') {
            return;
        }
        context.save();
            // Currently just fade in for the 'open eye' animation.
            if (enemy.mode === 'opening') {
                context.globalAlpha *= Math.min(1, enemy.modeTime / 1000);
            }
            enemy.defaultRender(context, state);
        context.restore();
    },
    onHit(state: GameState, enemy: Enemy, hit: HitProperties): HitResult {
        // Ignore hits while hidden.
        if (enemy.mode === 'initial' || enemy.mode === 'sleeping') {
            return {};
        }
        // If the shield is up, only fire damage can hurt it.
        if (enemy.params.shieldLife > 0) {
            if (hit.canDamageCrystalShields) {
                enemy.params.shieldLife = Math.max(0, enemy.params.shieldLife - hit.damage);
                playSound('enemyHit');
                return { hit: true };
            }
        }
        // Use the default hit behavior, the attack will be blocked if the shield is still up.
        return enemy.defaultOnHit(state, hit);
    },
    getShieldPercent(state: GameState, enemy: Enemy) {
        return enemy.params.shieldLife / maxShieldLife;
    }
};
function getFloorEye(this: void, state: GameState, area: AreaInstance): Enemy {
    return area.objects.find(target => target instanceof Enemy && target.definition.enemyType === 'floorEye') as Enemy;
}

function addFloorEye(state: GameState, area: AreaInstance, tx: number, ty: number): void {
    const floorEye = new Enemy(state, {
        type: 'enemy',
        id: 'floorEye' + Math.random(),
        status: 'normal',
        enemyType: 'floorEye',
        x: tx * 16,
        y: ty * 16,
    });
    addObjectToArea(state, area, floorEye);
}

function summonSpikeUnderPlayer(this: void, state: GameState, enemy: Enemy): void {
    const target = getNearbyTarget(state, enemy, 512, enemy.area.allyTargets);
    if (target) {
        const targetHitbox = target.getHitbox(state);
        const spike = new GroundSpike({
            x: targetHitbox.x + targetHitbox.w / 2,
            y: targetHitbox.y + targetHitbox.h / 2,
            damage: 4,
        });
        addObjectToArea(state, enemy.area, spike);
    }
}
function summonSpikeAheadOfPlayer(this: void, state: GameState, enemy: Enemy): void {
    const target = getNearbyTarget(state, enemy, 512, enemy.area.allyTargets) as Hero;
    if (target) {
        const targetHitbox = target.getHitbox(state);
        const spike = new GroundSpike({
            x: targetHitbox.x + targetHitbox.w / 2,
            y: targetHitbox.y + targetHitbox.h / 2,
            damage: 4,
        });
        if (target.vx < 0) {
            spike.x += Random.element([-16, -32]);
        }
        if (target.vx > 0) {
            spike.x += Random.element([16, 32]);
        }
        if (target.vy < 0) {
            spike.y += Random.element([-16, -32]);
        }
        if (target.vy < 0) {
            spike.y += Random.element([16, 32]);
        }
        addObjectToArea(state, enemy.area, spike);
    }
}

function updateCrystalCollector(this: void, state: GameState, enemy: Enemy): void {
    const { enrageLevel } = enemy.params;
    // Check if we should start an enraged phase
    // Enrage attacks are:
    // Alternating checkerboard
    // Moving columns (push player towards center of battle field)
    // Pinching columns (columns move in towards player, the last in the center is delayed to give time to escape)
    // Spreading columns (targets column player is in and then moves out in both directions)
    // Random square (many spikes appear in a 5x5 around the player)
    // Random chase spikes are added randomly where the player is or where they are moving towards
    // Enraged attacks have a duration + speed
    if (enemy.life <= 8 && enrageLevel === 1) {
        // Change these to choosing an array of attacks instead of a time.
        enemy.params.enrageTime = 12000;
        enemy.params.enrageLevel = 2;
        enemy.params.shieldLife = maxShieldLife;
    } else if (enemy.life <= 16 && enrageLevel === 0) {
        enemy.params.enrageTime = 8000;
        enemy.params.enrageLevel = 1;
        enemy.params.shieldLife = maxShieldLife;
    }
    enemy.shielded = enemy.params.shieldLife > 0;
    // Enraged behavior
    if (enemy.params.enrageTime > 0) {
        enemy.params.enrageTime -= FRAME_LENGTH;
        if (enemy.params.enrageTime <= 0) {
            // Summon new floor eyes, once the enrage mode is over
            let [tx, ty] = Random.removeElement(enemy.params.eyeLocations);
            addFloorEye(state, enemy.area, tx, ty);
            [tx, ty] = Random.removeElement(enemy.params.eyeLocations);
            addFloorEye(state, enemy.area, tx, ty);
        } else if (enemy.params.enrageTime <= 3000) {
            // Activate all bead cascades from left to right, one each 100ms, for 1000ms
            // This assumes the index of the cascades is in order of their left to right position.
            const beadCascades = enemy.area.objects.filter(o => o.definition?.type === 'beadCascade');
            for (let i = 0; i < beadCascades.length; i++) {
                if (enemy.params.enrageTime === 3000 - 100 * i) {
                    beadCascades[i].status = 'normal';
                } else if (enemy.params.enrageTime === 3000 - 100 * i - 1000) {
                    beadCascades[i].status = 'hidden';
                }
            }
        } else {
            if (enemy.params.enrageTime % 300 === 0) {
                if (Math.random() < 0.5) {
                    summonSpikeUnderPlayer(state, enemy);
                } else {
                    summonSpikeAheadOfPlayer(state, enemy);
                }
            }
            // Randomly choose "easier" patterns until they are all used, then randomly choose "hard" patterns.
        }
        return;
    }
    // Normal behavior.
    if (enemy.mode === 'initial') {
        enemy.healthBarTime = 0;
        enemy.params.eyeLocations = [
            [9, 6],  [22, 6],
            [14, 8],  [17, 8],
            [9, 12], [22, 12]
        ];
        const [tx, ty] = Random.removeElement(enemy.params.eyeLocations);
        addFloorEye(state, enemy.area, tx, ty);
        enemy.setMode('sleeping');
    } else if (enemy.mode === 'sleeping') {
        if (getFloorEye(state, enemy.area)) {
            // Suppress the healthbar until the eye opens.
            enemy.healthBarTime = 0;
            return;
        }
        enemy.setMode('opening');
    } else if (enemy.mode === 'opening') {
        if (enemy.modeTime >= 1000) {
            enemy.setMode('choose');
        }
    } else if (enemy.mode === 'choose') {
        if (enemy.modeTime >= 1000) {
            // Only summon spike pods when shielded and if there are no floor eyes or pods present.
            if (!enemy.shielded
                || enemy.area.objects.find(o => o instanceof SpikePod)
                || getFloorEye(state, enemy.area)
            ) {
                enemy.setMode('summonSpikes');
            } else {
                enemy.setMode('summonPod');
            }
        }
    } else if (enemy.mode === 'summonPod') {
        if ((enemy.modeTime === 0 && enrageLevel > 0)
            || enemy.modeTime === 1000
        ) {
            // Pod spawn location spreads out with enrage level.
            addObjectToArea(state, enemy.area, new SpikePod({
                x: enemy.x + enemy.w / 2 - (32 + 16 * enrageLevel) + Math.random() * (64 + 32 * enrageLevel),
                y: enemy.y + enemy.h + 48 + Math.random() * (16 + 16 * enrageLevel),
                damage: 2,
            }));
        }
        if (enemy.modeTime >= 1000) {
            enemy.setMode('choose');
        }
    } else if (enemy.mode === 'summonSpikes') {
        // Define sets of easy/medium/hard patterns, then randomly choose a pattern based
        // on remaining health and attack with spikes in that pattern
        // enrage level 0: 3 in a row or a column
        // enrage level 1: An entire row or column, an expanding ring
        // enrage level 2: A full plus, leading the player in one of the dimensions if they are moving
        // A wave of 4 columns sweeping towards the middle of the battlefield
        if (enemy.modeTime % 600 === 0) {
            if (enrageLevel === 0 || Math.random() < 0.5) {
                summonSpikeUnderPlayer(state, enemy);
            } else {
                summonSpikeAheadOfPlayer(state, enemy);
            }
        }
        if (enemy.modeTime >= 2000 + enrageLevel * 2000) {
            enemy.setMode('choose');
        }
    }
}



