export function fixedDigits(number: number, digits: number = 1): number {
    return parseFloat(number.toFixed(digits));
}

export function formatValue(value: any, digits: number = 1): string {
    if (typeof value === 'boolean') {
        return value ? 'True' : 'False';
    }
    if (typeof value === 'string') {
        const float = parseFloat(value);
        if ('' + float == value) {
            return float.toFixed(digits);
        }
        return value;
    }
    if (typeof value === 'number') {
        return value.toFixed(digits);
    }
    console.log('invalid value to format: ' + value);
    debugger;
    throw new Error('invalid value to format: ' + value);
}

// Wrapper for toFixed that strips trailing '0's and '.'s.
// Foundt at http://stackoverflow.com/questions/7312468/javascript-round-to-a-number-of-decimal-places-but-strip-extra-zeros
export function abbreviate(number, digits: number = null) {
    if (digits) {
        number = fixedDigits(number, digits);
    }
    if (number >= 1000000000000) {
        return (number / 1000000000000 + '').slice(0, 5) + 'T';
    }
    if (number >= 1000000000) {
        return (number / 1000000000 + '').slice(0, 5) + 'B';
    }
    if (number >= 1000000) {
        return (number / 1000000 + '').slice(0, 5) + 'M';
    }
    if (number >= 10000) {
        return (number / 1000 + '').slice(0, 5) + 'K';
    }
    return number;
}

export function percent(number: any, digits: number = 1): string {
    if (typeof number === 'number') {
        return (100 * number).toFixed(digits) + '%';
    }
    const float = parseFloat(number);
    if (float == number) {
        return (100 * float).toFixed(digits) + '%';
    }
    return number + ' ×100%';
    // Replace any numbers with n*100 since this is a percent.
    /*return this.replace(/[+-]?\d+(\.\d+)?/, function (number) {
        console.log("found number " + number);
        console.log("changed to: " + (parseFloat(number) * 100).toFixed(digits));
        return (parseFloat(number) * 100).toFixed(digits);
    }) + '%';*/
}
/*
function coins(amount: any) {
    if (typeof amount == 'number') {
        amount = abbreviate(amount);
    }
    return tag('span', 'icon coin') + ' ' + tag('span', 'value coins', amount);
}

function anima(amount: any) {
    if (typeof amount == 'number') {
        amount = abbreviate(amount);
    }
    return tag('span', 'icon anima') + ' ' + tag('span', 'value anima', amount);
}*/

export function properCase(string) {
    return string.split(' ').map(function (word) {return word.charAt(0).toUpperCase() + word.substring(1)}).join(' ');
}
