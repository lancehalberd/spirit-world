import { refreshAreaLogic } from 'app/content/areas';
import { addSparkleAnimation } from 'app/content/effects/animationEffect';
import { LightningAnimationEffect } from 'app/content/effects/lightningAnimationEffect';
import { Door } from 'app/content/objects/door';
import { Staff } from 'app/content/objects/staff';
import { zones } from 'app/content/zones/zoneHash';
import { CANVAS_HEIGHT, FALLING_HEIGHT, FRAME_LENGTH, GAME_KEY } from 'app/gameConstants';
import { editingState } from 'app/development/editingState';
import { getCloneMovementDeltas, isGameKeyDown, wasGameKeyPressed } from 'app/userInput';
import { checkForFloorEffects } from 'app/movement/checkForFloorEffects';
import { getSectionBoundingBox, moveActor } from 'app/moveActor';
import { playAreaSound } from 'app/musicController';
import { cloudPoofAnimation, fallAnimation, heroAnimations } from 'app/render/heroAnimations';
import { isUnderwater } from 'app/utils/actor';
import { setAreaSection } from 'app/utils/area';
import { destroyClone } from 'app/utils/destroyClone';
import { addEffectToArea } from 'app/utils/effects';
import { enterLocation } from 'app/utils/enterLocation';
import {
    canSomersaultToCoords,
    directionMap,
    getDirection,
    getTileBehaviorsAndObstacles,
    hitTargets,
    isTileOpen,
} from 'app/utils/field';
import { fixCamera } from 'app/utils/fixCamera';
import { getAreaSize } from 'app/utils/getAreaSize';
import { boxesIntersect, isObjectInsideTarget, pad } from 'app/utils/index';
import { addObjectToArea } from 'app/utils/objects';
import { saveGame } from 'app/utils/saveGame';
import { getVectorToTarget } from 'app/utils/target';

const rollSpeed = [
    5, 5, 5, 5,
    4, 4, 4, 4,
    3, 3, 3, 3,
    2, 2, 2, 2,
];

let sommersaultCount = 0;

