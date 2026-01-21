export const images: {[key: string]: HTMLImageElement} = {};
export const imagePromises: {[key: string]: Promise<HTMLImageElement>} = {};

const version = window.version;

function loadImage(source: string, callback: () => void): HTMLImageElement {
    images[source] = new Image();
    images[source].onload = () => callback();
    images[source].src = `${source}?v=${version}`;
    return images[source];
}

let startedLoading = false;
let numberOfImagesLeftToLoad = 0;
export function requireImage(imageFile: string, callback?: (image: HTMLImageElement) => void): HTMLImageElement {
    if (images[imageFile]) {
        // images[imageFile] will be populated as soon as the image starts loading, so we still need
        // to wait on the promise before calling the callback in this case to make sure we
        // only make the callback when the image has finished loading.
        if (callback) {
            awaitImage(imageFile).then(callback);
        }
        return images[imageFile];
    }
    const promise = awaitImage(imageFile);
    if (callback) {
        promise.then(callback);
    }
    return images[imageFile];
}

export async function awaitImage(imageFile: string): Promise<HTMLImageElement> {
    if (!imagePromises[imageFile]) {
        imagePromises[imageFile] = new Promise<HTMLImageElement>((resolve, reject) => {
            startedLoading = true;
            numberOfImagesLeftToLoad++;
            loadImage(imageFile, () => {
                resolve?.(images[imageFile]);
                numberOfImagesLeftToLoad--;
            });
        });
    }
    return imagePromises[imageFile];
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
