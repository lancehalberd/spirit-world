import { createAnimation, drawFrame } from 'app/utils/animations';

import {
    AreaInstance, GameState, Direction, SignDefinition,
    ObjectInstance, ObjectStatus, ShortRectangle,
} from 'app/types';

const messageBreak = '{|}';

const [chestClosedFrame] = createAnimation('gfx/tiles/chest.png',
    {w: 18, h: 20, content: {x: 1, y: 4, w: 16, h: 16}}, {cols: 2}
).frames;

export class Sign implements ObjectInstance {
    area: AreaInstance;
    definition: SignDefinition;
    drawPriority: 'sprites' = 'sprites';
    behaviors = {
        solid: true,
    };
    linkedObject: Sign;
    x: number;
    y: number;
    status: ObjectStatus = 'normal';
    constructor(definition: SignDefinition) {
        this.definition = definition;
        this.x = definition.x;
        this.y = definition.y;
    }
    getHitbox(state: GameState): ShortRectangle {
        return { x: this.x, y: this.y, w: 16, h: 16 };
    }
    onGrab(state: GameState, direction: Direction) {
        if (direction !== 'up') {
            return;
        }
        state.messageState = {
            pageIndex: 0,
            pages: this.definition.message.split(messageBreak),
        };
    }
    update(state: GameState) {
        if (this.status === 'hiddenEnemy' || this.status === 'hiddenSwitch') {
            return;
        }
    }
    render(context, state: GameState) {
        drawFrame(context, chestClosedFrame, {
            ...chestClosedFrame, x: this.x - chestClosedFrame.content.x, y: this.y - chestClosedFrame.content.y
        });
    }
}
