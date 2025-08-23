import { CANVAS_WIDTH, CANVAS_HEIGHT, FRAME_LENGTH, GAME_KEY } from 'app/gameConstants';
import { wasGameKeyPressed } from 'app/userInput';
import { playAreaSound } from 'app/musicController';
import { getHeroPosition } from './fps_utility';
import { TargetPracticeState, TargetPracticeSavedState, LevelKey, LevelConfig, FpsTarget } from './fps_types';
import { baseAmmo, levelConfigs } from './fps_config';
import { CirclingTarget, ExplosiveTarget, AlternatingTarget, StandardTarget, BonusTarget } from './fps_targets';

function getNewTargetPracticeState(state: GameState): TargetPracticeState {
    const heroHitbox = state.hero.getMovementHitbox();
    return {
        scene: 'shop',
        screen: {
            x: state.camera.x,
            y: state.camera.y,
            w: CANVAS_WIDTH,
            h: CANVAS_HEIGHT,
        },
        bullets: [],
        targets: [],
        crosshair: {x: state.hero.x, y: state.hero.y},
        reloadTime: 0,
        shopItems: [],
        levelKey: 'none',
        ammo: baseAmmo,
        maxAmmo: baseAmmo,
        score: 0,
        goal: 100,
        timeLeft: 30000,
        maxTime: 30000,
        lastShotTime: 0,
        missedShots: 0,
        nextSpawnTime: 0, 
        shotsFired: 0,
        shotsHit: 0,
        levelTime: 0,
        playerStart: { 
            x: heroHitbox.x + heroHitbox.w / 2 - 8,
            y: heroHitbox.y + heroHitbox.h / 2 - 8
        }
        
    };
}

function getNewTargetPracticeSavedState(): TargetPracticeSavedState {
    return {
        points: 0,
        records: {},
        unlocks: {'l1': 1, 'l10': 1},
    };
}

function startTargetPractice(state: GameState) {
    state.arState.game = getNewTargetPracticeState(state);
    const savedState = state.savedState.savedArData.gameData.targetPractice || {};
    state.savedState.savedArData.gameData.targetPractice = {...getNewTargetPracticeSavedState(), ...savedState};
}

function spawnGenericTargets(state: GameState, gameState: TargetPracticeState, config: LevelConfig) {
    const { speedMultiplier, sizeMultiplier } = getEscalationMultiplier(gameState);
    
    const totalWeight = config.targetTypes.reduce((sum, type) => sum + type.weight, 0);
    let random = Math.random() * totalWeight;
    let selectedType = config.targetTypes[0];
    
    
    for (const targetType of config.targetTypes) {
        random -= targetType.weight;
        if (random <= 0) {
            selectedType = targetType;
            break;
        }
    }
    
    const adjustedRadius = Math.max(1, selectedType.radius * sizeMultiplier);
    const adjustedSpeed = selectedType.speed * speedMultiplier;
    
    let x = 0;
    let y = 0;
    const spawnHeight = gameState.screen.h * 0.8;
    
    let attempts = 0;
    do {
        x = gameState.screen.x + selectedType.radius + Math.random() * (gameState.screen.w - 2 * selectedType.radius);
        y = gameState.screen.y + selectedType.radius + Math.random() * (spawnHeight - 2 * selectedType.radius);
        attempts++;
    } while (attempts < 20 && gameState.targets.some(t => 
        Math.sqrt((t.x - x) ** 2 + (t.y - y) ** 2) < selectedType.radius + t.radius + 5
    ));
    
    let newTarget: FpsTarget;
    switch (selectedType.type) {
        case 'circling':
            newTarget = new CirclingTarget(x, y, adjustedRadius, selectedType.points, adjustedSpeed, selectedType.lifetime);
            break;
        case 'explosive':
            newTarget = new ExplosiveTarget(x, y, adjustedRadius, selectedType.points, adjustedSpeed, selectedType.lifetime, selectedType.explosionRadius || 30);
            break;
        case 'alternating':
            newTarget = new AlternatingTarget(
                x, y, adjustedRadius, selectedType.points, selectedType.alternatePoints || selectedType.points * 2, adjustedSpeed, selectedType.lifetime,selectedType.switchInterval || 2000 
            );
            break;
        case 'armored':
            newTarget = new StandardTarget(x, y, adjustedRadius, selectedType.points, adjustedSpeed, selectedType.lifetime, selectedType.color, selectedType.maxHits || 3);
            break;
        case 'ammo':
            newTarget = new BonusTarget(x, y, adjustedRadius, adjustedSpeed, selectedType.lifetime, 'ammo', selectedType.bonusAmount || 1);
            break;
        case 'time':
            newTarget = new BonusTarget(x, y, adjustedRadius, adjustedSpeed, selectedType.lifetime, 'time', selectedType.bonusAmount || 5000);
            break;
        case 'standard':
        default:
            newTarget = new StandardTarget(x, y, adjustedRadius, selectedType.points, adjustedSpeed, selectedType.lifetime);
            break;
    }
    
    gameState.targets.push(newTarget);
}

