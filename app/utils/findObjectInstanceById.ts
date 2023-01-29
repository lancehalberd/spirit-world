import { AreaInstance, ObjectInstance } from 'app/types';

export function findObjectInstanceById(areaInstance: AreaInstance, id: string, allowMissing: boolean = false): ObjectInstance {
    for (const object of areaInstance.objects) {
        if (object.definition?.id === id) {
            return object;
        } 
    }
    if (!allowMissing) {
        console.error('Missing target', id);
    }
}
