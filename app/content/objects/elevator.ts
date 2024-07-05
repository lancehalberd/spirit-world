import { dialogueHash } from 'app/content/dialogue/dialogueHash';
import { isObjectLogicValid } from 'app/content/logic';
import { TextCue } from 'app/content/effects/textCue';
import { objectHash } from 'app/content/objects/objectHash';
import { zones } from 'app/content/zones';
import { FRAME_LENGTH } from 'app/gameConstants';
import { renderHeroShadow } from 'app/renderActor';
import { appendCallback, appendScript } from 'app/scriptEvents';
import { createAnimation, drawFrame, getFrame } from 'app/utils/animations';
import { setAreaSection } from 'app/utils/area';
import { playAreaSound } from 'app/musicController';
import { createCanvasAndContext, drawCanvas, debugCanvas } from 'app/utils/canvas';
import { addEffectToArea } from 'app/utils/effects';
import { enterLocation } from 'app/utils/enterLocation';
import { fixCamera } from 'app/utils/fixCamera';
import { isPixelInShortRect } from 'app/utils/index';

const [floorSlot, floorPitMask, floorPit, /*floorPit2*/, platformInFloor, ring, platform ] = createAnimation('gfx/tiles/futuristic.png',
    {w: 112, h: 110}, {left: 0, top: 728, cols: 7}
).frames;

const callTerminalHideAnimation = createAnimation('gfx/tiles/futuristic.png', {w: 48, h: 32}, {left: 0, top: 1214, cols: 18, duration: 4}, {loop: false});

const controlTerminalAnimation = createAnimation('gfx/tiles/futuristic.png', {w: 48, h: 32}, {left: 0, top: 1024, cols: 2, duration: 24});

const innerRadius = 46, outerRadius = 54;
const maskFrame = floorPitMask;
debugCanvas;//(platformInFloor, 1);
// This canvas is used to compose all the elements together that will be masked (the playform with the terminal+player on it).
const [maskedCanvas, maskedContext] = createCanvasAndContext(maskFrame.w, maskFrame.h);
const [maskCanvas, maskContext] = createCanvasAndContext(maskFrame.w, maskFrame.h);

