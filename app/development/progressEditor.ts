import {renderPropertyRows} from 'app/development/propertyPanel';
import {TabContainer} from 'app/development/tabContainer';
import {refreshArea} from 'app/development/utils';
import {getState} from 'app/state';
import {findAllZoneFlags} from 'app/utils/findAllZoneFlags';


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
    const availableFlags = [...new Set([...findAllZoneFlags(state.zone), ...setFlags])];
    rows.push({
        name: 'flags',
        value: setFlags,
        values: availableFlags,
        onChange(keys: string[]) {
            for (const key of Object.keys(state.savedState.objectFlags)) {
                if (keys.indexOf(key) < 0) {
                    delete state.savedState.objectFlags[key];
                    state.location.x = state.hero.x;
                    state.location.y = state.hero.y;
                    refreshArea(state);
                    // Only a single key can be added/updated each frame, so stop on update.
                    return;
                }
            }
            for (const key of keys) {
                if (!state.savedState.objectFlags[key]) {
                    state.savedState.objectFlags[key] = true;
                    refreshArea(state);
                    // Only a single key can be added/updated each frame, so stop on update.
                    return;
                }
            }
        }
    });
    return rows;
}
