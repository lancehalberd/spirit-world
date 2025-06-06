import { playAreaSound } from 'app/musicController';
import { getAreaSize } from 'app/utils/getAreaSize';
import { changeObjectStatus } from 'app/utils/objects';

export function checkIfAllEnemiesAreDefeated(state: GameState, area: AreaInstance): void {
    // Don't use `enemyTargets` here since this runs before it is populated sometimes.
    const enemiesAreDefeated = !area.objects.some(e =>
        e.isEnemyTarget && e.status !== 'gone' && (e as Enemy).isFromCurrentSection?.(state)
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
        // The player should always hear this, but we still need to use `playAreaSound`
        // to prevent this from playing from the preview during save selection.
        playAreaSound(state, state.areaInstance, 'secretChime');
    }
}
