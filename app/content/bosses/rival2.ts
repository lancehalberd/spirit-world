import { CrystalSpike } from 'app/content/effects/arrow';
import { DelayedEffect } from 'app/content/effects/delayedEffect';
import { Flame } from 'app/content/effects/flame';
import { addBurstEffect } from 'app/content/effects/animationEffect';
import { Spark } from 'app/content/effects/spark';
import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import { FRAME_LENGTH, isRandomizer } from 'app/gameConstants';
import { rivalAnimations } from 'app/content/enemyAnimations';
import { getLoot } from 'app/content/objects/lootObject';
import {
    chargeFireBackAnimation, chargeFireFrontAnimation,
    chargeIceBackAnimation, chargeIceFrontAnimation,
    chargeLightningBackAnimation, chargeLightningFrontAnimation,
    heroAnimations, staffAnimations, heroSpiritAnimations,
} from 'app/render/heroAnimations';
import { appendScript } from 'app/scriptEvents';
import { removeTextCue } from 'app/content/effects/textCue';
import { drawFrame, drawFrameAt, getFrame } from 'app/utils/animations';
import { checkIfAllEnemiesAreDefeated } from 'app/utils/checkIfAllEnemiesAreDefeated';
import {directionMap, getCardinalDirection} from 'app/utils/direction';
import { addEffectToArea, removeEffectFromArea } from 'app/utils/effects';
import {
    faceTarget,
    moveEnemy,
    moveEnemyToTargetLocation,
} from 'app/utils/enemies';
import {hitTargets} from 'app/utils/field';
import { getAreaSize } from 'app/utils/getAreaSize';
import { addObjectToArea } from 'app/utils/objects';
import Random from 'app/utils/Random';
import { saveGame } from 'app/utils/saveGame';
import {
    getVectorToNearbyTarget,
    getVectorToTarget,
    isTargetVisible,
} from 'app/utils/target';

const rollSpeed = [
    5, 5, 5, 5,
    4, 4, 4, 4,
    3, 3, 3, 3,
    2, 2, 2, 2,
];

type RollTargetType = ReturnType<typeof getVectorToNearbyTarget>;

const rollAbility: EnemyAbility<RollTargetType> = {
    getTarget(this: void, state: GameState, enemy: Enemy): RollTargetType {
        return getVectorToNearbyTarget(state, enemy, enemy.aggroRadius, enemy.area.allyTargets);
    },
    useAbility(this: void, state: GameState, enemy: Enemy, target: RollTargetType): void {
        let theta = Math.atan2(target.y, target.x);
        theta += (Math.random() < 0.5 ? 1 : -1) * Math.PI / 2;
        enemy.d = getCardinalDirection(Math.cos(theta), Math.sin(theta));
        enemy.changeToAnimation('roll');
    },
    cooldown: 4000,
    initialCharges: 1,
    cancelsOtherAbilities: true,
    cannotBeCanceled: true,
    charges: 1,
    chargesRecovered: 1,
    prepTime: 0,
    recoverTime: rollSpeed.length * FRAME_LENGTH,
};


function renderVanaraSpirit(this: void, context: CanvasRenderingContext2D, state: GameState, enemy: Enemy): void {
    const scale = enemy.scale;
    const animationSet = heroSpiritAnimations[enemy.currentAnimationKey] || heroSpiritAnimations.idle;
    const frame = getFrame(animationSet[enemy.d], enemy.animationTime);
    context.save();
        context.globalAlpha *= 0.2;
        drawFrame(context, frame, { ...frame,
            x: enemy.x - (frame?.content?.x || 0) * scale,
            y: enemy.y - (frame?.content?.y || 0) * scale - enemy.z,
            w: frame.w * scale,
            h: frame.h * scale,
        });
    context.restore();
}

