const player = document.getElementById('player');
const minimapPlayer = document.getElementById('minimap-player');
const gameArea = document.getElementById('gameArea');
const viewport = document.getElementById('viewport');
const minimapViewport = document.getElementById('minimap-viewport');
const ghostBuilding = document.getElementById('ghost-building');
const buildRange = document.getElementById('build-range');
const fogContainer = document.getElementById('fog-container');
const minimapFogContainer = document.getElementById('minimap-fog-container');
const buildingMenu = document.getElementById('building-menu');
const buildingOptions = Array.from(document.querySelectorAll('.building-option'));

// Initialize building menu
if (buildingOptions.length === 0) {
    console.error('Building options not found!');
} else {
    console.log('Found', buildingOptions.length, 'building options');
    buildingOptions.forEach(option => {
        console.log('Building option:', option.dataset.key);
    });
}

const GAME_WIDTH = 4000;
const GAME_HEIGHT = 4000;
const MINIMAP_SIZE = 200;
const GRID_SIZE = 50;
const BUILD_RANGE = 200;  // Reduced from 300 to 200 for smaller range
const CHUNK_SIZE = 100;  // Changed from 50 to 100
const VISION_RANGE = 250; // Reveal 5x5 grid squares around player

// Initialize fog of war
const chunks = new Map(); // Store fog chunks by their coordinates
const minimapChunks = new Map();

let fogUpdatePending = false;
let lastPlayerChunkX = null;
let lastPlayerChunkY = null;

function initializeFog() {
    const numChunksX = Math.ceil(GAME_WIDTH / CHUNK_SIZE);
    const numChunksY = Math.ceil(GAME_HEIGHT / CHUNK_SIZE);
    
    for (let cy = 0; cy < numChunksY; cy++) {
        for (let cx = 0; cx < numChunksX; cx++) {
            const chunk = document.createElement('div');
            chunk.className = 'fog-chunk';
            chunk.style.left = (cx * CHUNK_SIZE) + 'px';
            chunk.style.top = (cy * CHUNK_SIZE) + 'px';
            fogContainer.appendChild(chunk);
            chunks.set(`${cx},${cy}`, chunk);
        }
    }
}

function initializeMinimapFog() {
    const chunkSize = MINIMAP_SIZE / (GAME_WIDTH / CHUNK_SIZE); // Scale chunks to minimap size
    const numChunksX = Math.ceil(GAME_WIDTH / CHUNK_SIZE);
    const numChunksY = Math.ceil(GAME_HEIGHT / CHUNK_SIZE);
    
    for (let cy = 0; cy < numChunksY; cy++) {
        for (let cx = 0; cx < numChunksX; cx++) {
            const chunk = document.createElement('div');
            chunk.className = 'minimap-fog-chunk';
            chunk.style.left = (cx * chunkSize) + 'px';
            chunk.style.top = (cy * chunkSize) + 'px';
            chunk.style.width = chunkSize + 'px';
            chunk.style.height = chunkSize + 'px';
            minimapFogContainer.appendChild(chunk);
            minimapChunks.set(`${cx},${cy}`, chunk);
        }
    }
}