function spawnTargets(state: GameState, gameState: TargetPracticeState, levelKey: LevelKey) {
    return spawnGenericTargets(state, gameState, levelConfigs[levelKey]);
}




function startLevel(state: GameState, gameState: TargetPracticeState, levelKey: LevelKey) {
    gameState.scene = 'level';
    gameState.levelKey = levelKey;
    const config = levelConfigs[levelKey];
    const timeUpgrade = (state.savedState.savedArData.gameData.targetPractice.unlocks.time ?? 0) * 5000;
    gameState.maxTime = config.timeLimit + timeUpgrade;
    gameState.timeLeft = gameState.maxTime;
    gameState.goal = config.goal;

    const levelBaseAmmo = baseAmmo;
    gameState.maxAmmo = levelBaseAmmo;
    gameState.ammo = gameState.maxAmmo;

    gameState.bullets = [];
    gameState.targets = [];
    gameState.score = 0;
    gameState.reloadTime = 0;
    gameState.lastShotTime = 0;
    gameState.missedShots = 0;
    gameState.nextSpawnTime = 0;
    gameState.levelTime = 0;
    
    gameState.shotsFired = 0,
    gameState.shotsHit = 0,

    spawnTargets(state, gameState, levelKey);
}

function handleTargetCollisions(gameState: TargetPracticeState): void {
    const activeTargets = gameState.targets.filter(isActiveTarget);
    
    if (activeTargets.length < 2) return;
    
    for (let i = 0; i < activeTargets.length - 1; i++) {
        const target1 = activeTargets[i];
        
        for (let j = i + 1; j < activeTargets.length; j++) {
            const target2 = activeTargets[j];
            
            if (areTargetsNearby(target1, target2)) {
                resolveCollision(target1, target2);
            }
        }
    }
}

function isActiveTarget(target: FpsTarget): boolean {
    return target.hitTime === undefined && !(target instanceof CirclingTarget);
}

function areTargetsNearby(target1: FpsTarget, target2: FpsTarget): boolean {
    const maxDistance = target1.radius + target2.radius;
    const dx = target2.x - target1.x;
    const dy = target2.y - target1.y;
    const distanceSquared = dx * dx + dy * dy;
    const maxDistanceSquared = maxDistance * maxDistance;
    
    return distanceSquared <= maxDistanceSquared;
}

function resolveCollision(target1: FpsTarget, target2: FpsTarget): boolean {
    const dx = target2.x - target1.x;
    const dy = target2.y - target1.y;
    const distanceSquared = dx * dx + dy * dy;
    const minDistance = target1.radius + target2.radius;
    const minDistanceSquared = minDistance * minDistance;
    
    if (distanceSquared >= minDistanceSquared || distanceSquared === 0) {
        return false;
    }
    
    const distance = Math.sqrt(distanceSquared);
    const overlap = minDistance - distance;
    const nx = dx / distance;
    const ny = dy / distance;
    
    separateTargets(target1, target2, nx, ny, overlap);
    changeVelocities(target1, target2, nx, ny);
    
    return true;
}

function separateTargets(
    target1: FpsTarget,
    target2: FpsTarget,
    nx: number,
    ny: number,
    overlap: number
): void {
    const separationDistance = overlap * 0.5;
    
    target1.x -= nx * separationDistance;
    target1.y -= ny * separationDistance;
    target2.x += nx * separationDistance;
    target2.y += ny * separationDistance;
}

