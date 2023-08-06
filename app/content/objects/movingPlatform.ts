import { objectHash } from 'app/content/objects/objectHash';
import { FRAME_LENGTH } from 'app/gameConstants';
import { moveActor } from 'app/moveActor';
import { moveObject } from 'app/movement/moveObject';
import { createAnimation, drawFrameAt, getFrame } from 'app/utils/animations';
import { directionMap, getDirection, rotateDirection } from 'app/utils/direction';
import { boxesIntersect } from 'app/utils/index';


// This is a 9 slice that is 6/20/6 in both directions.
const platformAnimation = createAnimation('gfx/objects/platform.png', {w: 32, h: 32});

export class MovingPlatform implements ObjectInstance {
    area: AreaInstance;
    behaviors: TileBehaviors = {
        groundHeight: 1,
    };
    definition: MovingPlatformDefinition;
    drawPriority: DrawPriority = 'background';
    isObject = <const>true;
    vx: number = 0;
    vy: number = 0;
    x: number;
    y: number;
    w: number;
    h: number;
    status: ObjectStatus = 'normal';
    isNeutralTarget = true;
    animationTime = 0;
    ignorePits = true;
    constructor(state: GameState, definition: MovingPlatformDefinition) {
        this.definition = definition;
        this.x = definition.x;
        this.y = definition.y;
        this.w = definition.w;
        this.h = definition.h;
        [this.vx, this.vy] = directionMap[this.definition.d];
        this.vx *= this.definition.speed;
        this.vy *= this.definition.speed;
    }
    getHitbox(): Rect {
        return { x: this.x, y: this.y, w: this.w, h: this.h };
    }
    move(state: GameState) {
        // Mark canFall so it will pass over pits.
        const {mx, my} = moveObject(state, this, this.vx, this.vy, {canFall: true, canWiggle: false, maxHeight: 0});
        // When this hits a wall, change direction based on the object definition settings.
        if (!mx && !my) {
            let d = getDirection(this.vx, this.vy);
            if (this.definition.turn === 'left') d = rotateDirection(d, 1);
            else if (this.definition.turn === 'right') d = rotateDirection(d, 3);
            else d = rotateDirection(d, 2);
            [this.vx, this.vy] = directionMap[d];
            this.vx *= this.definition.speed;
            this.vy *= this.definition.speed;
        }
        return {mx, my};
    }
    update(state: GameState) {
        this.animationTime += FRAME_LENGTH;
        if (!this.vx && !this.vy) {
            return;
        }
        const {mx, my} = this.move(state);
        if (!mx && !my) {
            return;
        }
        for (const hero of [state.hero, ...state.hero.clones]) {
            if (hero.area !== this.area || hero.isInvisible || this.status !== 'normal') {
                continue;
            }
            const heroHitbox = hero.getHitbox(state);
            const isHeroOnPlatform = boxesIntersect(heroHitbox, this.getHitbox())
                && hero.action !== 'roll' && hero.action !== 'preparingSomersault' && hero.z <= this.behaviors.groundHeight
                && hero.action !== 'falling' && hero.action !== 'fallen';
            if (isHeroOnPlatform) {
                moveActor(state, hero, mx, my, {
                    canFall: true,
                    canJump: true,
                    canSwim: true,
                });
            }
        }
    }
    render(context, state: GameState) {
        const frame: Frame = getFrame(platformAnimation, this.animationTime);
        const w = this.w - 12, h = this.h - 12;
        // Top
        let y = this.y;
        drawFrameAt(context, {...frame, x: frame.x, y: frame.y, w: 6, h: 6}, { x: this.x, y });
        for (let x = this.x + 6; x < this.x + 6 + w; x += 20) {
            const sw = Math.min(20, this.x + 6 + w - x);
            drawFrameAt(context, {...frame, x: frame.x + 6, y: frame.y, w: sw, h: 6}, { x, y });
        }
        drawFrameAt(context, {...frame, x: frame.x + 26, y: frame.y, w: 6, h: 6}, { x: this.x + this.w - 6, y });
        // Middle
        for (y = this.y + 6; y < this.y + 6 + h; y += 20) {
            const sh = Math.min(20, this.y + 6 + h - y);
            drawFrameAt(context, {...frame, x: frame.x, y: frame.y + 6, w: 6, h: sh}, { x: this.x, y });
            for (let x = this.x + 6; x < this.x + w; x += 20) {
                const sw = Math.min(20, this.x + 6 + w - x);
                drawFrameAt(context, {...frame, x: frame.x + 6, y: frame.y + 6, w: sw, h: sh}, { x, y });
            }
            drawFrameAt(context, {...frame, x: frame.x + 26, y: frame.y + 6, w: 6, h: sh}, { x: this.x + this.w - 6, y });
        }
        // Bottom
        y = this.y + this.h - 6
        drawFrameAt(context, {...frame, x: frame.x, y: frame.y + 26, w: 6, h: 6}, { x: this.x, y });
        for (let x = this.x + 6; x < this.x + 6 + w; x += 20) {
            const sw = Math.min(20, this.x + 6 + w - x);
            drawFrameAt(context, {...frame, x: frame.x + 6, y: frame.y + 26, w: sw, h: 6}, { x, y });
        }
        drawFrameAt(context, {...frame, x: frame.x + 26, y: frame.y + 26, w: 6, h: 6}, { x: this.x + this.w - 6, y });
    }
}
objectHash.movingPlatform = MovingPlatform;
