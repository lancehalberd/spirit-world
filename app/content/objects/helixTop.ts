import {objectHash} from 'app/content/objects/objectHash';
import {BehaviorObject} from 'app/content/objects/behaviorObject';
import {editingState} from 'app/development/editingState';
import {drawFrameContentAt} from 'app/utils/animations';
import {createObjectInstance} from 'app/utils/createObjectInstance';

import {requireFrame} from 'app/utils/packedImages';

// The content height here is chosen so that the white cloud on the far right will
// appear in front/behind the player correctly as they appear to walk through it.
const helixTopFrame = requireFrame('gfx/objects/helixTop.png', {x: 0, y: 0, w: 140, h: 280, content: {x: 19, y: 172, w: 96, h: 42}});

// The player will snap to the grid when falling through the clouds, so these dimensions are chosen carefully
// to avoid having the player snap underneath the helix itself, which causes the player to appear to disappear.
const floorRect: Rect = {
    x: 32, y: 230, w: 75, h: 44
};
const wallRects: Rect[] = [
    {x: 20, y: 180, w: 94, h: 28}, // The back of the helix
    {x: 7, y: 208, w: 20, h: 14}, // Green vine on the left
    {x: 21, y: 224, w: 24, h: 18}, // White vine on the left
    {x: 79, y: 211, w: 20, h: 22}, // Orange vine on the right
    {x: 98, y: 219, w: 14, h: 25}, // Split white vine on the right
    {x: 109, y: 200, w: 13, h: 18}, // Far right white vine
];
export class HelixTop implements ObjectInstance {
    area: AreaInstance;
    drawPriority: DrawPriority = 'sprites';
    isObject = <const>true;
    ignorePits = true;
    x: number = this.definition.x;
    y: number = this.definition.y;
    status: ObjectStatus = 'normal';
    floor: BehaviorObject;
    walls: BehaviorObject[];
    door: ObjectInstance;
    constructor(state: GameState, public definition: EntranceDefinition) {
        this.door = createObjectInstance(state, {
            type: 'door',
            id: this.definition.id,
            status: this.definition.status,
            d: 'up',
            style: 'square',
            x: this.x + 47 - helixTopFrame.content.x,
            y: this.y + 198 - helixTopFrame.content.y,
            targetZone: this.definition.targetZone,
            targetObjectId: this.definition.targetObjectId,
        });
        this.floor = new BehaviorObject(this, {
                x: floorRect.x - helixTopFrame.content.x,
                y: floorRect.y - helixTopFrame.content.y,
                w: floorRect.w,
                h: floorRect.h,
            }, {isGround: true});
        this.walls = [];
        for (const r of wallRects) {
            this.walls.push(new BehaviorObject(this, {
                x: r.x - helixTopFrame.content.x,
                y: r.y - helixTopFrame.content.y,
                w: r.w,
                h: r.h,
            }, {solid: true}));
        }
    }
    getParts() {
        return [this.floor, this.door, ...this.walls];
    }

    getHitbox(): Rect {
        return {x: this.x, y: this.y, w: helixTopFrame.content.w, h: helixTopFrame.content.h};
    }
    getYDepth(): number {
        // Currently this is relative to the top of the image
        return this.y + helixTopFrame.content.h;
    }
    update(state: GameState) {
        this.door.area = this.area;
        this.door.update(state);
    }
    // This draws the top 200px of the top layer of the tower, which includes all of the
    // graphics that need to be drawn in front of objects that might pass behind it.
    render(context: CanvasRenderingContext2D, state: GameState) {
        context.save();
            drawFrameContentAt(context, helixTopFrame, this);
        context.restore();
        if (editingState.showWalls) {
            for (const wall of this.walls) {
                wall.render(context, state);
            }
        }
    }
}



objectHash.helixTop = HelixTop;