function getStaffHitbox(enemy: Enemy, d: Direction): Rect {
    const enemyHitbox = enemy.getHitbox();
    if (d === 'left') {
        return {...enemyHitbox, x: enemyHitbox.x - 48, w: 48};
    }
    if (d === 'right') {
        return {...enemyHitbox, x: enemyHitbox.x + enemyHitbox.w, w: 48};
    }
    if (d === 'up') {
        return {...enemyHitbox, y: enemyHitbox.y - 48, h: 48};
    }
    return {...enemyHitbox, y: enemyHitbox.y + enemyHitbox.h, h: 48};
}

type ThrowTargetType = ReturnType<typeof getVectorToNearbyTarget>;

const throwAbility: EnemyAbility<ThrowTargetType> = {
    getTarget(this: void, state: GameState, enemy: Enemy): ThrowTargetType|null {
        return getVectorToNearbyTarget(state, enemy, enemy.aggroRadius, enemy.area.allyTargets);
    },
    prepareAbility(this: void, state: GameState, enemy: Enemy, target: ThrowTargetType): void {
        enemy.useTauntFromList(state, ['attack1', 'attack2']);
        enemy.d = getCardinalDirection(target.x, target.y);
        enemy.changeToAnimation('kneel');
    },
    useAbility(this: void, state: GameState, enemy: Enemy, target: ThrowTargetType): void {
        enemy.changeToAnimation('roll');
        const dx = target.x, dy = target.y;
        CrystalSpike.spawn(state, enemy.area, {
            delay: 100,
            x: enemy.x + enemy.w / 2 + enemy.w / 4 * dx,
            y: enemy.y + enemy.h / 2 + enemy.h / 4 * dy,
            damage: 1,
            vx: 4 * dx,
            vy: 4 * dy,
            hybridWorlds: true,
        });
    },
    cooldown: 4000,
    initialCooldown: 2000,
    initialCharges: 0,
    charges: 5,
    chargesRecovered: 5,
    prepTime: 200,
    recoverTime: 200,
};


const iceSpikeAbility: EnemyAbility<ThrowTargetType> = {
    getTarget(this: void, state: GameState, enemy: Enemy): ThrowTargetType|null {
        return getVectorToNearbyTarget(state, enemy, 512, [...state.hero.area.allyTargets, ...state.hero.area.alternateArea.allyTargets]);
    },
    prepareAbility(this: void, state: GameState, enemy: Enemy, target: ThrowTargetType): void {
        enemy.useTauntFromList(state, ['spiritAttack1', 'spiritAttack2', 'spiritAttack3']);
        enemy.d = getCardinalDirection(target.x, target.y);
        enemy.changeToAnimation('kneel');
    },
    updateAbility(this: void, state: GameState, enemy: Enemy, target: ThrowTargetType): void {
        if (enemy.activeAbility.time < 400) {
            const vector = getVectorToTarget(state, enemy, target.target);
            enemy.activeAbility.target.x = vector.x;
            enemy.activeAbility.target.y = vector.y;
            enemy.d = getCardinalDirection(vector.x, vector.y);
        }
    },
    useAbility(this: void, state: GameState, enemy: Enemy, target: ThrowTargetType): void {
        enemy.changeToAnimation('roll');
        const dx = target.x, dy = target.y;
        const iceIndex = (Math.random() * 3) | 0;
        const baseTheta = Math.atan2(dy, dx) - Math.PI / 6;
        for (let i = 0; i < 3; i++) {
            const theta = baseTheta + i * Math.PI / 6;
            const dx = Math.cos(theta), dy = Math.sin(theta);
            const speed = i === iceIndex ? 1.5 : 2.5;
            CrystalSpike.spawn(state, enemy.area, {
                delay: 100,
                x: enemy.x + enemy.w / 2 + enemy.w / 4 * dx,
                y: enemy.y + enemy.h / 2 + enemy.h / 4 * dy,
                damage: 1,
                element: i === iceIndex ? 'ice' : null,
                vx: speed * dx,
                vy: speed * dy,
                hybridWorlds: true,
            });
        }
        enemy.knockBack(state, {vx: -1 * target.x, vy: -1 * target.y, vz: 2}, true);
        enemy.setMode('knocked');
    },
    cooldown: 4000,
    charges: 1,
    prepTime: 800,
    recoverTime: 2000,
};

