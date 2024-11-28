import { objectHash } from 'app/content/objects/objectHash';
import { FRAME_LENGTH } from 'app/gameConstants';
import { playAreaSound } from 'app/musicController';
import { appendScript } from 'app/scriptEvents';
import { drawFrame, drawFrameContentAt, getFrameHitbox } from 'app/utils/animations';
import { createCanvasAndContext } from 'app/utils/canvas';
import { createObjectInstance } from 'app/utils/createObjectInstance';
import { hitTargets } from 'app/utils/field';
import { allImagesLoaded } from 'app/utils/images';
import { isPixelInShortRect } from 'app/utils/index';
import { requireFrame } from 'app/utils/packedImages';

const staffTowerFrame = requireFrame('gfx/objects/staffTower.png', {x: 234, y: 17, w: 172, h: 240, content: {x: 0, y: 72, w: 172, h: 167}});
const staffTowerMaskFrame = requireFrame('gfx/objects/staffTower.png', {x: 442, y: 17, w: 172, h: 240, content: {x: 0, y: 72, w: 172, h: 167}});
const staffTowerCloudFrame = requireFrame('gfx/objects/staffTower.png', {x: 851, y: 266, w: 186, h: 141});
const staffTowerSkyFrame = requireFrame('gfx/objects/staffTower.png', {x: 234, y: 273, w: 172, h: 272, content: {x: 0, y: 72, w: 172, h: 167}});
const staffTowerSkyMaskFrame = requireFrame('gfx/objects/staffTower.png', {x: 442, y: 273, w: 172, h: 272, content: {x: 0, y: 72, w: 172, h: 167}});
const staffTowerSkyBalconyFrame = requireFrame('gfx/objects/staffTower.png', {x: 672, y: 493, w: 128, h: 82});

const staffTowerSpiritFrame = requireFrame('gfx/objects/staffTower.png', {x: 26, y: 17, w: 172, h: 240, content: {x: 0, y: 72, w: 172, h: 167}});
const staffTowerSpiritMaskFrame = staffTowerMaskFrame;
const staffTowerSpiritSkyFrame = requireFrame('gfx/objects/staffTower.png', {x: 26, y: 273, w: 172, h: 240, content: {x: 0, y: 72, w: 172, h: 167}});
const staffTowerSpiritSkyMaskFrame = staffTowerMaskFrame;
const staffTowerSpiritSkyBalconyFrame = requireFrame('gfx/objects/staffTower.png', {x: 880, y: 493, w: 128, h: 75});

const [maskCanvas, maskContext] = createCanvasAndContext(staffTowerSkyMaskFrame.w, staffTowerSkyMaskFrame.h);
const [glowCanvas, glowContext] = createCanvasAndContext(staffTowerSkyMaskFrame.w, staffTowerSkyMaskFrame.h);

const shakeTime = 1600;
const shrinkTime = 1000;
const gatherTime = 400;
const throwTime = 800;

