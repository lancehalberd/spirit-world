import {editingState} from 'app/development/editingState';

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
        return {x: this.parent.x + this.r.x, y: this.parent.y + this.r.y, w: this.r.w, h: this.r.h}
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        if (editingState.showWalls && this.behaviors?.solid) {
            context.save();
                context.fillStyle = 'red';
                context.globalAlpha *= editingState.showWallsOpacity;
                const {x, y, w, h} = this.getHitbox();
                context.fillRect(x, y, w, h);
            context.restore();
        }
    }
}
