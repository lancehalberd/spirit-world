const GOLDENS_PATH = 'testing/goldens';

// Loads an existing golden image, or resolves to null if none exists yet at that name.
export function loadGoldenImage(goldenName: string): Promise<HTMLImageElement | null> {
    return new Promise((resolve) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => resolve(null);
        // Cache-bust so a golden saved earlier in the same session is picked up immediately.
        image.src = `${GOLDENS_PATH}/${goldenName}.png?t=${Date.now()}`;
    });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

export type SaveGoldenResult = 'saved' | 'cancelled' | 'unsupported';

// Attempts to save the canvas via the File System Access API's native "Save As" dialog,
// pre-filled with the golden's file name. Only supported in Chromium-based browsers.
export async function saveCanvasAsGolden(canvas: HTMLCanvasElement, goldenName: string): Promise<SaveGoldenResult> {
    const showSaveFilePicker = (window as any).showSaveFilePicker;
    if (!showSaveFilePicker) {
        return 'unsupported';
    }
    try {
        const handle = await showSaveFilePicker({
            suggestedName: `${goldenName}.png`,
            types: [{description: 'PNG image', accept: {'image/png': ['.png']}}],
        });
        const writable = await handle.createWritable();
        await writable.write(await canvasToBlob(canvas));
        await writable.close();
        return 'saved';
    } catch (e) {
        if (e?.name === 'AbortError') {
            return 'cancelled';
        }
        console.error(`Failed to save golden "${goldenName}"`, e);
        return 'cancelled';
    }
}

// Fallback for browsers without the File System Access API: triggers a normal browser
// download. The user has to manually move the file into public/testing/goldens/ afterward.
export function downloadCanvasAsGolden(canvas: HTMLCanvasElement, goldenName: string): void {
    const link = document.createElement('a');
    link.download = `${goldenName}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
}
