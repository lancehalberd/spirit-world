import _ from 'lodash';

import {
    addObjectToArea, destroyTile, getAreaFromLocation, getAreaSize,
    removeAllClones, removeObjectFromArea, scrollToArea, setNextAreaSection
} from 'app/content/areas';
import { Enemy } from 'app/content/enemy';
import { editingState } from 'app/development/tileEditor';
import { KEY_THRESHOLD, FRAME_LENGTH, MAX_SPIRIT_RADIUS } from 'app/gameConstants';
import { getActorTargets } from 'app/getActorTargets';
import { GAME_KEY, getMovementDeltas, isKeyDown } from 'app/keyCommands';
import { checkForFloorDamage, moveActor } from 'app/moveActor';
import { getTileFrame } from 'app/render';
import { useTool } from 'app/useTool';
import { directionMap, getDirection, isPointOpen } from 'app/utils/field';
import { rectanglesOverlap } from 'app/utils/index';

import { Actor, GameState, Hero, ObjectInstance, ThrownChakram, ThrownObject, Tile } from 'app/types';

const rollSpeed = [
    5, 5, 5, 5,
    4, 4, 4, 4,
    3, 3, 3, 3,
    2, 2, 2, 2,
];

export function updateHero(this: void, state: GameState) {
    const area = state.areaInstance;
    let dx = 0, dy = 0;
    if (state.hero.invulnerableFrames > 0) {
        state.hero.invulnerableFrames--;
    }
    let movementSpeed = 2;

    const { w, h, section } = getAreaSize(state);

    const hero: Hero = state.hero.activeClone || state.hero;


    // Automatically move the character into the bounds of the current section.
    if (editingState.isEditing) {
        movementSpeed = 0;
        // Hack to prevent player from being damaged or falling into pits while editing.
        hero.invulnerableFrames = 1;
        hero.action = 'roll';
        hero.actionFrame = rollSpeed.length - 1;
        [dx, dy] = getMovementDeltas();
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
    } else if (hero.action === 'falling') {
        movementSpeed = 0;
        hero.actionFrame++;
        if (hero.actionFrame >= 13) {
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
            hero.action = null;
        }
    } else if (hero.action === 'beingMoved' || hero.action === 'entering' || hero.action === 'exiting') {
        movementSpeed = 0;
        hero.actionFrame++;
        // The object moving the hero will take care of their movement until it is completed.
    } else if (hero.action === 'getItem') {
        movementSpeed = 0;
        hero.actionFrame++;
        if (hero.actionFrame >= 50) {
            hero.action = null;
        }
    } else if (hero.action === 'grabbing') {
        movementSpeed = 0;
        if (hero.grabObject?.pullingHeroDirection) {
            dx = directionMap[hero.grabObject.pullingHeroDirection][0];
            dy = directionMap[hero.grabObject.pullingHeroDirection][1];
        } else if (!hero.pickUpTile && (!isKeyDown(GAME_KEY.PASSIVE_TOOL))) {
            hero.action = null;
            hero.grabTile = null;
            hero.grabObject = null;
        } else if (hero.grabObject?.onPull) {
            const [pulldx, pulldy] = getMovementDeltas();
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
                    hero.grabObject.onPull(state, direction);
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
    } else if (hero.pickUpTile) {
        movementSpeed = 1.5;
    } else if (hero.action === 'throwing' ) {
        movementSpeed = 0;
        hero.actionFrame++;
        if (hero.actionFrame === 2) {
            hero.action = null;
        }
    } else if (hero.action === 'meditating') {
        movementSpeed = 0;
        if (isKeyDown(GAME_KEY.PASSIVE_TOOL)) {
            const maxRadius = MAX_SPIRIT_RADIUS;
            hero.spiritRadius = Math.min(hero.spiritRadius + 4, maxRadius);
        } else {
            hero.spiritRadius = Math.max(hero.spiritRadius - 8, 0);
            if (hero.spiritRadius === 0) {
                hero.action = null;
            }
        }
    } else if (hero.action === 'knocked') {
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
    } else if (hero.action === 'attack') {
        movementSpeed = 1;
        hero.actionFrame++;
        if (hero.actionFrame === 6) {
            // const m = Math.sqrt(hero.actionDx * hero.actionDx + hero.actionDy * hero.actionDy);
            const chakram = new ThrownChakram({
                x: hero.x + 3,
                y: hero.y,
                //vx: 4 * (m ? hero.actionDx / m : directionMap[hero.d][0]) + hero.actionDx,
                //vy: 4 * (m ? hero.actionDy / m : directionMap[hero.d][1]) + hero.actionDy,
                vx: 5 * directionMap[hero.d][0],
                vy: 5 * directionMap[hero.d][1],
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
    if (movementSpeed) {
        [dx, dy] = getMovementDeltas();
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
        moveActor(state, hero, dx, dy, true);
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
    if ((!hero.action || hero.action === 'walking' || hero.action === 'pushing') && !hero.pickUpTile && hero.weapon > 0 &&
        isKeyDown(GAME_KEY.WEAPON, KEY_THRESHOLD)
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
    } else if ((!hero.action || hero.action === 'walking' || hero.action === 'pushing') && !hero.pickUpTile) {
        if (state.hero.leftTool && isKeyDown(GAME_KEY.LEFT_TOOL, KEY_THRESHOLD)) {
            hero.toolCooldown = 500;
            useTool(state, hero, state.hero.leftTool, dx, dy);
        } else if (state.hero.rightTool && isKeyDown(GAME_KEY.RIGHT_TOOL, KEY_THRESHOLD)) {
            hero.toolCooldown = 500;
            useTool(state, hero, state.hero.rightTool, dx, dy);
        }
    }
    if (
        (!hero.action || hero.action === 'walking' || hero.action === 'pushing') &&
        !hero.pickUpTile && isKeyDown(GAME_KEY.PASSIVE_TOOL, KEY_THRESHOLD)) {
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
            if (closestLiftableTile) {
                hero.pickUpFrame = 0;
                for (const layer of state.areaInstance.layers) {
                    const palette = layer.palette;
                    const tile = {
                        ...layer.tiles[closestLiftableTile.y][closestLiftableTile.x],
                        layerKey: layer.key,
                    };
                    const behavior = palette.behaviors[`${tile.x}x${tile.y}`];
                    if (behavior?.pickupWeight <= state.hero.passiveTools.gloves) {
                        hero.pickUpTile = tile;
                        destroyTile(state, {...closestLiftableTile, layerKey: layer.key});
                    }
                }
                hero.grabTile = null;
            } else if (closestObject) {
                if (closestObject.onGrab) {
                    closestObject.onGrab(state, hero.d);
                }
                hero.grabObject = closestObject;
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
            if (hero.passiveTools.spiritSight > 0) {
                hero.action = 'meditating';
                hero.d = 'down';
                hero.actionFrame = 0;
                hero.spiritRadius = 0;
            }
        }
    }
    if (hero.pickUpTile) {
        hero.pickUpFrame++;
        if (hero.pickUpFrame >= 5) {
            if (hero.action === 'grabbing') {
                hero.action = null;
            }
            if (isKeyDown(GAME_KEY.PASSIVE_TOOL, KEY_THRESHOLD)) {
                throwHeldObject(state, hero);
            }
        }
    }
    // Mostly don't check for pits/damage when the player cannot control themselves.
    if (hero.action !== 'beingMoved' && hero.action !== 'falling' && hero.action !== 'fallen' && hero.action !== 'knocked'
        && hero.action !== 'dead'  && hero.action !== 'getItem'
    ) {
        checkForFloorDamage(state, hero);
        checkForEnemyDamage(state, hero);
    }
    // Check for transition to other areas/area sections.
    if (!state.nextAreaInstance) {
        // We only move to the next area if the player is moving in the direction of that area.
        // dx/dy handles most cases, but in some cases like moving through doorways we also need to check
        // hero.actionDx
        if (hero.x < 0 && (dx < 0 || hero.actionDx < 0)) {
            state.location.areaGridCoords.x = (state.location.areaGridCoords.x + state.areaGrid[0].length - 1) % state.areaGrid[0].length;
            scrollToArea(state, getAreaFromLocation(state.location), 'left');
        } else if (hero.x + hero.w > w && (dx > 0 || hero.actionDx > 0)) {
            state.location.areaGridCoords.x = (state.location.areaGridCoords.x + 1) % state.areaGrid[0].length;
            scrollToArea(state, getAreaFromLocation(state.location), 'right');
        } else if (hero.x < section.x && (dx < 0 || hero.actionDx < 0)) {
            setNextAreaSection(state, 'left');
        } else if (hero.x + hero.w > section.x + section.w && (dx > 0 || hero.actionDx > 0)) {
            setNextAreaSection(state, 'right');
        }
        if (hero.y < 0 && (dy < 0 || hero.actionDy < 0)) {
            state.location.areaGridCoords.y = (state.location.areaGridCoords.y + state.areaGrid.length - 1) % state.areaGrid.length;
            scrollToArea(state, getAreaFromLocation(state.location), 'up');
        } else if (hero.y + hero.h > h && (dy > 0 || hero.actionDy > 0)) {
            state.location.areaGridCoords.y = (state.location.areaGridCoords.y + 1) % state.areaGrid.length;
            scrollToArea(state, getAreaFromLocation(state.location), 'down');
        } else if (hero.y < section.y && (dy < 0 || hero.actionDy < 0)) {
            setNextAreaSection(state, 'up');
        } else if (hero.y + hero.h > section.y + section.h && (dy > 0 || hero.actionDy > 0)) {
            setNextAreaSection(state, 'down');
        }
    }
    if (hero.life <= 0) {
        state.defeated = true;
        state.menuIndex = 0;
    }
    state.hero.magic += state.hero.magicRegen * FRAME_LENGTH / 1000;
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
        if (enemy.enemyDefinition.touchDamage && rectanglesOverlap(hero, enemy)) {
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
        removeObjectFromArea(state, state.areaInstance, lastClone);
    } else {
        // If a non-hero clone is destroyed we just remove it from the array of clones.
        const index = state.hero.clones.indexOf(clone as any);
        if (index >= 0) {
            state.hero.clones.splice(index, 1);
        }
        removeObjectFromArea(state, state.areaInstance, clone);
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
    if (!overrideInvulnerability && (actor.action === 'roll' || actor.action === 'getItem')) {
        return;
    }
    const hero = state.hero.activeClone || state.hero;
    // Hero is invulnerable during invulnerability frames, but other actors are not.
    if (!overrideInvulnerability && actor === hero && (actor.invulnerableFrames > 0 || state.hero.invisible)) {
        return;
    }

    // If any clones are in use, any damage one takes destroys it until only one clone remains.
    if (actor === state.hero || state.hero.clones.indexOf(actor as any) >= 0) {
        // Damage applies to the hero, not the clone.
        state.hero.life -= damage;
        state.hero.invulnerableFrames = 50;
        // Taking damage resets radius for spirit sight meditation.
        state.hero.spiritRadius = 0;
        if (state.hero.clones.length) {
            destroyClone(state, actor as any);
        }
    } else {
        actor.life -= damage;
        // For enemies, this is actually the number of rames they cannot damage the hero for.
        actor.invulnerableFrames = 50;
    }

    if (knockback) {
        // Throw stone here.
        throwHeldObject(state, hero);
        actor.action = 'knocked';
        actor.vx = knockback.vx;
        actor.vy = knockback.vy;
        actor.vz = knockback.vz;
    }
}

export function throwHeldObject(state: GameState, hero: Hero){
    if (!hero.pickUpTile) {
        return;
    }
    hero.action = 'throwing';
    hero.actionFrame = 0;
    const throwSpeed = 6;
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
    addObjectToArea(state, state.areaInstance, thrownObject);
    hero.pickUpTile = null;
}


