import { renderIndicator } from 'app/content/objects/indicator';
import { objectHash } from 'app/content/objects/objectHash';
import { playAreaSound } from 'app/musicController';
import { CANVAS_HEIGHT } from 'app/gameConstants';
import { createAnimation, drawFrame } from 'app/utils/animations';
import { enterZoneByTarget } from 'app/utils/enterZoneByTarget';
import { getTileBehaviors } from 'app/utils/field';
import { isObjectInsideTarget, pad } from 'app/utils/index';
import { getObjectStatus } from 'app/utils/objects';


const pitFrame = createAnimation('gfx/tiles/pit.png', {w: 16, h: 16}).frames[0];

export const pitStyles: {[key: string]: {getHitbox: (pit: PitEntrance) => Rect}} = {
    default: {
        getHitbox(pit: PitEntrance): Rect {
            return {x: pit.x, y: pit.y, w: 32, h: 32};
        }
    },
    singleTile: {
        getHitbox(pit: PitEntrance): Rect {
            return {x: pit.x, y: pit.y, w: 16, h: 16};
        }
    },
};

export class PitEntrance implements ObjectInstance {
    area: AreaInstance;
    drawPriority: DrawPriority = 'background';
    definition: EntranceDefinition = null;
    behaviors: TileBehaviors = {pit: true};
    isObject = <const>true;
    x: number;
    ignorePits = true;
    y: number;
    status: ObjectStatus = 'normal';
    style: string;
    wasUnderObject: boolean;
    constructor(state: GameState, definition: EntranceDefinition) {
        this.definition = definition;
        this.x = definition.x;
        this.y = definition.y;
        this.status = this.definition.status;
        this.style = this.definition.style || 'default';
        if (getObjectStatus(state, this.definition)) {
            this.status = 'normal';
        }
    }
    getHitbox(): Rect {
        return (pitStyles[this.style] || pitStyles.default).getHitbox(this);
    }
    isUnderObject(state: GameState): boolean {
        if (!this.area || this.style !== 'singleTile') {
            return false;
        }
        const {tileBehavior} = getTileBehaviors(state, this.area, {x: this.x + 8, y: this.y + 8});
        return tileBehavior.solid || tileBehavior.covered || tileBehavior.isBrittleGround;
    }
    update(state: GameState) {
        if (this.status !== 'normal') {
            return;
        }
        if (this.isUnderObject(state)) {
            this.wasUnderObject = true;
            return;
        } else if (this.wasUnderObject) {
            this.wasUnderObject = false;
            // Play the secret chime when this pit is first discovered if it is actually an entrance.
            if (this.definition.targetZone, this.definition.targetObjectId) {
                playAreaSound(state, this.area, 'secretChime');
            }
        }
        const hero = state.hero;
        if (this.area === hero.area && hero.z <= 0 && hero.action !== 'roll' && hero.action !== 'preparingSomersault'
            && isObjectInsideTarget(hero.getMovementHitbox(), pad(this.getHitbox(), 2))
        ) {
            if (hero.action === 'fallen') {
                if (enterZoneByTarget(state, this.definition.targetZone, this.definition.targetObjectId, this.definition, false)) {
                    hero.action = 'knocked';
                    hero.animationTime = 0;
                    hero.z = CANVAS_HEIGHT;
                    hero.vx = hero.vy = 0;
                    hero.vz = -1;
                    hero.safeD = hero.d;
                    hero.safeX = hero.x;
                    hero.safeY = hero.y;
                }
            } else if (hero.action !== 'falling') {
                hero.throwHeldObject(state);
                hero.heldChakram?.throw(state);
                hero.action = 'falling';
                hero.animationTime = 0;
            }
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        if (this.status !== 'normal' || this.isUnderObject(state)) {
            if (state.hero.savedData.passiveTools.trueSight) {
                renderIndicator(context, this.getHitbox(), state.fieldTime);
            }
            return;
        }
        drawFrame(context, pitFrame, this.getHitbox());
    }
}
objectHash.pitEntrance = PitEntrance;
