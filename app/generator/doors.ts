import { clearTileInOneWorld } from 'app/generator/tiles';


type DoorType = 'door'|'upstairs'|'downstairs'|'ladder';

interface DoorContext extends SlotContext {
    doorType: DoorType
}

export type DoorData = {
    definition: EntranceDefinition
    w: number
    h: number
}


// TODO: support placing linked doors simultaneously.

// This returns w/h for the entrance so we don't have to recompute it from the resulting definition.
export function getEntranceDefintion({id = '', d, style, type}: {id: string, d: CardinalDirection, style: GenerationStyle, type: DoorType} ): {definition: EntranceDefinition, w: number, h: number} {
    let w = 32, h = 32;
    let computedStyle: string = 'stone';
    switch(style) {
        case 'stone':
            computedStyle = 'stone';
            break;
        case 'cave':
            computedStyle = 'cavern';
            break;
        case 'tree':
        case 'wooden':
            computedStyle = 'wooden';
            break;
        case 'crystalCave':
        case 'crystalPalace':
            computedStyle = 'crystal';
            break;
    }
    if (type === 'upstairs') {
        d = 'up';
        computedStyle = `${computedStyle}Upstairs`;
    } else if (type === 'downstairs') {
        d = 'up';
        computedStyle = `${computedStyle}Downstairs`;
    }
    if (type === 'ladder') {
        if (d === 'up') {
            computedStyle ='ladderUp';
            w = 16;
            h = 32;
        } else {
            d = 'down';
            computedStyle = 'ladderdown';
            w = 16;
            h = 16;
        }
    } else if (d === 'left' || d === 'right') {
        w = 16;
        h = 64;
    } else if (d === 'down') {
        w = 64;
        h = 16;
    }
    const definition: EntranceDefinition = {
        type: 'door',
        id,
        d,
        status: 'normal',
        style: computedStyle,
        x: 0,
        y: 0,
    };
    return {definition, w, h};
}


export function addDoor(context: DoorContext): EntranceDefinition {
    const {random, zoneId, roomId, slot, area, alternateArea, doorType} = context;
    // TODO: support other styles
    let d = slot.d, style = 'stone';
    if (doorType === 'upstairs') {
        d = 'up';
        // TODO: support other styles
        style = 'stoneUpstairs';
    }
    if (doorType === 'downstairs') {
        d = 'up';
        // TODO: support other styles
        style = 'stoneDownstairs';
    }
    if (doorType === 'ladder') {
        if (d === 'up') {
            style ='ladderUp';
        } else {
            d = 'down';
            style = 'ladderdown';
        }
    }
    const definition: EntranceDefinition = {
        type: 'door',
        id: `${zoneId}-${roomId}-${slot.id}`,
        d,
        status: 'normal',
        style,
        x: 0,
        y: 0,
    }
    random.generateAndMutate();
    if (doorType === 'door' && d === 'down') {
        const tx = random.range(slot.x, slot.x + slot.w - 4);
        const ty = slot.y + slot.h - 1;
        definition.x = tx * 16;
        definition.y = ty * 16;
        // Clear the foreground tiles from around the door.
        for (let y = 0; y < 2; y++) {
            for (let x = 0; x < 4; x++) {
                clearTileInOneWorld(area, alternateArea, 'foreground', tx + x, ty - 1 + y);
                clearTileInOneWorld(area, alternateArea, 'foreground2', tx + x, ty - 1 + y);
            }
        }
    } else if (d === 'up') {
        const tx = random.range(slot.x, slot.x + slot.w - 2);
        const ty = slot.y;
        definition.x = tx * 16;
        definition.y = ty * 16;
    } else if (d === 'left') {
        const tx = slot.x;
        const ty = random.range(slot.y, slot.y + slot.h - 4);
        definition.x = tx * 16;
        definition.y = ty * 16;
        // Clear the foreground tiles from around the door.
        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 2; x++) {
                clearTileInOneWorld(area, alternateArea, 'foreground', tx + x, ty + y);
                clearTileInOneWorld(area, alternateArea, 'foreground2', tx + x, ty + y);
            }
        }
    } else if (d === 'right') {
        const tx = slot.x + slot.w - 1;
        const ty = random.range(slot.y, slot.y + slot.h - 4);
        definition.x = tx * 16;
        definition.y = ty * 16;
        // Clear the foreground tiles from around the door.
        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 2; x++) {
                clearTileInOneWorld(area, alternateArea, 'foreground', tx - 1 + x, ty + y);
                clearTileInOneWorld(area, alternateArea, 'foreground2', tx - 1 + x, ty + y);
            }
        }
    }
    area.objects.push(definition);
    return definition;
}

function chooseStairDoorSlot(random: SRandom, parent: TreeNode, child: TreeNode): number {
    for (const node of [parent, child]) {
        if (!node.stairSlots) {
            node.stairSlots = [];
            for (let i = 4; i <= 28; i += 8) {
                if (i > node.baseAreaSection.x && i < node.baseAreaSection.x + node.baseAreaSection.w) {
                    node.stairSlots.push(i);
                }
            }
        }
    }
    random.generateAndMutate();
    for (const value of random.shuffle(parent.stairSlots)) {
        const childIndex = child.stairSlots.indexOf(value);
        if (childIndex >= 0) {
            const parentIndex = parent.stairSlots.indexOf(value);
            child.stairSlots.splice(childIndex, 1);
            parent.stairSlots.splice(parentIndex, 1);
            return value;
        }
    }
    console.error('Ran out of slots for northern doors');
    debugger;
    return Math.max(parent.baseAreaSection.x, child.baseAreaSection.x) + 2;
}

