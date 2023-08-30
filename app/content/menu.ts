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
    if (elements.length) {
        menuRows.push(elements);
    }

    let passiveToolRow: MenuOptionType[] = [];
    for (let key in state.hero.savedData.passiveTools) {
        if (!state.hero.savedData.passiveTools[key] && !editingState.isEditing) continue;
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
    for (const hero of [state.hero, ...state.hero.clones]) {
        hero.equippedBoots = boots;
    }
}

// Function to set the equipped element on all copies of the hero.
export function setEquippedElement(state: GameState, element: MagicElement): void {
    for (const hero of [state.hero, ...state.hero.clones]) {
        hero.setElement(element);
    }
}
