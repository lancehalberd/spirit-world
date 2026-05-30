import {createCanvasAndContext, debugCanvas} from 'app/utils/canvas';
import {removeElementFromArray} from 'app/utils/index';
import SRandom from 'app/utils/SRandom';

let debugFailure = false, debugScale = 25;
// 0 = hazard, 1 = non-hazard, 2 = connected to path, undefined tiles on the perimeter may be freely chosen by the generator.
export function generatePathMatrix({
    random, matrix, pathRadius = 1, rowCount, columnCount, debug = false, jitter = 0
}: {
    random: SRandom
    matrix: (number | undefined)[][]
    pathRadius?: number
    // number of rows+cols to split the matrix into
    rowCount?: number
    columnCount?: number
    debug?: boolean
    jitter?: number
}): (number | undefined)[][] {
    if (debug) {
        console.log('_seed', random._seed);
        logMatrix(matrix);
    }
    const h = matrix.length, w = matrix[0].length;
    const minRowHeight = 2 * (1 + pathRadius), minColumnWidth = 2 * (1 + pathRadius);
    rowCount = Math.max(1, Math.min(rowCount ?? 1, Math.floor(h / minRowHeight)));
    columnCount = Math.max(1, Math.min(columnCount ?? 1, Math.floor(w / minColumnWidth)));
    const requiredVertices: Point[] = [];
    // 1. Create list of exit vertices from 2s found on the parameter.
    for (const edge of getMatrixEdgePoints(w, h)) {
        let firstVertex: Point = undefined, lastVertex: Point = undefined;
        for (const vertex of edge) {
            const value = matrix[vertex.y][vertex.x];
            if (value === 2) {
                if (firstVertex === undefined) {
                    firstVertex = lastVertex = vertex;
                } else {
                    lastVertex = vertex;
                }
            } else {
                if (firstVertex !== undefined) {
                    requiredVertices.push({
                        x: (firstVertex.x + lastVertex.x + 1) / 2,
                        y: (firstVertex.y + lastVertex.y + 1) / 2,
                    });
                }
                firstVertex = lastVertex = undefined;
            }
        }
    }
    //console.log({requiredVertices});
    const optionalVertices: Point[] = [];
    // 2. Add vertex for each row/column grid cell, chosen uniformly from the center of each cell with (1 + pathRadius) padding to prevent nodes from
    // touching when paths are added.
    const rowHeight = h / rowCount, columnWidth = w / columnCount;
    for (let row = 0; row < rowCount; row++) {
        for (let column = 0; column < columnCount; column++) {
            optionalVertices.push({
                x: (column + 0.5) * columnWidth + jitter * (random.mutateAndGenerate() - 0.5) * (columnWidth - minColumnWidth),
                y: (row + 0.5) * rowHeight + jitter * (random.mutateAndGenerate() - 0.5) * (rowHeight - minRowHeight),
            });
        }
    }
    //console.log({optionalVertices});
    // 3. Use DFS to create a spanning tree that connects at least all required vertices
    const edges = createTree({random, requiredVertices, optionalVertices, optionalChance: 1, maxLength: Math.max(rowHeight, columnWidth) + 1});
    if (debugFailure) {
        logMatrix(matrix);
        debugPathMatrix({
            matrix,
            rowHeight,
            columnWidth,
            minRowHeight,
            minColumnWidth,
            requiredVertices,
            optionalVertices,
            edges,
            w: w * debugScale,
            h: h * debugScale,
            scale: debugScale,
        });
        debugger;
    }
    //console.log({edges});
    // 4. Travel each edge in the tree and mark all undefined cells as 1 within radius (distance is horizontal or vertical based on angle of edge)
    for (const edge of edges) {
        const dx = edge.end.x - edge.start.x, dy = edge.end.y - edge.start.y;
        if (Math.abs(dx) > Math.abs(dy)) {
            const start = edge.start.x, end = edge.end.x;
            const steps = Math.ceil(Math.abs(end - start));
            const stepSize = (end - start) / steps;
            for (let i = 0; i <= steps; i++) {
                const x = start + i * stepSize;
                const tx = x | 0;
                if (tx < 0 || tx >= w) continue;
                const y = edge.start.y + dy * (x - edge.start.x) / dx;
                const top = Math.max(0, (y - pathRadius) | 0), bottom = Math.min(h - 1, (y + pathRadius) | 0);
                for (let ty = top; ty <= bottom; ty++) {
                    if (ty < 0 || ty >= h) continue;
                    if (Math.abs(y - (ty + 0.5)) <= pathRadius) {
                        try {
                            matrix[ty][tx] = matrix[ty][tx] ?? 1;
                        } catch {
                            debugger;
                        }
                    }
                }
            }
        } else {
            const start = edge.start.y, end = edge.end.y;
            const steps = Math.ceil(Math.abs(end - start));
            const stepSize = (end - start) / steps;
            for (let i = 0; i <= steps; i++) {
                const y = start + i * stepSize;
                const ty = y | 0;
                if (ty < 0 || ty >= h) continue;
                const x = edge.start.x + dx * (y - edge.start.y) / dy;
                const left = Math.max(0, (x - pathRadius) | 0), right = Math.min(w - 1, (x + pathRadius) | 0);
                for (let tx = left; tx <= right; tx++) {
                    if (tx < 0 || tx >= w) continue;
                    if (Math.abs(x - (tx + 0.5)) <= pathRadius) {
                        try {
                            matrix[ty][tx] = matrix[ty][tx] ?? 1;
                        } catch {
                            debugger;
                        }
                    }
                }
            }
        }
    }
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            matrix[y][x] = matrix[y][x] ?? 0;
        }
    }
    for (let i = 0; i < 10; i++) {
        let changed = false;
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                if (matrix[y][x] === 2) continue;
                let matches = 0;
                const isPit = matrix[y][x] === 0;
                const N = (matrix[y - 1]?.[x] === 0);
                const S = (matrix[y + 1]?.[x] === 0);
                const W = (matrix[y]?.[x - 1] === 0);
                const E = (matrix[y]?.[x + 1] === 0);
                if (isPit === N) matches++;
                if (isPit === S) matches++;
                if (isPit === E) matches++;
                if (isPit === W) matches++;
                if (matches <= 1) {
                    if (isPit) {
                        const NW = (matrix[y - 1]?.[x - 1] === 0);
                        const NE = (matrix[y - 1]?.[x + 1] === 0);
                        const SW = (matrix[y + 1]?.[x - 1] === 0);
                        const SE = (matrix[y + 1]?.[x + 1] === 0);
                        // Isolated pit is only smoothed out if there
                        // are also no adjacent corner pits. If there
                        // are corner pits, the pit brush will
                        // already smooth the pit by adding angled pits.
                        if (!NW && !NE && !SW && ! SE) {
                            matrix[y][x] = 1;
                            changed = true;
                        }
                    } else {
                        // Isolated piece of land is smoothed out.
                        matrix[y][x] = 0;
                        changed = true;
                    }
                } else if (isPit && matches === 2 && N !== S) {
                    const NW = (matrix[y - 1]?.[x - 1] === 0);
                    const NE = (matrix[y - 1]?.[x + 1] === 0);
                    const SW = (matrix[y + 1]?.[x - 1] === 0);
                    const SE = (matrix[y + 1]?.[x + 1] === 0);
                    // The above check means we are in a pattern like this, with some rotation:
                    // ?1?
                    // 100
                    // ?0?
                    // Replacing an interior pit corner with a non-pit tile will cause it to be turned into
                    // an angled pit when the pit brush is applied.
                    // This check is supposed to insure there are 5 contiguous non-pit tiles around the current
                    // tile in an L shape like:
                    // 111
                    // 100
                    // 100
                    // By checking if each direction is a pit(0), in which case we don't care what the corners are
                    // next to it, or that the corners next to it are not pits.
                    if ((N || (!NW && !NE))
                        && (S || (!SW && !SE))
                        && (W || (!NW && !SW))
                        && (E || (!NE && !SE))
                    ) {
                        matrix[y][x] = 1;
                        changed = true;
                    }
                }
            }
        }
        if (!changed) {
            break;
        }
    }
    if (debug) {
        logMatrix(matrix);
        debugPathMatrix({
            matrix,
            rowHeight,
            columnWidth,
            minRowHeight,
            minColumnWidth,
            requiredVertices,
            optionalVertices,
            edges,
            w: w * debugScale,
            h: h * debugScale,
            scale: debugScale,
        });
    }
    return matrix;
}