const flameRingAbility: EnemyAbility<true> = {
    getTarget(this: void, state: GameState, enemy: Enemy): true {
        return true;
    },
    prepareAbility(this: void, state: GameState, enemy: Enemy, target: true): void {
        const hitbox = enemy.getHitbox();
        enemy.useTauntFromList(state, ['spiritAttack1', 'spiritAttack2', 'spiritAttack3']);
        const center = getCenterRect(state);
        enemy.d = getCardinalDirection(center.x - (hitbox.x + hitbox.w / 2), center.y - (enemy.y + enemy.h / 2));
        enemy.changeToAnimation('kneel');
    },
    useAbility(this: void, state: GameState, enemy: Enemy, target: true): void {
        enemy.changeToAnimation('roll');
        const center = getCenterRect(state);
        const count = 12;
        for (let i = 0; i < count; i++) {
            const theta = 2 * Math.PI * i / count;
            const dx = Math.cos(theta), dy = Math.sin(theta);
            const flame = new Flame({
                delay: 400 + 200 * i,
                x: center.x + center.w / 3 * dx,
                y: center.y + center.h / 3 * dy,
                damage: 1,
                ax: -dx / 5,
                ay: -dy / 5,
                vx: 0,
                vy: 0,
            });
            const delayedFlame = new DelayedEffect({
                delay: 60 * i,
                effect: flame,
            });
            addEffectToArea(state, state.hero.area, delayedFlame);
        }
    },
    cooldown: 8000,
    charges: 1,
    prepTime: 800,
    recoverTime: 4000,
};


const chasingSparkAbility: EnemyAbility<ThrowTargetType> = {
    getTarget(this: void, state: GameState, enemy: Enemy): ThrowTargetType|null {
        return getVectorToNearbyTarget(state, enemy, 512, [...state.hero.area.allyTargets, ...state.hero.area.alternateArea.allyTargets]);
    },
    prepareAbility(this: void, state: GameState, enemy: Enemy, target: ThrowTargetType): void {
        enemy.useTauntFromList(state, ['spiritAttack1', 'spiritAttack2', 'spiritAttack3']);
        enemy.d = getCardinalDirection(target.x, target.y);
        enemy.changeToAnimation('kneel');
        const dx = target.x, dy = target.y;
        const spark = new Spark({
            delay: 1200,
            x: enemy.x + enemy.w / 2 + (13 + enemy.w / 2) * dx,
            y: enemy.y + enemy.h / 2 + (13 + enemy.h / 2) * dy,
            damage: 2,
            vx: 2 * dx,
            vy: 2 * dy,
            hitCircle: {
                x: 0, y: 0, r: 2,
            },
            hybridWorlds: true,
            finalRadius: 10,
            target: target.target,
            extraHitProps: {
                hitEnemies: true,
            },
            friction: 0.2,
            onHit(state: GameState, spark: Spark) {
                removeEffectFromArea(state, spark);
            },
            ttl: 3000,
        });
        addEffectToArea(state, state.hero.area, spark);
    },
    useAbility(this: void, state: GameState, enemy: Enemy, target: ThrowTargetType): void {
        enemy.knockBack(state, {vx: -3 * target.x, vy: -3 * target.y, vz: 2}, true);
        enemy.setMode('knocked');
    },
    cooldown: 6000,
    charges: 1,
    prepTime: 1200,
    recoverTime: 3000,
};

