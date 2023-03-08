import { ObjectDefinition, TileGridDefinition } from 'app/types';

export type EditorToolType = 'brush' | 'object' | 'enemy' | 'boss' | 'replace' | 'select';
export interface EditingState {
    tool: EditorToolType
    previousTool: EditorToolType
    hasChanges: boolean
    isEditing: boolean
    brush?: {[key: string]: TileGridDefinition}
    clipboardObject?: ObjectDefinition
    needsRefresh?: boolean
    paletteKey: string
    selectedLayerKey?: string
    refreshMinimap?: boolean
    replacePercentage: number
    selectedObject?: ObjectDefinition
    spirit: boolean
    dragOffset?: {x: number, y: number}
    selectedSections: number[]
}