window.generatePathMatrix = generatePathMatrix;
/*
const U: undefined = undefined;
generatePathMatrix({
    random: SRandom.mutate(),
    matrix: [
        [U,U,2,2,U,U,U,U,U,U,U,U,U],
        [U,U,U,U,U,U,U,U,U,U,U,U,U],
        [U,U,U,U,U,U,U,U,U,U,U,U,U],
        [U,U,U,U,U,U,U,U,U,U,U,U,U],
        [U,U,U,U,U,U,U,U,U,U,U,U,U],
        [U,U,U,U,U,U,U,U,U,U,U,U,U],
        [U,U,U,U,U,U,U,U,U,U,U,U,U],
        [U,U,U,U,U,U,U,U,U,U,U,U,U],
        [U,U,U,U,U,U,U,U,U,U,U,U,U],
        [U,U,U,U,U,U,U,U,U,U,U,U,U],
        [U,U,U,U,U,U,U,U,U,U,U,U,U],
        [U,U,U,U,U,U,U,2,2,U,U,U,U],
    ],
});*/

SRandom._seed = 0.6570070735178888;
/*
const U: undefined = undefined;
generatePathMatrix({
    random: SRandom,
    matrix: [
        [U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U],
        [U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U],
        [U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U],
        [U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U],
        [U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U],
        [U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U],
        [U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U],
        [U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U],
        [U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U],
        [U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U],
        [U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U],
        [U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U],
        [U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U],
        [U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U],
        [U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U],
        [U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U],
        [U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U],
        [U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U],
        [U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U],
        [U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U],
        [2,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U],
        [2,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U],
        [2,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U],
        [2,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U],
        [2,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U],
        [U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U],
        [U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U],
        [U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U,U]
    ],
    debug: true,
});*/

