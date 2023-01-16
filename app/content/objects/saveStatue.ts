import { selectDialogueOption } from 'app/content/dialogue';
import { addSparkleAnimation } from 'app/content/effects/animationEffect';
import { getObjectStatus, saveObjectStatus } from 'app/content/objects';
import { setSpawnLocation } from 'app/content/spawnLocations';
import { isRandomizer } from 'app/gameConstants';
import { showMessage } from 'app/render/renderMessage';
import { createAnimation, drawFrame } from 'app/utils/animations';

import {
    AreaInstance, GameState, Direction, Hero, SimpleObjectDefinition,
    ObjectInstance, ObjectStatus, Rect,
} from 'app/types';

const geometry = {w: 32, h: 48};
const [saveStatue] = createAnimation('gfx/tiles/savepoint.png', geometry).frames;


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
        return { x: this.x + 4, y: this.y, w: 24, h: 16 };
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
        if (state.location.zoneKey !== 'waterfallTower' || state.hero.passiveTools.waterBlessing) {
            state.hero.magic = state.hero.maxMagic;
            state.hero.magicRegenCooldown = 0;
        }
        if (getObjectStatus(state, this.definition)) {
            if (!state.hero.hasRevive) {
                showMessage(state, '{@saveStatue.reviveChoice}');
            } else {
                showMessage(state, `You will return here if defeated.`);
            }
        } else if (isRandomizer) {
            showMessage(state, '{@saveStatue.randomizer}');
            saveObjectStatus(state, this.definition, true);
        } else {
            // The save statue only shows one set of dialog per area and only
            // the first time you interact with it.
            const dialogueOption = selectDialogueOption(state, 'saveStatue');
            showMessage(state, dialogueOption.text[0]);
            saveObjectStatus(state, this.definition, true);
        }
    }
    update(state: GameState) {
        // The statue sparkles if you haven't used it yet.
        if (state.fieldTime % 100 === 0 && !getObjectStatus(state, this.definition)) {
            addSparkleAnimation(state, this.area, this.getHitbox(state), {});
        }
    }
    render(context, state: GameState) {
        const frame = saveStatue;
        drawFrame(context, frame, { ...frame, x: this.x, y: this.y - 32 });
    }
}
