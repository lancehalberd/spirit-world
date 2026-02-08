import {addBurstEffect, addSparkleAnimation} from 'app/content/effects/animationEffect';
import {CrystalSpike} from 'app/content/effects/arrow';
import {Blast} from 'app/content/effects/blast';
import {Fireball, Flame} from 'app/content/effects/flame';
import {FlameWall} from 'app/content/effects/flameWall';
import {Frost} from 'app/content/effects/frost';
import {throwMineAtLocation} from 'app/content/effects/landMine';
import {LaserBeam, setLaserBeamBySourceAndAngle} from 'app/content/effects/laserBeam';
import {GrowingThorn} from 'app/content/effects/growingThorn';
import {addRadialSparks, Spark} from 'app/content/effects/spark';
import {enemyDefinitions} from 'app/content/enemies/enemyHash';
import {Enemy} from 'app/content/enemy';
import {lightningBoltAbility} from 'app/content/enemyAbilities/lightningBolt';
import {Indicator} from 'app/content/objects/indicator';
import {CANVAS_WIDTH, CANVAS_HEIGHT, FRAME_LENGTH} from 'app/gameConstants';
import {vanaraBlueAnimations} from 'app/render/npcAnimations';
import {createAnimation} from 'app/utils/animations';
import {getCardinalDirection} from 'app/utils/direction';
import {addEffectToArea} from 'app/utils/effects';
import {accelerateInDirection, hasEnemyLeftSection, moveEnemyToTargetLocation} from 'app/utils/enemies';
import {getAreaSize} from 'app/utils/getAreaSize';
import {pad, removeElementFromArray} from 'app/utils/index';
import {addObjectToArea, removeObjectFromArea} from 'app/utils/objects';
import Random from 'app/utils/Random';
import {
    getClosestTarget,
    getNearbyTarget,
    getTargetingAnchor,
    getVectorToNearbyTarget,
    getVectorToMovementTarget,
    getVectorToTarget,
} from 'app/utils/target';




// Taken from heroAnimations.ts
export const Y_OFF = -4;
const guardianSpiritGeometry: FrameDimensions = {w: 24, h: 32, content: {x: 4, y: 22, w: 16, h: 10}};
const guardianSpiritUpAnimation: FrameAnimation = createAnimation('gfx/enemies/spiritboss.png', guardianSpiritGeometry, { cols: 8, y: 2, duration: 5});
const guardianSpiritDownAnimation: FrameAnimation = createAnimation('gfx/enemies/spiritboss.png', guardianSpiritGeometry, { cols: 8, y: 0, duration: 5});
const guardianSpiritLeftAnimation: FrameAnimation = createAnimation('gfx/enemies/spiritboss.png', guardianSpiritGeometry, { cols: 8, y: 3, duration: 5});
const guardianSpiritRightAnimation: FrameAnimation = createAnimation('gfx/enemies/spiritboss.png', guardianSpiritGeometry, { cols: 8, y: 1, duration: 5});
const guardianSpiritCastAnimation: FrameAnimation = createAnimation('gfx/enemies/spiritboss.png', guardianSpiritGeometry, { cols: 12, y: 4, duration: 5});
const guardianSpiritAttackAnimation: FrameAnimation = createAnimation('gfx/enemies/spiritboss.png', guardianSpiritGeometry, { cols: 8, y: 5, duration: 5});
const guardianSpiritLongAttackAnimation: FrameAnimation = createAnimation('gfx/enemies/spiritboss.png', guardianSpiritGeometry,
    { cols: 11, rows: 2, y: 5, duration: 5, frameMap: [0,1,2,3,4,5,6,7,8,9,10,11,17,18,19]});

const guardianSpiritStartAttackAnimation: FrameAnimation = createAnimation('gfx/enemies/spiritboss.png', guardianSpiritGeometry, { cols: 3, y: 5, duration: 5});
const guardianSpiritHoldAttackAnimation: FrameAnimation = createAnimation('gfx/enemies/spiritboss.png', guardianSpiritGeometry, { x: 3, cols: 2, y: 5, duration: 5, loop: true});
const guardianSpiritFinishAttackAnimation: FrameAnimation = createAnimation('gfx/enemies/spiritboss.png', guardianSpiritGeometry, { x: 5, cols: 3, y: 5, duration: 5});

const guardianSpiritStartCastAnimation: FrameAnimation = createAnimation('gfx/enemies/spiritboss.png', guardianSpiritGeometry, { cols: 1, y: 4, duration: 5});
const guardianSpiritHoldCastAnimation: FrameAnimation = createAnimation('gfx/enemies/spiritboss.png', guardianSpiritGeometry, { x: 1, cols: 7, y: 4, duration: 5, loop: true});
const guardianSpiritFinishCastAnimation: FrameAnimation = createAnimation('gfx/enemies/spiritboss.png', guardianSpiritGeometry, { x: 8, cols: 4, y: 4, duration: 5});



function omniAnimation(animation: FrameAnimation) {
    return {
        up: animation, down: animation, left: animation, right: animation,
    };
}
const guardianSpiritAnimations: ActorAnimations = {
    idle: {
        up: guardianSpiritUpAnimation,
        down: guardianSpiritDownAnimation,
        left: guardianSpiritLeftAnimation,
        right: guardianSpiritRightAnimation,
    },
    attack: omniAnimation(guardianSpiritAttackAnimation),
    slowAttack: omniAnimation(guardianSpiritLongAttackAnimation),
    startAttack: omniAnimation(guardianSpiritStartAttackAnimation),
    holdAttack: omniAnimation(guardianSpiritHoldAttackAnimation),
    finishAttack: omniAnimation(guardianSpiritFinishAttackAnimation),
    startCast: omniAnimation(guardianSpiritStartCastAnimation),
    holdCast: omniAnimation(guardianSpiritHoldCastAnimation),
    finishCast: omniAnimation(guardianSpiritFinishCastAnimation),
    cast: omniAnimation(guardianSpiritCastAnimation),
};

// Setting this will force the boss to always use this element.
const testElement: MagicElement = undefined;//'lightning'

