import { renderPropertyRows } from 'app/development/propertyPanel';
import { TabContainer } from 'app/development/tabContainer';
import { updateHeroMagicStats } from 'app/render/spiritBar';
import { getState } from 'app/state';
import { enterLocation } from 'app/utils/enterLocation';


const progressTabContainer = new TabContainer('Inventory', [
    {
        key: 'Inventory',
        render(container: HTMLElement) {
            renderPropertyRows(container, getInventoryProperties());
        },
        refresh(container: HTMLElement) {
            this.render(container);
        },
    },
    {
        key: 'Progress',
        render(container: HTMLElement) {
            renderPropertyRows(container, getProgressProperties());
        },
        refresh(container: HTMLElement) {
            this.render(container);
        },
    },
]);

export function renderProgressTabContainer(): HTMLElement {
    progressTabContainer.render();
    return progressTabContainer.element;
}

function getInventoryProperties() {
    const state = getState();
    let rows: PanelRows = [];
    rows.push([{
        name: 'life',
        value: state.hero.life || 1,
        onChange(value: number) {
            state.hero.life = value >= 1 ? value : 1;
            return state.hero.life;
        },
    }, {
        name: '/',
        value: state.hero.savedData.maxLife || 1,
        onChange(value: number) {
            state.hero.savedData.maxLife = value >= 1 ? value : 1;
            return state.hero.savedData.maxLife;
        },
    }, {
        name: 'magic',
        value: state.hero.maxMagic || 1,
        onChange(value: number) {
            state.hero.maxMagic = value >= 1 ? value : 1;
            return state.hero.maxMagic;
        },
    }, {
        name: 'regen',
        value: state.hero.magicRegen || 1,
        onChange(value: number) {
            state.hero.magicRegen = value >= 1 ? value : 1;
            return state.hero.magicRegen;
        },
    }]);
    rows.push([{
        name: 'money',
        value: state.hero.savedData.money || 0,
        onChange(money: number) {
            state.hero.savedData.money = money >= 0 ? money : 0;
            return state.hero.savedData.money;
        },
    }, {
        name: 'silver',
        value: state.hero.savedData.silverOre || 0,
        onChange(silverOre: number) {
            state.hero.savedData.silverOre = silverOre >= 0 ? silverOre : 0;
            return state.hero.savedData.silverOre;
        },
    }, {
        name: 'gold',
        value: state.hero.savedData.goldOre || 0,
        onChange(goldOre: number) {
            state.hero.savedData.goldOre = goldOre >= 0 ? goldOre : 0;
            return state.hero.savedData.goldOre;
        },
    }]);
    let row: PropertyRow = [];
    function addTool(object, key) {
        row.push({
            name: key,
            value: object[key] || 0,
            inputClass: 'small',
            onChange(value: number) {
                object[key] = value;
                updateHeroMagicStats(state);
            },
        });
        if (row.length === 2) {
            rows.push(row);
            row = [];
        }
    }
    addTool(state.hero, 'weapon');
    for (let tool in state.hero.savedData.activeTools) {
        addTool(state.hero.savedData.activeTools, tool);
    }
    for (let tool in state.hero.savedData.passiveTools) {
        addTool(state.hero.savedData.passiveTools, tool);
    }
    for (let tool in state.hero.savedData.elements) {
        addTool(state.hero.savedData.elements, tool);
    }
    for (let tool in state.hero.savedData.equipment) {
        addTool(state.hero.savedData.equipment, tool);
    }
    for (let upgrade of ['normalDamage', 'normalRange', 'spiritDamage', 'spiritRange']) {
        row.push({
            name: upgrade,
            value: state.hero.savedData.weaponUpgrades[upgrade] || false,
            onChange(value: boolean) {
                state.hero.savedData.weaponUpgrades[upgrade] = value;
            },
        });
        if (row.length === 2) {
            rows.push(row);
            row = [];
        }
    }
    if (row.length) {
        rows.push(row);
    }
    return rows;
}

function getProgressProperties() {
    const state = getState();
    let rows: PanelRows = [];
    const setFlags = Object.keys(state.savedState.objectFlags);
    rows.push({
        name: 'flags',
        value: setFlags,
        values: setFlags,
        onChange(value: string[]) {
            for (const key of Object.keys(state.savedState.objectFlags)) {
                if (value.indexOf(key) < 0) {
                    delete state.savedState.objectFlags[key];
                    state.location.x = state.hero.x;
                    state.location.y = state.hero.y;
                    // Calling this will instantiate the area again and place the player back in their current location.
                    enterLocation(state, state.location);
                    return;
                }
            }
        }
    });
    return rows;
}