function logMatrix(m: any[][]) {
    console.log(m.map(row => row.join(',')).join("\n"));
}

function debugPathMatrix({
    matrix,
    rowHeight,
    columnWidth,
    minRowHeight,
    minColumnWidth,
    requiredVertices,
    optionalVertices,
    edges,
    w,
    h,
    scale,
}: {
    matrix: number[][]
    rowHeight: number
    columnWidth: number
    minRowHeight: number
    minColumnWidth: number
    requiredVertices: Point[]
    optionalVertices: Point[]
    edges: Edge[]
    w: number
    h: number
    scale: number
}) {
    const [canvas, context] = createCanvasAndContext(w, h);
    context.fillStyle = '#008';
    context.fillRect(0, 0, w, h);

    context.beginPath();
    context.strokeStyle = '#FFF'
    for (let x = scale * columnWidth; x < w; x += scale * columnWidth) {
        context.moveTo(x, 0);
        context.lineTo(x, h);
    }
    for (let y = scale * rowHeight; y < h; y += scale * rowHeight) {
        context.moveTo(0, y);
        context.lineTo(w, y);
    }
    context.stroke();
    context.strokeStyle = '#0F0'
    const rowCount = Math.round(h / rowHeight / scale), columnCount = Math.round(w / columnWidth / scale);
    for (let row = 0; row < rowCount; row++) {
        for (let column = 0; column < columnCount; column++) {
            context.beginPath();
            context.rect(
                scale * ((column + 0.5) * columnWidth - (columnWidth - minColumnWidth) / 2),
                scale * ((row + 0.5) * rowHeight - (rowHeight - minRowHeight) / 2),
                scale * (columnWidth - minColumnWidth),
                scale * (rowHeight - minRowHeight),
            );
            context.stroke();
        }
    }

    context.beginPath();
    context.strokeStyle = '#000'
    for (const edge of edges) {
        context.moveTo(edge.start.x * scale, edge.start.y * scale);
        context.lineTo(edge.end.x * scale, edge.end.y * scale);
    }
    context.stroke();
    context.fillStyle = '#FFF';
    for (const vertex of optionalVertices) {
        context.beginPath();
        context.arc(vertex.x * scale, vertex.y * scale, scale / 2, 0, 2 * Math.PI);
        context.stroke();
        context.textAlign = 'center';
        context.fillText(pointString(vertex), vertex.x * scale, vertex.y * scale);
    }
    context.strokeStyle = '#F00'
    for (const vertex of requiredVertices) {
        context.beginPath();
        context.arc(vertex.x * scale, vertex.y * scale, scale / 2, 0, 2 * Math.PI);
        context.stroke();
        context.textAlign = 'center';
        context.fillText(pointString(vertex), vertex.x * scale, vertex.y * scale);
    }
    debugCanvas(canvas, 1);
}

function getMatrixEdgePoints(w: number, h: number): Point[][] {
    const topEdge = [];
    const bottomEdge = [];
    const leftEdge = [];
    const rightEdge = [];
    for (let i = 0; i < w; i++) {
        topEdge.push({x: i, y: 0});
        bottomEdge.push({x: i, y: h - 1});
    }
    for (let i = 0; i < h; i++) {
        leftEdge.push({x: 0, y: i});
        rightEdge.push({x: w - 1, y: i});
    }
    return [topEdge, bottomEdge, leftEdge, rightEdge];
}

function pointString(p: Point){
    return p.x.toFixed(0) + ","+ p.y.toFixed(0);
}
function edgeString(e: Edge){
    return pointString(e.start) + "->"+ pointString(e.end);
}
function edgeLength(e: Edge) {
    return Math.sqrt((e.end.x - e.start.x) ** 2 + (e.end.y - e.start.y) ** 2);
}

