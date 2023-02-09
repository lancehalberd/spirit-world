// Based on Rapidly Exploring Random Tree Algorithm
interface RRTNode {
    x: number
    y: number
    strength: number
    children: RRTNode[]
}

interface Circle {
    x: number
    y: number
    r: number
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
