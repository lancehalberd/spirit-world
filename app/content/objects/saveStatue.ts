import { selectDialogueOption } from 'app/content/dialogue';
import { addSparkleAnimation } from 'app/content/effects/animationEffect';
import { getObjectStatus, saveObjectStatus } from 'app/content/objects';
import { setSpawnLocation } from 'app/content/spawnLocations';
import { showMessage } from 'app/render/renderMessage';
import { createAnimation, drawFrame } from 'app/utils/animations';

import {
    AreaInstance, GameState, Direction, Hero, SimpleObjectDefinition,
    ObjectInstance, ObjectStatus, Rect,
} from 'app/types';

const signGeometry = {w: 16, h: 19, content: {x: 0, y: 3, w: 16, h: 16}};
const [tallSign] = createAnimation('gfx/tiles/signtall.png', signGeometry).frames;
const [tallSignSpirit] = createAnimation('gfx/tiles/signtallspirit.png', signGeometry).frames;


export class SaveStatue implements ObjectInstance {
    area: AreaInstance;
    definition: SimpleObjectDefinition;
    drawPriority: 'sprites' = 'sprites';
    behaviors = {
        solid: true,
    };
    isObject = <const>true;
    linkedObject: SaveStatue;
    x: number;
    y: number;
    status: ObjectStatus = 'normal';
    isNeutralTarget = true;
    constructor(definition: SimpleObjectDefinition) {
        this.definition = definition;
        this.x = definition.x;
        this.y = definition.y;
    }
    getHitbox(state: GameState): Rect {
        return { x: this.x, y: this.y, w:32, h: 16 };
    }
    onGrab(state: GameState, direction: Direction, hero: Hero) {
        // Don't take actions that would start new scripts while running scripts.
        if (state.scriptEvents.activeEvents.length || state.scriptEvents.queue.length) {
            return
        }
        if (this.status !== 'normal') {
            return;
        }
        if (hero.isAstralProjection) {
            return;
        }
        // Remove the grab action since the hero is reading the sign, not grabbing it.
        hero.action = null;
        setSpawnLocation(state, {
            ...state.location,
            x: this.x + 8,
            y: this.y + 16,
        });
        state.hero.life = state.hero.maxLife;
        if (getObjectStatus(state, this.definition)) {
            if (!state.hero.hasRevive) {
                showMessage(state, '{@saveStatue.reviveChoice}');
            } else {
                showMessage(state, `You will return here if defeated.`);
            }
        } else {
            // The save statue only shows one set of dialog per area and only
            // the first time you interact with it.
            const dialogueOption = selectDialogueOption(state, 'saveStatue');
            showMessage(state, dialogueOption.text[0]);
            saveObjectStatus(state, this.definition, true);
        }
    }
    update(state: GameState) {
        if (state.fieldTime % 100 === 0) {
            addSparkleAnimation(state, this.area, this.getHitbox(state), {});
        }
    }
    render(context, state: GameState) {
        const frame = getObjectStatus(state, this.definition) ? tallSign : tallSignSpirit;
        drawFrame(context, frame, { ...frame, x: this.x - frame.content.x + 8, y: this.y - frame.content.y });
    }
}
