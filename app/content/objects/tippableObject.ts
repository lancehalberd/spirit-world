import { addParticleAnimations } from 'app/content/effects/animationEffect';
import { objectHash } from 'app/content/objects/objectHash';
import { PushPullObject } from 'app/content/objects/pushPullObject'
import { FRAME_LENGTH } from 'app/gameConstants';
import { playAreaSound } from 'app/musicController';
import { createAnimation, drawFrameAt, drawFrameReflectedAt, getFrame } from 'app/utils/animations';
import { directionMap, isPointOpen } from 'app/utils/field';
import { addObjectToArea, removeObjectFromArea } from 'app/utils/objects';


const particleFrames: Frame[] = createAnimation('gfx/tiles/tippablepot.png', {w: 16, h: 18}, {x: 6, cols: 5}).frames;
const geometry = {w: 32, h: 32, content: {x: 8, y: 16, w: 16, h: 16}};
const fallLeftSpiritAnimation = createAnimation('gfx/objects/Pots.png', geometry,{y: 0, left: 8, cols: 6, duration: 4}, {loop: false});
const fallUpSpiritAnimation = createAnimation('gfx/objects/Pots.png', geometry,{y: 1, left: 8, cols: 6, duration: 4}, {loop: false});
const fallDownSpiritAnimation = createAnimation('gfx/objects/Pots.png', geometry,{y: 2, left: 8, cols: 6, duration: 4}, {loop: false});
const fallLeftAnimation = createAnimation('gfx/objects/Pots.png', geometry,{y: 3, left: 8, cols: 6, duration: 4}, {loop: false});
const fallUpAnimation = createAnimation('gfx/objects/Pots.png', geometry,{y: 4, left: 8, cols: 6, duration: 4}, {loop: false});
const fallDownAnimation = createAnimation('gfx/objects/Pots.png', geometry,{y: 5, left: 8, cols: 6, duration: 4}, {loop: false});

const frozenPotFrame: Frame = createAnimation('gfx/objects/Pots.png', geometry, {y: 8, left: 8}).frames[0];

