import { AnimationEffect, splashAnimation } from 'app/content/effects/animationEffect';
import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import { omniAnimation } from 'app/content/enemyAnimations';
import { Hero } from 'app/content/hero';
import { FRAME_LENGTH } from 'app/gameConstants';
import { getEnemyBoundingBox, getSectionBoundingBox, intersectRectangles, moveActor } from 'app/moveActor';
import { isUnderwater } from 'app/utils/actor';
import { createAnimation, drawFrame, getFrame } from 'app/utils/animations';
import { addEffectToArea } from 'app/utils/effects';
import {
    accelerateInDirection,
    moveEnemy,
} from 'app/utils/enemies';
import { removeObjectFromArea } from 'app/utils/objects';
import {
    getVectorToNearbyTarget,
    getVectorToTarget,
} from 'app/utils/target';

import { Enemy, GameState, HitProperties } from 'app/types';

const poolAnimation = createAnimation('gfx/tiles/deeptoshallowwater.png', {w: 16, h: 16}, {x: 3, y: 0});

enemyDefinitions.vortex = {
    animations: {idle: omniAnimation(poolAnimation)},
    acceleration: 0.2, aggroRadius: 88, speed: 1.2,
    params: {chaseCooldown: 0},
    life: 4,
    update(this: void, state: GameState, enemy: Enemy) {
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
                    hero.action = 'falling';
                    hero.animationTime = 400;
                    hero.x = enemy.x + 4;
                    hero.y = enemy.y + 4;
                    enemy.params.chaseCooldown = 1500;
                    const animation = new AnimationEffect({
                        animation: splashAnimation,
                        drawPriority: 'sprites',
                        // increase y+z by 4 to make this draw in front of the hero fall animation.
                        x: hero.x, y: hero.y + 4, z: 4
                    });
                    addEffectToArea(state, hero.area, animation);
                }
            } else if (mag < 40) {
                if (hero.z > 0) {
                    hero.z -= 2;
                }
                // This maxes at 4 if the hero is as close as possible (8px).
                const dx = -256 * x / mag / mag, dy = -256 * y / mag / mag;
                // TODO: only apply this if the hero is underwater or swimming
                moveActor(state, hero, dx, dy, {
                    canFall: true,
                    canSwim: true,
                    direction: hero.d,
                    actor: hero,
                    dx, dy,
                });
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
