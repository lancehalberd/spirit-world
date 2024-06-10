import { flameHeartAnimations } from 'app/content/bosses/flameBeast';
import { frostHeartAnimations, shootFrostInCone } from 'app/content/bosses/frostBeast';
import { addSlamEffect, golemHandAnimations, golemHandHurtAnimations } from 'app/content/bosses/golem';
import { stormHeartAnimations } from 'app/content/bosses/stormBeast';
import { FlameWall } from 'app/content/effects/flameWall';
import { LaserBeam } from 'app/content/effects/laserBeam';
import { LightningDischarge } from 'app/content/effects/lightningDischarge';
import { addArcOfShockWaves, addRadialShockWaves } from 'app/content/effects/shockWave';
import { addRadialSparks } from 'app/content/effects/spark';
import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import { Enemy } from 'app/content/enemy';
import { iceGrenadeAbility } from 'app/content/enemyAbilities/iceGrenade';
import { lightningBoltAbility } from 'app/content/enemyAbilities/lightningBolt';
import { certainLifeLootTable } from 'app/content/lootTables';
import { FRAME_LENGTH } from 'app/gameConstants';
import { createAnimation, drawFrame, getFrame } from 'app/utils/animations';
import { createCanvasAndContext } from 'app/utils/canvas';
import { rotateDirection } from 'app/utils/direction';
import { addEffectToArea } from 'app/utils/effects'
import {
    accelerateInDirection,
    moveEnemy,
    moveEnemyToTargetLocation,
} from 'app/utils/enemies';
import { addScreenShake, isTargetHit } from 'app/utils/field';
import { allImagesLoaded } from 'app/utils/images';
import { addObjectToArea, saveObjectStatus } from 'app/utils/objects'
import Random from 'app/utils/Random';
import {
    getNearbyTarget,
    getVectorToNearbyTarget,
} from 'app/utils/target';



const stoneGeometry = {w: 20, h: 20, content: {x: 4, y: 10, w: 12, h: 8}};
export const [neutralElement] = createAnimation('gfx/hud/elementhud.png', stoneGeometry, {x: 4}).frames;
const [stoneHeartCanvas, stoneHeartContext] = createCanvasAndContext(neutralElement.w * 4, neutralElement.h * 2);
const createStoneAnimation = async () => {
    await allImagesLoaded();
    drawFrame(stoneHeartContext, neutralElement, {x: 0, y: 0, w: neutralElement.w * 2, h: neutralElement.h * 2});
    stoneHeartContext.save();
        stoneHeartContext.translate((neutralElement.w + neutralElement.content.x + neutralElement.content.w / 2) * 2, 0);
        stoneHeartContext.scale(-1, 1);
        drawFrame(stoneHeartContext, neutralElement, {
            x: 2* (-neutralElement.content.w / 2 - neutralElement.content.x), y: 0,
            w: neutralElement.w * 2, h: neutralElement.h * 2
        });
    stoneHeartContext.restore();
    drawFrame(stoneHeartContext, neutralElement, {...neutralElement, x: 0, y: 2});
    drawFrame(stoneHeartContext, neutralElement, {...neutralElement, x: neutralElement.w, y: 0});
    drawFrame(stoneHeartContext, neutralElement, {...neutralElement, x: 2 * neutralElement.w, y: 0});
    drawFrame(stoneHeartContext, neutralElement, {...neutralElement, x: 3 * neutralElement.w, y: 2});
}
createStoneAnimation();
const stoneHeartAnimation = createAnimation(stoneHeartCanvas, {w: 40, h: 40, content: {x: 8, y: 20, w: 24, h: 16}}, {cols: 2});

export const stoneHeartAnimations = {
    idle: {
        up: stoneHeartAnimation,
        down: stoneHeartAnimation,
        left: stoneHeartAnimation,
        right: stoneHeartAnimation,
    },
};


