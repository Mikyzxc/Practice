// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const landingScreen = document.getElementById('landing');
  const storyScreen = document.getElementById('story');
  const gameScreen = document.getElementById('game');
  const winScreen = document.getElementById('winScreen');
  const btnStartLanding = document.getElementById('btn-start-landing');
  const btnStartGame = document.getElementById('btn-start-game');
  const btnEnterDoor = document.getElementById('btn-enter-door');

  function showScreen(screenElement) {
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    screenElement.classList.add('active');
  }

  btnStartLanding.addEventListener('click', () => showScreen(storyScreen));
  btnStartGame.addEventListener('click', () => {
    showScreen(gameScreen);
    startGame();
  });
  btnEnterDoor.addEventListener('click', () => {
    alert('You step through the door... The future begins.');
    showScreen(landingScreen);
  });

  // === GAME CODE ===
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const healthFill = document.getElementById('healthFill');
  const bossFill = document.getElementById('bossFill');
  const bossHealthBar = document.getElementById('bossHealth');

  let mouseX = 0, mouseY = 0;
  const keys = { w: false, a: false, d: false, space: false };
  const MAP_WIDTH = 7000; // 🔥 Longer map!
  const GRAVITY = 0.6;
  const FRICTION = 0.85;
  const PLAYER_SPEED = 6;
  const JUMP_FORCE = -14;
  const BULLET_SPEED = 12;

  let player, platforms, enemies, bullets, weaponPickups, camera, gameRunning = false;
  let playerHealth = 100;
  let boss = null;
  let currentWeapon = 'pistol';
  let isShooting = false;

  function updateHealthBar() {
    const clampedHealth = Math.max(0, Math.min(playerHealth, 100));
    healthFill.style.width = `${clampedHealth}%`;
    
    // Update health bar color based on remaining health
    if (clampedHealth > 60) {
      healthFill.style.background = '#00ffaa';
    } else if (clampedHealth > 30) {
      healthFill.style.background = '#ffcc00';
    } else {
      healthFill.style.background = '#ff5555';
    }

    // Update numeric health display
    document.getElementById('healthValue').textContent = Math.floor(clampedHealth);
  }

  class Player {
    constructor() {
      this.x = 100;
      this.y = 400;
      this.width = 40;
      this.height = 60;
      this.velX = 0;
      this.velY = 0;
      this.grounded = false;
      this.lastShot = 0;
    }

    get shotDelay() {
      return currentWeapon === 'pistol' ? 300 : currentWeapon === 'shotgun' ? 500 : 200;
    }

    update() {
      this.velX = 0;
      if (keys.a) this.velX = -PLAYER_SPEED;
      if (keys.d) this.velX = PLAYER_SPEED;
      if (!keys.a && !keys.d) this.velX *= FRICTION;

      // Jump with W or SPACE
      if ((keys.w || keys.space) && this.grounded) {
        this.velY = JUMP_FORCE;
        this.grounded = false;
      }

      if (!this.grounded) this.velY += GRAVITY;
      this.x += this.velX;
      this.y += this.velY;

      // Floor collision (only at very bottom)
      if (this.y > canvas.height - this.height - 50) {
        this.y = canvas.height - this.height - 50;
        this.grounded = true;
        this.velY = 0;
      } else {
        this.grounded = false; // ✅ Critical: only grounded on floor or platforms
      }

      if (this.x < 0) this.x = 0;
      if (this.x > MAP_WIDTH - this.width) this.x = MAP_WIDTH - this.width;

      if (isShooting && Date.now() - this.lastShot > this.shotDelay) {
        this.lastShot = Date.now();
        const worldMouseX = mouseX + camera.x;
        const worldMouseY = mouseY;
        const angle = Math.atan2(worldMouseY - (this.y + this.height / 2), worldMouseX - (this.x + this.width / 2));
        const spread = currentWeapon === 'shotgun' ? [-0.3, 0, 0.3] : [0];
        const damage = currentWeapon === 'pistol' ? 10 : currentWeapon === 'shotgun' ? 20 : 30;

        spread.forEach(offset => {
          const dx = Math.cos(angle + offset) * BULLET_SPEED;
          const dy = Math.sin(angle + offset) * BULLET_SPEED;
          bullets.push({
            x: this.x + this.width / 2,
            y: this.y + this.height / 2,
            width: 8,
            height: 4,
            speedX: dx,
            speedY: dy,
            damage: damage / spread.length,
            fromPlayer: true
          });
        });
      }
    }

    draw() {
      ctx.fillStyle = '#4e9af1';
      ctx.fillRect(this.x - camera.x, this.y, this.width, this.height);
      ctx.fillStyle = 'white';
      ctx.fillRect(this.x - camera.x + 25, this.y + 10, 8, 8);

      const worldMouseX = mouseX + camera.x;
      const worldMouseY = mouseY;
      const angle = Math.atan2(worldMouseY - (this.y + this.height / 2), worldMouseX - (this.x + this.width / 2));
      ctx.save();
      ctx.translate(this.x - camera.x + this.width, this.y + this.height / 2);
      ctx.rotate(angle);
      ctx.fillStyle = '#ff5555';
      ctx.fillRect(0, -2, 12, 4);
      ctx.restore();

      ctx.fillStyle = 'white';
      ctx.font = '12px Arial';
      ctx.fillText(currentWeapon.toUpperCase(), this.x - camera.x, this.y - 10);
    }
  }

  class Platform {
    constructor(x, y, w, h, slope = 0) {
      this.x = x;
      this.y = y;
      this.width = w;
      this.height = h;
      this.slope = slope;
    }

    draw() {
      ctx.fillStyle = '#5d8aa8';
      if (this.slope === 0) {
        ctx.fillRect(this.x - camera.x, this.y, this.width, this.height);
      } else {
        ctx.beginPath();
        ctx.moveTo(this.x - camera.x, this.y + this.height);
        ctx.lineTo(this.x - camera.x + this.width, this.y + this.height);
        if (this.slope === 1) {
          ctx.lineTo(this.x - camera.x + this.width, this.y);
        } else if (this.slope === -1) {
          ctx.lineTo(this.x - camera.x, this.y);
        }
        ctx.closePath();
        ctx.fill();
      }
    }

    // ✅ Returns collision Y if grounded, or null
    getGroundY(player) {
      if (this.slope === 0) {
        if (
          player.x + player.width > this.x &&
          player.x < this.x + this.width &&
          player.y + player.height <= this.y + 10 &&
          player.y + player.height + player.velY >= this.y
        ) {
          return this.y;
        }
      } else {
        const leftEdge = this.x;
        const rightEdge = this.x + this.width;
        if (player.x + player.width < leftEdge || player.x > rightEdge) return null;

        const progress = (player.x - leftEdge) / this.width;
        const slopeHeight = this.slope === 1 ? this.y + this.height - progress * this.height : this.y + progress * this.height;

        if (
          player.y + player.height <= slopeHeight + 10 &&
          player.y + player.height + player.velY >= slopeHeight
        ) {
          return slopeHeight;
        }
      }
      return null;
    }
  }

  class Enemy {
    constructor(x, y, type) {
      this.x = x;
      this.y = y;
      this.width = 35;
      this.height = 50;
      this.type = type;
      this.active = false;
      this.health = type === 'melee' ? 30 : 50;
      this.lastShot = 0;
      this.speed = type === 'melee' ? 1.5 : 0;
    }

    update(player) {
      if (Math.abs(player.x - this.x) < 600) this.active = true;
      if (!this.active) return;

      if (this.type === 'melee') {
        if (player.x > this.x) this.x += this.speed;
        else if (player.x < this.x) this.x -= this.speed;
      }

      if (this.type === 'shooter' && Date.now() - this.lastShot > 1200) {
        this.lastShot = Date.now();
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        bullets.push({
          x: this.x + this.width / 2,
          y: this.y + this.height / 2,
          width: 8,
          height: 4,
          speedX: Math.cos(angle) * BULLET_SPEED,
          speedY: Math.sin(angle) * BULLET_SPEED,
          damage: 5,
          fromPlayer: false
        });
      }

      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        if (b.fromPlayer && 
            b.x + b.width > this.x &&
            b.x < this.x + this.width &&
            b.y + b.height > this.y &&
            b.y < this.y + this.height) {
          this.health -= b.damage;
          bullets.splice(i, 1);
          if (this.health <= 0) {
            enemies.splice(enemies.indexOf(this), 1);
          }
        }
      }
    }

    draw() {
      if (!this.active) return;
      ctx.fillStyle = this.type === 'shooter' ? '#ff6b6b' : '#ffaa33';
      ctx.fillRect(this.x - camera.x, this.y, this.width, this.height);
      const maxHealth = this.type === 'melee' ? 30 : 50;
      ctx.fillStyle = 'red';
      ctx.fillRect(this.x - camera.x, this.y - 8, this.width, 4);
      ctx.fillStyle = 'lime';
      ctx.fillRect(this.x - camera.x, this.y - 8, (this.width * this.health) / maxHealth, 4);
    }
  }

  class WeaponPickup {
    constructor(x, y, type) {
      this.x = x;
      this.y = y;
      this.width = 20;
      this.height = 20;
      this.type = type;
      this.active = true;
    }

    draw() {
      if (!this.active) return;
      ctx.fillStyle = this.type === 'shotgun' ? '#ffcc00' : '#00ccff';
      ctx.fillRect(this.x - camera.x, this.y, this.width, this.height);
      ctx.fillStyle = 'black';
      ctx.font = '10px Arial';
      ctx.fillText(this.type[0].toUpperCase(), this.x - camera.x + 7, this.y + 12);
    }

    collidesWith(player) {
      return (
        player.x + player.width > this.x &&
        player.x < this.x + this.width &&
        player.y + player.height > this.y &&
        player.y < this.y + this.height
      );
    }
  }

  class Boss {
    constructor() {
      this.x = MAP_WIDTH - 300;
      this.y = canvas.height - 150;
      this.width = 100;
      this.height = 100;
      this.health = 250; // stronger!
      this.maxHealth = 250;
      this.lastShot = 0;
      this.active = false;
    }

    update(player) {
      if (player.x > MAP_WIDTH - 600) this.active = true;
      if (!this.active) return;

      if (player.x > this.x) this.x += 0.8;
      else if (player.x < this.x) this.x -= 0.8;

      if (Date.now() - this.lastShot > 600) {
        this.lastShot = Date.now();
        for (let i = 0; i < 4; i++) {
          const angle = Math.atan2(player.y - this.y, player.x - this.x) + (i - 1.5) * 0.3;
          bullets.push({
            x: this.x + this.width / 2,
            y: this.y + this.height / 2,
            width: 12,
            height: 6,
            speedX: Math.cos(angle) * BULLET_SPEED * 1.2,
            speedY: Math.sin(angle) * BULLET_SPEED * 1.2,
            damage: 15,
            fromPlayer: false
          });
        }
      }

      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        if (b.fromPlayer &&
            b.x + b.width > this.x &&
            b.x < this.x + this.width &&
            b.y + b.height > this.y &&
            b.y < this.y + this.height) {
          this.health -= b.damage;
          bullets.splice(i, 1);
          if (this.health <= 0) {
            gameRunning = false;
            setTimeout(() => {
              showScreen(winScreen);
            }, 500);
          }
        }
      }
    }

    draw() {
      if (!this.active) return;
      ctx.fillStyle = '#b00000';
      ctx.fillRect(this.x - camera.x, this.y, this.width, this.height);
      ctx.fillStyle = 'yellow';
      ctx.font = '14px Arial';
      ctx.fillText('FINAL BOSS', this.x - camera.x + 5, this.y - 10);
      bossHealthBar.classList.remove('hidden');
      bossFill.style.width = `${(this.health / this.maxHealth) * 100}%`;
    }
  }

  function initGame() {
    player = new Player();
    camera = { x: 0 };
    platforms = [];
    enemies = [];
    bullets = [];
    weaponPickups = [];
    boss = new Boss();
    playerHealth = 100;
    currentWeapon = 'pistol';
    gameRunning = true;
    updateHealthBar();
    bossHealthBar.classList.add('hidden');

    // Ground
    platforms.push(new Platform(0, canvas.height - 50, MAP_WIDTH, 50));

    // Add 30+ platforms with variety
    const platData = [
      {x:300, y:400, w:150, h:20, s:0},
      {x:600, y:350, w:120, h:20, s:1},
      {x:900, y:420, w:150, h:20, s:-1},
      {x:1200, y:300, w:100, h:20, s:0}, // Fixed y=300 to y:300
      {x:1500, y:380, w:180, h:20, s:1},
      {x:1800, y:280, w:120, h:20, s:-1}, // Fixed y=280 to y:280
      {x:2100, y:350, w:140, h:20, s:0},
      {x:2400, y:400, w:150, h:20, s:1},
      {x:2700, y:300, w:180, h:20, s:-1}, // Fixed y=300 to y:300
      {x:3000, y:350, w:100, h:20, s:0},
      {x:3300, y:300, w:150, h:20, s:1}, // Fixed y=300 to y:300
      {x:3600, y:380, w:180, h:20, s:-1},
      {x:3900, y:350, w:120, h:20, s:0},
      {x:4200, y:300, w:150, h:20, s:1}, // Fixed y=300 to y:300
      {x:4500, y:400, w:180, h:20, s:-1},
      {x:4800, y:350, w:140, h:20, s:0}, // Fixed y=350 to y:350
      {x:5100, y:300, w:120, h:20, s:1}, // Fixed y=300 to y:300
      {x:5400, y:380, w:150, h:20, s:-1},
      {x:5700, y:320, w:100, h:20, s:0}, // Fixed y=320 to y:320
      {x:6000, y:350, w:180, h:20, s:1}, // Fixed y=350 to y:350
      {x:6300, y:300, w:150, h:20, s:-1}, // Fixed y=300 to y:300
      {x:6600, y:380, w:120, h:20, s:0} // Fixed y=380 to y:380
    ];
    platData.forEach(p => platforms.push(new Platform(p.x, p.y, p.w, p.h, p.s)));

    // 🔥 35+ enemies
    for (let x = 400; x < MAP_WIDTH - 500; x += 150) {
      const rand = Math.random();
      let type = 'melee';
      if (rand > 0.7) type = 'shooter';
      enemies.push(new Enemy(x, canvas.height - 100, type));
    }

    // Weapon pickups
    weaponPickups.push(new WeaponPickup(800, canvas.height - 70, 'shotgun'));
    weaponPickups.push(new WeaponPickup(2500, canvas.height - 70, 'rifle'));
    weaponPickups.push(new WeaponPickup(4500, canvas.height - 70, 'rifle'));
  }

  function drawBackground() {
    ctx.fillStyle = '#0a1a35';
    ctx.fillRect(-camera.x, 0, MAP_WIDTH, canvas.height);

    ctx.fillStyle = '#2a3f5f';
    for (let i = 0; i < MAP_WIDTH; i += 600) {
      ctx.beginPath();
      ctx.moveTo(i - camera.x * 0.2, canvas.height - 100);
      ctx.lineTo(i + 300 - camera.x * 0.2, canvas.height - 300);
      ctx.lineTo(i + 600 - camera.x * 0.2, canvas.height - 100);
      ctx.closePath();
      ctx.fill();
    }

    ctx.fillStyle = '#8a6d3b';
    ctx.fillRect(MAP_WIDTH - 40 - camera.x, canvas.height - 150, 30, 100);
    ctx.fillStyle = '#5a4a2a';
    ctx.fillRect(MAP_WIDTH - 35 - camera.x, canvas.height - 100, 20, 20);
  }

  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (k in keys) keys[k] = true;
  });

  window.addEventListener('keyup', (e) => {
    const k = e.key.toLowerCase();
    if (k in keys) keys[k] = false;
  });

  canvas.addEventListener('mousedown', () => isShooting = true);
  canvas.addEventListener('mouseup', () => isShooting = false);
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  });

  function gameLoop() {
    if (!gameRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    camera.x = Math.max(0, Math.min(player.x - canvas.width / 2, MAP_WIDTH - canvas.width));

    drawBackground();

    // Update player grounded status
    player.grounded = false;
    let highestGround = null;
    for (const p of platforms) {
      const groundY = p.getGroundY(player);
      if (groundY !== null) {
        if (highestGround === null || groundY < highestGround) {
          highestGround = groundY;
        }
      }
    }
    if (highestGround !== null) {
      player.y = highestGround - player.height;
      player.grounded = true;
      player.velY = 0;
    }

    platforms.forEach(p => p.draw());

    weaponPickups.forEach(w => {
      w.draw();
      if (w.active && w.collidesWith(player)) {
        currentWeapon = w.type;
        w.active = false;
      }
    });

    enemies.forEach(e => {
      e.update(player);
      e.draw();
    });

    boss.update(player);
    boss.draw();

    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.speedX;
      b.y += b.speedY;

      if (b.x < -100 || b.x > MAP_WIDTH + 100 || b.y < -100 || b.y > canvas.height + 100) {
        bullets.splice(i, 1);
        continue;
      }

      if (!b.fromPlayer &&
          b.x + b.width > player.x &&
          b.x < player.x + player.width &&
          b.y + b.height > player.y &&
          b.y < player.y + player.height) {
        playerHealth -= b.damage;
        
        if (playerHealth <= 0) {
          playerHealth = 0;
          updateHealthBar(); // Force update before death
          setTimeout(() => {
            gameRunning = false;
            alert('YOU DIED. The Professor\'s memory fades...');
            showScreen(landingScreen);
          }, 200);
        } else {
          updateHealthBar();
        }
        
        bullets.splice(i, 1);
        continue;
      }

      ctx.fillStyle = b.fromPlayer ? '#ffff00' : '#ff5555';
      ctx.fillRect(b.x - camera.x, b.y, b.width, b.height);
    }

    player.update();
    player.draw();

    requestAnimationFrame(gameLoop);
  }

  function startGame() {
    initGame();
    gameLoop();
  }
});
// ===== CHARACTER CUSTOMIZATION (NON-INTRUSIVE ADD-ON) =====

