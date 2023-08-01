



function createLootTable(totalWeight: number, entries: {type: LootType, amount?: number, weight: number}[]) {
    const lootTable: LootTable = {
        totalWeight,
        thresholds: [],
        loot:[],
    }

    for (let i = 0; i < entries.length; i++) {
        const {type, amount, weight} = entries[i];
        lootTable.thresholds[i] = (lootTable.thresholds[i - 1] || 0) + weight;
        lootTable.loot[i] = {type, amount};
    }

    return lootTable;
}

export const simpleLootTable = createLootTable(200, [
    {type: 'money', amount: 10, weight: 2},
    {type: 'money', amount: 5, weight: 10},
    {type: 'money', amount: 1, weight: 50},
    {type: 'peach', weight: 25},
]);

export const lifeLootTable = createLootTable(200, [
    {type: 'money', amount: 5, weight: 2},
    {type: 'money', amount: 1, weight: 20},
    {type: 'peach', weight: 50},
]);

export const rareLifeLootTable = createLootTable(200, [
    {type: 'peach', weight: 25},
]);

export const certainLifeLootTable = createLootTable(100, [
    {type: 'peach', weight: 90},
    // Make this a big peach that gives 5 life.
    {type: 'peach', weight: 10},
]);

export const moneyLootTable = createLootTable(100, [
    {type: 'money', amount: 20, weight: 5},
    {type: 'money', amount: 10, weight: 10},
    {type: 'money', amount: 5, weight: 20},
    {type: 'money', amount: 1, weight: 50},
]);

