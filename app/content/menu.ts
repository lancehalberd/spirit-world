import { getLootHelpMessage, getLootName } from 'app/content/loot';
import { isRandomizer } from 'app/gameConstants';
import { editingState } from 'app/development/editingState';



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
    if (type === 'help') {
        return 'Hint';
    }
    if (type === 'return') {
        return 'Return Home';
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
    // If this is actually changing boots, asign the current boots to the
    // previously equipped boots slot. This is used for swapping back to cloud boots
    // while underwater.
    if (state.hero.savedData.equippedBoots !== boots) {
        state.hero.savedData.previousBoots = state.hero.savedData.equippedBoots;
    }
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
