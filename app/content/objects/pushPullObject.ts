import { objectHash } from 'app/content/objects/objectHash';
import { getActorTargets } from 'app/getActorTargets';
import { getSectionBoundingBox, moveActor } from 'app/movement/moveActor';
import { moveObject } from 'app/movement/moveObject';
import { showMessage } from 'app/scriptEvents';
import { boxesIntersect } from 'app/utils/index';
import { createAnimation, drawFrameAt } from 'app/utils/animations';
import { directionMap, getDirection } from 'app/utils/direction';


const potGeometry = {w: 32, h: 32, content: {x: 8, y: 16, w: 16, h: 16}};
const [potFrame] = createAnimation('gfx/objects/Pots.png', potGeometry,{y: 6, left: 8, cols: 6, duration: 4}).frames;
const [spiritPotFrame] = createAnimation('gfx/objects/Pots.png', potGeometry,{y: 7, left: 8, cols: 6, duration: 4}).frames;
const [largeElephantFrame] = createAnimation('gfx/objects/elephants.png', {w: 32, h: 48, content: {x: 1, y: 24, w: 30, h: 24}}).frames;
const [smallElephantFrame] = createAnimation('gfx/objects/elephants.png',
    {w: 18, h: 26, content: {x: 1, y: 14, w: 16, h: 12}}, {left: 47, top: 22}).frames;

interface PushPullObjectStyle {
    frame: Frame
    spiritFrame?: Frame
    weight: number
    pushSpeed: number
    renderShadow?: (context: CanvasRenderingContext2D, state: GameState, object: ObjectInstance) => void
}

export const pushPullObjectStyles: {[key in string]: PushPullObjectStyle} = {
    pot: {
        frame: potFrame,
        spiritFrame: spiritPotFrame,
        weight: 0,
        pushSpeed: 1,
    },
    largeStatue: {
        frame: largeElephantFrame,
        weight: 2,
        pushSpeed: 0.5,
        renderShadow(this: void, context: CanvasRenderingContext2D, state: GameState, object: ObjectInstance) {
            console.log('Render big shadow');
            const x = object.x | 0, y = object.y | 0;
            context.save();
                context.globalAlpha *= 0.3;
                context.fillStyle = 'black';
                context.fillRect(x - 1, y + 4, 32, 19);
                context.fillRect(x, y + 23, 30, 1);
                context.fillRect(x + 1, y + 24, 28, 1);
            context.restore();
        },
    },
    smallStatue: {
        frame: smallElephantFrame,
        weight: 2,
        pushSpeed: 0.75,
        renderShadow(this: void, context: CanvasRenderingContext2D, state: GameState, object: ObjectInstance) {
            const x = object.x | 0, y = object.y | 0;
            context.save();
                context.globalAlpha *= 0.3;
                context.fillStyle = 'black';
                context.fillRect(x, y + 1, 16, 12);
            context.restore();
        },
    },
}