const treeAnimation = createAnimation('gfx/tiles/knobbytrees.png', {w: 96, h: 64, content: {x: 24, y: 24, w: 48, h: 40}}, {left: 64});
const treeAnimations = {
    idle: {
        up: treeAnimation,
        down: treeAnimation,
        left: treeAnimation,
        right: treeAnimation,
    },
};

type NearbyTargetType = ReturnType<typeof getVectorToNearbyTarget>;

const giantLaserAbility: EnemyAbility<NearbyTargetType> = {
    getTarget(this: void, state: GameState, enemy: Enemy): NearbyTargetType {
        return getVectorToNearbyTarget(state, enemy, enemy.aggroRadius, enemy.area.allyTargets);
    },
    prepareAbility(this: void, state: GameState, enemy: Enemy, target: NearbyTargetType) {
        enemy.changeToAnimation('attack');
    },
    useAbility(this: void, state: GameState, enemy: Enemy, target: NearbyTargetType): void {
        const hitbox = target.target.getHitbox();
        const x = hitbox.x + hitbox.w / 2;
        const laser = new LaserBeam({
            sx: x, sy: 0, tx:x, ty: 512,
            radius: 20, damage: 8,
            ignoreWalls: true,
            tellDuration: 1500,
            duration: 2000,
        });
        addEffectToArea(state, enemy.area, laser);
    },
    cooldown: 8000,
    initialCharges: 0,
    charges: 1,
    chargesRecovered: 1,
    prepTime: 400,
    recoverTime: 400,
};

const LASER_BARRAGE_RADIUS = 16;
const LASER_SPOTS = [0, 1, 2, 3]

function addLaserBarrageToArea(state: GameState, count: number) {
    let spots = [];
    for (let i = 0; i < count; i++) {
        if (!spots.length) {
            spots = Random.shuffle(LASER_SPOTS);
        }
        const subX = 2 * LASER_BARRAGE_RADIUS * spots.pop();
        for (let x = LASER_BARRAGE_RADIUS; x <= 512; x += 2 * LASER_BARRAGE_RADIUS * LASER_SPOTS.length) {
            const sx = x + subX;
            const laser = new LaserBeam({
                sx, sy: 0, tx: sx, ty: 512,
                radius: LASER_BARRAGE_RADIUS, damage: 4,
                ignoreWalls: true,
                tellDuration: 600,
                duration: 600,
                delay: 500 * i,
            });
            addEffectToArea(state, state.hero.area, laser);
        }
    }
}

function addLaserWarningToArea(state: GameState) {
    for (let x = LASER_BARRAGE_RADIUS; x <= 512; x += 2 * LASER_BARRAGE_RADIUS) {
        const laser = new LaserBeam({
            sx: x, sy: 0, tx:x, ty: 512,
            radius: LASER_BARRAGE_RADIUS, damage: 0,
            ignoreWalls: true,
            tellDuration: 300,
            duration: 0,
            delay: x,
        });
        addEffectToArea(state, state.hero.area, laser);
    }
}

const voidTreeIceGrenadeAbility: EnemyAbility<NearbyTargetType> = {
    ...iceGrenadeAbility,
    cooldown: 4000,
    initialCharges: 0,
    charges: 3,
    chargesRecovered: 3,
    prepTime: 400,
    recoverTime: 400,
};

const flameWallAbility: EnemyAbility<NearbyTargetType> = {
    getTarget(this: void, state: GameState, enemy: Enemy): NearbyTargetType {
        return getVectorToNearbyTarget(state, enemy, enemy.aggroRadius, enemy.area.allyTargets);
    },
    prepareAbility(this: void, state: GameState, enemy: Enemy, target: NearbyTargetType) {
        enemy.changeToAnimation('attack');
    },
    useAbility(this: void, state: GameState, enemy: Enemy, target: NearbyTargetType): void {
        enemy.params.flameWallRotation = (enemy.params.flameWallRotation ?? Math.floor(Math.random() * 3)) + 1;
        const flameWall = new FlameWall({
            direction: rotateDirection('down', enemy.params.flameWallRotation),
        });
        addEffectToArea(state, enemy.area, flameWall);
    },
    cooldown: 5000,
    initialCharges: 0,
    charges: 2,
    chargesRecovered: 2,
    prepTime: 0,
    recoverTime: 1000,
};

