import { getOrAddLayer } from 'app/utils/layers';
import { addRoomFrame } from 'app/generator/skeletons/basic';


interface ZoneGeneratorParams {
    zoneId: string
    random: SRandom
}

export function populateTombBoss({zoneId, random}: ZoneGeneratorParams, node: TreeNode) {
    addRoomFrame(random, node);
    const cx = (node.baseAreaSection.x + node.baseAreaSection.w / 2) * 16 + 8;
    node.baseArea.objects.push({
        type: 'boss',
        enemyType: 'golem',
        lootType: 'peachOfImmortality',
        id: `${node.id}-boss`,
        d: 'down',
        status: 'normal',
        x: cx - 32,
        y: node.baseAreaSection.y * 16 + 48,
    });
}

export function populateTombGuardianRoom({zoneId, random}: ZoneGeneratorParams, node: TreeNode) {
    addRoomFrame(random, node);
    // TODO: Add eye decorations in front of exit door
    // TODO: Add decorations around portal
    // TODO: Add decorations around pots+portal switch
    let x = (node.baseAreaSection.x + node.baseAreaSection.w / 2) * 16;
    let y = (node.baseAreaSection.y + 1 ) * 16;
    node.baseArea.objects.push({
        type: 'door',
        id: 'tombExit',
        style: 'stone',
        status: 'closedSwitch',
        d: 'up',
        targetZone: 'cocoon',
        targetObjectId: 'cocoonEntrance',
        linked: true,
        saveStatus: 'forever',
        x: x - 16, y,
    });
    node.childArea.objects.push({
        type: 'door',
        id: 'tombSpiritExit',
        style: 'stone',
        spirit: true,
        status: 'closedSwitch',
        d: 'up',
        targetZone: zoneId,
        targetObjectId: 'tombSpiritExit',
        linked: true,
        saveStatus: 'forever',
        x: x - 16, y
    });
    y += 48;
    for (let dx = -1; dx < 2; dx += 2) {
        node.childArea.objects.push({type: 'pushPull', x: x + dx * 3 * 16 - 8, y, spirit: true});
        node.childArea.objects.push({type: 'floorSwitch', targetObjectId: 'tombSpiritExit', toggleOnRelease: true, spirit: true, x: x + dx * 4 * 16 - 8, y});
    }

    const fieldLayer = getOrAddLayer('field', node.baseArea, node.childArea);
    const stoneTiles = [6, 6, 7];
    for (y = node.baseAreaSection.y + 6; y <= node.baseAreaSection.y + 7; y++) {
        for (x = node.baseAreaSection.x + 2; x < node.baseAreaSection.x + node.baseAreaSection.w - 1; x++) {
            if (x < node.baseAreaSection.x + 6 || x > node.baseAreaSection.x + 9) {
                fieldLayer.grid.tiles[y][x] = 10;
            } else {
                fieldLayer.grid.tiles[y][x] = random.element(stoneTiles);
            }

        }
    }

    y = (node.baseAreaSection.y + 9) * 16;
    node.baseArea.objects.push({
        type: 'npc',
        style: 'vanaraBlue',
        dialogueKey: 'tombGuardian',
        behavior: 'none',
        x: (node.baseAreaSection.x + 5) * 16,
        y, d: 'down',
    });

    node.baseArea.objects.push({
        type: 'teleporter', status: 'hidden', id: 'tombTeleporter',
        targetZone: 'overworld', targetObjectId: 'tombTeleporter',
        x: (node.baseAreaSection.x + node.baseAreaSection.w - 5) * 16, y,
    });

    const specialPot = random.range(0, 2);
    y = (node.baseAreaSection.y + 12) * 16;
    for (let i = 0; i < 3; i++) {
        const x = (node.baseAreaSection.x + 4 + i) * 16;
        node.baseArea.objects.push({type: 'pushPull',  linked: i === specialPot, x, y});
        if (i === specialPot) {
            node.childArea.objects.push({type: 'pushPull', spirit: true, linked: true, x, y});
        }
    }
    x = (node.baseAreaSection.x + node.baseAreaSection.w - 5) * 16
    node.childArea.objects.push({ id: 'tombTeleporter', x, y, type: 'floorSwitch', saveStatus: 'forever'});
}
