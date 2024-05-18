import { objectHash } from 'app/content/objects/objectHash';
import { createAnimation, drawFrame } from 'app/utils/animations';
import { directionMap, getDirection } from 'app/utils/direction';
import { getBoundingRect } from 'app/utils/index';
import { getSectionBoundingBox } from 'app/movement/moveActor';
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
    getHitbox(): Rect {
        return { x: this.x | 0, y: this.y | 0, w: 16, h: 16 };
    }
    onHit(state: GameState, {canPush, direction}: HitProperties): HitResult {
        //console.log('pushPullObject.onHit', direction);
        if (this.pushAmount > 0) {
            return {blocked: true, hit: true};
        }
        if (canPush) {
            this.pushInDirection(state, direction, 16);
        }
        return {blocked: true, hit: true};
    }
    onPush(state: GameState, direction: Direction): void {
        //console.log('pushPullObject.onPush', direction);
        if (this.pushAmount > 0) {
            return;
        }
        this.pushInDirection(state, direction);
    }
    onPull(state: GameState, direction: Direction, hero: Hero): void {
        //console.log('pushPullObject.onPull', direction);
        const boundingBox = getBoundingRect(this.getHitbox(), hero.getMovementHitbox());
        //console.log('hero: ', hero.x, hero.y);
        //console.log('pot: ', this.x, this.y);
        //console.log(boundingBox);
        const composite: ObjectInstance = {
            isObject: true,
            area: this.area,
            x: boundingBox.x,
            y: boundingBox.y,
            status: 'normal',
            getHitbox() {
                return {x: this.x | 0, y: this.y | 0, w: boundingBox.w, h: boundingBox.h};
            },
            render() {}
        };
        const [dx, dy] = directionMap[direction];
        const {mx, my} = moveObject(state, composite, dx, dy, {
            canFall: true,
            canSwim: true,
            canWiggle: true,
            direction,
            boundingBox: getSectionBoundingBox(state, hero),
            // TODO: we probably need to set this to hit damaging tiles, but that might use the whole hitbox.
            //actor: hero,
            excludedObjects: new Set([this]),
            dx, dy,
        });
        //console.log('composite result', {mx, my});
        // Return early if no movement occurred.
        if (!mx && !my) {
            return;
        }
        // If there is a linked object, attempt to move it the same way the main object moved.
        const linkedResult = this.linkedObject && moveObject(state, this.linkedObject, mx, my, {
            canFall: true,
            canSwim: true,
            canWiggle: true,
            direction: getDirection(mx, my),
            blockedBoxes: state.hero.area === this.linkedObject.area ? [state.hero, ...(state.hero.clones || [])].map(o => o.getHitbox()) : [],
            excludedObjects: new Set([this.linkedObject]),
            dx: mx, dy: my,
        });
        // If there was no linked object, or it could complete the movement, apply the test movement to the hero+object.
        if (!linkedResult || (linkedResult.mx === mx && linkedResult.my === my)) {
            hero.x += mx;
            hero.y += my;
            this.x += mx;
            this.y += my;
            return;
        }
        //console.log('linked result', linkedResult);
        // If the linked object couldn't move at all, return early, nothing will move.
        if (!linkedResult.mx && !linkedResult.my) {
            return;
        }
        // The linked object moved differently than the base object, either less or it wiggled to align with a gap.
        // In this case we will use the movement only if the composite object can make this exact movement as well.
        // Reset the composite object's position to try the new movement.
        composite.x = boundingBox.x;
        composite.y = boundingBox.y;
        const finalResult = moveObject(state, composite, linkedResult.mx, linkedResult.my, {
            canFall: true,
            canSwim: true,
            canWiggle: true,
            direction: getDirection(linkedResult.mx, linkedResult.my),
            boundingBox: getSectionBoundingBox(state, hero),
            // TODO: we probably need to set this to hit damaging tiles, but that might use the whole hitbox.
            //actor: hero,
            excludedObjects: new Set([this]),
            dx: linkedResult.mx, dy: linkedResult.my,
        });
        //console.log('final result', finalResult);
        if (finalResult.mx === linkedResult.mx && finalResult.my === linkedResult.my) {
            hero.x += finalResult.mx;
            hero.y += finalResult.my;
            this.x += finalResult.mx;
            this.y += finalResult.my
        } else {
            // If the movement failed, reset the linked object's position.
            this.linkedObject.x = this.x;
            this.linkedObject.y = this.y;
        }
    }
    // Test if this object can move 1 pixel in the given direction.
    // This is checked for the object and its linked object at the start of each push action
    // and prevents pushing pots off of ledges.
    move(state: GameState, direction: Direction): {mx: number, my: number} {
        //console.log('pushPullObject.move', direction);
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
            //console.log('Failed to move object');
            return {mx, my};
        }
        // If the object is linked, limit its movement by the movement of the linked object.
        if (this.linkedObject) {
            //console.log('moving linked object', mx, my, getDirection(mx, my));
            const linkedResult = moveObject(state, this.linkedObject, mx, my, {
                canFall: true,
                canSwim: true,
                // We rely on the base object wiggling for wiggling behavior.
                canWiggle: false,
                direction: getDirection(mx, my),
                blockedBoxes: state.hero.area === this.linkedObject.area ? [state.hero, ...(state.hero.clones || [])].map(o => o.getHitbox()) : [],
                excludedObjects: new Set([this.linkedObject])
            });
            //console.log('linkedResult:', linkedResult);
            this.x = this.linkedObject.x;
            this.y = this.linkedObject.y;
            return linkedResult;
        }
        //console.log('move succeeded');
        return {mx, my};
    }
    pushInDirection(state: GameState, direction: Direction, amount = 1): void {
        //console.log('pushPullObject.pushInDirection', direction, !!hero, amount);
        if (this.pushAmount > 0) {
            return;
        }
        this.pushDirection = direction;
        this.pushAmount = amount;
    }
    update(state: GameState) {
        // Move for `pushAmount` pixels after getting hit by a projectile.
        if (this.pushAmount > 0) {
            this.pushAmount = Math.max(0, this.pushAmount - 1);
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