//type NearbyTargetType = ReturnType<typeof getVectorToNearbyTarget>;
const blastAbility: EnemyAbility<true> = {
    getTarget(this: void, state: GameState, enemy: Enemy): true {
        return true;
    },
    prepareAbility(this: void, state: GameState, enemy: Enemy) {
        // enemy.changeToAnimation('attack');
    },
    useAbility(this: void, state: GameState, enemy: Enemy<ProjectionParams>): void {
        enemy.d = 'down';
        enemy.changeToAnimation('cast', 'idle');
        const hitbox = enemy.getHitbox(state);
        const blast = new Blast({
            x: hitbox.x + hitbox.w / 2,
            y: hitbox.y + hitbox.h / 2,
            element: enemy.params.element,
            damage: 2,
            tellDuration: 800,
            persistDuration: 400,
            radius: 80,
            boundSource: enemy,
            source: enemy,
        });
        enemy.params.blast = blast;
        addEffectToArea(state, enemy.area, blast);
    },
    cooldown: 1500,
    initialCharges: 0,
    charges: 1,
    chargesRecovered: 1,
    prepTime: 0,
    recoverTime: 1500,
};
const spacedBlastAbility = {
    ...blastAbility,
    recoverTime: 2000,
}
const mediumBlastAbility: EnemyAbility<true> = {
    getTarget(this: void, state: GameState, enemy: Enemy): true {
        return true;
    },
    prepareAbility(this: void, state: GameState, enemy: Enemy) {
        // enemy.changeToAnimation('attack');
    },
    useAbility(this: void, state: GameState, enemy: Enemy<ProjectionParams>): void {
        const hitbox = enemy.getHitbox(state);
        const blast = new Blast({
            x: hitbox.x + hitbox.w / 2,
            y: hitbox.y + hitbox.h / 2,
            damage: 1,
            element: enemy.params.element,
            tellDuration: 800,
            persistDuration: 2600,
            radius: 48,
            boundSource: enemy,
            source: enemy,
        });
        enemy.params.blast = blast;
        addEffectToArea(state, enemy.area, blast);
    },
    cooldown: 1000,
    initialCharges: 0,
    charges: 1,
    chargesRecovered: 1,
    prepTime: 0,
    recoverTime: 3000,
};

const laserAbility: EnemyAbility<Point> = {
    getTarget(this: void, state: GameState, enemy: Enemy): Point {
        const target = getNearbyTarget(state, enemy, 512, enemy.area.allyTargets);
        if (target) {
            return target.getTargetingAnchorPoint();
        }
        const {section} = getAreaSize(state);
        return {
            x: Random.range(section.x, section.x + section.w),
            y: Random.range(section.y, section.y + section.h),
        }
    },
    prepareAbility(this: void, state: GameState, enemy: Enemy, target: Point) {
        enemy.changeToAnimation('startAttack', 'holdAttack');
        const source = enemy.getTargetingAnchorPoint();
        const laserBeam = new LaserBeam({
            sx: source.x, sy: source.y,
            tx: target.x, ty: target.y,
            radius: 6, damage: 2, duration: 200,
            // Add a slight increase so this lines up with the exact attack frame we want to fire on.
            tellDuration: laserAbility.prepTime + 100,
            ignoreWalls: true,
            source: enemy,
        })
        setLaserBeamBySourceAndAngle(laserBeam, enemy, Math.atan2(target.y - source.y, target.x - source.x));
        addEffectToArea(state, enemy.area, laserBeam);
    },
    useAbility(this: void, state: GameState, enemy: Enemy<ProjectionParams>): void {
        enemy.changeToAnimation('finishAttack', 'idle');
    },
    cooldown: 1000,
    initialCharges: 0,
    charges: 1,
    chargesRecovered: 1,
    prepTime: 1000,
    recoverTime: 2000,
};

const flameWallAbility: EnemyAbility<true> = {
    getTarget(this: void, state: GameState, enemy: Enemy): true {
        return true;
    },
    prepareAbility(this: void, state: GameState, enemy: Enemy) {
        enemy.changeToAnimation('startCast', 'holdCast');
        const minSize = 80;
        const width = 300;
        const gapSize = 40;
        const gapX = Random.range(minSize, width - minSize - gapSize);

        const { section } = getAreaSize(state);
        let right = section.x + section.w - 16;
        let x = Math.max(state.camera.x - 32, section.x + 16);
        const y = Math.max(state.camera.y + 24, section.y + 32);
            // Add a slight increase so this lines up with the exact cast frame we want to fire on.
        const delay = flameWallAbility.prepTime + 200;
        const leftFlameWall = new FlameWall({
            direction: 'down',
            source: enemy,
            delay,
            rect: {
                x,
                y,
                w: gapX,
                h: 16,
            }
        });
        addEffectToArea(state, enemy.area, leftFlameWall);
        x = x + gapX + gapSize;
        const rightFlameWall = new FlameWall({
            direction: 'down',
            source: enemy,
            delay,
            rect: {
                x,
                y,
                w: Math.min(width - gapSize - gapX, right - x),
                h: 16,
            }
        });
        addEffectToArea(state, enemy.area, rightFlameWall);
    },
    useAbility(this: void, state: GameState, enemy: Enemy<ProjectionParams>): void {
        enemy.changeToAnimation('finishCast', 'idle');
    },
    cooldown: 1000,
    initialCharges: 0,
    charges: 1,
    chargesRecovered: 1,
    prepTime: 600,
    recoverTime: guardianSpiritFinishCastAnimation.duration,
};


const blizzardAbility: EnemyAbility<true> = {
    getTarget(this: void, state: GameState, enemy: Enemy): true {
        return true;
    },
    prepareAbility(this: void, state: GameState, enemy: Enemy) {
        enemy.changeToAnimation('startCast', 'holdCast');
    },
    useAbility(this: void, state: GameState, enemy: Enemy<ProjectionParams>): void {
        enemy.changeToAnimation('finishCast', 'idle');
        const theta = Random.range(0, 12) * Math.PI / 6;
        const cx = state.camera.x + CANVAS_WIDTH / 2;
        const cy = state.camera.y + CANVAS_HEIGHT / 2;
        const vx = 1.5 * Math.cos(theta);
        const vy = 1.5 * Math.sin(theta);
        const ox = Math.cos(theta + Math.PI / 2);
        const oy = Math.sin(theta + Math.PI / 2);
        const diameter = 256;
        const radius = 16;
        let distance = 128 + radius;
        let orthogonalPosition = Random.range(0, diameter);
        for (let i = 0; i < 12; i++) {
            const vortex = new Blast({
                x: cx - vx * distance + ox * (orthogonalPosition - diameter / 2),
                y: cy - vy * distance + oy * (orthogonalPosition - diameter / 2),
                vx,
                vy,
                element: 'ice',
                damage: 1,
                //delay: 400 * i,
                tellDuration: 0,
                persistDuration: 10000,
                radius,
                minRadius: 20,
                expansionDuration: 1000,
                source: enemy,
                hitProperties: {
                    hitEnemies: false,
                    // We can set this if freezing so much ground is too annoying.
                    // hitTiles: false,
                },
            });
            addEffectToArea(state, enemy.area, vortex);
            orthogonalPosition += 3 * radius + Random.range(20, 40);
            distance += 10 * Random.range(-2, 2);
            if (orthogonalPosition > diameter) {
                orthogonalPosition = orthogonalPosition % diameter;
                distance += 4 * radius + Random.range(20, 40);
            }

        }
    },
    cooldown: 1000,
    initialCharges: 0,
    charges: 1,
    chargesRecovered: 1,
    prepTime: 1000,
    recoverTime: guardianSpiritFinishCastAnimation.duration,
};


