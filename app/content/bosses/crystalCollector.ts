import { addParticleAnimations } from 'app/content/effects/animationEffect';
import { GroundSpike, addLineOfSpikes } from 'app/content/effects/groundSpike';
import { SpikePod } from 'app/content/effects/spikePod';
import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import { Enemy } from 'app/content/enemy';
import {
    crystalCollectorAnimations,
    crystalCollecterBackFrame,
    crystalCollectorEnragedAnimations,
    crystalBarrierSummonAnimation,
    crystalBarrierNormalAnimation,
    crystalBarrierDamagedAnimation,
    crystalBarrierVeryDamagedAnimation,
    crystalBarrierSmallParticles,
    crystalBarrierLargeParticles,
} from 'app/content/enemyAnimations';
import { WallTurret } from 'app/content/objects/wallTurret';
import { FRAME_LENGTH } from 'app/gameConstants';
import { drawFrame, getFrame, drawFrameCenteredAt } from 'app/utils/animations';
import { addEffectToArea } from 'app/utils/effects';
import { hitTargets } from 'app/utils/field';
import {getTileBehaviors} from 'app/utils/getBehaviors';
import { addObjectToArea } from 'app/utils/objects';
import Random from 'app/utils/Random';
import { getNearbyTarget } from 'app/utils/target';



const maxShieldLife = 6;


type NearbyTargetType = ReturnType<typeof getNearbyTarget>;

const crystalTurretAbility: EnemyAbility<NearbyTargetType> = {
    getTarget(this: void, state: GameState, enemy: Enemy): NearbyTargetType {
        return getNearbyTarget(state, enemy, enemy.aggroRadius, enemy.area.allyTargets);
    },
    prepareAbility(this: void, state: GameState, enemy: Enemy, target: NearbyTargetType) {
        enemy.changeToAnimation('attack');
    },
    useAbility(this: void, state: GameState, enemy: Enemy, target: NearbyTargetType): void {
        summonProjectiles(state, enemy, target);
    },
    cooldown: 8000,
    initialCharges: 0,
    charges: 1,
    chargesRecovered: 1,
    prepTime: 0,
    recoverTime: 1000,
};

function summonProjectiles(state: GameState, enemy: Enemy, target: EffectInstance | ObjectInstance) {
    if (!target) {
        return;
    }
    const { enrageLevel = 0 } = enemy.params;
    const arrowTurrets = enemy.area.objects.filter(o => o.definition?.type === 'turret') as WallTurret[];
    if (enrageLevel >= 2 && Math.random() < 0.5) {
        for (let i = arrowTurrets.length - 1; i >= 0; i--) {
            arrowTurrets[i].fireAfter(600 + (i % 4) * 600);
        }
    } else if (enrageLevel >= 1 && Math.random() < 0.5) {
        for (let i = 0; i < arrowTurrets.length; i++) {
            arrowTurrets[i].fireAfter((i % 4 <= 1) ? 600 : 1200);
        }
    } else {
        const targetHitbox = target.getHitbox();
        const x = targetHitbox.x + targetHitbox.w / 2;
        let delay = 600;
        const radius = 32 + 16 * enrageLevel
        let left = x - radius;
        let right = x + radius;
        // Arrows furthest towards the edges of the field start first, forcing the player
        // to the center. This avoids the edges either being traps or always having to
        // be safe from arrows.
        if ((left + right) / 2 > 256) {
            for (let i = arrowTurrets.length - 1; i >= 0; i--) {
                if (arrowTurrets[i].x + 8 <= right && arrowTurrets[i].x + 8 >= left) {
                    arrowTurrets[i].fireAfter(delay += 200);
                }
            }
        } else {
            for (let i = 0; i < arrowTurrets.length; i++) {
                if (arrowTurrets[i].x + 8 <= right && arrowTurrets[i].x + 8 >= left) {
                    arrowTurrets[i].fireAfter(delay += 200);
                }
            }
        }
    }
}

function getShieldHitbox(enemy: Enemy): Rect {
    const hitbox = enemy.getDefaultHitbox();
    const frame = crystalBarrierNormalAnimation.frames[0];
    const w = (frame.content?.w ?? frame.w) * enemy.scale;
    const h = (frame.content?.h ?? frame.h) * enemy.scale;
    return {
        // Shield is horizontally centered over the eye.
        x: hitbox.x + (hitbox.w - w) / 2,
        // Shield hitbox is 16px below the bottom of the eye hitbox.
        y: hitbox.y + (hitbox.h - h) + 16,
        w, h,
    };
}

