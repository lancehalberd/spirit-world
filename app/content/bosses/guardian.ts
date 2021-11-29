import { sample } from 'lodash';
import { refreshAreaLogic } from 'app/content/areas';
import {
    accelerateInDirection,
    getVectorToNearbyTarget,
    getVectorToTarget,
    moveEnemy,
} from 'app/content/enemies';
import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import { heroAnimations, heroSpiritAnimations } from 'app/render/heroAnimations';
import { directionMap, getDirection } from 'app/utils/field';


import { Enemy, GameState, HitProperties, HitResult } from 'app/types';


enemyDefinitions.guardianProjection = {
    animations: heroSpiritAnimations, life: 10, scale: 2, touchDamage: 1, update: updateProjection,
    acceleration: 0.3, speed: 1.5, isImmortal: true,
    flying: true,
    params: {
    },
};
enemyDefinitions.guardian = {
    animations: heroAnimations, life: 12, touchDamage: 0, update: updateGuardian,
    onHit(this: void, state: GameState, enemy: Enemy, hit: HitProperties): HitResult {
        const result = enemy.defaultOnHit(state, hit);
        if (enemy.life > 0) {
            teleportToNextMarker(state, enemy);
        }
        return result;
    },
    acceleration: 0.3, speed: 2,
    params: {
    },
};


function updateProjection(this: void, state: GameState, enemy: Enemy): void {
    const guardian = enemy.area.alternateArea.enemies.find(o =>
        o.definition.type === 'boss' && o.definition.enemyType === 'guardian' && o.definition.id === enemy.definition.id
    );
    // The projection is defeated when the guardian is defeated.
    if (!guardian || guardian.status === 'gone') {
        enemy.showDeathAnimation(state);
        // Refresh the area so that the guardian NPC moves to the correct location now that the boss is defeated.
        refreshAreaLogic(state, state.areaInstance);
        refreshAreaLogic(state, state.alternateAreaInstance);
        return;
    }
    if (enemy.life <= 0 || enemy.mode === 'regenerate') {
        if (enemy.mode !== 'regenerate') {
            enemy.setMode('regenerate');
        }
        enemy.invulnerableFrames = 10;
        enemy.enemyInvulnerableFrames = 10;
        const vector = getVectorToTarget(state, enemy, guardian);
        enemy.acceleration = 1;
        enemy.speed = 5;
        if (vector && vector.mag >= 10) {
            accelerateInDirection(state, enemy, vector);
        }
        enemy.vx *= 0.8;
        enemy.vy *= 0.8;
        moveEnemy(state, enemy, enemy.vx, enemy.vy, {});
        if (vector.mag < 10 && enemy.modeTime % 500 === 0) {
            enemy.life++;
            if (enemy.life >= enemy.enemyDefinition.life) {
                enemy.setMode('choose');
            }
        }
        return;
    }
    if (enemy.mode === 'chase') {
        const v = getVectorToNearbyTarget(state, enemy, 1000, enemy.area.allyTargets);
        if (v) {
            enemy.acceleration = 0.2;
            enemy.speed = 1.5;
            accelerateInDirection(state, enemy, v);
            enemy.d = getDirection(enemy.vx, enemy.vy);
            moveEnemy(state, enemy, enemy.vx, enemy.vy, {});
        }
        if (enemy.modeTime >= 3000) {
            enemy.setMode('choose');
        }
    } else if (enemy.mode === 'charge') {
        const [x, y] = directionMap[enemy.d];
        enemy.acceleration = 0.5;
        enemy.speed = 4;
        accelerateInDirection(state, enemy, {x, y});
        moveEnemy(state, enemy, enemy.vx, enemy.vy, {});
        if (enemy.modeTime >= 1000) {
            enemy.setMode('choose');
        }
    } else if (enemy.mode === 'storm') {
        if (enemy.modeTime >= 3000) {
            enemy.setMode('choose');
        }
    } else {
        if (enemy.modeTime > 500) {
            enemy.vx = enemy.vy = 0;
            const v = getVectorToNearbyTarget(state, enemy, 1000, enemy.area.allyTargets);
            if (v) {
                enemy.d = getDirection(v.x, v.y);
            }
        } else {
            enemy.vx *= 0.8;
            enemy.vy *= 0.8;
            moveEnemy(state, enemy, enemy.vx, enemy.vy, {});
        }
        if (enemy.modeTime >= 2000) {
            if (Math.random() < 0.6) {
                enemy.setMode('chase');
            } else if (Math.random() < 0.6) {
                enemy.setMode('charge');
            } else {
                enemy.setMode('storm');
            }
        }
    }
}

function teleportToNextMarker(this: void, state: GameState, guardian: Enemy): void {
    if (!guardian.params.usedMarkers) {
        guardian.params.usedMarkers = new Set();
    }
    const markerId = guardian.life <= 4 ? 'guardianMarkerHard' : 'guardianMarkerEasy';
    const markers = guardian.area.objects.filter(o => o.definition?.id === markerId && !guardian.params.usedMarkers.has(o));
    const marker = sample(markers);
    if (marker) {
        guardian.x = marker.x;
        guardian.y = marker.y;
        guardian.params.usedMarkers.add(marker);
    } else {
        console.error('Unable to find a new marker for guardian:', guardian);
    }
}
function updateGuardian(this: void, state: GameState, enemy: Enemy): void {
    if (!enemy.params.usedMarkers?.size) {
        enemy.params.usedMarkers = new Set();
        // Don't teleport until the hero is in the material world (otherwise they might appear next to them).
        if (state.hero.area !== enemy.area) {
            teleportToNextMarker(state, enemy);
        }
        return;
    }
}