export function positionDoors(random: SRandom, baseDoorData: DoorData, baseNode: TreeNode, childDoorData?: DoorData, childNode?: TreeNode) {
    const baseAreaSection = baseNode.baseAreaSection;
    const childAreaSection = childNode?.baseAreaSection;
    // Choose x position for up/down doors

    if (childNode && childNode.coords.z !== baseNode.coords.z) {
        // Stair cases use specific slots so they won't collide with normal north doors.
        const tx = chooseStairDoorSlot(random, baseNode, childNode);
        baseDoorData.definition.x = tx * 16 + 8 - baseDoorData.w / 2;
        childDoorData.definition.x = tx * 16 + 8 - childDoorData.w / 2;
    } else if (baseDoorData.definition.d === 'up' || baseDoorData.definition.d === 'down') {
        // TODO: Handle ladders here
        let left = (baseAreaSection.x + 1) * 16;
        if (childAreaSection) {
            left = Math.max(left, (childAreaSection.x + 1) * 16);
        }
        let right = (baseAreaSection.x + baseAreaSection.w) * 16;
        if (childAreaSection) {
            right = Math.min(right, (childAreaSection.x + childAreaSection.w) * 16);
        }
        const cx = left + 0.5 * (right - left);
        baseDoorData.definition.x = cx - baseDoorData.w / 2;
        if (childDoorData) {
            childDoorData.definition.x = cx - childDoorData.w / 2;
        }
    } else if (baseDoorData.definition.d === 'left' || baseDoorData.definition.d === 'right') {
        // These don't have to be the actual top/bottom as long as they are the same distance from the center.
        let top = (baseAreaSection.y + 2) * 16;
        if (childAreaSection) {
            top = Math.max(top, (childAreaSection.y + 2) * 16);
        }
        let bottom = (baseAreaSection.y + baseAreaSection.h) * 16;
        if (childAreaSection) {
            bottom = Math.min(bottom, (childAreaSection.y + childAreaSection.h) * 16);
        }
        random.generateAndMutate();
        const cy = top + (bottom - top) / 2;
        baseDoorData.definition.y = cy - baseDoorData.h / 2;
        if (childDoorData) {
            childDoorData.definition.y = cy - childDoorData.h / 2;
        }
    }
    if (baseDoorData.definition.d === 'up') {
        baseDoorData.definition.y = baseAreaSection.y * 16 + 16;
        if (childDoorData) {
            if (childDoorData.definition.d === 'down') {
                childDoorData.definition.y = (childAreaSection.y + childAreaSection.h - 1) * 16;
            } else {
                childDoorData.definition.y = childAreaSection.y * 16 + 16;
            }
        }
    } else  if (baseDoorData.definition.d === 'down') {
        baseDoorData.definition.y = (baseAreaSection.y + baseAreaSection.h - 1) * 16;
        if (childDoorData) {
            childDoorData.definition.y = childAreaSection.y * 16 + 16;
        }
    } else  if (baseDoorData.definition.d === 'left') {
        baseDoorData.definition.x = baseAreaSection.x * 16 + 16;
        if (childDoorData) {
            childDoorData.definition.x = (childAreaSection.x + childAreaSection.w - 1) * 16;
        }
    } else  if (baseDoorData.definition.d === 'right') {
        baseDoorData.definition.x = (baseAreaSection.x + baseAreaSection.w - 1) * 16;
        if (childDoorData) {
            childDoorData.definition.x = childAreaSection.x * 16 + 16;
        }
    }
}

export function addDoorAndClearForegroundTiles(definition: EntranceDefinition, area: AreaDefinition, alternateArea: AreaDefinition) {
    area.objects.push(definition);

    if (definition.style !== 'ladderDown' && definition.d === 'down') {
        const left = Math.ceil(definition.x / 16), right = Math.floor((definition.x + 64) / 16);
        const top = ((definition.y / 16) | 0) - 1, bottom = top + 2;
        // Clear the foreground tiles from around the door.
        for (let y = top; y < bottom; y++) {
            for (let x = left; x < right; x++) {
                clearTileInOneWorld(area, alternateArea, 'foreground', x, y);
                clearTileInOneWorld(area, alternateArea, 'foreground2', x, y);
            }
        }
    } else if (definition.d === 'left') {
        const left = ((definition.x / 16) | 0), right = left + 2;
        const top = Math.ceil(definition.y / 16), bottom = Math.floor((definition.y + 64) / 16);
        // Clear the foreground tiles from around the door.
        for (let y = top; y < bottom; y++) {
            for (let x = left; x < right; x++) {
                clearTileInOneWorld(area, alternateArea, 'foreground', x, y);
                clearTileInOneWorld(area, alternateArea, 'foreground2', x, y);
            }
        }
    } else if (definition.d === 'right') {
        const left = ((definition.x / 16) | 0) - 1, right = left + 2;
        const top = Math.ceil(definition.y / 16), bottom = Math.floor((definition.y + 64) / 16);
        // Clear the foreground tiles from around the door.
        for (let y = top; y < bottom; y++) {
            for (let x = left; x < right; x++) {
                clearTileInOneWorld(area, alternateArea, 'foreground', x, y);
                clearTileInOneWorld(area, alternateArea, 'foreground2', x, y);
            }
        }
    }
}