const projectileRingAbility: EnemyAbility<Target> = {
    getTarget(this: void, state: GameState, enemy: Enemy): Target {
        return getVectorToNearbyTarget(state, enemy, enemy.aggroRadius, enemy.area.allyTargets).target;
    },
    prepareAbility(this: void, state: GameState, enemy: Enemy, target: Target) {
        enemy.changeToAnimation('startAttack', 'holdAttack');
        const count = 12, radius = 48;
        const p = getTargetingAnchor(target)
        for (let i = 0; i < count; i++) {
            const theta = -Math.PI / 2 + 2 * Math.PI * i / count;
            const projectile = shootProjectile(state, enemy, theta);
            projectile.x = p.x - Math.cos(theta) * radius;
            projectile.y = p.y - Math.sin(theta) * radius;
            projectile.ttl = 400;
            projectile.ignoreWallsDuration = 400;
            projectile.delay = projectileRingAbility.prepTime;
        }
    },
    useAbility(this: void, state: GameState, enemy: Enemy<ProjectionParams>): void {
        enemy.changeToAnimation('finishAttack', 'idle');
    },
    cooldown: 1000,
    initialCharges: 0,
    charges: 1,
    chargesRecovered: 1,
    prepTime: 500,
    recoverTime: guardianSpiritFinishAttackAnimation.duration,
};

function checkToGiveHint(state: GameState, guardian: Enemy<GuardianParams>) {
    // Increased the time since last hit by 0.5s every time we check. This will cause the hints
    // to be given slightly faster the more often the player hits the projection, which may
    // indicate that they haven't figured out how to complete the battle yet.
    guardian.params.lastDamaged -= 1000;
    const timeSinceDamaged = state.fieldTime - guardian.params.lastDamaged;
    if (timeSinceDamaged >= 70000) {
        guardian.useTaunt(state, 'hint6');
        // Reset the time since last damaged at the final hint so that the earlier
        // hints will repeat in case the player missed some of them.
        guardian.params.lastDamaged = state.fieldTime - 10000;
    } else if (timeSinceDamaged >= 60000) {
        guardian.useTaunt(state, 'hint5');
    } else if (timeSinceDamaged >= 50000) {
        guardian.useTaunt(state, 'hint4');
    } else if (timeSinceDamaged >= 40000) {
        guardian.useTaunt(state, 'hint3');
    } else if (timeSinceDamaged >= 30000) {
        guardian.useTaunt(state, 'hint2');
    } else if (timeSinceDamaged >= 20000) {
        guardian.useTaunt(state, 'hint1');
    }
}

function getProjectionAlpha(enemy: Enemy<ProjectionParams>) {
    if (enemy.params.parent) {
        enemy = enemy.params.parent;
    }
    let alpha = enemy.params.isEnraged ? 1 : Math.min(1, 0.2 + 2 * enemy.life / enemy.maxLife);
    if (enemy.mode === 'teleport') {
        if (enemy.modeTime < 600) {
            alpha *= (600 - enemy.modeTime) / 600;
        } else if (enemy.modeTime >= 1400) {
            alpha *= Math.min(1, (enemy.modeTime - 1400) / 600);
        } else {
            alpha = 0;
        }
    }
    return alpha;
}

