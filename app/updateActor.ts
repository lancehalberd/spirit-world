import { find } from 'lodash';

import {
    addObjectToArea, destroyTile, enterLocation, getAreaFromLocation, getAreaSize,
    removeAllClones, removeObjectFromArea, scrollToArea, setNextAreaSection,
    swapHeroStates,
} from 'app/content/areas';
import { destroyClone } from 'app/content/clone';
import { CloneExplosionEffect } from 'app/content/effects/CloneExplosionEffect';
import { AirBubbles } from 'app/content/objects/airBubbles';
import { Enemy } from 'app/content/enemy';
import { AstralProjection } from 'app/content/objects/astralProjection';
import { zones } from 'app/content/zones';
import { editingState } from 'app/development/tileEditor';
import { CANVAS_HEIGHT, EXPLOSION_TIME, FRAME_LENGTH, GAME_KEY, MAX_SPIRIT_RADIUS } from 'app/gameConstants';
import { getActorTargets } from 'app/getActorTargets';
import {
    getCloneMovementDeltas,
    isGameKeyDown,
    wasGameKeyPressed,
    wasGameKeyPressedAndReleased,
} from 'app/keyCommands';
import { checkForFloorEffects, moveActor } from 'app/moveActor';
import { fallAnimation } from 'app/render/heroAnimations';
import { useTool } from 'app/useTool';
import { isHeroFloating, isHeroSinking } from 'app/utils/actor';
import {
    canTeleportToCoords,
    directionMap,
    getDirection,
    getTileBehaviorsAndObstacles,
    isPointOpen,
} from 'app/utils/field';
import { boxesIntersect, rectanglesOverlap } from 'app/utils/index';
import { playSound } from 'app/utils/sounds';

import {
    FullTile, GameState, HeldChakram, Hero,
    ObjectInstance, ThrownChakram, TileCoords,
} from 'app/types';

const rollSpeed = [
    5, 5, 5, 5,
    4, 4, 4, 4,
    3, 3, 3, 3,
    2, 2, 2, 2,
];

export function updateAllHeroes(this: void, state: GameState) {
    // Switching clones is done outside of updateHero, otherwise the switch gets processed by each clone.
    if (state.hero.clones.length && !state.hero.pickUpObject && (
            (state.hero.leftTool === 'clone' && wasGameKeyPressedAndReleased(state, GAME_KEY.LEFT_TOOL))
            || (state.hero.rightTool === 'clone' && wasGameKeyPressedAndReleased(state, GAME_KEY.RIGHT_TOOL))
    )) {
        //const currentIndex = state.hero.clones.indexOf(state.hero.activeClone);
        //state.hero.activeClone = state.hero.clones[currentIndex + 1];
        swapHeroStates(state.hero, state.hero.clones[0]);
        state.hero.clones.push(state.hero.clones.shift());
    }
    for (const clone of state.hero.clones) {
        updateHero(state, clone);
    }
    // Destroy existing astral projection if it isn't in the right area.
    if (state.hero.astralProjection && state.hero.astralProjection.area !== state.hero.area.alternateArea) {
        removeObjectFromArea(state, state.hero.astralProjection);
        state.hero.astralProjection = null;
    }
    if (state.hero.astralProjection) {
        if (state.hero.spiritRadius > 0) {
            updateHero(state, state.hero.astralProjection);
        } else {
            removeObjectFromArea(state, state.hero.astralProjection);
            state.hero.astralProjection = null;
        }
    }
    updateHero(state, state.hero);
}