const staffAbility: EnemyAbility<CardinalDirection> = {
    getTarget(this: void, state: GameState, enemy: Enemy): CardinalDirection|null {
        for (const hero of [state.hero, state.hero.astralProjection, ...state.hero.clones]) {
            if (!hero) {
                continue;
            }
            for (const d of <const>['left', 'right', 'up', 'down']) {
                if (hero.overlaps(getStaffHitbox(enemy, d))) {
                    return d;
                }
            }
        }
        return null;
    },
    prepareAbility(this: void, state: GameState, enemy: Enemy, target: CardinalDirection): void {
        enemy.useTaunt(state, 'staff');
        enemy.d = target;
        enemy.changeToAnimation('staffJump');
    },
    useAbility(this: void, state: GameState, enemy: Enemy, target: CardinalDirection): void {
        enemy.changeToAnimation('staffSlam');
        enemy.z = Math.max(enemy.z + enemy.vz, 0);
        enemy.makeSound(state, 'bossDeath');
        hitTargets(state, enemy.area, {
            damage: 2,
            hitbox: getStaffHitbox(enemy, enemy.d),
            hitAllies: true,
            knockAwayFromHit: true,
            isStaff: true,
        });
        state.screenShakes.push({
            dx: 0, dy: 2, startTime: state.fieldTime, endTime: state.fieldTime + 200
        });
    },
    cancelsOtherAbilities: true,
    cannotBeCanceled: true,
    initialCharges: 0,
    cooldown: 4000,
    prepTime: rivalAnimations.staffJump.down.duration,
    recoverTime: rivalAnimations.staffSlam.down.duration + 500,
};

function getCenterRect(state: GameState): Rect {
    const {section} = getAreaSize(state);
    return {
        x: section.x + section.w / 2,
        y: section.y + section.h / 2,
        w: section.w,
        h: section.h
    };
}

function getTargetLocation(state: GameState, enemy: Enemy): Point {
    const center = getCenterRect(state);
    for (const target of enemy.area.allyTargets) {
        if (!isTargetVisible(state, enemy, target)) {
            continue;
        }
        const enemyHitbox = enemy.getHitbox();
        const targetHitbox = target.getHitbox(state);
        const cx = targetHitbox.x + targetHitbox.w / 2;
        const cy = targetHitbox.y + targetHitbox.h / 2;
        // Vector from the target to the mid point.
        const v = [center.x - cx, center.y - cy];
        const mag = Math.sqrt(v[0] * v[0] + v[1] * v[1]);
        if (mag <= 36) {
            // Target is close to the center, try to be directly left/right
            // while staying on the same side of the target.
            if (cx > enemyHitbox.x + enemyHitbox.w / 2) {
                return {x: cx - 48, y: cy};
            }
            return {x: cx + 48, y: cy};
        }
        return {x: cx + v[0] * 48 / mag, y: cy + v[1] * 48 / mag};
    }
    return center;
}


