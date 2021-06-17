import { enterLocation } from 'app/content/areas';
import { getLoot } from 'app/content/lootObject';
import { createAnimation, drawFrame } from 'app/utils/animations';

import {
    AreaInstance, GameState, Direction, Hero, StaffTowerPointDefinition,
    ObjectInstance, ObjectStatus, ShortRectangle,
} from 'app/types';

const signGeometry = {w: 16, h: 19, content: {x: 0, y: 3, w: 16, h: 16}};
const [tallSign] = createAnimation('gfx/tiles/signtall.png', signGeometry).frames;


export class StaffTowerPoint implements ObjectInstance {
    area: AreaInstance;
    definition: StaffTowerPointDefinition;
    drawPriority: 'sprites' = 'sprites';
    behaviors = {
        solid: true,
    };
    x: number;
    y: number;
    status: ObjectStatus = 'normal';
    isNeutralTarget = true;
    constructor(state: GameState, definition: StaffTowerPointDefinition) {
        this.definition = definition;
        this.x = definition.x;
        this.y = definition.y;

        this.status = 'normal';
        if (state.hero.activeTools.staff < 2 &&
            (state.savedState.staffTowerLocation !== this.definition.location || !state.savedState.objectFlags.staffTowerActivated)
        ) {
            this.status = 'hidden';
        }
    }
    getHitbox(state: GameState): ShortRectangle {
        return { x: this.x, y: this.y, w: 16, h: 16 };
    }
    onGrab(state: GameState, direction: Direction, hero: Hero) {
        if (state.hero.activeTools.staff >= 2) {
            state.hero.activeTools.staff = 1;
            state.savedState.staffTowerLocation = this.definition.location;
            enterLocation(state, state.location);
        } else {
            getLoot(state, { type: 'dialogueLoot', lootType: 'staff', lootLevel: 2});
        }
    }
    render(context, state: GameState) {
        if (this.status !== 'normal') {
            return;
        }
        const frame = tallSign;
        drawFrame(context, frame, { ...frame, x: this.x - frame.content.x, y: this.y - frame.content.y });
    }
}