const initialRegenrationRate = 3;
const normalRegenerationRate = 2;
const staggerRegenerationRate = 10;
interface ProjectionParams {
    element: MagicElement
    modeOrder?: ('area' | 'denial' | 'projectiles')[]
    chargeDirection?: {x: number, y: number}
    blast?: Blast
    regenerationRate: number
    copies: Enemy<ProjectionParams>[]
    isEnraged?: boolean
    // used for rotating spark attack
    sparkTheta?: number
    bodyAlpha: number
    // This will only be set on copies of the projection.
    parent?: Enemy<ProjectionParams>
    usedEnrageAbilities?: Set<EnemyAbility<any>>,
}
const guardianProjection: EnemyDefinition<ProjectionParams> = {
    naturalDifficultyRating: 1,
    animations: guardianSpiritAnimations, life: 20, scale: 1, update: updateProjection,
    canBeKnockedBack: false,
    aggroRadius: 2000,
    abilities: [blastAbility, mediumBlastAbility],
    acceleration: 0.3, speed: 1.5, isImmortal: true,
    // This should match the spirit energy fill color.
    healthBarColor: '#6BD657', showHealthBar: true,
    floating: true,
    baseMovementProperties: {
        canPassWalls: true,
    },
    params: {
        element: testElement,
        regenerationRate: initialRegenrationRate,
        copies: [],
        bodyAlpha: 1,
    },
    onHit(this: void, state: GameState, enemy: Enemy<ProjectionParams>, hit: HitProperties): HitResult {
        if (enemy.mode === 'teleport' || enemy.mode === 'regenerate') {
            return {};
        }
        const result = enemy.defaultOnHit(state, hit);
        if (result.hit) {
            checkToGiveHint(state, getGuardian(enemy));
        }
        // Projection blocks all attacks so that it can interfere with pushing rolling balls.
        return {
            ...result,
            blocked: true,
        }
    },
    render(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy) {
        context.save();
            context.globalAlpha *= enemy.params.bodyAlpha * getProjectionAlpha(enemy);
            enemy.defaultRender(context, state);
        context.restore();
    },
    renderShadow(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy) {
        context.save();
            context.globalAlpha *= getProjectionAlpha(enemy);
            enemy.defaultRenderShadow(context,state);
        context.restore();
    }
};
enemyDefinitions.guardianProjection = guardianProjection;
const guardianProjectionCopy: EnemyDefinition<ProjectionParams> = {
    ...guardianProjection,
    abilities: [],
    showHealthBar: false,
    params: {
        ...guardianProjection.params,
    },
    // Damage on the copies is treated as damage on the main projection and all share iframes.
    onHit(this: void, state: GameState, enemy: Enemy<ProjectionParams>, hit: HitProperties): HitResult {
        if (enemy.enemyInvulnerableFrames > 0) {
            return {}
        }
        // Hitting the copies results in less damage than hitting the main projection.
        hit.damage /= 2;
        return enemy.params.parent?.onHit(state, hit);
    },
    animations: guardianSpiritAnimations, life: 20, scale: 1,
    update() {
        // For now the main projection is responsible for updating the copies.
    },
};
enemyDefinitions.guardianProjectionCopy = guardianProjectionCopy;
interface GuardianParams {
    lastDamaged: number
    staggerDamage: number
    staggerHits: number
    usedMarkers?: Set<ObjectInstance>
}
const guardian: EnemyDefinition<GuardianParams> = {
    naturalDifficultyRating: 20,
    // This should match the NPC style of the Tomb Guardian.
    animations: vanaraBlueAnimations,
    life: 30, touchDamage: 0, update: updateGuardian,
    onHit(this: void, state: GameState, enemy: Enemy<GuardianParams>, hit: HitProperties): HitResult {
        const result = enemy.defaultOnHit(state, hit);
        if (!result.damageDealt) {
            return result;
        }
        enemy.params.lastDamaged = state.fieldTime;
        if (enemy.mode === 'staggered') {
            // Default stagger time is 4s.
            // Hitting the guardian sets the time to 2s, setting remaining stagger time to 2s
            // on each hit, allowing the player to get the full number of hits as long as they hit
            // at least once every 2 seconds.
            enemy.modeTime = 2000;
            enemy.params.staggerHits++;
            enemy.params.staggerDamage = (enemy.params.staggerDamage || 0) + result.damageDealt;
            if (enemy.params.staggerHits >= 3 || enemy.params.staggerDamage >= 6) {
                enemy.setMode('recoverFromStaggered');
            }
        } else if (enemy.area !== state.areaInstance) {
            staggerGuardian(state, enemy);
        }
        return result;
    },
    taunts: {
        // Triggered near the start of battle.
        intro: { text: `Facing spirit beings will test your wits.`, priority: 2, limit: 1},
        // Triggered when regenerating >= 75% health and no damage to guardian in the last 20s.
        regenerateMidHealth: { text: 'I can do this all day!', priority: 1, cooldown: 20000},
        // Triggered when regenerating <= 25% health
        regenerateLowHealth: { text: `I'm not done yet!`, priority: 1, cooldown: 20000},
        regenerateLowHealth2: { text: `You must be getting tired too!`, priority: 1, cooldown: 20000},
        // Theses hints will be cycled through as the player fights the Guardian's projection without
        // damaging the Guardian's actual body.
        hint1: { text: `Attacking my projection will only slow me down.`, priority: 4, cooldown: 20000},
        hint2: { text: `Your weapons cannot reach me in the spirit world.`, priority: 4, cooldown: 20000},
        hint3: { text: `You must use your Spirit Sight to find me.`, priority: 4, cooldown: 20000},
        hint4: { text: `Everything is there for a reason.`, priority: 4, cooldown: 20000},
        hint5: { text: `You need to use the boulders.`, priority: 4, cooldown: 20000},
        hint6: { text: `I cannot attack while my projection regenerates.`, priority: 4, cooldown: 20000},
        // Triggered when taking hit damage from the boss as the astral projection
        astralBody: { text: `Your Astral Body is too weak to harm me.`, priority: 3, cooldown: 15000, limit: 3},
        // Triggered when switching to lightning element for the first time.
        elements: { text: `Energy from the Spirit Realm is limitless.`, priority: 2, limit: 1},
        // Triggered when switching to ice element for the first time.
        allElements: { text: `Are you prepared for my full power?`, priority: 2, limit: 1},
        // Triggered when the player staggers them.
        staggered: { text: 'Ugh!', priority: 4},
        staggered2: { text: `Not bad!`, priority: 4},
    },
    acceleration: 0.3, speed: 2,
    params: {
        lastDamaged: 0,
        staggerDamage: 0,
        staggerHits: 0,
    },
};
enemyDefinitions.guardian = guardian;

function getGuardian(projection: Enemy<ProjectionParams>): Enemy<GuardianParams> {
    return projection.area.alternateArea.enemies.find(o =>
        o.definition.type === 'boss' && o.definition.enemyType === 'guardian'
    ) || projection.area.enemies.find(o =>
        o.definition.type === 'boss' && o.definition.enemyType === 'guardian'
    );
}

function getProjection(state: GameState): Enemy<ProjectionParams> {
    return state.areaInstance.enemies.find(o =>
        o.definition.type === 'enemy' && o.definition.enemyType === 'guardianProjection'
    ) || state.areaInstance.alternateArea.enemies.find(o =>
        o.definition.type === 'enemy' && o.definition.enemyType === 'guardianProjection'
    );
}
function getOrCreateProjection(state: GameState, guardian: Enemy<GuardianParams>): Enemy<ProjectionParams> {
    let projection = getProjection(state);
    if (!projection) {
        projection = new Enemy(state, {
            type: 'enemy',
            id: 'vanaraGuardianProjection',
            status: 'normal',
            saveStatus: 'never',
            enemyType: 'guardianProjection',
            x: guardian.x,
            y: guardian.y,
        });
        projection.life = 0;
        projection.setMode('regenerate');
        addObjectToArea(state, guardian.area.alternateArea, projection);
    }
    return projection;
}

function staggerGuardian(state: GameState, enemy: Enemy<GuardianParams>): void {
    enemy.setMode('staggered');
    // Give the guardian slightly longer iframes here so that the ball cannot hit them twice
    // when rolling diagonally.
    enemy.enemyInvulnerableFrames = 30;
    enemy.params.staggerDamage = 0;
    enemy.params.staggerHits = 0;
    enemy.changeToAnimation('kneel');
    enemy.useTauntFromList(state, ['staggered', 'staggered2']);
    if (enemy.area !== state.hero.area) {
        moveGuardianToArea(state, state.hero.area, enemy);
    }
}
function moveGuardianToArea(state: GameState, area: AreaInstance, enemy: Enemy<GuardianParams>): void {
    if (enemy.area !== area) {
        addBurstEffect(state, enemy, enemy.area);
        addObjectToArea(state, area, enemy);
        // Add an object doesn't currently update the enemies array immediately which can cause the boss music to
        // restart if the boss isn't found for a frame.
        // Failing to remove the boss from the alternate area results in double life bars being shown briefly.
        removeElementFromArray(area.alternateArea.enemies, enemy);
        area.enemies.push(enemy);
    }
}

const elements: MagicElement[] = [null, 'lightning', 'ice', 'fire'];
//const elements: MagicElement[] = ['ice', 'ice', 'ice', 'ice'];
function switchElements(state: GameState, enemy: Enemy<ProjectionParams>) {
    const guardian = getGuardian(enemy);
    if (!guardian) {
        return;
    }
    const maxLife = guardian.maxLife;
    // Determine which elements are currently available
    let availableElements = elements;
    if (guardian.life >= maxLife) {
        availableElements = [elements[0]];
    } else if (guardian.life >= maxLife / 2) {
        availableElements = [elements[0], elements[1]];
    }
    // Find the index of the current element, then cycle to the next available element.
    const index = availableElements.indexOf(enemy.params.element);
    enemy.params.element = testElement || availableElements[(index + 1) % availableElements.length];
    if (enemy.params.element === elements[1]) {
        guardian.useTaunt(state, 'elements');
    } else if (enemy.params.element === elements[2]) {
        guardian.useTaunt(state, 'allElements');
    }
    // Reset mode order on every element switch so that denial is reliably the second attack pattern.
    enemy.params.modeOrder = [];
}