function updateFogOfWar() {
    // Calculate player center position and chunk
    const playerCenterX = x + 25;
    const playerCenterY = y + 25;
    const playerChunkX = Math.floor(playerCenterX / CHUNK_SIZE);
    const playerChunkY = Math.floor(playerCenterY / CHUNK_SIZE);
    
    // Calculate visible area in chunks around player
    const visibleStartX = playerChunkX - 5;
    const visibleEndX = playerChunkX + 5;
    const visibleStartY = playerChunkY - 5;
    const visibleEndY = playerChunkY + 5;
    
    // Calculate viewport chunks
    const viewportStartX = Math.floor(cameraX / CHUNK_SIZE);
    const viewportEndX = Math.ceil((cameraX + window.innerWidth) / CHUNK_SIZE);
    const viewportStartY = Math.floor(cameraY / CHUNK_SIZE);
    const viewportEndY = Math.ceil((cameraY + window.innerHeight) / CHUNK_SIZE);
    
    // Calculate vision radius in chunks
    const chunkRadius = 3;   // Adjusted for new chunk size to maintain similar vision range
    
    // Reset chunks that were visible but aren't anymore
    chunks.forEach((chunk, key) => {
        const [cx, cy] = key.split(',').map(Number);
        
        // Check if chunk is in viewport
        const inViewport = cx >= viewportStartX && cx <= viewportEndX && 
                         cy >= viewportStartY && cy <= viewportEndY;
        
        // Check if chunk is in player vision range
        const inPlayerVision = Math.abs(cx - playerChunkX) <= chunkRadius && 
                             Math.abs(cy - playerChunkY) <= chunkRadius;
        
        // Check if chunk is in building vision
        let inBuildingVision = false;
        for (const building of placedBuildings) {
            const buildingChunkX = Math.floor((building.x + 50) / CHUNK_SIZE);
            const buildingChunkY = Math.floor((building.y + 50) / CHUNK_SIZE);
            if (Math.abs(cx - buildingChunkX) <= 2 && Math.abs(cy - buildingChunkY) <= 2) {
                inBuildingVision = true;
                break;
            }
        }
        
        // Update main fog visibility (based on viewport)
        const shouldBeVisible = inPlayerVision || (inViewport && inBuildingVision);
        const isVisible = chunk.classList.contains('visible');
        
        if (shouldBeVisible !== isVisible) {
            if (shouldBeVisible) {
                chunk.classList.add('visible');
                chunk.classList.add('explored');
            } else {
                chunk.classList.remove('visible');
                if (!chunk.classList.contains('explored')) {
                    chunk.classList.add('explored');
                }
            }
        }
        
        // Update minimap chunk (buildings always provide vision on minimap)
        const minimapChunk = minimapChunks.get(key);
        if (minimapChunk) {
            minimapChunk.className = 'minimap-fog-chunk';
            
            // For minimap, buildings always provide vision regardless of viewport
            const minimapVisible = inPlayerVision || inBuildingVision;
            
            if (chunk.classList.contains('explored') || minimapVisible) {
                minimapChunk.classList.add('explored');
            }
            if (minimapVisible) {
                minimapChunk.classList.add('visible');
            }
        }
    });
}

function updateMinimapFog() {
    // Reset all minimap chunks to match main fog chunks
    chunks.forEach((mainChunk, key) => {
        const minimapChunk = minimapChunks.get(key);
        if (minimapChunk) {
            minimapChunk.className = 'minimap-fog-chunk';
            if (mainChunk.classList.contains('explored')) {
                minimapChunk.classList.add('explored');
            }
            if (mainChunk.classList.contains('visible')) {
                minimapChunk.classList.add('visible');
            }
        }
    });
}

function scheduleFogUpdate() {
    if (!fogUpdatePending) {
        fogUpdatePending = true;
        requestAnimationFrame(() => {
            updateFogOfWar();
            fogUpdatePending = false;
        });
    }
}

let x = GAME_WIDTH / 2;
let y = GAME_HEIGHT / 2;
let cameraX = x - window.innerWidth / 2;
let cameraY = y - window.innerHeight / 2;
const baseSpeed = 5;
let speed = baseSpeed;
const keys = {
    w: false,
    s: false,
    a: false,
    d: false,
    space: false,
    shift: false
};

// Add camera follow state
let cameraFollowEnabled = false;

// Building system
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
    // Check for collisions before placing
    if (checkBuildingCollision(x, y)) {
        return false;
    }

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
        }
    }, 200); // Adjust the interval timing for gradual building effect

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

function buildWithCooldown(buildFunction, cooldownTime, totalBuildings) {
    let count = 0;
    let isOnCooldown = false;
    const interval = setInterval(() => {
        if (count < totalBuildings && !isOnCooldown) {
            console.log(`Building structure ${count + 1}`); // Log building action
            console.log('Calling build function...'); // Log build function call
            buildFunction(); // Call the building function
            console.log('Build function called successfully.'); // Log build function success
            count++;
            isOnCooldown = true;
            setTimeout(() => {
                console.log('Cooldown ended.'); // Log cooldown end
                isOnCooldown = false;
            }, cooldownTime);
        } else if (count >= totalBuildings) {
            clearInterval(interval); // Clear the interval when done
            console.log('All buildings have been placed.'); // Log completion
        }
    }, 1);
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
            buildWithCooldown(() => placeBuilding(gridX, gridY), 2000, 5); // Builds 5 structures with a 2-second cooldown
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
    console.log('Selecting building:', building);
    // Remove previous selection
    if (selectedBuilding) {
        selectedBuilding.classList.remove('selected');
    }
    
    // Add new selection
    if (building !== selectedBuilding) {
        building.classList.add('selected');
        selectedBuilding = building;
        console.log('New building selected');
    } else {
        selectedBuilding = null;
        console.log('Building deselected');
    }
    
    // Update build range visibility
    updateBuildRange();
}

