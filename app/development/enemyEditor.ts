import _ from 'lodash';

import { Enemy } from 'app/content/enemy';
import { fixObjectPosition, getObjectFrame, uniqueId } from 'app/development/objectEditor';
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
    const enemy: EnemyObjectDefinition = {
        id: uniqueId(state, editingState.newEnemyType),
        status: 'normal',
        type: 'enemy',
        enemyType: editingState.newEnemyType,
        x: Math.round(x + state.camera.x),
        y: Math.round(y + state.camera.y),
    }
    const frame = getObjectFrame(enemy);
    enemy.x -= (frame.content?.w || frame.w) / 2;
    enemy.y -= (frame.content?.h || frame.h) / 2;
    fixObjectPosition(state, enemy);
    state.areaInstance.definition.objects.push(enemy);
    state.areaInstance.objects.push(new Enemy(enemy));
}

export function renderEnemyPreview(
    context: CanvasRenderingContext2D,
    state: GameState,
    editingState: EditingState,
    x: number,
    y: number
): void {
    const enemy = new Enemy({
        id: uniqueId(state, editingState.newEnemyType),
        status: 'normal',
        type: 'enemy',
        enemyType: editingState.newEnemyType,
        x: Math.round(x + state.camera.x),
        y: Math.round(y + state.camera.y),
    });
    const frame = enemy.getFrame();
    enemy.x -= (frame.content?.w || frame.w) / 2;
    enemy.y -= (frame.content?.h || frame.h) / 2;
    enemy.render(context, state);
}
