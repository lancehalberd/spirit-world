import _ from 'lodash';

import {
    addObjectToArea, destroyTile, getAreaFromLocation, getAreaSize,
    removeAllClones, removeObjectFromArea, scrollToArea, setNextAreaSection,
    swapHeroStates,
} from 'app/content/areas';
import { CloneExplosionEffect } from 'app/content/effects/CloneExplosionEffect';
import { Enemy } from 'app/content/enemy';
import { editingState } from 'app/development/tileEditor';
import { EXPLOSION_TIME, FRAME_LENGTH, GAME_KEY, MAX_SPIRIT_RADIUS } from 'app/gameConstants';
import { getActorTargets } from 'app/getActorTargets';
import {
    getCloneMovementDeltas,
    isGameKeyDown,
    wasGameKeyPressed,
    wasGameKeyPressedAndReleased,
} from 'app/keyCommands';
import { checkForFloorEffects, moveActor } from 'app/moveActor';
import { getTileFrame } from 'app/render';
import { fallAnimation } from 'app/renderActor';
import { useTool } from 'app/useTool';
import { directionMap, getDirection, isPointOpen } from 'app/utils/field';
import { rectanglesOverlap } from 'app/utils/index';
import { playSound } from 'app/utils/sounds';

import { Actor, Clone, GameState, Hero, ObjectInstance, ThrownChakram, ThrownObject, Tile } from 'app/types';

const rollSpeed = [
    5, 5, 5, 5,
    4, 4, 4, 4,
    3, 3, 3, 3,
    2, 2, 2, 2,
];

export function updateAllHeroes(this: void, state: GameState) {
    if (state.hero.invulnerableFrames > 0) {
        state.hero.invulnerableFrames--;
    }
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
    updateHero(state, state.hero);
}

