import { objectHash } from 'app/content/objects/objectHash';
import { showMessage } from 'app/scriptEvents';
import { createAnimation, drawFrame } from 'app/utils/animations';
import { directionMap } from 'app/utils/field';
import { getObjectStatus, saveObjectStatus } from 'app/utils/objects';


const pushStairsFrame: Frame = createAnimation('gfx/objects/pushStairs.png', {w: 36, h: 80}).frames[0];


const pushBarWidth = 2;

export class PushStairs implements ObjectInstance {
    area: AreaInstance;
    alwaysReset = false;
    behaviors: TileBehaviors = {
        isGround: true,
        // Currently isGround does not block falling in pits by itself, we must also set
        // groundHeight > 0 to prevent falling into pits behind the stairs.
        groundHeight: 1,
    };
    isNeutralTarget = true;
    ignorePits = true;
    drawPriority: DrawPriority = 'background';
    isObject = <const>true;
    linkedObject: PushStairs;
    pushFrame = 0;
    pushDirection: Direction;
    pushFast: boolean;
    pushCounter: number = 0;
    pushedLastFrame: boolean = false;
    status: ObjectStatus = 'normal';
    x: number = this.definition.x + this.definition.offset;
    y: number = this.definition.y;
    offset: number = this.definition.offset;
    leftRailing: PushStairsRailing = new PushStairsRailing(this, 'left');
    rightRailing: PushStairsRailing = new PushStairsRailing(this, 'right');
    constructor(state: GameState, public definition: PushStairsDefinition) {
        const savedX = getObjectStatus(state, this.definition);
        if (typeof savedX === 'number') {
            this.x = savedX;
        }
    }
    getHitbox(): Rect {
        // This is exactly tall enough that two stairs stacked vertically can ignore
        // any tiles between them.
        return { x: this.x, y: this.y - 46, w: 32, h: 80 };
    }
    getParts(state: GameState): ObjectInstance[] {
        return [this.leftRailing, this.rightRailing];
    }
    onPush(state: GameState, direction: Direction): void {
        if (direction !== 'left' && direction !== 'right') {
            return;
        }
        if (!this.pushDirection) {
            this.pushCounter++;
            this.pushedLastFrame = true;
            if (this.pushCounter > 20) {
                this.pushInDirection(state, direction);
            }
        }
    }
    onPull(state: GameState, direction: Direction, hero: Hero): void {
        if (direction !== 'left' && direction !== 'right') {
            return;
        }
        this.pushInDirection(state, direction, hero);
    }
    pushInDirection(state: GameState, direction: 'left' | 'right', hero: Hero = null): void {
        if (state.hero.savedData.passiveTools.gloves < 2) {
            showMessage(state, 'It feels like you could move this if you were a little stronger.');
            return;
        }
        this.moveInDirection(state, direction);
    }
    moveInDirection(state: GameState, direction: 'left' | 'right', fast = false): void {
        if (this.pushDirection) {
            return;
        }
        if (direction === 'left' && this.x < this.definition.x + 16) {
            return;
        }
        if (direction === 'right' && this.x > this.definition.x + this.definition.w - 48) {
            return;
        }
        // For now just always allow moving push stairs and rely on putting them in places where this doesn't cause problems.
        //const x = this.x + 16 * directionMap[direction][0];
        //const y = this.y + 16 * directionMap[direction][1];
        //const excludedObjects = new Set([this, this.linkedObject]);
        //const movementProperties = {canFall: true, canSwim: true, canCrossLedges: true, excludedObjects};
        //if (true || isTileOpen(state, this.area, {x, y}, movementProperties)
        //    && (!this.linkedObject || isTileOpen(state, this.linkedObject.area, {x, y}, movementProperties))
        //) {
            this.pushDirection = direction;
            this.pushFast = fast;
            this.leftRailing.pullingHeroDirection = direction;
            this.rightRailing.pullingHeroDirection = direction;
            this.pushFrame = 0;
        //}
    }
    stopMoving() {
        this.leftRailing.pullingHeroDirection = null;
        this.rightRailing.pullingHeroDirection = null;
        this.pushDirection = null;
        this.pushFrame = 0;
    }
    update(state: GameState) {
        if (this.pushDirection) {
            if (this.pushFast) {
                this.x += 4 * directionMap[this.pushDirection][0];
                this.y += 4 * directionMap[this.pushDirection][1];
                if (this.pushDirection === 'left' && this.x <= this.definition.x) {
                    this.x = this.definition.x;
                    state.screenShakes.push({
                        dx: 2, dy: 0, startTime: state.fieldTime, endTime: state.fieldTime + 400
                    });
                    this.stopMoving();
                }
                if (this.pushDirection === 'right' && this.x >= this.definition.x + this.definition.w - 32) {
                    this.x = this.definition.x + this.definition.w - 32;
                    state.screenShakes.push({
                        dx: 2, dy: 0, startTime: state.fieldTime, endTime: state.fieldTime + 400
                    });
                    this.stopMoving();
                }
                if (this.linkedObject) {
                    this.linkedObject.x = this.x;
                    this.linkedObject.y = this.y;
                }
                saveObjectStatus(state, this.definition, this.x);
            } else if (this.pushFrame < 16) {
                this.pushFrame++;
                this.x += directionMap[this.pushDirection][0];
                this.y += directionMap[this.pushDirection][1];
                if (this.linkedObject) {
                    this.linkedObject.x = this.x;
                    this.linkedObject.y = this.y;
                }
                saveObjectStatus(state, this.definition, this.x);
            } else {
                this.stopMoving();
            }
        } else if (!this.pushedLastFrame) {
            this.pushCounter = 0;
        } else {
            this.pushedLastFrame = false;
        }
    }
    render(context, state: GameState) {
        // Draw the rails underneath the stairs. Note this uses the definition x value which is static.
        context.fillStyle = 'grey';
        context.fillRect(this.definition.x, this.y + 8, this.definition.w, 3);
        context.fillRect(this.definition.x, this.y + 21, this.definition.w, 3);
        context.fillStyle = 'white';
        context.fillRect(this.definition.x, this.y + 8, this.definition.w, 1);
        context.fillRect(this.definition.x, this.y + 21, this.definition.w, 1);
        // Draw the stairs themselves
        drawFrame(context, pushStairsFrame, { ...pushStairsFrame, x: this.x - pushBarWidth, y: this.y - 48});
        //const r = this.getHitbox();
        //context.fillStyle = 'green';
        //context.fillRect(r.x, r.y, r.w, r.h);
    }
}
// The railings are separated so that they can be solid and render with 'sprites' priority.
class PushStairsRailing implements ObjectInstance {
    behaviors: TileBehaviors = {
        solid: true,
        midHeight: true,
    };
    drawPriority: DrawPriority = 'sprites';
    status: ObjectStatus;
    x: number;
    y: number;
    isObject = <const>true;
    isNeutralTarget = true;
    xOffset = (this.side === 'left') ? 3 : 26;
    pullingHeroDirection: Direction;
    constructor(public pushStairs: PushStairs, public side: 'left' | 'right') {}
    getHitbox(): Rect {
        return { x: this.pushStairs.x + this.xOffset - pushBarWidth, y: this.pushStairs.y - 48 + 9, w: 7, h: 70 };
    }
    get area(): AreaInstance {
        return this.pushStairs.area;
    }
    render(context, state: GameState) {
        drawFrame(context, {...pushStairsFrame, x: pushStairsFrame.x + this.xOffset, w: 7},
            { ...pushStairsFrame, x: this.pushStairs.x + this.xOffset - pushBarWidth, w: 7, y: this.pushStairs.y - 48}
        );
        //const r = this.getHitbox();
        //context.fillStyle = 'red';
        //context.fillRect(r.x, r.y, r.w, r.h);
    }
    onHit(state: GameState, hit: HitProperties): HitResult {
        if (hit.isBonk && hit.crushingPower >= 2) {
            if (hit.direction === (this.side === 'left' ? 'right' : 'left')) {
                this.pushStairs.moveInDirection(state, hit.direction, true);
            }
        }
        return {stopped: true};
    }
    onPush(state: GameState, direction: Direction, actor: Actor): void {
        // The left side can only be pushed right and vice-versa.
        if (direction !== (this.side === 'left' ? 'right' : 'left')) {
            return;
        }
        const hitbox = actor.getHitbox();
        // Only allow pushing using the bar at the bottom of the stairs.
        // Pushing too high can let the player get stuck in walls.
        if (hitbox.y < this.pushStairs.y) {
            return;
        }
        this.pushStairs.onPush(state, direction);
    }
    onPull(state: GameState, direction: Direction, hero: Hero): void {
        const hitbox = hero.getHitbox();
        // Only allow pushing using the bar at the bottom of the stairs.
        // Pushing too high can let the player get stuck in walls.
        if (hitbox.y < this.pushStairs.y) {
            return;
        }
        const oppositeDirection = (this.side === 'left' ? 'right' : 'left');
        // Can only pull from the outside (when not standing on the stairs).
        if (hero.d === oppositeDirection) {
            this.pushStairs.onPull(state, direction, hero);
        }
    }
}
objectHash.pushStairs = PushStairs;