export class PushPullObject implements ObjectInstance {
    area: AreaInstance;
    alwaysReset = true;
    behaviors = {
        solid: true,
        midHeight: true,
    };
    ignorePits = false;
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
    pushSpeed: number
    pushCounter: number = 0;
    pushedLastFrame: boolean = false;
    status: ObjectStatus = 'normal';
    constructor(state: GameState, definition: SimpleObjectDefinition) {
        this.definition = definition;
        this.x = definition.x;
        this.y = definition.y;
    }
    getStyle(): PushPullObjectStyle {
        return pushPullObjectStyles[this.definition.style] || pushPullObjectStyles.pot;
    }
    getHitbox(): Rect {
        const frame = this.getStyle().frame;
        return { x: this.x | 0, y: this.y | 0, w: frame.content?.w || frame.w, h: frame.content?.h || frame.h };
    }
    onHit(state: GameState, {canPush, direction, isBonk}: HitProperties): HitResult {
        //console.log('pushPullObject.onHit', direction);
        const style = this.getStyle();

        if (canPush) {
            let distance = 16;
            if (isBonk) {
                distance *= 4;
                if (state.hero.savedData.activeTools.staff & 2) {
                    distance *= 4;
                } else if (style.weight > 1) {
                    // Only level 2 staff bonk can move heavy objects.
                    return {blocked: true, hit: true};
                }
            } else if (style.weight > 0) {
                // Regular hits won't move weighted objects.
                return {blocked: true, hit: true};
            }
            this.pushInDirection(state, direction, distance);
        }
        return {blocked: true, stopped: true, hit: true};
    }
    canMove(state: GameState, puller: Hero = null): boolean {
        for (const hero of [state.hero, ...(state.hero.clones || [])]) {
            if (hero === puller) {
                continue;
            }
            // Only the puller can move the object they have grabbed.
            if (hero.grabObject === this) {
                return false
            }
        }
        const style = this.getStyle();
        if (style.weight === 0) {
            return true;
        }
        if (style.weight === 1) {
            if (state.hero.savedData.passiveTools.gloves) {
                return true;
            }
            showMessage(state, 'It feels like you could move this if you were a little stronger.');
            return false;
        }
        if (style.weight === 2) {
            if (state.hero.savedData.passiveTools.gloves >= 2) {
                return true;
            }
            if (state.hero.savedData.passiveTools.gloves) {
                showMessage(state, 'It feels like you could move this if you were a little stronger.');
            } else {
                showMessage(state, 'Only a monster could move something this heavy!');
            }
            return false;
        }
        return false;
    }
    onPush(state: GameState, direction: Direction): void {
        //console.log('pushPullObject.onPush', direction);
        this.pushInDirection(state, direction);
    }
    // Don't allow grabbing an object in motion.
    onGrab(state: GameState, direction: Direction, hero: Hero): void {
        if (this.pushAmount > 1) {
            delete hero.action;
        }
    }
    onPull(state: GameState, direction: Direction, hero: Hero): void {
        if (this.pushAmount > 1) {
            delete hero.action;
            return;
        }
        if (!this.canMove(state, hero)) {
            return;
        }
        if (this.getStyle().pushSpeed < 1) {
            if (this.pushFrame >= 1 / (1 - this.getStyle().pushSpeed)) {
                this.pushFrame = 0;
                return;
            }
            this.pushFrame++;
        }
        const [dx, dy] = directionMap[direction];
        moveObjectThenHero(state, hero, this, dx, dy);
    }
    // Test if this object can move 1 pixel in the given direction.
    // This is checked for the object and its linked object at the start of each push action
    // and prevents pushing pots off of ledges.
    move(state: GameState, direction: Direction, amount: number): {mx: number, my: number} {
        //console.log('pushPullObject.move', direction);
        const [dx, dy] = directionMap[direction];
        return moveLinkedObject(state, this, dx * amount, dy * amount);
    }
    pushInDirection(state: GameState, direction: Direction, amount = 1): void {
        //console.log('pushPullObject.pushInDirection', direction, !!hero, amount);
        if (!this.canMove(state)) {
            return;
        }
        this.pushDirection = direction;
        this.pushAmount = amount * this.getStyle().pushSpeed;
        this.pushSpeed = Math.min(8, Math.max(1, amount / 16)) * this.getStyle().pushSpeed;
        // Pots hit by the tower staff move so fast the don't fall in pits.
        this.ignorePits = this.pushSpeed > 4;
    }
    update(state: GameState) {
        // Move for `pushAmount` pixels after getting hit by a projectile.
        if (this.pushAmount > 0) {
            this.pushAmount = Math.max(0, this.pushAmount - this.pushSpeed);
            if (!this.move(state, this.pushDirection, this.pushSpeed)) {
                this.pushAmount = 0;
            }
        } else {
            this.ignorePits = false;
        }
    }
    render(context, state: GameState) {
        let {spiritFrame, frame} = this.getStyle();
        frame = this.definition.spirit ? (spiritFrame || frame) : frame;
        drawFrameAt(context, frame, {x: this.x, y: this.y - this.z});
    }
    renderShadow(context, state: GameState) {
        this.getStyle().renderShadow?.(context, state, this);
    }
}
objectHash.pushPull = PushPullObject;