const maxImageCount = 13;
enemyDefinitions.rival2 = {
    naturalDifficultyRating: 20,
    // This should match the NPC style of the Rival.
    animations: rivalAnimations,
    abilities: [
        rollAbility, staffAbility, throwAbility,
        iceSpikeAbility, flameRingAbility, chasingSparkAbility,
    ],
    taunts: {
        attackIntro: { text: 'Should I go easy on you?', priority: 5, limit: 1},
        attack1: { text: 'No escape for you this time!', priority: 1},
        attack2: { text: `I'm going to enjoy this!`, priority: 1},
        spiritAttack1: { text: `Take this!`, priority: 1},
        spiritAttack2: { text: `Vanara wield the elements with ease!`, priority: 1},
        spiritAttack3: { text: `Behold!`, priority: 1},
        // This will only be used if the rival has been frozen once.
        iceSpikeTaunt: { text: `Think you can reflect this?`, priority: 1},
        // This will only be used after the ice spike attack.
        fireballTaunt: { text: `Here's my true power!`, priority: 1},
        // Used between rounds of attacks
        spiritTaunt1: { text: `I'm untouchable!`, priority: 2},
        spiritTaunt2: { text: `Feel like giving up?`, priority: 2},
        spiritTaunt3: { text: `Do you see how inferior you are?`, priority: 2},
        vanish: { text: 'Hah! Let me show you the power of a true Vanara!', priority: 5, limit: 1},
        dodge: { text: 'Nice try!', priority: 2},
        // Enemy suffers a regular hit
        normalDamage: { text: 'This is nothing', priority: 3},
        normalDamage2: { text: 'Lucky shot', priority: 3},
        // Enemy is staggered
        staggered: { text: 'How did you?!', priority: 4},
        staggered2: { text: `Impossible!`, priority: 4},
        // Enemy suffers a hit while staggered
        staggerDamage1: { text: 'Why you!', priority: 3},
        staggerDamage2: { text: 'You mongrel!', priority: 3},
        staff: { text: 'Remember this?', priority: 4},
    },
    isImmortal: true,
    life: 24, touchDamage: 0, update: updateRival2,
    onHit(this: void, state: GameState, enemy: Enemy, hit: HitProperties): HitResult {
        if (enemy.invulnerableFrames) {
            return {};
        }
        // Invulnerable while rolling.
        if (enemy.activeAbility?.definition === rollAbility) {
            return {};
        }
        if (enemy.area === state.hero.area) {
            // Rival cannot dodge roll while staggered.
            if (enemy.mode !== 'staggered' && enemy.tryUsingAbility(state, rollAbility)) {
                enemy.useTaunt(state, 'dodge');
                return {};
            }
            // Gain a use of the roll ability on taking damage in order to avoid followup attacks.
            const abilityWithCharges = enemy.getAbility(rollAbility);
            if (abilityWithCharges.charges < (rollAbility.charges || 1)) {
                abilityWithCharges.charges++;
            }
        }
        if (enemy.mode === 'staggered') {
            hit = {...hit, damage: hit.damage * 2};
        }
        const hitResult = enemy.defaultOnHit(state, hit);
        if (hitResult.damageDealt) {
            if (enemy.area === state.hero.area) {
                if (enemy.mode === 'staggered') {
                    enemy.useTauntFromList(state, ['staggerDamage1', 'staggerDamage2']);
                } else {
                    enemy.useTauntFromList(state, ['normalDamage', 'normalDamage2']);
                }
                // This will potentially allow the rival to dodge a second attack after he is hit once while staggered.
                // Sometimes this can be triggered when multiple ice shards hit him, which is not ideal.
                // Consider not applying this when hit by his own projectiles.
                enemy.setMode('hurt');
            } else {
                if (hit.element === 'ice') {
                    enemy.frozenDuration = 1000;
                    staggerRival(state, enemy);
                } else if (hit.element === 'lightning') {
                    staggerRival(state, enemy);
                } else{
                    enemy.useTauntFromList(state, ['normalDamage', 'normalDamage2']);
                }
            }
        }
        return hitResult;
    },
    render(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy): void {
        enemy.defaultRender(context, state);
        if (enemy.activeAbility?.definition === staffAbility) {
            renderStaff(context, state, enemy);
        }
    },
    alternateRender(this: void, context: CanvasRenderingContext2D, state: GameState, enemy: Enemy) {
        if (enemy.activeAbility?.definition === iceSpikeAbility
            && !enemy.activeAbility.used
            && enemy.activeAbility.time >= enemy.activeAbility.definition.prepTime - 400) {
            const animation = chargeIceBackAnimation;
            context.save();
                context.globalAlpha *= 0.8;
                const frame = getFrame(animation, enemy.activeAbility.time);
                drawFrameAt(context, frame, { x: enemy.x, y: enemy.y - enemy.z });
            context.restore();
        }
        if (enemy.activeAbility?.definition === chasingSparkAbility
            && !enemy.activeAbility.used
            && enemy.activeAbility.time >= enemy.activeAbility.definition.prepTime - 400) {
            const animation = chargeLightningBackAnimation;
            context.save();
                context.globalAlpha *= 0.8;
                const frame = getFrame(animation, enemy.activeAbility.time);
                drawFrameAt(context, frame, { x: enemy.x, y: enemy.y - enemy.z });
            context.restore();
        }
        if (enemy.activeAbility?.definition === flameRingAbility
            && enemy.activeAbility.time >= enemy.activeAbility.definition.prepTime - 400
            && enemy.activeAbility.time <= enemy.activeAbility.definition.prepTime + enemy.activeAbility.definition.recoverTime - 400
        ) {
            const animation = chargeFireBackAnimation;
            context.save();
                context.globalAlpha *= 0.8;
                const frame = getFrame(animation, enemy.activeAbility.time);
                drawFrameAt(context, frame, { x: enemy.x, y: enemy.y - enemy.z });
            context.restore();
        }
        const afterFrames = enemy.params.afterFrames ?? [];
        for (let i = afterFrames.length - 1; i >= 0; i -= 2) {
            context.save();
                context.globalAlpha *= 0.6 * (1 - (i + 1) / (maxImageCount + 2));
                if (enemy.currentAnimationKey === 'kneel') {
                    context.globalAlpha *= 0.7 + 0.3 * Math.cos(enemy.animationTime / 200);
                }
                renderVanaraSpirit(context, state, afterFrames[i]);
            context.restore();
        }
        if (enemy.activeAbility?.definition === iceSpikeAbility && !enemy.activeAbility.used) {
            const animation = chargeIceFrontAnimation;
            context.save();
                context.globalAlpha *= 0.8;
                const frame = getFrame(animation, enemy.activeAbility.time);
                drawFrameAt(context, frame, { x: enemy.x, y: enemy.y - enemy.z });
            context.restore();
        }
        if (enemy.activeAbility?.definition === flameRingAbility) {
            const animation = chargeFireFrontAnimation;
            context.save();
                context.globalAlpha *= 0.8;
                const frame = getFrame(animation, enemy.activeAbility.time);
                drawFrameAt(context, frame, { x: enemy.x, y: enemy.y - enemy.z });
            context.restore();
        }
        if (enemy.activeAbility?.definition === chasingSparkAbility && !enemy.activeAbility.used) {
            const animation = chargeLightningFrontAnimation;
            context.save();
                context.globalAlpha *= 0.8;
                const frame = getFrame(animation, enemy.activeAbility.time);
                drawFrameAt(context, frame, { x: enemy.x, y: enemy.y - enemy.z });
            context.restore();
        }
    },
    acceleration: 0.3, speed: 1.5,
    params: {
    },
};

