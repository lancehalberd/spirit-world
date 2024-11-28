import { objectHash } from 'app/content/objects/objectHash';
import { FRAME_LENGTH } from 'app/gameConstants';
import { moveObject } from 'app/movement/moveObject';
import { createAnimation, drawFrameCenteredAt, drawFrameAt, getFrame } from 'app/utils/animations';
import { directionMap, getDirection, rotateDirection } from 'app/utils/direction';
import { hitTargets } from 'app/utils/field';


// The key block sticks up until it reaches frame 9.
const spikeBallAnimation = createAnimation('gfx/objects/iceSpikeBall.png', {w: 16, h: 16});
const smallShadowFrame: Frame = createAnimation('gfx/smallshadow.png', { w: 16, h: 16 }).frames[0];

export class SpikeBall implements ObjectInstance {
    // Normal hit detection won't take into account z-position still so we have to do a custom check for this.
    /*behaviors: TileBehaviors = {
        solid: true,
        touchHit: {
            damage: 2,
            knockAwayFromHit: true,
            element: 'ice',
        }
    };*/
    area: AreaInstance;
    definition: SpikeBallDefinition;
    isObject = <const>true;
    vx: number = 0;
    vy: number = 0;
    x: number;
    y: number;
    z: number = 24;
    status: ObjectStatus = 'normal';
    isNeutralTarget = true;
    animationTime = 0;
    constructor(state: GameState, definition: SpikeBallDefinition) {
        this.definition = definition;
        this.x = definition.x;
        this.y = definition.y;
        if (this.definition.d) {
            [this.vx, this.vy] = directionMap[this.definition.d];
            this.vx *= this.definition.speed;
            this.vy *= this.definition.speed;
        }
    }
    getHitbox(): Rect {
        return { x: this.x, y: this.y, w: 16, h: 16 };
    }
    move(state: GameState) {
        // Mark canFall so it will pass over pits. Since it has a high z value it won't actually fall.
        const {mx, my} = moveObject(state, this, this.vx, this.vy, {canFall: true});
        // When the ball hits a wall, change direction based on the defined turn logic.
        if (!mx && !my) {
            let d = getDirection(this.vx, this.vy);
            if (this.definition.turn === 'left') d = rotateDirection(d, 1);
            else if (this.definition.turn === 'right') d = rotateDirection(d, 3);
            else d = rotateDirection(d, 2);
            [this.vx, this.vy] = directionMap[d];
            this.vx *= this.definition.speed;
            this.vy *= this.definition.speed;
        }
    }
    update(state: GameState) {
        if (this.vx || this.vy) {
            this.move(state);
        }
        this.animationTime += FRAME_LENGTH;
        this.z = 24 + 2 * Math.sin(this.animationTime / 500);
        hitTargets(state, this.area, {
            damage: 2,
            canAlwaysKnockback: true,
            knockAwayFromHit: true,
            hitbox: this.getHitbox(),
            hitAllies: true,
            element: 'ice',
            zRange: [this.z, this.z + 16],
            source: null,
        });
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        let frame: Frame = getFrame(spikeBallAnimation, this.animationTime);
        drawFrameAt(context, frame, { x: this.x, y: this.y - this.z });
    }
    renderPreview(context: CanvasRenderingContext2D, target: Rect) {
        let frame: Frame = getFrame(spikeBallAnimation, this.animationTime);
        drawFrameCenteredAt(context, frame, target);
    }
    renderShadow(context: CanvasRenderingContext2D, state: GameState) {
        if (this.status === 'hidden' || this.status === 'hiddenEnemy'
            || this.status === 'hiddenSwitch' || this.status === 'gone'
        ) {
            return;
        }
        drawFrameAt(context, smallShadowFrame, {x: this.x, y: this.y});
    }
}
objectHash.spikeBall = SpikeBall;
