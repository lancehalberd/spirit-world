import { renderIndicator } from 'app/content/objects/indicator';
import { objectHash } from 'app/content/objects/objectHash';
import { specialBehaviorsHash } from 'app/content/specialBehaviors/specialBehaviorsHash';
import { playAreaSound } from 'app/musicController';
import { createAnimation, drawFrame } from 'app/utils/animations';
import { rectanglesOverlap } from 'app/utils/index';
import { deactivateTargets, getObjectStatus, saveObjectStatus} from 'app/utils/objects';
import { checkIfAllSwitchesAreActivated } from 'app/utils/switches';


const [upFrame, downFrame] = createAnimation('gfx/tiles/toggletiles.png', {w: 16, h: 16}, {cols: 2}).frames;

export class FloorSwitch implements ObjectInstance {
    alwaysReset = true;
    area: AreaInstance;
    drawPriority: DrawPriority = 'background';
    definition: FloorSwitchDefinition = null;
    isObject = <const>true;
    x: number;
    y: number;
    status: ObjectStatus = 'normal';
    constructor(state: GameState, definition: FloorSwitchDefinition) {
        this.definition = definition;
        this.x = definition.x;
        this.y = definition.y;
        if (getObjectStatus(state, definition)) {
            this.status = 'active';
        }
    }
    getHitbox(): Rect {
        return { x: this.x + 2, y: this.y + 2, w: 12, h: 12 };
    }
    isDepressed(state: GameState): boolean {
        const hitbox = this.getHitbox();
        if (state.hero.z <= 0 && state.hero.area === this.area && state.hero.overlaps(hitbox)) {
            return true;
        }
        for (const object of this.area.objects) {
            // Only solid objects with hitboxes can press switches.
            if (object === this || !object.getHitbox || !(object.behaviors?.solid || object.canPressSwitches)) {
                continue;
            }
            if (!(object.z > 0) && rectanglesOverlap(object.getHitbox(state), hitbox)) {
                return true;
            }
        }
        return false;
    }
    onToggle(state: GameState): void {
        if (this.status === 'active') {
            this.status = 'normal';
        } else {
            this.status = 'active';
            saveObjectStatus(state, this.definition, true);
            if (this.definition.id && (this.definition.saveStatus === 'forever' || this.definition.saveStatus === 'zone')) {
                // Refresh the area to update layer logic, for example drainging lava in the crater.
                state.areaInstance.needsLogicRefresh = true;
            }
            if (this.definition.specialBehaviorKey) {
                const specialBehavior = specialBehaviorsHash[this.definition.specialBehaviorKey] as SpecialSwitchBehavior;
                specialBehavior?.onActivate?.(state, this);
            }
        }
        if (this.definition.toggleOnRelease && this.definition.targetObjectId) {
            if (this.status === 'active') {
                playAreaSound(state, this.area, 'switch');
                checkIfAllSwitchesAreActivated(state, this.area, this);
            } else {
                playAreaSound(state, this.area, 'smallSwitch');
                deactivateTargets(state, this.area, this.definition.targetObjectId);
            }
            return;
        }
        // Don't apply the toggle effect on release unless toggleOnRelease is true.
        if (this.status === 'normal' && !this.definition.toggleOnRelease) {
            playAreaSound(state, this.area, 'smallSwitch');
            return;
        }
        playAreaSound(state, this.area, 'switch');
        checkIfAllSwitchesAreActivated(state, this.area, this);
    }

    update(state: GameState) {
        // Switches with save status turned on stay depressed after they are stepped on.
        if ((this.definition.saveStatus === 'zone' || this.definition.saveStatus === 'forever') && this.status === 'active') {
            return;
        }
        if (this.status === 'active' && !this.isDepressed(state)) {
            this.onToggle(state);
        } else if (this.status === 'normal' && this.isDepressed(state)) {
            this.onToggle(state);
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        if (this.status === 'active') {
            drawFrame(context, downFrame, {...downFrame, x: this.x, y: this.y});
        } else {
            drawFrame(context, upFrame, {...upFrame, x: this.x, y: this.y});
        }
        if (this.definition.isInvisible && state.hero.savedData.passiveTools.trueSight) {
            renderIndicator(context, this.getHitbox(), state.fieldTime);
        }
    }
}
objectHash.floorSwitch = FloorSwitch;

class _FloorSwitch extends FloorSwitch {}
declare global {
    export interface FloorSwitch extends _FloorSwitch {}
}
