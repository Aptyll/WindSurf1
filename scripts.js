const player = document.getElementById('player');
const minimapPlayer = document.getElementById('minimap-player');
let x = window.innerWidth / 2;
let y = window.innerHeight / 2;
const speed = 5;

// Track pressed keys
const keys = {
    w: false,
    s: false,
    a: false,
    d: false
};

// Update player position
function updatePosition() {
    player.style.left = x + 'px';
    player.style.top = y + 'px';
    
    // Update minimap position (scaled down by 10)
    const minimapX = (x / window.innerWidth) * 200;
    const minimapY = (y / window.innerHeight) * 200;
    minimapPlayer.style.left = minimapX + 'px';
    minimapPlayer.style.top = minimapY + 'px';
}

// Game loop
function gameLoop() {
    if (keys.w) y -= speed;
    if (keys.s) y += speed;
    if (keys.a) x -= speed;
    if (keys.d) x += speed;
    
    // Keep player within bounds
    x = Math.max(0, Math.min(x, window.innerWidth - 50));
    y = Math.max(0, Math.min(y, window.innerHeight - 50));
    
    updatePosition();
    requestAnimationFrame(gameLoop);
}

// Handle keyboard input
document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (keys.hasOwnProperty(key)) {
        keys[key] = true;
    }
});

document.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (keys.hasOwnProperty(key)) {
        keys[key] = false;
    }
});

// Start the game loop
gameLoop();
