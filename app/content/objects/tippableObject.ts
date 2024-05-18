import { addParticleAnimations } from 'app/content/effects/animationEffect';
import { objectHash } from 'app/content/objects/objectHash';
import { PushPullObject } from 'app/content/objects/pushPullObject'
import { FRAME_LENGTH } from 'app/gameConstants';
import { createAnimation, drawFrame, getFrame } from 'app/utils/animations';
import { directionMap, isPointOpen } from 'app/utils/field';
import { addObjectToArea, removeObjectFromArea } from 'app/utils/objects';



//const crackedPotFrame: Frame = createAnimation('gfx/tiles/tippablepot.png', {w: 16, h: 18}).frames[0];
const particleFrames: Frame[] = createAnimation('gfx/tiles/tippablepot.png', {w: 16, h: 18}, {x: 6, cols: 5}).frames;
//const remainsFrame: Frame = createAnimation('gfx/tiles/tippablepot.png', {w: 16, h: 18}, {x: 3}).frames[0];
const fallingAnimation: FrameAnimation = createAnimation('gfx/tiles/tippablepot.png', {w: 16, h: 18},
    {cols: 6, duration: 4}, {loop: false}
);

const frozenPotFrame: Frame = createAnimation('gfx/objects/frozenPot.png', {w: 16, h: 18}).frames[0];

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
    animationTime = this.shattered ? fallingAnimation.duration : 0;
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
            return {hit: true};
        }
        if (!this.fallDirection) {
            if (hit.canPush) {
                this.fallInDirection(state, hit.direction);
            }
            return { hit: true };
        }
        return { hit: true, blocked: true };
    }
    freezePot(state: GameState, link = true): FrozenPotObject {
        // Pot can only be frozen before it is tipped over.
        if (this.shattered || this.fallDirection || this.fallingInPlace) {
            return;
        }
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
            this.fallingInPlace = true;
            this.animationTime = -80;
            if (this.linkedObject) {
                this.linkedObject.fallingInPlace = true;
                this.linkedObject.animationTime = -80;
            }
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
    fallInDirection(state: GameState, direction: Direction): void {
        if (this.shattered || this.fallDirection || this.fallingInPlace) {
            return;
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
        }
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
        if (this.animationTime >= (fallingAnimation.frames.length - 1) * FRAME_LENGTH * fallingAnimation.frameDuration) {
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
        const frame = getFrame(fallingAnimation, this.animationTime);
        drawFrame(context, frame, { ...frame, x: this.x, y: this.y - 2 - this.z });
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
        drawFrame(context, frozenPotFrame, { ...frozenPotFrame, x: this.x, y: this.y - 2 - this.z});
    }
}