function moveObjectThenHero(this: void, state: GameState, hero: Hero, object: ObjectInstance, dx: number, dy: number): boolean {
    const ox = object.x, oy = object.y;
    const {mx, my} = moveLinkedObject(state, object, dx, dy, [hero]);
    if (!mx && !my) {
        return moveHeroThenObject(state, hero, object, dx, dy);
    }
    const hx = hero.x, hy = hero.y;
    const {mx: mx1, my: my1} = moveHero(state, hero, mx, my);
    // The move is only valid if the hero can still be grabbing the object, and the object is not intersecting the hero.
    // Multiplying by dx/dy when comparing mx/my values allows wiggling the object to get through narrow openings by only requiring
    // matching movement in the direction the player is trying to move.
    if (mx * dx === mx1 * dx && my * dy === my1 * dy
        && getActorTargets(state, hero).objects.includes(hero.grabObject)
        && !boxesIntersect(hero.getHitbox(), object.getHitbox())
    ) {
        return true;
    }
    // If the position is invalid, reset and try moving the hero first.
    hero.x = hx;
    hero.y = hy;
    setObjectPosition(object, ox, oy);
    return moveHeroThenObject(state, hero, object, dx, dy);
}

function moveHeroThenObject(this: void, state: GameState, hero: Hero, object: ObjectInstance, dx: number, dy: number): boolean {
    const hx = hero.x, hy = hero.y;
    const {mx, my} = moveHero(state, hero, dx, dy, [object]);
    if (!mx && !my) {
        return false
    }
    const ox = object.x, oy = object.y;
    const {mx: mx1, my: my1} = moveLinkedObject(state, object, mx, my);
    // The move is only valid if the hero can still be grabbing the object, and the object is not intersecting the hero.
    // Multiplying by dx/dy when comparing mx/my values allows wiggling the object to get through narrow openings by only requiring
    // matching movement in the direction the player is trying to move.
    if (mx * dx === mx1 * dx && my * dy === my1 * dy
        && getActorTargets(state, hero).objects.includes(hero.grabObject)
        && !boxesIntersect(hero.getHitbox(), object.getHitbox())
    ) {
        return true;
    }
    // If the position is still invalid, reset everything.
    setObjectPosition(object, ox, oy);
    hero.x = hx;
    hero.y = hy;
    return false;
}
function setObjectPosition(this: void, object: ObjectInstance, x: number, y: number) {
    object.x = x;
    object.y = y;
    if (object.linkedObject) {
        object.linkedObject.x = x;
        object.linkedObject.y = y;
    }
}

function moveHero(this: void, state: GameState, hero: Hero, dx: number, dy: number, excludedObjects: ObjectInstance[] = []) {
    const movementProperties: MovementProperties = {
        canFall: true,
        canSwim: true,
        canWiggle: true,
        direction: getDirection(dx, dy, true),
        boundingBox: getSectionBoundingBox(state, hero),
        excludedObjects: new Set(excludedObjects)
    };
    return moveActor(state, hero, dx, dy, movementProperties);
}

export function moveLinkedObject(this: void, state: GameState, object: ObjectInstance, dx: number, dy: number, excludedObjects: ObjectInstance[] = []) {
    const heroesAndClones = [state.hero, ...(state.hero.clones || [])];
    let blockedBoxes = heroesAndClones.filter(h => !excludedObjects.includes(h) && h.area === object.area).map(h => h.getHitbox());
    const movementProperties: MovementProperties = {
        canFall: true,
        canSwim: true,
        canWiggle: true,
        direction: getDirection(dx, dy, true),
        boundingBox: getSectionBoundingBox(state, object),
        blockedBoxes,
        excludedObjects: new Set([...excludedObjects, object])
    };
    const {mx, my} = moveObject(state, object, dx, dy, movementProperties);
    if (!mx && !my) {
        //console.log('Failed to move object');
        return {mx, my};
    }
    // If the object is linked, limit its movement by the movement of the linked object.
    // Currently this is never true for the hero.
    if (object.linkedObject) {
        //console.log('moving linked object', mx, my, getDirection(mx, my));
        blockedBoxes = heroesAndClones.filter(h => !excludedObjects.includes(h) && h.area === object.linkedObject.area).map(h => h.getHitbox());
        const linkedResult = moveObject(state, object.linkedObject, mx, my, {
            canFall: true,
            canSwim: true,
            // We rely on the base object wiggling for wiggling behavior.
            canWiggle: false,
            direction: getDirection(mx, my),
            boundingBox: getSectionBoundingBox(state, object.linkedObject),
            blockedBoxes,
            excludedObjects: new Set([object.linkedObject])
        });
        //console.log('linkedResult:', linkedResult);
        object.x = object.linkedObject.x;
        object.y = object.linkedObject.y;
        return linkedResult;
    }
    //console.log('move succeeded');
    return {mx, my};
}
