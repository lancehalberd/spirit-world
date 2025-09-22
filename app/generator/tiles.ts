import {populateLayersFromAlternateArea} from 'app/content/areas';
import {getOrAddLayer} from 'app/utils/layers';
import {mapTileIndex} from 'app/utils/mapTile';

// Assuming a tile is defined in the base world and propogating to the child world by default, this
// will modify the two worlds so that the tile is removed from area but kept in alternate area.
// This means that if area is the base world, then the override clear tile will be applied to the alternate area.
// If area is the child world, then the default tiles will be explicitly added to the child world and then replace with empty tiles in the base world.
export function clearTileInOneWorld(area: AreaDefinition, alternateArea: AreaDefinition, layerKey: string, tx: number, ty: number) {
    if (!alternateArea.layers?.length) {
        populateLayersFromAlternateArea(null, alternateArea, area);
    }
    // Do nothing if this layer does not exist in either area.
    if (!area.layers.find(l => l.key === layerKey) && !alternateArea.layers.find(l => l.key === layerKey)) {
        return;
    }
    const baseArea = area.parentDefinition || area;
    if (area === baseArea) {
        // To clear tiles from the baseArea but keep them in the child area, they must be explicitly set in the child area first and then cleared
        // from the base world.
        const baseLayer = getOrAddLayer(layerKey, area, alternateArea);
        const childLayer = getOrAddLayer(layerKey, alternateArea, area);
        baseLayer.grid.tiles[ty] = baseLayer.grid.tiles[ty] || [];
        childLayer.grid.tiles[ty] = childLayer.grid.tiles[ty] || [];
        if (!childLayer.grid.tiles[ty][tx]) {
            childLayer.grid.tiles[ty][tx] = mapTileIndex(baseLayer.grid.tiles[ty][tx]) || 0;
        }
        baseLayer.grid.tiles[ty][tx] = 0;
    } else {
        const childLayer = getOrAddLayer(layerKey, area, alternateArea);
        childLayer.grid.tiles[ty] = childLayer.grid.tiles[ty] || [];
        childLayer.grid.tiles[ty][tx] = 1;
    }
}
