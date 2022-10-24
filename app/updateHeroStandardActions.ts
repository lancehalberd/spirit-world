import { find } from 'lodash';

import { addSparkleAnimation } from 'app/content/effects/animationEffect';
import {
    addEffectToArea, addObjectToArea, destroyTile, enterLocation, removeEffectFromArea,
} from 'app/content/areas';
import { getObjectBehaviors } from 'app/content/objects';
import { destroyClone } from 'app/content/objects/clone';
import { CloneExplosionEffect } from 'app/content/effects/CloneExplosionEffect';
import { AstralProjection } from 'app/content/objects/astralProjection';
import { zones } from 'app/content/zones';
import { EXPLOSION_TIME, FALLING_HEIGHT, MAX_FLOAT_HEIGHT, FRAME_LENGTH, GAME_KEY, MAX_SPIRIT_RADIUS } from 'app/gameConstants';
import { getActorTargets } from 'app/getActorTargets';
import {
    getCloneMovementDeltas,
    isGameKeyDown,
    wasGameKeyPressed,
} from 'app/keyCommands';
import { checkForFloorEffects, moveActor } from 'app/moveActor';
import { getChargeLevelAndElement, useTool } from 'app/useTool';
import { isHeroFloating, isHeroSinking, isUnderwater } from 'app/utils/actor';
import {
    canTeleportToCoords,
    directionMap,
    getDirection,
    isPointOpen,
} from 'app/utils/field';
import { playSound } from 'app/musicController';

import {
    FullTile, GameState, HeldChakram, Hero,
    ObjectInstance, TileCoords,
} from 'app/types';

