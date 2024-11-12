import { objectHash } from 'app/content/objects/objectHash';
import { getActorTargets } from 'app/getActorTargets';
import { getSectionBoundingBox, moveActor } from 'app/movement/moveActor';
import { moveObject } from 'app/movement/moveObject';
// import { showMessage } from 'app/scriptEvents';
import { boxesIntersect } from 'app/utils/index';
import { createAnimation, drawFrameAt } from 'app/utils/animations';
import { directionMap } from 'app/utils/direction';
import { getObjectStatus, saveObjectStatus } from 'app/utils/objects';


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
            let forceLevel = 0;
            if (isBonk) {
                distance *= 4;
                forceLevel = 1;
                if (state.hero.savedData.activeTools.staff & 2) {
                    distance *= 4;
                    forceLevel = 2;
                } else if (style.weight > 1) {
                    // Only level 2 staff bonk can move heavy objects.
                    return {blocked: true, hit: true};
                }
            } else if (style.weight > 0) {
                // Regular hits won't move weighted objects.
                return {blocked: true, hit: true};
            }
            this.pushInDirection(state, direction, distance, forceLevel);
        }
        return {blocked: true, stopped: true, hit: true};
    }
    canMove(state: GameState, puller: Hero = null, forceLevel = 0): boolean {
        for (const hero of [state.hero, state.hero.astralProjection, ...(state.hero.clones || [])]) {
            if (!hero || hero === puller) {
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
            if (state.hero.savedData.passiveTools.gloves || forceLevel) {
                return true;
            }
            //showMessage(state, 'It feels like you could move this if you were a little stronger.');
            return false;
        }
        if (style.weight === 2) {
            if (state.hero.savedData.passiveTools.gloves >= 2 || forceLevel >= 2) {
                return true;
            }
            /*if (state.hero.savedData.passiveTools.gloves) {
                showMessage(state, 'It feels like you could move this if you were a little stronger.');
            } else {
                showMessage(state, 'Only a monster could move something this heavy!');
            }*/
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
    pushInDirection(state: GameState, direction: Direction, amount = 1, forceLevel = 0): void {
        //console.log('pushPullObject.pushInDirection', direction, !!hero, amount);
        if (!this.canMove(state, null, forceLevel)) {
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
            // Check to save position if the object has stopped moving.
            if (this.definition?.savePosition) {
                const p = getObjectStatus(state, this.definition, 'position');
                if (Array.isArray(p) && (p[0] !== this.x || p[1] !== this.y)) {
                    saveObjectStatus(state, this.definition, [this.x, this.y], 'position');
                }
            }
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        let {spiritFrame, frame} = this.getStyle();
        frame = this.definition.spirit ? (spiritFrame || frame) : frame;
        drawFrameAt(context, frame, {x: this.x, y: this.y - this.z});
    }
    renderShadow(context: CanvasRenderingContext2D, state: GameState) {
        this.getStyle().renderShadow?.(context, state, this);
    }
}
objectHash.pushPull = PushPullObject;

function moveObjectThenHero(this: void, state: GameState, hero: Hero, object: ObjectInstance, dx: number, dy: number): boolean {
    const ox = object.x, oy = object.y;
    const {mx, my} = moveLinkedObject(state, object, dx, dy, {excludedObjects: new Set([hero])});
    if (!mx && !my) {
        const heroHitbox = hero.getHitbox(), objectHitbox = object.getHitbox();
        // The hero can move independently of the object as long as it isn't moving further away from the bounds of the object.
        if (
            (dx < 0 && heroHitbox.x > objectHitbox.x)
            || (dx > 0 && heroHitbox.x + heroHitbox.w < objectHitbox.x + objectHitbox.w)
            || (dy < 0 && heroHitbox.y > objectHitbox.y)
            || (dy > 0 && heroHitbox.y + heroHitbox.h < objectHitbox.y + objectHitbox.h)
        ) {
            moveHero(state, hero, dx, dy);
            return true;
        }
        return moveHeroThenObject(state, hero, object, dx, dy);
    }
    const hx = hero.x, hy = hero.y;
    const {mx: mx1, my: my1} = moveHero(state, hero, mx, my);
    //const {mx: mx1, my: my1} = moveHero(state, hero, mx, my, [object]);
    // The move is only valid if the hero can still be grabbing the object, and the object is not intersecting the hero.
    // Multiplying by dx/dy when comparing mx/my values allows wiggling the object to get through narrow openings by only requiring
    // matching movement in the direction the player is trying to move.
    const heroHitbox = hero.getHitbox(), objectHitbox = object.getHitbox();
    if (mx * dx === mx1 * dx && my * dy === my1 * dy
        && getActorTargets(state, hero).objects.includes(hero.grabObject)
        && !boxesIntersect(heroHitbox, objectHitbox)
    ) {
        return true;
    }
    if (dx && my1) {
        hero.x = hx;
        setObjectPosition(object, ox, object.y);
        // Try to match the wiggle of the hero only if it keeps the object closer to the hero.
        if (my !== my1 && (
            (objectHitbox.y > heroHitbox.y && my1 - my < 0) // if the top of the object is south of the top of the hero it can wiggle north
            || (objectHitbox.y + objectHitbox.h < heroHitbox.y + heroHitbox.h && my1 - my > 0) // if the bottom of the object is north of the bottom of the hero it can wiggle south
        )) {
            // Prevent wiggling, otherwise this can move the object away from the hero.
            moveLinkedObject(state, object, 0, my1 - my, {canWiggle: false});
        }
        return true;
    } else if (dy && mx1) {
        hero.y = hy;
        setObjectPosition(object, object.x, oy);
        // Try to match the wiggle of the hero only if it keeps the object closer to the hero.
        if (mx !== mx1 && (
            (objectHitbox.x > heroHitbox.x && mx1 - mx < 0) // if the left side of the object is right of the left of the hero it can wiggle left
            || (objectHitbox.x + objectHitbox.w < heroHitbox.x + heroHitbox.w && mx1 - mx > 0) // if the right side of the object is left of the right side of the hero it can wiggle right
        )) {
            // Prevent wiggling, otherwise this can move the object away from the hero.
            moveLinkedObject(state, object, mx1 - mx, 0, {canWiggle: false});
        }
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
    const {mx, my} = moveHero(state, hero, dx, dy, {excludedObjects: new Set([object])});
    if (!mx && !my) {
        // The object can move independently of the hero as long as it isn't moving further away from the bounds of the hero.
        const heroHitbox = hero.getHitbox(), objectHitbox = object.getHitbox();
        if (
            (dx < 0 && objectHitbox.x > heroHitbox.x)
            || (dx > 0 && objectHitbox.x + objectHitbox.w < heroHitbox.x + heroHitbox.w)
            || (dy < 0 && objectHitbox.y > heroHitbox.y)
            || (dy > 0 && objectHitbox.y + objectHitbox.h < heroHitbox.y + heroHitbox.h)
        ) {
            moveLinkedObject(state, object, dx, dy);
            return true;
        }
        return false
    }
    const ox = object.x, oy = object.y;
    const {mx: mx1, my: my1} = moveLinkedObject(state, object, mx, my);
    // The move is only valid if the hero can still be grabbing the object, and the object is not intersecting the hero.
    // Multiplying by dx/dy when comparing mx/my values allows wiggling the object to get through narrow openings by only requiring
    // matching movement in the direction the player is trying to move.
    const heroHitbox = hero.getHitbox(), objectHitbox = object.getHitbox();
    if (mx * dx === mx1 * dx && my * dy === my1 * dy
        && getActorTargets(state, hero).objects.includes(hero.grabObject)
        && !boxesIntersect(heroHitbox, objectHitbox)
    ) {
        return true;
    }
    if (dx && my1) {
        hero.x = hx;
        setObjectPosition(object, ox, object.y);
        // Try to match the wiggle of the object only if it keeps the hero closer to the object.
        if (my !== my1 && (
            (heroHitbox.y > objectHitbox.y && my1 - my < 0) // if the top of the hero is south of the top of the object it can wiggle north
            || (heroHitbox.y + heroHitbox.h < objectHitbox.y + objectHitbox.h && my1 - my > 0) // if the bottom of the hero is north of the bottom of the object it can wiggle south
        )) {
            // Prevent wiggling, otherwise this can move the hero away from the object.
            moveHero(state, hero, 0, my1 - my, {canWiggle: false});
        }
        return true;
    } else if (dy && mx1) {
        hero.y = hy;
        setObjectPosition(object, object.x, oy);
        // Try to match the wiggle of the object only if it keeps the hero closer to the object.
        if (mx !== mx1 && (
            (heroHitbox.x > objectHitbox.x && mx1 - mx < 0) // if the left side of the hero is right of the left of the object it can wiggle left
            || (heroHitbox.x + heroHitbox.w < objectHitbox.x + objectHitbox.w && mx1 - mx > 0) // if the right side of the hero is left of the right side of the object it can wiggle right
        )) {
            // Prevent wiggling, otherwise this can move the hero away from the object.
            moveHero(state, hero, mx1 - mx, 0, {canWiggle: false});
        }
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

function moveHero(this: void, state: GameState, hero: Hero, dx: number, dy: number, movementProperties: MovementProperties = {}) {
    return moveActor(state, hero, dx, dy, {
        canWiggle: true,
        boundingBox: getSectionBoundingBox(state, hero),
        ...movementProperties,
    });
}

export function moveLinkedObject(this: void, state: GameState, object: ObjectInstance, dx: number, dy: number, movementProperties: MovementProperties = {}) {
    const heroesAndClones = [
        state.hero,
        // This might be undefined.
        state.hero.astralProjection,
        ...(state.hero.clones || [])
    ];
    let blockedBoxes = heroesAndClones.filter(h => h && !movementProperties?.excludedObjects?.has(h) && h.area === object.area).map(h => h.getHitbox());
    movementProperties = {
        canFall: true,
        canSwim: true,
        canMoveInLava: true,
        canWiggle: true,
        boundingBox: getSectionBoundingBox(state, object),
        blockedBoxes,
        ...movementProperties,
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
        blockedBoxes = heroesAndClones.filter(h => h && !movementProperties?.excludedObjects?.has(h) && h.area === object.linkedObject.area).map(h => h.getHitbox());
        const linkedResult = moveObject(state, object.linkedObject, mx, my, {
            canFall: true,
            canSwim: true,
            canMoveInLava: true,
            // We rely on the base object wiggling for wiggling behavior.
            canWiggle: false,
            boundingBox: getSectionBoundingBox(state, object.linkedObject),
            blockedBoxes,
            ...movementProperties,
        });
        //console.log('linkedResult:', linkedResult);
        object.x = object.linkedObject.x;
        object.y = object.linkedObject.y;
        return linkedResult;
    }
    //console.log('move succeeded');
    return {mx, my};
}
