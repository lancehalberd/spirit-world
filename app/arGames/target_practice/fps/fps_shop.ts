import { boxesIntersect } from 'app/utils/index';
import { wasGameKeyPressed } from 'app/userInput';
import { GAME_KEY } from 'app/gameConstants';
import { typedKeys } from 'app/utils/types';
import { drawARFont } from 'app/arGames/arFont';
import { TargetPracticeState, ShopItem, TargetPracticeSavedState, UnlockKey } from './fps_types';
import { shopItems, baseAmmo } from './fps_config';
import { getHeroPosition } from './fps_utility';
import { startLevel } from './fps_level';

function shopItemRect(gameState: TargetPracticeState, item: ShopItem): Rect {
    return {
        x: gameState.screen.x + 4 + item.x * 42,
        y: gameState.screen.y + 3 + item.y * 13,
        w: 36,
        h: 12,
    };
}

function updateShopItems(state: GameState, gameState: TargetPracticeState, savedState: TargetPracticeSavedState) {
    const unlockedKeys: Set<UnlockKey> = new Set(['l1', 'reset']);
    for (const key of typedKeys(savedState.unlocks)) {
        if (savedState.unlocks[key]) {
            unlockedKeys.add(key);
        }
    }
    gameState.shopItems = [];
    delete gameState.activeShopItem;
    
    const cursorRect = {
        x: gameState.crosshair.x - 2,
        y: gameState.crosshair.y - 2,
        w: 4,
        h: 4
    };
    
    for (const item of shopItems) {
        if (!unlockedKeys.has(item.key)) {
            continue;
        }
        if (savedState.unlocks[item.key] > 0 || item.key === 'l1') {
            for (const key of (item.unlocks ?? [])) {
                unlockedKeys.add(key);
            }
        }
        if (item.disabled?.(state, gameState, savedState) === true) {
            continue;
        }
        gameState.shopItems.push(item);
        if (boxesIntersect(shopItemRect(gameState, item), cursorRect)) {
            gameState.activeShopItem = item;
        }
    }
}



function updateShop(state: GameState, gameState: TargetPracticeState, savedState: TargetPracticeSavedState) {
    gameState.maxAmmo = baseAmmo;
    gameState.ammo = gameState.maxAmmo;
    
    const heroPos = getHeroPosition(state, gameState);
    gameState.crosshair.x = heroPos.x;
    gameState.crosshair.y = heroPos.y;
    
    updateShopItems(state, gameState, savedState);
    const activeItem = gameState.activeShopItem;
    if (activeItem && wasGameKeyPressed(state, GAME_KEY.PASSIVE_TOOL)) {
        if (activeItem.key === 'reset') {
            gameState.scene = 'reset';
            return;
        }
        const level = savedState.unlocks[activeItem.key] ?? 0;
    
        if (level > 0 && activeItem.levelKey) {
            startLevel(state, gameState, activeItem.levelKey);
        }
    }
}

function renderShop(context: CanvasRenderingContext2D, state: GameState, gameState: TargetPracticeState, savedState: TargetPracticeSavedState) {
    for (const item of gameState.shopItems) {
        const {x, y, w, h} = shopItemRect(gameState, item);
        context.fillStyle = '#084';
        context.fillRect(x, y, w, h);
        if (item.key === 'reset') {
            drawARFont(context, item.label, x + w / 2, y + h / 2, {textAlign: 'center', textBaseline: 'middle'});
            continue;
        }
        drawARFont(context, item.label, x + w / 2, y + 1, {textAlign: 'center', textBaseline: 'top'});
    }
}



export { shopItemRect, updateShopItems, updateShop, renderShop };