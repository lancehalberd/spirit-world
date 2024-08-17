import { addSparkleAnimation, burstAnimation, FieldAnimationEffect } from 'app/content/effects/animationEffect';
import { CrystalSpike } from 'app/content/effects/arrow';
import { Blast } from 'app/content/effects/blast';
import { Flame } from 'app/content/effects/flame';
import { Frost } from 'app/content/effects/frost';
import { throwMineAtLocation } from 'app/content/effects/landMine';
import { GrowingThorn } from 'app/content/effects/growingThorn';
import { Spark } from 'app/content/effects/spark';
import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import { Indicator } from 'app/content/objects/indicator';
import { FRAME_LENGTH } from 'app/gameConstants';
import { vanaraBlueAnimations } from 'app/render/npcAnimations';
import { createAnimation } from 'app/utils/animations';
import { addEffectToArea, removeEffectFromArea } from 'app/utils/effects';
import { accelerateInDirection, hasEnemyLeftSection, moveEnemyToTargetLocation } from 'app/utils/enemies';
import { getDirection } from 'app/utils/field';
import { sample } from 'app/utils/index';
import { addObjectToArea } from 'app/utils/objects';
import { getVectorToNearbyTarget, getVectorToMovementTarget, getVectorToTarget } from 'app/utils/target';



// Taken from heroAnimations.ts
export const Y_OFF = -4;
const guardianSpiritGeometry: FrameDimensions = {w: 24, h: 32, content: {x: 4, y: 16, w: 16, h: 16}};
const guardianSpiritUpAnimation: FrameAnimation = createAnimation('gfx/enemies/spiritboss.png', guardianSpiritGeometry, { cols: 8, y: 2, duration: 5});
const guardianSpiritDownAnimation: FrameAnimation = createAnimation('gfx/enemies/spiritboss.png', guardianSpiritGeometry, { cols: 8, y: 0, duration: 5});
const guardianSpiritLeftAnimation: FrameAnimation = createAnimation('gfx/enemies/spiritboss.png', guardianSpiritGeometry, { cols: 8, y: 3, duration: 5});
const guardianSpiritRightAnimation: FrameAnimation = createAnimation('gfx/enemies/spiritboss.png', guardianSpiritGeometry, { cols: 8, y: 1, duration: 5});
const guardianSpiritCastAnimation: FrameAnimation = createAnimation('gfx/enemies/spiritboss.png', guardianSpiritGeometry, { cols: 12, y: 4, duration: 5});
const guardianSpiritAttackAnimation: FrameAnimation = createAnimation('gfx/enemies/spiritboss.png', guardianSpiritGeometry, { cols: 8, y: 5, duration: 5});

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
    cast: omniAnimation(guardianSpiritCastAnimation),
};


function addBurstEffect(this: void, state: GameState, enemy: Enemy, area: AreaInstance): void {
    const hitbox = enemy.getHitbox();
    const animation = new FieldAnimationEffect({
        animation: burstAnimation,
        drawPriority: 'background',
        drawPriorityIndex: 1,
        x: hitbox.x + hitbox.w / 2 - burstAnimation.frames[0].w / 2,
        y: hitbox.y + hitbox.h / 2 - burstAnimation.frames[0].h / 2,
    });
    addEffectToArea(state, area, animation);
}

interface ProjectionParams {
    element: MagicElement
    modeOrder: ('area' | 'denial' | 'projectiles')[]
    chargeDirection: {x: number, y: number}
    blast: Blast
    regenerateQuickly?: boolean
}
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

