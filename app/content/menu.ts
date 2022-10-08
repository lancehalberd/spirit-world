import { GameState, LootType } from 'app/types';

export function getMenuRows(state: GameState): LootType[][] {
    const menuRows: LootType[][] = [];
    const activeTools: LootType[] = ['help'];
    // Active tools
    if (state.hero.activeTools.bow) {
        activeTools.push('bow');
    }
    if (state.hero.activeTools.staff) {
        activeTools.push('staff');
    }
    if (state.hero.activeTools.cloak) {
        activeTools.push('cloak');
    }
    if (state.hero.activeTools.clone) {
        activeTools.push('clone');
    }
    menuRows.push(activeTools);

    const equipment: LootType[] = ['leatherBoots'];
    if (state.hero.equipment.ironBoots) {
        equipment.push('ironBoots');
    }
    if (state.hero.equipment.cloudBoots) {
        equipment.push('cloudBoots');
    }
    menuRows.push(equipment);

    const elements: LootType[] = [];
    if (state.hero.passiveTools.charge) {
        elements.push('charge');
    }
    if (state.hero.elements.fire) {
        elements.push('fire');
    }
    if (state.hero.elements.ice) {
        elements.push('ice');
    }
    if (state.hero.elements.lightning) {
        elements.push('lightning');
    }
    menuRows.push(elements);

    let passiveToolRow: LootType[] = [];
    for (let key in state.hero.passiveTools) {
        // This is included among the elements.
        if (key === 'charge' || !state.hero.passiveTools[key]) continue;
        passiveToolRow.push(key as LootType);
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