const customizeScreen = document.getElementById('customize');
const btnSaveCustom = document.getElementById('btn-save-custom');
const previewCanvas = document.getElementById('previewCanvas');
const previewCtx = previewCanvas.getContext('2d');

// Load saved custom or use defaults
let customization = JSON.parse(localStorage.getItem('gunkillCustom')) || {
  skin: '#4e9af1',
  eyes: '#ffffff',
  outfit: 'tactical'
};

// Update inputs & preview
function renderPreview() {
  document.getElementById('skinColor').value = customization.skin;
  document.getElementById('eyeColor').value = customization.eyes;
  document.getElementById('outfit').value = customization.outfit;

  // Draw preview character
  previewCtx.clearRect(0, 0, 120, 180);
  const x = 60, y = 120;
  const w = 25, h = 40;

  // Body (outfit color)
  const outfitColors = {
    tactical: '#222222',
    scientist: '#e0e0e0',
    rebel: '#8b0000'
  };
  previewCtx.fillStyle = outfitColors[customization.outfit] || '#222';
  previewCtx.fillRect(x - w/2, y - h, w, h * 1.3);

  // Skin (head)
  previewCtx.fillStyle = customization.skin;
  previewCtx.beginPath();
  previewCtx.arc(x, y - h - 10, 12, 0, Math.PI * 2);
  previewCtx.fill();

  // Eyes
  previewCtx.fillStyle = customization.eyes;
  previewCtx.fillRect(x - 5, y - h - 15, 3, 3);
  previewCtx.fillRect(x + 2, y - h - 15, 3, 3);
}

