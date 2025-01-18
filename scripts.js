const player = document.getElementById('player');
const minimapPlayer = document.getElementById('minimap-player');
const gameArea = document.getElementById('gameArea');
const viewport = document.getElementById('viewport');
const minimapViewport = document.getElementById('minimap-viewport');

const GAME_WIDTH = 4000;
const GAME_HEIGHT = 4000;
const MINIMAP_SIZE = 200;

let x = GAME_WIDTH / 2;
let y = GAME_HEIGHT / 2;
let cameraX = x - window.innerWidth / 2;
let cameraY = y - window.innerHeight / 2;
const speed = 5;

// Track pressed keys
const keys = {
    w: false,
    s: false,
    a: false,
    d: false,
    space: false
};

function updateCamera() {
    // Update camera position
    gameArea.style.transform = `translate(${-cameraX}px, ${-cameraY}px)`;
    
    // Update minimap viewport indicator
    const viewportWidth = (window.innerWidth / GAME_WIDTH) * MINIMAP_SIZE;
    const viewportHeight = (window.innerHeight / GAME_HEIGHT) * MINIMAP_SIZE;
    const viewportX = (cameraX / GAME_WIDTH) * MINIMAP_SIZE;
    const viewportY = (cameraY / GAME_HEIGHT) * MINIMAP_SIZE;
    
    minimapViewport.style.width = viewportWidth + 'px';
    minimapViewport.style.height = viewportHeight + 'px';
    minimapViewport.style.left = viewportX + 'px';
    minimapViewport.style.top = viewportY + 'px';
}

// Update player position
function updatePosition() {
    player.style.left = x + 'px';
    player.style.top = y + 'px';
    
    // Update minimap position
    const minimapX = (x / GAME_WIDTH) * MINIMAP_SIZE;
    const minimapY = (y / GAME_HEIGHT) * MINIMAP_SIZE;
    minimapPlayer.style.left = minimapX + 'px';
    minimapPlayer.style.top = minimapY + 'px';
}

// Center camera on player
function centerCamera() {
    cameraX = x - window.innerWidth / 2;
    cameraY = y - window.innerHeight / 2;
    
    // Keep camera within bounds
    cameraX = Math.max(0, Math.min(cameraX, GAME_WIDTH - window.innerWidth));
    cameraY = Math.max(0, Math.min(cameraY, GAME_HEIGHT - window.innerHeight));
}

// Game loop
function gameLoop() {
    if (keys.w) y -= speed;
    if (keys.s) y += speed;
    if (keys.a) x -= speed;
    if (keys.d) x += speed;
    
    // Keep player within bounds
    x = Math.max(0, Math.min(x, GAME_WIDTH - 50));
    y = Math.max(0, Math.min(y, GAME_HEIGHT - 50));
    
    // Center camera if space is pressed
    if (keys.space) {
        centerCamera();
    }
    
    updatePosition();
    updateCamera();
    requestAnimationFrame(gameLoop);
}

// Building selection
const buildingOptions = document.querySelectorAll('.building-option');
let selectedBuilding = null;

function selectBuilding(building) {
    // Remove previous selection
    if (selectedBuilding) {
        selectedBuilding.classList.remove('selected');
    }
    
    // Add new selection
    if (building !== selectedBuilding) {
        building.classList.add('selected');
        selectedBuilding = building;
    } else {
        selectedBuilding = null;
    }
}

// Handle building clicks
buildingOptions.forEach(building => {
    building.addEventListener('click', () => selectBuilding(building));
});

// Handle keyboard input
document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (key === ' ') {
        keys.space = true;
    } else if (keys.hasOwnProperty(key)) {
        keys[key] = true;
    }
    
    // Building hotkeys (1,2,3)
    if (key >= '1' && key <= '3') {
        const building = document.querySelector(`.building-option[data-key="${key}"]`);
        if (building) {
            selectBuilding(building);
        }
    }
});

document.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (key === ' ') {
        keys.space = false;
    } else if (keys.hasOwnProperty(key)) {
        keys[key] = false;
    }
});

// Initialize
centerCamera();
gameLoop();
