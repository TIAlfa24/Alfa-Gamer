const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');

let width, height;

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}
window.addEventListener('resize', resize);
resize();

const GRID_COLS = 4;
const GRID_ROWS = 3;

function manageEmptySpaces(shapes) {
    const cellWidth = width / GRID_COLS;
    const cellHeight = height / GRID_ROWS;

    const cellCounts = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(0));
    const targetedCells = new Set();

    shapes.forEach(shape => {
        const col = Math.floor(shape.x / cellWidth);
        const row = Math.floor(shape.y / cellHeight);

        if (row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS) {
            cellCounts[row][col]++;
        }

        if (shape.targetCell) {
            targetedCells.add(`${shape.targetCell.row},${shape.targetCell.col}`);
        }
    });

    const emptyCells = [];
    for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
            const key = `${r},${c}`;
            if (cellCounts[r][c] === 0 && !targetedCells.has(key)) {
                emptyCells.push({
                    row: r,
                    col: c,
                    x: (c + 0.5) * cellWidth,
                    y: (r + 0.5) * cellHeight
                });
            }
        }
    }

    const freeShapes = shapes.filter(s => !s.targetCell);

    for (const cell of emptyCells) {
        if (freeShapes.length === 0) break;

        let closestIndex = -1;
        let minDistanceSq = Infinity;

        freeShapes.forEach((shape, index) => {
            const dx = cell.x - shape.x;
            const dy = cell.y - shape.y;
            const distSq = dx * dx + dy * dy;
            if (distSq < minDistanceSq) {
                minDistanceSq = distSq;
                closestIndex = index;
            }
        });

        if (closestIndex !== -1) {
            const chosenShape = freeShapes.splice(closestIndex, 1)[0];
            chosenShape.targetCell = cell;
        }
    }
}

function createEquilateralTriangleMatrix() {
    const rows = 22;
    const cols = 25;
    const center = 12;
    const matrix = [];

    for (let r = 0; r < rows; r++) {
        const rowArr = Array(cols).fill(0);
        const halfWidth = Math.round((r / (rows - 1)) * center);
        for (let c = center - halfWidth; c <= center + halfWidth; c++) {
            rowArr[c] = 1;
        }
        matrix.push(rowArr);
    }
    return matrix;
}

const shapeMatrices = {
    'x': [
        [1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1],
        [0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0],
        [0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0],
        [0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0],
        [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
        [0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0],
        [0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0],
        [0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0],
        [1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1],
        [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]
    ],
    'triangle': createEquilateralTriangleMatrix(),
    'square': Array.from({ length: 25 }, () => Array(25).fill(1)),
    'circle': [
        [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
        [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
        [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
        [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
        [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ]
};

const shapeKeys = ['x', 'triangle', 'square', 'circle'];

function getBalancedShapeType(existingShapes) {
    const counts = { 'x': 0, 'triangle': 0, 'square': 0, 'circle': 0 };
    existingShapes.forEach(s => {
        if (counts[s.type] !== undefined) counts[s.type]++;
    });

    let minCount = Infinity;
    let candidates = [];
    for (const type of shapeKeys) {
        if (counts[type] < minCount) {
            minCount = counts[type];
            candidates = [type];
        } else if (counts[type] === minCount) {
            candidates.push(type);
        }
    }
    return candidates[Math.floor(Math.random() * candidates.length)];
}

class FloatingShape {
    constructor(existingShapes = []) {
        this.type = getBalancedShapeType(existingShapes);
        this.matrix = shapeMatrices[this.type];

        this.x = Math.random() * width;
        this.y = Math.random() * height;

        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;

        this.rotation = Math.random() * Math.PI * 2;
        this.vRot = (Math.random() - 0.5) * 0.008;

        this.dotRadius = 2.0;
        this.spacing = 10.8;
        this.opacity = Math.random() * 0.35 + 0.1;

        // Raio para colisão física entre os centros das formas (~125px)
        this.radius = (25 * this.spacing) / 2.1;
        this.targetCell = null;
    }

    update() {
        if (this.targetCell) {
            const dx = this.targetCell.x - this.x;
            const dy = this.targetCell.y - this.y;
            const dist = Math.hypot(dx, dy);

            if (dist < 100) {
                this.targetCell = null;
            } else {
                const targetVx = (dx / dist) * 0.4;
                const targetVy = (dy / dist) * 0.4;
                
                this.vx += (targetVx - this.vx) * 0.015;
                this.vy += (targetVy - this.vy) * 0.015;
            }
        }

        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.vRot;

        // Wrap em volta da tela com liberação de alvo
        const size = this.matrix.length * this.spacing;
        if (this.x > width + size) { this.x = -size; this.targetCell = null; }
        if (this.x < -size) { this.x = width + size; this.targetCell = null; }
        if (this.y > height + size) { this.y = -size; this.targetCell = null; }
        if (this.y < -size) { this.y = height + size; this.targetCell = null; }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        ctx.fillStyle = `rgba(150, 150, 150, ${this.opacity})`;

        const cols = this.matrix[0].length;
        const rows = this.matrix.length;
        
        // Alinhamento perfeito considerando as dimensões reais de cada matriz
        const offsetX = -((cols - 1) * this.spacing) / 2;
        const offsetY = -((rows - 1) * this.spacing) / 2;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (this.matrix[row][col] === 1) {
                    ctx.beginPath();
                    ctx.arc(
                        offsetX + col * this.spacing,
                        offsetY + row * this.spacing,
                        this.dotRadius,
                        0,
                        Math.PI * 2
                    );
                    ctx.fill();
                }
            }
        }

        ctx.restore();
    }
}

// Resolução de colisão circular entre o centro de cada figura
function handleCollisions(shapes) {
    for (let i = 0; i < shapes.length; i++) {
        for (let j = i + 1; j < shapes.length; j++) {
            const s1 = shapes[i];
            const s2 = shapes[j];

            const dx = s2.x - s1.x;
            const dy = s2.y - s1.y;
            const dist = Math.hypot(dx, dy);
            const minDist = s1.radius + s2.radius;

            if (dist < minDist && dist > 0) {
                const overlap = (minDist - dist) / 2;
                const nx = dx / dist;
                const ny = dy / dist;

                // Afasta suavemente as duas formas para não se sobreporem
                s1.x -= nx * overlap * 0.08;
                s1.y -= ny * overlap * 0.08;
                s2.x += nx * overlap * 0.08;
                s2.y += ny * overlap * 0.08;

                // Ajuste suave da velocidade no impacto
                const relativeVx = s1.vx - s2.vx;
                const relativeVy = s1.vy - s2.vy;
                const velAlongNormal = relativeVx * nx + relativeVy * ny;

                if (velAlongNormal > 0) {
                    const impulse = velAlongNormal * 0.04;
                    s1.vx -= impulse * nx;
                    s1.vy -= impulse * ny;
                    s2.vx += impulse * nx;
                    s2.vy += impulse * ny;
                }
            }
        }
    }
}

const shapes = [];
const TOTAL_SHAPES = 12;

for (let i = 0; i < TOTAL_SHAPES; i++) {
    shapes.push(new FloatingShape(shapes));
}

function animate() {
    ctx.clearRect(0, 0, width, height);

    manageEmptySpaces(shapes);
    handleCollisions(shapes);

    shapes.forEach(shape => {
        shape.update();
        shape.draw();
    });

    requestAnimationFrame(animate);
}

animate();