const lightBehaviors: TileBehaviors = {
    brightness: 0.5,
    lightRadius: 48,
}
export class Elevator implements ObjectInstance {
    area: AreaInstance;
    animationTime: number = 0;
    getBehaviors(state: GameState, x?: number, y?: number): TileBehaviors {
        const hitbox = this.getLandingHitbox();
        if (!isPixelInShortRect(x, y, hitbox)) {
            return lightBehaviors;
        }
        const dx = x - (hitbox.x + hitbox.w / 2), dy = y - (hitbox.y + hitbox.h / 2);
        const r2 = dx*dx + dy*dy;
        // The ring around the elevator is solid
        if (r2 > innerRadius * innerRadius && r2 < outerRadius * outerRadius) {
            const theta = Math.atan2(dy, dx);
            if (theta < Math.PI / 3 || theta > 2 * Math.PI / 3) {
                return {solid: true, ...lightBehaviors};
            }
        }
        return lightBehaviors;
    }
    offsetX: number = 0;
    offsetY: number = 0;
    definition: ElevatorDefinition;
    drawPriority: DrawPriority = 'background';
    isObject = <const>true;
    isNeutralTarget = true;
    x: number;
    y: number;
    status: ObjectStatus = 'normal';
    specialStatus?: 'stuck' | 'off' | 'crashed' | 'falling';
    elevatorY = 0;
    floorDelta = 0;
    callTerminal: ElevatorCallTerminal;
    controlTerminal: ElevatorControlTerminal;
    targetDelta = 0;
    constructor(state: GameState, definition: ElevatorDefinition) {
        this.definition = definition;
        this.status = definition.status;
        this.x = this.definition.x;
        this.y = this.definition.y;
        const elevatorFloor = getElevatorFloor(state);
        if (elevatorFloor > this.definition.floor) {
            this.floorDelta = 1;
        } else if (elevatorFloor < this.definition.floor) {
            this.floorDelta = -1;
        } else {
            this.floorDelta = 0;
        }
        //console.log('new Elevator', this.definition.floor, '?', elevatorFloor, '=', this.floorDelta);
        this.callTerminal = new ElevatorCallTerminal(this);
        this.controlTerminal = new ElevatorControlTerminal(this);
    }
    getParts() {
        const parts: ObjectInstance[] = [this.callTerminal];
        if (this.floorDelta === 0) {
            parts.push(this.controlTerminal);
        }
        return parts;
    }
    getLandingHitbox() {
        return {x: this.x, y: this.y, w: floorSlot.w, h: floorSlot.h};
    }
    getHitbox() {
        return {x: this.x, y: this.y - this.elevatorY, w: floorSlot.w, h: floorSlot.h};
    }
    // Run the sequence to move the elevator to a target floor while the hero rides it.
    travelToFloor(state: GameState, floor: number) {
        state.hero.renderParent = this;
        state.hero.action = null;
        state.hero.isControlledByObject = true;
        this.targetDelta = floor - this.definition.floor;
    }
    fallToBasement(state: GameState) {
        appendScript(state, '{playSound:switch}{wait:500}');
        // Hack: Force leather boots on to prevent the player from sliding.
        const boots = state.hero.savedData.equippedBoots;
        state.hero.savedData.equippedBoots = 'leatherBoots';
        appendCallback(state, (state: GameState) => {
            this.elevatorY = -4;
            playAreaSound(state, this.area, 'bossDeath');
            state.screenShakes.push({
                dx: 0, dy: 1, startTime: state.fieldTime, endTime: state.fieldTime + 500
            });
            state.hero.action = 'knocked';
            state.hero.vy = 0.5;
            state.hero.vx = 0;
            state.hero.vz = 3;
        });
        appendScript(state, '{wait:1000}');
        appendCallback(state, (state: GameState) => {
            this.elevatorY -= 12;
            playAreaSound(state, this.area, 'bossDeath');
            state.screenShakes.push({
                dx: 0, dy: 1, startTime: state.fieldTime, endTime: state.fieldTime + 500
            });
            state.hero.action = 'knocked';
            state.hero.vy = 0.5;
            state.hero.vx = 0;
            state.hero.vz = 4;
        });
        appendScript(state, '{wait:1500}');
        appendCallback(state, (state: GameState) => {
            this.specialStatus = 'falling';
            playAreaSound(state, this.area, 'bossDeath');
            state.screenShakes.push({
                dx: 0, dy: 2, startTime: state.fieldTime, endTime: state.fieldTime + 500
            });
            state.hero.action = 'knocked';
            state.hero.vy = 0;
            state.hero.vx = 0;
            state.hero.vz = 4;
        });
        appendScript(state, '{wait:300}');
        appendCallback(state, (state: GameState) => {
            state.hero.savedData.equippedBoots = boots;
            state.hero.fallIntoPit(state);
        });
    }
    callToCurrentFloor(state: GameState) {
        if (this.floorDelta > 0) {
            this.elevatorY = 160;
        } else {
            this.elevatorY = -128;
        }
        //console.log('callToCurrentFloor', this.elevatorY, this.definition.floor);
        this.floorDelta = 0;
        state.savedState.objectFlags.elevatorFloor = this.definition.floor;
        this.callTerminal.update(state);
        this.controlTerminal.update(state);
        if (state.hero.renderParent === this) {
            state.hero.z = this.elevatorY;
        }
    }
    update(state: GameState) {
        this.animationTime += FRAME_LENGTH;
        if (this.specialStatus === 'falling') {
            this.elevatorY -= 8;
            if (state.hero.action === 'falling' && state.hero.animationTime < 400) {
                state.hero.y++;
            }
            if (this.elevatorY <= -128 && state.hero.action === 'fallen') {
                enterZoneByElevator(
                    state,
                    state.location.zoneKey,
                    0,
                    false,
                );
            }
        }
        if (this.specialStatus === 'crashed') {
            if (this.elevatorY > 0) {
                this.elevatorY = Math.max(0, this.elevatorY - 8);
                if (this.elevatorY === 0) {
                    playAreaSound(state, this.area, 'bossDeath');
                    state.screenShakes.push({
                        dx: 2, dy: 4, startTime: state.fieldTime, endTime: state.fieldTime + 500
                    });
                }
                state.hero.z = 320;
            }
            if (state.hero.renderParent && state.hero.z < 300) {
                delete state.hero.renderParent;
            }
        }
        // Normal behavior does not apply when a special status is applied.
        if (!this.specialStatus) {
            if (this.targetDelta > 0) {
                this.elevatorY += 2;
                if (this.elevatorY >= 160) {
                    enterZoneByElevator(
                        state,
                        state.location.zoneKey,
                        this.definition.floor + this.targetDelta,
                        false,
                    );
                }
            } else if (this.targetDelta < 0) {
                this.elevatorY -= 2;
                if (this.elevatorY <= -128) {
                    enterZoneByElevator(
                        state,
                        state.location.zoneKey,
                        this.definition.floor + this.targetDelta,
                        false,
                    );
                }
            } else if (this.elevatorY < 0) {
                this.elevatorY += 2;
            } else if (this.elevatorY > 0) {
                this.elevatorY -= 2;
            }
            if (state.hero.renderParent === this) {
                if (this.elevatorY === 0) {
                    delete state.hero.renderParent;
                } else {
                    state.hero.z = this.elevatorY;
                    // For now we don't allow the player to move while the elevator is moving.
                    state.hero.isControlledByObject = true;
                }
            }
        }
        this.callTerminal.update(state);
        this.controlTerminal.update(state);
    }
    renderHero(context: CanvasRenderingContext2D, state: GameState) {
        // Don't draw the hero's shadow while the elevator is falling during the crash sequence.
        if (state.hero.z > 300) {
            return;
        }
        if (state.hero.renderParent === this) {
            // Need to force the shadow to move up/down with the elavator
            context.save();
                context.translate(0, -this.elevatorY);
                renderHeroShadow(context, state, state.hero);
            context.restore();
            state.hero.render(context, state);
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        /*const {x,y,w,h} = this.getHitbox();
        context.fillStyle = 'red';
        context.fillRect(x,y ,w ,h);*/
        if (this.definition.floor === 0) {
            drawFrame(context, floorSlot, {...floorSlot, x: this.x, y: this.y});
        } else {
            drawFrame(context, floorPit, {...floorPit, x: this.x, y: this.y});
        }
        drawFrame(context, ring, {...ring, x: this.x, y: this.y});
        if (this.floorDelta === 0) {
            if (this.elevatorY === 0) {
                drawFrame(context, platformInFloor, {...platformInFloor, x: this.x, y: this.y});
                this.controlTerminal.render(context, state);
            } else if (this.elevatorY < 0) {
                // We use a mask to draw the platform/player/terminal behind the background
                // as the platform moves below the floor to a lower level.
                maskedContext.clearRect(0, 0, maskFrame.w, maskFrame.h);
                drawFrame(maskedContext, platform, {...platform, x: 0, y: -this.elevatorY});
                maskedContext.save();
                    maskedContext.translate(-this.x, -this.y);
                    this.controlTerminal.render(maskedContext, state);
                    this.renderHero(maskedContext, state);
                maskedContext.restore();
                maskContext.clearRect(0, 0, maskFrame.w, maskFrame.h);
                maskContext.globalCompositeOperation = 'source-over';
                drawFrame(maskContext, maskFrame, {...maskFrame, x: 0, y: 0});
                maskContext.globalCompositeOperation = 'source-in';
                drawCanvas(maskContext, maskedCanvas, {...maskFrame, x: 0, y: 0}, {...maskFrame, x: 0, y: 0});
                // Draw the masked content first, then the mask frame on top.
                //window['debugCanvas'](maskCanvas);
                drawCanvas(context, maskCanvas, {...maskFrame, x: 0, y: 0}, {...platform, x: this.x, y: this.y});
                //context.drawImage(maskCanvas, 0, 0, 16, 16, x * w, y * h, w, h);
            } else if (this.elevatorY <= 24) {
                drawFrame(context, platform, {...platform, x: this.x, y: this.y - this.elevatorY});
                this.controlTerminal.render(context, state);
                this.renderHero(maskedContext, state);
            }
        }
        // const terminalFrame = terminalAnimation.frames[0];
        // drawFrame(context, terminalFrame, {...terminalFrame, x: this.x + 32, y: this.y + 80});
        /*context.strokeStyle = 'blue';
        context.beginPath();
        context.arc(x + w / 2, y + h / 2, innerRadius, 0, Math.PI * 2);
        context.stroke();
        context.beginPath();
        context.arc(x + w / 2, y + h / 2, outerRadius, 0, Math.PI * 2);
        context.stroke();*/
    }
    renderForeground2(context: CanvasRenderingContext2D, state: GameState) {
        // This layer isn't used on the top floor of the elevator.
        if (this.definition.floor >= 5) {
            return;
        }
        const ringYs = [
            64 + 5 * Math.sin(this.animationTime / 400),
            112 + 5 * Math.sin(Math.PI / 2 + this.animationTime / 400),
            160 + 5 * Math.sin(Math.PI + this.animationTime / 400),
        ]
        const halfRing = ring.h / 2;
        for (const y of ringYs) {
            drawFrame(context, {...ring, h: halfRing}, {...floorPit, x: this.x, y: this.y - y, h: halfRing});
        }
        if (this.floorDelta === 0) {
            if (this.elevatorY > 24) {
                drawFrame(context, platform, {...floorPit, x: this.x, y: this.y - this.elevatorY});
                this.controlTerminal.render(context, state);
                this.renderHero(context, state);
            }
        }
        for (const y of ringYs) {
            drawFrame(context, {...ring, y: ring.y + halfRing, h: halfRing}, {...floorPit, x: this.x, y: this.y - y + halfRing, h: halfRing});
        }
    }
}
objectHash.elevator = Elevator;

function getElevatorFloor(state: GameState): number {
    const elevatorFixed = !!state.savedState.objectFlags.elevatorFixed;
    const startingFloor = 2;
    // Elevator is broken down at level 2 by default. 0 = basement, 1 = first floor, etc.
     return elevatorFixed
            ? state.savedState.objectFlags.elevatorFloor as number ?? startingFloor
            : startingFloor;
}



class ElevatorControlTerminal implements ObjectInstance {
    get area() {
       return this.elevator.area;
    }
    behaviors: TileBehaviors = { solid: true };
    drawPriority: DrawPriority = 'sprites';
    offsetX: number = 0;
    offsetY: number = 0;
    definition: ElevatorDefinition;
    isObject = <const>true;
    isNeutralTarget = true;
    pattern: CanvasPattern;
    status: ObjectStatus = 'normal';
    elevatorY = 0;
    x = this.elevator.x + 32;
    y = this.elevator.y + 4;
    z = 0;
    animationTime = 0;
    renderParent = this.elevator;
    constructor(public elevator: Elevator) {
    }
    update(state: GameState) {
        this.animationTime += FRAME_LENGTH;
        if (this.elevator.specialStatus) {
            this.animationTime = 0;
        }
        this.z = this.elevator.elevatorY;
    }
    getHitbox() {
        return {
            x: this.x + 8, y: this.y + 16, h: 8, w: 32
        };
    }
    onGrab(state: GameState) {
        // Doesn't work while the elevator isn't docked.
        if (this.elevator.elevatorY !== 0) {
            return;
        }

        if (this.elevator.specialStatus === 'stuck') {
            state.hero.action = null;
            // Set this callback here to give it easy access to the elevator instance.
            dialogueHash.elevator.mappedOptions.releaseBreak = (state: GameState) => {
                this.elevator.fallToBasement(state);
                return '';
            }
            appendScript(state, `
                !WARNING![-]POWER FAILURE DETECTED
                {|}EMERGENCY BREAK ACTIVATED
                {choice:RELEASE BREAK?|Yes:elevator.releaseBreak|No}
            `);
            return;
        }
        if (this.elevator.specialStatus === 'crashed') {
            state.hero.action = null;
            appendScript(state, `
                !WARNING![-]POWER FAILURE DETECTED
                {|}POSSIBLE SHORT DETECTED IN BASEMENT.
            `);
            // This doesn't open until the mid boss is defeated now.
            //    EMERGENCY ESCAPE HATCH OPENED IN BASEMENT.
            return;
        }
        // Normal behavior is prevented by any special status.
        if (this.elevator.specialStatus) {
            return;
        }

        // TODO: Make this dynamic based on elevator objects in the zone and the name of the floor for their section.
        let options = ['B1', '1F', '2F', '3F', '4F', '5F'];
        options[this.elevator.definition.floor] = options[this.elevator.definition.floor] +' (Stay)';
        options = options.map((v, i) => `${v}:elevator.f${i}`);
        appendScript(state, `{choice:SELECT FLOOR|${options.join('|')}}`);
        // Set the results of choosing a floor based on the current floor the elevator is on:
        for (let i = 0; i < 6; i++) {
            dialogueHash.elevator.mappedOptions[`f${i}`] = (i === this.elevator.definition.floor)
                // Just play a confirm sound and do nothing if it is on this floor.
                ? `{playSound:switch}`
                // Do the move elevator sequence.
                : (state: GameState) => {
                    this.elevator.travelToFloor(state, i);
                    return '';
                };
        }
        state.hero.action = null;
        // TODO: Handle case where the elevator is off.
        // TODO: Handle case where elevator is stuck on an upper floor
        // TODO: Handle case where elevator is stuck on the ground floor
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        const frame = getFrame(controlTerminalAnimation, this.animationTime);
        // debugCanvas(frame, 1);
        drawFrame(context, frame, {...frame, x: this.x, y: this.y - this.z});
    }
}

class ElevatorCallTerminal implements ObjectInstance {
    get area() {
       return this.elevator.area;
    }
    offsetX: number = 0;
    offsetY: number = 0;
    definition: ElevatorDefinition;
    isObject = <const>true;
    isNeutralTarget = true;
    pattern: CanvasPattern;
    status: ObjectStatus = 'normal';
    elevatorY = 0;
    x = this.elevator.x + 32;
    y = this.elevator.y + 85;
    animationTime = (this.elevator.floorDelta === 0) ? callTerminalHideAnimation.duration : 0;
    constructor(public elevator: Elevator) {
    }
    update(state: GameState) {
        // If the hide terminal animation is not complete, start running it once the elevator is close to being docked.
        if (this.animationTime <= callTerminalHideAnimation.duration && this.elevator.floorDelta === 0 && Math.abs(this.elevator.elevatorY) < 36) {
            this.animationTime += FRAME_LENGTH;
        }
    }
    getHitbox() {
        return {
            x: this.x + 8, y: this.y + 16, h: 8, w: 32
        };
    }
    getDrawPriority() {
        return this.animationTime > callTerminalHideAnimation.frameDuration * FRAME_LENGTH * 7 ? 'background' : 'sprites';
    }
    getBehaviors() {
        return this.animationTime > callTerminalHideAnimation.frameDuration * FRAME_LENGTH * 7
            ? null
            : { solid: true };
    }
    onGrab(state: GameState) {
        // There is nothing to grab when the terminal is flush with the floor.
        if (this.animationTime > callTerminalHideAnimation.frameDuration * FRAME_LENGTH * 7) {
            state.hero.action = null;
            return;
        }
        // No special behavior if the terminal is not fully up or the platform is already on this floor.
        if (this.animationTime !== 0 || this.elevator.floorDelta === 0) {
            return;
        }
        if (this.elevator.specialStatus === 'stuck') {
            appendScript(state, `
                !WARNING![-]POWER FAILURE DETECTED
                {|}SAFETY BREAK ACTIVATED, THE PLATFORM CANNOT BE CALLED.
            `);
            state.hero.action = null;
        }
        // Normal behavior is prevented by any special status.
        if (this.elevator.specialStatus) {
            return;
        }
        // Summon the platform to the current floor.
        state.hero.action = null;
        this.elevator.callToCurrentFloor(state);
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        const frame = getFrame(callTerminalHideAnimation, this.animationTime);
        // debugCanvas(frame, 1);
        drawFrame(context, frame, {...frame, x: this.x, y: this.y});
    }
}

export function enterZoneByElevator(
    this: void,
    state: GameState,
    zoneKey: string,
    targetFloor: number,
    instant: boolean = true,
    callback: (state: GameState) => void = null
): boolean {
    const zone = zones[zoneKey];
    if (!zone) {
        console.error(`Missing zone: ${zoneKey}`);
        return false;
    }
    const objectLocation = findElevatorLocation(state, zoneKey, targetFloor, state.areaInstance.definition.isSpiritWorld, true);
    if (!objectLocation) {
        return false;
    }
    //console.log('enterZoneByElevator', targetFloor, objectLocation);
    enterLocation(state, objectLocation, instant, () => {
        const elevator = findElevatorForFloor(state.areaInstance, targetFloor);
        const hitbox = elevator.getLandingHitbox();
        state.hero.x = hitbox.x + hitbox.w / 2 - state.hero.w / 2;
        state.hero.y = hitbox.y + hitbox.h / 2 - state.hero.h / 2 - 16;
        state.hero.d = 'up';
        state.hero.renderParent = elevator;
        state.hero.isControlledByObject = true;
        elevator.callToCurrentFloor(state);
        setAreaSection(state, true);
        fixCamera(state);
        // TODO: Make this generic so the elevator can be used in other areas, particularly generated areas.
        const floorName = ['B1', '1F', '2F', '3F', '4F', '5F'][elevator.definition.floor];
        const textCue = new TextCue(state, { text: 'Tower ' + floorName });
        addEffectToArea(state, state.areaInstance, textCue);
        // This means the player just dropped the elevator to the basement.
        if (elevator.specialStatus === 'stuck') {
            elevator.specialStatus = 'crashed';
            elevator.floorDelta = 0;
            elevator.elevatorY = 300;
            state.hero.action = 'knocked';
        }

        callback?.(state);
    });
    return true;
}

export function findElevatorLocation(
    state: GameState,
    zoneKey: string,
    targetFloor: number,
    checkSpiritWorldFirst = false,
    showErrorIfMissing = false
): ZoneLocation & {object: ObjectDefinition} | false {
    const zone = zones[zoneKey];
    if (!zone) {
        debugger;
        console.error('Missing zone', zoneKey);
        return false;
    }
    for (let worldIndex = 0; worldIndex < 2; worldIndex++) {
        for (let floor = 0; floor < zone.floors.length; floor++) {
            // Search the corresponding spirit/material world before checking in the alternate world.
            const areaGrids = checkSpiritWorldFirst
                ? [zone.floors[floor].spiritGrid, zone.floors[floor].grid]
                : [zone.floors[floor].grid, zone.floors[floor].spiritGrid];
            const areaGrid = areaGrids[worldIndex];
            const inSpiritWorld = areaGrid === zone.floors[floor].spiritGrid;
            for (let y = 0; y < areaGrid.length; y++) {
                for (let x = 0; x < areaGrid[y].length; x++) {
                    for (const object of (areaGrid[y][x]?.objects || [])) {
                        if (object.type === 'elevator' && object.floor === targetFloor) {
                            if (!isObjectLogicValid(state, object)) {
                                continue;
                            }
                            return {
                                zoneKey,
                                floor,
                                areaGridCoords: {x, y},
                                x: object.x,
                                y: object.y,
                                d: state.hero.d,
                                isSpiritWorld: inSpiritWorld,
                                object,
                            };
                        }
                    }
                }
            }
        }
    }
    if (showErrorIfMissing) {
        console.error('Could not find elevator for floor ', targetFloor, 'in', zoneKey);
    }
    return false;
}

function findElevatorForFloor(areaInstance: AreaInstance, targetFloor: number): Elevator {
    for (const object of areaInstance.objects) {
        if (!object.definition) {
            continue;
        }
        if (object.definition.type === 'elevator' && object.definition.floor === targetFloor) {
            return object as Elevator;
        }
    }
    console.error('Missing elevator for floor', targetFloor);
}

class _Elevator extends Elevator {}
declare global {
    export interface Elevator extends _Elevator {}
}
