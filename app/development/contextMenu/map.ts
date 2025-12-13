import { allSections, dungeonMaps } from 'app/content/sections';
import { zones } from 'app/content/zones/zoneHash';
import { updateMapSections } from 'app/development/sections';
import { overworldKeys } from 'app/gameConstants';


export function getMapOptions(state: GameState, selectedSections: number[]): MenuOption[] {
    const areAllSectionsHidden = selectedSections.every(index => allSections[index].section.hideMap);
    let mapIds = Object.keys(dungeonMaps);
    if (!overworldKeys.includes(state.areaSection.definition.mapId)) {
        mapIds = [state.areaSection.definition.mapId, ...mapIds.filter(mapId => mapId !== state.areaSection.definition.mapId)];
    }
    return [
        {
            label: 'setMapId',
            getChildren() {
                return [
                    ...overworldKeys.map( zoneId => {
                        const entranceIds: string[] = [];
                        const zone = zones[zoneId];
                        const spiritEntranceIds: string[] = [];
                        for (let floor = 0; floor < zone.floors.length; floor++) {
                            for( const areaGrid of [zone.floors[floor].spiritGrid, zone.floors[floor].grid]){
                                for (let y = 0; y < areaGrid.length; y++) {
                                    for (let x = 0; x < areaGrid[y].length; x++) {
                                        const area = areaGrid[y][x];
                                        for (const object of (area?.objects || [])) {
                                            if (!object.id) {
                                                continue;
                                            }
                                            if (object.type === 'door' || object.type === 'teleporter'
                                                || object.type === 'pitEntrance' || object.type === 'spawnMarker'
                                            ) {
                                                if (area.isSpiritWorld) {
                                                    spiritEntranceIds.push(object.id);
                                                } else {
                                                    entranceIds.push(object.id);
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        return {
                            label: zoneId,
                            getChildren() {
                                return [
                                    {
                                        label: 'Material',
                                        getChildren() {
                                            return [
                                                ...entranceIds.map( entranceId => {
                                                    return {
                                                        label: entranceId,
                                                        onSelect() {
                                                            updateMapSections(state, selectedSections, {mapId: zoneId, entranceId});
                                                        }
                                                    };
                                                })
                                            ];
                                        }
                                    },
                                    {
                                        label: 'Spirit',
                                        getChildren() {
                                            return [
                                                ...spiritEntranceIds.map( entranceId => {
                                                    return {
                                                        label: entranceId,
                                                        onSelect() {
                                                            updateMapSections(state, selectedSections, {mapId: zoneId, entranceId});
                                                        }
                                                    };
                                                })
                                            ];
                                        }
                                    },
                                ];
                            },
                        };
                    }),
                    {
                        label: 'Zone',
                        getChildren() {
                            return [
                                ...mapIds.map(mapId => {
                                    return {
                                        label: mapId,
                                        getChildren() {
                                            return [
                                                ...Object.keys(dungeonMaps[mapId].floors).map( floorId => {
                                                    return {
                                                        label: floorId,
                                                        onSelect() {
                                                            updateMapSections(state, selectedSections, {mapId, floorId});
                                                        }
                                                    };
                                                }),
                                                {
                                                    label: '+New',
                                                    onSelect() {
                                                        const floorId = window.prompt('Enter the new floor id');
                                                        if (!floorId) {
                                                            return;
                                                        }
                                                        updateMapSections(state, selectedSections, {mapId, floorId});
                                                    }
                                                },
                                            ];
                                        },
                                    }
                                }),
                            ];
                        },
                    },
                    {
                        label: '+New',
                        onSelect() {
                            const mapId = window.prompt('Enter the new map id');
                            if (!mapId) {
                                return;
                            }
                            updateMapSections(state, selectedSections, {mapId, floorId: '1F'});
                        }
                    },
                ];
            }
        },
        {
            label: areAllSectionsHidden ? 'Show' : 'Hide',
            onSelect() {
                for (const sectionIndex of selectedSections) {
                    if (areAllSectionsHidden) {
                        delete allSections[sectionIndex].section.hideMap;
                    } else {
                        allSections[sectionIndex].section.hideMap = true;
                    }
                }
                state.map.needsRefresh = true;
            }
        }
    ];
}
