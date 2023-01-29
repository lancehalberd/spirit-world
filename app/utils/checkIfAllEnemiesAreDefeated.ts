import { Enemy } from 'app/content/enemy';
import { changeObjectStatus } from 'app/content/objects';
import { playSound } from 'app/musicController';
import { getAreaSize } from 'app/utils/getAreaSize';

import { AreaInstance, GameState } from 'app/types'
export function checkIfAllEnemiesAreDefeated(state: GameState, area: AreaInstance): void {
    // Don't use `enemyTargets` here since this runs before it is populated sometimes.
    const enemiesAreDefeated = !area.objects.some(e =>
        (e instanceof Enemy) && e.status !== 'gone' && e.isFromCurrentSection(state)
    );
    const { section } = getAreaSize(state);
    let playChime = false;
    for (const object of area.objects) {
        if (!object.getHitbox) {
            continue;
        }
        const hitbox = object.getHitbox(state);
        if (hitbox.x < section.x ||
            hitbox.x >= section.x + section.w ||
            hitbox.y < section.y ||
            hitbox.y >= section.y + section.h
        ) {
            continue;
        }
        if (enemiesAreDefeated) {
            if (object.status === 'hiddenEnemy') {
                changeObjectStatus(state, object, 'normal');
                playChime = true;
            }
            if (object.status === 'closedEnemy') {
                changeObjectStatus(state, object, 'normal');
                playChime = true;
            }
        } else {
            // Close doors if new enemies appear.
            if (object.definition?.status === 'closedEnemy') {
                changeObjectStatus(state, object, 'closedEnemy');
            }
        }
    }
    if (playChime) {
        playSound(state, 'secretChime');
    }
}
