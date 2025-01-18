const player = document.getElementById('player');
const minimapPlayer = document.getElementById('minimap-player');
const gameArea = document.getElementById('gameArea');
const viewport = document.getElementById('viewport');
const minimapViewport = document.getElementById('minimap-viewport');
const ghostBuilding = document.getElementById('ghost-building');
const buildRange = document.getElementById('build-range');

const GAME_WIDTH = 4000;
const GAME_HEIGHT = 4000;
const MINIMAP_SIZE = 200;
const GRID_SIZE = 50;
const BUILD_RANGE = 300; // Maximum distance from player to build
const BUILD_COOLDOWN = 3000; // 3 seconds cooldown
let buildingCooldown = false;

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

// Building system
const buildingOptions = document.querySelectorAll('.building-option');
let selectedBuilding = null;
let mouseX = 0;
let mouseY = 0;
const placedBuildings = [];

function checkBuildingCollision(x, y, width = 100, height = 100) {
    // Check if the new building overlaps with any existing building
    return placedBuildings.some(building => {
        return !(x + width <= building.x ||
                x >= building.x + building.width ||
                y + height <= building.y ||
                y >= building.y + building.height);
    });
}

function updateGhostBuilding() {
    if (!selectedBuilding) {
        ghostBuilding.style.display = 'none';
        return;
    }

    // Calculate grid-snapped position
    const gridX = Math.floor((mouseX + cameraX) / GRID_SIZE) * GRID_SIZE;
    const gridY = Math.floor((mouseY + cameraY) / GRID_SIZE) * GRID_SIZE;

    // Check if position is valid (within build range)
    const distanceToPlayer = Math.max(
        Math.abs(gridX - x),
        Math.abs(gridY - y)
    );

    const isInRange = distanceToPlayer <= BUILD_RANGE;
    const hasCollision = checkBuildingCollision(gridX, gridY);
    const isValid = isInRange && !hasCollision;

    // Update ghost building position and style
    ghostBuilding.style.display = 'block';
    ghostBuilding.style.left = gridX + 'px';
    ghostBuilding.style.top = gridY + 'px';
    ghostBuilding.classList.toggle('invalid', !isValid);

    return { gridX, gridY, isValid };
}

function placeBuilding(x, y) {
    if (buildingCooldown) return; // Prevent building if cooldown is active
    buildingCooldown = true; // Activate cooldown

    const building = document.createElement('div');
    building.className = 'building';
    building.style.position = 'absolute';
    building.style.left = `${x}px`;
    building.style.top = `${y}px`;
    building.style.opacity = 0; // Start with low opacity
    document.getElementById('gameArea').appendChild(building);

    // Gradually build the structure over time
    let progress = 0;
    const interval = setInterval(() => {
        progress += 100; // Update progress
        building.style.opacity = progress / 1000; // Fade in effect from 0 to 1
        if (progress >= 1000) {
            clearInterval(interval);
            buildingCooldown = false; // Reset cooldown
        }
    }, BUILD_COOLDOWN / 10); // Adjust the interval timing

    // Create minimap indicator for the building
    const minimapBuilding = document.createElement('div');
    minimapBuilding.className = 'minimap-building';
    minimapBuilding.style.left = (x / GAME_WIDTH) * MINIMAP_SIZE + 'px';
    minimapBuilding.style.top = (y / GAME_HEIGHT) * MINIMAP_SIZE + 'px';
    document.getElementById('minimap').appendChild(minimapBuilding);
    
    // Store building with its dimensions and minimap element
    placedBuildings.push({ 
        x, 
        y, 
        width: 100, 
        height: 100,
        element: building,
        minimapElement: minimapBuilding
    });
    
    return true;
}

