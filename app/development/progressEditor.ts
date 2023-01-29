import { renderPropertyRows } from 'app/development/propertyPanel';
import { TabContainer } from 'app/development/tabContainer';
import { updateHeroMagicStats } from 'app/render/spiritBar';
import { getState } from 'app/state';
import { enterLocation } from 'app/utils/enterLocation';

import {
    PanelRows, PropertyRow,
} from 'app/types';

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
        value: state.hero.maxLife || 1,
        onChange(value: number) {
            state.hero.maxLife = value >= 1 ? value : 1;
            return state.hero.maxLife;
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
        value: state.hero.money || 0,
        onChange(money: number) {
            state.hero.money = money >= 0 ? money : 0;
            return state.hero.money;
        },
    }, {
        name: 'silver',
        value: state.hero.silverOre || 0,
        onChange(silverOre: number) {
            state.hero.silverOre = silverOre >= 0 ? silverOre : 0;
            return state.hero.silverOre;
        },
    }, {
        name: 'gold',
        value: state.hero.goldOre || 0,
        onChange(goldOre: number) {
            state.hero.goldOre = goldOre >= 0 ? goldOre : 0;
            return state.hero.goldOre;
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
    for (let tool in state.hero.activeTools) {
        addTool(state.hero.activeTools, tool);
    }
    for (let tool in state.hero.passiveTools) {
        addTool(state.hero.passiveTools, tool);
    }
    for (let tool in state.hero.elements) {
        addTool(state.hero.elements, tool);
    }
    for (let tool in state.hero.equipment) {
        addTool(state.hero.equipment, tool);
    }
    for (let upgrade of ['normalDamage', 'normalRange', 'spiritDamage', 'spiritRange']) {
        row.push({
            name: upgrade,
            value: state.hero.weaponUpgrades[upgrade] || false,
            onChange(value: boolean) {
                state.hero.weaponUpgrades[upgrade] = value;
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