export class StaffTower implements ObjectInstance {
    area: AreaInstance;
    definition: EntranceDefinition;
    drawPriority: DrawPriority = 'background';
    // The hero should fall in front of the tower, not under it, so this index has to be less than
    // 1, which is the index used for the falling hero.
    drawPriorityIndex = 0;
    isNeutralTarget = true;
    isObject = <const>true;
    ignorePits = true;
    x: number;
    y: number;
    status: ObjectStatus = 'normal';
    specialStatus?: 'collapsing'|'deploying';
    animationTime = 0;
    door: ObjectInstance;
    balcony: Balcony;
    top: StaffTowerTop;
    constructor(state: GameState, definition: EntranceDefinition) {
        this.definition = definition;
        this.x = definition.x;
        this.y = definition.y;
        this.door = createObjectInstance(state, {
            type: 'door',
            id: definition.id,
            status: definition.status,
            d: 'up',
            style: 'future',
            x: this.x + 70,
            y: this.y + 138,
            targetZone: definition.targetZone,
            targetObjectId: definition.targetObjectId,
        });
        // Door's normally render on the background layer, but this door must render on top of the tower, which is in the sprite layer.
        this.door.renderParent = this;
        this.balcony = new Balcony(this);
        this.top = new StaffTowerTop(this);
    }
    collapse(state: GameState) {
        this.specialStatus = 'collapsing';
        this.animationTime = 0;
        // Prevent the hero from moving while the tower collapses.
        state.hero.isControlledByObject = true;
        state.screenShakes = [{dx: 1, dy: 0, startTime: state.fieldTime}];
    }
    deploy(state: GameState) {
        this.specialStatus = 'deploying';
        this.animationTime = 0;
        // Prevent the hero from moving while the tower is deployed.
        state.hero.isControlledByObject = true;
        const hitbox = this.getHitbox();
        const heroBox = state.hero.getHitbox();
        const dx = (heroBox.x + heroBox.w / 2) - (hitbox.x + hitbox.w / 2);
        const dy = (heroBox.y + heroBox.h / 2) - (hitbox.y + hitbox.h / 2);
        this.x += dx;
        this.y += dy - 2;
    }
    getParts() {
        const parts = [this.door, this.top];
        if (this.definition.style === 'sky') {
            parts.push(this.balcony);
        }
        return parts;
    }
    getBehaviors(state: GameState, x?: number, y?: number): TileBehaviors {
        const hitbox = this.getHitbox();
        if (!isPixelInShortRect(x, y, hitbox)) {
            return {};
        }
        // All of the top except for 1 tile is a solid rectangle.
        if (y < this.y + 112 && y > this.y + 16) {
            return {solid: true};
        }
        // The bottom is a solid half circle.
        const radius = 86;
        let dx = x - (hitbox.x + hitbox.w / 2), dy = y - (hitbox.y + hitbox.h / 2);
        let r2 = dx * dx + dy * dy;
        if (r2 < radius * radius) {
            return {solid: true};
        }
        if (this.definition.style === 'sky') {
            dy = y - (hitbox.y + (hitbox.h + 36) / 2);
            r2 = dx * dx + dy * dy;
            if (r2 < radius * radius) {
                return {pit: true, pitWall: true};
            }
        }
        return {};
    }
    getYDepth(): number {
        const hitbox = this.getHitbox();
        return hitbox.y + hitbox.h - 57;
    }
    getHitbox(): Rect {;
        const hitbox = getFrameHitbox(staffTowerFrame, this);
        if (this.definition.style === 'sky') {
            hitbox.h += 16;
        }
        return hitbox;
    }
    update(state: GameState) {
        this.animationTime += FRAME_LENGTH;
        if (this.specialStatus === 'deploying') {
            state.hero.isControlledByObject = true;
            if (this.animationTime < throwTime) {
                this.y -= 5;
            } else if (this.animationTime === throwTime) {
                this.y = -200;
                this.x = this.definition.x;
            } else if (this.y < this.definition.y) {
                this.y = Math.min(this.y + 6, this.definition.y);
            } else {
                state.screenShakes = [{dx: 0, dy: 5, startTime: state.fieldTime, endTime: state.fieldTime + 1000}];
                playAreaSound(state, state.areaInstance, 'bossDeath');
                playAreaSound(state, state.areaInstance, 'cloneExplosion');
                delete this.specialStatus;
                // Should destroy anything the tower lands on that isn't immune to physical damage.
                hitTargets(state, this.area, {
                    damage: 100,
                    hitbox: this.getHitbox(),
                    hitEnemies: true,
                    source: null,
                });
            }
        } else if (this.specialStatus === 'collapsing') {
            state.hero.isControlledByObject = true;
            if (this.animationTime === 400) {
                state.screenShakes = [{dx: 1, dy: 1, startTime: state.fieldTime}];
            } else if (this.animationTime === 800) {
                state.screenShakes = [{dx: 2, dy: 2, startTime: state.fieldTime}];
            } else if (this.animationTime === shakeTime) {
                state.screenShakes = [{dx: 1, dy: 1, startTime: state.fieldTime}];
            } else if (this.animationTime >= shakeTime + 200) {
                state.screenShakes = [];
            }
            if (this.animationTime >= shakeTime + shrinkTime + gatherTime) {
                // Pick up the staff at the end of the collapsing sequence.
                appendScript(state, '{item:staff=2}');
            } else if (this.animationTime >= shakeTime + shrinkTime) {
                const hitbox = this.getHitbox();
                const heroBox = state.hero.getHitbox();
                const dx = (heroBox.x + heroBox.w / 2) - (hitbox.x + hitbox.w / 2);
                const dy = (heroBox.y + heroBox.h / 2) - (hitbox.y + hitbox.h / 2);
                const timeLeft = gatherTime - (this.animationTime - shakeTime - shrinkTime);
                this.x += dx * FRAME_LENGTH / timeLeft;
                this.y += dy * FRAME_LENGTH / timeLeft;
            }
        } else {
            // Do not update the door during the animations, it might overlap the character
            // and trigger entering the door.
            this.door.area = this.area;
            this.door.update(state);
        }
        // Need to udpate the door during animations that move the tower.
        this.door.x = this.x + 70;
        this.door.y = this.y + 138;
    }
    renderForeground(context: CanvasRenderingContext2D, state: GameState) {
        if (this.definition.style === 'sky' || this.definition.spirit) {
            return;
        }
        let scale = 1;
        if (this.specialStatus === 'collapsing') {
            if (this.animationTime >= shakeTime) {
                scale = Math.max(0.03, 1 - (this.animationTime - shakeTime) / shrinkTime);
            }
        }
        if (this.specialStatus === 'deploying' && this.animationTime < throwTime) {
            scale = 0.03;
        }
        context.save();
            if (scale !== 1) {
                context.globalAlpha *= Math.max(0, scale - 0.3);
            }
            drawFrameContentAt(context, staffTowerCloudFrame, {x: this.x - 8, y: this.y - 80});
        context.restore();
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        let scale = 1;
        if (this.specialStatus === 'collapsing') {
            if (this.animationTime >= shakeTime) {
                scale = Math.max(0.03, 1 - (this.animationTime - shakeTime) / shrinkTime);
            }
        }
        if (this.specialStatus === 'deploying' && this.animationTime < throwTime) {
            scale = 0.03;
        }
        context.save();
            if (scale !== 1) {
                const hitbox = this.getHitbox();
                context.translate(hitbox.x + hitbox.w / 2, hitbox.y + hitbox.h / 2);
                context.scale(scale, scale);
                //context.scale(scale, 1 - (1 - scale) * 0.8);
                context.translate(-(hitbox.x + hitbox.w / 2), -(hitbox.y + hitbox.h / 2));
            }
            // TODO: Use this mask to draw composite effets for the tower lights.
            // Matt grey or black when the tower is off.
            // shifting patterns of white and blue when it is on.
            let maskFrame = staffTowerMaskFrame;
            if (this.definition.style === 'sky') {
                maskFrame = this.definition.spirit ? staffTowerSpiritSkyMaskFrame : staffTowerSkyMaskFrame;
            } else {
                maskFrame = this.definition.spirit ? staffTowerSpiritMaskFrame : staffTowerMaskFrame;
            }
            maskContext.clearRect(0, 0, glowCanvas.width, glowCanvas.height);
            maskContext.globalCompositeOperation = 'source-over';
            drawFrame(maskContext, maskFrame, {...maskFrame, x: 0, y: 0});
            const towerIsOn = !!state.savedState.objectFlags.elementalBeastsEscaped;
            const towerIsHaywire = towerIsOn && !state.savedState.objectFlags.stormBeast;
            //const towerIsHaywire = false;
            if (towerIsOn) {
                maskContext.globalCompositeOperation = 'source-in';

                // Just fade between white/black
                //let n = ((this.animationTime / 100) % 30) | 0;
                //if (n >= 15) n = 30 - n;
                //const c = '0123456789ABCDEF'[Math.floor(n)];
                //glowContext.fillStyle = `#${c}${c}${c}`;
                // Theses values are chosen so that the split is between distinct veins on the tower.
                const backgroundColor = this.definition.spirit ? '#40A': 'black';

                const r = towerIsHaywire ? 30 : 50;
                if (this.definition.style !== 'sky') {
                    const rects = [
                        {x: 0, y: 115, w: 41, h: 53},// 41x53 234, 132
                        {x: 25, y: 85, w: 25, h: 46}, //49x46, 234,102
                        {x: 0, y: 154, w: 16, h: 38},// 16x38, 234, 171
                        {x: 21, y: 169, w: 59, h: 37},// 59x37, 255, 186
                        {x: 62, y: 127, w: 63, h: 33},// 63x33, 296, 144
                        {x: 92, y: 164, w: 44, h: 72},// 44x72, 326,181
                        {x: 137, y: 164, w: 34, h: 43},// 34x43, 371,181
                        {x: 151, y: 97, w: 20, h: 58},// 20x58, 385,114
                        {x: 18, y: 205, w: 21, h: 24},// 24, 252,222
                    ];
                    // Set this
                    const duration = towerIsHaywire ? 1000 : 6000;
                    for (let i = 0; i < rects.length; i++) {
                        const rect = rects[i];
                        let p = ((this.animationTime + (duration * 0.45) * i) % duration) / duration;
                        p = (1 - Math.cos(p * Math.PI)) / 2;
                        //console.log(p);
                        let center = (maskFrame.w + 2 * r) * p - r;
                        // Hack to double the frequency of waves.
                        if (center > rect.x + rect.w + r || center < rect.x - r) {
                            p = ((this.animationTime + (duration * 0.45) * i + duration / 2) % duration) / duration;
                            p = (1 - Math.cos(p * Math.PI)) / 2;
                            //console.log(p);
                            center = (maskFrame.w + 2 * r) * p - r;
                        }
                        const gradient = glowContext.createLinearGradient(center - r, 0, center + r, 0);
                        gradient.addColorStop(0, backgroundColor);
                        // purple: '#A0F'
                        gradient.addColorStop(0.5, this.definition.spirit ? '#FF4' : '#8FF');
                        gradient.addColorStop(0.52, this.definition.spirit ? 'white': 'white');
                        gradient.addColorStop(0.54, backgroundColor);
                        glowContext.fillStyle = gradient;
                        glowContext.beginPath();
                        glowContext.fillRect(rect.x, rect.y, rect.w, rect.h);
                    }
                } else {
                    const h = this.definition.style === 'sky' ? 111 : 117;
                    for (let y = 90, i = 0; y < maskFrame.h; y += h, i++) {
                        let p = ((this.animationTime + 1000 * i) % 2000) / 2000;
                        p = (1 - Math.cos(p * Math.PI)) / 2;
                        const center = (maskFrame.w + r) * p;
                        const gradient = glowContext.createLinearGradient(center - r, 0, center + r, 0);
                        gradient.addColorStop(0, backgroundColor);
                        // purple: '#A0F'
                        gradient.addColorStop(0.5, this.definition.spirit ? '#FF4' : '#8FF');
                        gradient.addColorStop(0.52, this.definition.spirit ? 'white': 'white');
                        gradient.addColorStop(0.54, backgroundColor);
                        glowContext.fillStyle = gradient;
                        glowContext.beginPath();
                        glowContext.fillRect(0, y, maskFrame.w, h);
                    }
                }


                drawFrame(maskContext, {...maskFrame, image: glowCanvas, x: 0, y: 0}, {...maskFrame, x: 0, y: 0});
            }
            drawFrameContentAt(context, {...maskFrame, image: maskCanvas, x: 0, y: 0}, this);
            //drawFrameContentAt(context, {...maskFrame, image: glowCanvas, x: 0, y: 0}, this);
            if (this.definition.style === 'sky') {
                if (this.definition.spirit) {
                    drawFrameContentAt(context, staffTowerSpiritSkyFrame, this);
                } else {
                    drawFrameContentAt(context, staffTowerSkyFrame, this);
                }
                this.balcony.render(context, state);
            } else {
                if (this.definition.spirit) {
                    drawFrameContentAt(context, staffTowerSpiritFrame, this);
                } else {
                    drawFrameContentAt(context, staffTowerFrame, this);
                }
            }
            // HACK: Draw two additional copies of the tower when it is shrinking to make it taller
            // to match the shape of the full tower better, since the graphic itself is truncated.
            if (scale < 1) {
                context.save();
                context.translate(0, -100 * (1 - scale));
                drawFrameContentAt(context, {...maskFrame, image: maskCanvas, x: 0, y: 0}, this);
                //drawFrameContentAt(context, {...maskFrame, image: glowCanvas, x: 0, y: 0}, this);
                if (this.definition.style === 'sky') {
                    if (this.definition.spirit) {
                        drawFrameContentAt(context, staffTowerSpiritSkyFrame, this);
                    } else {
                        drawFrameContentAt(context, staffTowerSkyFrame, this);
                    }
                } else {
                    if (this.definition.spirit) {
                        drawFrameContentAt(context, staffTowerSpiritFrame, this);
                    } else {
                        drawFrameContentAt(context, staffTowerFrame, this);
                    }
                }
                context.restore();
            }
            if (scale < 1) {
                context.save();
                context.translate(0, -200 * (1 - scale));
                drawFrameContentAt(context, {...maskFrame, image: maskCanvas, x: 0, y: 0}, this);
                //drawFrameContentAt(context, {...maskFrame, image: glowCanvas, x: 0, y: 0}, this);
                if (this.definition.style === 'sky') {
                    if (this.definition.spirit) {
                        drawFrameContentAt(context, staffTowerSpiritSkyFrame, this);
                    } else {
                        drawFrameContentAt(context, staffTowerSkyFrame, this);
                    }
                } else {
                    if (this.definition.spirit) {
                        drawFrameContentAt(context, staffTowerSpiritFrame, this);
                    } else {
                        drawFrameContentAt(context, staffTowerFrame, this);
                    }
                }
                context.restore();
            }
        context.restore();
    }
}