function createTree({random, requiredVertices, optionalVertices, optionalChance = 0.1, maxLength = 100, debug = false}: {
    random: SRandom
    requiredVertices: Point[]
    optionalVertices: Point[]
    optionalChance?: number
    maxLength?: number
    debug?: boolean
}): Edge[] {
    const edges: Edge[] = [];
    const requiredSet = new Set(requiredVertices);
    const allVertices = random.shuffle([...requiredVertices, ...optionalVertices]);
    const vertexStack: Point[] = [allVertices.pop()];
    requiredSet.delete(vertexStack[0]);
    let safety = 0;
    while (vertexStack.length && allVertices.length && safety++ < 100000) {
        const vertex = vertexStack[vertexStack.length - 1];
        //console.log('Finding candidates for', pointString(vertex));
        const candidates: {weight: number, vertex: Point}[] = [];
        let totalWeight = 0;
        for (const otherVertex of allVertices) {
            if (!requiredSet.has(otherVertex)) {
                // % chance to ignore non-required vertices every step.
                if (random.mutateAndGenerate() > optionalChance) {
                    continue;
                }
            }
            // Ignore candidates that cross existing edges.
            const proposedEdge = {start: vertex, end: otherVertex};
            if (maxLength && edgeLength(proposedEdge) > maxLength) {
                continue;
            }
            let crossedEdge: Edge;
            for (const edge of edges) {
                // Check any edges that don't include the vertices in the proposed
                // edge to see if they cross the proposed edge and skip this proposed
                // edge if so. Any edges that share a vertex cross exactly at that vertex.
                if (edge.start !== vertex && edge.end !== vertex
                    && edge.start !== otherVertex && edge.end !== otherVertex
                    && doEdgesIntersect(proposedEdge, edge)
                ) {
                    crossedEdge = edge;
                    break;
                }
            }
            if (crossedEdge) {
                if (debug && requiredSet.has(otherVertex)) {
                    console.log(edgeString(proposedEdge), 'crossed', edgeString(crossedEdge));
                }
                continue;
            }
            const weight = 1 / ((vertex.x - otherVertex.x) ** 2 + (vertex.y - otherVertex.y) ** 2);
            candidates.push({
                weight,
                vertex: otherVertex,
            });
            totalWeight += weight;
        }
        // Remove this vertex from consideration if we could not find any valid candidates.
        if (!candidates.length) {
            //console.log('No candidates, finished with', pointString(vertex));
            vertexStack.pop();
            continue;
        } else {
            //console.log('Found', candidates.length, ' of ', allVertices.length);
        }
        let roll = random.mutateAndGenerate() * totalWeight;
        let chosenCandidate;
        for (const candidate of candidates) {
            if (roll < candidate.weight) {
                chosenCandidate = candidate;
                break;
            }
            roll -= candidate.weight;
        }
        if (chosenCandidate) {
            const edge = {
                start: vertex,
                end: chosenCandidate.vertex,
            };
            edges.push(edge);
            //console.log('Added', edgeString(edge));
            requiredSet.delete(chosenCandidate.vertex);
            vertexStack.push(chosenCandidate.vertex);
            removeElementFromArray(allVertices, chosenCandidate.vertex);
        } else {
            console.error('Did not choose a candidate');
            debugger;
        }
    }
    if (requiredSet.size) {
        console.warn('Did not connect required points:', [...requiredSet].map(pointString));
        debugFailure = true;
    }

    return edges;
}

function doEdgesIntersect(e1: Edge, e2: Edge): boolean {
    const dx1 = e1.end.x - e1.start.x;
    const dy1 = e1.end.y - e1.start.y;
    const dx2 = e2.end.x - e2.start.x;
    const dy2 = e2.end.y - e2.start.y;
    const denominator = dy2 * dx1 - dx2 * dy1;
    if (denominator == 0) {
        return false;
    }
    const a = (dx2 * (e1.start.y - e2.start.y) - dy2 * (e1.start.x - e2.start.x)) / denominator;
    const b = (dx1 * (e1.start.y - e2.start.y) - dy1 * (e1.start.x - e2.start.x)) / denominator;
    return a >= 0 && a <= 1 && b >= 0 && b <= 1;
};
window.doEdgesIntersect = doEdgesIntersect;
/*
function computeLineIntersection(e1: Edge, e2: Edge): Point|undefined {
    const dx1 = e1.end.x - e1.start.x;
    const dy1 = e1.end.y - e1.start.y;
    const dx2 = e2.end.x - e2.start.x;
    const dy2 = e2.end.y - e2.start.y;
    const denominator = dy2 * dx1 - dx2 * dy1;
    if (denominator == 0) {
        return;
    }
    const a = (dx2 * (e1.start.y - e2.start.y) - dy2 * (e1.start.x - e2.start.x)) / denominator;
    return {x: e1.start.x + a * dx1, y: e1.start.y + a * dy1};
};*/
