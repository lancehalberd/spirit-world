import {everyObjectInZone} from 'app/utils/every';
import {getObjectSavePositionTreatment, getObjectSaveTreatment} from 'app/utils/objects';

export function findAllZoneFlags(zone: Zone): string[] {
    const flags: string[] = [];
    everyObjectInZone(zone, (location: ZoneLocation, zone: Zone, area: AreaDefinition, objectDefinition: ObjectDefinition) => {
        if (!objectDefinition.id) {
            return;
        }
        if (getObjectSavePositionTreatment(objectDefinition) === 'forever') {
            flags.push(objectDefinition.id + '-position');
        }
        if (objectDefinition.type === 'door' && objectDefinition.frozenLogic) {
            flags.push(objectDefinition.id + '-melted');
        }
        // These objects all save their state automatically when it changes and ignore save treatment.
        if (['keyBlock', 'beadGrate', 'beadCascade'].includes(objectDefinition.type)) {
            flags.push(objectDefinition.id);
            return;
        }
        if (objectDefinition.type === 'loot'
            || objectDefinition.type === 'bigChest'
            || objectDefinition.type === 'chest'
            || objectDefinition.type === 'shopItem'
        ) {
            // 'drop' is a special key used for loot data that should not be saved.
            if (objectDefinition.id !== 'drop') {
                flags.push(objectDefinition.id);
            }
            return;
        }
        // TODO: support 'zone' treatment here with a configurable flag to this function.
        const treatment = getObjectSaveTreatment(objectDefinition);
        if (treatment !== 'forever') {
            return;
        }
        flags.push(objectDefinition.id);
    });
    // Ad Hoc overrides for keys set by script objects.
    if (zone.key === 'peachCave') {
        flags.push('peachCaveTree');
    }
    return flags;
}