export class StaffTowerTop implements ObjectInstance {
    get area() {
        return this.staffTower.area;
    }
    drawPriority: DrawPriority = 'sprites';
    isObject = <const>true;
    ignorePits = true;
    x: number = this.staffTower.x;
    y: number = this.staffTower.y;
    status: ObjectStatus = 'normal';
    constructor(public staffTower: StaffTower) {}

    // This draws the top 200px of the top layer of the tower, which includes all of the
    // graphics that need to be drawn in front of objects that might pass behind it.
    render(context: CanvasRenderingContext2D, state: GameState) {
        let scale = 1;
        if (this.staffTower.specialStatus === 'collapsing') {
            if (this.staffTower.animationTime >= shakeTime) {
                scale = Math.max(0.03, 1 - (this.staffTower.animationTime - shakeTime) / shrinkTime);
            }
        }
        if (this.staffTower.specialStatus === 'deploying' && this.staffTower.animationTime < throwTime) {
            scale = 0.03;
        }
        context.save();
            if (scale !== 1) {
                const hitbox = this.staffTower.getHitbox();
                context.translate(hitbox.x + hitbox.w / 2, hitbox.y + hitbox.h / 2);
                context.scale(scale, scale);
                //context.scale(scale, 1 - (1 - scale) * 0.8);
                context.translate(-(hitbox.x + hitbox.w / 2), -(hitbox.y + hitbox.h / 2));
            }
            //drawFrameContentAt(context, {...maskFrame, image: glowCanvas, x: 0, y: 0}, this);
            if (this.staffTower.definition.style === 'sky') {
                if (this.staffTower.definition.spirit) {
                    drawFrameContentAt(context, {...staffTowerSpiritSkyFrame, h: 200}, this.staffTower);
                } else {
                    drawFrameContentAt(context, {...staffTowerSkyFrame, h: 200}, this.staffTower);
                }
            } else {
                if (this.staffTower.definition.spirit) {
                    drawFrameContentAt(context, {...staffTowerSpiritFrame, h: 200}, this.staffTower);
                } else {
                    drawFrameContentAt(context, {...staffTowerFrame, h: 200}, this.staffTower);
                }
            }
            this.staffTower.door.area = this.staffTower.area;
            this.staffTower.door.render(context, state);
        context.restore();
    }
}