const summonVoidHandAbility: EnemyAbility<NearbyTargetType> = {
    getTarget(this: void, state: GameState, enemy: Enemy): NearbyTargetType {
        if (enemy.area.enemies.filter(enemy => enemy.definition.enemyType === 'voidHand').length >= 2) {
            return null;
        }
        return getVectorToNearbyTarget(state, enemy, enemy.aggroRadius, enemy.area.allyTargets);
    },
    prepareAbility(this: void, state: GameState, enemy: Enemy, target: NearbyTargetType) {
        enemy.changeToAnimation('attack');
    },
    useAbility(this: void, state: GameState, enemy: Enemy, target: NearbyTargetType): void {
        const hitbox = enemy.getHitbox();
        const hand = new Enemy(state, {
            type: 'enemy',
            id: '' + Math.random(),
            status: 'normal',
            enemyType: 'voidHand',
            x: hitbox.x + hitbox.w / 2,
            y: hitbox.y + hitbox.h - 16,
        });
        hand.setMode('appearing');
        hand.params.side = 'none';
        addObjectToArea(state, enemy.area, hand);
    },
    cooldown: 15000,
    initialCharges: 0,
    charges: 1,
    chargesRecovered: 1,
    prepTime: 0,
    recoverTime: 1000,
};

const dischargeAbility: EnemyAbility<NearbyTargetType> = {
    getTarget(this: void, state: GameState, enemy: Enemy): NearbyTargetType {
        return getVectorToNearbyTarget(state, enemy, enemy.aggroRadius, enemy.area.allyTargets);
    },
    prepareAbility(this: void, state: GameState, enemy: Enemy, target: NearbyTargetType) {
        enemy.changeToAnimation('attack');
    },
    useAbility(this: void, state: GameState, enemy: Enemy, target: NearbyTargetType): void {
        const hitbox = enemy.getHitbox(state);
        const discharge = new LightningDischarge({
            x: hitbox.x + hitbox.w / 2,
            y: hitbox.y + hitbox.h / 2,
            damage: 4,
            tellDuration: 3000,
            radius: 128,
            source: enemy,
        });
        addEffectToArea(state, enemy.area, discharge);
    },
    cooldown: 4000,
    initialCharges: 0,
    charges: 1,
    chargesRecovered: 1,
    prepTime: 0,
    recoverTime: 1000,
}

function useSpinningSparkAttack(state: GameState, enemy: Enemy): void {
    if (enemy.modeTime % 400 === 0) {
        enemy.params.sparkTheta = (enemy.params.sparkTheta || 0) + Math.PI / 24;
        const hitbox = enemy.getHitbox();
        addRadialSparks(state, enemy.area, [hitbox.x + hitbox.w / 2, hitbox.y + hitbox.h / 2], 3, enemy.params.sparkTheta, 3, {damage: 4});
    }
}

function useSpinningFrostAttack(state: GameState, enemy: Enemy): void {
    const frostTime = enemy.modeTime % 10000;
    if (frostTime < 6000) {
        if (frostTime % 40 === 0) {
            enemy.params.frostTheta = (enemy.params.frostTheta || 0) + Math.PI / 64;
            // Track a nearby target when using the frostBreathArc attack, otherwise attack in the same direction.
            shootFrostInCone(state, enemy, enemy.params.frostTheta, 2, Math.min(4, frostTime / 500), false);
        }
    }
}

