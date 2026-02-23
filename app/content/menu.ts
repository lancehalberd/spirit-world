import {getLootFrame, getLootHelpMessage, getLootName, lootFrames, neutralElement} from 'app/content/loot';
import {isRandomizer, MAX_FLOAT_HEIGHT} from 'app/gameConstants';
import {editingState} from 'app/development/editingState';
import {playAreaSound} from 'app/musicController';
import {showMessage} from 'app/scriptEvents';
import {createAnimation, drawFrameCenteredAt} from 'app/utils/animations';
import {fillRect, pad} from 'app/utils/index';
import {isActiveTool, isMagicElement} from 'app/utils/loot';

type ExtendedMenuOptionType = MenuOptionType | 'armor' | 'crown';

export const frameSize = 24;
const elementGeometry: Rect = {
    x: 0, y: 0,
    w: frameSize, h: frameSize,
};

const emptyMenuElement: MenuElement = {
    ...elementGeometry,
    label: '',
    isVisible: () => false,
    render() {

    },
    onSelect() {
        return false;
    },
};

export const yellowFrame = createAnimation('gfx/hud/toprighttemp1.png', {w: 24, h: 24}).frames[0];
export const blueFrame = createAnimation('gfx/hud/toprighttemp2.png', {w: 24, h: 24}).frames[0];
export const cursorFrame = createAnimation('gfx/hud/cursortemp.png', {w: 24, h: 24}).frames[0];
export const mapFrame = lootFrames.map;
export const [keyFrame, bigKeyFrame] = createAnimation('gfx/hud/icons.png',
    {w: 20, h: 20, content: {x: 2, y: 2, w: 16, h: 16}}, {x: 2, cols: 2}
).frames;

const neutralElementMenuOption: MenuElement = {
    ...elementGeometry,
    label: 'Neutral',
    isVisible: (state: GameState) => !!(
        state.hero.savedData.elements.fire ||
        state.hero.savedData.elements.ice ||
        state.hero.savedData.elements.lightning
    ),
    render(context: CanvasRenderingContext2D, state: GameState) {
        drawFrameCenteredAt(context, neutralElement, this);
    },
    onSelect(state: GameState, toolIndex?: number) {
        setEquippedElement(state, null);
        return false;
    }
};

function getMenuElement(state: GameState, option: ExtendedMenuOptionType): MenuElement {
    switch (option) {
        case 'map': return dungeonMapMenuOption;
        case 'bigKey': return bigKeyMenuOption;
        case 'smallKey': return smallKeyMenuOption;
        case 'neutral': return neutralElementMenuOption;
    }
    if (isMagicElement(option)) {
        return {
            ...elementGeometry,
            label: getLootName(state, option),
            isVisible: (state: GameState) => !!state.hero.savedData.elements[option],
            isSelected: (state: GameState) => state.hero.savedData.element === option,
            render(context: CanvasRenderingContext2D, state: GameState) {
                const frame = getLootFrame(state, { lootType: option, lootLevel: state.hero.savedData.elements[option] || 1 });
                drawFrameCenteredAt(context, frame, this);
            },
            renderSelection(context: CanvasRenderingContext2D, state: GameState) {
                fillRect(context, this, 'white');
                fillRect(context, pad(this, -2), 'black');
            },
            onSelect(state: GameState, toolIndex?: number) {
                setEquippedElement(state, option);
                return false;
            },
            onUpgrade(state: GameState) {
                state.hero.savedData.elements[option] = state.hero.savedData.elements[option] ? 0 : 1;
            }
        };
    }
    if (isActiveTool(option)) {
        return {
            ...elementGeometry,
            label: getLootName(state, option),
            isVisible: (state: GameState) => !!state.hero.savedData.activeTools[option],
            isSelected: (state: GameState) => state.hero.savedData.leftTool === option ||state.hero.savedData.rightTool === option,
            render(context: CanvasRenderingContext2D, state: GameState) {
                const frame = getLootFrame(state, { lootType: option, lootLevel: state.hero.savedData.activeTools[option] || 1 });
                drawFrameCenteredAt(context, frame, this);
            },
            renderSelection(context: CanvasRenderingContext2D, state: GameState) {
                if (state.hero.savedData.leftTool === option) {
                    drawFrameCenteredAt(context, blueFrame, this);
                }
                if (state.hero.savedData.rightTool === option) {
                    drawFrameCenteredAt(context, yellowFrame, this);
                }
            },
            onSelect(state: GameState, toolIndex?: number) {
                if (toolIndex === 1) {
                    if (state.hero.savedData.leftTool === option) {
                        setLeftTool(state, state.hero.savedData.rightTool);
                    }
                    setRightTool(state, option as ActiveTool);
                } else {
                    // Assign to left tool as default action.
                    // If a generic confirm key was pressed, cycle the current left tool
                    // over to the right tool slot.
                    if (toolIndex !== 0 && state.hero.savedData.leftTool !== option) {
                        setRightTool(state, state.hero.savedData.leftTool);
                    }
                    if (state.hero.savedData.rightTool === option) {
                        setRightTool(state, state.hero.savedData.leftTool);
                    }
                    setLeftTool(state, option as ActiveTool);
                }
                return false;
            },
            onUpgrade(state: GameState) {
                state.hero.savedData.activeTools[option] = ((state.hero.savedData.activeTools[option] || 0) + 1) % 4;
            }
        };
    }

    return emptyMenuElement;
}

