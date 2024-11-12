export const images: {[key: string]: HTMLImageElement} = {};

const version = window.version;

function loadImage(source: string, callback: () => void): HTMLImageElement {
    images[source] = new Image();
    images[source].onload = () => callback();
    images[source].src = `${source}?v=${version}`;
    return images[source];
}

let startedLoading = false;
let numberOfImagesLeftToLoad = 0;
export function requireImage(imageFile: string, callback?: () => void): HTMLImageElement {
    if (images[imageFile]) return images[imageFile];
    startedLoading = true;
    numberOfImagesLeftToLoad++;
    return loadImage(imageFile, () => {
        callback?.();
        numberOfImagesLeftToLoad--;
    });
}

let allImagesAreLoaded = false;
export function areAllImagesLoaded() {
    return allImagesAreLoaded;
}
const allImagesLoadedPromise = new Promise(resolve => {
    const intervalId = setInterval(() => {
        if (startedLoading && numberOfImagesLeftToLoad <= 0) {
            clearInterval(intervalId);
            resolve(true);
        }
    }, 50);
});
export async function allImagesLoaded() {
    return allImagesLoadedPromise
}
allImagesLoaded().then(() => allImagesAreLoaded = true);

const initialImagesToLoad: string[] = [];
for (const initialImageToLoad of initialImagesToLoad) {
    requireImage(initialImageToLoad);
}
