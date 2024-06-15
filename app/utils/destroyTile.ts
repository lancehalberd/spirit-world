import { addParticleAnimations } from 'app/content/effects/animationEffect';
import { dropItemFromTable } from 'app/content/objects/lootObject';
import { allTiles } from 'app/content/tiles';
import { playAreaSound } from 'app/musicController';
import { resetTileBehavior } from 'app/utils/tileBehavior';


export function destroyTile(state: GameState, area: AreaInstance, target: TileCoords, noParticles: boolean = false): void {
    const layer = area.layers.find(l => l.key === target.layerKey);
    if (!layer) {
        console.error(`Missing target layer: ${target.layerKey}`);
        return;
    }
    const behavior = area.behaviorGrid?.[target.y]?.[target.x];
    if (area.tilesDrawn[target.y]?.[target.x]) {
        area.tilesDrawn[target.y][target.x] = false;
    }
    area.checkToRedrawTiles = true;
    const underTile = behavior?.underTile || 0;
    layer.tiles[target.y][target.x] = allTiles[underTile];
    if (!noParticles && behavior.breakSound) {
        playAreaSound(state, area, behavior.breakSound);
    }

    resetTileBehavior(area, target);
    if (!noParticles && behavior.particles) {
        addParticleAnimations(state, area, target.x * 16 + 8, target.y * 16 + 8, 4, behavior.particles, behavior);
    }
    if (behavior?.lootTable) {
        dropItemFromTable(state, area, behavior.lootTable,
            (target.x + 0.5) * 16,
            (target.y + 0.5) * 16
        );
    }
}