// Events
document.getElementById('skinColor').addEventListener('input', (e) => {
  customization.skin = e.target.value;
  renderPreview();
});

document.getElementById('eyeColor').addEventListener('input', (e) => {
  customization.eyes = e.target.value;
  renderPreview();
});

document.getElementById('outfit').addEventListener('change', (e) => {
  customization.outfit = e.target.value;
  renderPreview();
});

btnSaveCustom.addEventListener('click', () => {
  localStorage.setItem('gunkillCustom', JSON.stringify(customization));
  showScreen(gameScreen);
  startGame();
});

// Navigate: Story → Customize
btnStartGame.addEventListener('click', (e) => {
  e.preventDefault(); // stop original
  showScreen(customizeScreen);
  renderPreview();
});

// ===== ENHANCED GUN RENDERING (NON-INTRUSIVE) =====

// Override Player.draw() only if customization exists
const originalPlayerDraw = Player.prototype.draw;

Player.prototype.draw = function() {
  // Use saved customization
  const custom = JSON.parse(localStorage.getItem('gunkillCustom')) || customization;

  // Body & head
  const outfitColors = {
    tactical: '#1a1a1a',
    scientist: '#d0d0d0',
    rebel: '#660000'
  };
  ctx.fillStyle = outfitColors[custom.outfit] || '#222';
  ctx.fillRect(this.x - camera.x, this.y, this.width, this.height * 0.7); // torso

  ctx.fillStyle = custom.skin;
  ctx.beginPath();
  ctx.arc(this.x - camera.x + this.width/2, this.y + 10, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = custom.eyes;
  ctx.fillRect(this.x - camera.x + this.width/2 - 5, this.y + 5, 3, 3);
  ctx.fillRect(this.x - camera.x + this.width/2 + 2, this.y + 5, 3, 3);

  // 🔫 REALISTIC GUN (based on weapon type)
  const worldMouseX = mouseX + camera.x;
  const worldMouseY = mouseY;
  const angle = Math.atan2(worldMouseY - (this.y + this.height / 2), worldMouseX - (this.x + this.width / 2));

  ctx.save();
  ctx.translate(this.x - camera.x + this.width / 2, this.y + this.height / 2);
  ctx.rotate(angle);

  // Gun design by type
  if (currentWeapon === 'pistol') {
    // Simple pistol
    ctx.fillStyle = '#333';
    ctx.fillRect(0, -3, 25, 6); // barrel
    ctx.fillRect(20, -8, 8, 16); // grip
  } else if (currentWeapon === 'shotgun') {
    // Double-barrel shotgun
    ctx.fillStyle = '#222';
    ctx.fillRect(0, -4, 35, 8); // dual barrels
    ctx.fillRect(30, -10, 10, 20); // stock
    ctx.fillStyle = '#555';
    ctx.fillRect(10, -3, 3, 2);
    ctx.fillRect(10, 1, 3, 2);
  } else if (currentWeapon === 'rifle') {
    // Tactical rifle
    ctx.fillStyle = '#111';
    ctx.fillRect(0, -2, 50, 4); // rail
    ctx.fillRect(45, -6, 12, 12); // stock
    ctx.fillStyle = '#444';
    ctx.fillRect(15, 0, 5, -10); // scope
    ctx.fillRect(25, -1, 20, 2); // magazine
  }

  ctx.restore();

  // Weapon label
  ctx.fillStyle = 'white';
  ctx.font = '12px Arial';
  ctx.fillText(currentWeapon.toUpperCase(), this.x - camera.x, this.y - 10);
};
// ===== LEVEL MANAGEMENT (NON-INTRUSIVE) =====

const levelSelectScreen = document.getElementById('levelSelect');

// After customization, go to level select
btnSaveCustom.addEventListener('click', (e) => {
  e.preventDefault();
  localStorage.setItem('gunkillCustom', JSON.stringify(customization));
  showLevelSelect();
});

// When level completed
function completeLevel(levelId) {
  progress.completed = progress.completed || {};
  progress.completed[levelId] = true;
  if (levelId < 10) {
    progress.unlocked[levelId + 1] = true;
  }
  localStorage.setItem('gunkillProgress', JSON.stringify(progress));
  showLevelSelect();
}

// Hook win condition to level completion
const originalWin = () => {
  gameRunning = false;
  const currentLvl = LEVELS.find(l => l.map.width === MAP_WIDTH);
  if (currentLvl) completeLevel(currentLvl.id);
  setTimeout(() => {
    showScreen(winScreen);
  }, 500);
};

// Replace boss win with level-aware win
// (We'll patch it via boss.js override below)