function renderStaff(this: void, context: CanvasRenderingContext2D, state: GameState, enemy: Enemy): void {
    let animationTime = enemy.animationTime;
    if (enemy.activeAbility.used) {
        animationTime += enemy.activeAbility.definition.prepTime;
    }
    if (animationTime < staffAnimations[enemy.d].duration + 20) {
        const frame = getFrame(staffAnimations[enemy.d], animationTime);
        let x = enemy.x - 61 + 7, y = enemy.y - 32 - 90 + 6;
        if (enemy.animationTime < heroAnimations.staffJump[enemy.d].duration) {
            y -= enemy.z;
        }
        drawFrameAt(context, frame, { x, y });
    }
}

function updateSpiritRival(this: void, state: GameState, enemy: Enemy): void {
    // The enemy gets no IFrames so that if multiple attacks land at once they can all go through.
    enemy.invulnerableFrames = enemy.enemyInvulnerableFrames = 0;
    // Return to the world the hero is in when defeated.
    if (enemy.life <= 0) {
        moveRivalToArea(state, state.hero.area, enemy);
        return;
    }
    enemy.params.afterFrames = enemy.params.afterFrames ?? [];
    const afterFrames = enemy.params.afterFrames;
    // Rough code for cloning a class instance found here:
    // https://stackoverflow.com/questions/41474986/how-to-clone-a-javascript-es6-class-instance
    const enemyClone = Object.assign(Object.create(Object.getPrototypeOf(enemy)), enemy);
    afterFrames.unshift(enemyClone);
    if (afterFrames.length > maxImageCount) {
        afterFrames.pop();
    }

    // Make sure the rival returns to the kneeling animation when they land after being knocked back.
    if (enemy.mode === 'knocked' && enemy.action !== 'knocked') {
        if (enemy.activeAbility) {
            enemy.changeToAnimation('kneel');
        } else {
            enemy.setMode('choose');
        }
    }

    if (!enemy.activeAbility) {
        faceTarget(state, enemy, state.hero);
        if (!enemy.params.targetLocation) {
            const hitbox = enemy.getHitbox();
            const x = hitbox.x + hitbox.w / 2, y = hitbox.y + hitbox.h / 2;
            const {section} = getAreaSize(state);
            const center = getCenterRect(state);
            const theta = Math.atan2(y - center.y, x - center.x) + Math.PI / 2 + Math.random() * Math.PI;
            enemy.params.targetLocation = {
                x: center.x + Math.cos(theta) * section.w / 5,
                y: center.y + Math.sin(theta) * section.h / 5,
            }
            enemy.changeToAnimation('move');
        } else {
            if (enemy.mode === 'spiritModeStart' && enemy.modeTime <= 1000) {
                return;
            }
            if (!moveEnemyToTargetLocation(state, enemy, enemy.params.targetLocation.x, enemy.params.targetLocation.y)) {
                delete enemy.params.targetLocation;
                usePrioritizedAbility(state, enemy, Random.shuffle([chasingSparkAbility, iceSpikeAbility, flameRingAbility]));
            }
        }
    }
}

