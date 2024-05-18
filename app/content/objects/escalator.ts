import { objectHash } from 'app/content/objects/objectHash';
import { editingState } from 'app/development/editingState';
import { FRAME_LENGTH } from 'app/gameConstants';
import { moveActor } from 'app/movement/moveActor';
import { drawFrame, drawFrameAt } from 'app/utils/animations';
import { directionMap } from 'app/utils/field';
import { createCanvasAndContext, debugCanvas } from 'app/utils/canvas';
import { isObjectInsideTarget, pad } from 'app/utils/index';
import { createAnimation } from 'app/utils/animations';
import { requireFrame } from 'app/utils/packedImages';


// Example of how to asyncronously create a canvas from a loaded image.
/*const createHorizontalBelt = async () => {
    await allImagesLoaded();
    horizontalBeltContext.save();
        horizontalBeltContext.translate(8, 8);
        horizontalBeltContext.rotate(Math.PI / 2);
        horizontalBeltContext.translate(-8, -8);
        drawFrameAt(horizontalBeltContext, verticalBelt, {x: 0, y: 0, w: 48, h: 48});
    horizontalBeltContext.restore();

    drawFrameAt(verticalBeltContext, verticalBelt, {x: 0, y: 0, w: 48, h: 48});
    verticalBelt.x = 0;
    verticalBelt.y = 0;
    verticalBelt.image = verticalBeltCanvas;

    drawFrameAt(escalatorContext, woodenStairs, {x: 0, y: 0, w: 48, h: 48});
    woodenStairs.x = 0;
    woodenStairs.y = 0;
    woodenStairs.image = escalatorCanvas;
}
createHorizontalBelt();*/
debugCanvas;//(beltCanvas);
// 48, 336, down left up right

const [beltDown, beltLeft, beltUp, beltRight] = createAnimation('gfx/tiles/futuristic.png', {w: 16, h: 16}, {left: 48, top: 560, rows: 4}).frames;

const [escalatorFrame] = createAnimation('gfx/tiles/futuristic.png', {w: 16, h: 16}, {left: 16, top: 656, rows: 4}).frames;
// 203,646 26x75 9px bottom, 4px top, 5px wide
const leftRailTop: Frame = requireFrame('gfx/tiles/futuristic.png', {x: 203, y: 642, w: 5, h: 4});
const leftRailMiddle: Frame = requireFrame('gfx/tiles/futuristic.png', {x: 203, y: 650, w: 5, h: 10});
const leftRailBottom: Frame = requireFrame('gfx/tiles/futuristic.png', {x: 203, y: 708, w: 5, h: 9});
const rightRailTop: Frame = requireFrame('gfx/tiles/futuristic.png', {x: 224, y: 642, w: 5, h: 4});
const rightRailMiddle: Frame = requireFrame('gfx/tiles/futuristic.png', {x: 224, y: 650, w: 5, h: 10});
const rightRailBottom: Frame = requireFrame('gfx/tiles/futuristic.png', {x: 224, y: 708, w: 5, h: 9});


interface RailingFrames {
    top: Frame
    middle: Frame
    bottom: Frame
}
interface EscalatorStyle {
    belts: {[key in Direction]?: FrameWithPattern}
    // These are not used for the conveyer belt styles.
    // They are also only supported for the up/down directions.
    leftRailing?: RailingFrames
    rightRailing?: RailingFrames
}

export const escalatorStyles: {[key: string]: EscalatorStyle} = {
    escalator: {
        belts: {
            up: escalatorFrame,
            down: escalatorFrame,
        },
        leftRailing: {top: leftRailTop, middle: leftRailMiddle, bottom: leftRailBottom},
        rightRailing: {top: rightRailTop, middle: rightRailMiddle, bottom: rightRailBottom},
    },
    belt: {
        belts: {
            up: beltUp,
            down: beltDown,
            left: beltLeft,
            right: beltRight,
        }
    },
};

