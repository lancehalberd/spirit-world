import { renderPropertyRows } from 'app/development/propertyPanel';
import { TabContainer } from 'app/development/tabContainer';
import { getState } from 'app/state';
import { enterLocation } from 'app/utils/enterLocation';


const progressTabContainer = new TabContainer('Progress', [
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
const weaponUpgrades: WeaponUpgrades[] = ['normalDamage', 'normalRange', 'spiritDamage', 'spiritRange'];
function getProgressProperties() {
    const state = getState();
    let rows: PanelRows = [];
    let row: PropertyRow = [];
    for (let upgrade of weaponUpgrades) {
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
                    enterLocation(state, state.location, {instant: true});
                    return;
                }
            }
        }
    });
    return rows;
}
