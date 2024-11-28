import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import { EnemyArrow } from 'app/content/effects/arrow';
import {laserBeamAbility} from 'app/content/enemyAbilities/laserBeam';
import {
    turretAnimations,
    diagonalTurretAnimations,
    fastDiagonalTurretAnimations,
    fastTurretAnimations,
    turretGemAnimation,
    turretCrackedGemAnimation,
} from 'app/content/enemyAnimations';
import { simpleLootTable } from 'app/content/lootTables';
import { FRAME_LENGTH } from 'app/gameConstants';
import { getFrame } from 'app/utils/animations';
import { addEffectToArea } from 'app/utils/effects';


interface TurretParams {
    isDiagonal?: boolean
}

enemyDefinitions.arrowTurret = {
    animations: turretAnimations, 
    aggroRadius: 192,
    life: 4, 
    naturalDifficultyRating: 2,
    tileBehaviors: {solid: true},
    lootTable: simpleLootTable,
    canBeKnockedBack: false,
    elementalMultipliers: {'lightning': 2},
    renderOver(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy<TurretParams>): void {
        // Draw arrows about to fire on the first frame of the attack animation.
        if (enemy.mode === 'shoot' && enemy.modeTime < enemy.currentAnimation.frameDuration * FRAME_LENGTH) {
            for (const arrow of getArrows(state, enemy)) {
                arrow.x -= arrow.vx;
                arrow.y -= arrow.vy;
                arrow.render(context, state);
            }
            // Draw the top of the enemy frame over the arrows to cover them up.
            const frame = getFrame(enemy.currentAnimation, enemy.animationTime);
            // Hack to draw only the top 18 pixels of the enemy frame lined up with how it would normally
            // be drawn.
            enemy.defaultRender(context, state, {
                ...frame,
                h: enemy.params.isDiagonal ? 17 : 18,
            });
        }
        // Draw the cracked frame on the gem.
        const animation = (enemy.enemyInvulnerableFrames || enemy.invulnerableFrames || enemy.life <= 2)
            ? turretCrackedGemAnimation
            : turretGemAnimation;
        const frame = getFrame(animation, enemy.animationTime);
        enemy.defaultRender(context, state, frame);
    },
    initialize(state: GameState, enemy: Enemy<TurretParams>) {
        enemy.params.isDiagonal = Math.random() < 0.5;
        setTurretAnimations(state, enemy);
        enemy.mode = 'idle';
    },
    update: spinAndShoot,
};
function setTurretAnimations(state: GameState, enemy: Enemy<TurretParams>) {
    if (enemy.difficulty > enemy.enemyDefinition.naturalDifficultyRating) {
        // Double the animation speed on harder difficulties.
        enemy.animations = enemy.params.isDiagonal ? fastDiagonalTurretAnimations : fastTurretAnimations;
    } else {
        enemy.animations = enemy.params.isDiagonal ? diagonalTurretAnimations : turretAnimations;
    }
}
function spinAndShoot(state: GameState, enemy: Enemy<TurretParams>): void {
    if (!enemy.abilities.length && enemy.life <= 2 && enemy.difficulty > enemy.enemyDefinition.naturalDifficultyRating) {
        enemy.gainAbility(laserBeamAbility);
    }
    enemy.useRandomAbility(state);
    if (enemy.mode === 'idle') {
        // Skip the idle state on hard difficulties.
        if (enemy.modeTime >= 500 || enemy.difficulty > enemy.enemyDefinition.naturalDifficultyRating ) {
            enemy.setMode('rotate');
            enemy.changeToAnimation('rotate');
        }
    } else if (enemy.mode === 'rotate') {
        if (enemy.animationTime >= enemy.currentAnimation.duration) {
            enemy.params.isDiagonal = !enemy.params.isDiagonal;
            setTurretAnimations(state, enemy);
            enemy.setMode('shoot');
            enemy.changeToAnimation('attack');
        }
    } else if (enemy.mode === 'shoot') {
        if (enemy.modeTime === enemy.currentAnimation.frameDuration * FRAME_LENGTH) {
            for (const arrow of getArrows(state, enemy)) {
                addEffectToArea(state, enemy.area, arrow);
            }
        }
        if (enemy.animationTime >= enemy.currentAnimation.duration) {
            enemy.setMode('idle');
            enemy.changeToAnimation('idle');
        }
    }
}

function getArrows(state: GameState, enemy: Enemy<TurretParams>): EnemyArrow[] {
    const arrows: EnemyArrow[] = [];
    const theta = enemy.params.isDiagonal ? (Math.PI / 4) : 0;
    for (let i = 0; i < 4; i++) {
        const hitbox = enemy.getHitbox(state);
        const dx = Math.cos(theta + i * Math.PI / 2);
        const dy = Math.sin(theta + i * Math.PI / 2);
        const arrow = new EnemyArrow({
            x: hitbox.x + hitbox.w / 2 + hitbox.w * dx,
            y: hitbox.y + hitbox.h / 2 + hitbox.h * dy,
            vx: 4 * dx,
            vy: 4 * dy,
            source: enemy,
        });
        // Manual adjustments to certain arrow positions to line up with the animation better.
        if (enemy.params.isDiagonal) {
            arrow.y -= 3;
            arrow.x += 1;
        }
        if (dy === - 1) {
            arrow.x -= 2;
            arrow.y += 2;
        } else if (dy === 1) {
            arrow.x -= 1;
            arrow.y -= 2;
        } else if (dx === 1) {
            arrow.x += 1;
        } else if (dx === -1) {
            // No adjustment.
        }
        arrows.push(arrow);
    }
    return arrows;
}