enemyDefinitions.voidStone = {
    animations: stoneHeartAnimations, life: 64, scale: 2, touchDamage: 4, update: updateVoidHeart,
    showHealthBar: true, isImmortal: true,
    canBeKnockedBack: false,
    aggroRadius: 144,
    immunities: [null],
    abilities: [giantLaserAbility, summonVoidHandAbility],
};

enemyDefinitions.voidFlame = {
    animations: flameHeartAnimations, life: 64, scale: 2, touchDamage: 4, update: updateVoidHeart,
    showHealthBar: true, isImmortal: true,
    canBeKnockedBack: false,
    aggroRadius: 144,
    abilities: [flameWallAbility],
    immunities: ['fire'],
    elementalMultipliers: {'ice': 2, 'lightning': 1.5},
};

enemyDefinitions.voidFrost = {
    animations: frostHeartAnimations, life: 64, scale: 2, touchDamage: 4, update: updateVoidHeart,
    showHealthBar: true, isImmortal: true,
    canBeKnockedBack: false,
    aggroRadius: 144,
    abilities: [voidTreeIceGrenadeAbility],
    immunities: ['ice'],
    elementalMultipliers: {'fire': 2, 'lightning': 1.5},
};

enemyDefinitions.voidStorm = {
    animations: stormHeartAnimations, life: 64, scale: 2, touchDamage: 4, update: updateVoidHeart,
    showHealthBar: true, isImmortal: true,
    canBeKnockedBack: false,
    aggroRadius: 144,
    abilities: [lightningBoltAbility],
    immunities: ['lightning'],
    elementalMultipliers: {'ice': 1.5, 'fire': 1.5},
};

function updateVoidHeart(this: void, state: GameState, enemy: Enemy): void {
    enemy.useRandomAbility(state);
    if (enemy.definition.enemyType === 'voidStorm') {
        useSpinningSparkAttack(state, enemy);
    }
    if (enemy.definition.enemyType === 'voidFrost') {
        useSpinningFrostAttack(state, enemy);
    }
}

enemyDefinitions.voidTree = {
    animations: treeAnimations, life: 128, scale: 2, touchDamage: 4, update: updateVoidTree,
    aggroRadius: 256,
    abilities: [
        summonVoidHandAbility, giantLaserAbility,
        flameWallAbility,
        voidTreeIceGrenadeAbility,
        dischargeAbility, lightningBoltAbility,
    ],
    // void tree is immune to all damage types until one of the hearts is destroyed.
    immunities: ['ice', 'fire', 'lightning', null],
    params: {
        enrageLevel: 0,
        enrageTime: 0,
    },
};

function chooseNewHeart(state: GameState, enemy: Enemy, fastRefresh = false) {
    if (!enemy.params.allHearts) {
        enemy.params.allHearts = ['voidStone', 'voidFlame', 'voidFrost', 'voidStorm'];
        enemy.params.chosenHearts = [];
    }
    if (!enemy.params.allHearts.length) {
        return;
    }
    enemy.params.chosenHearts.push(Random.removeElement(enemy.params.allHearts));
    for (const missingHeart of enemy.params.allHearts) {
        state.savedState.objectFlags[missingHeart] = true;
    }
    for (const activeHeart of enemy.params.chosenHearts) {
        delete state.savedState.objectFlags[activeHeart];
    }
    state.areaInstance.needsLogicRefresh = true;
}