export function updateHero(this: void, state: GameState, hero: Hero) {
    const area = state.areaInstance;
    let dx = 0, dy = 0;
    let movementSpeed = 2;

    const { w, h, section } = getAreaSize(state);

    const isCloneToolDown = (state.hero.leftTool === 'clone' && isGameKeyDown(state, GAME_KEY.LEFT_TOOL))
        || (state.hero.rightTool === 'clone' && isGameKeyDown(state, GAME_KEY.RIGHT_TOOL));
    const primaryClone = state.hero.activeClone || state.hero;
    const isControlled = isCloneToolDown || hero === primaryClone;

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
        if (dx || dy) hero.d = getDirection(dx, dy);
    } else if (state.nextAreaInstance) {
        movementSpeed = 0;
        if (state.nextAreaInstance.cameraOffset.x && state.hero.action !== 'entering') {
            // We need to make sure this is low enough that the character doesn't get entirely into the second column,
            // otherwise horizontal doors won't work as expected.
            dx = 0.75 * state.nextAreaInstance.cameraOffset.x / Math.abs(state.nextAreaInstance.cameraOffset.x);
        }
        if (state.nextAreaInstance.cameraOffset.y && state.hero.action !== 'entering') {
            dy = 1 * state.nextAreaInstance.cameraOffset.y / Math.abs(state.nextAreaInstance.cameraOffset.y);
        }
    } else if (hero.x + hero.w > section.x + section.w + 1) {
        movementSpeed = 0;
        hero.x -= 0.5;
        //dx = -1;
    } else if (hero.x < section.x - 1) {
        movementSpeed = 0;
        hero.x += 0.5;
        //dx = 1;
    } else if (hero.y + hero.h > section.y + section.h + 1) {
        movementSpeed = 0;
        hero.y -= 0.5;
        //dy = -1;
    } else if (hero.y < section.y - 1) {
        movementSpeed = 0;
        hero.y += 0.5;
        //dy = 1;
    } else if (hero.action === 'swimming') {
        movementSpeed = 1.5;
    } else if (hero.action === 'climbing') {
        movementSpeed = 1;
    }  else if (hero.action === 'falling') {
        movementSpeed = 0;
        if (hero.animationTime >= fallAnimation.duration) {
            hero.action = 'fallen';
            hero.actionFrame = 0;
        }
    } else if (hero.action === 'fallen') {
        movementSpeed = 0;
        hero.actionFrame++;
        if (hero.actionFrame >= 8) {
            hero.d = hero.safeD;
            hero.x = hero.safeX;
            hero.y = hero.safeY;
            damageActor(state, hero, 1, null, true);
            // For now leave the hero in the 'fallen' state if they died, otherwise they reappear
            // just fine when the continue/quit option shows up.
            // Once the death animation is added we can probably remove this check if we want.
            if (hero.life > 0) {
                hero.action = null;
            }
        }
    } else if (hero.action === 'jumpingDown') {
        movementSpeed = 0;
        // After the hero has jumped a bit, we stop the jump when they hit a position they can successfully move to.
        if (hero.vy > 4 && moveActor(state, hero, hero.vx, hero.vy, {canFall: true})) {
            hero.action = null;
            hero.animationTime = 0;
        } else {
            // This is necessary to ignore any changes to actions that calling `moveActor` might trigger.
            hero.action = 'jumpingDown';
            hero.x += hero.vx;
            hero.y += hero.vy;
            hero.vy = Math.min(8, hero.vy + 0.5);
        }
    } else if (hero.action === 'beingCarried') {
        // The clone will update itself to match its carrier.
        hero.animationTime = 0;
        movementSpeed = 0;
    } else if (hero.action === 'entering' || hero.action === 'exiting') {
        // The door will move the player until the action is complete.
        movementSpeed = 0;
        hero.actionFrame++;
    } else if (hero.action === 'getItem') {
        movementSpeed = 0;
        hero.actionFrame++;
        // The hero doesn't update while the loot item is displayed, so we don't
        // need to show this for many frames after the hero starts updating again.
        if (hero.actionFrame >= 5) {
            hero.action = null;
        }
    } else if (hero.action === 'grabbing') {
        movementSpeed = 0;
        if (hero.grabObject?.pullingHeroDirection) {
            dx = directionMap[hero.grabObject.pullingHeroDirection][0];
            dy = directionMap[hero.grabObject.pullingHeroDirection][1];
        } else if (!hero.pickUpTile && !hero.pickUpObject && (!isGameKeyDown(state, GAME_KEY.PASSIVE_TOOL))) {
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
                if ((direction === hero.d && (hero.x === hero.grabObject.x || hero.y === hero.grabObject.y))
                    || points.every(x => points.every(y => isPointOpen(state, hero.area,
                        {x: hero.x + x + 16 * directionMap[direction][0], y: hero.y + y + 16 * directionMap[direction][1] }
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
        movementSpeed = 1.5;
    } else if (hero.action === 'throwing' ) {
        movementSpeed = 0;
        hero.actionFrame++;
        if (hero.actionFrame === 2) {
            hero.action = null;
        }
    } else if (hero.action === 'meditating') {
        movementSpeed = 0;
        if (isControlled && isGameKeyDown(state, GAME_KEY.PASSIVE_TOOL)) {
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
            }
        } else {
            hero.explosionTime = 0;
            hero.spiritRadius = Math.max(hero.spiritRadius - 8, 0);
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
        if (hero.z <= 0) {
            hero.z = 0;
            hero.action = null;
            hero.vz = 0;
        }
    } else if (hero.z > 0) {
        hero.action = 'knocked';
        dx = 0;
        dy = 0;
    } else if (hero.action === 'attack') {
        movementSpeed = 1;
        hero.actionFrame++;
        if (hero.actionFrame === 6) {
            const direction = (hero.actionDx || hero.actionDy) ? getDirection(hero.actionDx, hero.actionDy, true) : hero.d;
            const chakram = new ThrownChakram({
                x: hero.x + 3,
                y: hero.y,
                vx: 5 * directionMap[direction][0],
                vy: 5 * directionMap[direction][1],
                returnSpeed: 4,
                source: hero,
            });
            addObjectToArea(state, state.areaInstance, chakram);
        }
        if (hero.actionFrame > 12) {
            hero.action = null;
            hero.actionDx = 0;
            hero.actionDy = 0;
        }
    } else if (hero.action === 'roll') {
        movementSpeed = 0;
        dx = directionMap[hero.d][0] * rollSpeed[hero.actionFrame];
        dy = directionMap[hero.d][1] * rollSpeed[hero.actionFrame];
        hero.actionFrame++;
        if (hero.actionFrame >= rollSpeed.length) {
            hero.action = null;
            hero.animationTime = 0;
        }
    }
    if (hero.action === 'pushing') {
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
            }
        }
    }
    if (dx || dy) {
        const encumbered = hero.pickUpObject || hero.pickUpTile;
        moveActor(state, hero, dx, dy, {
            canPush: !encumbered,
            canClimb: !encumbered,
            canFall: true,
            canSwim: !encumbered,
        });
        if (!hero.action) {
            hero.action = 'walking';
            hero.animationTime = 0;
        } else {
            hero.animationTime += FRAME_LENGTH;
        }
    } else {
        if (hero.action === 'walking' || hero.action === 'pushing') {
            hero.action = null;
            hero.animationTime = 0;
        } else {
            hero.animationTime += FRAME_LENGTH;
        }
    }
    if (isControlled && (!hero.action || hero.action === 'walking' || hero.action === 'pushing')
        && !hero.pickUpTile && !hero.pickUpObject &&  hero.weapon > 0
        && wasGameKeyPressed(state, GAME_KEY.WEAPON)
    ) {
        const thrownChakrams = state.areaInstance.objects.filter(o => o instanceof ThrownChakram);
        if (state.hero.weapon - thrownChakrams.length > 0) {
            hero.action = 'attack';
            hero.animationTime = 0;
            hero.actionDx = dx;
            hero.actionDy = dy;
            hero.actionFrame = 0;
        }
    }

    if (hero.toolCooldown > 0) {
        hero.toolCooldown -= FRAME_LENGTH;
    } else if ((!hero.action || hero.action === 'walking' || hero.action === 'pushing')
        && !hero.pickUpTile && !hero.pickUpObject
    ) {
        if (isControlled && state.hero.leftTool && wasGameKeyPressed(state, GAME_KEY.LEFT_TOOL)) {
            hero.toolCooldown = 500;
            useTool(state, hero, state.hero.leftTool, dx, dy);
        } else if (isControlled && state.hero.rightTool && wasGameKeyPressed(state, GAME_KEY.RIGHT_TOOL)) {
            hero.toolCooldown = 500;
            useTool(state, hero, state.hero.rightTool, dx, dy);
        }
    }
    if (isControlled &&
        (!hero.action || hero.action === 'walking' || hero.action === 'pushing') &&
        !hero.pickUpTile && !hero.pickUpObject && wasGameKeyPressed(state, GAME_KEY.PASSIVE_TOOL)) {
        const {objects, tiles} = getActorTargets(state, hero);
        if (tiles.some(({x, y}) => area.behaviorGrid?.[y]?.[x]?.solid) || objects.some(o => o.behaviors?.solid)) {
            //console.log({dx, dy, tiles, objects});
            let closestLiftableTile: Tile = null, closestObject: ObjectInstance = null, closestDistance = 100;
            for (const target of tiles) {
                const behavior = area.behaviorGrid?.[target.y]?.[target.x];
                if (behavior?.solid) {
                    hero.action = 'grabbing';
                    hero.grabTile = target;
                }
                if (hero.passiveTools.gloves >= behavior?.pickupWeight) {
                    // This is an unusual distance, but should do what we want still.
                    const distance = (
                        Math.abs(target.x * area.palette.w - hero.x) +
                        Math.abs(target.y * area.palette.h - hero.y)
                    );
                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestLiftableTile = target;
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
                        closestLiftableTile = null;
                    }
                }
            }
            hero.pickUpFrame = 0;
            if (closestLiftableTile) {
                for (const layer of state.areaInstance.layers) {
                    const palette = layer.palette;
                    const tile = {
                        ...layer.tiles[closestLiftableTile.y][closestLiftableTile.x],
                        layerKey: layer.key,
                    };
                    const behavior = palette.behaviors[`${tile.x}x${tile.y}`];
                    if (behavior?.pickupWeight <= state.hero.passiveTools.gloves) {
                        hero.pickUpTile = tile;
                        destroyTile(state, state.areaInstance, {...closestLiftableTile, layerKey: layer.key});
                        if (behavior.linked) {
                            const alternateLayer = _.find(state.alternateAreaInstance.layers, {key: layer.key});
                            if(alternateLayer) {
                                const alternateTile = {
                                    ...alternateLayer.tiles[closestLiftableTile.y][closestLiftableTile.x],
                                    layerKey: alternateLayer.key,
                                };
                                if (alternateTile.x === tile.x && alternateTile.y === tile.y) {
                                    hero.pickUpTile.linked = true;
                                    destroyTile(state, state.alternateAreaInstance, {...closestLiftableTile, layerKey: layer.key});
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
                if (state.hero.magic >= 5) {
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
            }
        }
    }
    if (hero.pickUpTile || hero.pickUpObject) {
        hero.pickUpFrame++;
        if (hero.pickUpFrame >= 5) {
            if (hero.action === 'grabbing') {
                hero.action = null;
            }
            if (isControlled && wasGameKeyPressed(state, GAME_KEY.PASSIVE_TOOL)) {
                throwHeldObject(state, hero);
            }
        }
    }
    // Mostly don't check for pits/damage when the player cannot control themselves.
    if (hero.action !== 'beingCarried' && hero.action !== 'falling' && hero.action !== 'fallen' && hero.action !== 'knocked'
        && hero.action !== 'dead'  && hero.action !== 'getItem'
    ) {
        checkForFloorEffects(state, hero);
        checkForEnemyDamage(state, hero);
    }
    // Check for transition to other areas/area sections.
    const isMovingThroughZoneDoor = hero.actionTarget?.definition?.type === 'door'
        && hero.actionTarget.definition.targetZone
        && hero.actionTarget.definition.targetObjectId
    // Do not trigger the scrolling transition when traveling through a zone door.
    // Zone doors will eventually use a screen wipe transition.
    if (!state.nextAreaInstance && !isMovingThroughZoneDoor) {
        // We only move to the next area if the player is moving in the direction of that area.
        // dx/dy handles most cases, but in some cases like moving through doorways we also need to check
        // hero.actionDx
        if (hero.x < 0 && (dx < 0 || hero.actionDx < 0)) {
            state.location.areaGridCoords = {
                x: (state.location.areaGridCoords.x + state.areaGrid[0].length - 1) % state.areaGrid[0].length,
                y: state.location.areaGridCoords.y,
            };
            scrollToArea(state, getAreaFromLocation(state.location), 'left');
        } else if (hero.x + hero.w > w && (dx > 0 || hero.actionDx > 0)) {
            state.location.areaGridCoords = {
                x: (state.location.areaGridCoords.x + 1) % state.areaGrid[0].length,
                y: state.location.areaGridCoords.y,
            };
            scrollToArea(state, getAreaFromLocation(state.location), 'right');
        } else if (hero.x < section.x && (dx < 0 || hero.actionDx < 0)) {
            setNextAreaSection(state, 'left');
        } else if (hero.x + hero.w > section.x + section.w && (dx > 0 || hero.actionDx > 0)) {
            setNextAreaSection(state, 'right');
        }
        const isHeroMovingDown = (dy > 0 || hero.actionDy > 0 || (hero.action === 'jumpingDown' && hero.vy > 0));
        if (hero.y < 0 && (dy < 0 || hero.actionDy < 0)) {
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
        } else if (hero.y < section.y && (dy < 0 || hero.actionDy < 0)) {
            setNextAreaSection(state, 'up');
        } else if (hero.y + hero.h > section.y + section.h && isHeroMovingDown) {
            setNextAreaSection(state, 'down');
        }
    }
    if (hero.life <= 0) {
        state.defeated = true;
        state.menuIndex = 0;
    }
    state.hero.magic += state.hero.magicRegen * FRAME_LENGTH / 1000;
    // Spirit regenerates twice as quickly when idle.
    if (!state.hero.action) {
        state.hero.magic += state.hero.magicRegen * FRAME_LENGTH / 1000;
    }
    // Clones drain 2 magic per second.
    state.hero.magic -= 2 * state.hero.clones.length * FRAME_LENGTH / 1000;
    if (state.hero.invisible) {
        state.hero.magic -= state.hero.invisibilityCost * FRAME_LENGTH / 1000;
        // Invisibility cost increases while it is active.
        state.hero.invisibilityCost += 4 * FRAME_LENGTH / 1000;
    } else if (state.hero.invisibilityCost > 0 ){
        // Invisibility cost returns to 0 while it is off.
        state.hero.invisibilityCost -= 4 * FRAME_LENGTH / 1000;
        state.hero.invisibilityCost = Math.max(0, state.hero.invisibilityCost);
    }
    if (hero.action !== 'knocked' && hero.action !== 'thrown') {
        // At base mana regen, using cat eyes reduces your mana very slowly unless you are stationary.
        let targetLightRadius = 20, minLightRadius = 20;
        if (state.areaInstance.definition.dark) {
            const coefficient = 100 / state.areaInstance.definition.dark;
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
    if (editingState.isEditing) {
        state.hero.magic = state.hero.maxMagic;
    }
    if (state.hero.magic < 0) {
        state.hero.magic = 0;
        state.hero.invisible = false;
        if (state.hero.clones.length) {
            state.hero.x = hero.x;
            state.hero.y = hero.y;
            removeAllClones(state);
        }
    }
    if (state.hero.magic > state.hero.maxMagic) {
        state.hero.magic = state.hero.maxMagic;
    }
    state.location.x = state.hero.x;
    state.location.y = state.hero.y;
}

export function checkForEnemyDamage(state: GameState, hero: Hero) {
    if (hero.action === 'roll' || hero.action === 'getItem' || hero.invulnerableFrames > 0 || state.hero.invisible) {
        return;
    }
    for (const enemy of state.areaInstance.objects) {
        if (!(enemy instanceof Enemy) || enemy.invulnerableFrames > 0) {
            continue;
        }
        if (enemy.enemyDefinition.touchDamage && rectanglesOverlap(hero, enemy.getHitbox(state))) {
            //const dx = (hero.x + hero.w / 2) - (enemy.x + enemy.w / 2);
            //const dy = (hero.y + hero.h / 2) - (enemy.y + enemy.h / 2);
            damageActor(state, hero, enemy.enemyDefinition.touchDamage, {
                vx: - 4 * directionMap[hero.d][0],
                vy: - 4 * directionMap[hero.d][1],
                vz: 2,
            });
        }
    }
}

export function destroyClone(state: GameState, clone: Hero): void {
    // Cannot destroy a clone if none remain.
    if (!state.hero.clones.length) {
        return;
    }
    if (clone === state.hero) {
        // If the "clone" destroyed was the hero, then pop the last clone and move the hero to it.
        const lastClone = state.hero.clones.pop();
        state.hero.x = lastClone.x;
        state.hero.y = lastClone.y;
        removeObjectFromArea(state, lastClone);
    } else {
        // If a non-hero clone is destroyed we just remove it from the array of clones.
        const index = state.hero.clones.indexOf(clone as any);
        if (index >= 0) {
            state.hero.clones.splice(index, 1);
        }
        removeObjectFromArea(state, clone);
    }
    // If the active clone is destroyed, we return control to the main hero.
    if (state.hero.activeClone === clone) {
        state.hero.activeClone = null;
    }
}

export function damageActor(
    state: GameState,
    actor: Actor,
    damage: number,
    knockback?: {vx: number, vy: number, vz: number},
    overrideInvulnerability: boolean = false
) {
    if (actor.life <= 0) {
        return;
    }
    if (!overrideInvulnerability && (actor.action === 'roll' || actor.action === 'getItem')) {
        return;
    }
    const hero = state.hero.activeClone || state.hero;
    // Hero is invulnerable during invulnerability frames, but other actors are not.
    if (!overrideInvulnerability && actor === hero && (actor.invulnerableFrames > 0 || state.hero.invisible)) {
        return;
    }

    if (actor.takeDamage) {
        actor.takeDamage(state, damage);
    } else if (actor === state.hero || state.hero.clones.indexOf(actor as any) >= 0) {
        // If any clones are in use, any damage one takes destroys it until only one clone remains.
        // Damage applies to the hero, not the clone.
        state.hero.life -= damage;
        state.hero.invulnerableFrames = 50;
        // Taking damage resets radius for spirit sight meditation.
        state.hero.spiritRadius = 0;
        if (state.hero.clones.length) {
            destroyClone(state, actor as any);
        }
    }

    if (knockback) {
        throwHeldObject(state, hero);
        actor.action = 'knocked';
        actor.animationTime = 0;
        actor.vx = knockback.vx;
        actor.vy = knockback.vy;
        actor.vz = knockback.vz;
    }
}

const throwSpeed = 6;
export function throwHeldObject(state: GameState, hero: Hero){
    if (hero.pickUpObject) {
        // This assumes only clones can be picked up and thrown. We will have to update this if
        // we add other objects to this category.
        const clone = hero.pickUpObject as Clone;
        clone.d = hero.d;
        clone.vx = directionMap[hero.d][0] * throwSpeed;
        clone.vy = directionMap[hero.d][1] * throwSpeed;
        clone.vz = 2;
        clone.action = 'thrown';
        clone.animationTime = 0;
        clone.carrier = null;
        hero.pickUpObject = null;
        return;
    }
    if (!hero.pickUpTile) {
        return;
    }
    hero.action = 'throwing';
    hero.actionFrame = 0;
    const tile = hero.pickUpTile;
    const layer = _.find(state.areaInstance.layers, { key: tile.layerKey});
    const palette = layer.palette;
    const behaviors = palette.behaviors[`${tile.x}x${tile.y}`];
    const thrownObject = new ThrownObject({
        frame: getTileFrame(state.areaInstance, hero.pickUpTile),
        particles: behaviors?.particles,
        x: hero.x,
        y: hero.y,
        vx: directionMap[hero.d][0] * throwSpeed,
        vy: directionMap[hero.d][1] * throwSpeed,
        vz: 2,
    });
    thrownObject.behaviors.brightness = behaviors?.brightness;
    thrownObject.behaviors.lightRadius = behaviors?.lightRadius;
    addObjectToArea(state, state.areaInstance, thrownObject);
    if (tile.linked) {
        const layer = _.find(state.alternateAreaInstance.layers, { key: tile.layerKey});
        const palette = layer.palette;
        const behaviors = palette.behaviors[`${tile.x}x${tile.y}`];
        const alternateThrownObject = new ThrownObject({
            frame: getTileFrame(state.alternateAreaInstance, hero.pickUpTile),
            particles: behaviors?.particles,
            x: hero.x,
            y: hero.y,
            vx: directionMap[hero.d][0] * throwSpeed,
            vy: directionMap[hero.d][1] * throwSpeed,
            vz: 2,
        });
        alternateThrownObject.linkedObject = thrownObject;
        alternateThrownObject.behaviors.brightness = behaviors?.brightness;
        alternateThrownObject.behaviors.lightRadius = behaviors?.lightRadius;
        thrownObject.linkedObject = alternateThrownObject;
        addObjectToArea(state, state.alternateAreaInstance, alternateThrownObject);
    }
    hero.pickUpTile = null;
}


