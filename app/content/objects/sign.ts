import { showMessage } from 'app/render/renderMessage';
import { createAnimation, drawFrame } from 'app/utils/animations';

import {
    AreaInstance, GameState, Direction, Hero, SignDefinition,
    ObjectInstance, ObjectStatus, ShortRectangle,
} from 'app/types';

const signGeometry = {w: 16, h: 19, content: {x: 0, y: 3, w: 16, h: 16}};
const [shortSign] = createAnimation('gfx/tiles/signshort.png', signGeometry).frames;
const [shortSignSpirit] = createAnimation('gfx/tiles/shortsignspirit.png', signGeometry).frames;
const [tallSign] = createAnimation('gfx/tiles/signtall.png', signGeometry).frames;
const [tallSignSpirit] = createAnimation('gfx/tiles/signtallspirit.png', signGeometry).frames;

export const signStyles = {
    short: {
        normal: shortSign,
        spirit: shortSignSpirit,
    },
    tall: {
        normal: tallSign,
        spirit: tallSignSpirit,
    },
};

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
    onGrab(state: GameState, direction: Direction, hero: Hero) {
        if (direction !== 'up') {
            return;
        }
        showMessage(state, this.definition.message);
        // Remove the grab action since the hero is reading the sign, not grabbing it.
        hero.action = null;
    }
    update(state: GameState) {
        if (this.status === 'hiddenEnemy' || this.status === 'hiddenSwitch') {
            return;
        }
    }
    render(context, state: GameState) {
        const style = this.definition.style || 'short';
        const frame = this.definition.spirit ? signStyles[style].spirit : signStyles[style].normal;
        drawFrame(context, frame, { ...frame, x: this.x - frame.content.x, y: this.y - frame.content.y });
    }
}