function moveToClosestSpawnMarker(state: GameState, hero: Hero, inSection = true) {
    const { section } = getAreaSize(state);
    let best: ObjectInstance = null, bestDistance: number;
    for (const object of state.areaInstance.objects) {
        if (object.definition?.type !== 'spawnMarker') {
            continue;
        }
        // Only consider markers in the current section.
        if (inSection && (object.x < section.x || object.x > section.x + section.w ||
            object.y < section.y || object.y > section.y + section.h)
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
        if (!inSection) {
            setAreaSection(state);
        }
        fixCamera(state);
    }
}

export function checkToFallUnderWater(this: void, state: GameState, vz : number): boolean {
    if (vz > -3 || state.hero.savedData.equippedBoots === 'cloudBoots') {
        return false;
    }
    const hero = state.hero;
    if (hero.swimming && state.underwaterAreaInstance &&
        isTileOpen(state, state.underwaterAreaInstance, {x: hero.x, y: hero.y}, {canSwim: true, canFall: true})
    ) {
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
        hero.vz = Math.min(-2, vz + 1.5);
        return true;
    }
    return false;
}

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
            if (dy > 0 && hero.y < (state.zone.areaSize?.h ?? 32) * 16 + 18) {
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
        hero.x += 4 * dx / editingState.areaScale;
        hero.y += 4 * dy / editingState.areaScale;
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
        if (hero.isOverClouds && hero.animationTime >= cloudPoofAnimation.duration) {
            hero.action = 'fallen';
            hero.actionFrame = 0;
        } else if (hero.animationTime >= fallAnimation.duration) {
            hero.action = hero.action === 'falling' ? 'fallen' : 'sankInLava';
            hero.actionFrame = 0;
        }
        return true;
    }
    if (hero.action === 'fallen' || hero.action === 'sankInLava') {
        // Special logic for falling from the sky to the overworld.
        if (hero === state.hero && hero.action === 'fallen' && state.location.zoneKey === 'sky') {
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
                hero.isAirborn = true;
                moveToClosestSpawnMarker(state, hero);
            });
            return true;
        }
        // Special logic for falling from the forst temple overworld area into
        // the forest temple dungeon.
        if (hero === state.hero && hero.action === 'fallen'
            && state.location.zoneKey === 'overworld'
            && state.location.isSpiritWorld
            && state.location.areaGridCoords.x === 0
            && state.location.areaGridCoords.y === 2
        ) {
            // Map the characters x/y coordinates from this section to
            // the x/y coordinates across the entire dungeon floor.
            // These px/py values are scaled to be 0-1 over the area that you can actually fall through
            // in order to maximally cover possible locations to fall in the dungeon.
            const px = (hero.x - 48) / (state.areaInstance.w * 16 - 80);
            const py = (hero.y - 48) / (state.areaInstance.h * 16 - 112);
            const {w, h} = zones.forestTemple.areaSize ?? {w: 32, h: 32};
            const templeAreaWidth = w * 16, templeAreaHeight = h * 16;
            const templeWidth = templeAreaWidth * zones.forestTemple.floors[0].grid[0].length;
            const templeHeight = templeAreaHeight * zones.forestTemple.floors[0].grid.length;
            const tx = px * templeWidth;
            const ty = py * templeHeight;
            enterLocation(state, {
                zoneKey: 'forestTemple',
                floor: 0,
                areaGridCoords: {
                    x: Math.floor(tx / templeAreaWidth),
                    y: Math.floor(ty / templeAreaHeight),
                },
                x: tx % templeAreaWidth,
                y: ty % templeAreaHeight,
                z: CANVAS_HEIGHT,
                d: hero.d,
                isSpiritWorld: state.location.isSpiritWorld,
            }, false, () => {
                hero.action = 'knocked';
                hero.isAirborn = true;
                moveToClosestSpawnMarker(state, hero, false);
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
            hero.justRespawned = true;
            let damage = 1;
            if (hero.action === 'sankInLava') {
                damage = 8;
                if (hero.savedData.passiveTools.fireBlessing) {
                    damage /= 2;
                }
            }
            hero.takeDamage(state, damage);
            destroyClone(state, hero);
            hero.action = null;
            // stop updating this hero if it was a clone that got destroyed by taking damage.
            if (!hero.area) {
                return;
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
        const touchingTarget = hero.actionTarget && boxesIntersect(hero.getMovementHitbox(), hero.actionTarget.getHitbox());
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
        hero.animationTime -= FRAME_LENGTH / 2;
        // Freeze at the leaping frame, the flip looks bad if the jump isn't the right length.
        hero.animationTime = Math.min(hero.animationTime, 100);
        const groundZ = 0;

        // Determine if the player is over a trampoline, which can change jumping behavior quite a bit
        // to support the interactions with bouncing on trampolines whiles jumping.
        // Create a hitbox representing where the heroes frame appears rather than its floor location
        const heroHitbox = hero.getMovementHitbox();
        const spriteHitbox = {
            ...heroHitbox,
            y: heroHitbox.y - hero.z,
        }
        const trampolineUnderSprite = hero.area.objects.find(o => o.definition?.type === 'trampoline' && boxesIntersect(spriteHitbox, (o as Trampoline).getBounceHitbox()));
        const tallHitbox = {
            ...heroHitbox,
            h: 24,
        }
        const trampolineAhead = hero.area.objects.find(o => o.definition?.type === 'trampoline' && boxesIntersect(tallHitbox, (o as Trampoline).getBounceHitbox()));
        const shouldBounceOnTrampoline = hero.canTrampoline && trampolineUnderSprite;

        // When jumping any direction but down, the jump is precomputed so we just
        // move the character along the arc until they reach the ground.
        hero.x += hero.jumpingVx;
        if (isHeroOnVeryTallWall(state, hero)) {
            hero.x -= hero.jumpingVx;
        }
        hero.y += hero.jumpingVy;
        if (isHeroOnVeryTallWall(state, hero)) {
            hero.y -= hero.jumpingVy;
        } else if (hero.jumpingVy < 0 && !shouldBounceOnTrampoline && (hero.jumpingVz <= 0 && hero.z <= groundZ + 3)) {
            hero.canTrampoline = false;
            hero.jumpingVy = Math.max(hero.jumpingVy, -0.0001);
            // Move the hero off of southern facing walls when jumping north and falling into them, unless there is a trampoline to catch them,
            for (let i = 0; i < 8 && isHeroOnSouthernWallTile(state, hero); i++) {
                hero.y++;
                hero.z += 0.5;
            }
        }
        hero.jumpingVx *= 0.98;
        hero.jumpingVy *= 0.98;
        hero.z += hero.jumpingVz;
        hero.jumpingVz = Math.max(-4, hero.jumpingVz - 0.5);
        // console.log([hero.x, hero.y, hero.z], ' -> ', [hero.jumpingVx, hero.jumpingVy, hero.jumpingVz]);

        if (shouldBounceOnTrampoline) {
            // TODO: This works but messes up the camera speed, maybe we can have a shadowZ value that just moves the shadow
            // and gives the appearance of changing z value without actually messing with the y value.
            /*if (hero.z < 16) {
                hero.z ++;
                hero.y ++;
            }*/
            if (hero.jumpingVz <= -4 || hero.z <= groundZ) {
                hero.animationTime = 0;
                hero.jumpingVz = Math.max(-hero.jumpingVz, 4);
                ((trampolineUnderSprite) as Trampoline).lastBounceTime = state.fieldTime;
                if (hero.jumpingVx) {
                    hero.jumpingVx = 2.5 * hero.jumpingVx / Math.abs(hero.jumpingVx);
                }
                if (hero.jumpingVy) {
                    hero.jumpingVy = 2.5 * hero.jumpingVy / Math.abs(hero.jumpingVy);
                }
                return true;
            }
        } else if (hero.jumpingVy >= 0 && hero.jumpingVz < 0 && !(hero.canTrampoline && trampolineAhead)) {
            let i = 0;
            hero.canTrampoline = false;
            while (i < 4 && isHeroOnSouthernWallTile(state, hero)) {
                hero.y++;
                hero.z++;
                i++;
                // Make hero land directly in front of the cliff if this wall is tall if there is a place ahead that they cannot land on.
                if (!isHeroOnSouthernWallTile(state, hero, 0, 16)
                    // Check half tile as well for narrow obstacles like northern cliff ledges.
                    && (!canSomersaultToCoords(state, hero, {x: hero.x, y: hero.y + 8}) || !canSomersaultToCoords(state, hero, {x: hero.x, y: hero.y + 16}))
                ) {
                    hero.jumpingVy = 0;
                }
                // Without this, the hero will not be able to transition south while jumping east/west
                // and moving down across a southern facing wall.
                hero.actionDy = 1;
            }
            // This will cause the hero to jump over up to 1 bad landing tile at the bottom of a cliff.
            while (i < 2 && hero.jumpingVy > 0 && !canSomersaultToCoords(state, hero, hero) && hero.z < 48) {
                hero.y++;
                hero.z++;
                i++;
                // Make hero land directly in front of the cliff if this wall is tall.
                // We don't do this for short jumps because it looks bad when jumping to clouds in the sky.
                //hero.jumpingVy = Math.min(hero.jumpingVy, 0.0001);
                // Without this, the hero will not be able to transition south while jumping east/west
                // and moving down across an obstacle.
                hero.actionDy = 1;
            }
        }


        if (hero.z <= groundZ) {
            hero.z = groundZ
            hero.isAirborn = hero.isAstralProjection;
            hero.action = null;
            hero.actionDy = 0;
            hero.animationTime = 0;
            const landingHit: HitProperties = {
                damage: 1,
                hitbox: pad(hero.getHitbox(), 4),
                hitTiles: true,
            };
            hitTargets(state, hero.area, landingHit);
            // If the hero lands somewhere invalid, damage them and return them to there last safe location,
            // similar to if they had fallen into a pit.
            if (!canSomersaultToCoords(state, hero, hero)) {
                hero.vx = 0;
                hero.vy = 0;
                hero.d = hero.safeD;
                hero.x = hero.safeX;
                hero.y = hero.safeY;
                hero.justRespawned = true;
                hero.takeDamage(state, 1);
                destroyClone(state, hero);
                hero.action = null;
                return;
            }
            checkForFloorEffects(state, hero);
            // This has to be done after checking floor effects to set `hero.isSwimming` correctly.
            checkToFallUnderWater(state, hero.jumpingVz);
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
        const isFloating = isUnderwater(state, hero) && hero.savedData.equippedBoots !== 'ironBoots';
        if (isFloating) {
            hero.vz *= 0.9;
            hero.vx *= 0.9;
            hero.vy *= 0.9;
            hero.z = Math.min(24, hero.z + hero.vz);
            if (hero.vz < 0.2) {
                if (hero.action === 'thrown') {
                    if (!canSomersaultToCoords(state, hero, hero)) {
                        destroyClone(state, hero);
                        return;
                    }
                }
                hero.action = null;
                hero.vz = 0;
            }
        } else {
            hero.z += hero.vz;
            hero.vz = Math.max(-8, hero.vz - 0.5);
        }
        // Clones ignore collisions with heroes/other clones when being thrown or knocked.
        const excludedObjects = new Set<ObjectInstance>([state.hero, ...state.hero.clones]);
        // The hero obeys normal collision detection when being knocked around, but they won't trigger effects
        // like jumping off of cliffs or pushing objects.
        moveActor(state, hero, hero.vx, hero.vy, {
            canFall: true,
            canSwim: true,
            canJump: hero.action === 'thrown' && hero.z >= 12,
            canPassMediumWalls: hero.action === 'thrown' && hero.z >= 12,
            direction: hero.d,
            boundingBox: hero.action !== 'knockedHard' ? getSectionBoundingBox(state, hero) : undefined,
            excludedObjects
        });
        // The astral projection stays 4px off the ground.
        if (!isFloating && hero.z <= minZ) {
            if (hero.vz <= -8 || hero.action === 'thrown') {
                const landingHit: HitProperties = {
                    damage: 1,
                    hitbox: pad(hero.getHitbox(), 4),
                    hitTiles: true,
                };
                hitTargets(state, hero.area, landingHit);
                const { tileBehavior } = getTileBehaviorsAndObstacles(state, hero.area, {x: hero.x, y: hero.y }, excludedObjects, state.nextAreaInstance);
                if (hero.vz <= -8 && !tileBehavior?.water && !tileBehavior?.pit) {
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
            hero.isAirborn = hero.isAstralProjection;
            hero.action = null;
            // If the hero is at 0 life, they will show the death sequence on top of pits,
            // so we immediately apply floor effects so that they will apply pits before
            // starting the death sequence.
            checkForFloorEffects(state, hero);
            // Only clear the hero's vz value if they hit solid ground, leave it if they fell underwater.
            if (!checkToFallUnderWater(state, hero.vz)) {
                hero.vz = 0;
            }
        }
        return true;
    }
    if (hero.action === 'usingStaff' && hero.frozenDuration > 0) {
        hero.action = null;
    }
    if (hero.action === 'usingStaff') {
        // Pressing either tool button while using the staff will cancel placing it.
        hero.vx = 0;
        hero.vy = 0;
        if (wasGameKeyPressed(state, GAME_KEY.LEFT_TOOL) || wasGameKeyPressed(state, GAME_KEY.RIGHT_TOOL)) {
            hero.canceledStaffPlacement = true;
        }
        const jumpDuration = heroAnimations.staffJump[hero.d].duration;
        const slamDuration = heroAnimations.staffSlam[hero.d].duration;
       // console.log(hero.animationTime, jumpDuration, slamDuration);
        if (hero.animationTime < jumpDuration - FRAME_LENGTH) {
            hero.vz = 1 - 1 * hero.animationTime / jumpDuration;
            hero.z += hero.vz;
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
                        const objectHitbox = {...object.getHitbox()};
                        // Make the effective hitbox slightly south of the mark so that
                        // the player won't be inside the door when they activate the tower.
                        objectHitbox.y += 8;
                        if (isObjectInsideTarget(hitbox, pad(objectHitbox, 8))) {
                            onTowerMarker = true;
                            break;
                        }
                    }
                }
                if (towerLocation && onTowerMarker) {
                    state.savedState.staffTowerLocation = towerLocation as StaffTowerLocation;
                    state.hero.savedData.activeTools.staff = 1;
                    refreshAreaLogic(state, hero.area);
                    saveGame(state);
                    return;
                }
            }
            hero.z = Math.max(hero.z + hero.vz, minZ);
            if (hero.z <= minZ) {
                hero.isAirborn = hero.isAstralProjection;
            }
            const staffLevel = state.hero.savedData.activeTools.staff;
            const maxLength = staffLevel > 1 ? 64 : 4;
            const crushingPower = staffLevel > 1 ? 2 : 1;
            const staff = new Staff(state, {
                x: hero.x,
                y: hero.y,
                damage: 4 * staffLevel,
                direction: hero.d,
                element: hero.savedData.element,
                maxLength,
                crushingPower,
            });
            let baseTarget: Rect = staff.getAttackHitbox();
            if (!staff.isInvalid && !hero.canceledStaffPlacement) {
                hero.activeStaff = staff;
                addObjectToArea(state, state.areaInstance, staff);
            } else if (staff.staffBonked) {
                // Staff does no damage, hero is knocked back.
                const [dx, dy] = directionMap[staff.direction];
                let vz = 2;
                if (hero.savedData.equippedBoots === 'cloudBoots') {
                    vz = 3;
                } else if (hero.savedData.equippedBoots === 'ironBoots') {
                    vz = 1;
                }
                hero.knockBack(state, {vx: -2.5*dx, vy: -2.5*dy, vz});
                state.screenShakes.push({
                    dx: staffLevel > 1 ? 5 : 2,
                    dy: staffLevel > 1 ? 5 : 2,
                    startTime: state.fieldTime,
                    endTime: state.fieldTime + 350,
                });
            } else if (staff.isInvalid) {
                // Staff hits at least a 3 tile area even if it doesn't get placed.
                if (staff.direction === 'up') {
                    baseTarget = {x: hero.x, y: hero.y - 48, w: 16, h: 48};
                } else if (staff.direction === 'down') {
                    baseTarget = {x: hero.x, y: hero.y + 16, w: 16, h: 48};
                } else if (staff.direction === 'left') {
                    baseTarget = {x: hero.x - 48, y: hero.y, w: 48, h: 16};
                } else if (staff.direction === 'right') {
                    baseTarget = {x: hero.x + 16, y: hero.y, w: 48, h: 16};
                }
            }
            playAreaSound(state, state.areaInstance, 'bossDeath');
            hitTargets(state, state.areaInstance, {
                damage: 4 * staffLevel,
                hitbox: pad(baseTarget, 2),
                hitEnemies: true,
                knockAwayFromHit: true,
                isStaff: true,
                isBonk: staff.staffBonked,
            });
            hitTargets(state, state.areaInstance, {
                hitbox: baseTarget,
                hitTiles: true,
                crushingPower,
                hitObjects: true,
                isStaff: true,
                isBonk: staff.staffBonked,
            });
            if (!staff.staffBonked) {
                state.screenShakes.push({
                    dx: 0, dy: staffLevel > 1 ? 5 : 2, startTime: state.fieldTime, endTime: state.fieldTime + 200
                });
            }
        } else if (hero.animationTime < jumpDuration + slamDuration) {
            hero.z = Math.max(hero.z + hero.vz, minZ);
            if (hero.z <= minZ) {
                hero.isAirborn = hero.isAstralProjection;
            }
        } else if (hero.animationTime >= jumpDuration + slamDuration) {
            hero.action = null;
        }
        return true;
    }
    const isFallingToGround = !isUnderwater(state, hero)
        && hero.z > minZ + 2 && (hero.savedData.equippedBoots !== 'cloudBoots' || hero.z > FALLING_HEIGHT);
    if (isFallingToGround) {
        hero.action = null;
        hero.z += hero.vz;
        let fallAcceleration = 1;
        if (hero.savedData.equippedBoots === 'cloudBoots') fallAcceleration = 0.5;
        else if (hero.savedData.equippedBoots === 'ironBoots') fallAcceleration = 2;
        hero.vz = Math.max(-8, hero.vz - fallAcceleration);
        if (hero.z <= minZ) {
            hero.z = minZ;
            hero.vz = 0;
            hero.isAirborn = hero.isAstralProjection;
        }
        moveActor(state, hero, hero.vx, hero.vy, {
            canFall: true,
            canSwim: true,
            direction: hero.d,
        });
        return true;
    }
    if (hero.action === 'roll') {
        hero.swimming = false;
        hero.wading = false;
        // Double pressing roll performs a quick somersault.
        if (wasGameKeyPressed(state, GAME_KEY.ROLL)
            && hero.savedData.passiveTools.roll > 1
            && hero.actionFrame > 4
            && state.hero.magic > 0
        ) {
            performSomersault(state, hero);
            return true;
        }
        // Holding roll performs a normal somersault with preparation.
        if (isGameKeyDown(state, GAME_KEY.ROLL)
            && hero.savedData.passiveTools.roll > 1
            && hero.actionFrame === 11
            && state.hero.magic > 0
        ) {
            hero.action = 'preparingSomersault';
            sommersaultCount = 0;
            return true;
        }
        if (hero.actionFrame >= rollSpeed.length) {
            hero.action = null;
            hero.animationTime = 0;
            // Don't allow rolling for two Sframes after completing a roll.
            // This helps keep players from rolling over pits.
            hero.rollCooldown = 40;
            // Immediately check for floor effects so we detect pits/water/slipping as soon as the roll is over.
            checkForFloorEffects(state, hero);
        } else {
            const direction = getDirection(hero.actionDx, hero.actionDy, true, hero.d);
            const speedFactor = hero.savedData.equippedBoots === 'ironBoots' ? 0.5 : 1;
            hero.vx = directionMap[direction][0] * speedFactor * rollSpeed[hero.actionFrame];
            hero.vy = directionMap[direction][1] * speedFactor * rollSpeed[hero.actionFrame];
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
    if (hero.action === 'preparingSomersault') {
        if (!isGameKeyDown(state, GAME_KEY.ROLL)) {
            hero.action = 'roll';
            hero.actionFrame = 12;
            hero.animationTime = 12 * FRAME_LENGTH;
            return true;
        }
        if (sommersaultCount
            || wasGameKeyPressed(state, GAME_KEY.UP)
            || wasGameKeyPressed(state, GAME_KEY.DOWN)
            || wasGameKeyPressed(state, GAME_KEY.LEFT)
            || wasGameKeyPressed(state, GAME_KEY.RIGHT)
        ) {
            sommersaultCount++;
            if (sommersaultCount < 2) {
                return true;
            }
            performSomersault(state, hero);
            return true;
        }
        return true;
    }
    if (hero.frozenDuration > 0) {
        hero.frozenDuration -= FRAME_LENGTH;
        hero.vx *= 0.99;
        hero.vy *= 0.99;
        moveActor(state, hero, hero.vx, hero.vy, {
            canFall: true,
            canSwim: true,
            direction: hero.d,
        });
        // Returning true prevents checking for floor effects, but they should still apply while frozen.
        checkForFloorEffects(state, hero);
        return true;
    }
    return false;
}

function performSomersault(this: void, state: GameState, hero: Hero) {
    // Cloud somersault roll activated by rolling again mid roll.
    const [dx, dy] = getCloneMovementDeltas(state, hero);
    state.hero.magic -= 10;
    state.hero.increaseMagicRegenCooldown(500);
    hero.d = (dx || dy) ? getDirection(dx, dy) : hero.d;
    // Default direction is the direction the current roll uses.
    const defaultDirection = getDirection(hero.actionDx, hero.actionDy, true, hero.d);
    const direction = getDirection(dx, dy, true, defaultDirection);
    const moveX = directionMap[direction][0] * 8, moveY = directionMap[direction][1] * 8;
    const originalArea = hero.area, alternateArea = hero.area.alternateArea;
    let hitbox = hero.getHitbox();
    const startPosition = {x: hitbox.x + hitbox.w / 2, y: hitbox.y + hitbox.h / 2};
    const lastOpenPosition = {x: hero.x, y: hero.y};
    // Move 8px at a time 6 times in either area.
    for (let i = 0; i < 6; i++) {
        let result = moveActor(state, hero, moveX, moveY, {
            canFall: true,
            canSwim: true,
            direction: hero.d,
            boundingBox: getSectionBoundingBox(state, hero),
        });
        if (result.mx || result.my) {
            if (canSomersaultToCoords(state, hero, {x: hero.x, y: hero.y})) {
                lastOpenPosition.x = hero.x;
                lastOpenPosition.y = hero.y;
            }
            addSparkleAnimation(state, hero.area, pad(hero.getHitbox(), -4), { element: hero.savedData.element });
            continue;
        }
        hero.area = alternateArea;
        result = moveActor(state, hero, moveX, moveY, {
            canFall: true,
            canSwim: true,
            direction: hero.d,
            boundingBox: getSectionBoundingBox(state, hero),
        });
        hero.area = originalArea;
        if (!result.mx && !result.my) {
            break;
        }
        if (canSomersaultToCoords(state, hero, {x: hero.x, y: hero.y})) {
            lastOpenPosition.x = hero.x;
            lastOpenPosition.y = hero.y;
        }
        addSparkleAnimation(state, hero.area, pad(hero.getHitbox(), -4), { element: hero.savedData.element });
    }
    hitbox = hero.getHitbox();
    const endPosition = {x: hitbox.x + hitbox.w / 2, y: hitbox.y + hitbox.h / 2};
    const teleportHit: HitProperties = {
        damage: 5,
        element: hero.savedData.element,
        hitRay: {
            x1: startPosition.x, y1: startPosition.y,
            x2: endPosition.x, y2: endPosition.y,
            r: 6,
        },
        hitTiles: true,
        hitEnemies: true,
        hitObjects: true,
    };
    hitTargets(state, hero.area, teleportHit);
    if (hero.savedData.element === 'lightning') {
        addEffectToArea(state, hero.area, new LightningAnimationEffect({
            ray: teleportHit.hitRay,
            duration: 100,
        }));
    }
    const landingHit: HitProperties = {
        damage: 5,
        element: hero.savedData.element,
        hitCircle: {
            x: endPosition.x, y: endPosition.y,
            r: 24,
        },
        hitTiles: true,
        hitEnemies: true,
        hitObjects: true,
    };
    for (let i = 0; i < 8; i++) {
        const theta = 2 * Math.PI * i / 8;
        addSparkleAnimation(state, hero.area,
            {
                x: endPosition.x + 19 * Math.cos(theta) - 3,
                y: endPosition.y + 19 * Math.sin(theta) - 3,
                w: 6, h: 6,
            },
            { element: hero.savedData.element }
        );
    }
    hitTargets(state, hero.area, landingHit);
    if (hero.savedData.element === 'lightning') {
        addEffectToArea(state, hero.area, new LightningAnimationEffect({
            circle: landingHit.hitCircle,
            duration: 200,
        }));
    }
    hero.x = lastOpenPosition.x;
    hero.y = lastOpenPosition.y;
    hitbox = hero.getHitbox(state);

    // The fullroll action is 16 frames.
    hero.action = 'roll';
    hero.isAirborn = true;
    hero.actionFrame = 0;
    hero.animationTime = 0 * FRAME_LENGTH;
    hero.actionDx = directionMap[direction][0];
    hero.actionDy = directionMap[direction][1];
}

function isHeroOnOpenTile(this: void, state: GameState, hero: Hero): boolean {
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


function isHeroOnSouthernWallTile(this: void, state: GameState, hero: Hero, dx = 0, dy = 0): boolean {
    const L = hero.x + dx, R = hero.x + hero.w - 1 + dx, T = hero.y + dy, B = hero.y + hero.h - 1 + dy;
    const points = [{x: L, y: T}, {x: R, y: T}, {x: L, y: B}, {x: R, y: B}];
    const excludedObjects = new Set([hero]);
    for (const point of points) {
        const { tileBehavior } = getTileBehaviorsAndObstacles(state, hero.area, point, excludedObjects, state.nextAreaInstance);
        if (tileBehavior.isSouthernWall) {
            return true
        }
    }
    return false;
}

function isHeroOnVeryTallWall(this: void, state: GameState, hero: Hero): boolean {
    const L = hero.x, R = hero.x + hero.w - 1, T = hero.y, B = hero.y + hero.h - 1;
    const points = [{x: L, y: T}, {x: R, y: T}, {x: L, y: B}, {x: R, y: B}];
    const excludedObjects = new Set([hero]);
    for (const point of points) {
        const { tileBehavior } = getTileBehaviorsAndObstacles(state, hero.area, point, excludedObjects, state.nextAreaInstance);
        if (tileBehavior.isVeryTall && tileBehavior.solid) {
            return true
        }
    }
    return false;
}

