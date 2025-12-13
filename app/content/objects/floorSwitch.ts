import { renderIndicator } from 'app/content/objects/indicator';
import { objectHash } from 'app/content/objects/objectHash';
import { specialBehaviorsHash } from 'app/content/specialBehaviors/specialBehaviorsHash';
import {playObjectSound} from 'app/musicController';
import { createAnimation, drawFrame } from 'app/utils/animations';
import { rectanglesOverlap } from 'app/utils/index';
import { deactivateTargets, getObjectStatus, saveObjectStatus} from 'app/utils/objects';
import { checkIfAllSwitchesAreActivated } from 'app/utils/switches';


const [upFrame, downFrame] = createAnimation('gfx/tiles/toggletiles.png', {w: 16, h: 16}, {cols: 2}).frames;

export class FloorSwitch implements ObjectInstance {
    alwaysReset = true;
    stayDepressed = false;
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
        this.stayDepressed = definition.saveStatus === 'zone' || definition.saveStatus === 'forever';
        this.status = this.getLogicalStatus(state);
    }
    getHitbox(): Rect {
        return { x: this.x + 2, y: this.y + 2, w: 12, h: 12 };
    }
    getLogicalStatus(state: GameState): ObjectStatus {
        // No need to check this if this switch doesn't stay depressed as this behavior is just used to
        // modify the status of permanent switches when their flag is unset by another source.
        if (!this.definition.id || !this.stayDepressed) {
            return this.status;
        }
        if (getObjectStatus(state, this.definition) === !this.definition.isInverted) {
            return 'active';
        }
        return 'normal';
    }
    isDepressed(state: GameState): boolean {
        const hitbox = this.getHitbox();
        if (state.hero.z <= 0 && state.hero.area === this.area && rectanglesOverlap(state.hero.getFloorHitbox(), hitbox)) {
            return true;
        }
        for (const object of this.area.objects) {
            // Only solid objects with hitboxes can press switches.
            if (object === this || !(object.getFloorHitbox || object.getHitbox) || !(object.behaviors?.solid || object.canPressSwitches)) {
                continue;
            }
            const objectHitbox = object.getFloorHitbox?.() || object.getHitbox();
            if (!(object.z > 0) && rectanglesOverlap(objectHitbox, hitbox)) {
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
            saveObjectStatus(state, this.definition, !this.definition.isInverted);
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
                playObjectSound(state, this, 'switch');
                checkIfAllSwitchesAreActivated(state, this.area, this.definition);
            } else {
                playObjectSound(state, this, 'smallSwitch');
                deactivateTargets(state, this.area, this.definition.targetObjectId);
            }
            return;
        }
        // Don't apply the toggle effect on release unless toggleOnRelease is true.
        if (this.status === 'normal' && !this.definition.toggleOnRelease) {
            playObjectSound(state, this, 'smallSwitch');
            return;
        }
        playObjectSound(state, this, 'switch');
        if (this.status === 'active') {
            checkIfAllSwitchesAreActivated(state, this.area, this.definition);
        }
    }

    update(state: GameState) {
        if (this.status === 'hidden') {
            return;
        }
        // This does nothing if the switch isn't assigned an ID.
        this.status = this.getLogicalStatus(state);
        // Switches with save status turned on stay depressed after they are stepped on.
        if (this.stayDepressed && this.status === 'active') {
            return;
        }
        if (this.status === 'active' && !this.isDepressed(state)) {
            this.onToggle(state);
        } else if (this.status === 'normal' && this.isDepressed(state)) {
            this.onToggle(state);
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        if (this.status === 'hidden') {
            return;
        }
        if (this.status === 'active') {
            drawFrame(context, downFrame, {...downFrame, x: this.x, y: this.y});
        } else {
            drawFrame(context, upFrame, {...upFrame, x: this.x, y: this.y});
        }
        // Indicate that this object was invisible without true sight.
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
