export const toolTipColor = '#AAA';


export function arrayToCssRGB(array: number[]) {
    return '#' + toHex(array[0]) + toHex(array[1]) + toHex(array[2]);
}

export function toHex(d) {
    return  ("0"+(Number(d).toString(16))).slice(-2).toUpperCase();
}
