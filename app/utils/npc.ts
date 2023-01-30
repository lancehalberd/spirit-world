import { getSectionBoundingBox, moveActor } from 'app/moveActor';
import { getDirection } from 'app/utils/direction';

import { GameState,  MovementProperties, NPC } from 'app/types';

export function moveNPC(state, npc: NPC, dx, dy, movementProperties: MovementProperties): boolean {
    movementProperties.boundingBox = movementProperties.boundingBox ?? getSectionBoundingBox(state, npc, 16);
    // By default, don't allow the enemy to move towards the outer edges of the screen.
    if (npc.flying) {
        npc.x += dx;
        npc.y += dy;
        return true;
    }
    const { mx, my } = moveActor(state, npc, dx, dy, movementProperties);
    return mx !== 0 || my !== 0;
}

export function moveNPCToTargetLocation(
    state: GameState,
    npc: NPC, tx: number, ty: number,
    animationStyle?: string
): number {
    const hitbox = npc.getHitbox(state);
    const dx = tx - (hitbox.x + hitbox.w / 2), dy = ty - (hitbox.y + hitbox.h / 2);
    if (animationStyle) {
        npc.d = getDirection(dx, dy);
        npc.changeToAnimation(animationStyle)
    }
    //enemy.currentAnimation = enemy.enemyDefinition.animations.idle[enemy.d];
    const mag = Math.sqrt(dx * dx + dy * dy);
    if (mag > npc.speed) {
        moveNPC(state, npc, npc.speed * dx / mag, npc.speed * dy / mag, {});
        return mag - npc.speed;
    }
    moveNPC(state, npc, dx, dy, {});
    return 0;
}