function updateVoidTree(this: void, state: GameState, enemy: Enemy): void {
    if (!enemy.params.allHearts) {
        // console.log('void tree resetting');
        chooseNewHeart(state, enemy, true);
    }
    if (enemy.params.enrageTime > 0) {
        if (enemy.modeTime === 2000) {
            addLaserBarrageToArea(state, enemy.params.enrageLevel * 10);
        }
        enemy.params.enrageTime -= FRAME_LENGTH;
        enemy.enemyInvulnerableFrames = 20;
        enemy.invulnerableFrames = 20;
        // Choose a new heart at the end of each enrage phase.
        if (enemy.params.enrageTime <= 0) {
            chooseNewHeart(state, enemy, true);
        }
        // Teleporters are hidden during rage phase, otherwise the player can
        // just hide in the spirit world.
        for (const object of enemy.area.objects) {
            if (object.definition?.type === 'teleporter') {
                object.status = 'hidden';
            }
        }
        return;
    }
    const maxLife = enemy.enemyDefinition.life;
    if (enemy.life <= 0.75 * maxLife && enemy.params.enrageLevel === 0) {
        enemy.params.enrageLevel = 1;
        enemy.params.enrageTime = 7000;
        // Burn damaged is reduced by 80% when entering rage phase.
        enemy.burnDamage *= 0.2;
        enemy.modeTime = 0;
        addLaserWarningToArea(state);
    } else if (enemy.life <= 0.5 * maxLife && enemy.params.enrageLevel === 1) {
        enemy.params.enrageLevel = 2;
        enemy.params.enrageTime = 12000;
        // Burn damaged is reduced by 80% when entering rage phase.
        enemy.burnDamage *= 0.2;
        enemy.modeTime = 0;
        addLaserWarningToArea(state);
    } else if (enemy.life <= 0.25 * maxLife && enemy.params.enrageLevel === 2) {
        enemy.params.enrageLevel = 3;
        enemy.params.enrageTime = 17000;
        // Burn damaged is reduced by 80% when entering rage phase.
        enemy.burnDamage *= 0.2;
        enemy.modeTime = 0;
        addLaserWarningToArea(state);
    }
    enemy.enemyDefinition.immunities = [];
    let hasFlame = false, hasFrost = false, hasStone = false, hasStorm = false, heartCount = 0;
    // The area is not automatically updated when non-bosses are defeated,
    // so the tree explicitly watches if any of the void hearts are defeated and refreshes
    // the area when their death animation completes.
    // To make sure the hearts are not removed before this can happen, they are marked as immortal
    // and rely on the tree to trigger their death animations when they reach 0 life.
    for (const object of enemy.area.alternateArea.objects) {
        if (object.definition?.type === 'enemy') {
            const otherEnemy = object as Enemy;
            if (otherEnemy.life <= 0 && !otherEnemy.isDefeated) {
                otherEnemy.showDeathAnimation(state);
                saveObjectStatus(state, otherEnemy.definition);
                state.areaInstance.needsLogicRefresh = true;
            } else {
                if (otherEnemy.definition.enemyType === 'voidStone') {
                    hasStone = true;
                    heartCount++;
                }
                if (otherEnemy.definition.enemyType === 'voidFlame') {
                    hasFlame = true;
                    heartCount++;
                }
                if (otherEnemy.definition.enemyType === 'voidFrost') {
                    hasFrost = true;
                    heartCount++;
                }
                if (otherEnemy.definition.enemyType === 'voidStorm') {
                    hasStorm = true;
                    heartCount++;
                }
            }
        }
    }
    // Teleporters are removed to prevent accessing the final heart.
    for (const object of enemy.area.objects) {
        if (object.definition?.type === 'teleporter') {
            object.status = (heartCount <= 1) ? 'hidden' : 'normal';
        }
    }
    // Disable abilities associated with each void heart by overriding the stored charges on them.
    if (hasStone) {
        enemy.enemyDefinition.immunities.push(null);
    } else {
        enemy.getAbility(giantLaserAbility).charges = 0;
        enemy.getAbility(summonVoidHandAbility).charges = 0;
    }
    if (hasFlame) {
        enemy.enemyDefinition.immunities.push('fire');
    } else {
        enemy.getAbility(flameWallAbility).charges = 0;
    }
    if (hasFrost) {
        enemy.enemyDefinition.immunities.push('ice');
        useSpinningFrostAttack(state, enemy);
    } else {
        enemy.getAbility(voidTreeIceGrenadeAbility).charges = 0;
    }
    if (hasStorm) {
        enemy.enemyDefinition.immunities.push('lightning');
        useSpinningSparkAttack(state, enemy);
    } else {
        enemy.getAbility(lightningBoltAbility).charges = 0;
        enemy.getAbility(dischargeAbility).charges = 0;
    }

    enemy.useRandomAbility(state);
}

