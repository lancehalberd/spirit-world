
export const missingNodeSet = new Set<string>();
export const missingExitNodeSet = new Set<string>();
export const missingObjectSet = new Set<string>();
export function warnOnce(warningSet: Set<string>, objectId: string, message: string) {
    if (warningSet.has(objectId)) {
        return;
    }
    warningSet.add(objectId);
    console.warn(message, objectId);
}