function createMenuPanel(options: MenuElement[], rows: number, columns: number, {x, y, w, h}: Rect): MenuPanel {
    return {
        x, y, w, h,
        rows,
        columns,
        options,
    };
}

export function getMenuPanels(state: GameState): MenuPanel[] {
    const panels: MenuPanel[] = [
        createMenuPanel(getEquipmentOptions(state), 4, 2, {x: 0, y: 0, w: 48, h: 96}),
        createMenuPanel(getElementOptions(state), 4, 1, {x: 56, y: 0, w: 24, h: 96}),
        createMenuPanel(getToolOptions(state), 1, 4, {x: 88, y: 0, w: 96, h: 24}),
        createMenuPanel(getBootOptions(state), 1, 3, {x: 88, y: 32, w: 72, h: 24}),
        createMenuPanel(getEyesOptions(state), 1, 3, {x: 88, y: 64, w: 72, h: 24}),
        createMenuPanel(getTechniqueOptions(state), 1, 3, {x: 88, y: 96, w: 72, h: 24}),
        /*{
            x: 0, y: 0, w: 2, h: 4,
            rows: 4,
            columns: 2,
            options: getEquipmentOptions(state),
        },
        {
            x: 2, y: 0, w: 1, h: 4,
            options: getElementOptions(state),
        },
        {
            x: 3, y: 0, w: 4, h: 1,
            options: getToolOptions(state),
        },
        {
            x: 3, y: 1, w: 3, h: 1,
            options: getBootOptions(state),
        },
        {
            x: 3, y: 2, w: 4, h: 1,
            options: getEyesOptions(state),
        },
        {
            x: 3, y: 3, w: 4, h: 1,
            options: getTechniqueOptions(state),
        }*/
    ];

    return panels;
}

export function updateMenuState(state: GameState) {
    state.fieldMenuState.panels = getMenuPanels(state);
    for (const panel of state.fieldMenuState.panels) {
        let row = 0, column = 0;
        for (const element of panel.options) {
            element.x = column * frameSize;
            element.y = row * frameSize;
            column++;
            if (column >= panel.columns) {
                row++;
                column = 0;
            }
        }
    }
    const grid: MenuElement[][] = [];
    for (const panel of state.fieldMenuState.panels) {
        for (let y = 0; y < panel.h; y++) {
            grid[panel.y + y] = grid[panel.y + y] || [];
            for (let x = 0; x < panel.w; x++) {
                grid[panel.y + y][panel.x + x] = panel.options[y * panel.w + x];
            }
        }
    }
    state.fieldMenuState.grid = grid;
}


export function getEquipmentOptions(state: GameState): MenuElement[] {
    return (<const>[
        'weapon', 'weapon2',
        'armor', 'crown',
        'gloves', 'fireBlessing',
        'waterBlessing', 'lightningBlessing',
    ]).map(option => getMenuElement(state, option));
}

export function getElementOptions(state: GameState): MenuElement[] {
    return (<const>['neutral', 'fire', 'ice', 'lightning']).map(option => getMenuElement(state, option));
}

export function getToolOptions(state: GameState): MenuElement[] {
    return (<const>['bow', 'cloak', 'staff', 'clone']).map(option => getMenuElement(state, option));
}

export function getBootOptions(state: GameState): MenuElement[] {
    return (<const>['leatherBoots', 'ironBoots', 'cloudBoots']).map(option => getMenuElement(state, option));
}

