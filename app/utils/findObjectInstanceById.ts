import { AreaInstance, ObjectDefinition, ObjectInstance } from 'app/types';

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

export function findObjectInstanceByDefinition(areaInstance: AreaInstance, definition: ObjectDefinition, allowMissing: boolean = false): ObjectInstance {
    for (const object of areaInstance.objects) {
        if (object.definition === definition) {
            return object;
        }
    }
    if (!allowMissing) {
        console.error('Missing target for definition', definition);
    }
}
