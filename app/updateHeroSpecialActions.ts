import { addEffectToArea, addObjectToArea, enterLocation, getAreaSize, playAreaSound, refreshAreaLogic } from 'app/content/areas';
import { AnimationEffect } from 'app/content/effects/animationEffect';
import { getVectorToTarget } from 'app/content/enemies';
import { Door } from 'app/content/objects/door';
import { destroyClone } from 'app/content/objects/clone';
import { Staff } from 'app/content/objects/staff';
import { CANVAS_HEIGHT, FALLING_HEIGHT, FRAME_LENGTH, GAME_KEY } from 'app/gameConstants';
import { editingState } from 'app/development/tileEditor';
import { getCloneMovementDeltas, wasGameKeyPressed } from 'app/keyCommands';
import { checkForFloorEffects, moveActor } from 'app/moveActor';
import { fallAnimation, heroAnimations } from 'app/render/heroAnimations';
import { saveGame } from 'app/state';
import { updateCamera } from 'app/updateCamera';
import { isUnderwater } from 'app/utils/actor';
import { createAnimation, frameAnimation } from 'app/utils/animations';
import {
    canSomersaultToCoords,
    directionMap,
    getDirection,
    getTileBehaviorsAndObstacles,
    hitTargets,
    rotateDirection,
} from 'app/utils/field';
import { boxesIntersect, isObjectInsideTarget, pad } from 'app/utils/index';
import Random from 'app/utils/Random';


import {
    GameState, Hero, ObjectInstance, StaffTowerLocation,
} from 'app/types';

const rollSpeed = [
    5, 5, 5, 5,
    4, 4, 4, 4,
    3, 3, 3, 3,
    2, 2, 2, 2,
];

const regenerationParticles
    = createAnimation('gfx/tiles/spiritparticlesregeneration.png', {w: 4, h: 4}, {cols: 4, duration: 6}).frames;


