import { boxesIntersect } from 'app/utils/index';
import { wasGameKeyPressed } from 'app/userInput';
import { GAME_KEY } from 'app/gameConstants';
import { typedKeys } from 'app/utils/types';
import { drawARFont } from 'app/arGames/arFont';
import { TargetPracticeState, ShopItem, TargetPracticeSavedState, UnlockKey } from './fps_types';
import { shopItems, baseAmmo } from './fps_config';
import { updateHeroPosition } from './fps_utility';
import { startLevel } from './fps_level';

function shopItemRect(gameState: TargetPracticeState, item: ShopItem): Rect {
    const isBottomItem = item.key === 'reset' || item.label.includes('Endless');
    
    if (isBottomItem) {
        return {
            x: gameState.screen.x + 20 + item.x * 70 + 50,
            y: gameState.screen.y + Math.floor(gameState.screen.h * 0.7) + item.y * 30, 
            w: 40,
            h: 20,
        };
    } else {
        const itemWidth = 60;
        const itemHeight = 30;
        const padding = 15;
        
        return {
            x: gameState.screen.x + padding + item.x * (itemWidth + padding),
            y: gameState.screen.y + padding + item.y * (itemHeight + padding),
            w: itemWidth,
            h: itemHeight,
        };
    }
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
    
    const levelItems: ShopItem[] = [];
    const bottomItems: ShopItem[] = [];
    
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
        
        if (item.key === 'reset' || item.label.includes('Endless')) {
            bottomItems.push(item);
        } else {
            levelItems.push(item);
        }
    }
    
    const levelItemsPerRow = 3;
    levelItems.forEach((item, index) => {
        item.x = index % levelItemsPerRow;
        item.y = Math.floor(index / levelItemsPerRow);
    });
    
    const bottomItemsPerRow = 2;
    bottomItems.forEach((item, index) => {
        item.x = index % bottomItemsPerRow;
        item.y = Math.floor(index / bottomItemsPerRow);
    });
    
    gameState.shopItems = [...levelItems, ...bottomItems];
    
    for (const item of gameState.shopItems) {
        if (boxesIntersect(shopItemRect(gameState, item), cursorRect)) {
            gameState.activeShopItem = item;
            break;
        }
    }
}

function updateShop(state: GameState, gameState: TargetPracticeState, savedState: TargetPracticeSavedState) {
    gameState.maxAmmo = baseAmmo;
    gameState.ammo = gameState.maxAmmo;
    
    updateHeroPosition(state, gameState);
    
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
        
        const isReset = item.key === 'reset';
        const isEndless = item.key.includes('endless');
        
        if (isReset) {
            context.fillStyle = '#844'; 
        } else if (isEndless) {
            context.fillStyle = '#A84'; 
        } else {
            context.fillStyle = '#084';
        }
        
        context.fillRect(x, y, w, h);
        
        if (gameState.activeShopItem === item) {
            context.strokeStyle = '#BF1';
            context.lineWidth = 2;
            context.strokeRect(x, y, w, h);
        }
        
        if (item.key === 'reset') {
            drawARFont(context, item.label, x + w / 2, y + h / 2, {textAlign: 'center', textBaseline: 'middle'});
            continue;
        }
        drawARFont(context, item.label, x + w / 2, y + h / 2, {textAlign: 'center', textBaseline: 'middle'});
    }
}

export { shopItemRect, updateShopItems, updateShop, renderShop };