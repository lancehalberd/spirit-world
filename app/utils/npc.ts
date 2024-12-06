import { getSectionBoundingBox, moveActor } from 'app/movement/moveActor';
import { getCardinalDirection } from 'app/utils/direction';

export function moveNPC(state: GameState, npc: NPC, dx: number, dy: number, movementProperties: MovementProperties): boolean {
    movementProperties.boundingBox = movementProperties.boundingBox ?? getSectionBoundingBox(state, npc, 16);
    // By default, don't allow the enemy to move towards the outer edges of the screen.
    if (npc.flying) {
        npc.x += dx;
        npc.y += dy;
        return true;
    }
    movementProperties.blockedBoxes = [
        ...(movementProperties.blockedBoxes || []),
        state.hero.getMovementHitbox(),
    ];
    const { mx, my } = moveActor(state, npc, dx, dy, {
        // By default NPCs will avoid all hazards.
        canSwim: false,
        canJump: false,
        canMoveInLava: false,
        canFall: false,
        ...movementProperties
    });
    return mx !== 0 || my !== 0;
}


export function moveNPCToTargetLocation(
    state: GameState,
    npc: NPC, tx: number, ty: number,
    animationStyle?: string,
    movementProperties?: MovementProperties
): number {
    const hitbox = npc.getHitbox();
    const dx = tx - (hitbox.x + hitbox.w / 2), dy = ty - (hitbox.y + hitbox.h / 2);
    if (animationStyle) {
        npc.d = getCardinalDirection(dx, dy);
        npc.changeToAnimation(animationStyle)
    }
    //enemy.currentAnimation = enemy.enemyDefinition.animations.idle[enemy.d];
    const mag = Math.sqrt(dx * dx + dy * dy);
    if (mag > npc.speed) {
        moveNPC(state, npc, npc.speed * dx / mag, npc.speed * dy / mag, {boundingBox: false, ...movementProperties});
        return mag - npc.speed;
    }
    moveNPC(state, npc, dx, dy, {boundingBox: false, ...movementProperties});
    return 0;
}
