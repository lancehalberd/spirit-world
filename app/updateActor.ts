import { destroyTile, getAreaFromGridCoords, getAreaSize, scrollToArea, setAreaSection } from 'app/content/areas';
import { Enemy } from 'app/content/enemy';
import { editingState } from 'app/development/tileEditor';
import { KEY_THRESHOLD, FRAME_LENGTH } from 'app/gameConstants';
import { getActorTargets } from 'app/getActorTargets';
import { GAME_KEY, isKeyDown } from 'app/keyCommands';
import { checkForFloorDamage, moveActor } from 'app/moveActor';
import { getTileFrame } from 'app/render';
import { useTool } from 'app/useTool';
import { directionMap, getDirection, isPointOpen } from 'app/utils/field';
import { rectanglesOverlap } from 'app/utils/index';
import { getState, initializeState } from 'app/state';

import { Actor, GameState, ObjectInstance, ThrownChakram, ThrownObject, Tile } from 'app/types';

const rollSpeed = [5, 5, 5, 4, 4, 4, 4, 3, 3, 3, 2, 2];

export function updateHero(this: void, state: GameState) {
    const area = state.areaInstance;
    let dx = 0, dy = 0;
    if (state.hero.invulnerableFrames > 0) {
        state.hero.invulnerableFrames--;
    }
    let movementSpeed = 2;

    const { w, h, section } = getAreaSize(state);

    // Automatically move the character into the bounds of the current section.
    if (editingState.isEditing) {
        movementSpeed = 0;
        state.hero.invulnerableFrames = 1;
        const ANALOG_THRESHOLD = 0.2;
        dy = isKeyDown(GAME_KEY.DOWN) - isKeyDown(GAME_KEY.UP);
        if (Math.abs(dy) < ANALOG_THRESHOLD) dy = 0;
        dx = isKeyDown(GAME_KEY.RIGHT) - isKeyDown(GAME_KEY.LEFT);
        if (Math.abs(dx) < ANALOG_THRESHOLD) dx = 0;
        state.hero.x += 4 * dx;
        state.hero.y += 4 * dy;
        if (dx || dy) state.hero.d = getDirection(dx, dy);
    } else if (state.nextAreaInstance) {
        movementSpeed = 0;
        if (state.nextAreaInstance.cameraOffset.x) {
            dx = 1 * state.nextAreaInstance.cameraOffset.x / Math.abs(state.nextAreaInstance.cameraOffset.x);
        }
        if (state.nextAreaInstance.cameraOffset.y) {
            dy = 1 * state.nextAreaInstance.cameraOffset.y / Math.abs(state.nextAreaInstance.cameraOffset.y);
        }
    } else if (state.hero.x + state.hero.w > section.x + section.w + 1) {
        movementSpeed = 0;
        dx = -1;
    } else if (state.hero.x < section.x - 1) {
        movementSpeed = 0;
        dx = 1;
    } else if (state.hero.y + state.hero.h > section.y + section.h + 1) {
        movementSpeed = 0;
        dy = -1;
    } else if (state.hero.y < section.y - 1) {
        movementSpeed = 0;
        dy = 1;
    } else if (state.hero.action === 'getItem') {
        movementSpeed = 0;
        state.hero.actionFrame++;
        if (state.hero.actionFrame >= 50) {
            state.hero.action = null;
        }
    } else if (state.hero.action === 'grabbing') {
        movementSpeed = 0;
        if (state.hero.grabObject?.pullingHeroDirection) {
            dx = directionMap[state.hero.grabObject.pullingHeroDirection][0];
            dy = directionMap[state.hero.grabObject.pullingHeroDirection][1];
        } else if (!state.hero.pickUpTile && !isKeyDown(GAME_KEY.PASSIVE_TOOL)) {
            state.hero.action = null;
            state.hero.grabTile = null;
            state.hero.grabObject = null;
        } else if (state.hero.grabObject?.onPull) {
            const ANALOG_THRESHOLD = 0.2;
            let dy = isKeyDown(GAME_KEY.DOWN) - isKeyDown(GAME_KEY.UP);
            if (Math.abs(dy) < ANALOG_THRESHOLD) dy = 0;
            let dx = isKeyDown(GAME_KEY.RIGHT) - isKeyDown(GAME_KEY.LEFT);
            if (Math.abs(dx) < ANALOG_THRESHOLD) dx = 0;
            if (dx || dy) {
                const direction = getDirection(dx, dy);
                const x = state.hero.x + 8 + 16 * directionMap[direction][0];
                const y = state.hero.y + 8 + 16 * directionMap[direction][1];
                if (direction === state.hero.d || isPointOpen(state, {x, y})) {
                    state.hero.grabObject.onPull(state, direction);
                }
            }
        }
    } else if (state.hero.action === 'carrying') {
        movementSpeed = 1.5;
    } else if (state.hero.action === 'throwing' ) {
        movementSpeed = 0;
        state.hero.actionFrame++;
        if (state.hero.actionFrame === 2) {
            state.hero.action = null;
        }
    } else if (state.hero.action === 'knocked') {
        movementSpeed = 0;
        dx = state.hero.vx;
        dy = state.hero.vy;
        state.hero.z += state.hero.vz;
        state.hero.vz -= 0.5;
        if (state.hero.z <= 0) {
            state.hero.action = null;
            state.hero.vz = 0;
        }
    } else if (state.hero.action === 'attack') {
        movementSpeed = 1;
        state.hero.actionFrame++;
        if (state.hero.actionFrame === 1) {
            state.hero.chakrams--;
            const m = Math.sqrt(state.hero.actionDx * state.hero.actionDx + state.hero.actionDy * state.hero.actionDy);
            const chakram = new ThrownChakram({
                x: state.hero.x + 3,
                y: state.hero.y + 3,
                vx: 4 * (m ? state.hero.actionDx / m : directionMap[state.hero.d][0]) + state.hero.actionDx,
                vy: 4 * (m ? state.hero.actionDy / m : directionMap[state.hero.d][1]) + state.hero.actionDy,
                returnSpeed: 4,
            });
            state.areaInstance.objects.push(chakram);
        }
        if (state.hero.actionFrame > 10) {
            state.hero.action = null;
        }
    } else if (state.hero.action === 'roll') {
        movementSpeed = 0;
        dx = directionMap[state.hero.d][0] * rollSpeed[state.hero.actionFrame];
        dy = directionMap[state.hero.d][1] * rollSpeed[state.hero.actionFrame];
        state.hero.actionFrame++;
        if (state.hero.actionFrame >= rollSpeed.length) {
            state.hero.action = null;
        }
    }
    if (movementSpeed) {
        const ANALOG_THRESHOLD = 0.2;
        dy = isKeyDown(GAME_KEY.DOWN) - isKeyDown(GAME_KEY.UP);
        if (Math.abs(dy) < ANALOG_THRESHOLD) dy = 0;
        dx = isKeyDown(GAME_KEY.RIGHT) - isKeyDown(GAME_KEY.LEFT);
        if (Math.abs(dx) < ANALOG_THRESHOLD) dx = 0;
        if (dx || dy) {
            const m = Math.sqrt(dx * dx + dy * dy);
            dx = movementSpeed * dx / m;
            dy = movementSpeed * dy / m;
            if (dx < 0 && (state.hero.d === 'right' || Math.abs(dx) > Math.abs(dy))) {
                state.hero.d = 'left';
            } else if (dx > 0 && (state.hero.d === 'left' || Math.abs(dx) > Math.abs(dy))) {
                state.hero.d = 'right';
            } else if (dy < 0 && (state.hero.d === 'down' || Math.abs(dy) > Math.abs(dx))) {
                state.hero.d = 'up';
            } else if (dy > 0 && (state.hero.d === 'up' || Math.abs(dy) > Math.abs(dx))) {
                state.hero.d = 'down';
            }
        }
    }
    if (dx || dy) {
        moveActor(state, state.hero, dx, dy, true);
    }
    if (!state.hero.action && !state.hero.pickUpTile && state.hero.activeTools.weapon > 0 &&
        state.hero.chakrams > 0 && isKeyDown(GAME_KEY.WEAPON, KEY_THRESHOLD)
    ) {
        state.hero.action = 'attack';
        state.hero.actionDx = dx;
        state.hero.actionDy = dy;
        state.hero.actionFrame = 0;
    }

    if (state.hero.toolCooldown > 0) {
        state.hero.toolCooldown -= FRAME_LENGTH;
    } else if (!state.hero.action && !state.hero.pickUpTile) {
        if (state.hero.leftTool && isKeyDown(GAME_KEY.LEFT_TOOL, KEY_THRESHOLD)) {
            state.hero.toolCooldown = 500;
            useTool(state, state.hero.leftTool, dx, dy, state.hero.d);
        } else if (state.hero.rightTool && isKeyDown(GAME_KEY.RIGHT_TOOL, KEY_THRESHOLD)) {
            state.hero.toolCooldown = 500;
            useTool(state, state.hero.rightTool, dx, dy, state.hero.d);
        }
    }
    if (!state.hero.action && !state.hero.pickUpTile && isKeyDown(GAME_KEY.PASSIVE_TOOL, KEY_THRESHOLD)) {
        const {objects, tiles} = getActorTargets(state, state.hero);
        if ((dx || dy) && !tiles.some(({x, y}) => area.behaviorGrid?.[y]?.[x]?.solid) && !objects.some(o => o.behaviors?.solid)) {
            if (state.hero.passiveTools.roll > 0) {
                if (state.hero.magic >= 5) {
                    state.hero.magic -= 5;
                    state.hero.action = 'roll';
                    state.hero.actionFrame = 0;
                } else {
                    // Hack to freeze player for a moment
                    state.hero.action = 'getItem';
                    state.hero.actionFrame = 30;
                    // We should play an insufficient mana sound here.
                }
            }
        } else {
            //console.log({dx, dy, tiles, objects});
            let closestLiftableTile: Tile = null, closestObject: ObjectInstance = null, closestDistance = 100;
            for (const target of tiles) {
                const behavior = area.behaviorGrid?.[target.y]?.[target.x];
                if (behavior?.solid) {
                    state.hero.action = 'grabbing';
                    state.hero.grabTile = target;
                }
                if (state.hero.passiveTools.gloves >= behavior?.pickupWeight && behavior?.underTile) {
                    // This is an unusual distance, but should do what we want still.
                    const distance = (
                        Math.abs(target.x * area.palette.w - state.hero.x) +
                        Math.abs(target.y * area.palette.h - state.hero.y)
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
                    state.hero.action = 'grabbing';
                }
                if (object.onGrab) {
                    const frame = object.getHitbox(state);
                    // This is an unusual distance, but should do what we want still.
                    const distance = (
                        Math.abs(frame.x + frame.w / 2 - state.hero.x - state.hero.w / 2) +
                        Math.abs(frame.y + frame.h / 2 - state.hero.y - state.hero.h / 2)
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
                state.hero.pickUpFrame = 0;
                state.hero.pickUpTile = tile;
                destroyTile(state, closestLiftableTile);
                state.hero.grabTile = null;
            } else if (closestObject) {
                if (closestObject.onGrab) {
                    closestObject.onGrab(state, state.hero.d);
                }
                state.hero.grabObject = closestObject;
            }
        }
    }
    if (state.hero.pickUpTile) {
        state.hero.pickUpFrame++;
        if (state.hero.pickUpFrame >= 5) {
            state.hero.action = 'carrying';
            if (isKeyDown(GAME_KEY.PASSIVE_TOOL, KEY_THRESHOLD)) {
                throwHeldObject(state);
            }
        }
    }
    checkForFloorDamage(state, state.hero);
    checkForEnemyDamage(state, state.hero);
    // Check for transition to other areas/area sections.
    if (!state.nextAreaInstance) {
        if (state.hero.x < 0 && dx < 0) {
            state.areaGridCoords.x = (state.areaGridCoords.x + state.areaGrid[0].length - 1) % state.areaGrid[0].length;
            scrollToArea(state, getAreaFromGridCoords(state.areaGrid, state.areaGridCoords), 'left');
        } else if (state.hero.x + state.hero.w > w && dx > 0) {
            state.areaGridCoords.x = (state.areaGridCoords.x + 1) % state.areaGrid[0].length;
            scrollToArea(state, getAreaFromGridCoords(state.areaGrid, state.areaGridCoords), 'right');
        } else if (state.hero.x < section.x && dx < 0) {
            setAreaSection(state, 'left');
        } else if (state.hero.x + state.hero.w > section.x + section.w && dx > 0) {
            setAreaSection(state, 'right');
        }
        if (state.hero.y < 0 && dy < 0) {
            state.areaGridCoords.y = (state.areaGridCoords.y + state.areaGrid.length - 1) % state.areaGrid.length;
            scrollToArea(state, getAreaFromGridCoords(state.areaGrid, state.areaGridCoords), 'up');
        } else if (state.hero.y + state.hero.h > h && dy > 0) {
            state.areaGridCoords.y = (state.areaGridCoords.y + 1) % state.areaGrid.length;
            scrollToArea(state, getAreaFromGridCoords(state.areaGrid, state.areaGridCoords), 'down');
        } else if (state.hero.y < section.y && dy < 0) {
            setAreaSection(state, 'up');
        } else if (state.hero.y + state.hero.h > section.y + section.h && dy > 0) {
            setAreaSection(state, 'down');
        }
    }
    if (state.hero.life <= 0) {
        initializeState();
        getState().gameHasBeenInitialized = true;
    }
    state.hero.magic += state.hero.magicRegen * FRAME_LENGTH / 1000;
    if (state.hero.magic > state.hero.maxMagic) {
        state.hero.magic = state.hero.maxMagic;
    }
}

export function checkForEnemyDamage(state: GameState, actor: Actor) {
    if (actor.action === 'roll' || actor.action === 'getItem' || actor.invulnerableFrames > 0) {
        return;
    }
    for (const enemy of state.areaInstance.objects) {
        if (!(enemy instanceof Enemy) || enemy.invulnerableFrames > 0) {
            continue;
        }
        if (enemy.enemyDefinition.touchDamage && rectanglesOverlap(actor, enemy)) {
            //const dx = (actor.x + actor.w / 2) - (enemy.x + enemy.w / 2);
            //const dy = (actor.y + actor.h / 2) - (enemy.y + enemy.h / 2);
            damageActor(state, actor, enemy.enemyDefinition.touchDamage, {
                vx: - 4 * directionMap[actor.d][0],
                vy: - 4 * directionMap[actor.d][1],
                vz: 2,
            });
        }
    }
}

export function damageActor(state: GameState, actor: Actor, damage: number, knockback?: {vx: number, vy: number, vz: number}) {
    if (actor.action === 'roll' || actor.action === 'getItem') {
        return;
    }
    // Hero is invulnerable during invulnerability frames, but other actors are not.
    if (actor === state.hero && actor.invulnerableFrames > 0) {
        return;
    }
    actor.life -= damage;
    // For enemies, this is actually the number of rames they cannot damage the hero for.
    actor.invulnerableFrames = 50;
    if (knockback) {
        // Throw stone here.
        throwHeldObject(state);
        actor.action = 'knocked';
        actor.vx = knockback.vx;
        actor.vy = knockback.vy;
        actor.vz = knockback.vz;
    }
}

export function throwHeldObject(state: GameState){
    if (!state.hero.pickUpTile) {
        return;
    }
    state.hero.action = 'throwing';
    state.hero.actionFrame = 0;
    const throwSpeed = 6;
    const thrownObject = new ThrownObject({
        frame: getTileFrame(state.areaInstance.palette, state.hero.pickUpTile),
        x: state.hero.x,
        y: state.hero.y,
        vx: directionMap[state.hero.d][0] * throwSpeed,
        vy: directionMap[state.hero.d][1] * throwSpeed,
        vz: 2,
    });
    state.areaInstance.objects.push(thrownObject);
    state.hero.pickUpTile = null;
}