export function updateHeroSpecialActions(this: void, state: GameState, hero: Hero): boolean {
    const isPrimaryHero = hero === state.hero;
    const minZ = hero.groundHeight + (hero.isAstralProjection ? 4 : 0);
    // Handle super tile transitions.
    if (isPrimaryHero && state.nextAreaInstance) {
        hero.vx = 0;
        hero.vy = 0;
        // If we see issues with the screen transition code for super tiles,
        // update this logic to match the section transition code below and stop
        // the player at exactly the threshold.
        if (state.nextAreaInstance.cameraOffset.x) {
            // We need to make sure this is low enough that the character doesn't get entirely into the second column,
            // otherwise horizontal doors won't work as expected.\
            hero.x += 0.75 * state.nextAreaInstance.cameraOffset.x / Math.abs(state.nextAreaInstance.cameraOffset.x);
        }
        if (state.nextAreaInstance.cameraOffset.y) {
            const dy = state.nextAreaInstance.cameraOffset.y / Math.abs(state.nextAreaInstance.cameraOffset.y);
            if (dy > 0 && hero.y < 512 + 18) {
                hero.y += 0.7;
            } else if (dy < 0 && hero.y > -18) {
                hero.y -= 0.7;
            }
        }
        return true;
    }
    if (hero.isControlledByObject) {
        hero.animationTime += FRAME_LENGTH;
        // Objects must set this flag every frame to keep it set.
        hero.isControlledByObject = false;
        return true;
    }
    // Handle section transitions.
    const { section } = getAreaSize(state);
    if (isPrimaryHero && hero.x + hero.w > section.x + section.w) {
        hero.actionDx = Math.min(0, hero.actionDx);
        hero.vx = Math.min(0, hero.vx);
        hero.x = Math.max(hero.x - 1, section.x + section.w - hero.w);
        return true;
    } else if (isPrimaryHero && hero.x < section.x) {
        hero.actionDx = Math.max(0, hero.actionDx);
        hero.vx = Math.max(0, hero.vx);
        hero.x = Math.min(hero.x + 1, section.x);
        return true;
    } else if (isPrimaryHero && hero.y + hero.h > section.y + section.h) {
        hero.actionDy = Math.min(0, hero.actionDy);
        hero.vy = Math.min(0, hero.vy);
        hero.y = Math.max(hero.y - 1, section.y + section.h - hero.h);
        return true;
    } else if (isPrimaryHero && hero.y < section.y) {
        hero.actionDy = Math.max(0, hero.actionDy);
        hero.vy = Math.max(0, hero.vy);
        hero.y = Math.min(hero.y + 1, section.y);
        return true;
    }
    if (editingState.isEditing && isPrimaryHero) {
        // Hack to prevent player from being damaged or falling into pits while editing.
        hero.invulnerableFrames = 1;
        hero.action = 'roll';
        // Set this high to end the roll immediately on disabling edit mode.
        hero.actionFrame = 1000;
        const [dx, dy] = getCloneMovementDeltas(state, hero);
        hero.x += 4 * dx;
        hero.y += 4 * dy;
        // These probably need to be set to trigger screen transitions correctly.
        hero.vx = dx;
        hero.vy = dy;
        if (dx || dy) {
            hero.d = getDirection(dx, dy);
        }
        return true;
    }
    if (hero.action === 'falling' || hero.action === 'sinkingInLava') {
        hero.vx = 0;
        hero.vy = 0;
        if (hero.animationTime >= fallAnimation.duration) {
            hero.action = hero.action === 'falling' ? 'fallen' : 'sankInLava';
            hero.actionFrame = 0;
        }
        return true;
    }
    if (hero.action === 'fallen' || hero.action === 'sankInLava') {
        if (hero.action === 'fallen' && state.location.zoneKey === 'sky') {
            enterLocation(state, {
                zoneKey: 'overworld',
                floor: 0,
                areaGridCoords: state.location.areaGridCoords,
                x: hero.x,
                y: hero.y,
                z: CANVAS_HEIGHT,
                d: hero.d,
                isSpiritWorld: state.location.isSpiritWorld,
            }, false, () => {
                hero.action = 'knocked';
                const { section } = getAreaSize(state);
                let best: ObjectInstance = null, bestDistance: number;
                for (const object of state.areaInstance.objects) {
                    if (object.definition?.type !== 'spawnMarker') {
                        continue;
                    }
                    // Only consider markers in the current section.
                    if (object.x < section.x || object.x > section.x + section.w ||
                        object.y < section.y || object.y > section.y + section.h
                    ) {
                        continue;
                    }
                    const { mag } = getVectorToTarget(state, object, hero);
                    if (!best || mag < bestDistance) {
                        best = object;
                        bestDistance = mag;
                    }
                }
                if (best) {
                    hero.x = best.x;
                    hero.y = best.y;
                    updateCamera(state, 512);
                }
            });
            return true;
        }
        hero.vx = 0;
        hero.vy = 0;
        hero.actionFrame++;
        if (hero.actionFrame >= 8) {
            hero.d = hero.safeD;
            hero.x = hero.safeX;
            hero.y = hero.safeY;
            let damage = 1;
            if (hero.action === 'sankInLava') {
                damage = 8;
                if (hero.passiveTools.fireBlessing) {
                    damage /= 2;
                }
            }
            hero.takeDamage(state, damage);
            // stop updating this hero if it was a clone that got destroyed by taking damage.
            if (!hero.area) {
                return;
            }
            // For now leave the hero in the 'fallen' state if they died, otherwise they reappear
            // just fine when the continue/quit option shows up.
            // Once the death animation is added we can probably remove this check if we want.
            if (hero.life > 0) {
                hero.action = null;
            }
        }
        return true;
    }
    if (hero.action === 'getItem') {
        hero.vx = 0;
        hero.vy = 0;
        hero.actionFrame++;
        // The hero doesn't update while the loot item is displayed, so we don't
        // need to show this for many frames after the hero starts updating again.
        if (hero.actionFrame >= 5) {
            hero.action = null;
        }
        return true;
    }
    if (hero.action === 'beingCarried') {
        hero.animationTime = 0;
        // Currently a hero cannot act while being carried.
        // They can act again once thrown.
        return true;
    }
    if (hero.isUsingDoor) {
        const isUsingStairs = (hero.actionTarget as Door)?.isStairs?.(state);
        hero.action = 'walking';
        hero.animationTime += FRAME_LENGTH;
        // Automatically move the hero forward in the direction set by the door, ignoring obstacles.
        // Reduce speed to the regular screen transition speed if the player transitions screens while
        // moving through the door.
        const speed = isUsingStairs ? 0.75 : (state.nextAreaInstance ? 0.75 : 2);
        hero.x += speed * hero.actionDx;
        hero.y += speed * hero.actionDy;
        // This makes sure the hero displays as swimming/climbing.
        checkForFloorEffects(state, hero);
        // Check if the hero is done moving through the door meaning:
        // They are no longer intersecting the door object
        // They are in an open tile.
        const touchingTarget = hero.actionTarget && boxesIntersect(hero, hero.actionTarget.getHitbox(state));
        if (!touchingTarget && isHeroOnOpenTile(state, hero)) {
            hero.actionTarget = null;
            hero.isUsingDoor = false;
            hero.isExitingDoor = false;
            hero.safeD = hero.d;
            hero.safeX = hero.x;
            hero.safeY = hero.y;
        }
        return true;
    }
    if (hero.action === 'jumpingDown' && !editingState.isEditing) {
        // Maybe we should add a jumping down animation, but for now we play the roll
        // animation slowed down a bit.
        hero.animationTime += 8;
        // Freeze at the leaping frame, the flip looks bad if the jump isn't the right length.
        hero.animationTime = Math.min(hero.animationTime, 100);
        const groundZ = 0;
        // Once the hero is over their landing tile, they fall straight down until they hit the ground.
        if (!hero.jumpingVy && !hero.jumpingVx) {
            hero.z += hero.jumpingVz;
            hero.jumpingVz = Math.max(-2, hero.jumpingVz - 0.5);
            if (hero.z <= hero.groundHeight) {
                hero.z = hero.groundHeight;
                hero.action = null;
                hero.animationTime = 0;
                checkForFloorEffects(state, hero);
            }
            return true;
        }
        if (hero.jumpDirection === 'down') {
            // After the hero has jumped a bit, we stop the jump when they hit a position they can successfully move to.
            let shouldLand = false;
            // As the hero approaches each new row of tiles, check if they should land on this row of tiles.
            // The player can fall as many as 4 pixels per frame, so we check when the user is in the last 4 pixels
            // of the previous row.
            if (hero.y >= hero.jumpingDownY + 24 && (hero.y % 16 > 12 || hero.y % 16 === 0)) {
                const y = (((hero.y - 1) / 16) | 0) * 16 + 16;
                const excludedObjects = new Set([hero]);
                const { tileBehavior: b1 } = getTileBehaviorsAndObstacles(state, hero.area, {x: hero.x, y }, excludedObjects, state.nextAreaInstance);
                const { tileBehavior: b2 } = getTileBehaviorsAndObstacles(state, hero.area, {x: hero.x + hero.w - 1, y}, excludedObjects, state.nextAreaInstance);
                // console.log(hero.x, y, b1.solid, b1.cannotLand, b2.solid, b2.cannotLand);
                shouldLand = !b1.solid && !b2.solid && !b1.cannotLand && !b2.cannotLand;
            }
            if (shouldLand) {
                hero.y = (((hero.y - 1) / 16) | 0) * 16 + 16;
                hero.jumpingVy = 0;
                hero.jumpingVx = 0;
                hero.vz = hero.jumpingVz;
                return true;
            } else {
                hero.x += hero.jumpingVx;
                hero.y += hero.jumpingVy;
                hero.z += hero.jumpingVz;
                // Don't allow z to fall below 4 until landing so the shadow stays small while falling.
                if (hero.z <= 4) {
                    hero.y += (4 - hero.z);
                    hero.z = 4;
                }
                // Since the player can fall arbitrarily far when jumping in the 'down' direction,
                // we limit them with a terminal velocity of -2 (so net -4 vy when hitting min z value)
                hero.jumpingVz = Math.max(-2, hero.jumpingVz - 0.5);
            }
        } else {
            // When jumping any direction but down, the jump is precomputed so we just
            // move the character along the arc until they reach the ground.
            hero.x += hero.jumpingVx;
            hero.y += hero.jumpingVy;
            hero.z += hero.jumpingVz;
            hero.jumpingVz -= 0.5;
            // console.log([hero.x, hero.y, hero.z], ' -> ', [hero.jumpingVx, hero.jumpingVy, hero.jumpingVz]);
            if (hero.z <= groundZ) {
                hero.z = groundZ
                hero.action = null;
                hero.animationTime = 0;
                checkForFloorEffects(state, hero);
            }
        }
        // Make sure vx/vy are updated for screen transition/slipping logic on landing.
        hero.vx = hero.jumpingVx;
        hero.vy = hero.jumpingVy;
        return true;
    }
    if (hero.action === 'knocked' || hero.action === 'knockedHard' || hero.action === 'thrown') {
        if (hero.isUncontrollable) {
            hero.explosionTime += FRAME_LENGTH;
        }
        hero.z += hero.vz;
        hero.vz = Math.max(-8, hero.vz - 0.5);
        // Clones ignore collisions with heroes/other clones when being thrown or knocked.
        const excludedObjects = new Set<ObjectInstance>([state.hero, ...state.hero.clones]);
        // The hero obeys normal collision detection when being knocked around, but they won't trigger effects
        // like jumping off of cliffs or pushing objects.
        moveActor(state, hero, hero.vx, hero.vy, {
            canFall: true,
            canSwim: true,
            canPassMediumWalls: hero.action === 'thrown' && hero.z >= 12,
            direction: hero.d,
            boundToSection: hero.action !== 'knockedHard',
            excludedObjects
        });
        // The astral projection stays 4px off the ground.
        if (hero.z <= minZ) {
            if (hero.vz <= -8) {
                const { tileBehavior } = getTileBehaviorsAndObstacles(state, hero.area, {x: hero.x, y: hero.y }, excludedObjects, state.nextAreaInstance);
                if (!tileBehavior?.water && !tileBehavior?.pit) {
                    state.screenShakes.push({
                        dx: 0, dy: 2, startTime: state.fieldTime, endTime: state.fieldTime + 200
                    });
                }
            }
            // If a thrown hero lands in a wall, destroy it.
            // If this is the last hero, they will just go back to
            // their last safe point. This typically happens when
            // trying to throw clones over obstacles.
            if (hero.action === 'thrown') {
                if (!canSomersaultToCoords(state, hero, hero)) {
                    destroyClone(state, hero);
                    return;
                }
            }
            hero.z = minZ;
            hero.action = null;
            hero.vz = 0;
        }
        return true;
    }
    if (hero.action === 'usingStaff' && hero.frozenDuration > 0) {
        hero.action = null;
    }
    if (hero.action === 'usingStaff') {
        const jumpDuration = heroAnimations.staffJump[hero.d].duration;
        const slamDuration = heroAnimations.staffSlam[hero.d].duration;
       // console.log(hero.animationTime, jumpDuration, slamDuration);
        if (hero.animationTime < jumpDuration - FRAME_LENGTH) {
            hero.vz = 1 - 1 * hero.animationTime / jumpDuration;
            hero.z += hero.vz;
            const mx = hero.x % 16;
            const my = hero.y % 16;
            if (hero.d === 'up' || hero.d === 'down') {
                if (mx >= 8 && mx < 14) {
                    hero.x++;
                }
                if (mx < 8 && mx > 2) {
                    hero.x--;
                }
            } else {
                if (my >= 8 && my < 14) {
                    hero.y++;
                }
                if (my < 8 && my > 2) {
                    hero.y--;
                }
            }
        } else if (hero.animationTime === jumpDuration - FRAME_LENGTH) {
            hero.vz = -4;
            hero.z = Math.max(hero.z + hero.vz, minZ);
        } else if (hero.animationTime === jumpDuration) {
            // If the hero is facing up, check if we should set up the tower instead of using it as a tool.
            if (hero.d === 'up') {
                let towerLocation: StaffTowerLocation, onTowerMarker = false;
                const hitbox = hero.getHitbox(state);
                for (const object of hero.area.definition.objects) {
                    if (object.id === 'towerTerminal:desert') {
                        towerLocation = 'desert';
                        break;
                    }
                    if (object.id === 'towerTerminal:mountain') {
                        towerLocation = 'mountain';
                        break;
                    }
                    if (object.id === 'towerTerminal:forest') {
                        towerLocation = 'forest';
                        break;
                    }
                }
                for (const object of hero.area.objects) {
                    if (object.definition?.id === 'towerMarker') {
                        if (isObjectInsideTarget(hitbox, pad(object.getHitbox(state), 6))) {
                            onTowerMarker = true;
                            break;
                        }
                    }
                }
                if (towerLocation && onTowerMarker) {
                    state.savedState.staffTowerLocation = towerLocation as StaffTowerLocation;
                    state.hero.activeTools.staff = 1;
                    refreshAreaLogic(state, hero.area);
                    saveGame();
                    return;
                }
            }
            hero.z = Math.max(hero.z + hero.vz, minZ);
            const staffLevel = state.hero.activeTools.staff;
            const maxLength = staffLevel > 1 ? 64 : 4;
            const staff = new Staff(state, {
                x: hero.x + 8 + 12 * directionMap[hero.d][0],
                y: hero.y + 8 + 12 * directionMap[hero.d][1],
                damage: 4 * staffLevel,
                direction: hero.d,
                element: hero.element,
                maxLength,
            });
            if (!staff.invalid) {
                state.activeStaff = staff;
                addObjectToArea(state, state.areaInstance, staff);
            }
            playAreaSound(state, state.areaInstance, 'bossDeath');
            hitTargets(state, state.areaInstance, {
                damage: 4 * staffLevel,
                hitbox: {
                    x: staff.leftColumn * 16 - 2,
                    y: staff.topRow * 16 - 2,
                    w: (staff.rightColumn - staff.leftColumn + 1) * 16 + 4,
                    h: (staff.bottomRow - staff.topRow + 1) * 16 + 4,
                },
                hitEnemies: true,
                knockAwayFromHit: true,
                isStaff: true,
            });
            hitTargets(state, state.areaInstance, {
                hitbox: {
                    x: staff.leftColumn * 16,
                    y: staff.topRow * 16,
                    w: (staff.rightColumn - staff.leftColumn + 1) * 16,
                    h: (staff.bottomRow - staff.topRow + 1) * 16,
                },
                hitObjects: true,
                isStaff: true,
            });
            state.screenShakes.push({
                dx: 0, dy: staffLevel > 1 ? 5 : 2, startTime: state.fieldTime, endTime: state.fieldTime + 200
            });
        } else if (hero.animationTime < jumpDuration + slamDuration) {
             hero.z = Math.max(hero.z + hero.vz, minZ);
        } else if (hero.animationTime >= jumpDuration + slamDuration) {
            hero.action = null;
        }
        return true;
    }
    const isFallingToGround = !isUnderwater(state, hero)
        && hero.z > minZ && (hero.equipedBoots !== 'cloudBoots' || hero.z > FALLING_HEIGHT);
    if (isFallingToGround) {
        hero.action = null;
        hero.z += hero.vz;
        hero.vz = Math.max(-8, hero.vz - 0.5);
        if (hero.z <= minZ) {
            hero.z = minZ;
            hero.vz = 0;
        }
        moveActor(state, hero, hero.vx, hero.vy, {
            canFall: true,
            canSwim: true,
            direction: hero.d,
        });
        return true;
    }
    if (hero.action === 'roll') {
        if (wasGameKeyPressed(state, GAME_KEY.ROLL)
            && hero.passiveTools.roll > 1
            && hero.actionFrame > 4
            && state.hero.magic > 0
        ) {
            state.hero.magic -= 10;
            // Cloud somersault roll activated by rolling again mid roll.
            const [dx, dy] = getCloneMovementDeltas(state, hero);
            hero.d = (dx || dy) ? getDirection(dx, dy) : hero.d;
            // Default direction is the direction the current roll uses.
            const defaultDirection = getDirection(hero.actionDx, hero.actionDy, true, hero.d);
            const direction = getDirection(dx, dy, true, defaultDirection);
            const moveX = directionMap[direction][0] * 8, moveY = directionMap[direction][1] * 8;
            const originalArea = hero.area, alternateArea = hero.area.alternateArea;
            let hitbox = hero.getHitbox(state);
            const leftD = rotateDirection(direction, 1);
            const leftDx = directionMap[leftD][0], leftDy = directionMap[leftD][1];
            const particleCount = 9;
            for (let i = 0; i < particleCount; i++) {
                const frame = Random.element(regenerationParticles);
                // This makes a verticle ring around the axis the player is teleporting,
                // with some variance, and also moving in the direction of movement.
                const vx = 2 * leftDx * Math.cos(i * 2 * Math.PI / particleCount) - 0.5 + Math.random() - 2 * dx;
                const vy = 2 * leftDy * Math.cos(i * 2 * Math.PI / particleCount) - 0.5 + Math.random() - 2 * dy;
                const vz = 2 * Math.sin(i * 2 * Math.PI / particleCount);
                const particle = new AnimationEffect({
                    animation: frameAnimation(frame),
                    drawPriority: 'sprites',
                    // These values make the particles implod in a ring.
                    x: hitbox.x + hitbox.w / 2 + 8 * vx, y: hitbox.y + hitbox.h / 2 + 8 * vy, z: 8 + 12 * vz,
                    vx: -vx, vy: -vy, vz: -vz,
                    ttl: 200,
                });
                addEffectToArea(state, hero.area, particle);
            }
            const lastOpenPosition = {x: hero.x, y: hero.y};
            // Move 8px at a time 6 times in either area.
            for (let i = 0; i < 6; i++) {
                let result = moveActor(state, hero, moveX, moveY, {
                    canFall: true,
                    canSwim: true,
                    direction: hero.d,
                    boundToSection: true,
                });
                if (result.mx || result.my) {
                    if (canSomersaultToCoords(state, hero, {x: hero.x, y: hero.y})) {
                        lastOpenPosition.x = hero.x;
                        lastOpenPosition.y = hero.y;
                    }
                    continue;
                }
                hero.area = alternateArea;
                result = moveActor(state, hero, moveX, moveY, {
                    canFall: true,
                    canSwim: true,
                    direction: hero.d,
                    boundToSection: true,
                });
                hero.area = originalArea;
                if (!result.mx && !result.my) {
                    break;
                }
                if (canSomersaultToCoords(state, hero, {x: hero.x, y: hero.y})) {
                    lastOpenPosition.x = hero.x;
                    lastOpenPosition.y = hero.y;
                }
            }
            hero.x = lastOpenPosition.x;
            hero.y = lastOpenPosition.y;
            hitbox = hero.getHitbox(state);
            for (let i = 0; i < particleCount; i++) {
                const frame = Random.element(regenerationParticles);
                // This makes a verticle ring around the axis the player is teleporting,
                // with some variance, and also moving in the direction of movement.
                const vx = leftDx * Math.cos(i * 2 * Math.PI / particleCount) - 0.5 + Math.random() + 3 * dx;
                const vy = leftDy * Math.cos(i * 2 * Math.PI / particleCount) - 0.5 + Math.random() + 3 * dy;
                const vz = Math.sin(i * 2 * Math.PI / particleCount) * 0.7;
                const particle = new AnimationEffect({
                    animation: frameAnimation(frame),
                    drawPriority: 'sprites',
                    x: hitbox.x + hitbox.w / 2 + vx, y: hitbox.y + hitbox.h / 2 + vy, z: 8 + vz,
                    vx, vy, vz,
                    ttl: 400,
                });
                addEffectToArea(state, hero.area, particle);
            }
            // The fullroll action is 16 frames.
            hero.actionFrame = 0;
            hero.animationTime = 0 * FRAME_LENGTH;
            hero.actionDx = directionMap[direction][0];
            hero.actionDy = directionMap[direction][1];
            return true;
        }
        if (hero.actionFrame >= rollSpeed.length) {
            hero.action = null;
            hero.animationTime = 0;
            // Don't allow rolling for two frames after completing a roll.
            // This helps keep players from rolling over pits.
            hero.rollCooldown = 40;
        } else {
            const direction = getDirection(hero.actionDx, hero.actionDy, true, hero.d);
            hero.vx = directionMap[direction][0] * rollSpeed[hero.actionFrame];
            hero.vy = directionMap[direction][1] * rollSpeed[hero.actionFrame];
            hero.actionFrame++;
            if (hero.z >= minZ) {
                hero.z = Math.max(minZ, hero.z - 0.4);
            }
            moveActor(state, hero, hero.vx, hero.vy, {
                canFall: true,
                canSwim: true,
                direction: hero.d,
            });
        }
        return true;
    }
    if (hero.frozenDuration > 0) {
        hero.frozenDuration--;
        hero.vx *= 0.99;
        hero.vy *= 0.99;
        moveActor(state, hero, hero.vx, hero.vy, {
            canFall: true,
            canSwim: true,
            direction: hero.d,
        });
        return true;
    }
    return false;
}

function isHeroOnOpenTile(this: void, state: GameState, hero: Hero) {
    const L = hero.x + 3, R = hero.x + hero.w - 4, T = hero.y + 3, B = hero.y + hero.h - 4;
    const points = [{x: L, y: T}, {x: R, y: T}, {x: L, y: B}, {x: R, y: B}];
    const excludedObjects = new Set([hero]);
    for (const point of points) {
        const { tileBehavior } = getTileBehaviorsAndObstacles(state, hero.area, point, excludedObjects, state.nextAreaInstance);
        if (tileBehavior.solid) {
            return false
        }
    }
    return true;
}

