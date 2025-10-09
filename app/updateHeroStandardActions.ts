import { addSparkleAnimation } from 'app/content/effects/animationEffect';
import { HeldChakram } from 'app/content/effects/thrownChakram';
import { setEquippedBoots } from 'app/content/menu';
import { CloneExplosionEffect } from 'app/content/effects/CloneExplosionEffect';
import { AstralProjection } from 'app/content/objects/astralProjection';
import {allTiles} from 'app/content/tiles';
import { zones } from 'app/content/zones';
import { EXPLOSION_TIME, FALLING_HEIGHT, MAX_FLOAT_HEIGHT, FRAME_LENGTH, GAME_KEY, MAX_SPIRIT_RADIUS } from 'app/gameConstants';
import { getActorTargets } from 'app/getActorTargets';
import { playAreaSound } from 'app/musicController';
import { checkForFloorEffects } from 'app/movement/checkForFloorEffects';
import { canActorMove, getSectionBoundingBox, moveActor } from 'app/movement/moveActor';
import {
    getCloneMovementDeltas,
    isGameKeyDown,
    wasGameKeyPressed,
} from 'app/userInput';
import { isToolButtonPressed, useTool } from 'app/useTool';
import { isHeroFloating, isHeroSinking, isUnderwater } from 'app/utils/actor';
import { destroyClone } from 'app/utils/destroyClone';
import { destroyTile } from 'app/utils/destroyTile';
import { addEffectToArea, removeEffectFromArea } from 'app/utils/effects';
import { enterLocation } from 'app/utils/enterLocation';
import {
    canTeleportToCoords,
    directionMap,
    getDirection,
    // isPointOpen,
    isTileOpen,
} from 'app/utils/field';
import { getChargeLevelAndElement } from 'app/utils/getChargeLevelAndElement';
import { addObjectToArea, getObjectBehaviors } from 'app/utils/objects';

