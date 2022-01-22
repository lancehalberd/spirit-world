import { addObjectToArea, enterLocation, getAreaSize, playAreaSound } from 'app/content/areas';
import { Door } from 'app/content/objects/door';
import { Staff } from 'app/content/objects/staff';
import { CANVAS_HEIGHT, FRAME_LENGTH } from 'app/gameConstants';
import { editingState } from 'app/development/tileEditor';
import { getCloneMovementDeltas } from 'app/keyCommands';
import { checkForFloorEffects, moveActor } from 'app/moveActor';
import { fallAnimation, heroAnimations } from 'app/render/heroAnimations';
import { isUnderwater } from 'app/utils/actor';
import { directionMap, getDirection, getTileBehaviorsAndObstacles, hitTargets } from 'app/utils/field';
import { boxesIntersect } from 'app/utils/index';


import {
    GameState, Hero, ObjectInstance,
} from 'app/types';

const maxCloudBootsZ = 3;

const rollSpeed = [
    5, 5, 5, 5,
    4, 4, 4, 4,
    3, 3, 3, 3,
    2, 2, 2, 2,
];

export function updateHeroSpecialActions(this: void, state: GameState, hero: Hero): boolean {
    const isPrimaryHero = hero === (state.hero.activeClone || state.hero);
    const minZ = hero.isAstralProjection ? 4 : 0;
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
            if (hero.z <= 0) {
                hero.z = 0;
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
        hero.z += hero.vz;
        hero.vz = Math.max(-8, hero.vz - 0.5);
        // Clones ignore collisions with heroes/other clones when being thrown or knocked.
        const excludedObjects = new Set<ObjectInstance>([state.hero, ...state.hero.clones]);
        // The hero obeys normal collision detection when being knocked around, but they won't trigger effects
        // like jumping off of cliffs or pushing objects.
        moveActor(state, hero, hero.vx, hero.vy, {
            canFall: true,
            canSwim: true,
            direction: hero.d,
            boundToSection: hero.action !== 'knockedHard',
            excludedObjects
        });
        // The astral projection stays 4px off the ground.
        if (hero.z <= minZ) {
            hero.z = minZ;
            hero.action = null;
            hero.vz = 0;
        }
        return true;
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
                if (mx >= 8 && mx < 15) {
                    hero.x++;
                }
                if (mx < 8 && mx < 15) {
                    hero.x--;
                }
            } else {
                if (my >= 8 && my < 15) {
                    hero.y++;
                }
                if (my < 8 && my < 15) {
                    hero.y--;
                }
            }
        } else if (hero.animationTime === jumpDuration - FRAME_LENGTH) {
            hero.vz = -4;
            hero.z = Math.max(hero.z + hero.vz, minZ);
        } else if (hero.animationTime === jumpDuration) {
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
            state.activeStaff = staff;
            addObjectToArea(state, state.areaInstance, staff);
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
                hitObjects: true,
                knockAwayFromHit: true,
            });
        } else if (hero.animationTime < jumpDuration + slamDuration) {
             hero.z = Math.max(hero.z + hero.vz, minZ);
        } else if (hero.animationTime >= jumpDuration + slamDuration) {
            hero.action = null;
        }
        return true;
    }
    const isFallingToGround = !isUnderwater(state, hero)
        && hero.z > minZ && (!hero.equipedGear.cloudBoots || hero.z > maxCloudBootsZ);
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
        if (hero.actionFrame >= rollSpeed.length) {
            hero.action = null;
            hero.animationTime = 0;
            // Don't allow rolling for two frames after completing a roll.
            // This helps keep players from rolling over pits.
            hero.rollCooldown = 40;
        } else {
            hero.vx = directionMap[hero.d][0] * rollSpeed[hero.actionFrame];
            hero.vy = directionMap[hero.d][1] * rollSpeed[hero.actionFrame];
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