enemyDefinitions.voidHand = {
    animations: golemHandAnimations, life: 10, scale: 1, update: updateVoidHand,
    floating: true,
    flipRight: true,
    canBeKnockedBack: false, canBeKnockedDown: false,
    acceleration: 0.3, speed: 4,
    touchHit: { damage: 4},
    immunities: ['fire', 'ice'],
    elementalMultipliers: {'lightning': 2},
    initialAnimation: 'idle',
    initialMode: 'return',
    lootTable: certainLifeLootTable,
    params: {
        enrageLevel: 0,
        side: 'none',
    },
    onHit(state: GameState, enemy: Enemy, hit: HitProperties): HitResult {
        if (enemy.isInvulnerable || enemy.enemyInvulnerableFrames) {
            return {};
        }
        // Thrown objects can hurt the hands as if they were ordinary enemies.
        if (hit.isThrownObject) {
            return enemy.defaultOnHit(state, hit);
        }
        let hitJewel = false, hitHand = false;
        const hitbox = enemy.getHitbox(state);
        if (enemy.currentAnimationKey === 'slamming') {
            // The hand cannot be hit during the slamming animation.
            const jewelX = 11;
            const jewelHitbox = {
                x: hitbox.x + jewelX,
                y: hitbox.y + 11,
                w: 13,
                h: 9,
            };
            if (enemy.d === 'right') {
                jewelHitbox.x = hitbox.x + (32 - jewelX - jewelHitbox.w);
            }
            hitJewel = isTargetHit(jewelHitbox, hit);
        } else if (enemy.currentAnimationKey === 'returning') {
            // The hand cannot be hit during the returning animation.
            const jewelX = 14;
            const jewelHitbox = {
                x: hitbox.x + jewelX,
                y: hitbox.y + 7,
                w: 12,
                h: 11,
            };
            if (enemy.d === 'right') {
                jewelHitbox.x = hitbox.x + (32 - jewelX - jewelHitbox.w);
            }
            hitJewel = isTargetHit(jewelHitbox, hit);
        } else if (enemy.currentAnimationKey === 'punching') {
            const fistX = 1;
            const fistHitbox = {
                x: hitbox.x + fistX,
                y: hitbox.y + 12,
                w: 24,
                h: 34,
            };
            if (enemy.d === 'right') {
                fistHitbox.x = hitbox.x + (32 - fistX - fistHitbox.w);
            }
            hitHand = isTargetHit(fistHitbox, hit);
            const jewelX = 28;
            const jewelHitbox = {
                x: hitbox.x + jewelX,
                y: hitbox.y + 12,
                w: 6,
                h: 13,
            };
            if (enemy.d === 'right') {
                jewelHitbox.x = hitbox.x + (32 - jewelX - jewelHitbox.w);
            }
            hitJewel = isTargetHit(jewelHitbox, hit);
        } else {
            hitHand = true;
        }
        // Hands take reduced damage unless they are stunned.
        if (hitJewel) {
            return enemy.defaultOnHit(state, hit);
        }
        if (hitHand) {
            enemy.makeSound(state, 'blockAttack');
            return { hit: true, blocked: true, stopped: true };
        }
        // This is the case if the hand is too high for the hit to effect in the current frame.
        return {};
    },
    render(this: void, context: CanvasRenderingContext2D, state: GameState, enemy: Enemy) {
        if (enemy.mode === 'appearing') {
            const frame = enemy.getFrame();
            const h = Math.floor(frame.h * enemy.modeTime / 1000);
            if (enemy.d === 'right' && enemy.enemyDefinition.flipRight) {
                // Flip the frame when facing right. We may need an additional flag for this behavior
                // if we don't do it for all enemies on the right frames.
                const w = frame.content?.w ?? frame.w;
                context.save();
                    context.translate((enemy.x | 0) + (w / 2) * enemy.scale, 0);
                    context.scale(-1, 1);
                    drawFrame(context, {...frame, h}, { ...frame,
                        x: - (w / 2 + frame.content?.x || 0) * enemy.scale,
                        y: enemy.y - (frame?.content?.y || 0) * enemy.scale - enemy.z + (frame.h - h) * enemy.scale,
                        w: frame.w * enemy.scale,
                        h: h * enemy.scale,
                    });
                context.restore();
            } else {
                drawFrame(context, {...frame, h}, { ...frame,
                    x: enemy.x - (frame?.content?.x || 0) * enemy.scale,
                    y: enemy.y - (frame?.content?.y || 0) * enemy.scale - enemy.z + (frame.h - h) * enemy.scale,
                    w: frame.w * enemy.scale,
                    h: h * enemy.scale,
                });
            }
        } else {
            enemy.defaultRender(context, state);
        }
    },
    renderOver(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy): void {
        // When the hand is hurt, we draw the corresponding hurt frame on top of it
        // which will show the gem as cracked to signify the gem is what takes damage.
        if (enemy.enemyInvulnerableFrames) {
            // This only works if golemHandHurtAnimations parallels the `golemHandAnimations`
            // that the base golem hand uses to render.
            const animation = golemHandHurtAnimations[enemy.currentAnimationKey][enemy.d];
            const frame = getFrame(animation, enemy.animationTime);
            enemy.defaultRender(context, state, frame);
        }
    }
};

