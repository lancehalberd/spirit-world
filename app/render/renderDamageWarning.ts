import { Circle, Ray, Rect } from 'app/types';

// Based on Rapidly Exploring Random Tree Algorithm
interface DamageWarningProps {
    box?: Rect
    circle?: Circle
    ray?: Ray
    duration: number
    time: number
}

export function renderDamageWarning(
    context: CanvasRenderingContext2D,
    {box, circle, ray, duration, time}: DamageWarningProps
): void {
    const p = Math.max(0, Math.min(1, time / duration));
    context.save();
        context.fillStyle = 'red';
        context.strokeStyle = 'red';
        context.globalAlpha *= 0.5;
        if (ray) {
            context.translate(ray.x1, ray.y1);
            const dx = ray.x2 - ray.x1;
            const dy = ray.y2 - ray.y1;
            const mag = Math.sqrt(dx * dx + dy *dy);
            const theta = Math.atan2(dy, dx);
            context.rotate(theta);
            context.fillRect(0, -ray.r, mag, 1);
            context.fillRect(0, ray.r - 1, mag, 1);
            const r = ray.r * p;
            if (r > 0) {
                context.globalAlpha *= 0.5;
                context.fillRect(0, -r | 0, mag, (2 * r) | 0);
            }
        } else if (circle) {
            // Darker red outline shows the full radius of the attack.
            context.beginPath();
            context.arc(circle.x, circle.y, circle.r, 0, 2 * Math.PI);
            context.stroke();
            // Lighter fill grows to indicate when the attack will hit.
            //context.globalAlpha *= 0.3;
            if (p > 0) {
                context.globalAlpha *= 0.5;
                context.beginPath();
                context.arc(circle.x, circle.y, circle.r * p, 0, 2 * Math.PI);
                context.fill();
            }
        } else if (box) {
            context.strokeRect(box.x, box.y, box.w, box.h);
            if (p > 0) {
                context.globalAlpha *= 0.5;
                const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
                context.fillRect(
                    (cx - p * box.w / 2) | 0,
                    (cy - p * box.h / 2) | 0,
                    (p * box.w) | 0,
                    (p * box.h) | 0
                );
            }
        }
    context.restore();
}