enemyDefinitions.crystalCollector = {
    animations: crystalCollectorAnimations, life: 24, touchDamage: 0, update: updateCrystalCollector, params: {
        shieldLife: maxShieldLife,
        shieldTime: 0,
        shieldInvulnerableTime: 0,
        enrageLevel: 0,
        enrageTime: 0,
    },
    abilities: [crystalTurretAbility],
    invulnerableFrames: 20,
    hasShadow: false,
    initialAnimation: 'open',
    initialMode: 'initialMode',
    tileBehaviors: {solid: true},
    // Technically this should probably be rendered as part of the background layer, but we can do something similar
    // by setting the y depth very low.
    getYDepth(enemy: Enemy): number {
        return enemy.y - 16;
    },
    getHitbox(enemy: Enemy): Rect {
        if (enemy.mode === 'initialMode' || enemy.mode === 'sleeping') {
            return enemy.getDefaultHitbox();
        }
        if (enemy.params.shieldLife && enemy.params.shieldTime > 0) {
            return getShieldHitbox(enemy);
        }
        return enemy.getDefaultHitbox();
    },
    renderOver(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy): void {
        if (enemy.mode === 'initialMode' || enemy.mode === 'sleeping') {
            return;
        }
        if (enemy.params.shieldLife <= 0 || enemy.params.shieldTime <= 0) {
            return;
        }
        let frame: Frame;
        if (enemy.params.shieldTime < crystalBarrierSummonAnimation.duration) {
            frame = getFrame(crystalBarrierSummonAnimation, enemy.params.shieldTime);
        } else if (enemy.params.shieldLife === maxShieldLife) {
            frame = getFrame(crystalBarrierNormalAnimation, enemy.params.shieldTime);
        } else if (enemy.params.shieldLife > maxShieldLife / 3) {
            frame = getFrame(crystalBarrierDamagedAnimation, enemy.params.shieldTime);
        } else {
            frame = getFrame(crystalBarrierVeryDamagedAnimation, enemy.params.shieldTime);
        }
        const hitbox = enemy.getHitbox();
        drawFrameCenteredAt(context, frame, hitbox);
        /*context.save();
            context.globalAlpha *= (0.4 + 0.4 * enemy.params.shieldLife / maxShieldLife);
            context.fillStyle = 'white';
            context.fillRect(hitbox.x, hitbox.y, hitbox.w, hitbox.h);
        context.restore();*/
    },
    render(this: void, context: CanvasRenderingContext2D, state: GameState, enemy: Enemy): void {
        if (enemy.currentAnimationKey === 'hurt') {
            const frame = crystalCollecterBackFrame;
            drawFrame(context, frame, { ...frame,
                x: enemy.x - (frame.content?.x || 0) * enemy.scale,
                y: enemy.y - (frame.content?.y || 0) * enemy.scale - enemy.z,
                w: frame.w * enemy.scale,
                h: frame.h * enemy.scale,
            });
        }
        enemy.defaultRender(context, state);
    },
    onHit(state: GameState, enemy: Enemy, hit: HitProperties): HitResult {
        // Ignore hits while hidden.
        if (enemy.mode === 'initialMode' || enemy.mode === 'sleeping' || enemy.mode === 'opening') {
            return {};
        }

        const isPartiallyShielded = enemy.params.enrageTime > 0
            || enemy.params.shieldTime < crystalBarrierSummonAnimation.duration;

        // If the shield is up, only fire damage can hurt it.
        if (!isPartiallyShielded && enemy.params.shieldLife > 0) {
            if (hit.canDamageCrystalShields) {
                // Right now shield takes a flat 2 damage no matter the source except for the
                // Tower Staff which always destroys it.
                if (hit.isBonk && state.hero.savedData.activeTools.staff & 2) {
                    enemy.params.shieldLife = 0;
                    enemy.params.shieldInvulnerableTime = 200;
                } else if (enemy.params.shieldInvulnerableTime <= 0) {
                    enemy.params.shieldLife = Math.max(0, enemy.params.shieldLife - 2);
                    enemy.params.shieldInvulnerableTime = 200;
                } else {
                    return { hit: true };
                }
                enemy.makeSound(state, 'enemyHit');
                const hitbox = enemy.getHitbox();
                addParticleAnimations(state, enemy.area,
                    hitbox.x + hitbox.w / 2, hitbox.y + hitbox.h / 2, 16, crystalBarrierSmallParticles,
                    {numberParticles: 3}, 8);
                addParticleAnimations(state, enemy.area,
                    hitbox.x + hitbox.w / 2, hitbox.y + hitbox.h / 2, 16, crystalBarrierLargeParticles,
                    {numberParticles: 4}, 20);
                addParticleAnimations(state, enemy.area,
                    hitbox.x + hitbox.w / 2, hitbox.y + hitbox.h / 2, 16, crystalBarrierSmallParticles,
                    {numberParticles: 6}, 32);
                // This makes the boss invulnerable without showing the damaged frame (which only shows)
                // if this value is greater than 10.
                // This is just to not immediately hit the eye when the shield first breaks.
                enemy.enemyInvulnerableFrames = 10;
                return { hit: true };
            }
        }
        // Boss can be damaged when enraged, but takes much less damage
        if (isPartiallyShielded) {
            hit = {
                ...hit,
                damage: hit.damage / 5,
            }
        }
        // Use the default hit behavior, the attack will be blocked if the shield is still up.
        return enemy.defaultOnHit(state, hit);
    },
    getShieldPercent(state: GameState, enemy: Enemy) {
        // Don't render the shield graphic until it
        return (enemy.params.shieldTime < crystalBarrierSummonAnimation.duration)
            ? 0
            : enemy.params.shieldLife / maxShieldLife;
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
    //floorEye.showDeathAnimation(state);
}

function summonSpikeUnderPlayer(this: void, state: GameState, enemy: Enemy): void {
    const target = getNearbyTarget(state, enemy, 512, enemy.area.allyTargets);
    if (target) {
        const targetHitbox = target.getHitbox();
        const spike = new GroundSpike({
            x: targetHitbox.x + targetHitbox.w / 2,
            y: targetHitbox.y + targetHitbox.h / 2,
            damage: 4,
        });
        addEffectToArea(state, enemy.area, spike);
    }
}
function summonSpikeAheadOfPlayer(this: void, state: GameState, enemy: Enemy): void {
    const target = getNearbyTarget(state, enemy, 512, enemy.area.allyTargets) as Hero;
    if (target) {
        const targetHitbox = target.getHitbox();
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
        addEffectToArea(state, enemy.area, spike);
    }
}
const summonShrinkingRingOfSpikes = (state: GameState, enemy: Enemy) => {
    const target = getNearbyTarget(state, enemy, 512, enemy.area.allyTargets) as Hero;
    if (!target) {
        return;
    }
    const targetHitbox = target.getHitbox();
    const spikePattern = [
        [
            [0, -4], [4, 0], [0, 4], [-4, 0],
            [3, 2], [3, -2], [-3, 2], [-3, -2],
            [2, 3], [2, -3], [-2, 3], [-2, -3],
        ],
        [[0, -2], [2, 0], [0, 2], [-2, 0]],
        [],
        [],
        [],
        [[0, -1], [-1, 0],[1, 0], [0, 1]],
    ];
    for (let i = 0; i < spikePattern.length; i++) {
        for (const coords of spikePattern[i]) {
            const x = targetHitbox.x + targetHitbox.w / 2 + coords[0] * 16;
            const y = targetHitbox.y + targetHitbox.h / 2 + coords[1] * 16;
            const { tileBehavior } = getTileBehaviors(state, enemy.area, {x, y});
            if (tileBehavior?.solid || tileBehavior?.pit || tileBehavior?.pitMap) {
                continue;
            }
            const spike = new GroundSpike({
                x,
                y,
                damage: 4,
                delay: 260 * i,
            });
            addEffectToArea(state, enemy.area, spike);
        }
    }
};

const summonLineOfSpikes = (state: GameState, enemy: Enemy) => {
    const target = getNearbyTarget(state, enemy, 512, enemy.area.allyTargets) as Hero;
    if (!target) {
        return;
    }
    const hitbox = enemy.getHitbox();
    const targetHitbox = target.getHitbox();
    addLineOfSpikes({
        state, area: enemy.area,
        source: [hitbox.x + hitbox.w / 2, hitbox.y + hitbox.h / 2],
        target: [targetHitbox.x + targetHitbox.w / 2, targetHitbox.y + targetHitbox.h / 2],
    });
}

const turnOnRandomCascade = (state: GameState, enemy: Enemy, count = 1) => {
    const beadCascades = enemy.area.objects.filter(o => o.definition?.type === 'beadCascade') as BeadCascade[];
    let numberEnabled = 0;
    while (beadCascades.length) {
        const cascade = Random.removeElement(beadCascades);
        if (turnOnCascade(state, cascade)) {
            numberEnabled++;
            if (numberEnabled >= count) {
                return;
            }
        }
    }
};

function turnOnCascade(state: GameState, cascade: BeadCascade): boolean {
    // Initially the cascades are turned off by being hidden,
    // But after being turned on once they will be turned off
    // by having the `isOn` flag set to false.
    if (cascade.status !== 'normal') {
        cascade.onActivate(state);
        return true
    } else if (!cascade.isOn) {
        cascade.turnOn(state);
        return true;
    }
    return false;
}

function updateCrystalCollector(this: void, state: GameState, enemy: Enemy): void {
    const { enrageLevel } = enemy.params;
    if (enemy.params.shieldInvulnerableTime  > 0) {
        enemy.params.shieldInvulnerableTime -= FRAME_LENGTH;
    }

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
        enemy.animations = crystalCollectorEnragedAnimations;
        enemy.currentAnimation = enemy.animations[enemy.currentAnimationKey][enemy.d];
        enemy.params.enrageTime = 12000;
        enemy.params.enrageLevel = 2;
        // Burn damaged is reduced by 80% when entering rage phase.
        enemy.burnDamage *= 0.2;
    } else if (enemy.life <= 16 && enrageLevel === 0) {
        enemy.animations = crystalCollectorEnragedAnimations;
        enemy.currentAnimation = enemy.animations[enemy.currentAnimationKey][enemy.d];
        enemy.params.enrageTime = 8000;
        enemy.params.enrageLevel = 1;
        // Burn damaged is reduced by 80% when entering rage phase.
        enemy.burnDamage *= 0.2;
    }

    // Boss doesn't update for half of their iframes to make sure the damage animation isn't
    // entirely interrupted.
    if (enemy.enemyInvulnerableFrames > 10) {
        enemy.changeToAnimation('hurt');
        return;
    }

    // Don't show the attack animation for longer than one second unless enraged.
    if (enemy.currentAnimationKey === 'attack' && enemy.animationTime > 1000 && !(enemy.params.enrageTime > 0)) {
        enemy.changeToAnimation('idle');
    }
    // The crystal ability can be used at any point once the eye is open.
    if (enemy.mode !== 'initialMode' && enemy.mode !== 'sleeping') {
        enemy.useRandomAbility(state);
    }
    // The boss can only use one ability at a time unless it is enraged.
    if (enemy.activeAbility && !(enemy.params.enrageTime > 0)) {
        return;
    }

    if (enemy.params.shieldTime === 200) {
        hitTargets(state, enemy.area, {
            canAlwaysKnockback: true,
            canDamageRollingHero: true,
            damage: 1,
            hitAllies: true,
            hitTiles:true,
            cutsGround: true,
            hitbox: getShieldHitbox(enemy),
            knockback: {
                vx: 0, vy: 4, vz: 2
            }
        });
    }

    enemy.shielded = enemy.params.shieldLife > 0;
    // Enraged behavior
    if (enemy.params.enrageTime > 0) {
        // Start summoning the shield so it will finish activating at the end of the current rage phase.
        if (enemy.params.shieldLife <= 0 && enemy.params.enrageTime <= crystalBarrierSummonAnimation.duration) {
            enemy.params.shieldLife = maxShieldLife;
            enemy.params.shieldTime = 0;
        }
        enemy.params.shieldTime += FRAME_LENGTH;
        enemy.params.enrageTime -= FRAME_LENGTH;
        if (enemy.params.enrageTime <= 0) {
            enemy.changeToAnimation('idle');
            // Summon new floor eyes, once the enrage mode is over
            let [tx, ty] = Random.removeElement(enemy.params.eyeLocations as number[][]);
            addFloorEye(state, enemy.area, tx, ty);
            [tx, ty] = Random.removeElement(enemy.params.eyeLocations as number[][]);
            addFloorEye(state, enemy.area, tx, ty);
        } else if (enemy.params.enrageTime <= 3000) {
            enemy.changeToAnimation('confused');
            const beadCascades = enemy.area.objects.filter(o => o.definition?.type === 'beadCascade') as BeadCascade[];
            // Activate all bead cascades from left to right, one each 100ms, for 1000ms
            // This assumes the index of the cascades is in order of their left to right position.
            for (let i = 0; i < beadCascades.length; i++) {
                if (enemy.params.enrageTime === 3000 - 100 * i) {
                    turnOnCascade(state, beadCascades[i]);
                }
            }
        } else {
            const spikeCount = enemy.area.effects.filter(o => o instanceof GroundSpike).length;
            if (enemy.params.enrageTime % 300 === 0 && spikeCount < 5) {
                enemy.changeToAnimation('attack');
                if (Math.random() < 0.3) {
                    summonShrinkingRingOfSpikes(state, enemy);
                } else if(Math.random() < 0.6) {
                    summonLineOfSpikes(state, enemy);
                } else if (Math.random() < 0.5) {
                    summonSpikeUnderPlayer(state, enemy);
                } else {
                    summonSpikeAheadOfPlayer(state, enemy);
                }
            }
        }
        return;
    } else {
        enemy.animations = crystalCollectorAnimations;
    }


    // Bead Cascade control
    if (enemy.params.enrageLevel >= 2) {
        if (enemy.time % 4000 === 0) {
            turnOnRandomCascade(state, enemy);
        }
    } else if (enemy.params.enrageLevel >= 1) {
        if (enemy.time % 6000 === 0) {
            turnOnRandomCascade(state, enemy);
        }
    }

    // Normal behavior.
    if (enemy.mode === 'initialMode') {
        enemy.params.eyeLocations = [
            [9, 6],  [22, 6],
            [14, 8],  [17, 8],
            [9, 12], [22, 12]
        ];
        const [tx, ty] = Random.removeElement(enemy.params.eyeLocations as number[][]);
        addFloorEye(state, enemy.area, tx, ty);
        enemy.setMode('sleeping');
    } else if (enemy.mode === 'sleeping') {
        enemy.setAnimation('open', enemy.d);
        if (getFloorEye(state, enemy.area)) {
            // Suppress the healthbar until the eye opens.
            enemy.params.shieldTime = 0;
            enemy.healthBarTime = 0;
            return;
        }
        enemy.setMode('opening');
        return;
    } else if (enemy.mode === 'opening') {
        if (enemy.modeTime >= 1500) {
            enemy.setMode('choose');
        }
        return;
    }
    enemy.params.shieldTime += FRAME_LENGTH;
    if (enemy.mode === 'choose') {
        enemy.changeToAnimation('idle');
        if (enemy.params.shieldTime >= 2000 && enemy.modeTime >= 1000) {
            enemy.changeToAnimation('attack');
            // Only summon spike pods when shielded and if there are no floor eyes or pods present.
            if (!enemy.shielded
                || enemy.area.effects.find(o => o instanceof SpikePod)
                || getFloorEye(state, enemy.area)
            ) {
                if (enemy.params.enrageLevel > 0 && Math.random() < 0.5) {
                    turnOnRandomCascade(state, enemy, enemy.params.enrageLevel);
                }
                enemy.setMode('summonSpikes');
            } else {
                enemy.setMode('summonPod');
            }
        }
    } else if (enemy.mode === 'summonPod') {
        if (enemy.animationTime > 1000) {
            enemy.changeToAnimation('idle');
        }
        if (enemy.modeTime === 0 || (enemy.modeTime === 1000 && enrageLevel > 0)) {
            // Pod spawn location spreads out with enrage level.
            addEffectToArea(state, enemy.area, new SpikePod({
                x: enemy.x + enemy.w / 2 - (32 + 16 * enrageLevel) + Math.random() * (64 + 32 * enrageLevel),
                y: enemy.y + enemy.h + 48 + Math.random() * (16 + 16 * enrageLevel),
                damage: 2,
            }));
        }
        if (enemy.modeTime >= 1000) {
            enemy.setMode('choose');
        }
    } if (enemy.mode === 'summonSpikes') {
        if (enemy.animationTime > 1000) {
            enemy.changeToAnimation('idle');
        }
        // Define sets of easy/medium/hard patterns, then randomly choose a pattern based
        // on remaining health and attack with spikes in that pattern
        // enrage level 0: 3 in a row or a column
        // enrage level 1: An entire row or column, an expanding ring
        // enrage level 2: A full plus, leading the player in one of the dimensions if they are moving
        // A wave of 4 columns sweeping towards the middle of the battlefield
        const spikeCount = enemy.area.effects.filter(o => o instanceof GroundSpike).length;
        if (enemy.modeTime % 600 === 0 && spikeCount < 3) {
            // Don't do any complicated spike patterns while the floor eyes are still active.
            if (enrageLevel > 0 && !getFloorEye(state, enemy.area) && Math.random() < 0.3) {
                summonShrinkingRingOfSpikes(state, enemy);
            } else if (enrageLevel > 0 || Math.random() < 0.6) {
                summonLineOfSpikes(state, enemy);
            } else if (enrageLevel === 0 || Math.random() < 0.5) {
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