function checkToGiveHint(state: GameState, guardian: Enemy<GuardianParams>) {
    // Increased the time since last hit by 0.5s every time we check. This will cause the hints
    // to be given slightly faster the more often the player hits the projection, which may
    // indicate that they haven't figured out how to complete the battle yet.
    guardian.params.lastDamaged -= 500;
    const timeSinceDamaged = state.fieldTime - guardian.params.lastDamaged;
    if (timeSinceDamaged >= 105000) {
        guardian.useTaunt(state, 'hint6');
        // Reset the time since last damaged at the final hint so that the earlier
        // hints will repeat in case the player missed some of them.
        guardian.params.lastDamaged = state.fieldTime - 15000;
    } else if (timeSinceDamaged >= 90000) {
        guardian.useTaunt(state, 'hint5');
    } else if (timeSinceDamaged >= 75000) {
        guardian.useTaunt(state, 'hint4');
    } else if (timeSinceDamaged >= 60000) {
        guardian.useTaunt(state, 'hint3');
    } else if (timeSinceDamaged >= 45000) {
        guardian.useTaunt(state, 'hint2');
    } else if (timeSinceDamaged >= 30000) {
        guardian.useTaunt(state, 'hint1');
    }
}

function getProjectionAlpha(enemy: Enemy) {
    let alpha = Math.min(1, 0.2 + 2 * enemy.life / enemy.enemyDefinition.life);
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
enemyDefinitions.guardianProjection = {
    animations: guardianSpiritAnimations, life: 20, scale: 1, update: updateProjection,
    canBeKnockedBack: false,
    aggroRadius: 2000,
    abilities: [blastAbility, mediumBlastAbility],
    acceleration: 0.3, speed: 1.5, isImmortal: true,
    // This should match the spirit energy fill color.
    healthBarColor: '#6BD657', showHealthBar: true,
    flying: true,
    params: {
    },
    onHit(this: void, state: GameState, enemy: Enemy<ProjectionParams>, hit: HitProperties): HitResult {
        if (enemy.mode === 'teleport') {
            return {};
        }
        const result = enemy.defaultOnHit(state, hit);
        if (result.hit) {
            checkToGiveHint(state, getGuardian(enemy));
        }
        // The projection should not actually stop any attacks, which can be annoying
        // when trying to hit the rolling rocks.
        return {
            ...result,
            pierced: true,
        }
    },
    render(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy) {
        context.save();
            context.globalAlpha *= getProjectionAlpha(enemy);
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
interface GuardianParams {
    lastDamaged: number
    staggerDamage: number
    usedMarkers: Set<ObjectInstance>
}
enemyDefinitions.guardian = {
    // This should match the NPC style of the Tomb Guardian.
    animations: vanaraBlueAnimations,
    life: 32, touchDamage: 0, update: updateGuardian,
    onHit(this: void, state: GameState, enemy: Enemy<GuardianParams>, hit: HitProperties): HitResult {
        const result = enemy.defaultOnHit(state, hit);
        if (!result.damageDealt) {
            return result;
        }
        enemy.params.lastDamaged = state.fieldTime;
        if (enemy.mode === 'staggered') {
            enemy.params.staggerDamage = (enemy.params.staggerDamage || 0) + result.damageDealt;
            if (enemy.params.staggerDamage >= 2) {
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
        // Triggered when damaging the projection with no damage to guardian in 30s.
        hint1: { text: `Attacking my projection will only slow me down.`, priority: 4, cooldown: 20000},
        // Triggered when damaging the projection with no damage to guardian in 45s.
        //hint2: { text: `My real body is beyond the reach of your weapons.`, priority: 4, cooldown: 20000},
        hint2: { text: `Your weapons cannot reach me in the spirit world.`, priority: 4, cooldown: 20000},
        // Triggered when no damage to guardian in 60s.
        hint3: { text: `Remember to use your Spirit Sight.`, priority: 4, cooldown: 20000},
        // Triggered when no damage to guardian in 75s.
        hint4: { text: `Everything is there for a reason.`, priority: 4, cooldown: 20000},
        // Triggered when no damage to guardian in 90s.
        hint5: { text: `You need to use the boulders.`, priority: 4, cooldown: 20000},
        // Triggered when no damage to guardian in 105s.
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
    },
};

function getGuardian(projection: Enemy<ProjectionParams>): Enemy<GuardianParams> {
    return projection.area.alternateArea.enemies.find(o =>
        o.definition.type === 'boss' && o.definition.enemyType === 'guardian'
    ) || projection.area.enemies.find(o =>
        o.definition.type === 'boss' && o.definition.enemyType === 'guardian'
    );
}

function getProjection(guardian: Enemy<GuardianParams>): Enemy<ProjectionParams> {
    return guardian.area.alternateArea.enemies.find(o =>
        o.definition.type === 'enemy' && o.definition.enemyType === 'guardianProjection'
    ) || guardian.area.enemies.find(o =>
        o.definition.type === 'enemy' && o.definition.enemyType === 'guardianProjection'
    );
}

function staggerGuardian(state: GameState, enemy: Enemy<GuardianParams>): void {
    enemy.setMode('staggered');
    // Give the guardian slightly longer iframes here so that the ball cannot hit them twice
    // when rolling diagonally.
    enemy.enemyInvulnerableFrames = 30;
    enemy.params.staggerDamage = 0;
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
    const maxLife = guardian.enemyDefinition.life;
    // Determine which elements are currently available
    let availableElements = elements;
    if (guardian.life >= maxLife) {
        availableElements = [elements[0]];
    } else if (guardian.life >= maxLife / 2) {
        availableElements = [elements[0], elements[1]];
    }
    // Find the index of the current element, then cycle to the next available element.
    const index = availableElements.indexOf(enemy.params.element);
    enemy.params.element = availableElements[(index + 1) % availableElements.length];
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
        })
        addEffectToArea(state, enemy.area, spark);
    } else if (enemy.params.element === 'ice') {
        const frost = new Frost({
            x, y,
            vx: 2 * dx,
            vy: 2 * dy,
            damage: 1,
            ttl: 1500,
        });
        addEffectToArea(state, enemy.area, frost);
    } else if (enemy.params.element === 'fire') {
        const flame = new Flame({
            x, y,
            vx: 3 * dx,
            vy: 3 * dy,
            damage: 1,
        });
        addEffectToArea(state, enemy.area, flame);
    } else {
        const crystalSpike = new CrystalSpike({
            x, y,
            vx: 3 * dx,
            vy: 3 * dy,
            damage: 1,
        });
        addEffectToArea(state, enemy.area, crystalSpike);
    }
}

function cancelBlastAttacks(state: GameState, enemy: Enemy<ProjectionParams>): void {
    if (enemy.activeAbility) {
        enemy.activeAbility = null;
    }
    if (enemy.area === enemy.params.blast?.area) {
        removeEffectFromArea(state, enemy.params.blast);
    }
}

function updateProjection(this: void, state: GameState, enemy: Enemy<ProjectionParams>): void {
    if (state.hero.area !== enemy.area) {
        enemy.healthBarTime = 0;
        enemy.life = 0;
        return;
    }
    const guardian = getGuardian(enemy);
    // The projection is defeated when the guardian is defeated.
    if (!guardian || guardian.status === 'gone' || guardian.isDefeated) {
        enemy.life = 0;
        enemy.showDeathAnimation(state);
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
    const maxLife = enemy.enemyDefinition.life;
    let targetScale = 1;

    if (enemy.mode === 'regenerate') {
        targetScale = 1 + 2 * enemy.life / maxLife;
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

    if (enemy.life <= 0 || enemy.mode === 'regenerate' || isGuardianStaggered) {
        enemy.life = Math.max(enemy.life, 0);
        if (enemy.mode !== 'regenerate' && !isGuardianStaggered) {
            enemy.setMode('regenerate');
            checkToGiveHint(state, guardian);
            cancelBlastAttacks(state, enemy);
            const timeSinceDamaged = state.fieldTime - guardian.params.lastDamaged;
            if (timeSinceDamaged >= 20000) {
                if (guardian.life > guardian.enemyDefinition.life / 4) {
                    guardian.useTaunt(state, 'regenerateMidHealth')
                } else if (!guardian.useTaunt(state, 'regenerateLowHealth')) {
                    guardian.useTaunt(state, 'regenerateLowHealth2')
                }
            }
        }
        enemy.invulnerableFrames = 10;
        enemy.enemyInvulnerableFrames = 10;
        enemy.acceleration = isGuardianStaggered ? 2 : 1;
        enemy.speed = isGuardianStaggered ? 10 : 5;
        const hitbox = guardian.getMovementHitbox();
        // Move slightly behind the guardian so the projection renders behind him.
        moveEnemyToTargetLocation(state, enemy, hitbox.x + hitbox.w / 2, hitbox.y + hitbox.h / 2 - 2);
        const vector = getVectorToMovementTarget(state, enemy, guardian);
        //if (vector && vector.mag >= 10) {
            //accelerateInDirection(state, enemy, vector);
        //}
        //enemy.vx *= 0.8;
        //enemy.vy *= 0.8;
        //enemy.x += enemy.vx;
        //enemy.y += enemy.vy;
        if (vector.mag < 10 && !isGuardianStaggered) {
            // The projection regenerates quickly after the Guardian recovers from being staggered.
            const rate = enemy.params.regenerateQuickly ? 10 : 4;
            enemy.life = Math.min(maxLife, enemy.life + rate * FRAME_LENGTH / 1000);
            if (enemy.life >= maxLife) {
                switchElements(state, enemy);
                enemy.setMode('choose');
                enemy.params.regenerateQuickly = false;
            }
        }
        return;
    }
    if (enemy.params.element && enemy.time % 100 === 0) {
        addSparkleAnimation(state, enemy.area, enemy.getHitbox(), {element: enemy.params.element});
    }

    enemy.life = Math.max(0, enemy.life - 0.5 * FRAME_LENGTH / 1000);
    if (enemy.mode === 'projectiles') {
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
            cancelBlastAttacks(state, enemy);
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
            enemy.d = getDirection(v.x, v.y);
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
    const markerId = guardian.life <= guardian.enemyDefinition.life / 3 ? 'guardianMarkerHard' : 'guardianMarkerEasy';
    const availableMarkers =  guardian.area.objects.filter(o => o.definition?.id === markerId);
    let unusedMarkers = availableMarkers.filter(o => !guardian.params.usedMarkers.has(o));
    // If the player does not damage the guardian while they are staggered, they can go through all the marerks
    // without defeating the Guardian, so we will need to recycle them at this point.
    if (!unusedMarkers.length) {
        guardian.params.usedMarkers = new Set();
        unusedMarkers = availableMarkers.filter(
            o => !guardian.params.usedMarkers.has(o)
            // In this case, make sure the guardian doesn't stay in their current location.
            && (o.x !== guardian.x || o.y !== guardian.y)
        );
    }
    const marker = sample(unusedMarkers);
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
    const projection = getProjection(enemy);
    // Teleport away from the current location as soon as iframes run out.
    // We don't do this immediately so the player can see the guardian for a bit after they are damaged.
    if (enemy.mode === 'recoverFromStaggered') {
        enemy.changeToAnimation('idle');
        if (enemy.enemyInvulnerableFrames <= 0) {
            enemy.setMode('normal');
            moveGuardianToArea(state, state.areaInstance.alternateArea, enemy);
            //addBurstEffect(state, enemy, state.hero.area);
            teleportToNextMarker(state, enemy);
            // Move the projection to match the position of the guardian at the start of battle.
            const vector = getVectorToTarget(state, projection, enemy);
            projection.x += vector.mag * vector.x;
            projection.y += vector.mag * vector.y;
            projection.params.regenerateQuickly = true;
        }
        return;
    }
    // Do not begin updating the guardian until the hero is in the other world.
    if (state.hero.area === enemy.area) {
        enemy.healthBarTime = 0;
        return;
    }
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


