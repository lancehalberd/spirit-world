import {drawFrame} from 'app/utils/animations';
import {createCanvasAndContext} from 'app/utils/canvas';
import {allImagesLoaded} from 'app/utils/images';
import {requireFrame} from 'app/utils/packedImages';

const fogFrame = requireFrame('gfx/effects/fog.png', {x: 0, y: 0, w: 256, h: 128});
export const [fogCanvas, fogContext] = createCanvasAndContext(256, 256);
async function createFogTile() {
    await allImagesLoaded();
    const [tempCanvas, tempContext] = createCanvasAndContext(256, 256);
    tempContext.fillStyle='rgba(255,255,255,0.5)';
    tempContext.fillRect(0, 0, 256, 256);
    drawFrame(tempContext, fogFrame, {x: 0, y: 0, w: 256, h: 128});
    drawFrame(tempContext, {...fogFrame, x: fogFrame.x + 128, w: 128}, {x: 0, y: 128, w: 128, h: 128});
    drawFrame(tempContext, {...fogFrame, w: 128}, {x: 128, y: 128, w: 128, h: 128});
    fogContext.globalAlpha = 0.75;
    fogContext.drawImage(tempCanvas, 0, 0, 256, 256, 0, 0, 256, 256);
}
createFogTile();