export function updateHeroStandardActions(this: void, state: GameState, hero: Hero) {
    hero.thrownChakrams = hero.thrownChakrams.filter(
        chakram => chakram.area === hero.area
    );
    if (hero.heldChakram && hero.heldChakram.area !== hero.area) {
        delete hero.heldChakram;
    }
    if (hero.activeBarrierBurst && hero.activeBarrierBurst.area !== hero.area) {
        delete hero.activeBarrierBurst;
    }
    const wasPassiveButtonPressed = wasGameKeyPressed(state, GAME_KEY.PASSIVE_TOOL);
    const isPassiveButtonDown = isGameKeyDown(state, GAME_KEY.PASSIVE_TOOL);
    const isCloneToolDown = isToolButtonPressed(state, 'clone');
    const isPlayerControlled = !hero.isUncontrollable
        && (
            (state.hero.action === 'meditating' && hero.isAstralProjection)
            || isCloneToolDown || hero === state.hero
        );
    const minZ = hero.groundHeight + (hero.isAstralProjection ? 4 : 0);
    const isThrowingCloak = hero.toolOnCooldown === 'cloak';
    const isMovementBlocked = hero.action === 'meditating' || hero.action === 'chargingCloneExplosion'
        || hero.action === 'throwing' || hero.action === 'grabbing' || isThrowingCloak;
    // We use groundHeight of 1 to prevent falling into pits currently. But this allows the player to float longer
    // over pits than we intend, so we don't increase the float height until the ground height is at least 2.
    const maxCloudBootsZ = Math.max(0, hero.groundHeight - 1) + MAX_FLOAT_HEIGHT;
    const isClimbing = hero.action === 'climbing';
    const canThrowSecondChakram = hero.savedData.weapon === 3 && hero.actionFrame > 6;
    const isActionBlocked =
        isMovementBlocked || hero.swimming || hero.pickUpTile || hero.pickUpObject
        || (hero.action === 'attack' && !canThrowSecondChakram)
        || hero.z > Math.max(FALLING_HEIGHT, minZ + 2) || isClimbing;
    const canCharge = !hero.isAstralProjection && isPlayerControlled && !isActionBlocked;
    const canRun = canCharge && !hero.chargingLeftTool && !hero.chargingRightTool && !hero.heldChakram;
    const canAttack = canRun && hero.savedData.weapon > 0;
    // console.log('move', !isMovementBlocked, 'act', !isActionBlocked, 'charge', canCharge, 'attack', canAttack);
    hero.isRunning = canRun && isPassiveButtonDown;

    let dx = 0, dy = 0;
    let movementSpeed = 2;
    if (hero.isRunning && state.hero.magic > 0) {
        movementSpeed *= 1.3;
    }
    if (hero.savedData.equippedBoots === 'ironBoots' && hero.savedData.equipment.ironBoots < 2) {
        // Note that there is no movement speed penalty for level 2 iron boots.
        movementSpeed *= 0.6;
    } else if (hero.savedData.equippedBoots === 'cloudBoots') {
        movementSpeed = 3;
        // The slipping effect of the cloud boots will cause them to have 2x max speed already.
        if (hero.slipping) {
            movementSpeed = 2;
        }
    } else if (hero.savedData.equippedBoots === 'leatherBoots' && hero.savedData.equipment.leatherBoots >= 2) {
        // Spike boots give the hero a small movement speed boost in addition to preventing slipping.
        // They would be almost strictly worse than the Forge Boots without this.
        movementSpeed *= 1.1;
    }
    if (isClimbing) {
        hero.slipping = false;
        // Boots have less dramatic impact on movement speed when climbing.
        if (hero.savedData.equippedBoots === 'ironBoots' && hero.savedData.equipment.ironBoots < 2) {
            movementSpeed = 0.8;
        } else if (hero.savedData.equippedBoots === 'cloudBoots'
            // Spike boots get the same climbing speed bonus as cloud boots.
            || (hero.savedData.equippedBoots === 'leatherBoots' && hero.savedData.equipment.leatherBoots >= 2)
        ) {
            movementSpeed = 1.2;
        } else {
            movementSpeed = 1;
        }
    }
    if (hero.swimming) {
        hero.slipping = false;
        movementSpeed *= 0.8;
        if (hero.savedData.equippedBoots === 'cloudBoots') {
            movementSpeed *= 1.2;
        }
        // Abort any unsupported actions while swimming.
        if (hero.action !== 'walking') {
            hero.action = null;
        }
        if (hero.grabObject) {
            hero.grabObject = null;
            hero.action = null;
        }
        if (hero.pickUpTile || hero.pickUpObject) {
            hero.throwHeldObject(state);
            hero.action = null;
        }
    }
    if (hero.pickUpObject && hero.area !== hero.pickUpObject.area) {
        hero.pickUpObject = null;
        hero.action = null;
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
    const isSinking = isHeroSinking(state, hero), isFloating = !isSinking && isHeroFloating(state, hero);
    if (isSinking) {
        hero.slipping = false;
        hero.z = Math.max(hero.z - 1.5, minZ);
    } else if (isFloating) {
        if (hero.savedData.equippedBoots === 'cloudBoots') {
            movementSpeed *= 1.2;
        }
        hero.slipping = false;
        hero.vz = Math.min(1, hero.vz + 0.2);
        hero.z = Math.min(24, hero.z + hero.vz);
        if (hero.z < minZ) {
            hero.z = Math.max(hero.groundHeight, Math.min(hero.z + 1, minZ));
            // Setting this allows the hero to hug the bottom for a little while before rising again.
            // The larger this negative value, the more they can "stick" to the bottom if they fall very fast.
            hero.vz = Math.max(hero.vz, -2);
        }
        if (hero.z >= 24 && hero.vz >= 0 && state.surfaceAreaInstance && !state.nextAreaInstance && !state.nextAreaSection) {
            // You can only surface in areas of deep water, that is, where you would be swimming.
            const testHero = hero.getCopy();
            testHero.z = 0;
            testHero.area = state.surfaceAreaInstance;
            // Remove equipment from test hero in case it prevents them from swimming (like cloud boots).
            testHero.savedData.equippedBoots = 'leatherBoots';
            checkForFloorEffects(state, testHero);
            // If the test hero is swimming, we can surface here.
            if (testHero.swimming
                && isTileOpen(state, state.surfaceAreaInstance, {x: hero.x, y: hero.y})
            ) {
                enterLocation(state, {
                    ...state.location,
                    zoneKey: state.zone.surfaceKey,
                    floor: 0,
                    x: hero.x,
                    y: hero.y,
                    z: 0,
                });
                hero.swimming = true;
                return;
            }
        }
    } else if (!hero.isAstralProjection && hero.savedData.equippedBoots === 'cloudBoots' && hero.canFloat && hero.vx * hero.vx + hero.vy * hero.vy >= 4) {
        // The intention is the the player can walk over patterns of 2 solid floor and 2 gaps indefinitely, so they have to
        // gain height fast enough on the solid floor to achieve thiese. 1 solid floor should not be enough though.
        hero.z = Math.min(hero.z + 0.15, maxCloudBootsZ);
    } else if (hero.z >= minZ) {
        let fallSpeed = 1;
        if (hero.savedData.equippedBoots === 'cloudBoots') fallSpeed = 0.3;
        else if (hero.savedData.equippedBoots === 'ironBoots') fallSpeed = 2;
        // else if (hero.action === 'roll') fallSpeed = 0.5;
        hero.z = Math.max(minZ, hero.z - fallSpeed);
        if (hero.z <= minZ) {
            hero.isAirborn = hero.isAstralProjection;
        } else {
            hero.isAirborn = true;
        }
    }

    if (hero.swimming && hero.savedData.equippedBoots === 'ironBoots' && state.underwaterAreaInstance &&
        isTileOpen(state, state.underwaterAreaInstance, {x: hero.x, y: hero.y})
    ) {
        if (hero === state.hero) {
            enterLocation(state, {
                ...state.location,
                floor: zones[state.zone.underwaterKey].floors.length - 1,
                zoneKey: state.zone.underwaterKey,
                x: hero.x,
                y: hero.y,
                z: 24,
            });
            hero.swimming = false;
            hero.wading = false;
        }
        return;
    }
    if (isPlayerControlled) {
        hero.lastMovementDeltas = getCloneMovementDeltas(state, hero);
    }
    if (hero.action === 'grabbing') {
        hero.z = minZ;
        hero.slipping = false;
        hero.vx = 0;
        hero.vy = 0;
        if (hero.grabObject && (hero.grabObject.area !== hero.area || !getActorTargets(state, hero).objects.includes(hero.grabObject))) {
            hero.action = null;
            // console.log(hero.grabObject);
            // console.log('grab object no longer a target', hero.x, hero.y, hero.d);
            hero.grabObject = null;
        } else if (hero.grabObject?.pullingHeroDirection) {
            dx = directionMap[hero.grabObject.pullingHeroDirection][0];
            dy = directionMap[hero.grabObject.pullingHeroDirection][1];
        } else if (!hero.pickUpTile && !hero.pickUpObject && !isPassiveButtonDown) {
            hero.action = null;
            hero.grabTile = null;
            hero.grabObject = null;
        } else if (isPlayerControlled && hero.grabObject?.onPull) {
            const [pulldx, pulldy] = (hero.lastMovementDeltas || [0, 0]);
            if (pulldx || pulldy) {
                const direction = getDirection(pulldx, pulldy);
                hero.grabObject.onPull(state, direction, hero);
                // grabObject may be removed during the onPull operation, so confirm it is still set first.
                /*if (hero.grabObject) {
                    // Wiggle the hero in line with the object as they move it
                    const wiggleDistance = 14;
                    // If the player is not positioned correctly to pull the object, instead of pulling,
                    // attempt to wiggle them in better alignment with the object.
                    if ( hero.x > hero.grabObject.x - wiggleDistance && hero.x < hero.grabObject.x) {
                        dx = Math.min(1, hero.grabObject.x - hero.x);
                        // Movement code will be ignored for dx values < 0.2, so just snap the character
                        if (dx <= 0.25) {
                            hero.x = hero.grabObject.x;
                            dx = 0
                        }
                    } else if (hero.x < hero.grabObject.x + wiggleDistance && hero.x > hero.grabObject.x) {
                        dx = Math.max(-1, hero.grabObject.x - hero.x);
                        // Movement code will be ignored for dx values < 0.2, so just snap the character
                        if (dx >= -0.25) {
                            hero.x = hero.grabObject.x;
                            dx = 0
                        }
                    }
                    if (hero.y > hero.grabObject.y - wiggleDistance && hero.y < hero.grabObject.y) {
                        dy = Math.min(1, hero.grabObject.y - hero.y);
                        // Movement code will be ignored for dx values < 0.2, so just snap the character
                        if (dy <= 0.25) {
                            hero.y = hero.grabObject.y;
                            dy = 0
                        }
                    } else if (hero.y < hero.grabObject.y + wiggleDistance && hero.y > hero.grabObject.y) {
                        dy = Math.max(-1, hero.grabObject.y - hero.y);
                        // Movement code will be ignored for dx values < 0.2, so just snap the character
                        if (dy >= -0.25) {
                            hero.y = hero.grabObject.y;
                            dy = 0
                        }
                    }
                }*/
            }
        }
    }
    if (hero.action === 'throwing' ) {
        hero.actionFrame++;
        if (hero.actionFrame === 2) {
            hero.action = null;
        }
    }
    if (hero.action === 'chargingCloneExplosion' && !hero.clones.length) {
        hero.action = null;
        hero.explosionTime = 0;
    }
    // Uncontrollable clones automatically run the explosion sequence.
    if (hero.action === 'chargingCloneExplosion' || hero.isUncontrollable) {
        if (hero.isUncontrollable || (isPlayerControlled && isGameKeyDown(state, GAME_KEY.MEDITATE))) {
            // Meditating as a clone will either blow up the current clone, or all clones
            // except the current if the clone tool is being pressed.
            if (!isCloneToolDown || hero !== state.hero) {
                hero.explosionTime += FRAME_LENGTH;
                if (hero.area && hero.explosionTime >= EXPLOSION_TIME) {
                    hero.action = null;
                    hero.explosionTime = 0;
                    playAreaSound(state, hero.area, 'cloneExplosion');
                    addEffectToArea(state, hero.area, new CloneExplosionEffect({
                        x: hero.x + hero.w / 2,
                        y: hero.y + hero.h / 2,
                    }));
                    destroyClone(state, hero);
                    return;
                }
            } else {
                hero.action = null;
                hero.explosionTime = 0;
            }
        } else {
            hero.action = null;
            hero.explosionTime = 0;
        }
    }
    if (hero.action === 'meditating') {
        if (isPlayerControlled && (isGameKeyDown(state, GAME_KEY.MEDITATE) || state.scriptEvents.blockPlayerInput)) {
            // You can use the clone explosion ability only if a controllable clone exists
            // to either explode or switch to.
            if (hero.isUncontrollable
                || state.hero.clones.filter(clone => !clone.isUncontrollable).length
            ) {
            } else if (hero.savedData.passiveTools.catEyes) {
                // Note that the hero can use spirit sight successfully without spirit sight when they are training to
                // use spirit sight. Normally maxSpiritRadius will be 0 without spirit sight, but the spirit sight tutorail
                // will override this value.
                if (hero.spiritRadius <= hero.maxSpiritRadius) {
                    hero.spiritRadius = Math.min(hero.spiritRadius + hero.maxSpiritRadius / 20, hero.maxSpiritRadius);
                } else {
                    hero.spiritRadius = Math.max(hero.spiritRadius - hero.maxSpiritRadius / 10, hero.maxSpiritRadius);
                }
                if (hero.savedData.passiveTools.astralProjection && hero.area.alternateArea) {
                    // Astral projection cannot be summoned when spirit sight radius is limited by obstacles.
                    if (!hero.astralProjection && hero.maxSpiritRadius === MAX_SPIRIT_RADIUS) {
                        hero.astralProjection = new AstralProjection(state, hero);
                        addObjectToArea(state, hero.area.alternateArea, hero.astralProjection);
                    }
                }
            }
        } else {
            hero.spiritRadius = Math.max(hero.spiritRadius - hero.maxSpiritRadius / 10, 0);
            if (hero.astralProjection) {
                hero.astralProjection.dropHeldObject(state);
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
        if (isToolButtonPressed(state, 'cloak') && hero.hasBarrier) {
            if (hero.chargeTime >= 400) {
                hero.burstBarrier(state);
                let magicCost = 10;
                if (state.hero.savedData.element) {
                    magicCost += 10;
                }
                state.hero.spendMagic(magicCost);
                if (hero.savedData.activeTools.cloak >= 2) {
                    hero.isInvisible = true;
                }
                hero.chargeTime = 0;
                hero.action = null;
                hero.chargingLeftTool = hero.chargingRightTool = false;
            }
        } else if (hero.chargingLeftTool && ((!isGameKeyDown(state, GAME_KEY.LEFT_TOOL) && !state.scriptEvents.blockPlayerInput) || !canCharge)) {
            useTool(state, hero, hero.savedData.leftTool, hero.actionDx, hero.actionDy);
            hero.chargingLeftTool = false;
            hero.action = null;
        } else if (hero.chargingRightTool && ((!isGameKeyDown(state, GAME_KEY.RIGHT_TOOL) && !state.scriptEvents.blockPlayerInput) || !canCharge)) {
            useTool(state, hero, hero.savedData.rightTool, hero.actionDx, hero.actionDy);
            hero.chargingRightTool = false;
            hero.action = null;
        } else {
            const tool = hero.chargingLeftTool ? hero.savedData.leftTool : hero.savedData.rightTool;
            const { chargeLevel, element } = getChargeLevelAndElement(state, hero, hero.savedData.activeTools[tool]);
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
                    const hitbox = hero.getHitbox();
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
        } else if (hero.heldChakram && !state.scriptEvents.blockPlayerInput && (!isGameKeyDown(state, GAME_KEY.WEAPON) || !canCharge)) {
            hero.action = 'attack';
            hero.animationTime = 0;
            hero.actionFrame = 0;
            hero.heldChakram.throw(state);
        }
    }
    if (isPlayerControlled && !isMovementBlocked) {
        [dx, dy] = (hero.lastMovementDeltas || [0, 0]);
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
                // The swimming animation doesn't restart when switching between stationary and moving.
                if (!isFloating && !isSinking) {
                    hero.animationTime = 0;
                }
            }
        } else {
            if ((hero.action === 'walking' || hero.action === 'pushing')
                && !hero.chargingLeftTool && !hero.chargingRightTool && !hero.toolOnCooldown
            ) {
                hero.action = null;
                hero.actionDx = 0;
                hero.actionDy = 0;
                // The swimming animation doesn't restart when switching between stationary and moving.
                if (!isFloating && !isSinking) {
                    hero.animationTime = 0;
                }
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
    let velocityDecay = 0;
    let moveEffectivness = 1;
    //let maxSpeed = 2.5;
    if (hero.bounce) {
        // This happens, for example when the hero hits an enemy while holding the chakram.
        hero.bounce.frames--;
        if (!(hero.bounce.frames > 0)) {
            hero.bounce = null;
        } else {
            velocityDecay = 0.98;
            moveEffectivness = 1 / 20;
        }
    } else if (hero.slipping || hero.swimming || isFloating) {
        if (isFloating || hero.swimming) {
            // Max speed ~5/6, average handling.
            velocityDecay = 0.85;
            moveEffectivness = 1 / 8;
        } else if (hero.savedData.equippedBoots === 'cloudBoots') {
            if (hero.savedData.equipment.cloudBoots >= 2) {
                // Max speed ~2, but better handling + acceleration
                velocityDecay = 0.9;
                moveEffectivness = 1 / 5;
            } else {
                // Max speed ~2
                velocityDecay = 0.95;
                moveEffectivness = 1 / 10;
            }
        } else {
            // Max speed ~2.5, with very poor handling.
            velocityDecay = 0.99;
            moveEffectivness = 1 / 40;
        }
    }
    hero.vx *= velocityDecay;
    hero.vy *= velocityDecay;
    hero.vx += dx * moveEffectivness;
    hero.vy += dy * moveEffectivness;

    const minSpeed = hero.action === 'pushing' ? 2 : 0.2;
    // If dx/dy is set and the player is not moving backwards, make sure velocity is set high enough to trigger movement.
    if (dx > 0 && hero.vx >= 0) {
        hero.vx = Math.max(hero.vx, minSpeed);
    }
    if (dx < 0 && hero.vx <= 0) {
        hero.vx = Math.min(hero.vx, -minSpeed);
    }
    if (dy > 0 && hero.vy >= 0) {
        hero.vy = Math.max(hero.vy, minSpeed);
    }
    if (dy < 0 && hero.vy <= 0) {
        hero.vy = Math.min(hero.vy, -minSpeed);
    }

    // This threshold needs to be small enough that it is reached when moving with cloud boots from a stand still.
    if (Math.abs(hero.vx) >= 0.2 || Math.abs(hero.vy) >= 0.2) {
        const isCharging = hero.action === 'charging';
        const encumbered = hero.pickUpObject || hero.pickUpTile || hero.grabObject || hero.grabTile;
        // Only move if the hero is trying to move in the current direction or if
        // their velocity is sufficiently large enough from slipping to keep them moving.
        const moveX = (Math.abs(hero.vx) >= 0.2 || dx * hero.vx > 0) ? hero.vx : 0;
        const moveY = (Math.abs(hero.vy) >= 0.2 || dy * hero.vy > 0) ? hero.vy : 0;
        if (moveX || moveY) {
            const ox = hero.x, oy = hero.y;
            const movementProperties = {
                canPush: !encumbered && !hero.swimming && !hero.bounce && !isCharging && !isFloating && !isSinking
                    // You can only push if you are moving the direction you are trying to move.
                    // Neither dimension can be negative, and one dimension must be positive.
                    && (hero.vx * dx >= 0 && hero.vy * dy >= 0) && (hero.vx * dx > 0 || hero.vy * dy > 0),
                canClimb: !encumbered && !hero.bounce && !isCharging && !hero.isAstralProjection,
                canCrossLedges: hero.action === 'climbing',
                // This doesn't mean the player will fall, just that they can move into tiles/objects marked as pits.
                canJump: !hero.isAstralProjection,
                // This prevents the movement for trying to line up with the grab object from resulting in extra movement
                // that moves the hero way from the object and causes them to stop grabbing it.
                // This doesn't prevent the hero from wiggling with a push pu
                canWiggle: !hero.grabObject,
                boundingBox: (hero.isAstralProjection || hero.bounce) ? getSectionBoundingBox(state, hero) : undefined,
                actor: hero,
                dx: moveX, dy: moveY,
                canMoveIntoEntranceTiles: hero === state.hero && hero.action !== 'knocked' && hero?.action !== 'thrown',
            }
            const {mx, my} = moveActor(state, hero, moveX, moveY, movementProperties);
            // Don't show the pushing animation when the hero bounces off a wall.
            if (hero.bounce && hero.action === 'pushing') {
                delete hero.action;
            }
            // Update whether the hero is stuck.
            // Any time the hero moves to a new pixel, reset stuckFrames to 0.
            if ((hero.x | 0) != (ox | 0) || (hero.y | 0) != (oy | 0)) {
                hero.stuckFrames = 0;
            } else if (!mx && !my && !canActorMove(state, hero, movementProperties)) {
                // If the hero tried and failed to move this frame, increment stuck frames if they cannot move in any direction.
                // If this accumulates to 1 second of being stuck, respawn them at their last known safe location.
                hero.stuckFrames++;
                if (hero.stuckFrames * FRAME_LENGTH >= 1000) {
                    hero.stuckFrames = 0;
                    hero.vx = 0;
                    hero.vy = 0;
                    hero.d = hero.safeD;
                    hero.x = hero.safeX;
                    hero.y = hero.safeY;
                    hero.justRespawned = true;
                    destroyClone(state, hero);
                    hero.action = null;
                    return;
                }
            }
            // console.log([...state.scriptEvents.activeEvents], [...state.scriptEvents.queue]);
            if (hero.action !== 'knocked' && hero.action !== 'knockedHard' && !hero.bounce) {
                // This works okay, but sometimes causes the hero to press up against diagonal walls when not pressing diagonally.
                /*if (hero.slipping) {
                    if (mx || my) {
                        const speed = Math.sqrt(hero.vx * hero.vx + hero.vy * hero.vy);
                        const theta = Math.atan2(my, mx);
                        hero.vx = (hero.vx + speed * Math.cos(theta)) / 2;
                        hero.vy = (hero.vy + speed * Math.sin(theta)) / 2;
                    }
                } else {*/
                    // This code seems to work okay for slipping, but does cause the player to not slide against diagonal walls
                    // once they stop trying to move.
                    // Do not modify velocity when slipping if it is in the direction the player is attempting to move.
                    if (moveX && (hero.action === 'pushing' || !(hero.slipping && hero.vx * dx > 0))) {
                        hero.vx = mx;
                    }
                    // Do not modify velocity when slipping if it is in the direction the player is attempting to move.
                    if (moveY && (hero.action === 'pushing' || !(hero.slipping && hero.vy * dy > 0))) {
                        hero.vy = my;
                    }
                //}
            }
            if (hero.action === 'jumpingDown') {
                return;
            }
        }
    }
    // Return the climbing animation to a neutral state any time the character isn't moving or trying to move vertically.
    if (!hero.vy && !hero.vx && !dy && hero.action === 'climbing') {
        hero.animationTime = 3 * 6 * FRAME_LENGTH;
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
        if (state.hero.savedData.passiveTools.teleportation &&
            (wasGameKeyPressed(state, GAME_KEY.LEFT_TOOL) || wasGameKeyPressed(state, GAME_KEY.RIGHT_TOOL))
        ) {
            const preventTeleportation = hero.grabObject || hero.grabTile;
            if (!preventTeleportation && state.hero.magic > 0
                && canTeleportToCoords(state, state.hero.area, {x: hero.x, y: hero.y})
            ) {
                state.hero.spendMagic(10);
                state.hero.x = hero.x;
                state.hero.y = hero.y;
                // match the projection to the hero eyes.
                hero.d = 'down';
                return;
            } else {
                // This needs to be played in the area with the main hero, not the astral projection.
                playAreaSound(state, state.hero.area, 'error');
            }
        }
    }

    // Check to start charging the chakram
    if (canAttack
        && (wasGameKeyPressed(state, GAME_KEY.WEAPON) || (hero.attackBufferTime > state.fieldTime - 200))
    ) {
        // Find the highest level Chakram that is not currently in use for the next attack.
        const availableLevel = [2, 1].find(level =>
            // Hero must own this level of Chakram.
            (hero.savedData.weapon & (1 << (level - 1)))
            // This level must not be in use by a held or thrown chakram.
            && hero.heldChakram?.level !== level
            && !hero.thrownChakrams.find(c => c.level === level)
        );
        if (availableLevel > 0) {
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
                level: Math.min(state.hero.savedData.weapon, availableLevel),
            });
            addEffectToArea(state, hero.area, hero.heldChakram);
            return;
        } else if (wasGameKeyPressed(state, GAME_KEY.WEAPON) && state.hero.savedData.weapon) {
            hero.attackBufferTime = state.fieldTime;
        }
    }

    // Check to start charging/preparing a tool for use.
    if (canCharge && hero.toolCooldown <= 0 && !hero.chargingRightTool && !hero.chargingLeftTool && !hero.heldChakram) {
        const controllableClones = state.hero.clones.filter(clone => !clone.isUncontrollable);
        if (state.hero.savedData.leftTool
            && (wasGameKeyPressed(state, GAME_KEY.LEFT_TOOL)
                // Automatically switch to charging if the player continues to hold the cloak button down after creating a barrier.
                || isGameKeyDown(state, GAME_KEY.LEFT_TOOL) && state.hero.savedData.leftTool === 'cloak' && hero.hasBarrier)
            && (state.hero.savedData.leftTool !== 'clone' || !controllableClones.length)
        ) {
            // Currently only the bow tool can be charged.
            if (state.hero.savedData.leftTool === 'bow'
                // "charging" the cloak while it is active is used to activate barrier burst/invisibility
                || (hero.hasBarrier && state.hero.savedData.leftTool === 'cloak')
            ) {
                hero.chargingLeftTool = true;
            } else {
                const direction = getDirection((dx || dy) ? dx : directionMap[hero.d][0], (dx || dy) ? dy : directionMap[hero.d][1], true, hero.d);
                useTool(state, hero, state.hero.savedData.leftTool, directionMap[direction][0], directionMap[direction][1]);
            }
        } else if (state.hero.savedData.rightTool
            && (wasGameKeyPressed(state, GAME_KEY.RIGHT_TOOL)
                // Automatically switch to charging if the player continues to hold the cloak button down after creating a barrier.
                || isGameKeyDown(state, GAME_KEY.RIGHT_TOOL) && state.hero.savedData.rightTool === 'cloak' && hero.hasBarrier)
            && (state.hero.savedData.rightTool !== 'clone' || !controllableClones.length)
        ) {
            // Currently only the bow tool can be charged.
            if (state.hero.savedData.rightTool === 'bow'
                // "charging" the cloak while it is active is used to activate barrier burst/invisibility
                || (hero.hasBarrier && state.hero.savedData.rightTool === 'cloak')
            ) {
                hero.chargingRightTool = true;
            } else {
                const direction = getDirection((dx || dy) ? dx : directionMap[hero.d][0], (dx || dy) ? dy : directionMap[hero.d][1], true, hero.d);
                useTool(state, hero, state.hero.savedData.rightTool, directionMap[direction][0], directionMap[direction][1]);
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
        let closestLiftableTileCoords: TileCoords = null,
            closestObject: ObjectInstance = null,
            closestDistance = 100;
        let glovesLevel = 0;
        // Gloves do not apply to the astral projection.
        if (!hero.isAstralProjection) {
            if (state.hero.savedData.passiveTools.gloves & 2) {
                glovesLevel = 2;
            } else if (state.hero.savedData.passiveTools.gloves & 1) {
                glovesLevel = 1;
            }
        }
        for (const target of tiles) {
            const behavior = hero.area.behaviorGrid?.[target.y]?.[target.x];
            if (behavior?.solid) {
                hero.action = 'grabbing';
                hero.grabTile = target;
            }
            if (glovesLevel >= behavior?.pickupWeight || behavior?.pickupWeight === 0) {
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
            let canGrabObject = object.canGrab?.(state) ?? (!!object.onGrab || !!behavior?.solid);
            if (!canGrabObject) {
                continue;
            }
            if (behavior?.solid) {
                hero.action = 'grabbing';
            }
            if (!object.getHitbox) {
                continue;
            }
            const frame = object.getHitbox();
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
        hero.pickUpFrame = 0;
        if (closestLiftableTileCoords) {
            for (const layer of hero.area.layers) {
                const tile: FullTile = layer.tiles[closestLiftableTileCoords.y][closestLiftableTileCoords.x];
                const behavior = tile?.behaviors;
                if (behavior?.pickupWeight <= glovesLevel) {
                    hero.pickUpTile = behavior.pickupTile ? allTiles[behavior.pickupTile] : tile;
                    playAreaSound(state, hero.area, 'pickUpObject');
                    destroyTile(state, hero.area, {...closestLiftableTileCoords, layerKey: layer.key}, true);
                    if (behavior.linkableTiles) {
                        const alternateLayer = hero.area.alternateArea.layers.find(l => l.key === layer.key);
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
                    hero.grabTile = null;
                    return;
                }
            }
            // hero.grabTile = null;
        } else if (closestObject) {
            if (closestObject.onGrab) {
                closestObject.onGrab(state, hero.d, hero);
            }
            hero.grabObject = closestObject;
            hero.lastTouchedObject = closestObject;
            // Try moving 1px towards grabbed objects to prevent there being a gap between them and the object.
            // This helps prevent cases where the hero+object can't make it through spaces that narrowly fit them together.
            const [dx, dy] = directionMap[hero.d];
            /*const {mx, my} = */moveActor(state, hero, dx, dy);
            // console.log('moving towards grabbed object', {mx, my});
            return;
        }
    }
    if (isPlayerControlled && wasGameKeyPressed(state, GAME_KEY.ROLL)
        && !isActionBlocked
        && !hero.isAstralProjection
        && hero.savedData.passiveTools.roll > 0
        && hero.rollCooldown <= 0
    ) {
        if (state.hero.magic > 0) {
            // Normal roll
            hero.chargeTime = 0;
            if (hero.heldChakram) {
                removeEffectFromArea(state, hero.heldChakram);
                delete hero.heldChakram;
            }
            hero.chargingLeftTool = hero.chargingRightTool = false;
            state.hero.spendMagic(5);
            hero.action = 'roll';
            hero.isAirborn = true;
            hero.actionFrame = 0;
            hero.animationTime = 0;
            // Rolling decreases duration of burns by 1 second.
            if (hero.burnDuration > 0) {
                hero.burnDuration -= 1000;
            }
            const direction = getDirection(
                (dx || dy) ? dx : directionMap[hero.d][0],
                (dx || dy) ? dy : directionMap[hero.d][1], true, hero.d);
            hero.actionDx = directionMap[direction][0];
            hero.actionDy = directionMap[direction][1];
            return;
        } else {
            playAreaSound(state, hero.area, 'error');
        }
    }
    if (
        // Meditation only applies to either the main hero or to all clones, but not both at once.
        ((!isCloneToolDown && hero === state.hero) || (isCloneToolDown && hero !== state.hero))
        && wasGameKeyPressed(state, GAME_KEY.MEDITATE)
    ) {
        if (hero.swimming || (!hero.clones.length && isUnderwater(state, hero))) {
            // The meditate key can be used to quickly toggle iron boots in/under water.
            if (hero.savedData.equipment.ironBoots) {
                if (hero.savedData.equippedBoots !== 'ironBoots') {
                    setEquippedBoots(state, 'ironBoots');
                } else {
                    setEquippedBoots(state, state.hero.savedData.previousBoots || 'leatherBoots');
                }
            }
        } else if (!hero.isAstralProjection
            && !isActionBlocked && (hero.savedData.passiveTools.catEyes || hero.clones.length)
            && !hero.heldChakram && !hero.chargingLeftTool && !hero.chargingRightTool
        ) {
            if (!hero.clones.length) {
                // You can only meditate with no clones up.
                hero.action = 'meditating';
                hero.spiritRadius = 0;
                hero.maxSpiritRadius = MAX_SPIRIT_RADIUS;
                if (state.areaSection?.isFoggy || !canTeleportToCoords(state, state.hero.area.alternateArea, {x: hero.x, y: hero.y})) {
                    hero.maxSpiritRadius = 24;
                }
                if (!hero.savedData.passiveTools.spiritSight) {
                    hero.maxSpiritRadius = 0;
                }
            } else if (hero.clones.filter(clone => !clone.isUncontrollable).length) {
                // You can only charge clone explosion with at least one controllable clone.
                hero.action = 'chargingCloneExplosion';
                hero.explosionTime = 0;
            } else {
                return;
            }
            hero.actionFrame = 0;
            hero.d = 'down';
            if (hero.astralProjection) {
                hero.astralProjection.d = hero.d;
                hero.astralProjection.x = hero.x;
                hero.astralProjection.y = hero.y;
            }
            return;
        }
    }
}