export class Escalator implements ObjectInstance {
    area: AreaInstance;
    animationTime: number = 0;
    behaviors: TileBehaviors = {
        isGround: true,
        // Currently isGround does not block falling in pits by itself, we must also set
        // groundHeight > 0 to prevent falling into pits under the conveyer belt.
        groundHeight: 1,
    };
    offsetX: number = 0;
    offsetY: number = 0;
    definition: EscalatorDefinition;
    drawPriority: DrawPriority = 'background';
    isObject = <const>true;
    isNeutralTarget = true;
    x: number;
    y: number;
    pattern: CanvasPattern;
    // 'normal' is running 'off' is stopped.
    speed: EscalatorDefinition['speed']
    status: ObjectStatus = 'normal';
    leftRailing?: EscalatorRailing
    rightRailing?: EscalatorRailing
    constructor(state: GameState, definition: EscalatorDefinition) {
        this.definition = definition;
        this.status = definition.status;
        this.x = this.definition.x;
        this.y = this.definition.y;
        this.speed = this.definition.speed;
        const style = escalatorStyles[this.definition.style] || escalatorStyles.belt;
        if (style.leftRailing && style.rightRailing) {
            this.leftRailing = new EscalatorRailing(this, 'left');
            this.rightRailing = new EscalatorRailing(this, 'right');
        }
    }
    getParts() {
        const parts: ObjectInstance[] = [];
        if (this.leftRailing) {
            parts.push(this.leftRailing);
        }
        if (this.rightRailing) {
            parts.push(this.rightRailing);
        }
        return parts;
    }
    onActivate(state: GameState) {
        this.status = 'normal';
    }
    onDeactivate(state: GameState) {
        this.status = 'off';
    }
    onHit(state: GameState, hit: HitProperties): HitResult {
        if (this.status === 'frozen' && hit.element === 'fire') {
            this.status = 'normal';
            this.behaviors.slippery = false;
        } else if (hit.element === 'ice') {
            this.status = 'frozen';
            this.behaviors.slippery = true;
        }
        return {};
    }
    getHitbox(state: GameState) {
        return this.definition;
    }
    getHitboxForMovingObjects(state: GameState) {
        const hitbox = pad(this.definition, 8);
        const padding = 4;//6;
        if (this.definition.d === 'down' || this.definition.d === 'up') {
            hitbox.y -= padding;
            hitbox.h += 2 * padding;
        } else {
            hitbox.x -= padding;
            hitbox.w += 2 * padding;
        }
        return hitbox;
    }
    update(state: GameState) {
        this.animationTime += FRAME_LENGTH;
        const dx = directionMap[this.definition.d][0];
        const dy = directionMap[this.definition.d][1];
        let speed = (this.speed === 'slow') ? 1 : 3;
        if (this.status === 'normal') {
            this.offsetX += dx * speed;
            this.offsetY += dy * speed;
        }
        // If touching center of player, pull player in and push them south.

        for (const hero of [state.hero, ...state.hero.clones]) {
            if (hero.area !== this.area || hero.isInvisible || this.status !== 'normal') {
                continue;
            }
            const heroHitbox = hero.getHitbox();
            const touchingHero = isObjectInsideTarget(heroHitbox, this.getHitboxForMovingObjects(state))
                && hero.action !== 'roll' && hero.action !== 'jumpingDown' && hero.action !== 'preparingSomersault' && hero.z <= this.behaviors.groundHeight;
            if (this.speed === 'slow' && touchingHero) {
                moveActor(state, hero, speed * dx, speed * dy, {
                    canFall: true,
                    canJump: true,
                    canSwim: true,
                });
            } else if (this.speed === 'fast') {
                if (hero.actionTarget === this && !touchingHero) {
                    hero.actionTarget = null;
                    hero.actionDx = 0;
                    hero.actionDy = 0;
                    // Make the hero lose control briefly on exiting fast escalators.
                    hero.vx = dx;
                    hero.vy = dy;
                    hero.vz = 2;
                    // Use 'knockedHard' to allow transitioning to the next screen when necessary.
                    hero.action = 'knockedHard';
                    hero.isControlledByObject = false;
                    hero.safeD = hero.d;
                    hero.safeX = hero.x;
                    hero.safeY = hero.y;
                } else if (!hero.actionTarget && touchingHero) {
                    hero.actionTarget = this;
                    hero.action = null;
                    hero.actionDx = 0;
                    hero.actionDy = 0;
                }
                if (hero.actionTarget === this) {
                    hero.isControlledByObject = true;
                    speed = state.nextAreaInstance ? 0.75 : speed;
                    hero.actionDx = speed * dx;
                    hero.actionDy = speed * dy;
                    hero.x += hero.actionDx;
                    hero.y += hero.actionDy;
                }
            }
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        const style = escalatorStyles[this.definition.style] || escalatorStyles.belt;
        const frame = style.belts[this.definition.d];
        if (!frame) {
            debugger;
        }
        if (!frame.pattern ) {
            const [patternCanvas, patternContext] = createCanvasAndContext(frame.w, frame.h);
            drawFrameAt(patternContext, frame, {x: 0, y: 0});
            frame.pattern = context.createPattern(patternCanvas, 'repeat');
        }
        context.save();
            context.translate(this.offsetX, this.offsetY);
            context.fillStyle = frame.pattern;
            context.fillRect(this.x - this.offsetX, this.y - this.offsetY, this.definition.w, this.definition.h);
        context.restore();
        if (this.status === 'frozen') {
            context.save();
                context.globalAlpha *= 0.5;
                context.fillStyle = 'white';
                context.fillRect(this.x, this.y, this.definition.w, this.definition.h);
            context.restore();
        }
    }
}
// The railings are separated so that they can be solid and render with 'sprites' priority.
class EscalatorRailing implements ObjectInstance {
    behaviors: TileBehaviors = {
        solid: true,
        midHeight: true,
    };
    drawPriority: DrawPriority = 'background';
    status: ObjectStatus;
    x: number;
    y: number;
    isObject = <const>true;
    pullingHeroDirection: Direction;
    frames: RailingFrames;
    constructor(public escalator: Escalator, public side: 'left' | 'right') {
        const style = escalatorStyles[this.escalator.definition.style] || escalatorStyles.belt;
        this.frames = this.side === 'left' ? style.leftRailing : style.rightRailing;
    }
    getHitbox(): Rect {
        const w = this.frames.top.w;
        const overhang = 8;
        if (this.side === 'left') {
            return { x: this.escalator.x - w, y: this.escalator.y - overhang, w, h: this.escalator.definition.h + 2 * overhang };
        }
        return { x: this.escalator.x + this.escalator.definition.w, y: this.escalator.y - overhang, w, h: this.escalator.definition.h + 2 * overhang };
    }
    get area(): AreaInstance {
        return this.escalator.area;
    }
    render(context, state: GameState) {
        const hitbox = this.getHitbox();
        const shadowH = 2;
        let x = hitbox.x;
        drawFrame(context, this.frames.top,
            { ...this.frames.top, x, y: hitbox.y}
        );
        const h = hitbox.h + shadowH - this.frames.top.h - this.frames.bottom.h;
        if (h > 0) {
            drawFrame(context, this.frames.middle, { ...this.frames.middle, x, y: hitbox.y + this.frames.top.h, h});
        }
        drawFrame(context, this.frames.bottom,
            { ...this.frames.bottom, x, y: hitbox.y + hitbox.h - this.frames.bottom.h + shadowH}
        );
        if (editingState.showWalls) {
            context.save();
                context.globalAlpha *= 0.5;
                const r = this.getHitbox();
                context.fillStyle = 'red';
                context.fillRect(r.x, r.y, r.w, r.h);
            context.restore();
        }
    }
}

objectHash.escalator = Escalator;

class _Escalator extends Escalator {}
declare global {
    export interface Escalator extends _Escalator {}
}
