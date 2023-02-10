import { Circle, Ray } from 'app/types';

// Based on Rapidly Exploring Random Tree Algorithm
interface RRTNode {
    x: number
    y: number
    strength: number
    parent?: RRTNode
    children: RRTNode[]
}

export function renderLightningCircle(context: CanvasRenderingContext2D, {x, y, r}: Circle, strength = 3, treeSize = 40): void {
    const nodes: RRTNode[] = [{x, y, strength, children: []}];
    // Generate the tree.
    for (let i = 0; i < treeSize; i++) {
        // Sample random point from the edge of the circle.
        const theta = Math.random() * 2 * Math.PI;
        const target = {x: x + r * Math.cos(theta), y: y + r * Math.sin(theta)};

        // Find the node on the tree closest to the sampled target point.
        let closestNode: RRTNode, closestDistanceSquared: number;
        for (const node of nodes) {
            const dx = node.x - target.x, dy = node.y - target.y;
            const distanceSquared = dx * dx + dy * dy;
            if (!closestNode || distanceSquared < closestDistanceSquared) {
                closestNode = node;
                closestDistanceSquared = distanceSquared;
            }
        }

        // Extend the tree from the closest node towards the samples target point.
        const dx = target.x - closestNode.x, dy = target.y - closestNode.y;
        const mag = Math.sqrt(dx * dx + dy * dy);
        const strengthRoll = 0.1 * Math.random();
        const extendDistance = Math.min(mag, 3 * closestNode.strength * (2 * strengthRoll + 0.8));
        const newNode: RRTNode = {
            x: closestNode.x + dx * extendDistance / mag,
            y: closestNode.y + dy * extendDistance / mag,
            strength: (0.8 + strengthRoll) * closestNode.strength,
            children: [],
        }
        closestNode.children.push(newNode);
        closestNode.strength *= (0.9 - strengthRoll);
        nodes.push(newNode);
    }
    // Draw the tree
    context.strokeStyle = 'yellow';
    for (const node of nodes) {
        for (const child of node.children) {
            context.beginPath();
            context.lineWidth = child.strength;
            context.moveTo(node.x, node.y);
            context.lineTo(child.x, child.y);
            context.stroke();
        }
    }
}


export function renderLightningRay(context: CanvasRenderingContext2D, {x1, y1, x2, y2, r}: Ray, strength = 2, treeSize = 30): void {
    const rdx = x2 - x1, rdy = y2 - y1;
    // This angle is orthogonal to the ray.
    const theta = Math.atan2(rdy, rdx) + Math.PI / 2;
    const nodes: RRTNode[] = [{x: x1, y: y1, strength, children: []}];
    let finalNode: RRTNode, finalDistanceSquared: number;
    // Generate the tree.
    for (let i = 0; i < treeSize; i++) {
        // Sample random point from the far side of the ray
        const p1 = (i + 1) / treeSize;// Math.min((i + 5) / treeSize, Math.max(i / treeSize, 1 - Math.random()));
        const p1s = i / treeSize;
        const p2Max = (p1s + 0.1) * (1.1 - p1s) / 0.6 / 0.4;
        const p2Min = (p1s + 0.1) * (p1s - 1.1) / 0.6 / 0.4;
        const p2 = p2Min + Math.random() * (p2Max - p2Min);
        const target = {x: x1 + p1 * rdx + 8 * p2 * Math.cos(theta), y: y1 + p1 * rdy + 8 * p2 * Math.sin(theta)};

        // Find the node on the tree closest to the sampled target point.
        let closestNode: RRTNode, closestDistanceSquared: number;
        for (const node of nodes) {
            const dx = node.x - target.x, dy = node.y - target.y;
            const distanceSquared = dx * dx + dy * dy;
            if (!closestNode || distanceSquared < closestDistanceSquared) {
                closestNode = node;
                closestDistanceSquared = distanceSquared;
            }
        }

        // Extend the tree from the closest node towards the samples target point.
        const dx = target.x - closestNode.x, dy = target.y - closestNode.y;
        const mag = Math.sqrt(dx * dx + dy * dy);
        const strengthRoll = 0.1 * Math.random();
        const extendDistance = Math.min(mag, 5);
        const newNode: RRTNode = {
            x: closestNode.x + dx * extendDistance / mag,
            y: closestNode.y + dy * extendDistance / mag,
            strength: (0.9 + strengthRoll) * closestNode.strength,
            children: [],
            parent: closestNode,
        }
        closestNode.children.push(newNode);
        closestNode.strength *= (1 - strengthRoll);
        nodes.push(newNode);

        {
            const dx = x2 - newNode.x, dy = y2 - newNode.y;
            const distanceSquared = dx * dx + dy * dy;
            if (!finalNode || distanceSquared < finalDistanceSquared) {
                finalNode = newNode;
                finalDistanceSquared = distanceSquared;
            }
        }
    }
    // Strengthen the path to the final node.
    let node = finalNode;
    while (node) {
        node.strength = Math.min(2, node.strength + 0.5);
        node = node.parent;
    }
    // Draw the tree
    context.strokeStyle = 'yellow';
    for (const node of nodes) {
        for (const child of node.children) {
            context.beginPath();
            context.lineWidth = child.strength;
            context.moveTo(node.x, node.y);
            context.lineTo(child.x, child.y);
            context.stroke();
        }
    }
}

export function renderHillarysBrokenLightningCircle(context: CanvasRenderingContext2D, {x, y, r}: Circle): void {
    const nodes: RRTNode[] = [{x, y, strength: 3, children: []}];
    // Generate the tree.
    for (let i = 0; i < 40; i++) {
        // Sample random point from the edge of the circle.
        const theta = Math.random() * 2 * Math.PI;
        const target = {x: x + r * Math.cos(theta), y: y + r * Math.sin(theta)};

        // Find the node on the tree closest to the sampled target point.
        let closestNode: RRTNode, closestDistanceSquared: number;
        for (const node of nodes) {
            const dx = node.x - target.x, dy = node.y - target.y;
            const distanceSquared = dx * dx + dy * dy;
            if (!closestNode || distanceSquared < closestDistanceSquared) {
                closestNode = node;
                closestDistanceSquared = distanceSquared;
            }
        }

        // Extend the tree from the closest node towards the samples target point.
        const dx = target.x - closestNode.x, dy = target.y - closestNode.y;
        const mag = Math.sqrt(dx * dx + dy * dy);
        const strengthRoll = 0.1 * Math.random();
        const extendDistance = Math.min(mag, 3 * closestNode.strength * (2 * strengthRoll + 0.8));
        const newNode: RRTNode = {
            x: closestNode.x + dx * extendDistance,
            y: closestNode.y + dy * extendDistance,
            strength: (0.8 + strengthRoll) * closestNode.strength,
            children: [],
        }
        closestNode.children.push(newNode);
        closestNode.strength *= (0.9 - strengthRoll);
        nodes.push(newNode);
    }
    // Draw the tree
    context.strokeStyle = 'yellow';
    for (const node of nodes) {
        for (const child of node.children) {
            context.beginPath();
            context.lineWidth = child.strength;
            context.moveTo(node.x, node.y);
            context.lineTo(child.x, child.y);
            context.stroke();
        }
    }
}
