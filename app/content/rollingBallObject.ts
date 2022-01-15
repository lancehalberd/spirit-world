import { playAreaSound, removeObjectFromArea } from 'app/content/areas';
import { FRAME_LENGTH } from 'app/gameConstants';
import { createAnimation, drawFrame, getFrame } from 'app/utils/animations';
import { directionMap, getTileBehaviorsAndObstacles, hitTargets, isPointOpen } from 'app/utils/field';
import { stopSound } from 'app/musicController';

import {
    AreaInstance, BallGoal, Direction, GameState, HitProperties, HitResult,
    BaseObjectDefinition, ObjectInstance, ObjectStatus, Rect,
} from 'app/types';

const rollingAnimation = createAnimation('gfx/tiles/rollingboulder.png', {w: 16, h: 16}, {cols:4});
const rollingAnimationSpirit = createAnimation('gfx/tiles/rollingboulderspirit.png', {w: 16, h: 16}, {cols:4});

export class RollingBallObject implements ObjectInstance {
    area: AreaInstance;
    alwaysReset = true;
    behaviors = {
        solid: true,
    };
    isNeutralTarget = true;
    drawPriority: 'sprites' = 'sprites';
    definition = null;
    x: number;
    y: number;
    linkedObject: RollingBallObject;
    rollDirection: Direction;
    pushCounter: number = 0;
    pushedThisFrame: boolean = false;
    status: ObjectStatus = 'normal';
    animationTime = 0;
    stuck: boolean = false;
    soundReference;
    constructor(definition: BaseObjectDefinition) {
        this.definition = definition;
        this.x = definition.x;
        this.y = definition.y;
    }
    cleanup() {
        this.stopRollingSound();
    }
    getHitbox(state: GameState): Rect {
        return { x: this.x, y: this.y, w: 16, h: 16 };
    }
    onHit(state: GameState, {canPush, direction}: HitProperties): HitResult {
        if (!this.rollDirection) {
            if (canPush) {
                this.rollInDirection(state, direction);
            }
            return { hit: true };
        }
        return {};
    }
    onPush(state: GameState, direction: Direction): void {
        if (!this.rollDirection) {
            this.pushCounter++;
            this.pushedThisFrame = true;
            if (this.pushCounter >= 25) {
                this.rollInDirection(state, direction);
            }
        }
    }
    rollInDirection(state: GameState, direction: Direction): void {
        if (this.stuck) {
            return;
        }
        const x = this.x + 8 + 16 * directionMap[direction][0];
        const y = this.y + 8 + 16 * directionMap[direction][1];
        const excludedObjects = new Set([this, state.hero, state.hero.astralProjection, ...state.hero.clones]);
        if (isPointOpen(state, this.area, {x, y}, {canFall: true}, excludedObjects)
            && (!this.linkedObject || isPointOpen(state, this.linkedObject.area, {x, y}, {canFall: true}, excludedObjects))
        ) {
            this.rollDirection = direction;
            this.startRollingSound(state);
            if (this.linkedObject) {
                this.linkedObject.rollDirection = direction;
                this.linkedObject.startRollingSound(state);
            }
        }
    }
    startRollingSound(state) {
        this.soundReference = playAreaSound(state, this.area, 'rollingBall');
    }
    stopRollingSound() {
        if (this.soundReference) {
            stopSound(this.soundReference);
            this.soundReference = null;
        }
    }
    update(state: GameState) {
        if (this.rollDirection) {
            this.animationTime += FRAME_LENGTH;
            const dx = 2 * directionMap[this.rollDirection][0];
            const dy = 2 * directionMap[this.rollDirection][1];
            const x = this.x + dx + (this.rollDirection === 'right' ? 15 : 0);
            const y = this.y + dy + (this.rollDirection === 'down' ? 15 : 0);
            for (const object of this.area.objects) {
                if (object.definition?.type !== 'ballGoal') {
                    continue;
                }
                if (Math.abs(this.x - object.x) <= 2 && Math.abs(this.y - object.y) <= 2) {
                    this.stopRollingSound();
                    playAreaSound(state, this.area, 'rollingBallSocket');
                    (object as BallGoal).activate(state);
                    // The activated BallGoal will render the ball in the depression, so we remove
                    // the original ball from the area.
                    removeObjectFromArea(state, this);
                    if (this.linkedObject) {
                        this.linkedObject.stopRollingSound();
                        const linkedGoal = (object as BallGoal).linkedObject;
                        if (linkedGoal) {
                            linkedGoal.activate(state);
                            removeObjectFromArea(state, this);
                        } else {
                            // If there is no alternate goal, the alternate ball is just stuck in place.
                            this.linkedObject.rollDirection = null;
                            this.linkedObject.stuck = true;
                        }
                    }
                    return;
                }
            }
            // Rolling balls hurt actors and push on other objects.
            // Use a slightly larger hitbox so we trigger hitting objects before stopping.
            const bigHitbox = { x: this.x, y: this.y, w: 16, h: 16 };
            if (dx) {
                bigHitbox.w += 2;
                bigHitbox.x -= dx / 2;
            }
            if (dy) {
                bigHitbox.h += 2;
                bigHitbox.y -= dy / 2;
            }
            hitTargets(state, this.area, {
                canPush: true,
                damage: 2,
                direction: this.rollDirection,
                hitbox: bigHitbox,
                hitObjects: true,
                hitEnemies: true,
                knockAwayFrom: {x: this.x + 8, y: this.y + 8},
            });
            // This is a little bit of a hack.
            // When rolling, shorten the hitbox so that it doesn't the player when they
            // are pushing into it or less than a full pixel overlapping the ball.
            const smallHitbox = { x: this.x + 1 + dx / 2, y: this.y + 1 + dy / 2, w: 14, h: 14 };
            hitTargets(state, this.area, {
                canPush: true,
                damage: 2,
                direction: this.rollDirection,
                hitbox: smallHitbox,
                hitAllies: true,
                knockAwayFrom: {x: this.x + 8, y: this.y + 8},
            });
            // MC + clones do not obstruct rolling balls.
            const excludedObjects = new Set([this, state.hero, state.hero.astralProjection, ...state.hero.clones]);
            const { tileBehavior } = getTileBehaviorsAndObstacles(state, this.area, {x, y}, excludedObjects);
            if (!tileBehavior.solid && !tileBehavior.outOfBounds) {
                this.x += dx;
                this.y += dy;
            } else {
                this.stopRollingSound();
                this.linkedObject?.stopRollingSound();
                playAreaSound(state, this.area, 'rollingBallHit');
                this.rollDirection = null;
            }
        }
        // Reset the pushCounter any time this object isn't being pushed.
        if (!this.pushedThisFrame) {
            this.pushCounter = 0;
        } else {
            this.pushedThisFrame = false;
        }
        if (this.linkedObject && this.linkedObject.rollDirection === null) {
            this.rollDirection = null;
            this.x = this.linkedObject.x;
            this.y = this.linkedObject.y;
        }
    }
    render(context, state: GameState) {
        const frame = getFrame(this.definition.spirit ? rollingAnimationSpirit : rollingAnimation, this.animationTime);
        drawFrame(context, frame, { ...frame, x: this.x, y: this.y });
    }
}