function changeVelocities(
    target1: FpsTarget,
    target2: FpsTarget,
    nx: number,
    ny: number
): void {
    const relativeVx = target2.vx - target1.vx;
    const relativeVy = target2.vy - target1.vy;
    const relativeVelocityInNormal = relativeVx * nx + relativeVy * ny;
    
    if (relativeVelocityInNormal > 0) {
        return;
    }

    const restitution = 0.8;
    const impulseScalar = -(1 + restitution) * relativeVelocityInNormal / 2;
    const impulsex = impulseScalar * nx;
    const impulsey = impulseScalar * ny;
    
    target1.vx -= impulsex;
    target1.vy -= impulsey;
    target2.vx += impulsex;
    target2.vy += impulsey;
}

function getEscalationMultiplier(gameState: TargetPracticeState): { speedMultiplier: number, sizeMultiplier: number } {
    const config = levelConfigs[gameState.levelKey];
    if (!config.escalation) {
        return { speedMultiplier: 1, sizeMultiplier: 1 };
    }
    
    let progressRatio = gameState.levelTime / 40000;
    const speedMultiplier = Math.min(1 + progressRatio * 1.0, 5);
    const sizeMultiplier = Math.max(1 - progressRatio * 0.4, 0.3);
    
    return { speedMultiplier, sizeMultiplier };
}


function updateLevel(state: GameState, gameState: TargetPracticeState, savedState: TargetPracticeSavedState) {
    gameState.levelTime += FRAME_LENGTH;

    const difficulty = parseInt(gameState.levelKey.substring(1), 10);
    const config = levelConfigs[gameState.levelKey];
    const isEndless = gameState.levelKey === 'l10';
    
    const heroPos = getHeroPosition(state, gameState);
    gameState.crosshair.x = heroPos.x;
    gameState.crosshair.y = heroPos.y;
    
    if (wasGameKeyPressed(state, GAME_KEY.PASSIVE_TOOL)) {
        if (gameState.ammo <= 0) {
            playAreaSound(state, state.areaInstance, 'error');
        } else {
            gameState.shotsFired++;
            
            let hitTarget = false;
            for (let j = 0; j < gameState.targets.length; j++) {
                const target = gameState.targets[j];
                if (target.hitTime !== undefined) continue;
                
                const dx = gameState.crosshair.x - target.x;
                const dy = gameState.crosshair.y - target.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist <= target.radius + 3) { //Add 3 to give a little leeway to near-misses
                    hitTarget = true;
                    if (dist <= (target.radius / 3)) {target.onHit(state, gameState, savedState, true)}
                    else {target.onHit(state, gameState, savedState, false);}
                    if (isEndless) {gameState.timeLeft = Math.min(1000 + gameState.timeLeft, gameState.maxTime);}
                }
            }
        
            if (!hitTarget) {
                gameState.ammo--;
                gameState.missedShots++;
                playAreaSound(state, state.areaInstance, 'missedShot');
            }
        }
    }
    
    for (let i = 0; i < gameState.targets.length; i++) {
        const target = gameState.targets[i];
        target.update(state, gameState);
    }
    
    handleTargetCollisions(gameState);

    for (let i = 0; i < gameState.targets.length; i++) {
        const target = gameState.targets[i] as StandardTarget; //FIGURE OUT HOW TO MAKE BEHAVE
        if (target.shouldRemove() || (target.hitTime !== undefined && target.hitTime <= 0)) {
            gameState.targets.splice(i--, 1);
        }
    }
    
    if (gameState.nextSpawnTime > 0) {
        gameState.nextSpawnTime -= FRAME_LENGTH;
    }
    
    const maxTargets = config.maxTargets ?? Math.min(1 + Math.floor(difficulty / 2), 4);
    const activeTargets = gameState.targets.filter(t => t.hitTime === undefined).length;
    
    if (activeTargets < maxTargets && gameState.nextSpawnTime <= 0) {
        spawnTargets(state, gameState, gameState.levelKey);
        gameState.nextSpawnTime = config.spawnInterval;
    }
    
    gameState.timeLeft -= FRAME_LENGTH;

    if (gameState.timeLeft <= 0) {
        gameState.scene = 'results';
    } else if (!isEndless && gameState.goal > 0 && gameState.score >= gameState.goal) {
        gameState.completionTime = gameState.maxTime - gameState.timeLeft;
        gameState.scene = 'results';
    } else if (gameState.ammo <= 0) {
        gameState.scene = 'results';
    }
}

export { getNewTargetPracticeState, getNewTargetPracticeSavedState, startTargetPractice, spawnTargets, startLevel, updateLevel };