function switchToNextMode(state: GameState, enemy: Enemy<ProjectionParams>) {
    if (!enemy.params.modeOrder?.length) {
        if (Math.random() < 0.5) {
            enemy.params.modeOrder = ['area', 'denial', 'projectiles'];
        } else {
            enemy.params.modeOrder = ['projectiles', 'denial', 'area'];
        }
    }
    enemy.setMode(enemy.params.modeOrder.pop());
}

function shootProjectile(state: GameState, enemy: Enemy<ProjectionParams>, theta: number) {
    const hitbox = enemy.getHitbox();
    const x = hitbox.x + hitbox.w / 2, y = hitbox.y + hitbox.h;
    const dx = Math.cos(theta), dy = Math.sin(theta);
    if (enemy.params.element === 'lightning') {
        const spark = new Spark({
            x, y,
            vx: 4 * dx,
            vy: 4 * dy,
            damage: 1,
            hitCircle: {x: 0, y: 0, r: 10},
            source: enemy,
        })
        addEffectToArea(state, enemy.area, spark);
        return spark;
    }
    if (enemy.params.element === 'ice') {
        const frost = new Frost({
            x, y,
            vx: 2 * dx,
            vy: 2 * dy,
            damage: 1,
            ttl: 1500,
            source: enemy,
        });
        addEffectToArea(state, enemy.area, frost);
        return frost;
    }
    if (enemy.params.element === 'fire') {
        const fireball = new Fireball({
            x, y,
            vx: 3 * dx,
            vy: 3 * dy,
            scale: 1.5,
            source: enemy,
        });
        addEffectToArea(state, enemy.area, fireball);
        return fireball;
    }
    const crystalSpike = new CrystalSpike({
        x, y,
        vx: 3 * dx,
        vy: 3 * dy,
        damage: 1,
        source: enemy,
    });
    addEffectToArea(state, enemy.area, crystalSpike);
    return crystalSpike;
}

function cleanupCopies(state: GameState, enemy: Enemy<ProjectionParams>, instant = false) {
    // Cleanup copies
    for (const copy of [...enemy.params.copies]) {
        copy.scale *= 0.95;
        if (instant || copy.scale <= 1) {
            removeObjectFromArea(state, copy);
            removeElementFromArray(enemy.params.copies, copy);
        }
    }
}

function seekProjection(state: GameState, effect: FieldAnimationEffect) {
    const projection = getProjection(state);
    const v = getVectorToMovementTarget(state, effect, projection);
    const speed = 2 + Math.random();
    effect.vx = v.x * speed;
    effect.vy = v.y * speed;
    if (v.mag < 3) {
        effect.done = true;
    }
}