const [/*balconyCanvas*/, balconyContext] = createCanvasAndContext(staffTowerSkyBalconyFrame.w, staffTowerSkyBalconyFrame.h);
const createHorizontalBelt = async () => {
    await allImagesLoaded();
    drawFrameContentAt(balconyContext, staffTowerSkyBalconyFrame, {x: 0, y: 0});
}
createHorizontalBelt();
//window["debugCanvas"](balconyCanvas, 2);


export class Balcony implements ObjectInstance {
    get area(): AreaInstance {
        return this.staffTower.area;
    }
    drawPriority: 'background' = 'background';
    status: ObjectStatus;
    x: number = this.staffTower.x + 22;
    // Because the 'isGround' behavior ignores solid walls, this position has to be exact
    // to prevent the hero from being able to enter the door when it is closed.
    y: number = this.staffTower.y + 148;
    ignorePits = true;
    isObject = <const>true;
    renderParent = this.staffTower;
    constructor(public staffTower: StaffTower) {}
    getHitbox(): Rect {
        return getFrameHitbox(staffTowerSkyBalconyFrame, this);
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        if (this.staffTower.definition.spirit) {
            drawFrameContentAt(context, staffTowerSpiritSkyBalconyFrame, this);
        } else {
            drawFrameContentAt(context, staffTowerSkyBalconyFrame, this);
        }
    }
    getBehaviors(state: GameState, x?: number, y?: number): TileBehaviors {
        if (typeof x === 'undefined') {
            return {isGround: true, groundHeight: 1};
        }
        // If we have to adjust the graphics, we might use the below code to prevent moving through the tower
        // the exact number might need to be adjusted depending on the relative position of the balcony.
        // This prevents overriding the behavior of the tower+door, otherwise this would let you walk
        // through the tower+solid parts of the door.
        if (y < this.y + 22 && x > this.x + 40 && x < this.x + 93) {
            return {};
        }
        //console.log(x, y);
        //console.log(x - this.x, y -this.y, balconyContext.getImageData(x - this.x, y -this.y, 1, 1).data);
        const [r,/*g*/,/*b*/,alpha] = balconyContext.getImageData(x - this.x, y -this.y, 1, 1).data;
        //console.log(alpha);
        //console.log(r);
        if (alpha && r >= 203) {
            return {isGround: true, groundHeight: 1};
        }
        if (alpha) {
            if (this.staffTower.definition.spirit) {
                return {};
            }
            return {pit: true, pitWall: true};
        }
        return {};
    }
}

objectHash.staffTower = StaffTower;
