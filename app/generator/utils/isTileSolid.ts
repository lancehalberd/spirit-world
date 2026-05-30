import {allTiles} from 'app/content/tiles';

export function isTileSolid(area: AreaDefinition, {x, y}: Point) {
    for (const layer of area.layers) {
        const tile = allTiles[layer.grid.tiles[y]?.[x]];
        if (tile?.behaviors?.solid) {
            return true;
        }
    }
}