export function updateHeroStandardActions(this: void, state: GameState, hero: Hero) {
    hero.thrownChakrams = hero.thrownChakrams.filter(chakram => chakram.area === hero.area);
    if (hero.heldChakram && hero.heldChakram.area !== hero.area) {
        delete hero.heldChakram;
    }
    const wasPassiveButtonPressed = wasGameKeyPressed(state, GAME_KEY.PASSIVE_TOOL);
    const isPassiveButtonDown = isGameKeyDown(state, GAME_KEY.PASSIVE_TOOL);
    const isCloneToolDown = (state.hero.leftTool === 'clone' && isGameKeyDown(state, GAME_KEY.LEFT_TOOL))
        || (state.hero.rightTool === 'clone' && isGameKeyDown(state, GAME_KEY.RIGHT_TOOL));
    const isCloakToolDown = (state.hero.leftTool === 'cloak' && isGameKeyDown(state, GAME_KEY.LEFT_TOOL))
        || (state.hero.rightTool === 'cloak' && isGameKeyDown(state, GAME_KEY.RIGHT_TOOL));
    const isPlayerControlled = !hero.isUncontrollable
        && (
            (state.hero.action === 'meditating' && hero.isAstralProjection)
            || isCloneToolDown || hero === state.hero
        );
    const minZ = hero.groundHeight + (hero.isAstralProjection ? 4 : 0);
    const isThrowingCloak = hero.toolOnCooldown === 'cloak';
    const isMovementBlocked = hero.action === 'meditating'
        || hero.action === 'throwing' || hero.action === 'grabbing' || isThrowingCloak;
    const maxCloudBootsZ = hero.groundHeight + MAX_FLOAT_HEIGHT;
    const isActionBlocked =
        isMovementBlocked || hero.swimming || hero.pickUpTile || hero.pickUpObject ||
        (hero.action === 'attack' && (hero.weapon < 2 || hero.actionFrame < 6)) ||
        hero.z > Math.max(FALLING_HEIGHT, minZ) || hero.action === 'climbing';
    const canCharge = !hero.isAstralProjection && isPlayerControlled && !isActionBlocked;
    const canAttack = canCharge && hero.weapon > 0 && !hero.chargingLeftTool && !hero.chargingRightTool;
    // console.log('move', !isMovementBlocked, 'act', !isActionBlocked, 'charge', canCharge, 'attack', canAttack);
    hero.isRunning = canCharge && isPassiveButtonDown;

    let dx = 0, dy = 0;
    let movementSpeed = 2;
    if (hero.isRunning && hero.magic >= 0) {
        movementSpeed *= 1.3;
    }
    if (hero.equipedBoots === 'ironBoots') {
        movementSpeed *= 0.6;
    } else if (hero.equipedBoots === 'cloudBoots') {
        movementSpeed *= 1.4;
    }
    if (hero.action === 'climbing') {
        movementSpeed *= 0.5;
    }
    if (hero.swimming) {
        movementSpeed *= 0.75;
        // Abort any unsupported actions while swimming.
        if (hero.action !== 'walking') {
            hero.action = null;
        }
    }
    if (hero.pickUpTile || hero.pickUpObject) {
        movementSpeed *= 0.75;
        hero.pickUpFrame++;
        if (hero.pickUpFrame >= 5) {
            if (hero.action === 'grabbing') {
                hero.action = null;
            }
            if (isPlayerControlled && wasPassiveButtonPressed) {
                hero.throwHeldObject(state);
            }
        }
    }
    if (hero.action === 'attack') {
        movementSpeed *= 0.5;
        hero.actionFrame++;
        if (hero.actionFrame > 12 || hero.swimming) {
            hero.action = null;
            hero.actionDx = 0;
            hero.actionDy = 0;
        }
    }

    // Handle various effects that alter the heroes z value, like sinking/floating in water
    // or running with cloud boots. None of these effects prevent the player from moving or acting.
    if (hero.z < minZ) {
        hero.z = Math.max(hero.groundHeight, Math.min(hero.z + 1, minZ));
    }
    if (isHeroSinking(state, hero)) {
        hero.z = Math.max(hero.z - 2, minZ);
    } else if (isHeroFloating(state, hero)) {
        hero.z = Math.min(24, hero.z + 1);
        if (hero.z >= 24 && state.surfaceAreaInstance) {
            // You can only surface in areas of deep water, that is, where you would be swimming.
            const testHero = hero.getCopy();
            testHero.z = 0;
            testHero.area = state.surfaceAreaInstance;
            // Remove equipment from test hero in case it prevents them from swimming (like cloud boots).
            testHero.equipedBoots = 'leatherBoots';
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
                return;
            }
        }
    } else if (hero.equipedBoots === 'cloudBoots' && hero.canFloat && hero.vx * hero.vx + hero.vy * hero.vy >= 4) {
        hero.z = Math.min(hero.z + 0.1, maxCloudBootsZ);
    } else if (hero.z >= minZ) {
        hero.z = Math.max(minZ, hero.z - 0.2);
    }

    // The astral projection uses the weapon tool as the passive tool button
    // since you have to hold the normal passive tool button down to meditate.

    if (hero.swimming && hero.equipedBoots === 'ironBoots' && state.underwaterAreaInstance &&
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
    }
    if (hero.action === 'grabbing') {
        hero.z = minZ;
        hero.slipping = false;
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
        } else if (isPlayerControlled && hero.grabObject?.onPull) {
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
    }
    if (hero.action === 'throwing' ) {
        hero.actionFrame++;
        if (hero.actionFrame === 2) {
            hero.action = null;
        }
    }
    // Uncontrollable clones automatically run the explosion sequence.
    if (hero.action === 'meditating' || hero.isUncontrollable) {
        if (hero.isUncontrollable
            || (isPlayerControlled && isGameKeyDown(state, GAME_KEY.MEDITATE))
        ) {
            // You can use the clone explosion ability only if a controllable clone exists
            // to either explode or switch to.
            if (hero.isUncontrollable
                || state.hero.clones.filter(clone => !clone.isUncontrollable).length
            ) {
                // Meditating as a clone will either blow up the current clone, or all clones
                // except the current if the clone tool is being pressed.
                if (!isCloneToolDown || hero !== state.hero) {
                    hero.explosionTime += FRAME_LENGTH;
                    if (hero.explosionTime >= EXPLOSION_TIME) {
                        hero.action = null;
                        hero.explosionTime = 0;
                        playSound('cloneExplosion');
                        addEffectToArea(state, hero.area, new CloneExplosionEffect({
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
            } else if (hero.passiveTools.spiritSight) {
                hero.spiritRadius = Math.min(hero.spiritRadius + 4, MAX_SPIRIT_RADIUS);
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
    }
    if (hero.chargingLeftTool || hero.chargingRightTool) {
        movementSpeed *= 0.75;
        hero.chargeTime += FRAME_LENGTH;
        hero.action = 'charging';
        if (isCloakToolDown && hero.hasBarrier) {
            if (hero.chargeTime >= 400) {
                hero.burstBarrier(state);
                state.hero.magic -= 10;
                if (hero.activeTools.cloak >= 2) {
                    hero.isInvisible = true;
                }
                hero.chargeTime = 0;
                hero.action = null;
                hero.chargingLeftTool = hero.chargingRightTool = false;
            }
        } else if (hero.chargingLeftTool && (!isGameKeyDown(state, GAME_KEY.LEFT_TOOL) || !canCharge)) {
            useTool(state, hero, hero.leftTool, hero.actionDx, hero.actionDy);
            hero.chargingLeftTool = false;
        } else if (hero.chargingRightTool && (!isGameKeyDown(state, GAME_KEY.RIGHT_TOOL) || !canCharge)) {
            useTool(state, hero, hero.rightTool, hero.actionDx, hero.actionDy);
            hero.chargingRightTool = false;
        } else {
            const tool = hero.chargingLeftTool ? hero.leftTool : hero.rightTool;
            const { chargeLevel, element } = getChargeLevelAndElement(state, hero, tool);
            if (chargeLevel > 0 && state.time % 100 === 0) {
                let skipSparkle = false;
                // These sparkles don't look good with the base bow charge animations.
                if (tool === 'bow' && !element) {
                    skipSparkle = true;
                }
                if (tool === 'bow' && element === 'ice') {
                    skipSparkle = true;
                }
                if (!skipSparkle) {
                    const hitbox = hero.getHitbox(state);
                    addSparkleAnimation(state, hero.area, {
                        x: hitbox.x + hitbox.w / 2 + hero.actionDx * 12,
                        y: hitbox.y + hitbox.h / 2 - hero.z + hero.actionDy * 12 - 6,
                        w: 4,
                        h: 4,
                    },{ element });
                }
            }
        }
    } else if (hero.action === 'charging') {
        hero.chargeTime += FRAME_LENGTH;
        movementSpeed *= 0.75;
        if (!hero.heldChakram && !hero.toolOnCooldown) {
            hero.action = null;
            hero.actionDx = 0;
            hero.actionDy = 0;
        } else if (hero.heldChakram && (!isGameKeyDown(state, GAME_KEY.WEAPON) || !canCharge)) {
            hero.action = 'attack';
            hero.animationTime = 0;
            hero.actionFrame = 0;
            hero.heldChakram.throw(state);
        }
    }
    if (isPlayerControlled && !isMovementBlocked) {
        [dx, dy] = getCloneMovementDeltas(state, hero);
        if (dx || dy) {
            const m = Math.sqrt(dx * dx + dy * dy);
            dx = movementSpeed * dx / m;
            dy = movementSpeed * dy / m;
            // Change direction as long the player isn't mid attack
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
                // Don't change direction while charging when the button for the action is no longer pressed.
                if (hero.heldChakram && isGameKeyDown(state, GAME_KEY.WEAPON)) {
                    hero.heldChakram.vx = directionMap[direction][0];
                    hero.heldChakram.vy = directionMap[direction][1];
                }
                if ((hero.chargingLeftTool && isGameKeyDown(state, GAME_KEY.LEFT_TOOL))
                    || (hero.chargingRightTool && isGameKeyDown(state, GAME_KEY.RIGHT_TOOL))
                ) {
                    hero.actionDx = directionMap[direction][0];
                    hero.actionDy = directionMap[direction][1];
                }
            }
            if (!hero.action
                && !hero.chargingLeftTool && !hero.chargingRightTool && !hero.toolOnCooldown
            ) {
                hero.action = 'walking';
                hero.actionDx = 0;
                hero.actionDy = 0;
                hero.animationTime = 0;
            }
        } else {
            // Reset jumping time if the actor stopped moving.
            hero.jumpingTime = 0;
            if ((hero.action === 'walking' || hero.action === 'pushing')
                && !hero.chargingLeftTool && !hero.chargingRightTool && !hero.toolOnCooldown
            ) {
                hero.action = null;
                hero.actionDx = 0;
                hero.actionDy = 0;
                hero.animationTime = 0;
            }
        }
    }
    // Make sure clones stop taking actions when not controlled.
    if (!isPlayerControlled) {
        if ((hero.action === 'walking' || hero.action === 'pushing')
            && !hero.chargingLeftTool && !hero.chargingRightTool && !hero.toolOnCooldown
        ) {
            hero.action = null;
            hero.actionDx = 0;
            hero.actionDy = 0;
            hero.animationTime = 0;
        }
    }
    if (hero.heldChakram?.area === hero.area && hero.action !== 'charging') {
        if ((!hero.action || hero.action === 'walking') && isGameKeyDown(state, GAME_KEY.WEAPON) && canCharge) {
            // resume charing if the weapon button is still down.
            hero.action = 'charging';
            hero.actionDx = hero.heldChakram.vx;
            hero.actionDy = hero.heldChakram.vy;
        } else {
            hero.heldChakram.throw(state);
        }
    }
    if (hero.bounce) {
        // This happens, for example when the hero hits an enemy while holding the chakram.
        hero.bounce.frames--;
        if (!(hero.bounce.frames > 0)) {
            hero.bounce = null;
        } else {
            dx = hero.bounce.vx;
            dy = hero.bounce.vy;
        }
    }
    if (hero.slipping) {
        if (hero.equipedBoots === 'cloudBoots') {
            hero.vx = dx / 10 + hero.vx * 0.95;
            hero.vy = dy / 10 + hero.vy * 0.95;
        } else {
            hero.vx = dx / 40 + hero.vx * 0.99;
            hero.vy = dy / 40 + hero.vy * 0.99;
        }
        const mag = Math.sqrt(hero.vx * hero.vx + hero.vy * hero.vy);
        const maxSpeed = 2.5;
        if (mag > maxSpeed) {
            hero.vx *= maxSpeed / mag;
            hero.vy *= maxSpeed / mag;
        }
    } else {
        hero.vx = dx;
        hero.vy = dy;
    }
    if (Math.abs(hero.vx) > 0.3 || Math.abs(hero.vy) > 0.3) {
        const isCharging = hero.action === 'charging';
        const encumbered = hero.pickUpObject || hero.pickUpTile || hero.grabObject || hero.grabTile;
        // Only move if the hero is trying to move in the current direction or if
        // their velocity is sufficiently large enough from slipping to keep them moving.
        const moveX = (Math.abs(hero.vx) > 0.3 || dx * hero.vx > 0) ? hero.vx : 0;
        const moveY = (Math.abs(hero.vy) > 0.3 || dy * hero.vy > 0) ? hero.vy : 0;
        if (moveX || moveY) {
            const {mx, my} = moveActor(state, hero, moveX, moveY, {
                canPush: !encumbered && !hero.swimming && !hero.bounce && !isCharging
                    // You can only push if you are moving the direction you are trying to move.
                    && hero.vx * dx >= 0 && hero.vy * dy >= 0,
                canClimb: !encumbered && !hero.bounce && !isCharging && !hero.isAstralProjection,
                // This doesn't mean the player will fall, just that they can move into tiles/objects marked as pits.
                canFall: true,
                canJump: !hero.isAstralProjection,
                canSwim: !encumbered,
                direction: hero.d,
                boundToSection: hero.isAstralProjection || !!hero.bounce,
            });
            if (moveX) {
                hero.vx = mx;
            }
            if (moveY) {
                hero.vy = my;
            }
        }
    }
    // Return the climbing animation to a neutral state any time the character isn't moving vertically.
    // If we allow moving laterally while climbing this would need to be updated, but the animation
    // would probably also need to be adjusted.
    if (!dy && hero.action === 'climbing') {
        hero.animationTime = 4 * 6 * FRAME_LENGTH;
    }
    if (hero.isAstralProjection) {
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

    // Check to start charging the chakram
    if (canAttack
        && (wasGameKeyPressed(state, GAME_KEY.WEAPON) || (hero.attackBufferTime > state.fieldTime - 200))
    ) {
        const usedChakrams = hero.thrownChakrams.length + (hero.heldChakram ? 1 : 0);
        if (state.hero.weapon - usedChakrams > 0) {
            hero.action = 'charging';
            hero.chargeTime = 0;
            hero.animationTime = 0;
            hero.actionDx = (dx || dy) ? dx : directionMap[hero.d][0];
            hero.actionDy = (dx || dy) ? dy : directionMap[hero.d][1];
            hero.actionFrame = 0;
            const direction = getDirection(hero.actionDx, hero.actionDy, true, hero.d);
            hero.heldChakram = new HeldChakram({
                vx: directionMap[direction][0],
                vy: directionMap[direction][1],
                source: hero,
                level: Math.min(state.hero.weapon, hero.thrownChakrams[0]?.level === 2 ? 1 : 2),
            });
            addEffectToArea(state, hero.area, hero.heldChakram);
            return;
        } else if (wasGameKeyPressed(state, GAME_KEY.WEAPON) && state.hero.weapon) {
            hero.attackBufferTime = state.fieldTime;
        }
    }

    // Check to start charging/preparing a tool for use.
    if (canCharge && hero.toolCooldown <= 0 && !hero.chargingRightTool && !hero.chargingLeftTool) {
        const controllableClones = state.hero.clones.filter(clone => !clone.isUncontrollable);
        if (state.hero.leftTool && wasGameKeyPressed(state, GAME_KEY.LEFT_TOOL)
            && (state.hero.leftTool !== 'clone' || !controllableClones.length)
        ) {
            // Currently only the bow tool can be charged.
            if (state.hero.leftTool === 'bow'
                // "charging" the cloak while it is active is used to activate barrier burst/invisibility
                || (state.hero.hasBarrier && state.hero.leftTool === 'cloak')
            ) {
                hero.chargingLeftTool = true;
            } else {
                const direction = getDirection((dx || dy) ? dx : directionMap[hero.d][0], (dx || dy) ? dy : directionMap[hero.d][1], true, hero.d);
                useTool(state, hero, state.hero.leftTool, directionMap[direction][0], directionMap[direction][1]);
            }
        } else if (state.hero.rightTool && wasGameKeyPressed(state, GAME_KEY.RIGHT_TOOL)
            && (state.hero.rightTool !== 'clone' || !controllableClones.length)
        ) {
            // Currently only the bow tool can be charged.
            if (state.hero.rightTool === 'bow'
                // "charging" the cloak while it is active is used to activate barrier burst/invisibility
                || (state.hero.hasBarrier && state.hero.rightTool === 'cloak')
            ) {
                hero.chargingRightTool = true;
            } else {
                const direction = getDirection((dx || dy) ? dx : directionMap[hero.d][0], (dx || dy) ? dy : directionMap[hero.d][1], true, hero.d);
                useTool(state, hero, state.hero.rightTool, directionMap[direction][0], directionMap[direction][1]);
            }
        }
        if (hero.chargingRightTool || hero.chargingLeftTool) {
            hero.chargeTime = 0;
            const direction = getDirection((dx || dy) ? dx : directionMap[hero.d][0], (dx || dy) ? dy : directionMap[hero.d][1], true, hero.d);
            hero.actionDx = directionMap[direction][0];
            hero.actionDy = directionMap[direction][1];
            return;
        }
    }
    // Check to grab an object (also used for interacting with objects).
    if (isPlayerControlled && !isActionBlocked && wasPassiveButtonPressed) {
        const {objects, tiles} = getActorTargets(state, hero);
        if (tiles.some(({x, y}) => hero.area.behaviorGrid?.[y]?.[x]?.solid) || objects.some(o => getObjectBehaviors(state, o)?.solid)) {
            let closestLiftableTileCoords: TileCoords = null,
                closestObject: ObjectInstance = null,
                closestDistance = 100;
            for (const target of tiles) {
                const behavior = hero.area.behaviorGrid?.[target.y]?.[target.x];
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
                const behavior = getObjectBehaviors(state, object);
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
                hero.lastTouchedObject = closestObject;
            }
        }
    }
    if (wasGameKeyPressed(state, GAME_KEY.ROLL)
        && !isActionBlocked
        && !hero.isAstralProjection
        && hero.passiveTools.roll > 0
        && state.hero.magic > 0
        && hero.rollCooldown <= 0
    ) {
        // Normal roll
        hero.chargeTime = 0;
        if (hero.heldChakram) {
            removeEffectFromArea(state, hero.heldChakram);
            delete hero.heldChakram;
        }
        hero.chargingLeftTool = hero.chargingRightTool = false;
        state.hero.magic -= 5;
        hero.action = 'roll';
        hero.actionFrame = 0;
        hero.animationTime = 0;
        const direction = getDirection(
            (dx || dy) ? dx : directionMap[hero.d][0],
            (dx || dy) ? dy : directionMap[hero.d][1], true, hero.d);
        hero.actionDx = directionMap[direction][0];
        hero.actionDy = directionMap[direction][1];
        return;
    }
    if ((hero.swimming || isUnderwater(state, hero)) && wasGameKeyPressed(state, GAME_KEY.MEDITATE)) {
        // The meditate key can be used to quickly toggle iron boots in/under water.
        if (hero.equipment.ironBoots) {
            if (hero.equipedBoots !== 'ironBoots') {
                hero.equipedBoots = 'ironBoots';
            } else {
                hero.equipedBoots = 'leatherBoots';
            }
        }
    } else if (wasGameKeyPressed(state, GAME_KEY.MEDITATE)
        && !isActionBlocked && (hero.passiveTools.spiritSight || hero.clones.length)
        && !hero.heldChakram && !hero.chargingLeftTool && !hero.chargingRightTool
    ) {
        hero.action = 'meditating';
        hero.d = 'down';
        hero.actionFrame = 0;
        hero.spiritRadius = 0;
        if (hero.astralProjection) {
            hero.astralProjection.d = hero.d;
            hero.astralProjection.x = hero.x;
            hero.astralProjection.y = hero.y;
        }
        return;
    }
}
