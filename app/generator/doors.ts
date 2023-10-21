


export type DoorData = {
    definition: EntranceDefinition
    w: number
    h: number
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
        baseDoorData.definition.x = tx * 16 - baseDoorData.w / 2;
        childDoorData.definition.x = tx * 16 - childDoorData.w / 2;
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
        // Keep left/right doors towards the center so that obstacles around doors do not
        // collide with eachother.
        const p = childNode?.doorP || random.element([0.5, 0.4, 0.6]);
        const cy = top + p * (bottom - top);
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
