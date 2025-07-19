import {objectHash} from 'app/content/objects/objectHash';
import {drawFrameContentAt} from 'app/utils/animations';

import {requireFrame} from 'app/utils/packedImages';

const helixTopFrame = requireFrame('gfx/objects/helixTop.png', {x: 0, y: 0, w: 140, h: 280});


export class HelixTop implements ObjectInstance {
    drawPriority: DrawPriority = 'sprites';
    isObject = <const>true;
    ignorePits = true;
    x: number = this.definition.x;
    y: number = this.definition.y;
    status: ObjectStatus = 'normal';
    constructor(state: GameState, public definition: EntranceDefinition) {}

    getYDepth(): number {
        // Currently this is relative to the top of the image
        return this.y + 225;
    }
    // This draws the top 200px of the top layer of the tower, which includes all of the
    // graphics that need to be drawn in front of objects that might pass behind it.
    render(context: CanvasRenderingContext2D, state: GameState) {
        context.save();
            drawFrameContentAt(context, helixTopFrame, this);
        context.restore();
    }
}


export class BehaviorObject implements ObjectInstance {
    get area(): AreaInstance {
        return this.parent.area;
    }
    drawPriority: DrawPriority = 'none';
    status: ObjectStatus;
    x = 0;
    y = 0;
    ignorePits = true;
    isObject = <const>true;
    renderParent = this.parent;
    constructor(public parent: ObjectInstance, public r: Rect, public behaviors: TileBehaviors) {}
    getHitbox(): Rect {
        return {x: this.parent.x + this.x, y: this.parent.y + this.y, w: this.r.w, h: this.r.h}
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
    }
}

objectHash.helixTop = HelixTop;
