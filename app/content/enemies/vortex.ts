import { FieldAnimationEffect, splashAnimation } from 'app/content/effects/animationEffect';
import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import { omniAnimation } from 'app/content/enemyAnimations';
import { Hero } from 'app/content/hero';
import { zones } from 'app/content/zones/zoneHash';
import {FRAME_LENGTH, MAX_FLOAT_HEIGHT} from 'app/gameConstants';
import { getEnemyBoundingBox, getSectionBoundingBox, intersectRectangles, moveActor } from 'app/movement/moveActor';
import {getLedgeDelta} from 'app/movement/getLedgeDelta';
import { isUnderwater } from 'app/utils/actor';
import { createAnimation, drawFrame, getFrame } from 'app/utils/animations';
import { addEffectToArea } from 'app/utils/effects';
import {
    accelerateInDirection,
    moveEnemy,
} from 'app/utils/enemies';
import { enterLocation } from 'app/utils/enterLocation';
import { isTileOpen } from 'app/utils/field';
import { removeObjectFromArea } from 'app/utils/objects';
import {
    getVectorToNearbyTarget,
    getVectorToTarget,
} from 'app/utils/target';


const poolAnimation = createAnimation('gfx/tiles/deeptoshallowwater.png', {w: 16, h: 16}, {x: 3, y: 0});
const lavaPoolAnimation = createAnimation('gfx/tiles/lavaAnimations.png', {w: 16, h: 16}, {x: 3, y: 2});

enemyDefinitions.vortex = {
    naturalDifficultyRating: 4,
    animations: {idle: omniAnimation(poolAnimation)},
    acceleration: 0.2, aggroRadius: 88, speed: 1.2,
    canSwim: true,
    params: {chaseCooldown: 0},
    life: 4,
    update(state: GameState, enemy: Enemy) {
        if (enemy.params.chaseCooldown > 0) {
            enemy.params.chaseCooldown -= FRAME_LENGTH;
            return;
        }
        const vector = getVectorToNearbyTarget(state, enemy, enemy.aggroRadius, enemy.area.allyTargets);
        if (!vector) {
            const theta = enemy.animationTime / 200;
            const target = {
                x: enemy.definition.x - enemy.x + 8 * Math.cos(theta),
                y: enemy.definition.y - enemy.y + 8 * Math.sin(theta)
            }
            accelerateInDirection(state, enemy, target);
        } else {
            accelerateInDirection(state, enemy, vector);
        }
        const vortexIsUnderwater = isUnderwater(state, enemy);
        moveEnemy(state, enemy, enemy.vx, enemy.vy, {
            boundingBox: intersectRectangles(getSectionBoundingBox(state, enemy, 16), getEnemyBoundingBox(state, enemy, 208, 208)),
            mustSwim: !vortexIsUnderwater,
        });
        for (const hero of enemy.area.allyTargets) {
            if (!(hero instanceof Hero)) {
                continue;
            }
            if (hero.areaTime < 500) {
                return;
            }
            // Vortexes on the surface only suck heroes towards them that are swimming.
            if (!vortexIsUnderwater && !(hero.swimming || hero.wading)) {
                continue
            }
            const { mag, x, y } = getVectorToTarget(state, enemy, hero);
            if (mag < 8) {
                if (hero.z > 0) {
                    hero.z -= 3;
                }
                if (hero.z > 0) {
                    continue;
                }
                if (hero.action !== 'falling' && hero.action !== 'fallen') {
                    hero.throwHeldObject(state);
                    hero.heldChakram?.throw(state);
                    // The vortex will send the player down into the underwater instance if one is defined for this area.
                    if (hero === state.hero
                        && state.underwaterAreaInstance
                        && isTileOpen(state, state.underwaterAreaInstance, {x: hero.x + hero.w / 2, y: hero.y + hero.h / 2}, {canMoveInLava: false})
                    ) {
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
                        hero.vz = -3;
                    } else {
                        hero.fallIntoPit(state);
                        hero.animationTime = 400;
                        hero.x = enemy.x + 4;
                        hero.y = enemy.y + 4;
                        enemy.params.chaseCooldown = 1500;
                        const animation = new FieldAnimationEffect({
                            animation: splashAnimation,
                            drawPriority: 'background',
                            drawPriorityIndex: 1,
                            // increase y+z by 4 to make this draw in front of the hero fall animation.
                            x: hero.x, y: hero.y + 4, z: 4
                        });
                        addEffectToArea(state, hero.area, animation);
                    }
                }
            } else if (mag < 40) {
                if (hero.z > 0) {
                    hero.z -= 2;
                }
                // This maxes at 4 if the hero is as close as possible (8px).
                const dx = -256 * x / mag / mag, dy = -256 * y / mag / mag;
                // TODO: only apply this if the hero is underwater or swimming
                moveActor(state, hero, dx, dy);
            }
        }
    },
    onHit(state: GameState, enemy: Enemy, hit: HitProperties) {
        if (hit.element === 'ice') {
            removeObjectFromArea(state, enemy);
        }
        return {};
    },
    getHitbox(enemy: Enemy) {
        return {x: enemy.x, y: enemy.y, w: 24, h: 24};
    },
    render(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy) {
    },
    renderShadow(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy) {
        if (enemy.status === 'gone' || enemy.status === 'hidden') {
            return;
        }
        const hitbox = enemy.getHitbox(state);
        const armCount = 6;
        const x = hitbox.x + hitbox.w / 2, y = hitbox.y + hitbox.h / 2;
        let r = 5 + ((enemy.animationTime / 100) | 0) % 5;
        context.save();
            context.translate(x, y);
            context.scale(1, 0.75);
            context.rotate(enemy.animationTime / 200);
            const frame = getFrame(enemy.currentAnimation, enemy.animationTime);
            drawFrame(context, frame, {...frame, x: -8, y: -8});
        context.restore();
        for (let i = 0; i < armCount; i++) {
            context.save();
                context.translate(x, y);
                context.scale(1, 0.75);
                context.rotate(enemy.animationTime / 200 + 2 * Math.PI * i / armCount);
                for (const color of ['white', 'black', 'white', 'gray']) {
                    const alpha = Math.min(1, Math.max(0.2, (1.2 - r / 12)));
                    context.globalAlpha *= alpha;
                    context.beginPath();
                    context.strokeStyle = color;
                    //context.lineWidth = 2;
                    context.arc(r, 0, r, 0, Math.PI);
                    context.stroke();
                    context.globalAlpha /= alpha;
                    r = r - 2;
                    if (r < 5) {
                        r += 5;
                    }
                    context.rotate(2 * Math.PI / armCount / 4);
                }
                r = r + 4;
            context.restore();
        }
    },
};


