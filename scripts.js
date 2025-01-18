const player = document.getElementById('player');
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
}

// Game loop
function gameLoop() {
    if (keys.w) y -= speed;
    if (keys.s) y += speed;
    if (keys.a) x -= speed;
    if (keys.d) x += speed;
    
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