function updateBuildRange() {
    if (selectedBuilding) {
        buildRange.style.display = 'block';
        buildRange.style.width = (BUILD_RANGE * 2) + 'px';
        buildRange.style.height = (BUILD_RANGE * 2) + 'px';
        
        // Use exact player position for smooth movement
        buildRange.style.left = (x + 25) + 'px';  // Add half player width
        buildRange.style.top = (y + 25) + 'px';   // Add half player height
    } else {
        buildRange.style.display = 'none';
    }
}

// Handle building clicks
buildingOptions.forEach(building => {
    building.addEventListener('click', () => selectBuilding(building));
});

function updateCamera() {
    // Center camera if space is held OR camera follow is enabled
    if (keys.space || cameraFollowEnabled) {
        centerCamera();
    }
    
    gameArea.style.transform = `translate(${-cameraX}px, ${-cameraY}px)`;
    
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

    // Always update fog when position changes to ensure minimap stays current
    scheduleFogUpdate();
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
    
    // Only update fog if player moved to new chunk
    const currentChunkX = Math.floor((x + 25) / CHUNK_SIZE);
    const currentChunkY = Math.floor((y + 25) / CHUNK_SIZE);
    
    if (currentChunkX !== lastPlayerChunkX || currentChunkY !== lastPlayerChunkY) {
        lastPlayerChunkX = currentChunkX;
        lastPlayerChunkY = currentChunkY;
        scheduleFogUpdate();
    }
    
    updateCamera();
    updateGhostBuilding();
    updateBuildRange();
    moveCamera();
    
    requestAnimationFrame(gameLoop);
}

// Edge scrolling functionality
const cameraSpeed = 15; // Increased speed from 5 to 15
const edgeThreshold = 20; // Distance from edge to trigger camera movement

let moveLeft = false;
let moveRight = false;
let moveUp = false;
let moveDown = false;

function moveCamera() {
    if (moveLeft) cameraX -= cameraSpeed;
    if (moveRight) cameraX += cameraSpeed;
    if (moveUp) cameraY -= cameraSpeed;
    if (moveDown) cameraY += cameraSpeed;

    // Clamp camera position to game boundaries
    cameraX = Math.max(0, Math.min(cameraX, GAME_WIDTH - window.innerWidth));
    cameraY = Math.max(0, Math.min(cameraY, GAME_HEIGHT - window.innerHeight));
    updateCamera();
}

document.addEventListener('mousemove', (event) => {
    const { clientX, clientY } = event;
    const { innerWidth, innerHeight } = window;
    
    moveLeft = clientX <= edgeThreshold;
    moveRight = clientX >= innerWidth - edgeThreshold;
    moveUp = clientY <= edgeThreshold;
    moveDown = clientY >= innerHeight - edgeThreshold;
});

// Handle keyboard input
document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    
    // Handle spacebar
    if (key === ' ') {
        keys.space = true;
        return;
    }
    
    // Handle WASD
    if (key in keys) {
        keys[key] = true;
    }
    
    // Handle shift for speed boost
    if (key === 'shift') {
        speed = baseSpeed * 2; // Double the speed when shift is pressed
    }
    
    // Toggle camera follow with 'Y' key
    if (key === 'y') {
        cameraFollowEnabled = !cameraFollowEnabled;
    }
    
    // Building hotkeys (1,2,3)
    if (e.key >= '1' && e.key <= '3') {
        console.log('Building hotkey pressed:', e.key);
        const building = buildingOptions.find(b => b.dataset.key === e.key);
        if (building) {
            console.log('Found building:', building);
            selectBuilding(building);
        }
    }
});

document.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    
    // Handle spacebar
    if (key === ' ') {
        keys.space = false;
        return;
    }
    
    // Handle WASD
    if (key in keys) {
        keys[key] = false;
    }
    
    // Reset speed when shift is released
    if (key === 'shift') {
        speed = baseSpeed;
    }
});

// Initialize
initializeFog();
initializeMinimapFog();
centerCamera();
setInterval(moveCamera, 1000 / 60); // 60 FPS
gameLoop();
