import { directionMap } from 'app/utils/direction';
import { getCompositeBehaviors } from 'app/utils/field';


export function checkForFloorEffects(state: GameState, hero: Hero) {
    if (!hero.area) {
        return;
    }
    const hitbox = hero.getFloorHitbox();
    const checkPoints = [
        {x: hitbox.x, y: hitbox.y},
        {x: hitbox.x + hitbox.w - 1, y: hitbox.y},
        {x: hitbox.x, y: hitbox.y + hitbox.h - 1},
        {x: hitbox.x + hitbox.w - 1, y: hitbox.y + hitbox.h - 1},
    ];
    const pointBehaviors = checkPoints.map(point => getCompositeBehaviors(state, hero.area, point, state.nextAreaInstance));
    let topBehaviors = [];
    hero.groundHeight = 0;
    for (const behaviors of pointBehaviors) {
        const groundHeight = behaviors.groundHeight || 0;
        if (groundHeight > hero.groundHeight) {
            hero.groundHeight = groundHeight;
            topBehaviors = [behaviors];
        } else if (groundHeight === hero.groundHeight) {
            topBehaviors.push(behaviors);
        }
    }
    // Some objects like the elevator set the hero's z value, so when the hero is controlled by an object
    // they are responsible for enforcing this constraint if they want it.
    if (!hero.isControlledByObject) {
        hero.z = Math.max(hero.z, hero.groundHeight);
    }
    hero.wading = hero.z <= 0;
    hero.swimming = hero.action !== 'roll' && hero.action !== 'preparingSomersault' && hero.z <= 0;
    const bootsAreSlippery = hero.savedData.equippedBoots === 'cloudBoots';
    // Here is assumed to be slipping until we determine a reason that they are not.
    hero.slipping = true;
    hero.canFloat = false;
    hero.isOverClouds = false;
    hero.isTouchingPit = false;
    hero.isOverPit = true;
    if (hero.isAstralProjection
        || (hero.isInvisible && hero.savedData.equippedBoots !== 'cloudBoots')
        || hero.savedData.equippedBoots === 'ironBoots'
        || (hero.savedData.equippedBoots === 'leatherBoots' && hero.savedData.equipment.leatherBoots > 1)
    ) {
        hero.slipping = false;
    }
    let startClimbing = false, touchHit: HitProperties = undefined;
    for (const behaviors of topBehaviors) {
        if (!bootsAreSlippery && !behaviors.slippery
            && !behaviors.pit  && !behaviors.water  && !behaviors.shallowWater
        ) {
            hero.slipping = false;
        }
        if (behaviors.climbable) {
            startClimbing = true;
        }
        if (!touchHit && behaviors.touchHit && hero.onHit) {
            if (!behaviors.touchHit.isGroundHit || hero.z <= 0) {
                touchHit = behaviors.touchHit;

                /*const { returnHit } = hero.onHit(state, behaviors.touchHit);

                if (behaviors.cuttable && behaviors.cuttable <= returnHit?.damage) {
                    for (const layer of hero.area.layers) {
                        const tile = layer.tiles[actualRow]?.[actualColumn];
                        if (tile?.behaviors?.cuttable <= returnHit.damage) {
                            destroyTile(state, hero.area, { x: actualColumn, y: actualRow, layerKey: layer.key });
                        }
                    }
                }*/
            }
        }
        if (!behaviors.water && !behaviors.outOfBounds) {
            hero.swimming = false;
        }
        if (!behaviors.shallowWater && !behaviors.water && !behaviors.outOfBounds) {
            hero.wading = false;
        }
        // Don't slip if on any non-slippery ground unless wearing cloud boots.
        // Clouds boots are not slippery when walking on clouds.
        if (behaviors.cloudGround && hero.savedData.equippedBoots === 'cloudBoots') {
            hero.slipping = false;
        }
        if (behaviors.cloudGround) {
            hero.isOverClouds = true;
        }
        // Cloud boots allow you to stand on, but not float over liquids.
        if (!behaviors.isLava && !behaviors.cloudGround && !behaviors.water && !behaviors.shallowWater) {
            hero.canFloat = true;
        }
        // Note that standing on N/E/W ledges will raise the z value to 1 to prevent touching lava while standing over a ledge.
        if (behaviors.isLava && hero.z <= 0) {
            const lavaProof = hero.savedData.equippedBoots === 'ironBoots' && hero.savedData.equipment.ironBoots >= 2;
            if (!lavaProof) {
                // Lava overrides other damaging ground.
                touchHit = { damage: 4, element: 'fire' };
            }
        }
        if (behaviors.pit || behaviors.cloudGround) {
            hero.isTouchingPit = true;
        }
        if (!behaviors.pit && !(behaviors.cloudGround && hero.savedData.equippedBoots !== 'cloudBoots') && !behaviors.outOfBounds) {
            hero.isOverPit = false;
        }
    }
    if (touchHit) {
        hero.onHit(state, touchHit);
    }

    // Being invisible allows you to walk on water unless you are wearing iron boots.
    if (hero.swimming && (hero.savedData.equippedBoots === 'cloudBoots' || (hero.isInvisible && hero.savedData.equippedBoots === 'leatherBoots'))) {
        hero.swimming = false;
        hero.wading = true;
    }
    if (startClimbing) {
        hero.action = 'climbing';
    } else if (!startClimbing && hero.action === 'climbing') {
        hero.action = null;
    }
    if (hero.isOverPit) {
        const canFly = hero.savedData.equippedBoots === 'cloudBoots' && hero.savedData.equipment.cloudBoots >= 2;
        if (!canFly) {
            hero.canFloat = false;
        }
    }
    if (hero.isOverPit && !state.nextAreaSection && !state.nextAreaInstance) {
        if (hero.z <= 0 && hero.action !== 'roll') {
            const behaviorGrid = hero.area.behaviorGrid;
            const tileSize = 16;
            let behaviors = behaviorGrid[Math.round(hero.y / tileSize)]?.[Math.round(hero.x / tileSize)];
            //if (behaviors?.cloudGround && hero.savedData.equippedBoots === 'cloudBoots') {
            if (hero.isOverClouds && hero.savedData.equippedBoots === 'cloudBoots') {
                // Do nothing.
            } else {
                hero.fallIntoPit(state);
                //hero.isOverClouds = !!behaviors?.cloudGround && !behaviors.diagonalLedge;
                if (behaviors?.cloudGround) {
                    hero.x = Math.round(hero.x / tileSize) * tileSize;
                    hero.y = Math.round(hero.y / tileSize) * tileSize;
                    hero.y -= 4;
                    // This will play the cloud poof animation over the hero as they fall.
                    hero.isOverClouds = true;
                    if (behaviors?.diagonalLedge) {
                        hero.x -= directionMap[behaviors?.diagonalLedge][0] * 12;
                        hero.y -= directionMap[behaviors?.diagonalLedge][1] * 12;
                    }
                    if (behaviors?.ledges?.up) {
                        hero.y += 8;
                    }
                    if (behaviors?.ledges?.down) {
                        hero.y -= 8;
                    }
                    if (behaviors?.ledges?.left) {
                        hero.x += 8;
                    }
                    if (behaviors?.ledges?.right) {
                        hero.x -= 8;
                    }
                } else {
                    hero.isOverClouds = false;
                }
                hero.animationTime = 0;
            }
        }
    }
    // Cannot be slipping while swimming/wading/climbing.
    if (hero.swimming || (hero.wading && !bootsAreSlippery) || hero.action === 'climbing') {
        hero.slipping = false;
    }
}
