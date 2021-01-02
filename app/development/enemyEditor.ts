import _ from 'lodash';

import { Enemy } from 'app/content/enemy';
import { fixObjectPosition, uniqueId } from 'app/development/objectEditor';
import { EditingState } from 'app/development/tileEditor';

import {
    EnemyObjectDefinition, EnemyType, GameState, PanelRows,
} from 'app/types';

export function getEnemyProperties(state: GameState, editingState: EditingState): PanelRows {
    const rows: PanelRows = [];
    rows.push({
        name: 'enemy',
        value: editingState.newLootType,
        values: ['snake'],
        onChange(enemyType: EnemyType) {
            editingState.newEnemyType = enemyType;
        },
    });
    return rows;
}

export function onMouseDownEnemy(state: GameState, editingState: EditingState, x: number, y: number): void {
    const newObject: EnemyObjectDefinition = {
        id: uniqueId(state, editingState.newEnemyType),
        status: 'normal',
        type: 'enemy',
        enemyType: editingState.newEnemyType,
        x: Math.round(x + state.camera.x),
        y: Math.round(y + state.camera.y),
    }
    fixObjectPosition(state, newObject);
    state.areaInstance.definition.objects.push(newObject);
    state.areaInstance.objects.push(new Enemy(newObject));
}
