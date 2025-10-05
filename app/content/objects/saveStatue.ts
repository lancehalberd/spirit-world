import { addSparkleAnimation } from 'app/content/effects/animationEffect';
import { objectHash } from 'app/content/objects/objectHash';
import { setSpawnLocation } from 'app/content/spawnLocations';
import { isRandomizer } from 'app/gameConstants';
import { showMessage } from 'app/scriptEvents';
import {drawFrameContentAt, getFrameHitbox} from 'app/utils/animations';
import {requireFrame} from 'app/utils/packedImages';
import { selectDialogueOption } from 'app/utils/dialogue';
import { getObjectStatus, saveObjectStatus } from 'app/utils/objects';
import { FRAME_LENGTH } from 'app/gameConstants';


//const [saveStatue] = createAnimation('gfx/tiles/savepoint.png', geometry).frames;
const saveStatue = requireFrame('gfx/objects/fairyStatue.png', {x: 0, y: 0, w: 100, h: 100, content: {x: 38, y: 65, w: 24, h: 16}});
const sparkleBox: Rect = {x: 37, y: 24, w: 24, h: 50};
const foregroundHeight = 48;

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
    time = 0;
    constructor(state: GameState, definition: SimpleObjectDefinition) {
        this.definition = definition;
        this.x = definition.x;
        this.y = definition.y;
        this.status = this.definition.status;
    }
    getHitbox(state: GameState): Rect {
        return getFrameHitbox(saveStatue, this);
    }
    getSparkleBox(state: GameState): Rect {
        return getFrameHitbox(saveStatue, this, sparkleBox);
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
        // Remove the grab action since the hero is interacting with the statue, not grabbing it.
        hero.action = null;
        setSpawnLocation(state, {
            ...state.location,
            x: this.x + 8,
            y: this.y + 16,
        });
        state.hero.burnDamage = 0;
        state.hero.life = state.hero.savedData.maxLife;
        if (state.hero.magicRegen > 0 && (!state.areaSection.isCorrosive || state.hero.savedData.passiveTools.waterBlessing)) {
            state.hero.magic = state.hero.maxMagic;
            state.hero.magicRegenCooldown = 0;
        }
        if (getObjectStatus(state, this.definition)) {
            if (!state.hero.savedData.hasRevive) {
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
            const dialogueOption = selectDialogueOption(state, 'saveStatue', this);
            showMessage(state, dialogueOption.text[0].text);
            saveObjectStatus(state, this.definition, true);
        }
    }
    update(state: GameState) {
        if (this.status !== 'normal') {
            return;
        }
        this.time += FRAME_LENGTH;
        // The statue sparkles if you haven't used it yet.
        if ((this.time % 800 === 0 || this.time % 800 === 100 || this.time % 800 === 300) && !getObjectStatus(state, this.definition)) {
            addSparkleAnimation(state, this.area, this.getSparkleBox(state), {});
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        if (this.status !== 'normal') {
            return;
        }
        const frame = saveStatue;
        //drawFrameContentAt(context, frame, this);
        drawFrameContentAt(context, {...frame, y: foregroundHeight, h: frame.h - foregroundHeight}, {x: this.x, y: this.y + foregroundHeight});
    }
    renderForeground(context: CanvasRenderingContext2D, state: GameState) {
        const frame = saveStatue;
        drawFrameContentAt(context, {...frame, h: frame.h - foregroundHeight}, {x: this.x, y: this.y});
    }
}
objectHash.saveStatue = SaveStatue;