enemyDefinitions.vortexLava = {
    naturalDifficultyRating: 2,
    animations: {idle: omniAnimation(lavaPoolAnimation)},
    acceleration: 0.2, aggroRadius: 88, speed: 1.2,
    params: {duration: 0},
    life: 4,
    update(state: GameState, enemy: Enemy) {
        if (enemy.params.duration > 0) {
            enemy.params.duration -= FRAME_LENGTH;
            if (enemy.params.duration <= 0) {
                removeObjectFromArea(state, enemy);
                return;
            }
        }
        if (enemy.time < 1000) {
            return;
        }
        const hitbox = enemy.getHitbox();
        const anchorPoint = {
            x: hitbox.x + hitbox.w / 2,
            y: hitbox.y + hitbox.h / 2,
        };
        for (const hero of enemy.area.allyTargets) {
            if (!(hero instanceof Hero)) {
                continue;
            }
            // Base difficulty cannot pull hero in while they are invulnerable.
            if (hero.invulnerableFrames > 0 && enemy.difficulty <= this.naturalDifficultyRating) {
                continue;
            }
            if (hero.action === 'falling' || hero.action === 'fallen') {
                continue;
            }
            // Vortexes on the surface only suck heroes towards them that are swimming.
            if (hero.z > MAX_FLOAT_HEIGHT) {
                continue
            }
            if (getLedgeDelta(state, enemy.area, anchorPoint, hero.getAnchorPoint())) {
                continue;
            }
            const { mag, x, y } = getVectorToTarget(state, enemy, hero);
            if (mag < 8) {
                hero.onHit(state, {
                    damage: 4,
                    element: 'fire',
                    source: enemy,
                });
            } else if (mag < 100){
                const dx = -60 * x / mag, dy = -60 * y / mag;
                moveActor(state, hero, dx, dy, {canJump: true});
            } /*else if (mag < 36) {
                const dx = -3 * x, dy = -3 * y;
                moveActor(state, hero, dx, dy);
            } else if (mag < 60) {
                const dx = -2 * x, dy = -2 * y;
                moveActor(state, hero, dx, dy);
            } else if (mag < 80) {
                const dx = -x, dy = -y;
                moveActor(state, hero, dx, dy);
            }*/
        }
    },
    onHit(state: GameState, enemy: Enemy, hit: HitProperties) {
        if (hit.element === 'ice') {
            removeObjectFromArea(state, enemy);
        }
        return {};
    },
    getHitbox(enemy: Enemy) {
        return {x: enemy.x, y: enemy.y, w: 24, h: 24};
    },
    render(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy) {
        const armCount = 6;
        let r = 8 + ((enemy.animationTime / 100) | 0) % 5;
        const hitbox = enemy.getHitbox(state);
        let x = hitbox.x + hitbox.w / 2, y = hitbox.y + hitbox.h / 2;
        for (let i = 0; i < armCount; i++) {
            r = 2;//(((enemy.animationTime / 100) | 0) % 5) / 10;
            context.save();
                context.translate(x, y);
                let index = 0;
                for (const color of ['#F80', '#800', '#F80', '#840', '#F80', '#800', '#F80', '#840']) {
                    context.save();
                        context.translate(0, -2 * r - index / 5);
                        context.scale(1, 0.75);
                        context.rotate(enemy.animationTime / 200 + 2 * Math.PI * i / armCount + index * Math.PI / 12);
                            //const alpha = Math.min(1, Math.max(0.2, (1.2 - r / 12)));
                            //context.globalAlpha *= alpha;
                            context.beginPath();
                            context.strokeStyle = color;
                            //context.lineWidth = 2;
                            context.arc(r, 0, r, 0, Math.PI);
                            context.stroke();
                            //context.globalAlpha /= alpha;
                            r += 1.5 * Math.min(1 + 0.08 * Math.sin(enemy.time / 200), enemy.time / 1000);
                            context.rotate(2 * Math.PI / armCount / 4);
                    context.restore();
                    index ++;
                }
             context.restore();
        }
    },
    renderShadow(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy) {
        if (enemy.status === 'gone' || enemy.status === 'hidden') {
            return;
        }
        const hitbox = enemy.getHitbox(state);
        const x = hitbox.x + hitbox.w / 2, y = hitbox.y + hitbox.h / 2;
        context.save();
            context.translate(x, y);
            context.scale(0.5, 0.4);
            context.rotate(enemy.animationTime / 200);
            const frame = getFrame(enemy.currentAnimation, enemy.animationTime);
            drawFrame(context, frame, {...frame, x: -8, y: -8});
        context.restore();
    },
};
