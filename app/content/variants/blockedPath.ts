import { allTiles } from 'app/content/tiles';
import { variantHash } from 'app/content/variants/variantHash';
import { canCross2Gaps, canCross6Gaps, orLogic, hasIce, hasInvisibility, hasGloves, hasCloudBoots } from 'app/content/logic';
import { getOrAddInstanceLayer } from 'app/utils/layers';

function toTileRect(r: Rect): Rect {
    return {
        x: (r.x / 16) | 0,
        y: (r.y / 16) | 0,
        w: Math.ceil(r.w / 16),
        h: Math.ceil(r.h / 16),
    };
}

function fillLayerRect(random: SRandom, area: AreaInstance, layerKey: string, r: Rect, tiles: FullTile[]): void {
    const layer = getOrAddInstanceLayer(layerKey, area);
    for (let y = r.y; y < r.y + r.h; y++) {
        for (let x = r.x; x < r.x + r.w; x++) {
            if (!layer.tiles[y]) {
                debugger;
            }
            layer.tiles[y][x] = random.element(tiles);
            random = random.nextSeed();
        }
    }
}

variantHash.blockedPath = {
    styles: ['smallGap', 'bigGap', 'rocks', 'crackedGround'],
    gridSize: 16,
    applyToArea(style: string, random: SRandom, area: AreaInstance, data: VariantData): boolean {
        const r = toTileRect(data);
        switch (style){
            case 'smallGap': {
                if (data.d === 'left' || data.d === 'right') {
                    fillLayerRect(random, area, 'floor2', {
                        ...r,
                        x: random.range(r.x, r.x + r.w - 2),
                        w: Math.min(r.w, 2),
                    }, [allTiles[4]]);
                } else {
                    fillLayerRect(random, area, 'floor2', {
                        ...r,
                        y: random.range(r.y, r.y + r.h - 2),
                        h: Math.min(r.h, 2),
                    }, [allTiles[4]]);
                }
                return true;
            }
            case 'bigGap': {
                fillLayerRect(random, area, 'floor2', r, [allTiles[4]]);
                return true;
            }
            case 'rocks': {
                if (area.definition.isSpiritWorld) {
                    fillLayerRect(random, area, 'field', r, [allTiles[185], allTiles[186]]);
                } else {
                    fillLayerRect(random, area, 'field', r, [allTiles[6], allTiles[7]]);
                }
                return true;
            }
            case 'crackedGround': {
                if (area.definition.isSpiritWorld) {
                    fillLayerRect(random, area, 'floor2', r, [allTiles[1008]]);
                } else {
                    fillLayerRect(random, area, 'floor2', r, [allTiles[25]]);
                }
                return true;
            }
        }
        return false;
    },
    getLogic(style: string, random: SRandom, data: VariantData): LogicCheck {
        switch (style){
            case 'smallGap': return canCross2Gaps;
            case 'bigGap': return canCross6Gaps;
            case 'rocks': return hasGloves;
            case 'crackedGround': return orLogic(hasIce, hasInvisibility, hasCloudBoots);
        }
    },
};
