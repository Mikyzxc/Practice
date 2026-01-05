// levels.js — Level definitions & progression (non-intrusive)

class Level {
  constructor(id, name, theme, description, map) {
    this.id = id;
    this.name = name;
    this.theme = theme; // 'lab', 'sewer', 'roof', 'boss'
    this.description = description;
    this.map = map; // { width, platforms: [], enemies: [], pickups: [], boss: bool }
    this.unlocked = false;
    this.completed = false;
  }
}

// 🌐 All 10 Levels — Unique layouts & challenges
const LEVELS = [
  new Level(1, 'Lab Escape', 'lab', 'Escape the ruined lab. Avoid patrols.', {
    width: 2000,
    platforms: [
      {x:0,y:550,w:2000,h:50,s:0},
      {x:300,y:450,w:120,h:20,s:0},
      {x:600,y:400,w:100,h:20,s:1},
      {x:900,y:420,w:120,h:20,s:-1},
      {x:1200,y:300,w:100,h:20,s:0},
      {x:1500,y:380,w:150,h:20,s:-1}
    ],
    enemies: [
      {x:400, type:'melee'}, {x:800, type:'shooter'}, {x:1100, type:'melee'}
    ],
    pickups: [{x:700, type:'shotgun'}],
    boss: false
  }),

  new Level(2, 'Sewer Crawl', 'sewer', 'Navigate toxic tunnels. Jump carefully.', {
    width: 2500,
    platforms: [
      {x:0,y:550,w:2500,h:50,s:0},
      {x:200,y:500,w:100,h:20,s:0},
      {x:500,y:450,w:80,h:20,s:1},
      {x:800,y:480,w:120,h:20,s:-1},
      {x:1100,y:400,w:100,h:20,s:0},
      {x:1400,y:430,w:150,h:20,s:1},
      {x:1800,y:380,w:120,h:20,s:-1}
    ],
    enemies: [
      {x:300, type:'melee'}, {x:600, type:'shooter'}, {x:900, type:'melee'}, {x:1200, type:'shooter'}
    ],
    pickups: [{x:1000, type:'rifle'}],
    boss: false
  }),

  new Level(3, 'Rooftop Chase', 'roof', 'Dash across skyscrapers. Wind affects bullets.', {
    width: 3000,
    platforms: [
      {x:0,y:550,w:3000,h:50,s:0},
      {x:400,y:400,w:120,h:20,s:0},
      {x:800,y:350,w:100,h:20,s:1},
      {x:1200,y:420,w:120,h:20,s:-1},
      {x:1600,y:300,w:100,h:20,s:0},
      {x:2000,y:380,w:150,h:20,s:1},
      {x:2400,y:320,w:120,h:20,s:-1}
    ],
    enemies: [
      {x:500, type:'shooter'}, {x:900, type:'melee'}, {x:1300, type:'shooter'}, {x:1700, type:'melee'}
    ],
    pickups: [{x:1500, type:'rifle'}],
    boss: false
  }),

  new Level(4, 'Server Farm', 'lab', 'Hack the core. Enemies respawn near terminals.', {
    width: 2800,
    platforms: [
      {x:0,y:550,w:2800,h:50,s:0},
      {x:300,y:450,w:150,h:20,s:0},
      {x:700,y:400,w:120,h:20,s:1},
      {x:1100,y:420,w:150,h:20,s:-1},
      {x:1500,y:350,w:100,h:20,s:0},
      {x:1900,y:380,w:180,h:20,s:1},
      {x:2300,y:300,w:120,h:20,s:-1}
    ],
    enemies: [
      {x:400, type:'shooter'}, {x:800, type:'melee'}, {x:1200, type:'shooter'}, {x:1600, type:'melee'}, {x:2000, type:'shooter'}
    ],
    pickups: [{x:1000, type:'shotgun'}],
    boss: false
  }),

  new Level(5, 'Final Lab Corridor', 'lab', 'The last hallway before the boss.', {
    width: 2200,
    platforms: [
      {x:0,y:550,w:2200,h:50,s:0},
      {x:400,y:450,w:120,h:20,s:0},
      {x:800,y:400,w:100,h:20,s:1},
      {x:1200,y:420,w:120,h:20,s:-1},
      {x:1600,y:350,w:150,h:20,s:0}
    ],
    enemies: [
      {x:500, type:'melee'}, {x:900, type:'shooter'}, {x:1300, type:'melee'}, {x:1700, type:'shooter'}
    ],
    pickups: [],
    boss: false
  }),

  new Level(6, 'BOSS: Security AI', 'lab', 'Defeat the lab’s AI guardian.', {
    width: 2000,
    platforms: [
      {x:0,y:550,w:2000,h:50,s:0},
      {x:500,y:450,w:200,h:20,s:0},
      {x:1300,y:450,w:200,h:20,s:0}
    ],
    enemies: [],
    pickups: [],
    boss: true
  }),

  new Level(7, 'Underground Bunker', 'sewer', 'Descend deeper. Low visibility.', {
    width: 3200,
    platforms: [
      {x:0,y:550,w:3200,h:50,s:0},
      {x:300,y:500,w:100,h:20,s:0},
      {x:700,y:450,w:80,h:20,s:1},
      {x:1100,y:480,w:120,h:20,s:-1},
      {x:1500,y:400,w:100,h:20,s:0},
      {x:1900,y:430,w:150,h:20,s:1},
      {x:2300,y:380,w:120,h:20,s:-1},
      {x:2700,y:350,w:100,h:20,s:0}
    ],
    enemies: [
      {x:400, type:'melee'}, {x:800, type:'shooter'}, {x:1200, type:'melee'}, {x:1600, type:'shooter'}, {x:2000, type:'melee'}, {x:2400, type:'shooter'}
    ],
    pickups: [{x:1800, type:'rifle'}],
    boss: false
  }),

  new Level(8, 'Helipad Siege', 'roof', 'Hold the roof until extraction.', {
    width: 2500,
    platforms: [
      {x:0,y:550,w:2500,h:50,s:0},
      {x:500,y:400,w:120,h:20,s:0},
      {x:1000,y:350,w:100,h:20,s:1},
      {x:1500,y:420,w:120,h:20,s:-1},
      {x:2000,y:300,w:150,h:20,s:0}
    ],
    enemies: [
      {x:600, type:'shooter'}, {x:1100, type:'melee'}, {x:1600, type:'shooter'}, {x:2100, type:'melee'}
    ],
    pickups: [],
    boss: false
  }),

  new Level(9, 'Command Center', 'lab', 'Destroy the mainframe.', {
    width: 2800,
    platforms: [
      {x:0,y:550,w:2800,h:50,s:0},
      {x:400,y:450,w:150,h:20,s:0},
      {x:900,y:400,w:120,h:20,s:1},
      {x:1400,y:420,w:150,h:20,s:-1},
      {x:1900,y:350,w:100,h:20,s:0},
      {x:2400,y:380,w:180,h:20,s:1}
    ],
    enemies: [
      {x:500, type:'shooter'}, {x:1000, type:'melee'}, {x:1500, type:'shooter'}, {x:2000, type:'melee'}, {x:2500, type:'shooter'}
    ],
    pickups: [{x:1200, type:'rifle'}],
    boss: false
  }),

  new Level(10, 'FINAL BOSS: Director', 'lab', 'Face the one who killed Professor Arlen.', {
    width: 2200,
    platforms: [
      {x:0,y:550,w:2200,h:50,s:0},
      {x:600,y:450,w:200,h:20,s:0},
      {x:1400,y:450,w:200,h:20,s:0}
    ],
    enemies: [],
    pickups: [],
    boss: true
  })
];