function updateProjection(this: void, state: GameState, enemy: Enemy<ProjectionParams>): void {
    enemy.z = 6;
    const guardian = getGuardian(enemy);
    // The projection is defeated when the guardian is defeated.
    if (!guardian || guardian.status === 'gone' || guardian.isDefeated) {
        enemy.life = 0;
        enemy.showDeathAnimation(state);
        cleanupCopies(state, enemy, true);
        return;
    }
    const isGuardianStaggered = guardian.mode === 'staggered' || guardian.mode === 'recoverFromStaggered';
    if (isGuardianStaggered) {
        enemy.setMode('choose');
        if (enemy.activeAbility) {
            enemy.activeAbility = null;
            enemy.changeToAnimation('idle');
        }
        enemy.life = Math.max(0, enemy.life - 100 * FRAME_LENGTH / 1000);
    }
    const maxLife = enemy.maxLife;
    let targetScale = 1;

    if (isGuardianStaggered) {
        targetScale = 1;
    } else if (enemy.mode === 'regenerate') {
        targetScale = 1 + 2 * enemy.life / maxLife;
    } else if (enemy.params.isEnraged) {
        // Projection stays at max scale while enraged regardless of life.
        targetScale = 3;
    } else {
        if (enemy.life > maxLife / 2) {
            targetScale = 3;
        } else if (enemy.life > 0) {
            targetScale = 2;
        }
    }
    if (enemy.scale < targetScale) {
        enemy.changeScale(Math.min(targetScale, enemy.scale + 0.05));
    } else if (enemy.scale > targetScale) {
        enemy.changeScale(Math.max(targetScale, enemy.scale - (isGuardianStaggered ? 0.1 : 0.05)));
    }
    enemy.speed = enemy.params.isEnraged ? 5 : enemy.enemyDefinition.speed;
    const { section } = getAreaSize(state);
    const centralPosition = {x: section.x + section.w / 2, y: section.y + section.h / 2 + 16};

    // Uncomment this to force testing enraged behavior.
    //enemy.params.isEnraged = true;
    //enemy.params.regenerationRate = staggerRegenerationRate;
    if (enemy.life <= 0 || enemy.mode === 'regenerate' || isGuardianStaggered) {
        enemy.life = Math.max(enemy.life, 0);
        if (enemy.mode !== 'regenerate' && !isGuardianStaggered) {
            enemy.setMode('regenerate');
            // The projection enrage phase ends as soon as it needs to regenerate once.
            if (enemy.params.isEnraged) {
                enemy.params.isEnraged = false;
                // Projection regenerates quickly after enraging.
                enemy.params.regenerationRate = staggerRegenerationRate;
            }
            enemy.cancelAttacks(state);
            const timeSinceDamaged = state.fieldTime - guardian.params.lastDamaged;
            if (guardian.life <= guardian.maxLife / 4) {
                // Always use the low life taunts when regenerating.
                if (!guardian.useTaunt(state, 'regenerateLowHealth')) {
                    guardian.useTaunt(state, 'regenerateLowHealth2')
                }
            } else if (timeSinceDamaged >= 20000) {
                // Only use the high life taunt if the player hasn't damaged them for a while.
                guardian.useTaunt(state, 'regenerateMidHealth')
            }
        }
        enemy.invulnerableFrames = 10;
        enemy.enemyInvulnerableFrames = 10;
        enemy.acceleration = isGuardianStaggered ? 2 : 1;
        enemy.speed = enemy.params.isEnraged ? 3 : 1;
        //const hitbox = guardian.getMovementHitbox();
        // Move slightly behind the guardian so the projection renders behind him.
        //const amount = moveEnemyToTargetLocation(state, enemy, hitbox.x + hitbox.w / 2, hitbox.y + hitbox.h / 2 - 2, undefined, {
        //    canPassWalls: true,
        //});
        if (enemy.mode === 'regenerate') {
            moveEnemyToTargetLocation(state, enemy, centralPosition.x, centralPosition.y, undefined, {
                canPassWalls: true,
            });
        }
        enemy.d = 'down';
        enemy.changeToAnimation('idle');
        if (!isGuardianStaggered) {
            if (!enemy.params.isEnraged && enemy.modeTime % 60 === 0 && enemy.life <= enemy.maxLife - 3) {
                addSparkleAnimation(state, enemy.area, pad(guardian.getHitbox(), -4),
                    {element: null},
                    {ttl: 2000, vx: Random.range(-1, 1), vy: Random.range(-1, 1), update: seekProjection}
                );
            }
            // The projection regenerates quickly after the Guardian recovers from being staggered.
            const rate = enemy.params.regenerationRate;
            enemy.life = Math.min(maxLife, enemy.life + rate * FRAME_LENGTH / 1000);
            if (enemy.life >= maxLife) {
                checkToGiveHint(state, guardian);
                switchElements(state, enemy);
                enemy.setMode('choose');
                enemy.params.regenerationRate = normalRegenerationRate;
            }
        }
        cleanupCopies(state, enemy);
        return;
    }
    // Uncomment this to test regeneration behavior more easily.
    // enemy.life -= 0.5;
    if (enemy.params.element && enemy.time % 100 === 0) {
        addSparkleAnimation(state, enemy.area, enemy.getHitbox(), {element: enemy.params.element});
    }

    if (enemy.params.isEnraged) {
        if (moveEnemyToTargetLocation(state, enemy, centralPosition.x, centralPosition.y)) {
            return;
        }
        const targets = enemy.area.objects.filter(o => o.definition.type === 'rollingBall').map(o => {
            const hitbox = o.getHitbox();
            return {x: hitbox.x + hitbox.w / 2, y: hitbox.y + hitbox.h / 2};
        });
        while (enemy.params.copies.length < targets.length) {
            const copy = new Enemy(state, {
                type: 'enemy',
                id: 'projectionClone' + enemy.params.copies.length,
                status: 'normal',
                enemyType: 'guardianProjectionCopy',
                x: enemy.x,
                y: enemy.y,
            });
            copy.speed = 5;
            copy.scale = 3;
            addObjectToArea(state, enemy.area, copy);
            // Copy is invisible except for its shadow at first.
            copy.params.parent = enemy;
            copy.params.bodyAlpha = 0;
            enemy.params.copies.push(copy);
        }
        for (let i = 0; i < targets.length; i++) {
            const target = targets[i];
            const copy = enemy.params.copies[i];
            copy.params.bodyAlpha = Math.min(1, copy.params.bodyAlpha + 0.03);
            copy.params.element = enemy.params.element;
            const distance = moveEnemyToTargetLocation(state, copy, target.x, target.y)
            if (distance) {
                copy.invulnerableFrames = copy.enemyInvulnerableFrames = 10;
                enemy.modeTime = -20;
            } else {
                // Copy parent iframes so they all appear to take damage together.
                copy.invulnerableFrames = enemy.invulnerableFrames;
                copy.enemyInvulnerableFrames = enemy.enemyInvulnerableFrames;
            }
        }
        if (enemy.mode === 'choose' && enemy.modeTime === 0) {
            if (Math.random() < 0.2) {
                enemy.setMode('projectileRings');
            } else if (enemy.params.element === 'lightning') {
                enemy.setMode('storm');
            } else if (enemy.params.element === 'fire') {
                enemy.setMode('flameWalls');
            } else if (enemy.params.element === 'ice') {
                enemy.setMode('blizzard');
            } else {
                enemy.setMode('lasers');
            }
            // enemy.setMode('projectileRings');
        }
    } else if (!enemy.params.isEnraged) {
        cleanupCopies(state, enemy);
    }

    enemy.life = Math.max(0, enemy.life - 0.5 * FRAME_LENGTH / 1000);
    if (enemy.mode === 'lasers') {
        if (enemy.modeTime === 1500 || enemy.modeTime === 2500 || (enemy.modeTime >= 3000 && (enemy.modeTime % 500) === 0)) {
            // Randomly choose any copy that isn't currently using an ability.
            const user = Random.element([enemy, ...enemy.params.copies].filter(e => !e.activeAbility));
            user?.useAbiltyFromDefinition(state, laserAbility, state.hero.getAnchorPoint());
        }
    } else if (enemy.mode === 'flameWalls') {
        if (enemy.modeTime === 600 || (enemy.modeTime >= 2400 && (enemy.modeTime % 1200) === 0)) {
            // Choose closest copy not using an ability.
            const user = getClosestTarget(state.hero, [enemy, ...enemy.params.copies].filter(e => !e.activeAbility));
            user?.useAbiltyFromDefinition(state, flameWallAbility, true);
        }
    } else if (enemy.mode === 'storm') {
        if (enemy.modeTime % 400 === 0) {
            for (const user of [enemy, ...enemy.params.copies]) {
                user.params.sparkTheta = (user.params.sparkTheta || 0) + Math.PI / 24;
                const hitbox = user.getMovementHitbox();
                addRadialSparks(state, enemy.area, [hitbox.x + hitbox.w / 2, hitbox.y + hitbox.h / 2], 3, user.params.sparkTheta, 2.5,
                    {damage: 2, source: user, ttl: 800}
                );
            }
            /*const user = getClosestTarget(state.hero, [enemy, ...enemy.params.copies]);
            user.params.sparkTheta = (user.params.sparkTheta || 0) + Math.PI / 24;
            const hitbox = user.getMovementHitbox();
            addRadialSparks(state, enemy.area, [hitbox.x + hitbox.w / 2, hitbox.y + hitbox.h / 2], 3, user.params.sparkTheta, 2.5,
                {damage: 2, source: user, ttl: 600}
            );*/
        }
        if (enemy.modeTime === 1500 || (enemy.modeTime >= 5000 && (enemy.modeTime % 2500) === 0)) {
            // Choose closest copy not using an ability.
            const user = getClosestTarget(state.hero, [enemy, ...enemy.params.copies].filter(e => !e.activeAbility));
            user?.useAbiltyFromDefinition(state, lightningBoltAbility);
        }
    } else if (enemy.mode === 'blizzard') {
        if (enemy.modeTime > 1000 && !enemy.params.copies.filter(e => e.activeAbility?.time < 1500).length) {
            const copy = getClosestTarget(state.hero, enemy.params.copies.filter(e => !e.activeAbility));
            if (copy) {
                copy.params.element = 'fire';
                copy?.useAbiltyFromDefinition(state, spacedBlastAbility);
            }
        }
        if (enemy.modeTime % 10000 === 0) {
            // Choose closest copy not using an ability.
            const user = enemy;
            user.params.element = 'ice';
            user?.useAbiltyFromDefinition(state, blizzardAbility);
        }
    } else if (enemy.mode === 'projectileRings') {
        if ((enemy.modeTime % 2000) === 0) {
            // Choose closest copy not using an ability.
            const user = getClosestTarget(state.hero, [enemy, ...enemy.params.copies].filter(e => !e.activeAbility));
            user?.useAbiltyFromDefinition(state, projectileRingAbility);
        }
        if ((enemy.modeTime % 2000) === 1000) {
            switchElements(state, enemy);
        }
    }  else if (enemy.mode === 'projectiles') {
        const v = getVectorToNearbyTarget(state, enemy, 2000, enemy.area.allyTargets);
        enemy.d = 'down';
        enemy.changeToAnimation('attack', 'idle');
        if (v?.mag >= 80) {
            enemy.setMode('aimedProjectiles');
        } else {
            enemy.setMode('projectileArcs');
        }
    } else if (enemy.mode === 'aimedProjectiles') {
        const v = getVectorToNearbyTarget(state, enemy, 2000, enemy.area.allyTargets);
        if (enemy.modeTime >= 3000) {
            enemy.setMode('choose');
        } else if (v.target && enemy.modeTime > 0 && enemy.modeTime % 600 === 0) {
            enemy.life--;
            shootProjectile(state, enemy, Math.atan2(v.y, v.x));
        }
    } else if (enemy.mode === 'projectileArcs') {
        const v = getVectorToNearbyTarget(state, enemy, 2000, enemy.area.allyTargets);
        if (enemy.modeTime >= 3000) {
            enemy.setMode('choose');
        } else if (enemy.modeTime > 0 && enemy.modeTime % 800 === 0) {
            enemy.life--;
            if (v) {
                const count = 2 + enemy.modeTime / 800; // 3, 4, 5
                const theta = Math.atan2(v.y, v.x) - Math.PI / 4;
                for (let i = 0; i < count; i++) {
                    shootProjectile(state, enemy, theta + i * Math.PI / 2 / (count - 1));
                }
            } else {
                // Shoot projectiles radially if no target is found.
                const count = 4 + 3 * enemy.modeTime / 800; // 7, 10, 13
                const theta = Math.random() * 2 * Math.PI;
                for (let i = 0; i < count; i++) {
                    shootProjectile(state, enemy, theta + i * 2 * Math.PI / count);
                }
            }
        }
    } else if (enemy.mode === 'area') {
        if (!enemy.activeAbility && enemy.modeTime < 200) {
            const v = getVectorToNearbyTarget(state, enemy, 2000, enemy.area.allyTargets);
            if (v?.mag >= 80) {
                if (enemy.tryUsingAbility(state, mediumBlastAbility)) {
                    enemy.life -= 2;
                }
                enemy.params.chargeDirection = {x: v.x, y: v.y};
                enemy.vx = enemy.vy = 0;
                enemy.setMode('charge');
            } else {
                if (enemy.tryUsingAbility(state, blastAbility)) {
                    enemy.life -= 2;
                }
            }
        } else if (enemy.modeTime >= 2000) {
            enemy.setMode('choose');
        }
    } else if (enemy.mode === 'denial') {
        const hitbox = enemy.getHitbox();
        const x = hitbox.x + hitbox.w / 2, y = hitbox.y + hitbox.h;
        const v = getVectorToNearbyTarget(state, enemy, 2000, enemy.area.allyTargets);
        const theta = v ? Math.atan2(v.y, v.x) : Math.random() * 2 * Math.PI;
        const dx = Math.cos(theta), dy = Math.sin(theta);
        if (enemy.modeTime === 0) {
            enemy.d = 'down';
            enemy.changeToAnimation('cast', 'idle');
        }
        if (enemy.params.element === 'lightning') {
            if (enemy.modeTime % 1500 === 0) {
                enemy.life--;
                const spark = new Spark({
                    x, y,
                    friction: 0.05 - 0.01 * enemy.modeTime / 1500,
                    vx: 3 * dx,
                    vy: 3 * dy,
                    damage: 1,
                    ttl: 8000,
                    hitCircle: {x: 0, y: 0, r: 24},
                    source: enemy,
                })
                addEffectToArea(state, enemy.area, spark);
            }
            if (enemy.modeTime >= 5000) {
                enemy.setMode('choose');
            }
        } else if (enemy.params.element === 'ice') {
            if (enemy.modeTime === 400) {
                enemy.life -= 2;
                const mag = v?.mag || 64;
                const tx = x + mag * Math.cos(theta), ty = y + mag * Math.sin(theta);
                const theta2 = Math.random() * 2 * Math.PI;
                for (let i = 0; i < 5; i++) {
                    const r = 24 + Math.random() * 32;
                    throwMineAtLocation(state, enemy, {
                        tx: tx + r * Math.cos(theta2 + i * 2 * Math.PI / 5),
                        ty: ty + r * Math.sin(theta2 + i * 2 * Math.PI / 5),
                    }, {
                        blastProps: {
                            radius: 24,
                            damage: 1,
                            element: 'ice',
                            tellDuration: 500,
                        },
                        source: enemy,
                    });
                }
            }
            if (enemy.modeTime >= 3000) {
                enemy.setMode('choose');
            }
        } else if (enemy.params.element === 'fire') {
            if (enemy.modeTime % 1000 === 100) {
                enemy.life--;
                const mag = (v?.mag || 64) - 8 + Math.random() * 16;
                const tx = x + mag * Math.cos(theta), ty = y + mag * Math.sin(theta);
                const flame = new Flame({
                    x: tx, y: ty, z: 160,
                    damage: 1,
                    scale: 2,
                    ttl: 7000,
                    source: enemy,
                })
                addEffectToArea(state, enemy.area, flame);
            }
            if (enemy.modeTime >= 3500) {
                enemy.setMode('choose');
            }
        } else {
            if (enemy.modeTime > 0 && enemy.modeTime % 500 === 100) {
                enemy.life -= 0.5;
                const mag = (v?.mag || 64) - 8 + Math.random() * 16;
                const tx = x + mag * Math.cos(theta), ty = y + mag * Math.sin(theta);
                const thorns = new GrowingThorn({
                    x: tx,
                    y: ty,
                    damage: 1,
                    source: enemy,
                });
                addEffectToArea(state, enemy.area, thorns);
            }
            if (enemy.modeTime >= 3000) {
                enemy.setMode('choose');
            }
        }
    }  else if (enemy.mode === 'charge') {
        // This mode lasts as long as the mediumBlast ability and they are on screen.
        if (!enemy.activeAbility || hasEnemyLeftSection(state, enemy, 32)) {
            enemy.setMode('choose');
            enemy.cancelAttacks(state);
        } else {
            enemy.acceleration = 0.1;
            accelerateInDirection(state, enemy, enemy.params.chargeDirection);
            enemy.x += enemy.vx;
            enemy.y += enemy.vy;
        }
    } else if (enemy.mode === 'teleport') {
        // 0-600, fade out, 600-1000 invisible, 1000-1400 invisible, 1400-2000 fade in, 2000, change mode.
        if (enemy.modeTime === 1000) {
            teleportToClosestMarker(state, enemy);
        }
        if (enemy.modeTime >= 2000) {
            enemy.setMode('choose');
        }
    } else {
        // Slow to a stop if moving.
        if (enemy.modeTime < 500) {
            enemy.vx *= 0.8;
            enemy.vy *= 0.8;
            enemy.x += enemy.vx;
            enemy.y += enemy.vy;
            return;
        }
        // Face the nearest target
        enemy.vx = enemy.vy = 0;
        const v = getVectorToNearbyTarget(state, enemy, 2000, enemy.area.allyTargets);
        if (v) {
            enemy.d = getCardinalDirection(v.x, v.y);
        }
        if (v && enemy.modeTime >= 1000) {
            if (v.mag >= 128) {
                enemy.setMode('teleport');
            } else {
                switchToNextMode(state, enemy);
            }
        }
    }
}