export class TippableObject implements ObjectInstance {
    area: AreaInstance;
    alwaysReset = true;
    behaviors = {
        destructible: true,
        solid: true,
        midHeight: true,
    };
    isNeutralTarget = true;
    isObject = <const>true;
    drawPriority: DrawPriority = 'sprites';
    x: number = this.definition.x;
    y: number = this.definition.y;
    z: number = 0;
    fallFrame = 0;
    fallingInPlace: boolean = false;
    fallDirection: Direction;
    grabDirection: Direction;
    linkedObject: TippableObject;
    pullingHeroDirection: Direction;
    pushCounter: number = 0;
    pushedLastFrame: boolean = false;
    status: ObjectStatus = 'normal';
    shattered = this.definition.shattered || false;
    animationTime = this.shattered ? fallDownAnimation.duration : 0;
    constructor(state: GameState, public definition: TippableObjectDefinition) {}
    getHitbox(state: GameState): Rect {
        return { x: this.x, y: this.y, w: 16, h: 16 };
    }
    onGrab(state: GameState, direction: Direction): void {
        this.grabDirection = direction;
    }
    onHit(state: GameState, hit: HitProperties): HitResult {
        if (hit.element === 'ice') {
            this.freezePot(state);
        } else if (!this.fallDirection && hit.canPush ) {
            if (!this.fallInDirection(state, hit.direction)) {
                this.fallInPlace(state);
                this.fallDirection = hit.direction
            }
        }
        return { hit: true, stopped: true };
    }
    freezePot(state: GameState, link = true): FrozenPotObject {
        // Pot can only be frozen before it is tipped over.
        if (this.shattered || this.fallDirection || this.fallingInPlace) {
            return;
        }
        playAreaSound(state, this.area, 'freeze');
        const frozenPot = new FrozenPotObject(
            state,
            {
                id: this.definition.id,
                type: 'pushPull',
                status: 'normal',
                x: this.x,
                y: this.y,
            }
        );
        addObjectToArea(state, this.area, frozenPot);
        removeObjectFromArea(state, this);
        if (link && this.linkedObject?.freezePot) {
            const linkedPot = this.linkedObject.freezePot(state, false);
            frozenPot.linkedObject = linkedPot;
            linkedPot.linkedObject = frozenPot;
        }
        return frozenPot
    }
    onPull(state: GameState, direction: Direction): void {
        if (this.shattered || this.fallDirection || this.fallingInPlace) {
            return;
        }
        if (this.grabDirection === direction) {
            this.fallInDirection(state, direction);
        } else {
            this.fallInPlace(state);
            this.fallDirection = direction;
        }
    }
    onPush(state: GameState, direction: Direction): void {
        if (this.shattered || this.fallDirection || this.fallingInPlace) {
            return;
        }
        this.pushCounter++;
        this.pushedLastFrame = true;
        if (this.pushCounter >= 20) {
            this.fallInDirection(state, direction);
        }
    }
    fallInPlace(state: GameState): void {
        if (this.shattered || this.fallDirection || this.fallingInPlace) {
            return;
        }
        this.fallingInPlace = true;
        this.animationTime = -80;
        if (this.linkedObject) {
            this.linkedObject.fallingInPlace = true;
            this.linkedObject.animationTime = -80;
        }
    }
    fallInDirection(state: GameState, direction: Direction): boolean {
        if (direction === "downleft") {
            return this.fallInDirection(state, 'down') || this.fallInDirection(state, 'left');
        }
        if (direction === "downright") {
            return this.fallInDirection(state, 'down') || this.fallInDirection(state, 'right');
        }
        if (direction === "upleft") {
            return this.fallInDirection(state, 'up') || this.fallInDirection(state, 'left');
        }
        if (direction === "upright") {
            return this.fallInDirection(state, 'up') || this.fallInDirection(state, 'right');
        }
        if (this.shattered || this.fallDirection || this.fallingInPlace) {
            return false;
        }
        const x = this.x + 8 + 16 * directionMap[direction][0];
        const y = this.y + 8 + 16 * directionMap[direction][1];
        const movementProps = { canFall: true };
        if (isPointOpen(state, this.area, {x, y}, movementProps)
            && (!this.linkedObject || isPointOpen(state, this.linkedObject.area, {x, y}, movementProps))
        ) {
            this.fallDirection = direction;
            this.animationTime = -80;
            this.pullingHeroDirection = direction;
            if (this.linkedObject) {
                this.linkedObject.fallDirection = direction;
                this.linkedObject.animationTime = -80;
                this.linkedObject.pullingHeroDirection = direction;
            }
            return true;
        }
        return false;
    }
    onDestroy(state: GameState, dx: number, dy: number) {
        addParticleAnimations(state, this.area, this.x + 8, this.y + 8, 2, particleFrames);
        removeObjectFromArea(state, this);
    }
    releaseBrokenPot(state: GameState) {
        for (const hero of [state.hero, state.hero.astralProjection, ...state.hero.clones]) {
            if (hero?.grabObject === this) {
                hero.grabObject = null;
                hero.action = null;
            }
        }
    }
    update(state: GameState) {
        if (this.shattered) {
            return;
        }
        if (this.fallingInPlace) {
            this.animationTime += FRAME_LENGTH;
            if (this.animationTime === 200) {
                this.releaseBrokenPot(state);
            }
        }
        if (this.fallDirection) {
            this.animationTime += FRAME_LENGTH;
            if (this.fallFrame < 16) {
                this.fallFrame++;
                this.x += directionMap[this.fallDirection][0];
                this.y += directionMap[this.fallDirection][1];
            }
        }
        if (this.animationTime >= (fallDownAnimation.frames.length - 1) * FRAME_LENGTH * fallDownAnimation.frameDuration) {
            this.shattered = true;
            this.pullingHeroDirection = null;
            this.releaseBrokenPot(state);
            // Not sure why I had this, with this, the pot is hidden behind floor switches sometimes.
            // this.drawPriority = 'background';
            addParticleAnimations(state, this.area, this.x + 8, this.y + 8, 2, particleFrames);
        }
        if (!this.pushedLastFrame) {
            this.pushCounter = 0;
        } else {
            this.pushedLastFrame = false;
        }
    }
    render(context, state: GameState) {
        if (this.fallDirection === 'right') {
            const frame = getFrame(this.definition.spirit ? fallLeftSpiritAnimation : fallLeftAnimation, this.animationTime);
            drawFrameReflectedAt(context, frame, {x: this.x, y: this.y - this.z });
        } else {
            let animation = this.definition.spirit ? fallUpSpiritAnimation : fallUpAnimation;
            if (this.fallDirection === 'left') {
                animation = this.definition.spirit ? fallLeftSpiritAnimation : fallLeftAnimation;
            } else if (this.fallDirection === 'down' || this.fallDirection === 'downleft' || this.fallDirection === 'downright') {
                animation = this.definition.spirit ? fallDownSpiritAnimation : fallDownAnimation;
            }
            const frame = getFrame(animation, this.animationTime);
            drawFrameAt(context, frame, {x: this.x, y: this.y - this.z });
        }
    }
}
objectHash.tippable = TippableObject;

class FrozenPotObject extends PushPullObject  {
    linkedObject: FrozenPotObject;
    onHit(state: GameState, hit: HitProperties): HitResult {
        if (hit.element === 'fire') {
            this.thawPot(state);
            return {hit: true};
        }
        return super.onHit(state, hit);
    }
    thawPot(state: GameState, link = true): TippableObject {
        const crackedPot = new TippableObject(
            state,
            {
                id: this.definition.id,
                type: 'tippable',
                status: 'normal',
                x: this.x,
                y: this.y,
            }
        );
        addObjectToArea(state, this.area, crackedPot);
        removeObjectFromArea(state, this);
        if (link && this.linkedObject?.thawPot) {
            const linkedPot = this.linkedObject.thawPot(state, false);
            crackedPot.linkedObject = linkedPot;
            linkedPot.linkedObject = crackedPot;
        }
        return crackedPot
    }
    render(context, state: GameState) {
        drawFrameAt(context, frozenPotFrame, {x: this.x, y: this.y - this.z});
    }
}