export function getEyesOptions(state: GameState): MenuElement[] {
    return (<const>['catEyes', 'spiritSight', 'trueSight']).map(option => getMenuElement(state, option));
}

export function getTechniqueOptions(state: GameState): MenuElement[] {
    return (<const>['roll', 'teleportation', 'ironSkin']).map(option => getMenuElement(state, option));
}

function getDungeonItems(state: GameState) {
    if (!state.savedState.dungeonInventories[state.location.logicalZoneKey]) {
        state.savedState.dungeonInventories[state.location.logicalZoneKey] = {bigKey: false, map: false, smallKeys: 0, totalSmallKeys: 0};
    }
    return state.savedState.dungeonInventories[state.location.logicalZoneKey];
}
const dungeonMapMenuOption: MenuElement = {
    ...elementGeometry,
    label: 'Map',
    isVisible: (state: GameState) => getDungeonItems(state).map,
    render(context: CanvasRenderingContext2D, state: GameState) {
        drawFrameCenteredAt(context, mapFrame, this);
    },
    onSelect(state: GameState, toolIndex?: number) {
        showMessage(state, getLootHelpMessage(state, 'map'));
        return false;
    },
    onUpgrade(state: GameState) {
        const dungeonItems = getDungeonItems(state);
        dungeonItems.map = !dungeonItems.map;
    }
};
const bigKeyMenuOption: MenuElement = {
    ...elementGeometry,
    label: 'Big Key',
    isVisible: (state: GameState) => getDungeonItems(state).bigKey,
    render(context: CanvasRenderingContext2D, state: GameState) {
        drawFrameCenteredAt(context, bigKeyFrame, this);
    },
    onSelect(state: GameState, toolIndex?: number) {
        showMessage(state, getLootHelpMessage(state, 'bigKey'));
        return false;
    },
    onUpgrade(state: GameState) {
        const dungeonItems = getDungeonItems(state);
        dungeonItems.bigKey = !dungeonItems.bigKey;
    }
};
const smallKeyMenuOption: MenuElement = {
    ...elementGeometry,
    label: 'Small Key',
    isVisible: (state: GameState) => getDungeonItems(state).totalSmallKeys > 0,
    render(context: CanvasRenderingContext2D, state: GameState) {
        drawFrameCenteredAt(context, keyFrame, this);
    },
    onSelect(state: GameState, toolIndex?: number) {
        showMessage(state, getLootHelpMessage(state, 'smallKey'));
        return false;
    },
    onUpgrade(state: GameState) {
        const dungeonItems = getDungeonItems(state);
        dungeonItems.smallKeys = ((dungeonItems.smallKeys || 0) + 1) % 5;
        dungeonItems.totalSmallKeys = dungeonItems.smallKeys;
    }
};
export function getDungeonOptions(state: GameState): MenuElement[] {
    return [dungeonMapMenuOption, bigKeyMenuOption, smallKeyMenuOption];
}