function moveHandNorthOfTarget(this: void, state: GameState, enemy: Enemy) {
    const target = getNearbyTarget(state, enemy, 1000, enemy.area.allyTargets);
    if (target) {
        const targetHitbox = target.getHitbox(state);
        const x = targetHitbox.x + targetHitbox.w / 2;
        const y = Math.max(32, targetHitbox.y - 96);
        moveEnemyToTargetLocation(state, enemy, x, y);
    }
}

function updateVoidHand(this: void, state: GameState, enemy: Enemy): void {
    const hitbox = enemy.getHitbox(state);
    // If the hand doesn't have a side yet, assign one based on its relative position to the golem.
    if (enemy.params.side === 'none') {
        enemy.params.side = Math.random() < 0.5 ? 'right' : 'left';
    }
    // The thumb is on the left and should face towards the middle so the hand on
    // the left side of the face (in global coordinates) needs to be reflected, which means
    // we need it to face 'right' because the 'right' frame is reflected by the engine.
    enemy.d = enemy.params.side === 'left' ? 'right' : 'left';

    // Prevent interacting with the hand when it is too high
    enemy.isInvulnerable = (enemy.z > 20);
    enemy.touchHit = (enemy.z <= 20 && enemy.mode !== 'targetedSlam' && enemy.mode !== 'appearing')
        ? enemy.enemyDefinition.touchHit : null;

    if (enemy.mode === 'appearing') {
        enemy.changeToAnimation('idle');
        if (enemy.z < 10) {
            enemy.z++;
        }
        if (enemy.modeTime >= 1000) {
            enemy.setMode('choose');
        }
    } else if (enemy.mode === 'choose') {
        enemy.changeToAnimation('idle');
        if (enemy.z < 10) {
            enemy.z++;
        }

        if (enemy.modeTime > 1000) {
            const target = getNearbyTarget(state, enemy, 1000, enemy.area.allyTargets);
            if (!target || Math.random() < 0.6) {
                enemy.setMode('raiseHand');
            } else if (Math.random() < 0.5) {
                enemy.setMode('hoverOverTarget');
            } else {
                enemy.setMode('followTarget');
            }
        }
    } else if (enemy.mode === 'followTarget') {
        enemy.changeToAnimation('punching');
        if (enemy.z > 5) {
            enemy.z--;
        }
        if (enemy.modeTime < 1000) {
            moveHandNorthOfTarget(state, enemy);
        }
        if (enemy.modeTime >= 1300) {
            enemy.setMode('punch');
        }
    } else if (enemy.mode === 'hoverOverTarget') {
        enemy.changeToAnimation('preparing');
        if (enemy.z < 40) {
            enemy.z++;
        }
        const target = getNearbyTarget(state, enemy, 1000, enemy.area.allyTargets);
        if (target && enemy.modeTime < 1000) {
            const targetHitbox = target.getHitbox(state);
            const x = targetHitbox.x + targetHitbox.w / 2;
            const y = targetHitbox.y + targetHitbox.h / 2;
            moveEnemyToTargetLocation(state, enemy, x, y);
        }
        if (enemy.modeTime >= 1300) {
            enemy.setMode('targetedSlam');
        }
    } else if (enemy.mode === 'return') {
        enemy.changeToAnimation('returning');
        moveHandNorthOfTarget(state, enemy);
        if (enemy.z < 10) {
            enemy.z++;
        } else {
            enemy.setMode('choose');
        }
    } else if (enemy.mode === 'raiseHand') {
        enemy.changeToAnimation('preparing');
        moveHandNorthOfTarget(state, enemy);
        if (enemy.z < 20) {
            enemy.z++;
        } else {
            if (enemy.modeTime > 400) {
                enemy.setMode('slamHand');
            }
        }
    } else if (enemy.mode === 'slamHand') {
        enemy.changeToAnimation('slamming');
        enemy.z -= 2;
        if (enemy.z <= 0) {
            enemy.z = 0;
            enemy.makeSound(state, 'bossDeath');
            if (enemy.area === state.areaInstance) {
                addScreenShake(state, 0, 2);
            }
            addSlamEffect(state, enemy);
            addArcOfShockWaves(
                state, enemy.area,
                [hitbox.x + hitbox.w / 2, hitbox.y + hitbox.h / 2],
                // We could increase the spark count for a more difficult version of the boss.
                3, // + (golem?.params.enrageLevel || 0),
                Math.PI / 2, Math.PI / 3
            );
            enemy.params.stunTime = 500;
            enemy.setMode('slammed');
        }
    } else if (enemy.mode === 'targetedSlam') {
        enemy.changeToAnimation('slamming');
        enemy.z -= 3;
        if (enemy.z <= 0) {
            enemy.z = 0;
            enemy.makeSound(state, 'bossDeath');
            if (enemy.area === state.areaInstance) {
                addScreenShake(state, 0, 3);
            }
            addSlamEffect(state, enemy);
            addRadialShockWaves(
                state, enemy.area,
                [hitbox.x + hitbox.w / 2, hitbox.y + hitbox.h / 2],
                6, Math.PI / 6
            );
            enemy.params.stunTime = 1500;
            enemy.setMode('stunned');
        }
    } else if (enemy.mode === 'punch') {
        enemy.changeToAnimation('punching');
        accelerateInDirection(state, enemy, {x: 0, y: 1});
        if (!moveEnemy(state, enemy, enemy.vx, enemy.vy, {})) {
            enemy.makeSound(state, 'bossDeath');
            if (enemy.area === state.areaInstance) {
                addScreenShake(state, 0, 3);
            }
            enemy.params.stunTime = 1500;
            enemy.setMode('stunned');
        }
    } else if (enemy.mode === 'stunned') {
        enemy.changeToAnimation('returning');
        if (enemy.modeTime >= enemy.params.stunTime) {
            enemy.setMode('return');
        }
    } else if (enemy.mode === 'slammed') {
        enemy.changeToAnimation('slamming');
        if (enemy.modeTime >= enemy.params.stunTime) {
            enemy.setMode('return');
        }
    }
}