function usePrioritizedAbility(state: GameState, enemy: Enemy, abilities: EnemyAbility<any>[]): boolean {
    for (const ability of abilities) {
        if (enemy.tryUsingAbility(state, ability)) {
            return true;
        }
    }
}

function staggerRival(state: GameState, enemy: Enemy): void {
    // Make the enemy iframes very brief on stagger so that the player doesn't have to wait to hit them.
    enemy.invulnerableFrames = 5;
    enemy.enemyInvulnerableFrames = 5;
    enemy.setMode('staggered');
    enemy.changeToAnimation('kneel');
    enemy.useTauntFromList(state, ['staggered', 'staggered2']);
    if (enemy.area !== state.hero.area) {
        addBurstEffect(state, enemy, enemy.area);
        moveRivalToArea(state, state.hero.area, enemy);
    }
}
function moveRivalToArea(state: GameState, area: AreaInstance, rival: Enemy): void {
    if (rival.area !== area) {
        addObjectToArea(state, area, rival);
        // Add an object doesn't currently update the enemies array immediately which can cause the boss music to
        // restart if the boss isn't found for a frame.
        area.enemies.push(rival);
    }
}

function updateRival2(this: void, state: GameState, enemy: Enemy): void {
    // The hero can get stuck in the doorway if we initiate the cutscene before they finish exiting the door.
    if (state.hero.isUsingDoor) {
        enemy.healthBarTime = 0;
        return;
    }
    if (enemy.area !== state.hero.area) {
        if (!enemy.params.introduced) {
            addBurstEffect(state, enemy, state.hero.area);
            moveRivalToArea(state, state.hero.area, enemy);
            // Add a small delay here to make sure the burst animation finishes before field updates
            // are blocked by the intro dialogue. Otherwise the effects will be frozen during the start of the scene.
            state.scriptEvents.activeEvents.push({
                type: 'wait',
                time: state.time,
                duration: 400,
                blockPlayerInput: true,
            });
            return;
        }
        updateSpiritRival(state, enemy);
        return;
    }
    if (!enemy.params.introduced) {
        enemy.healthBarTime = 0;
        enemy.params.introduced = true;
        appendScript(state, '{@rival.startSecondFight}');
    }
    // Don't run any update logic while cutscenes are playing.
    if (state.scriptEvents.queue.length || state.scriptEvents.activeEvents.length) {
        return;
    }

    if (enemy.life <= 0) {
        if (enemy.mode !== 'escaping') {
            enemy.changeToAnimation('kneel');
            // Remove any attack effects on defeat.
            enemy.area.effects = enemy.area.effects.filter(effect => !effect.isEnemyAttack);
            removeTextCue(state);
            enemy.activeAbility = null;
            enemy.faceTarget(state);
            enemy.changeToAnimation('kneel');
            enemy.z = 0;
            enemy.healthBarTime = -10000;
            enemy.invulnerableFrames = 0;
            state.scriptEvents.queue.push({
                type: 'wait',
                blockPlayerInput: true,
                duration: 1000,
            });
            if (!isRandomizer && !state.savedState.objectFlags.skipRivalHelixStory) {
                appendScript(state, '{@rival.lostSecondFight}');
            }
            enemy.setMode('escaping');
            return;
        }
    }
    if (enemy.mode === 'escaping') {
        if (enemy.modeTime >= 100) {
            addBurstEffect(state, enemy, state.hero.area);
            enemy.status = 'gone';
            checkIfAllEnemiesAreDefeated(state, state.hero.area);
            const bossDefinition = enemy.definition as BossObjectDefinition;
            // Since this boss doesn't actually die, we have to explicitly grant its
            // loot on escape. Note this only matters for randomizer as the helix rival
            // has no loot in the base game.
            state.savedState.objectFlags[enemy.definition.id] = true;
            if (bossDefinition.lootType && bossDefinition.lootType !== 'empty') {
                getLoot(state, bossDefinition);
            }
            saveGame(state);
        }
        return;
    }


    enemy.useTaunt(state, 'attackIntro');
    if (enemy.mode === 'staggered') {
        enemy.changeToAnimation('kneel');
        if (enemy.modeTime >= 3000) {
            enemy.setMode('idle');
        }
        return;
    }
    if (!enemy.activeAbility && enemy.life <= enemy.enemyDefinition.life - 2/*12*/ && enemy.area === state.hero.area) {
        if (enemy.modeTime < 400) {
            return;
        }
        addBurstEffect(state, enemy, enemy.area);
        moveRivalToArea(state, state.hero.area.alternateArea, enemy);
        enemy.setMode('spiritModeStart');
        enemy.useTaunt(state, 'vanish');
        enemy.speed = 4;
        enemy.burnDamage = 0;
        return;
    }

    // Short grace period before the boss takes any actions at all.
    if (enemy.time < 200) {
        return;
    }

    // These attacks are only used at the start of the fight, which is similar to the first rival encounter.
    if (enemy.life > enemy.enemyDefinition.life - 2) {
        // Use the staff attack whenever possible. This actually makes the
        // fight a bit easier since this is when the rival is most vulnerable.
        enemy.tryUsingAbility(state, staffAbility)
        if (!enemy.activeAbility) {
            enemy.tryUsingAbility(state, throwAbility);
        }
    }
    if (enemy.activeAbility?.definition === rollAbility) {
        const [x, y] = directionMap[enemy.d];
        const frame = enemy.animationTime / FRAME_LENGTH;
        const speed = rollSpeed[frame] || 0;
        moveEnemy(state, enemy, speed * x, speed * y);
    }
    if (enemy.activeAbility?.definition === staffAbility) {
        const jumpDuration = enemy.activeAbility.definition.prepTime;
        if (!enemy.activeAbility.used) {
            // Jumping up
           // console.log(hero.animationTime, jumpDuration, slamDuration);
            if (enemy.animationTime < jumpDuration - FRAME_LENGTH) {
                enemy.vz = 1 - 1 * enemy.animationTime / jumpDuration;
                enemy.z += enemy.vz;
            } else if (enemy.animationTime === jumpDuration - FRAME_LENGTH) {
                enemy.vz = -4;
                enemy.z = Math.max(enemy.z + enemy.vz, 0);
            }
        } else {
            // Slamming down.
            enemy.z = Math.max(enemy.z + enemy.vz, 0);
        }
    }
    if (!enemy.activeAbility) {
        const target = getTargetLocation(state, enemy);
        const distance = enemy.distanceToPoint([target.x, target.y]);
        if ((distance > 1 && enemy.currentAnimationKey === 'move') || distance > 12) {
            moveEnemyToTargetLocation(state, enemy, target.x, target.y);
            enemy.faceTarget(state);
            enemy.changeToAnimation('move');
        } else {
            enemy.changeToAnimation('idle');
        }
    }
}