function teleportToClosestMarker(this: void, state: GameState, projection: Enemy<ProjectionParams>): void {
    const markers = projection.area.objects.filter(o => o.definition?.id === 'teleportTarget');
    let bestDistance: number, bestMarker: ObjectInstance;
    for (const marker of markers) {
        const v = getVectorToNearbyTarget(state, marker, 1000, projection.area.allyTargets);
        if (bestDistance === undefined || v?.mag < bestDistance) {
            bestDistance = v?.mag;
            bestMarker = marker;
        }
    }
    if (!bestMarker) {
        debugger;
    }
    const hitbox = projection.getHitbox();
    const markerBox = bestMarker.getHitbox();
    projection.x += markerBox.x + markerBox.w / 2 - (hitbox.x + hitbox.w / 2);
    projection.y += markerBox.y + markerBox.h - (hitbox.y + hitbox.h);
}

function teleportToNextMarker(this: void, state: GameState, guardian: Enemy<GuardianParams>): void {
    if (!guardian.params.usedMarkers) {
        guardian.params.usedMarkers = new Set();
    }
    const markerId = guardian.life <= guardian.maxLife / 3 ? 'guardianMarkerHard' : 'guardianMarkerEasy';
    const availableMarkers =  guardian.area.objects.filter(o => o.definition?.id === markerId);
    let unusedMarkers = availableMarkers.filter(o => !guardian.params.usedMarkers.has(o));
    // If the player does not damage the guardian while they are staggered, they can go through all the markers
    // without defeating the Guardian, so we will need to recycle them at this point.
    if (!unusedMarkers.length) {
        guardian.params.usedMarkers = new Set();
        unusedMarkers = availableMarkers.filter(
            o => !guardian.params.usedMarkers.has(o)
            // In this case, make sure the guardian doesn't stay in their current location.
            && (o.x !== guardian.x || o.y !== guardian.y)
        );
    }
    const marker = Random.element(unusedMarkers);
    if (marker) {
        guardian.x = marker.x;
        guardian.y = marker.y;
        guardian.params.usedMarkers.add(marker);
    } else {
        console.error('Unable to find a new marker for guardian:', guardian);
    }
}
function updateGuardian(this: void, state: GameState, enemy: Enemy): void {
    if (enemy.mode === 'staggered') {
        if (enemy.modeTime >= 4000) {
            enemy.setMode('recoverFromStaggered');
        }
        return;
    }
    // Teleport away from the current location as soon as iframes run out.
    // We don't do this immediately so the player can see the guardian for a bit after they are damaged.
    if (enemy.mode === 'recoverFromStaggered') {
        const projection = getOrCreateProjection(state, enemy);
        enemy.changeToAnimation('idle');
        if (enemy.enemyInvulnerableFrames <= 0) {
            // Move the projection on top of the guardian's position before teleporting.
            const vector = getVectorToTarget(state, projection, enemy);
            projection.x += vector.mag * vector.x;
            projection.y += vector.mag * vector.y;
            projection.scale = 1;
            projection.setMode('regenerate');
            projection.params.regenerationRate = staggerRegenerationRate;
            enemy.setMode('normal');
            moveGuardianToArea(state, state.areaInstance.alternateArea, enemy);
            //addBurstEffect(state, enemy, state.hero.area);
            teleportToNextMarker(state, enemy);
            // Once the Guardian is below 80% health it will enrage any time it takes a certain
            // amount of damage when staggered.
            if (enemy.params.staggerDamage >= 3 && enemy.life <= 0.8 * enemy.maxLife) {
                const projection = getOrCreateProjection(state, enemy);
                projection.params.isEnraged = true;
            }
        }
        return;
    }
    // Do not begin updating the guardian until the hero is in the other world.
    if (state.hero.area === enemy.area) {
        enemy.healthBarTime = 0;
        return;
    }
    const projection = getOrCreateProjection(state, enemy);
    if (!enemy.params.lastDamaged) {
        enemy.params.lastDamaged = state.fieldTime;
    }
    if (state.fieldTime - enemy.params.lastDamaged === 2000) {
        enemy.useTaunt(state, 'intro');
    }
    const heroProjection = state.hero.astralProjection;
    if (heroProjection?.area === enemy.area && heroProjection.overlaps(enemy.getHitbox())) {
        enemy.useTaunt(state, 'astralBody');
    }
    // For players that happen to have true sight, add an indicator that follows the guardians position in the other world.
    if (!enemy.params.indicator) {
        enemy.params.indicator = new Indicator(state, {type: 'indicator', id: 'guardianIndiactor', status: 'normal', x: enemy.x, y: enemy.y});
        addObjectToArea(state, enemy.area.alternateArea, enemy.params.indicator);
        enemy.params.indicator.target = enemy;
    }
    if (!enemy.params.usedMarkers?.size) {
        enemy.params.usedMarkers = new Set();
        // Don't teleport until the hero is in the material world (otherwise they might appear next to them).
        teleportToNextMarker(state, enemy);
        // Move the projection to match the position of the guardian at the start of battle.
        const vector = getVectorToTarget(state, projection, enemy);
        projection.x += vector.mag * vector.x;
        projection.y += vector.mag * vector.y;
    }
}