export function isHeroOnOpenTile(this: void, state: GameState, hero: Hero) {
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

export function updateHero(this: void, state: GameState, hero: Hero) {
    // Remove action targets from old areas.
    if (hero.actionTarget && hero.actionTarget.area !== hero.area) {
        hero.actionTarget = null;
    }
    if (hero.isControlledByObject) {
        hero.animationTime += FRAME_LENGTH;
        updateScreenTransition(state, hero);
        // Objects must set this flag every frame to keep it set.
        hero.isControlledByObject = false;
        return;
    }
    if (hero.isUsingDoor) {
        hero.action = 'walking';
        hero.animationTime += FRAME_LENGTH;
        // Automatically move the hero forward in the direction set by the door, ignoring obstacles.
        // Reduce speed to the regular screen transition speed if the player transitions screens while
        // moving through the door.
        const speed = state.nextAreaInstance ? 0.75 : 2;
        hero.x += speed * hero.actionDx;
        hero.y += speed * hero.actionDy;
        // This makes sure the hero displays as swimming/climbing.
        checkForFloorEffects(state, hero);
        updateScreenTransition(state, hero);
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
        return;
    }
    if (hero.action === 'jumpingDown' && !editingState.isEditing) {
        // Maybe we should add a jumping down animation, but for now we play the roll
        // animation slowed down a bit.
        hero.animationTime += 8;
        // Freeze at the leaping frame, the flip looks bad if the jump isn't the right length.
        hero.animationTime = Math.min(hero.animationTime, 100);
        const groundZ = hero.equipedGear?.cloudBoots ? 1 : 0;
        // Once the hero is over their landing tile, they fall straight down until they hit the ground.
        if (!hero.jumpingVy && !hero.jumpingVx) {
            hero.z += hero.jumpingVz;
            hero.jumpingVz = Math.max(-2, hero.jumpingVz - 0.5);
            if (hero.z <= groundZ) {
                hero.z = groundZ;
                hero.action = null;
                hero.animationTime = 0;
                checkForFloorEffects(state, hero);
            }
            return;
        }
        if (hero.jumpDirection === 'down') {
            // After the hero has jumped a bit, we stop the jump when they hit a position they can successfully move to.
            let shouldLand = false;
            // As the hero approaches each new row of tiles, check if they should land on this row of tiles.
            // The player can fall as many as 4 pixels per frame, so we check when the user is in the last 4 pixels
            // of the previous row.
            if (hero.y >= hero.jumpingDownY + 8 && (hero.y % 16 > 12 || hero.y % 16 === 0)) {
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
                return;
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
        updateScreenTransition(state, hero);
        return;
    }
    if (hero.invulnerableFrames > 0) {
        hero.invulnerableFrames--;
    }
    const area = hero.area;
    let dx = 0, dy = 0;
    let movementSpeed = 2;
    if (hero.equipedGear?.ironBoots) {
        movementSpeed *= 0.5;
    } else if (hero.equipedGear?.cloudBoots) {
        movementSpeed *= 2;
    }

    const { section } = getAreaSize(state);

    const isCloneToolDown = (state.hero.leftTool === 'clone' && isGameKeyDown(state, GAME_KEY.LEFT_TOOL))
        || (state.hero.rightTool === 'clone' && isGameKeyDown(state, GAME_KEY.RIGHT_TOOL));
    const primaryClone = state.hero.activeClone || state.hero;
    const isAstralProjection = hero.isAstralProjection;
    const isControlled = (state.hero.action === 'meditating' && isAstralProjection) || isCloneToolDown || hero === primaryClone;

    const minZ = isAstralProjection ? 4 : (hero.equipedGear?.cloudBoots ? 1 : 0);
    if (hero.z < minZ) {
        hero.z = Math.max(hero.z + 1, minZ);
    }
    const isFrozen = hero.frozenDuration > 0;
    // Unless wearing the iron boots, the hero is always slipping while frozen.
    if (isFrozen && !hero.equipedGear?.ironBoots) {
        hero.slipping = true;
    }
    const canCharge = !isAstralProjection && isControlled && hero.z <= minZ
        && !hero.swimming && !hero.pickUpTile && !hero.pickUpObject && !isFrozen;
    const canAttack = canCharge && hero.weapon > 0 && !hero.chargingLeftTool && !hero.chargingRightTool
         && (!hero.action || hero.action === 'walking' || hero.action === 'pushing');
    // This might be a better approach than setting movementSpeed = 0, we could just set this flag to false.
    //const canMove = isControlled && hero.z <= minZ && !isFrozen

    // The astral projection uses the weapon tool as the passive tool button
    // since you have to hold the normal passive tool button down to meditate.
    const wasPassiveButtonPressed = isAstralProjection
        ? wasGameKeyPressed(state, GAME_KEY.WEAPON)
        : wasGameKeyPressed(state, GAME_KEY.PASSIVE_TOOL);
    const isPassiveButtonDown = isAstralProjection
        ? isGameKeyDown(state, GAME_KEY.WEAPON)
        : isGameKeyDown(state, GAME_KEY.PASSIVE_TOOL);
    if (hero.slipping) {
        hero.vx *= 0.99;
        hero.vy *= 0.99;
    }
    if (isFrozen) {
        movementSpeed = 0;
        hero.frozenDuration -= FRAME_LENGTH;
    }

    const heldChakram = hero.area.objects.find(o => o instanceof HeldChakram) as HeldChakram;
    // Automatically move the character into the bounds of the current section.
    if (editingState.isEditing && isControlled) {
        movementSpeed = 0;
        // Hack to prevent player from being damaged or falling into pits while editing.
        hero.invulnerableFrames = 1;
        hero.action = 'roll';
        hero.actionFrame = rollSpeed.length - 1;
        [dx, dy] = getCloneMovementDeltas(state, hero);
        hero.x += 4 * dx;
        hero.y += 4 * dy;
        hero.vx = dx;
        hero.vy = dy;
        if (dx || dy) hero.d = getDirection(dx, dy);
    } else if (hero.swimming && hero.equipedGear?.ironBoots && state.underwaterAreaInstance &&
        isPointOpen(state, state.underwaterAreaInstance, {x: hero.x + hero.w / 2, y: hero.y + hero.h / 2}, {canSwim: true})
    ) {
        const mx = hero.x % 16;
        if (mx > 0 && mx < 8) {
            hero.x = Math.max(hero.x - mx, hero.x - 1);
        } else if (mx >= 8) {
            hero.x = Math.min(hero.x - mx + 16, hero.x + 1);
        }
        const my = hero.y % 16;
        if (my > 0 && my < 8) {
            hero.y = Math.max(hero.y - my, hero.y - 1);
        } else if (my >= 8) {
            hero.y = Math.min(hero.y - my + 16, hero.y + 1);
        }
        if (hero.x % 16 === 0 && hero.y % 16 === 0) {
            enterLocation(state, {
                ...state.location,
                floor: zones[state.zone.underwaterKey].floors.length - 1,
                zoneKey: state.zone.underwaterKey,
                x: hero.x,
                y: hero.y,
                z: 24,
            }, false);
            hero.swimming = false;
            hero.wading = false;
        }
        return;
    } else if (isHeroFloating(state, hero)) {
        hero.z = Math.min(24, hero.z + 1);
        if (hero.z >= 24 && state.surfaceAreaInstance) {
            // You can only surface in areas of deep water, that is, where you would be swimming.
            const testHero = hero.getCopy();
            testHero.z = 0;
            testHero.area = state.surfaceAreaInstance;
            checkForFloorEffects(state, testHero);
            // If the test hero is swimming, we can surface here.
            if (testHero.swimming) {
                enterLocation(state, {
                    ...state.location,
                    zoneKey: state.zone.surfaceKey,
                    floor: 0,
                    x: hero.x,
                    y: hero.y,
                    z: 0,
                }, false);
                hero.swimming = true;
            }
        }
    } else if (isHeroSinking(state, hero)) {
        hero.z = Math.max(hero.z - 2, 0);
    } else if (!isAstralProjection && state.nextAreaInstance) {
        movementSpeed = 0;
        hero.vx = 0;
        hero.vy = 0;
        if (state.nextAreaInstance.cameraOffset.x) {
            // We need to make sure this is low enough that the character doesn't get entirely into the second column,
            // otherwise horizontal doors won't work as expected.
            //dx = 0.75 * state.nextAreaInstance.cameraOffset.x / Math.abs(state.nextAreaInstance.cameraOffset.x);
            hero.x += 0.75 * state.nextAreaInstance.cameraOffset.x / Math.abs(state.nextAreaInstance.cameraOffset.x);
        }
        if (state.nextAreaInstance.cameraOffset.y) {
            //dy = 1 * state.nextAreaInstance.cameraOffset.y / Math.abs(state.nextAreaInstance.cameraOffset.y);
            const dy = state.nextAreaInstance.cameraOffset.y / Math.abs(state.nextAreaInstance.cameraOffset.y);
            if (dy > 0 && hero.y < 512 + 32) {
                hero.y += 0.5;
            } else if (dy < 0 && hero.y > - 32) {
                hero.y -= 0.5;
            }
        }
    } else if (!isAstralProjection && hero.x + hero.w > section.x + section.w + 1) {
        movementSpeed = 0;
        hero.vx = 0;
        hero.vy = 0;
        hero.x -= 0.5;
        //dx = -1;
    } else if (!isAstralProjection && hero.x < section.x - 1) {
        movementSpeed = 0;
        hero.vx = 0;
        hero.vy = 0;
        hero.x += 0.5;
        //dx = 1;
    } else if (!isAstralProjection && hero.y + hero.h > section.y + section.h + 1) {
        movementSpeed = 0;
        hero.vx = 0;
        hero.vy = 0;
        hero.y -= 0.5;
        //dy = -1;
    } else if (!isAstralProjection && hero.y < section.y - 1) {
        movementSpeed = 0;
        hero.vx = 0;
        hero.vy = 0;
        hero.y += 0.5;
        //dy = 1;
    } else if (!isAstralProjection && hero.action === 'climbing') {
        movementSpeed *= 0.5;
    }  else if (!isAstralProjection && hero.action === 'falling') {
        movementSpeed = 0;
        hero.vx = 0;
        hero.vy = 0;
        if (hero.animationTime >= fallAnimation.duration) {
            hero.action = 'fallen';
            hero.actionFrame = 0;
        }
    } else if (!isAstralProjection && hero.action === 'fallen') {
        if (state.location.zoneKey === 'sky') {
            enterLocation(state, {
                zoneKey: 'overworld',
                floor: 0,
                areaGridCoords: state.location.areaGridCoords,
                x: hero.x,
                y: hero.y,
                z: CANVAS_HEIGHT,
                d: hero.d,
                isSpiritWorld: state.location.isSpiritWorld,
            }, false);
            return;
        }
        movementSpeed = 0;
        hero.vx = 0;
        hero.vy = 0;
        hero.actionFrame++;
        if (hero.actionFrame >= 8) {
            hero.d = hero.safeD;
            hero.x = hero.safeX;
            hero.y = hero.safeY;
            hero.takeDamage(state, 1);
            // For now leave the hero in the 'fallen' state if they died, otherwise they reappear
            // just fine when the continue/quit option shows up.
            // Once the death animation is added we can probably remove this check if we want.
            if (hero.life > 0) {
                hero.action = null;
            }
        }
    } else if (!isAstralProjection && hero.action === 'beingCarried') {
        // The clone will update itself to match its carrier.
        hero.animationTime = 0;
        movementSpeed = 0;
        hero.vx = 0;
        hero.vy = 0;
    } else if (hero.action === 'getItem') {
        movementSpeed = 0;
        hero.vx = 0;
        hero.vy = 0;
        hero.actionFrame++;
        // The hero doesn't update while the loot item is displayed, so we don't
        // need to show this for many frames after the hero starts updating again.
        if (hero.actionFrame >= 5) {
            hero.action = null;
        }
    } else if (!isAstralProjection && hero.swimming && hero.action !== 'knocked') {
        movementSpeed *= 0.75;
        // Abort any unsupported actions while swimming.
        if (hero.action !== 'walking') {
            hero.action = null;
        }
    } else if (!isFrozen && hero.action === 'grabbing') {
        movementSpeed = 0;
        hero.vx = 0;
        hero.vy = 0;
        if (hero.grabObject && hero.grabObject.area !== hero.area) {
            hero.action = null;
            hero.grabObject = null;
        } else if (hero.grabObject?.pullingHeroDirection) {
            dx = directionMap[hero.grabObject.pullingHeroDirection][0];
            dy = directionMap[hero.grabObject.pullingHeroDirection][1];
        } else if (!hero.pickUpTile && !hero.pickUpObject && !isPassiveButtonDown) {
            hero.action = null;
            hero.grabTile = null;
            hero.grabObject = null;
        } else if (isControlled && hero.grabObject?.onPull) {
            const [pulldx, pulldy] = getCloneMovementDeltas(state, hero);
            if (pulldx || pulldy) {
                const direction = getDirection(pulldx, pulldy);
                const points = [0, 5, 10, 15];
                // There is special logic for pushing in the direction the hero is facing since we expect that
                // direction to be blocked by the object they are grabbing.
                const excludedObjects = new Set([hero, hero.grabObject]);
                if ((direction === hero.d && (hero.x === hero.grabObject.x || hero.y === hero.grabObject.y))
                    || points.every(x => points.every(y => isPointOpen(state, hero.area,
                        {x: hero.x + x + 16 * directionMap[direction][0], y: hero.y + y + 16 * directionMap[direction][1] },
                        { canFall: true, canSwim: true },
                        excludedObjects
                    )))
                ) {
                    hero.grabObject.onPull(state, direction, hero);
                } else {
                    const wiggleDistance = 14;
                    // If the player is not positioned correctly to pull the object, instead of pulling,
                    // attempt to wiggle them in better alignment with the object.
                    if (hero.x > hero.grabObject.x - wiggleDistance && hero.x < hero.grabObject.x) {
                        dx = Math.min(1, hero.grabObject.x - hero.x);
                    } else if (hero.x < hero.grabObject.x + wiggleDistance && hero.x > hero.grabObject.x) {
                        dx = Math.max(-1, hero.grabObject.x - hero.x);
                    }
                    if (hero.y > hero.grabObject.y - wiggleDistance && hero.y < hero.grabObject.y) {
                        dy = Math.min(1, hero.grabObject.y - hero.y);
                    } else if (hero.y < hero.grabObject.y + wiggleDistance && hero.y > hero.grabObject.y) {
                        dy = Math.max(-1, hero.grabObject.y - hero.y);
                    }
                }
            }
        }
    } else if (hero.pickUpTile || hero.pickUpObject) {
        movementSpeed *= 0.75;
    } else if (!isFrozen && hero.action === 'throwing' ) {
        movementSpeed = 0;
        hero.actionFrame++;
        if (hero.actionFrame === 2) {
            hero.action = null;
        }
    } else if (!isAstralProjection && !isFrozen && hero.action === 'meditating') {
        movementSpeed = 0;
        if (isControlled && isGameKeyDown(state, GAME_KEY.PASSIVE_TOOL) && hero.magic > 0) {
            if (state.hero.clones.length) {
                // Meditating as a clone will either blow up the current clone, or all clones
                // except the current if the clone tool is being pressed.
                if (!isCloneToolDown || hero !== primaryClone) {
                    hero.explosionTime += FRAME_LENGTH;
                    if (hero.explosionTime >= EXPLOSION_TIME) {
                        hero.action = null;
                        hero.explosionTime = 0;
                        playSound('cloneExplosion');
                        addObjectToArea(state, hero.area, new CloneExplosionEffect({
                            x: hero.x + hero.w / 2,
                            y: hero.y + hero.h / 2,
                        }));
                        destroyClone(state, hero);
                        return;
                    }
                } else {
                    // You cannot meditate while you have clones spawned.
                    hero.action = null;
                }
            } else {
                const maxRadius = MAX_SPIRIT_RADIUS;
                hero.spiritRadius = Math.min(hero.spiritRadius + 4, maxRadius);
                if (hero.passiveTools.astralProjection && hero.area.alternateArea) {
                    if (!hero.astralProjection) {
                        hero.astralProjection = new AstralProjection(hero);
                        addObjectToArea(state, hero.area.alternateArea, hero.astralProjection);
                    }
                }
            }
        } else {
            hero.explosionTime = 0;
            hero.spiritRadius = Math.max(hero.spiritRadius - 8, 0);
            if (hero.astralProjection) {
                hero.astralProjection.d = hero.d;
            }
            if (hero.spiritRadius === 0) {
                hero.action = null;
            }
        }
    } else if (hero.action === 'knocked' || hero.action === 'thrown') {
        movementSpeed = 0;
        dx = hero.vx;
        dy = hero.vy;
        hero.z += hero.vz;
        hero.vz = Math.max(-8, hero.vz - 0.5);
        // The astral projection stays 4px off the ground.
        if (hero.z <= minZ) {
            hero.z = minZ;
            hero.action = null;
            hero.vz = 0;
        }
    } else if (!isAstralProjection && hero.z > minZ) {
        hero.action = null;
        dx = 0;
        dy = 0;
        hero.z += hero.vz;
        hero.vz = Math.max(-8, hero.vz - 0.5);
        if (hero.z <= minZ) {
            hero.z = minZ;
            hero.vz = 0;
        }
    } else if (!isAstralProjection && !isFrozen && hero.action === 'attack') {
        movementSpeed *= 0.5;
        hero.actionFrame++;
        if (hero.actionFrame === 6) {
        }
        if (hero.actionFrame > 12 || hero.swimming) {
            hero.action = null;
            hero.actionDx = 0;
            hero.actionDy = 0;
        }
    } else if (!isAstralProjection && hero.action === 'roll') {
        movementSpeed = 0;
        hero.vx = dx = directionMap[hero.d][0] * rollSpeed[hero.actionFrame];
        hero.vy = dy = directionMap[hero.d][1] * rollSpeed[hero.actionFrame];
        hero.actionFrame++;
        if (hero.actionFrame >= rollSpeed.length) {
            hero.action = null;
            hero.animationTime = 0;
        }
    }
    if (!isFrozen && (hero.chargingLeftTool || hero.chargingRightTool)) {
        movementSpeed *= 0.75;
        hero.chargeTime += FRAME_LENGTH;
        hero.action = 'charging';
        if (hero.chargingLeftTool && !isGameKeyDown(state, GAME_KEY.LEFT_TOOL)) {
            hero.toolCooldown = 200;
            useTool(state, hero, hero.leftTool, hero.actionDx, hero.actionDy);
            hero.chargingLeftTool = false;
        }
        if (hero.chargingRightTool && !isGameKeyDown(state, GAME_KEY.RIGHT_TOOL)) {
            hero.toolCooldown = 200;
            useTool(state, hero, hero.rightTool, hero.actionDx, hero.actionDy);
            hero.chargingRightTool = false;
        }
    } else if (!isFrozen && (heldChakram || hero.action === 'charging')) {
        hero.chargeTime += FRAME_LENGTH;
        movementSpeed *= 0.75;
        if (!heldChakram) {
            hero.action = null;
            hero.actionDx = 0;
            hero.actionDy = 0;
        } else if (!isGameKeyDown(state, GAME_KEY.WEAPON) || !canCharge) {
            hero.action = 'attack';
            hero.animationTime = 0;
            hero.actionFrame = 0;
            heldChakram.throw(state);
        }
    }
    if (hero.grabObject && hero.action !== 'grabbing') {
        hero.grabObject = null;
    }
    if (hero.grabTile && hero.action !== 'grabbing') {
        hero.grabTile = null;
    }
    if (!isFrozen && hero.action === 'pushing') {
        hero.animationTime -= 3 * FRAME_LENGTH / 4;
    }
    if (isControlled && movementSpeed) {
        [dx, dy] = getCloneMovementDeltas(state, hero);
        if (dx || dy) {
            const m = Math.sqrt(dx * dx + dy * dy);
            dx = movementSpeed * dx / m;
            dy = movementSpeed * dy / m;
            if (hero.action !== 'attack') {
                if (dx < 0 && (hero.d === 'right' || Math.abs(dx) > Math.abs(dy))) {
                    hero.d = 'left';
                } else if (dx > 0 && (hero.d === 'left' || Math.abs(dx) > Math.abs(dy))) {
                    hero.d = 'right';
                } else if (dy < 0 && (hero.d === 'down' || Math.abs(dy) > Math.abs(dx))) {
                    hero.d = 'up';
                } else if (dy > 0 && (hero.d === 'up' || Math.abs(dy) > Math.abs(dx))) {
                    hero.d = 'down';
                }
                const direction = getDirection(dx, dy, true, hero.d);
                if (heldChakram) {
                    heldChakram.vx = directionMap[direction][0];
                    heldChakram.vy = directionMap[direction][1];
                }
                hero.actionDx = directionMap[direction][0];
                hero.actionDy = directionMap[direction][1];
            }
        }
    }
    if (heldChakram && heldChakram.area === hero.area && heldChakram.hero === hero && hero.action !== 'charging') {
        if ((!hero.action || hero.action === 'walking') && isGameKeyDown(state, GAME_KEY.WEAPON) && canCharge) {
            // resume charing if the weapon button is still down.
            hero.action = 'charging';
            hero.actionDx = heldChakram.vx;
            hero.actionDy = heldChakram.vy;
        } else {
            heldChakram.throw(state);
        }
    }
    if (hero.action !== 'meditating') {
        hero.spiritRadius = 0;
        hero.explosionTime = 0;
    }
    if (hero.bounce) {
        hero.bounce.frames--;
        if (!(hero.bounce.frames > 0)) {
            hero.bounce = null;
        } else {
            dx = hero.bounce.vx;
            dy = hero.bounce.vy;
        }
    }
    if (!editingState.isEditing && ((dx || dy) || (hero.slipping && (Math.abs(hero.vx) > 0.3 || Math.abs(hero.vy) > 0.3)))) {
        const isCharging = hero.action === 'charging';
        const encumbered = hero.pickUpObject || hero.pickUpTile || hero.grabObject || hero.grabTile;
        if (hero.slipping) {
            hero.vx = dx / 50 + hero.vx;
            hero.vy = dy / 50 + hero.vy;
        } else {
            hero.vx = dx;
            hero.vy = dy;
        }
        const moveX = Math.abs(hero.vx) > 0.3 ? hero.vx : 0;
        const moveY = Math.abs(hero.vy) > 0.3 ? hero.vy : 0;
        if (moveX || moveY) {
            const {mx, my} = moveActor(state, hero, moveX, moveY, {
                canPush: !encumbered && !hero.swimming && !hero.bounce && !isCharging
                    // You can only push if you are moving the direction you are trying to move.
                    && hero.vx * dx >= 0 && hero.vy * dy >= 0,
                canClimb: !encumbered && !hero.bounce && !isCharging,
                canFall: true,
                canJump: !isAstralProjection,
                canSwim: !encumbered,
                boundToSection: isAstralProjection || !!hero.bounce,
            });
            if (moveX && hero.action !== 'knocked') {
                hero.vx = mx;
            }
            if (moveY && hero.action !== 'knocked') {
                hero.vy = my;
            }
        } else {
            // Reset jumping time if the actor stopped moving.
            hero.jumpingTime = 0;
        }
        if (!hero.action && !hero.chargingLeftTool && !hero.chargingRightTool) {
            hero.action = 'walking';
            hero.actionDx = 0;
            hero.actionDy = 0;
            hero.animationTime = 0;
        } else if (!isFrozen) {
            hero.animationTime += FRAME_LENGTH;
        }
    } else {
        if (!hero.slipping && !editingState.isEditing && hero.action !== 'jumpingDown') {
            hero.vx = hero.vy = 0;
            hero.jumpingTime = 0;
        }
        if ((hero.action === 'walking' || hero.action === 'pushing') && !hero.chargingLeftTool && !hero.chargingRightTool) {
            hero.action = null;
            hero.actionDx = 0;
            hero.actionDy = 0;
            hero.animationTime = 0;
        } else if (!isFrozen) {
            hero.animationTime += FRAME_LENGTH;
        }
    }
    // Return the climbin animation to a neutral state any time the character isn't moving vertically.
    // If we allow moving laterally while climbing this would need to be updated, but the animation
    // would probably also need to be adjusted.
    if (!dy && hero.action === 'climbing') {
        hero.animationTime = 4 * 6 * FRAME_LENGTH;
    }
    if (isAstralProjection) {
        const dx = hero.x - state.hero.x, dy = hero.y - state.hero.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = Math.max(0, state.hero.spiritRadius - 16);
        // The projection cannot move outside of the spirit radius.
        if (distance > maxDistance) {
            hero.x = state.hero.x + maxDistance * dx / distance;
            hero.y = state.hero.y + maxDistance * dy / distance;
            if (hero.grabObject) {
                hero.grabObject = null;
                hero.action = null;
            }
        }
        if (wasGameKeyPressed(state, GAME_KEY.LEFT_TOOL) || wasGameKeyPressed(state, GAME_KEY.RIGHT_TOOL)) {
            if (state.hero.passiveTools.teleportation && state.hero.magic > 0
                && canTeleportToCoords(state, state.hero, {x: hero.x, y: hero.y})
            ) {
                state.hero.magic -= 10;
                state.hero.x = hero.x;
                state.hero.y = hero.y;
                // match the projection to the hero eyes.
                hero.d = 'down';
                return;
            }
        }
    }
    if (canAttack && wasGameKeyPressed(state, GAME_KEY.WEAPON)) {
        const thrownChakrams = hero.area.objects.filter(o => o instanceof ThrownChakram);
        if (state.hero.weapon - thrownChakrams.length > 0) {
            hero.action = 'charging';
            hero.chargeTime = 0;
            hero.animationTime = 0;
            hero.actionDx = (dx || dy) ? dx : directionMap[hero.d][0];
            hero.actionDy = (dx || dy) ? dy : directionMap[hero.d][1];
            hero.actionFrame = 0;
            const direction = getDirection(hero.actionDx, hero.actionDy, true, hero.d);
            const chakram = new HeldChakram({
                vx: directionMap[direction][0],
                vy: directionMap[direction][1],
                source: hero,
            });
            addObjectToArea(state, hero.area, chakram);
        }
    }

    if (hero.toolCooldown > 0) {
        hero.toolCooldown -= FRAME_LENGTH;
    } else if (!isAstralProjection && !hero.swimming && (!hero.action || hero.action === 'walking' || hero.action === 'pushing')
        && !hero.pickUpTile && !hero.pickUpObject
    ) {
        if (isControlled && state.hero.leftTool && wasGameKeyPressed(state, GAME_KEY.LEFT_TOOL)) {
            hero.chargingLeftTool = true;
            hero.chargeTime = 0;
            const direction = getDirection((dx || dy) ? dx : directionMap[hero.d][0], (dx || dy) ? dy : directionMap[hero.d][1], true, hero.d);
            hero.actionDx = directionMap[direction][0];
            hero.actionDy = directionMap[direction][1];
        } else if (isControlled && state.hero.rightTool && wasGameKeyPressed(state, GAME_KEY.RIGHT_TOOL)) {
            hero.chargingRightTool = true;
            hero.chargeTime = 0;
            const direction = getDirection((dx || dy) ? dx : directionMap[hero.d][0], (dx || dy) ? dy : directionMap[hero.d][1], true, hero.d);
            hero.actionDx = directionMap[direction][0];
            hero.actionDy = directionMap[direction][1];
        }
    }
    if (isControlled && !hero.swimming &&
        (!hero.action || hero.action === 'walking' || hero.action === 'pushing') &&
        !hero.pickUpTile && !hero.pickUpObject && wasPassiveButtonPressed) {
        const {objects, tiles} = getActorTargets(state, hero);
        if (tiles.some(({x, y}) => area.behaviorGrid?.[y]?.[x]?.solid) || objects.some(o => o.behaviors?.solid)) {
            let closestLiftableTileCoords: TileCoords = null,
                closestObject: ObjectInstance = null,
                closestDistance = 100;
            for (const target of tiles) {
                const behavior = area.behaviorGrid?.[target.y]?.[target.x];
                if (behavior?.solid) {
                    hero.action = 'grabbing';
                    hero.grabTile = target;
                }
                if (hero.passiveTools.gloves >= behavior?.pickupWeight || behavior?.pickupWeight === 0) {
                    // This is an unusual distance, but should do what we want still.
                    const distance = (
                        Math.abs(target.x * 16 - hero.x) +
                        Math.abs(target.y * 16 - hero.y)
                    );
                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestLiftableTileCoords = target;
                    }
                }
            }
            for (const object of objects) {
                if (object === hero) {
                    continue;
                }
                const behavior = object.behaviors;
                if (behavior?.solid) {
                    hero.action = 'grabbing';
                }
                if (object.onGrab) {
                    const frame = object.getHitbox(state);
                    // This is an unusual distance, but should do what we want still.
                    const distance = (
                        Math.abs(frame.x + frame.w / 2 - hero.x - hero.w / 2) +
                        Math.abs(frame.y + frame.h / 2 - hero.y - hero.h / 2)
                    );
                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestObject = object;
                        closestLiftableTileCoords = null;
                    }
                }
            }
            hero.pickUpFrame = 0;
            if (closestLiftableTileCoords) {
                for (const layer of hero.area.layers) {
                    const tile: FullTile = layer.tiles[closestLiftableTileCoords.y][closestLiftableTileCoords.x];
                    const behavior = tile?.behaviors;
                    if (behavior?.pickupWeight <= state.hero.passiveTools.gloves) {
                        hero.pickUpTile = tile;
                        playSound('pickUpObject');
                        destroyTile(state, hero.area, {...closestLiftableTileCoords, layerKey: layer.key}, true);
                        if (behavior.linkableTiles) {
                            const alternateLayer = find(state.alternateAreaInstance.layers, {key: layer.key});
                            if(alternateLayer) {
                                const linkedTile: FullTile = alternateLayer.tiles[closestLiftableTileCoords.y][closestLiftableTileCoords.x];
                                if (linkedTile && behavior.linkableTiles.includes(linkedTile.index)) {
                                    hero.pickUpTile = {
                                        ...hero.pickUpTile,
                                        linkedTile,
                                    };
                                    destroyTile(state, hero.area.alternateArea, {...closestLiftableTileCoords, layerKey: layer.key}, true);
                                }
                            }
                        }
                    }
                }
                hero.grabTile = null;
            } else if (closestObject) {
                if (closestObject.onGrab) {
                    closestObject.onGrab(state, hero.d, hero);
                }
                hero.grabObject = closestObject;
            } else if (hero !== state.hero) {

            }
        } else if (dx || dy) {
            if (hero.passiveTools.roll > 0) {
                if (state.hero.magic > 0) {
                    state.hero.magic -= 5;
                    hero.action = 'roll';
                    hero.actionFrame = 0;
                    hero.animationTime = 0;
                } else {
                    // Hack to freeze player for a moment
                    hero.action = 'getItem';
                    hero.actionFrame = 30;
                    // We should play an insufficient mana sound here.
                }
            }
        } else {
            if (state.hero.clones.length || hero.passiveTools.spiritSight > 0) {
                hero.action = 'meditating';
                hero.d = 'down';
                hero.actionFrame = 0;
                hero.spiritRadius = 0;
                if (hero.astralProjection) {
                    hero.astralProjection.d = hero.d;
                    hero.astralProjection.x = hero.x;
                    hero.astralProjection.y = hero.y;
                }
            }
        }
    }
    if (hero.pickUpTile || hero.pickUpObject) {
        hero.pickUpFrame++;
        if (hero.pickUpFrame >= 5) {
            if (hero.action === 'grabbing') {
                hero.action = null;
            }
            if (isControlled && wasPassiveButtonPressed) {
                hero.throwHeldObject(state);
            }
        }
    }
    let isTouchingAirBubble = false;
    // Mostly don't check for pits/damage when the player cannot control themselves.
    if (hero.action !== 'beingCarried' && hero.action !== 'falling' && hero.action !== 'fallen' && hero.action !== 'knocked'
        && hero.action !== 'dead'  && hero.action !== 'getItem'
    ) {
        if (!isAstralProjection) {
            checkForFloorEffects(state, hero);
        }
        checkForEnemyDamage(state, hero);
        for (const object of hero.area.objects) {
            if (object instanceof AirBubbles) {
                if (rectanglesOverlap(hero, object.getHitbox(state))) {
                    isTouchingAirBubble = true;
                    break;
                }
            }
        }
    }
    if (hero.life <= 0) {
        state.defeatState.defeated = true;
        state.defeatState.time = 0;
        state.menuIndex = 0;
    }
    if (state.hero.isInvisible || state.hero.hasBarrier) {
        // state.hero.actualMagicRegen = Math.max(-10, state.hero.actualMagicRegen - 4 * FRAME_LENGTH / 1000);
        state.hero.actualMagicRegen = !state.hero.action ? 2 : 1;
    }
    const isHoldingBreath = !isTouchingAirBubble && !isAstralProjection && !state.hero.passiveTools.waterBlessing && state.zone.surfaceKey;
    // The waterfall tower area drains mana unless you have the water blessing.
    // Might make more sense to have this related to the water tiles in the material world or have
    // it be configurable on the area like `darkness` but for now just using the zone key is fine.
    const isWaterDrainingMagic = !isTouchingAirBubble && !isAstralProjection && !state.hero.passiveTools.waterBlessing && state.zone.key === 'waterfallTower';
    if (isWaterDrainingMagic) {
        state.hero.actualMagicRegen = Math.min(-20, state.hero.actualMagicRegen);
    } else if (isHoldingBreath) {
        state.hero.actualMagicRegen = Math.min(-1, state.hero.actualMagicRegen);
    } else if (isTouchingAirBubble) {
        // "airBubbles" are actually going to be "Spirit Recharge" points that regenerate mana quickly.
        state.hero.magic = Math.max(0, state.hero.magic);
        state.hero.actualMagicRegen = Math.max(5, state.hero.actualMagicRegen);
    }
    if (!state.hero.isInvisible && !isHoldingBreath) {
        state.hero.actualMagicRegen = Math.min(
            !state.hero.action ? 2 * state.hero.magicRegen : state.hero.magicRegen,
            state.hero.actualMagicRegen + 4 * FRAME_LENGTH / 1000
        );
    }
    state.hero.magic += state.hero.actualMagicRegen * FRAME_LENGTH / 1000;
    // Spirit regenerates twice as quickly when idle.
    if (!state.hero.action && state.hero.actualMagicRegen > 0) {
        state.hero.magic += state.hero.actualMagicRegen * FRAME_LENGTH / 1000;
    }
    // Clones drain 2 magic per second.
    state.hero.magic -= 2 * state.hero.clones.length * FRAME_LENGTH / 1000;
    // Meditation consumes 1 spirit energy per second.
    if (hero.action === 'meditating') {
        state.hero.magic -= FRAME_LENGTH / 1000;
    }
    if (hero.action !== 'knocked' && hero.action !== 'thrown') {
        // At base mana regen, using cat eyes reduces your mana very slowly unless you are stationary.
        let targetLightRadius = 20, minLightRadius = 20;
        if (hero.area.definition.dark) {
            const coefficient = 100 / hero.area.definition.dark;
            minLightRadius *= coefficient;
            if (state.hero.passiveTools.trueSight > 0) {
                state.hero.magic -= 10 * FRAME_LENGTH / 1000 / coefficient;
                targetLightRadius = 320 * coefficient;
                minLightRadius += 20 * coefficient;
            } else if (state.hero.passiveTools.catEyes > 0) {
                state.hero.magic -= 5 * FRAME_LENGTH / 1000 / coefficient;
                targetLightRadius = 80 * coefficient;
                minLightRadius += 10 * coefficient;
            }
            // Light radius starts dropping when spirit energy < 50% full.
            targetLightRadius = Math.max(minLightRadius,
                Math.floor(targetLightRadius * Math.min(1, 2 * state.hero.magic / state.hero.maxMagic)));
        }
        if (state.hero.lightRadius > targetLightRadius) {
            state.hero.lightRadius = Math.max(targetLightRadius, state.hero.lightRadius - 2);
        } else if (state.hero.lightRadius < targetLightRadius) {
            state.hero.lightRadius = Math.min(targetLightRadius, state.hero.lightRadius + 2);
        }
    }
    if (editingState.isEditing && state.hero.magicRegen) {
        state.hero.magic = state.hero.maxMagic;
    }
    if (state.hero.magic < 0) {
        state.hero.hasBarrier = false;
        state.hero.isInvisible = false;
        if (state.hero.clones.length) {
            state.hero.x = hero.x;
            state.hero.y = hero.y;
            removeAllClones(state);
        }
        if (isHoldingBreath) {
            hero.onHit(state, {damage: 1});
        }
    }
    if (state.hero.magic > state.hero.maxMagic) {
        state.hero.magic = state.hero.maxMagic;
    }
    updateScreenTransition(state, hero);
    state.location.x = state.hero.x;
    state.location.y = state.hero.y;
}

export function updateScreenTransition(state: GameState, hero: Hero) {
    if (hero.isAstralProjection) {
        return;
    }
    // Check for transition to other areas/area sections.
    const isMovingThroughZoneDoor = hero.actionTarget?.definition?.type === 'door'
        && hero.actionTarget.definition.targetZone
        && hero.actionTarget.definition.targetObjectId
    // Do not trigger the scrolling transition when traveling through a zone door.
    // Zone doors will eventually use a screen wipe transition.
    if (state.nextAreaSection || state.nextAreaInstance || isMovingThroughZoneDoor) {
        return;
    }

    const { w, h, section } = getAreaSize(state);
    // We only move to the next area if the player is moving in the direction of that area.
    // dx/dy handles most cases, but in some cases like moving through doorways we also need to check
    // hero.actionDx
    if (hero.x < 0 && (hero.vx < 0 || hero.actionDx < 0)) {
        state.location.areaGridCoords = {
            x: (state.location.areaGridCoords.x + state.areaGrid[0].length - 1) % state.areaGrid[0].length,
            y: state.location.areaGridCoords.y,
        };
        scrollToArea(state, getAreaFromLocation(state.location), 'left');
    } else if (hero.x + hero.w > w && (hero.vx > 0 || hero.actionDx > 0)) {
        state.location.areaGridCoords = {
            x: (state.location.areaGridCoords.x + 1) % state.areaGrid[0].length,
            y: state.location.areaGridCoords.y,
        };
        scrollToArea(state, getAreaFromLocation(state.location), 'right');
    } else if (hero.x < section.x && (hero.vx < 0 || hero.actionDx < 0)) {
        setNextAreaSection(state, 'left');
    } else if (hero.x + hero.w > section.x + section.w && (hero.vx > 0 || hero.actionDx > 0)) {
        setNextAreaSection(state, 'right');
    }
    const isHeroMovingDown = (hero.vy > 0 || hero.actionDy > 0 || (hero.action === 'jumpingDown' && hero.vy > 0));
    if (hero.y < 0 && (hero.vy < 0 || hero.actionDy < 0)) {
        state.location.areaGridCoords = {
            x: state.location.areaGridCoords.x,
            y: (state.location.areaGridCoords.y + state.areaGrid.length - 1) % state.areaGrid.length,
        };
        scrollToArea(state, getAreaFromLocation(state.location), 'up');
    } else if (hero.y + hero.h > h && isHeroMovingDown) {
        state.location.areaGridCoords = {
            x: state.location.areaGridCoords.x,
            y: (state.location.areaGridCoords.y + 1) % state.areaGrid.length,
        };
        scrollToArea(state, getAreaFromLocation(state.location), 'down');
    } else if (hero.y < section.y && (hero.vy < 0 || hero.actionDy < 0)) {
        setNextAreaSection(state, 'up');
    } else if (hero.y + hero.h > section.y + section.h && isHeroMovingDown) {
        setNextAreaSection(state, 'down');
    }
}

export function checkForEnemyDamage(state: GameState, hero: Hero) {
    if (hero.action === 'roll' || hero.action === 'getItem' || hero.invulnerableFrames > 0 || state.hero.isInvisible) {
        return;
    }
    if (!hero.area) {
        debugger;
    }
    for (const enemy of hero.area.objects) {
        if (!(enemy instanceof Enemy) || enemy.invulnerableFrames > 0 || enemy.status === 'hidden') {
            continue;
        }
        if (enemy.enemyDefinition.touchDamage && rectanglesOverlap(hero, enemy.getHitbox(state))) {
            //const dx = (hero.x + hero.w / 2) - (enemy.x + enemy.w / 2);
            //const dy = (hero.y + hero.h / 2) - (enemy.y + enemy.h / 2);
            const hitResult = hero.onHit(state, {
                damage: enemy.enemyDefinition.touchDamage,
                knockback: {
                    vx: - 4 * directionMap[hero.d][0],
                    vy: - 4 * directionMap[hero.d][1],
                    vz: 2,
                },
            });
            if (hitResult.returnHit) {
                enemy.onHit(state, hitResult.returnHit);
            } else if (hitResult.knockback) {
                enemy.knockBack(state, hitResult.knockback);
            }
        }
    }
}
