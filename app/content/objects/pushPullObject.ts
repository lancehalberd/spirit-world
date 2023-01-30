import { objectHash } from 'app/content/objects/objectHash';
import { createAnimation, drawFrame } from 'app/utils/animations';
import { directionMap, isPointOpen } from 'app/utils/field';

import {
    AreaInstance, Direction, Frame, GameState, Hero, HitProperties, HitResult, ObjectInstance,
    ObjectStatus, SimpleObjectDefinition, Rect,
} from 'app/types';

const potFrame: Frame = createAnimation('gfx/tiles/movablepot.png', {w: 16, h: 18}).frames[0];

export class PushPullObject implements ObjectInstance {
    area: AreaInstance;
    alwaysReset = true;
    behaviors = {
        solid: true,
        midHeight: true,
    };
    isNeutralTarget = true;
    drawPriority: 'sprites' = 'sprites';
    definition: SimpleObjectDefinition = null;
    x: number;
    y: number;
    grabDirection: Direction;
    isObject = <const>true;
    linkedObject: PushPullObject;
    pullingHeroDirection: Direction;
    pushFrame = 0;
    pushDirection: Direction;
    pushCounter: number = 0;
    pushedLastFrame: boolean = false;
    status: ObjectStatus = 'normal';
    constructor(state: GameState, definition: SimpleObjectDefinition) {
        this.definition = definition;
        this.x = definition.x;
        this.y = definition.y;
    }
    getHitbox(state: GameState): Rect {
        return { x: this.x, y: this.y, w: 16, h: 16 };
    }
    onGrab(state: GameState, direction: Direction): void {
        this.grabDirection = direction;
    }
    onHit(state: GameState, {canPush, direction}: HitProperties): HitResult {
        if (!this.pushDirection) {
            if (canPush) {
                this.pushInDirection(state, direction);
            }
            return {hit: true};
        }
        return {blocked: true, hit: true};
    }
    onPush(state: GameState, direction: Direction): void {
        if (!this.pushDirection) {
            this.pushCounter++;
            this.pushedLastFrame = true;
            if (this.pushCounter > 20) {
                this.pushInDirection(state, direction);
            }
        }
    }
    onPull(state: GameState, direction: Direction, hero: Hero): void {
        this.pushInDirection(state, direction, hero);
    }
    pushInDirection(state: GameState, direction: Direction, hero: Hero = null): void {
        if (this.pushDirection) {
            return;
        }
        const x = this.x + 8 + 16 * directionMap[direction][0];
        const y = this.y + 8 + 16 * directionMap[direction][1];
        const excludedObjects = new Set([hero, this, this.linkedObject]);
        const movementProperties = {canFall: true, needsFullTile: true};
        if (isPointOpen(state, this.area, {x, y}, movementProperties, excludedObjects)
            && (!this.linkedObject || isPointOpen(state, this.linkedObject.area, {x, y}, movementProperties, excludedObjects))
        ) {
            this.pushDirection = direction;
            this.pullingHeroDirection = direction;
            this.pushFrame = 0;
        }
    }
    update(state: GameState) {
        if (this.pushDirection) {
            if (this.pushFrame < 16) {
                this.pushFrame++;
                this.x += directionMap[this.pushDirection][0];
                this.y += directionMap[this.pushDirection][1];
                if (this.linkedObject) {
                    this.linkedObject.x = this.x;
                    this.linkedObject.y = this.y;
                }
            } else {
                this.pullingHeroDirection = null;
                this.pushDirection = null;
                this.pushFrame = 0;
            }
        } else if (!this.pushedLastFrame) {
            this.pushCounter = 0;
        } else {
            this.pushedLastFrame = false;
        }
    }
    render(context, state: GameState) {
        drawFrame(context, potFrame, { ...potFrame, x: this.x, y: this.y - 2});
    }
}
objectHash.pushPull = PushPullObject;
