
export const images: {[key: string]: HTMLImageElement & { originalSource?: string}} = {};

const version = window.version;

function loadImage(source, callback) {
    images[source] = new Image();
    images[source].onload = () => callback();
    images[source].src = `${source}?v=${version}`;
    // Used for serializing images.
    images[source].originalSource = source;
    return images[source];
}

let startedLoading = false;
let numberOfImagesLeftToLoad = 0;
export function requireImage(imageFile) {
    if (images[imageFile]) return images[imageFile];
    startedLoading = true;
    numberOfImagesLeftToLoad++;
    return loadImage(imageFile, () => numberOfImagesLeftToLoad--);
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

const initialImagesToLoad = [];
for (const initialImageToLoad of initialImagesToLoad) {
    requireImage(initialImageToLoad);
}