// Load progress
let progress = JSON.parse(localStorage.getItem('gunkillProgress')) || {
  currentLevel: 1,
  unlocked: Array(11).fill(false) // index 0 unused
};
progress.unlocked[1] = true; // Level 1 always unlocked
localStorage.setItem('gunkillProgress', JSON.stringify(progress));

// Level Selection UI
function showLevelSelect() {
  let html = `<h1>SELECT LEVEL</h1><div class="level-grid">`;
  LEVELS.forEach(level => {
    const status = progress.unlocked[level.id]
      ? (progress.completed[level.id] ? '✅' : '🔓')
      : '🔒';
    const disabled = !progress.unlocked[level.id] ? 'disabled' : '';
    html += `
      <button class="level-btn" data-level="${level.id}" ${disabled}>
        L${level.id}: ${level.name} ${status}<br>
        <small>${level.description}</small>
      </button>`;
  });
  html += `</div><button id="btn-back-to-custom">← Back</button>`;
  
  document.getElementById('levelSelect').innerHTML = html;
  document.querySelectorAll('.level-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const levelId = parseInt(e.target.dataset.level);
      startLevel(levelId);
    });
  });
  document.getElementById('btn-back-to-custom').addEventListener('click', () => {
    showScreen(customizeScreen);
  });
  showScreen(levelSelectScreen);
}

// Start a level
function startLevel(levelId) {
  const level = LEVELS.find(l => l.id === levelId);
  if (!level || !progress.unlocked[levelId]) return;

  // Override map data
  MAP_WIDTH = level.map.width;
  platforms = [new Platform(0, canvas.height - 50, MAP_WIDTH, 50)];
  level.map.platforms.forEach(p => platforms.push(new Platform(p.x, p.y, p.w, p.h, p.s)));

  enemies = [];
  level.map.enemies.forEach(e => enemies.push(new Enemy(e.x, canvas.height - 100, e.type)));

  weaponPickups = [];
  level.map.pickups.forEach(p => weaponPickups.push(new WeaponPickup(p.x, canvas.height - 70, p.type)));

  // Boss?
  if (level.map.boss) {
    boss = new Boss();
    boss.x = MAP_WIDTH - 300;
    bossHealthBar.classList.add('hidden');
    bossActive = false;
  } else {
    boss = null;
  }

  // Reset player
  player = new Player();
  player.x = 100;
  playerHealth = 100;
  updateHealthBar();
  currentWeapon = 'pistol';

  gameRunning = true;
  showScreen(gameScreen);
  gameLoop();
}