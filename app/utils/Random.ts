function toArray<T>(collection: Collection<T>): Array<T> {
    if (Array.isArray(collection)) {
        return collection;
    }
    if (collection instanceof Set) {
        return [...collection];
    }
    return Object.values(collection);
}

const Random = {
    range(A:number, B:number): number {
        var min = Math.min(A, B);
        var max = Math.max(A, B);
        return Math.floor(Math.random() * (max + 1 - min)) + min;
    },

    element<T>(collection: Collection<T>): T {
        const array = toArray(collection);
        return array[Math.floor(Math.random() * array.length)];
    },

    elements<T>(collection: Collection<T>, count: number): Array<T> {
        const array = [...toArray(collection)];
        const result: Array<T> = [];
        while (array.length && result.length < count) {
            result.push(this.removeElement(array));
        }
        return result;
    },

    removeElement<T>(collection: Collection<T>): T {
        if (Array.isArray(collection)) {
            const array = collection as Array<any>;
            return array.splice(Math.floor(Math.random() * array.length), 1)[0];
        }
        if (collection instanceof Set) {
            const value = this.element([...collection]);
            collection.delete(value);
            return value;
        }
        const keys = Object.keys(collection);
        const key = this.element(keys);
        const value = collection[key];
        delete collection[key];
        return value;
    },

    /**
     * Shuffles an array.
     *
     * Knuth algorithm found at:
     * http://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
     *
     * @param {Array} array  The array of elements to shuffle
     */
    shuffle<T>(array:T[]):T[] {
        array = [...array];
        let currentIndex = array.length, temporaryValue, randomIndex;
        // While there remain elements to shuffle...
        while (0 !== currentIndex) {
          // Pick a remaining element...
          randomIndex = Math.floor(Math.random() * currentIndex);
          currentIndex -= 1;
          // And swap it with the current element.
          temporaryValue = array[currentIndex];
          array[currentIndex] = array[randomIndex];
          array[randomIndex] = temporaryValue;
        }
        return array;
    }
};

export default Random;
