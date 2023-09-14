import { objectHash } from 'app/content/objects/objectHash';
import { createAnimation, drawFrame } from 'app/utils/animations';
import { directionMap, getDirection } from 'app/utils/direction';
import { getSectionBoundingBox, moveActor } from 'app/moveActor';
import { moveObject } from 'app/movement/moveObject';


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
    z = 0;
    isObject = <const>true;
    linkedObject: PushPullObject;
    pushFrame = 0;
    pushDirection: Direction;
    pushAmount: number;
    pushCounter: number = 0;
    pushedLastFrame: boolean = false;
    status: ObjectStatus = 'normal';
    constructor(state: GameState, definition: SimpleObjectDefinition) {
        this.definition = definition;
        this.x = definition.x;
        this.y = definition.y;
    }
    getHitbox(state: GameState): Rect {
        return { x: this.x | 0, y: this.y | 0, w: 16, h: 16 };
    }
    onHit(state: GameState, {canPush, direction}: HitProperties): HitResult {
        console.log('pushPullObject.onHit', direction);
        if (this.pushAmount > 0) {
            return {blocked: true, hit: true};
        }
        if (canPush) {
            this.pushInDirection(state, direction, null, 16);
        }
        return {hit: true};
    }
    onPush(state: GameState, direction: Direction): void {
        console.log('pushPullObject.onPush', direction);
        if (this.pushAmount > 0) {
            return;
        }
        this.pushInDirection(state, direction);
    }
    onPull(state: GameState, direction: Direction, hero: Hero): void {
        console.log('pushPullObject.onPull', direction);
        const [dx, dy] = directionMap[direction];
        const {mx, my} = moveActor(state, hero, dx, dy, {
            // Cannot push other objects while pulling an object.
            canPush: false,
            canClimb: false,
            canCrossLedges: false,
            canFall: true,
            canJump: false,
            canSwim: true,
            canWiggle: true,
            direction,
            boundingBox: getSectionBoundingBox(state, hero),
            actor: hero,
            excludedObjects: new Set([this]),
            dx, dy,
        });
        console.log('player moved', mx, my);
        // If the player was able to move in the pulled direction, attempt to move the
        // object as well.
        if (mx || my) {
            // If the object cannot move, undo the movement of the player.
            const result = this.move(state, getDirection(mx, my));
            console.log('result', result);
            if (result.mx !== mx || result.my !== my) {
                console.log('undoing player move');
                hero.x -= mx;
                hero.y -= my;
                if (result.mx || result.my) {
                    console.log('applying object move to player');
                    moveActor(state, hero, result.mx, result.my, {
                        // Cannot push other objects while pulling an object.
                        canPush: false,
                        canClimb: false,
                        canCrossLedges: false,
                        canFall: true,
                        canJump: false,
                        canSwim: true,
                        canWiggle: true,
                        direction: getDirection(result.mx, result.my),
                        boundingBox: getSectionBoundingBox(state, hero),
                        actor: hero,
                        dx: result.mx,
                        dy: result.my,
                    });

                }
            }
        }
    }
    // Test if this object can move 1 pixel in the given direction.
    // This is checked for the object and its linked object at the start of each push action
    // and prevents pushing pots off of ledges.
    move(state: GameState, direction: Direction): {mx: number, my: number} {
        console.log('pushPullObject.move', direction);
        const [dx, dy] = directionMap[direction];
        const movementProperties: MovementProperties = {
            canFall: true,
            canSwim: true,
            canWiggle: true,
            direction,
            blockedBoxes: state.hero.area === this.area ? [state.hero, ...(state.hero.clones || [])].map(o => o.getHitbox()) : [],
            excludedObjects: new Set([this])
        };
        const {mx, my} = moveObject(state, this, dx, dy, movementProperties);
        if (!mx && !my) {
            console.log('Failed to move object');
            return {mx, my};
        }
        // If the object is linked, limit its movement by the movement of the linked object.
        if (this.linkedObject) {
            console.log('moving linked object', mx, my, getDirection(mx, my));
            const linkedResult = moveObject(state, this.linkedObject, mx, my, {
                canFall: true,
                canSwim: true,
                // We rely on the base object wiggling for wiggling behavior.
                canWiggle: false,
                direction: getDirection(mx, my),
                blockedBoxes: state.hero.area === this.linkedObject.area ? [state.hero, ...(state.hero.clones || [])].map(o => o.getHitbox()) : [],
                excludedObjects: new Set([this.linkedObject])
            });
            console.log('linkedResult:', linkedResult);
            this.x = this.linkedObject.x;
            this.y = this.linkedObject.y;
            return linkedResult;
        }
        console.log('move succeeded');
        return {mx, my};
    }
    pushInDirection(state: GameState, direction: Direction, hero: Hero = null, amount = 1): void {
        console.log('pushPullObject.pushInDirection', direction, !!hero, amount);
        if (this.pushAmount > 0) {
            return;
        }
        this.pushDirection = direction;
        this.pushAmount = amount;
    }
    update(state: GameState) {
        // Move for `pushAmount` pixels after getting hit by a projectile.
        if (this.pushAmount > 0) {
            this.pushAmount--;
            if (!this.move(state, this.pushDirection)) {
                this.pushAmount = 0;
            }
        }
    }
    render(context, state: GameState) {
        drawFrame(context, potFrame, { ...potFrame, x: this.x, y: this.y - 2 - this.z});
    }
}
objectHash.pushPull = PushPullObject;