/*
export function getEquipmentOptions(state: GameState): MenuOptionType[] {
    const isEditing = editingState.isEditing;
    return [
        (state.hero.savedData.weapon & 1 || isEditing) ? 'weapon' : null,
        (state.hero.savedData.weapon & 2 || isEditing) ? 'weapon2' : null,
        state.hero.savedData.passiveTools.goldMail
            ? 'goldMail'
            : (state.hero.savedData.passiveTools.silverMail || isEditing ? 'silverMail' : null),
        state.hero.savedData.passiveTools.phoenixCrown
            ? 'phoenixCrown'
            : (state.hero.savedData.passiveTools.astralProjection || isEditing ? 'astralProjection' : null),
        state.hero.savedData.passiveTools.gloves || isEditing ? 'gloves' : null,
        state.hero.savedData.passiveTools.fireBlessing || isEditing ? 'fireBlessing' : null,
        state.hero.savedData.passiveTools.waterBlessing || isEditing ? 'waterBlessing' : null,
        state.hero.savedData.passiveTools.lightningBlessing || isEditing ? 'lightningBlessing' : null,
    ];
}

export function getElementOptions(state: GameState): MenuOptionType[] {
    const hasElements = state.hero.savedData.elements.fire || state.hero.savedData.elements.ice || state.hero.savedData.elements.lightning;
    return [
        (hasElements || editingState.isEditing) ? 'neutral' : null,
        (state.hero.savedData.elements.fire || editingState.isEditing) ? 'fire' : null,
        (state.hero.savedData.elements.ice || editingState.isEditing) ? 'ice' : null,
        (state.hero.savedData.elements.lightning || editingState.isEditing) ? 'lightning' : null,
    ];
}

export function getToolOptions(state: GameState): MenuOptionType[] {
    return [
        state.hero.savedData.activeTools.bow || editingState.isEditing ? 'bow' : null,
        state.hero.savedData.activeTools.staff || editingState.isEditing ? 'bow' : null,
        state.hero.savedData.activeTools.cloak || editingState.isEditing ? 'cloak' : null,
        state.hero.savedData.activeTools.clone || editingState.isEditing ? 'clone' : null,
    ];
}

export function getBootOptions(state: GameState): MenuOptionType[] {
    return [
        'leatherBoots',
        state.hero.savedData.equipment.ironBoots || editingState.isEditing ? 'ironBoots' : null,
        state.hero.savedData.equipment.cloudBoots || editingState.isEditing ? 'cloudBoots' : null,
    ];
}

export function getEyesOptions(state: GameState): MenuOptionType[] {
    const isEditing = editingState.isEditing;
    return [
        state.hero.savedData.passiveTools.catEyes || isEditing ? 'catEyes' : null,
        state.hero.savedData.passiveTools.spiritSight || isEditing ? 'spiritSight' : null,
        state.hero.savedData.passiveTools.trueSight || isEditing ? 'trueSight' : null,
    ];
}

export function getTechniqueOptions(state: GameState): MenuOptionType[] {
    const isEditing = editingState.isEditing;
    return [
        state.hero.savedData.passiveTools.roll || isEditing ? 'roll' : null,
        state.hero.savedData.passiveTools.teleportation || isEditing ? 'teleportation' : null,
        state.hero.savedData.passiveTools.ironSkin || isEditing ? 'ironSkin' : null,
    ];
}

export function getDungeonOptions(state: GameState): MenuOptionType[] {
    state.savedState.dungeonInventories[state.location.logicalZoneKey]
        = state.savedState.dungeonInventories[state.location.logicalZoneKey] || {bigKey: false, map: false, smallKeys: 0, totalSmallKeys: 0};
    return [

    ]
}
*/

export function getMenuRows(state: GameState): MenuOptionType[][] {
    const menuRows: MenuOptionType[][] = [];
    const activeTools: MenuOptionType[] = ['help'];
    if (isRandomizer) {
        activeTools.push('return');
    }
    // Active tools
    if (state.hero.savedData.activeTools.bow || editingState.isEditing) {
        activeTools.push('bow');
    }
    if (state.hero.savedData.activeTools.staff || editingState.isEditing) {
        activeTools.push('staff');
    }
    if (state.hero.savedData.activeTools.cloak || editingState.isEditing) {
        activeTools.push('cloak');
    }
    if (state.hero.savedData.activeTools.clone || editingState.isEditing) {
        activeTools.push('clone');
    }
    menuRows.push(activeTools);

    const equipment: MenuOptionType[] = ['leatherBoots'];
    if (state.hero.savedData.equipment.ironBoots || editingState.isEditing) {
        equipment.push('ironBoots');
    }
    if (state.hero.savedData.equipment.cloudBoots || editingState.isEditing) {
        equipment.push('cloudBoots');
    }
    menuRows.push(equipment);

    const elements: MenuOptionType[] = [];
    if (state.hero.savedData.elements.fire || state.hero.savedData.elements.ice || state.hero.savedData.elements.lightning || editingState.isEditing) {
        elements.push('neutral');
    }
    if (state.hero.savedData.elements.fire || editingState.isEditing) {
        elements.push('fire');
    }
    if (state.hero.savedData.elements.ice || editingState.isEditing) {
        elements.push('ice');
    }
    if (state.hero.savedData.elements.lightning || editingState.isEditing) {
        elements.push('lightning');
    }
    menuRows.push(elements);

    let passiveToolRow: MenuOptionType[] = [];
    for (let key in state.hero.savedData.passiveTools) {
        if (!state.hero.savedData.passiveTools[key as PassiveTool] && !editingState.isEditing) continue;
        // Don't show cat eyes once true sight is obtained.
        if (key === 'catEyes' && state.hero.savedData.passiveTools.trueSight && !editingState.isEditing) continue;
        passiveToolRow.push(key as MenuOptionType);
        if (passiveToolRow.length >= 7) {
            menuRows.push(passiveToolRow);
            passiveToolRow = [];
        }
    }
    if (passiveToolRow.length) {
        menuRows.push(passiveToolRow);
    }

    return menuRows;
}

