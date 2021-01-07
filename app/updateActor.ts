import {
    destroyTile, getAreaFromGridCoords, getAreaSize,
    removeAllClones, removeObjectFromArea, scrollToArea, setAreaSection
} from 'app/content/areas';
import { Enemy } from 'app/content/enemy';
import { editingState } from 'app/development/tileEditor';
import { KEY_THRESHOLD, FRAME_LENGTH } from 'app/gameConstants';
import { getActorTargets } from 'app/getActorTargets';
import { GAME_KEY, getMovementDeltas, isKeyDown } from 'app/keyCommands';
import { checkForFloorDamage, moveActor } from 'app/moveActor';
import { getTileFrame } from 'app/render';
import { useTool } from 'app/useTool';
import { directionMap, getDirection, isPointOpen } from 'app/utils/field';
import { rectanglesOverlap } from 'app/utils/index';
import { getState, initializeState } from 'app/state';

import { Actor, GameState, Hero, ObjectInstance, ThrownChakram, ThrownObject, Tile } from 'app/types';

const rollSpeed = [5, 5, 5, 4, 4, 4, 4, 3, 3, 3, 2, 2];

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
        if (state.nextAreaInstance.cameraOffset.x) {
            dx = 1 * state.nextAreaInstance.cameraOffset.x / Math.abs(state.nextAreaInstance.cameraOffset.x);
        }
        if (state.nextAreaInstance.cameraOffset.y) {
            dy = 1 * state.nextAreaInstance.cameraOffset.y / Math.abs(state.nextAreaInstance.cameraOffset.y);
        }
    } else if (hero.x + hero.w > section.x + section.w + 1) {
        movementSpeed = 0;
        dx = -1;
    } else if (hero.x < section.x - 1) {
        movementSpeed = 0;
        dx = 1;
    } else if (hero.y + hero.h > section.y + section.h + 1) {
        movementSpeed = 0;
        dy = -1;
    } else if (hero.y < section.y - 1) {
        movementSpeed = 0;
        dy = 1;
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
            [dx, dy] = getMovementDeltas();
            if (dx || dy) {
                const direction = getDirection(dx, dy);
                const x = hero.x + 8 + 16 * directionMap[direction][0];
                const y = hero.y + 8 + 16 * directionMap[direction][1];
                if (direction === hero.d || isPointOpen(state, {x, y})) {
                    hero.grabObject.onPull(state, direction);
                }
            }
        }
    } else if (hero.action === 'carrying') {
        movementSpeed = 1.5;
    } else if (hero.action === 'throwing' ) {
        movementSpeed = 0;
        hero.actionFrame++;
        if (hero.actionFrame === 2) {
            hero.action = null;
        }
    } else if (hero.action === 'knocked') {
        movementSpeed = 0;
        dx = hero.vx;
        dy = hero.vy;
        hero.z += hero.vz;
        hero.vz -= 0.5;
        if (hero.z <= 0) {
            hero.action = null;
            hero.vz = 0;
        }
    } else if (hero.action === 'attack') {
        movementSpeed = 1;
        hero.actionFrame++;
        if (hero.actionFrame === 1) {
            state.hero.chakrams--;
            const m = Math.sqrt(hero.actionDx * hero.actionDx + hero.actionDy * hero.actionDy);
            const chakram = new ThrownChakram({
                x: hero.x + 3,
                y: hero.y + 3,
                vx: 4 * (m ? hero.actionDx / m : directionMap[hero.d][0]) + hero.actionDx,
                vy: 4 * (m ? hero.actionDy / m : directionMap[hero.d][1]) + hero.actionDy,
                returnSpeed: 4,
                source: hero,
            });
            state.areaInstance.objects.push(chakram);
        }
        if (hero.actionFrame > 10) {
            hero.action = null;
        }
    } else if (hero.action === 'roll') {
        movementSpeed = 0;
        dx = directionMap[hero.d][0] * rollSpeed[hero.actionFrame];
        dy = directionMap[hero.d][1] * rollSpeed[hero.actionFrame];
        hero.actionFrame++;
        if (hero.actionFrame >= rollSpeed.length) {
            hero.action = null;
        }
    }
    if (movementSpeed) {
        [dx, dy] = getMovementDeltas();
        if (dx || dy) {
            const m = Math.sqrt(dx * dx + dy * dy);
            dx = movementSpeed * dx / m;
            dy = movementSpeed * dy / m;
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
    if (dx || dy) {
        moveActor(state, hero, dx, dy, true);
    }
    if (!hero.action && !hero.pickUpTile && hero.activeTools.weapon > 0 &&
        state.hero.chakrams > 0 && isKeyDown(GAME_KEY.WEAPON, KEY_THRESHOLD)
    ) {
        hero.action = 'attack';
        hero.actionDx = dx;
        hero.actionDy = dy;
        hero.actionFrame = 0;
    }

    if (hero.toolCooldown > 0) {
        hero.toolCooldown -= FRAME_LENGTH;
    } else if (!hero.action && !hero.pickUpTile) {
        if (state.hero.leftTool && isKeyDown(GAME_KEY.LEFT_TOOL, KEY_THRESHOLD)) {
            hero.toolCooldown = 500;
            useTool(state, hero, state.hero.leftTool, dx, dy);
        } else if (state.hero.rightTool && isKeyDown(GAME_KEY.RIGHT_TOOL, KEY_THRESHOLD)) {
            hero.toolCooldown = 500;
            useTool(state, hero, state.hero.rightTool, dx, dy);
        }
    }
    if (!hero.action && !hero.pickUpTile && isKeyDown(GAME_KEY.PASSIVE_TOOL, KEY_THRESHOLD)) {
        const {objects, tiles} = getActorTargets(state, hero);
        if ((dx || dy) && !tiles.some(({x, y}) => area.behaviorGrid?.[y]?.[x]?.solid) && !objects.some(o => o.behaviors?.solid)) {
            if (hero.passiveTools.roll > 0) {
                if (state.hero.magic >= 5) {
                    state.hero.magic -= 5;
                    hero.action = 'roll';
                    hero.actionFrame = 0;
                } else {
                    // Hack to freeze player for a moment
                    hero.action = 'getItem';
                    hero.actionFrame = 30;
                    // We should play an insufficient mana sound here.
                }
            }
        } else {
            //console.log({dx, dy, tiles, objects});
            let closestLiftableTile: Tile = null, closestObject: ObjectInstance = null, closestDistance = 100;
            for (const target of tiles) {
                const behavior = area.behaviorGrid?.[target.y]?.[target.x];
                if (behavior?.solid) {
                    hero.action = 'grabbing';
                    hero.grabTile = target;
                }
                if (hero.passiveTools.gloves >= behavior?.pickupWeight && behavior?.underTile) {
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
                const layer = area.layers[0];
                const tile = layer.tiles[closestLiftableTile.y]?.[closestLiftableTile.x];
                hero.pickUpFrame = 0;
                hero.pickUpTile = tile;
                destroyTile(state, closestLiftableTile);
                hero.grabTile = null;
            } else if (closestObject) {
                if (closestObject.onGrab) {
                    closestObject.onGrab(state, hero.d);
                }
                hero.grabObject = closestObject;
            }
        }
    }
    if (hero.pickUpTile) {
        hero.pickUpFrame++;
        if (hero.pickUpFrame >= 5) {
            hero.action = 'carrying';
            if (isKeyDown(GAME_KEY.PASSIVE_TOOL, KEY_THRESHOLD)) {
                throwHeldObject(hero, state);
            }
        }
    }
    checkForFloorDamage(state, hero);
    checkForEnemyDamage(state, hero);
    // Check for transition to other areas/area sections.
    if (!state.nextAreaInstance) {
        if (hero.x < 0 && dx < 0) {
            state.areaGridCoords.x = (state.areaGridCoords.x + state.areaGrid[0].length - 1) % state.areaGrid[0].length;
            scrollToArea(state, getAreaFromGridCoords(state.areaGrid, state.areaGridCoords), 'left');
        } else if (hero.x + hero.w > w && dx > 0) {
            state.areaGridCoords.x = (state.areaGridCoords.x + 1) % state.areaGrid[0].length;
            scrollToArea(state, getAreaFromGridCoords(state.areaGrid, state.areaGridCoords), 'right');
        } else if (hero.x < section.x && dx < 0) {
            setAreaSection(state, 'left');
        } else if (hero.x + hero.w > section.x + section.w && dx > 0) {
            setAreaSection(state, 'right');
        }
        if (hero.y < 0 && dy < 0) {
            state.areaGridCoords.y = (state.areaGridCoords.y + state.areaGrid.length - 1) % state.areaGrid.length;
            scrollToArea(state, getAreaFromGridCoords(state.areaGrid, state.areaGridCoords), 'up');
        } else if (hero.y + hero.h > h && dy > 0) {
            state.areaGridCoords.y = (state.areaGridCoords.y + 1) % state.areaGrid.length;
            scrollToArea(state, getAreaFromGridCoords(state.areaGrid, state.areaGridCoords), 'down');
        } else if (hero.y < section.y && dy < 0) {
            setAreaSection(state, 'up');
        } else if (hero.y + hero.h > section.y + section.h && dy > 0) {
            setAreaSection(state, 'down');
        }
    }
    if (hero.life <= 0) {
        initializeState();
        getState().gameHasBeenInitialized = true;
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
        removeObjectFromArea(state.areaInstance, lastClone);
    } else {
        // If a non-hero clone is destroyed we just remove it from the array of clones.
        const index = state.hero.clones.indexOf(clone as any);
        if (index >= 0) {
            state.hero.clones.splice(index, 1);
        }
        removeObjectFromArea(state.areaInstance, clone);
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
    if (state.hero.clones.length && (actor === state.hero || state.hero.clones.indexOf(actor as any) >= 0)) {
        // Damage applies to the hero, not the clone.
        state.hero.life -= damage;
        state.hero.invulnerableFrames = 50;
        destroyClone(state, actor as any);
    } else {
        actor.life -= damage;
        // For enemies, this is actually the number of rames they cannot damage the hero for.
        actor.invulnerableFrames = 50;
    }

    if (knockback) {
        // Throw stone here.
        throwHeldObject(hero, state);
        actor.action = 'knocked';
        actor.vx = knockback.vx;
        actor.vy = knockback.vy;
        actor.vz = knockback.vz;
    }
}

export function throwHeldObject(hero: Hero, state: GameState){
    if (!hero.pickUpTile) {
        return;
    }
    hero.action = 'throwing';
    hero.actionFrame = 0;
    const throwSpeed = 6;
    const thrownObject = new ThrownObject({
        frame: getTileFrame(state.areaInstance.palette, hero.pickUpTile),
        x: hero.x,
        y: hero.y,
        vx: directionMap[hero.d][0] * throwSpeed,
        vy: directionMap[hero.d][1] * throwSpeed,
        vz: 2,
    });
    state.areaInstance.objects.push(thrownObject);
    hero.pickUpTile = null;
}