// Mouse position tracking
viewport.addEventListener('mousemove', (e) => {
    const rect = viewport.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

// Building placement
viewport.addEventListener('click', (e) => {
    if (selectedBuilding) {
        const { gridX, gridY, isValid } = updateGhostBuilding();
        if (isValid) {
            placeBuilding(gridX, gridY);
        }
    }
});

// Right click to cancel building placement
viewport.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (selectedBuilding) {
        selectBuilding(selectedBuilding);
    }
});

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
    
    // Update build range visibility
    updateBuildRange();
}

function updateBuildRange() {
    if (selectedBuilding) {
        buildRange.style.display = 'block';
        buildRange.style.left = x + 'px';
        buildRange.style.top = y + 'px';
        // Make sure the range is divisible by grid size
        const rangeSize = Math.floor(BUILD_RANGE / GRID_SIZE) * GRID_SIZE * 2;
        buildRange.style.width = rangeSize + 'px';
        buildRange.style.height = rangeSize + 'px';
    } else {
        buildRange.style.display = 'none';
    }
}

// Handle building clicks
buildingOptions.forEach(building => {
    building.addEventListener('click', () => selectBuilding(building));
});

function updateCamera() {
    cameraX = x - window.innerWidth / 2;
    cameraY = y - window.innerHeight / 2;

    // Update the camera position based on player's coordinates
    viewport.style.transform = `translate(${-cameraX}px, ${-cameraY}px)`;
    
    const viewportWidth = (window.innerWidth / GAME_WIDTH) * MINIMAP_SIZE;
    const viewportHeight = (window.innerHeight / GAME_HEIGHT) * MINIMAP_SIZE;
    const viewportX = (cameraX / GAME_WIDTH) * MINIMAP_SIZE;
    const viewportY = (cameraY / GAME_HEIGHT) * MINIMAP_SIZE;
    
    minimapViewport.style.width = viewportWidth + 'px';
    minimapViewport.style.height = viewportHeight + 'px';
    minimapViewport.style.left = viewportX + 'px';
    minimapViewport.style.top = viewportY + 'px';
}

function updatePosition() {
    player.style.left = x + 'px';
    player.style.top = y + 'px';
    
    const minimapX = (x / GAME_WIDTH) * MINIMAP_SIZE;
    const minimapY = (y / GAME_HEIGHT) * MINIMAP_SIZE;
    minimapPlayer.style.left = minimapX + 'px';
    minimapPlayer.style.top = minimapY + 'px';
}

function centerCamera() {
    cameraX = x - window.innerWidth / 2;
    cameraY = y - window.innerHeight / 2;
    cameraX = Math.max(0, Math.min(cameraX, GAME_WIDTH - window.innerWidth));
    cameraY = Math.max(0, Math.min(cameraY, GAME_HEIGHT - window.innerHeight));
}

function gameLoop() {
    if (keys.w) y -= speed;
    if (keys.s) y += speed;
    if (keys.a) x -= speed;
    if (keys.d) x += speed;
    
    x = Math.max(0, Math.min(x, GAME_WIDTH - 50));
    y = Math.max(0, Math.min(y, GAME_HEIGHT - 50));
    
    if (keys.space) {
        centerCamera();
    }
    
    updatePosition();
    updateCamera();
    updateGhostBuilding();
    updateBuildRange();
    requestAnimationFrame(gameLoop);
}

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

// Touch controls for mobile
viewport.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevent default touch behavior
    const touch = e.touches[0];
    const rect = viewport.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;

    // Move player or place building based on touch position
    if (selectedBuilding) {
        const { gridX, gridY, isValid } = updateGhostBuilding();
        if (isValid) {
            placeBuilding(gridX, gridY);
        }
    } else {
        x = touchX;
        y = touchY;
    }
});

viewport.addEventListener('touchmove', (e) => {
    e.preventDefault(); // Prevent default touch behavior
    const touch = e.touches[0];
    const rect = viewport.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;

    // Update player position based on touch movement
    x = touchX;
    y = touchY;
});

viewport.addEventListener('touchend', (e) => {
    // Handle touch end event if needed
});

// Initialize
centerCamera();
gameLoop();
