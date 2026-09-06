import {showToast} from 'app/development/toast';

// Serializes a MusicTrackDefinition back into TS source that can be pasted into an
// app/content/music/*.ts file, in the same MusicSection/MusicSectionPlacement authoring style
// content files use directly (see spookyTheme.ts/memoryTheme.ts): one named `const` per unique
// section - deduped by object identity, so two placements sharing the same MusicSection object
// export as a single const referenced twice, preserving that they're "linked" - then one
// placements list per part, then the musicTrackHash assignment built from plain part literals
// that list `placements` only, never `notes` - notes is populated separately, on demand, once the
// exported track is actually played or opened in the viewer (see populatePartNotes,
// composeSections.ts). A part with no `placements` (never opened/edited in the track viewer,
// which is what normally attaches this structure) exports its flat `notes` as a single implicit
// section instead.
export function exportMusicTrackToClipboard(definition: MusicTrackDefinition): void {
    navigator.clipboard.writeText(serializeMusicTrack(definition));
    showToast(`Exported track ${definition.key}`);
}

// Trims floating point noise (drag-edits, beat math) without losing precision that matters for
// beat placement.
function roundNumber(value: number): number {
    return Math.round(value * 1000) / 1000;
}

function toIdentifier(key: string): string {
    const cleaned = key.replace(/[^a-zA-Z0-9_$]/g, '');
    return /^[a-zA-Z_$]/.test(cleaned) ? cleaned : `section${cleaned}`;
}

// Appends a numeric suffix to `name` until it doesn't collide with an already-used identifier in
// this export, then reserves it.
function uniqueName(name: string, usedNames: Set<string>): string {
    let candidate = name;
    let suffix = 2;
    while (usedNames.has(candidate)) {
        candidate = `${name}${suffix++}`;
    }
    usedNames.add(candidate);
    return candidate;
}

function serializeNote(note: NoteEvent): string {
    const fields: string[] = [`beat: ${roundNumber(note.beat)}`];
    if (note.beats != null) fields.push(`beats: ${roundNumber(note.beats)}`);
    if (note.duration != null) fields.push(`duration: ${roundNumber(note.duration)}`);
    if (note.note != null) fields.push(`note: '${note.note}'`);
    if (note.frequency != null) fields.push(`frequency: ${roundNumber(note.frequency)}`);
    if (note.volume != null) fields.push(`volume: ${roundNumber(note.volume)}`);
    return `{${fields.join(', ')}}`;
}

function serializeSection(varName: string, section: MusicSection, lines: string[]): void {
    lines.push(`const ${varName}: MusicSection = {`);
    lines.push(`    key: '${section.key}',`);
    lines.push('    notes: [');
    for (const note of section.notes) {
        lines.push(`        ${serializeNote(note)},`);
    }
    lines.push('    ],');
    lines.push('};');
}

export function serializeMusicTrack(definition: MusicTrackDefinition): string {
    const usedNames = new Set<string>();
    const sectionVarNames = new Map<MusicSection, string>();
    const lines: string[] = [];
    lines.push(`import {musicTrackHash} from 'app/utils/music/musicTrackHash';`);
    lines.push('');

    // One placements list (and its backing section consts) per part, declared before the final
    // musicTrackHash assignment so every section is defined before anything references it.
    const partPlacementVarNames: string[] = [];
    for (const part of definition.parts) {
        const placements: MusicSectionPlacement[] = part.placements?.length
            ? part.placements
            : [{section: {key: `${part.instrument}Notes`, notes: part.notes ?? []}, offset: 0}];
        for (const {section} of placements) {
            if (!sectionVarNames.has(section)) {
                const varName = uniqueName(toIdentifier(section.key), usedNames);
                sectionVarNames.set(section, varName);
                serializeSection(varName, section, lines);
            }
        }
        const placementsVarName = uniqueName(`${toIdentifier(part.instrument)}Placements`, usedNames);
        partPlacementVarNames.push(placementsVarName);
        lines.push(`const ${placementsVarName}: MusicSectionPlacement[] = [`);
        for (const {section, offset} of placements) {
            lines.push(`    {section: ${sectionVarNames.get(section)}, offset: ${roundNumber(offset)}},`);
        }
        lines.push('];');
    }
    lines.push('');

    lines.push(`musicTrackHash.${definition.key} = {`);
    lines.push(`    key: '${definition.key}',`);
    lines.push(`    bpm: ${definition.bpm},`);
    if (definition.loop) {
        lines.push(`    loop: true,`);
    }
    if (definition.loopStartBeat != null) {
        lines.push(`    loopStartBeat: ${roundNumber(definition.loopStartBeat)},`);
    }
    if (definition.loopEndBeat != null) {
        lines.push(`    loopEndBeat: ${roundNumber(definition.loopEndBeat)},`);
    }
    lines.push('    parts: [');
    definition.parts.forEach((part, partIndex) => {
        lines.push('        {');
        lines.push(`            instrument: '${part.instrument}',`);
        if (part.volume != null) lines.push(`            volume: ${roundNumber(part.volume)},`);
        if (part.note != null) lines.push(`            note: '${part.note}',`);
        if (part.frequency != null) lines.push(`            frequency: ${roundNumber(part.frequency)},`);
        if (part.beats != null) lines.push(`            beats: ${roundNumber(part.beats)},`);
        if (part.duration != null) lines.push(`            duration: ${roundNumber(part.duration)},`);
        const placementsVarName = partPlacementVarNames[partIndex];
        lines.push(`            placements: ${placementsVarName},`);
        lines.push('        },');
    });
    lines.push('    ],');
    lines.push('};');
    lines.push('');
    return lines.join('\n');
}
