import {tagElement} from 'app/dom';
import {downloadCanvasAsGolden, saveCanvasAsGolden, SaveGoldenResult} from 'app/development/testing/goldenIO';

export interface MissingGoldenEntry {
    goldenName: string
    canvas: HTMLCanvasElement
}

export interface FailureEntry {
    goldenName: string
    goldenCanvas: HTMLCanvasElement
    actualCanvas: HTMLCanvasElement
    diffCanvas: HTMLCanvasElement
}

// Scales a canvas via CSS (nearest-neighbor) to fill most of the viewport while keeping
// its aspect ratio, so it reads clearly regardless of the actual browser window size.
function scaleToFillViewport(canvas: HTMLCanvasElement, fraction = 0.9): void {
    const scale = Math.max(1, Math.floor(Math.min(
        (window.innerWidth * fraction) / canvas.width,
        (window.innerHeight * fraction) / canvas.height,
    )));
    canvas.style.width = `${canvas.width * scale}px`;
    canvas.style.height = `${canvas.height * scale}px`;
    canvas.style.imageRendering = 'pixelated';
}

async function triggerGoldenSave(canvas: HTMLCanvasElement, goldenName: string): Promise<SaveGoldenResult> {
    const result = await saveCanvasAsGolden(canvas, goldenName);
    if (result === 'unsupported') {
        downloadCanvasAsGolden(canvas, goldenName);
    }
    return result;
}

function showMissingGoldenPrompt(goldenName: string, canvas: HTMLCanvasElement): Promise<void> {
    return new Promise((resolve) => {
        const overlay = tagElement('div', 'screenshot-test-overlay');
        scaleToFillViewport(canvas);
        canvas.classList.add('screenshot-test-missing-canvas');

        const controls = tagElement('div', 'screenshot-test-missing-controls');
        const label = tagElement('div', 'screenshot-test-label', `No golden found for "${goldenName}"`);
        const saveButton = tagElement('button', '', 'Save Golden') as HTMLButtonElement;
        const skipButton = tagElement('button', '', 'Skip') as HTMLButtonElement;
        controls.append(label, saveButton, skipButton);

        overlay.append(canvas, controls);
        document.body.append(overlay);

        function finish() {
            overlay.remove();
            resolve();
        }
        // A successful save means this golden is settled, so move on automatically; a
        // cancelled dialog (or the download fallback, which the user still has to file away
        // manually) leaves the prompt open so they can retry or explicitly skip instead.
        async function attemptSave() {
            const result = await triggerGoldenSave(canvas, goldenName);
            if (result === 'saved') {
                finish();
            }
        }
        saveButton.addEventListener('click', attemptSave);
        skipButton.addEventListener('click', finish);

        // Automatically open the native save dialog where it's supported; the button above
        // remains as a manual trigger/retry (and as the only option on unsupported browsers).
        void attemptSave();
    });
}

export async function showMissingGoldenPrompts(missing: MissingGoldenEntry[]): Promise<void> {
    for (const {goldenName, canvas} of missing) {
        await showMissingGoldenPrompt(goldenName, canvas);
    }
}

function buildFailureRow(failure: FailureEntry): HTMLElement {
    const {goldenName, goldenCanvas, actualCanvas, diffCanvas} = failure;
    const row = tagElement('div', 'screenshot-test-row');
    const label = tagElement('div', 'screenshot-test-row-label', goldenName);

    for (const canvas of [goldenCanvas, actualCanvas, diffCanvas]) {
        canvas.style.width = `${canvas.width * 2}px`;
        canvas.style.height = `${canvas.height * 2}px`;
        canvas.style.imageRendering = 'pixelated';
    }
    goldenCanvas.className = 'screenshot-test-row-canvas';
    actualCanvas.className = 'screenshot-test-row-canvas';
    diffCanvas.className = 'screenshot-test-row-diff-canvas';

    const actualContainer = tagElement('div', 'screenshot-test-row-actual-container');
    actualContainer.append(actualCanvas, diffCanvas);

    const images = tagElement('div', 'screenshot-test-row-images');
    images.append(goldenCanvas, actualContainer);

    const diffCheckbox = document.createElement('input');
    diffCheckbox.type = 'checkbox';
    diffCheckbox.addEventListener('change', () => {
        diffCanvas.style.display = diffCheckbox.checked ? '' : 'none';
    });
    const diffLabel = tagElement('label', 'screenshot-test-row-diff-label');
    diffLabel.append(diffCheckbox, document.createTextNode(' Show differences'));

    const updateButton = tagElement('button', '', 'Update Golden') as HTMLButtonElement;
    updateButton.addEventListener('click', () => triggerGoldenSave(actualCanvas, goldenName));

    const controls = tagElement('div', 'screenshot-test-row-controls');
    controls.append(diffLabel, updateButton);

    row.append(label, images, controls);
    return row;
}

export function showFailureStrip(failures: FailureEntry[]): void {
    const overlay = tagElement('div', 'screenshot-test-strip-overlay');
    const closeButton = tagElement('button', 'screenshot-test-strip-close', 'Close') as HTMLButtonElement;
    closeButton.addEventListener('click', () => overlay.remove());

    const strip = tagElement('div', 'screenshot-test-strip');
    for (const failure of failures) {
        strip.append(buildFailureRow(failure));
    }

    overlay.append(closeButton, strip);
    document.body.append(overlay);
}