export function getMenuName(state: GameState, type: MenuOptionType): string {
    if (!type) {
        return '';
    }
    if (type === 'help') {
        return 'Hint';
    }
    if (type === 'return') {
        return 'Return Home';
    }
    if (type === 'weapon') {
        return 'Chakram';
    }
    if (type === 'weapon2') {
        return 'Gold Chakram';
    }
    return getLootName(state, type);
}

export function getMenuTip(state: GameState, type: MenuOptionType): {buttons: string, action: string} | null {
    if (type === 'help') {
        return {
            buttons: '[B_WEAPON]',
            action: 'Show',
        };
    }
    if (type === 'return' || type === 'nimbusCloud') {
        return {
            buttons: '[B_WEAPON]',
            action: 'Use',
        };
    }
    if (type === 'bow' || type === 'staff' || type === 'cloak' || type === 'clone') {
        return {
            buttons: '[B_LEFT_TOOL]/[B_RIGHT_TOOL]',
            action: 'Equip',
        };
    }
    if (type === 'fire' || type === 'ice' || type === 'lightning') {
        if (state.hero.savedData.element === type) {
            return {
                buttons: '[B_WEAPON]',
                action: 'Unequip',
            };
        }
        return {
            buttons: '[B_WEAPON]',
            action: 'Unequip',
        };
    }
    if (type === 'neutral') {
        if (state.hero.savedData.element === null) {
            return null
        }
        return {
            buttons: '[B_WEAPON]',
            action: 'Equip',
        };
    }
    if (type === 'leatherBoots' || type === 'ironBoots' || type === 'cloudBoots') {
        if (state.hero.savedData.equippedBoots === type) {
            return null
        }
        return {
            buttons: '[B_WEAPON]',
            action: 'Equip',
        };
    }
    return {
        buttons: '[B_WEAPON]',
        action: 'Help',
    };
}

export function getMenuHelpMessage(state: GameState, type: MenuOptionType): string {
    if (type === 'help') {
        return 'Hint';
    }
    if (type === 'return') {
        return 'Return Home';
    }
    if (type === 'weapon') {
        return getLootHelpMessage(state, 'weapon', 1);
    }
    if (type === 'weapon2') {
        return getLootHelpMessage(state, 'weapon', 2);
    }
    return getLootHelpMessage(state, type);
}

// Function to set the left tool on all copies of the hero.
export function setLeftTool(state: GameState, tool: ActiveTool): void {
    for (const hero of [state.hero, ...state.hero.clones]) {
        hero.savedData.leftTool = tool;
    }
}

// Function to set the right tool on all copies of the hero.
export function setRightTool(state: GameState, tool: ActiveTool): void {
    for (const hero of [state.hero, ...state.hero.clones]) {
        hero.savedData.rightTool = tool;
    }
}

// Function to set the equipped boots on all copies of the hero.
export function setEquippedBoots(state: GameState, boots: Equipment): void {
    // Do nothing if these boots are already equipped.
    if (state.hero.savedData.equippedBoots === boots) {
        return;
    }
    const delta = state.hero.savedData.equippedBoots === 'cloudBoots' ? MAX_FLOAT_HEIGHT : 0;
    // Player cannot change boots unless they are "on the ground".
    // This makes it so they can't toggle boots off/on repeatedly
    // to swim over pits without surfacing.
    // You can always put on iron boots in order to start sinking when floating under water.
    if (boots !== 'ironBoots' && state.hero.z > state.hero.groundHeight + delta) {
        playAreaSound(state, state.hero.area, 'error');
        return;
    }
    // Assign the current boots to the previously equipped boots slot.
    // This is used for swapping back to cloud boots while underwater.
    state.hero.savedData.previousBoots = state.hero.savedData.equippedBoots;
    for (const hero of [state.hero, ...state.hero.clones]) {
        hero.savedData.equippedBoots = boots;
    }
}

// Function to set the equipped element on all copies of the hero.
export function setEquippedElement(state: GameState, element: MagicElement): void {
    for (const hero of [state.hero, ...state.hero.clones]) {
        hero.setElement(element);
    }
}
