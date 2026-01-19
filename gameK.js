// game.js

// --- 初期設定 ---
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let gameOver = false;


//----プレイ回数制限-----
let playCount = 0; // アームを下した回数
const maxPlay = 5; // 制限回数

// ---- 先に変数だけ宣言しておく（中身は後で入る） ----
let WIDTH = 0;
let HEIGHT = 0;

// --- リザルト遷移用フラグ ---
let resultTimerStarted = false;

// --- フルスクリーン設定 ---
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  WIDTH = canvas.width;
  HEIGHT = canvas.height;

  // WIDTH/HEIGHT に依存するものをここで初期化または更新
  craneX = Math.max(100, WIDTH - 50);
  clawY = craneY;
  dropZoneX = WIDTH - 80;
  dropZoneY = HEIGHT - 120;

  if (badges.length === 0) generateBadges();
}
window.addEventListener("resize", resizeCanvas);

const TOP_BAR_HEIGHT = 100;


// --- 画像読み込み ---
const backgroundImg = new Image();
backgroundImg.src = "haikei/d1ffd8b6be42b8df176d781b6a8446c0_t.jpg";

const craneOpenImg = new Image();
craneOpenImg.src = "crane/crane_open.png";

const craneCloseImg = new Image();
craneCloseImg.src = "crane/crane_close.png";

// --- バッジ画像パス配列（Imageオブジェクトは generateBadges 内で設定） ---
const badgeSrcList = [
  "bajji/car/1433.png",
  "bajji/car/0210000009.png",
  "bajji/car/0210000014.png",
  "bajji/car/0210000018.png",
  "bajji/car/5954681070_2a37116c65.png",
  "bajji/car/biker_24481_color.png",
  "bajji/car/collage_airplane-300x300.png",
  "bajji/car/deliveryservice_21499_color.png",
  "bajji/car/ea8168610f4eaca1131ff755435fe38d.png",
  "bajji/car/images.png",
  "bajji/car/pngtree-cartoon-car-joy-ride-png-image_12349396.png",
  "bajji/car/pngtree-sports-car-car-car-transportation-png-image_3897744.jpg",
  "bajji/car/publicdomainq-0074496aor.png",
  "bajji/car/publicdomainq-0075600zte.png",
  "bajji/car/sea_ship_12013.png",
  "bajji/car/simple_fireengine-300x300.png",
  "bajji/car/simple_ship-300x300.png",
  "bajji/car/Simple-design_2504-10-14.webp",
  "bajji/car/toy_norimono_car_boy.png"
];

// --- 効果音 ---
const dropSound = new Audio("bgm/Onoma-Flash14-1(High).mp3");
dropSound.volume = 1;

const moveSound = new Audio("bgm/クレーンの移動.mp3");
moveSound.loop = true;
moveSound.volume = 1;

// --- クレーン設定 ---
let craneX = 0;
const craneY = 100;
let clawY = craneY;
const craneSpeed = 5;
const clawDownSpeed = 7;
const clawUpSpeed = 5;
let clawOpen = true;
let clawAnimProgress = 0;

// 状態フラグ
let clawMovingDown = false;
let clawMovingUp = false;
let movingToDropZone = false;
let droppingBadge = false;
let returningToStart = false;

// ドロップゾーン
let dropZoneX = 0;
let dropZoneY = 0;
// --- ドロップゾーンサイズ ---
const DROP_TUBE_W = 150;
const DROP_TUBE_H = 160;
const DROP_WALL_MARGIN = 6;

// --- バッジ設定 ---
let badges = [];
let heldBadge = null;
let lastDroppedBadge = null;
let showBadgeTimer = 0;
let showingBadge = false;
let shownBadge = null;

// 滑り落ち設定
const SLIP_CHANCE_COMMON = 0.0001;
const SLIP_FALL_SPEED = 5;

let lastTime = 0;

// --- ドロップゾーン矢印制御 ---
let arrowIndex = 0;
let arrowTimer = 0;

// --- ヘルパー ---
function rand(min, max) { return Math.floor(Math.random() * (max - min) + min); }

function getGroundY(x) {
  const base = HEIGHT - 130;

  const dropLeft  = dropZoneX - DROP_TUBE_W / 2;
  const dropRight = dropZoneX + DROP_TUBE_W / 2;

  // ★ ドロップゾーン範囲は地面を無効化
  if (x > dropLeft && x < dropRight) {
    return HEIGHT + 1000; // 実質「地面なし」
  }

  // 左エリア
  if (x < WIDTH * 0.35) {
    return base - 60 + Math.sin(x * 0.01) * 10;
  }

  // 中央エリア（谷）
  if (x < WIDTH * 0.65) {
    const t = (x - WIDTH * 0.35) / (WIDTH * 0.3);
    return base + 30 * Math.sin(t * Math.PI);
  }

  // 右エリア（ゆるやかに下がる）
  const t = (x - WIDTH * 0.65) / (WIDTH * 0.35);
  const slopeDown = t * 100;

  return base - 10 + Math.sin(x * 0.015) * 10 + slopeDown;
}

function resolveBadgeOverlap() {
  const MIN_DIST_RATE = 0.9;   // 見た目ほぼ維持
  const BASE_PUSH = 0.6;       // 通常時
  const MAX_PUSH = 4;          // 限界（拡散防止）

  for (let i = 0; i < badges.length; i++) {
    for (let j = i + 1; j < badges.length; j++) {
      const a = badges[i];
      const b = badges[j];
      
      // ★ 掴まれているものは無視
      if (a === heldBadge || b === heldBadge) continue;

      if (!a.onGround || !b.onGround) continue;

      const ax = a.x + a.size / 2;
      const bx = b.x + b.size / 2;

      const dx = bx - ax;
      const dist = Math.abs(dx);
      const minDist = (a.size + b.size) / 2 * MIN_DIST_RATE;

      if (dist < minDist && dist > 0.01) {
        const overlap = minDist - dist;

        // ★ 重なりが大きいほど強くする
        let push = BASE_PUSH + overlap * 0.5;
        push = Math.min(push, MAX_PUSH);

        const dir = dx > 0 ? 1 : -1;

        a.x -= push * dir;
        b.x += push * dir;

        a.vx *= 0.3;
        b.vx *= 0.3;

        a.y = getGroundY(a.x + a.size / 2) - a.size;
        b.y = getGroundY(b.x + b.size / 2) - b.size;

        clampBadgeToDropWall(a);
        clampBadgeToDropWall(b);
      }
    }
  }
}

function clampBadgeToDropWall(badge) {
  const dropLeftWallX =
    dropZoneX - DROP_TUBE_W / 2 + DROP_WALL_MARGIN;

  // 左→右へ貫通防止
  if (badge.x + badge.size > dropLeftWallX) {
    badge.x = dropLeftWallX - badge.size;
    badge.vx = 0;
    badge.y = getGroundY(badge.x + badge.size / 2) - badge.size;
  }
}

function landOnGround(badge) {
  const centerX = badge.x + badge.size / 2;
  const groundY = getGroundY(centerX);
  return badge.y + badge.size >= groundY;
}

function drawGroundFill() {
  ctx.save();

  // --- 地面の形で clip ---
  ctx.beginPath();
  ctx.moveTo(0, HEIGHT);
  for (let x = 0; x <= WIDTH; x += 10) {
    ctx.lineTo(x, getGroundY(x));
  }
  ctx.lineTo(WIDTH, HEIGHT);
  ctx.closePath();
  ctx.clip();

  // --- 地面を単色ベタ塗り ---
  ctx.fillStyle = "#87826b"; // 金色っぽい地面
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // --- ドロップゾーン部分だけ削る ---
  ctx.globalCompositeOperation = "destination-out";

  const gy = getGroundY(dropZoneX);
  ctx.fillRect(
    dropZoneX - DROP_TUBE_W / 2,
    gy,
    DROP_TUBE_W,
    HEIGHT - gy
  );

  ctx.restore();
}


function drawGround() {
  ctx.beginPath();
  ctx.moveTo(0, getGroundY(0));

  for (let x = 0; x <= WIDTH; x += 10) {
    ctx.lineTo(x, getGroundY(x));
  }

  ctx.strokeStyle = "rgba(0,255,255,0.6)";
  ctx.lineWidth = 3;
  ctx.stroke();
}


// ================================
// バッジ重なり判定（必ず generateBadges より上）
// ================================
function isBadgeOverlap(a, b) {
  const dx = (a.x + a.size / 2) - (b.x + b.size / 2);
  const dy = (a.y + a.size / 2) - (b.y + b.size / 2);
  const distance = Math.sqrt(dx * dx + dy * dy);

  return distance < (a.size + b.size) / 2;
}


function generateBadges() {
  badges = [];
  const FLOAT_MIN = 40;  // 最低浮かせる距離
  const FLOAT_MAX = 200;  // 最大浮かせる距離

  const imgs = badgeSrcList.map(src => {
    const img = new Image();
    img.src = src;
    return img;
  });

  const MAX_BADGES = 15;
  const MAX_TRY = 100;

  for (let i = 0; i < MAX_BADGES; i++) {
    let placed = false;
    let tryCount = 0;

while (!placed && tryCount < MAX_TRY) {
  const size = rand(80, 90);
  const x = rand(50, Math.max(150, WIDTH - 200));

  const groundY = getGroundY(x + size / 2);
  const y = groundY - size - rand(FLOAT_MIN, FLOAT_MAX);

  const img = imgs[rand(0, imgs.length)];

  const newBadge = {
    x,
    y,
    size,
    img,
    isFalling: false,
    vy: 0,
    vx: 0,
    onGround: false
  };

  const overlap = badges.some(b => isBadgeOverlap(b, newBadge));

  if (!overlap) {
    badges.push(newBadge);
    placed = true;
  }

  tryCount++;
}
  }

  console.log("badges generated:", badges.length);
}

function landOnBadge(falling, base) {
  // X方向が重なっているか
  const overlapX =
    falling.x < base.x + base.size &&
    falling.x + falling.size > base.x;

  // 落下中バッジの下端
  const fallingBottom = falling.y + falling.size;
  // 下にあるバッジの上端
  const baseTop = base.y;

  // 「上から当たった」判定
  return (
    overlapX &&
    fallingBottom >= baseTop &&
    fallingBottom <= baseTop + falling.vy + 2
  );
}

function isBadgeHitTop(upper, lower) {
  // Xが重なっている
  const overlapX =
    upper.x < lower.x + lower.size &&
    upper.x + upper.size > lower.x;

  // 上のバッジの下端
  const upperBottom = upper.y + upper.size;
  // 下のバッジの上端
  const lowerTop = lower.y;

  // 少しめり込んだら「ぶつかった」とみなす
  return overlapX && upperBottom >= lowerTop && upperBottom <= lowerTop + 8;
}

function updateBadges() {
  const activeBadges = badges.filter(b => b !== heldBadge);

  /* ===============================
     1. 落下・空中処理
  =============================== */
  for (const badge of activeBadges) {

    if (badge.isFalling) {
      badge.vy += 0.8;
      badge.y += badge.vy;

      // 空中横移動は弱く
      badge.vx *= 0.98;
      badge.x += badge.vx;
    }
  }

  /* ===============================
     2. バッジ同士の着地判定（上→下）
  =============================== */
  for (const falling of badges) {
    if (!falling.isFalling) continue;

    for (const base of badges) {
      if (falling === base) continue;
      if (!base.onGround) continue;

      if (landOnBadge(falling, base)) {
        falling.y = base.y - falling.size;
        falling.isFalling = false;
        falling.onGround = true;
        falling.vy = 0;

        // 少し横に逃がす
        falling.vx += (Math.random() - 0.5) * 2;
      }
    }
  }

  /* ===============================
     3. 地面着地
  =============================== */
  for (const badge of activeBadges) {
    if (!badge.isFalling) continue;

    const cx = badge.x + badge.size / 2;

    if (landOnGround(badge)) {
      badge.y = getGroundY(cx) - badge.size;
      badge.isFalling = false;
      badge.onGround = true;
      badge.vy = 0;
      badge.vx = 0;
    }
  }

  /* ===============================
     4. 地面上の転がり
  =============================== */
  for (const badge of activeBadges) {
    if (!badge.onGround) continue;

    const cx = badge.x + badge.size / 2;
    const currentGround = getGroundY(cx);

    const hL = getGroundY(cx - 10);
    const hR = getGroundY(cx + 10);

    let rollForce = 0;

    if (hR > hL) rollForce = Math.min((hR - hL) / 20, 1);
    else if (hL > hR) rollForce = -Math.min((hL - hR) / 20, 1);

    badge.vx += rollForce * 0.6;
    badge.vx *= 0.96;

    if (Math.abs(badge.vx) < 0.01) badge.vx = 0;

    const nextX = badge.x + badge.vx;
    const nextCX = nextX + badge.size / 2;
    const nextGround = getGroundY(nextCX);

    // 上り坂は登らせない
    if (nextGround < currentGround - 1) {
      badge.vx = 0;
    } else {
      badge.x = nextX;
    }

    badge.y = getGroundY(badge.x + badge.size / 2) - badge.size;
  }

  /* ===============================
     5. ドロップゾーン左壁（完全防御）
  =============================== */
  const dropLeftWallX =
    dropZoneX - DROP_TUBE_W / 2 + DROP_WALL_MARGIN;

  for (const badge of activeBadges) {
    if (badge.x + badge.size > dropLeftWallX) {
      badge.x = dropLeftWallX - badge.size;
      badge.vx = 0;
      badge.y = getGroundY(badge.x + badge.size / 2) - badge.size;
    }
  }

  /* ===============================
     6. バッジ同士の重なり解消（毎フレーム）
  =============================== */
  resolveBadgeOverlap();
}



// --- バッジ保存 ---
function saveCollectedBadge(badge) {
  try {
    let list = JSON.parse(localStorage.getItem("collectedBadges") || "[]");
    list.push({ src: badge.img.src, isRare: false });
    localStorage.setItem("collectedBadges", JSON.stringify(list));
    console.log("Saved badge to localStorage:", badge.img.src);
  } catch (e) {
    console.error("Failed to save badge:", e);
  }
}

// --- 入力 ---
let keys = {};
window.addEventListener("keydown", e => {
  if (e.code === "Space") e.preventDefault();
  keys[e.key] = true;
});
window.addEventListener("keyup", e => keys[e.key] = false);

// --- クレーン描画 ---
function drawCrane(x, y) {
  ctx.strokeStyle = "black";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, y - 20);
  ctx.stroke();

  const currentImg = clawOpen ? craneOpenImg : craneCloseImg;
  ctx.drawImage(currentImg, x - 75, y - 60, 150, 150);
}

// --- 衝突判定 ---
function isColliding(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw &&
         ax + aw > bx &&
         ay < by + bh &&
         ay + ah > by;
}

// --- リザルト表示 ---
function showResult() {
  window.location.href = "result.html";
}

function createCyberArrowPath() {
    const p = new Path2D();

    // 画像の矢印を元にしたアウトライン
    p.moveTo(-30, -10);
    p.lineTo(0, 20);
    p.lineTo(30, -10);
    p.lineTo(20, -10);
    p.lineTo(0, 10);
    p.lineTo(-20, -10);
    p.closePath();

    return p;
}

function drawCyberArrow(x, y, glow = 1) {
    const arrow = createCyberArrowPath();

    ctx.save();
    ctx.translate(x, y);

    // --- ネオン外枠 ---
    ctx.shadowColor = `rgba(0, 200, 255, 0.8)`;
    ctx.shadowBlur = 25;

    ctx.lineWidth = 8;
    ctx.strokeStyle = `rgba(0, 255, 255, 0.95)`;
    ctx.stroke(arrow);

    ctx.restore();
}

// --- ドロップゾーン描画（順番に光る矢印） ---
function drawDropZone() {
    const tubeW = DROP_TUBE_W;
    const tubeH = DROP_TUBE_H;

    ctx.save();

    ctx.fillStyle = "rgba(80, 140, 255, 0.12)";
    ctx.fillRect(dropZoneX - tubeW / 2, dropZoneY, tubeW, tubeH);

    ctx.strokeStyle = "rgba(0, 180, 255, 0.9)";
    ctx.lineWidth = 6;
    ctx.strokeRect(dropZoneX - tubeW / 2, dropZoneY, tubeW, tubeH);

    const num = 4;
    const spacing = tubeH / num;

    for (let i = 0; i < num; i++) {
        const y = dropZoneY + spacing * (i + 0.5);
        drawCyberArrow(dropZoneX, y);
    }

    ctx.restore();
}


function tryDropHeldBadge(dropRate) {
  if (!heldBadge) return false;

  if (Math.random() < dropRate) {
    dropSound.currentTime = 0;
    dropSound.play();

    // ▼ 真下に落下させる
    heldBadge.isFalling = true;
    heldBadge.onGround = false;

    heldBadge.vx = 0; // ← これが最重要
    heldBadge.vy = 0;

    heldBadge = null;
    return true;
  }
  return false;
}


// --- メイン更新 ---
function update(delta) {
  let isMoving = clawMovingDown || clawMovingUp || movingToDropZone || returningToStart ||
               keys["ArrowLeft"] || keys["ArrowRight"];

  if (isMoving) {
    if (moveSound.paused) moveSound.play();
  } else {
    if (!moveSound.paused) moveSound.pause();
  }

  if (!clawMovingDown && !clawMovingUp && !movingToDropZone && !droppingBadge && !returningToStart) {
    if (!showingBadge && showBadgeTimer <= 0) {
      if (keys["ArrowLeft"] && craneX > 30) craneX -= craneSpeed;
      if (keys["ArrowRight"] && craneX < WIDTH - 30) craneX += craneSpeed;
      if ((keys[" "] || keys["Spacebar"] || keys["Space"]) && playCount < maxPlay) {
        playCount++;
        clawOpen = true;
        clawMovingDown = true;
      }
    }
  }

  clawAnimProgress += clawOpen ? -0.1 : 0.1;
  clawAnimProgress = Math.max(0, Math.min(1, clawAnimProgress));

  // --- 降下 ---
  if (clawMovingDown) {
    clawY += clawDownSpeed;

    if (!heldBadge) {
      for (let badge of badges) {
        if (!badge.isFalling && 
           isColliding(
    craneX - 15,  // ax
    clawY,        // ay
    30,           // aw
    30,           // ah ← ★追加
    badge.x,      // bx
    badge.y,      // by
    badge.size,   // bw
    badge.size    // bh ← ★追加
  )) {
          clawOpen = false;
          heldBadge = badge;
          clawMovingDown = false;
          clawMovingUp = true;
          break;
        }
      }
    }

    if (clawY >= HEIGHT - 100 && !clawMovingUp) {
      clawOpen = false;
      clawMovingDown = false;
      clawMovingUp = true;
    }
  }


// --- 上昇 ---
if (clawMovingUp) {
  clawY -= clawUpSpeed;

  if (heldBadge) {
    heldBadge.x = craneX - heldBadge.size / 2;
    heldBadge.y = clawY + 20;

    // 持ち上げ中の落下
    tryDropHeldBadge(0.002);
  }

  if (clawY <= craneY) {
    clawY = craneY;
    clawMovingUp = false;

    // ★ 状態を必ず次へ進める
    if (heldBadge) {
      movingToDropZone = true;
    } else {
      returningToStart = true;
    }
  }
}

  // --- 戻り ---
  if (returningToStart) {
    if (craneX < WIDTH - 50) {
      craneX += craneSpeed;
    } else {
      returningToStart = false;
      clawOpen = true;

      if (playCount >= maxPlay && clawY === craneY) {
        if (!resultTimerStarted) {
          resultTimerStarted = true;
          setTimeout(showResult, 1000);
        }
      }
    }
  }

// ドロップゾーンへ移動
if (movingToDropZone) {
  if (craneX < dropZoneX) {
    craneX += craneSpeed;

    if (heldBadge) {
      heldBadge.x = craneX - heldBadge.size / 2;
      heldBadge.y = clawY + 20;

      // ★ 移動中は「半分の確率」
      tryDropHeldBadge(0.005); // ← 上昇時の半分
    }
  } else {
    movingToDropZone = false;
    droppingBadge = true;
    clawOpen = true;
  }
}


  // --- ドロップ処理 ---
  if (droppingBadge) {
    if (heldBadge) {
      heldBadge.y += 10;
    }

    if (!heldBadge || (heldBadge && heldBadge.y >= dropZoneY)) {
      dropSound.currentTime = 0;
      dropSound.play();

      if (heldBadge) {
        saveCollectedBadge(heldBadge);
        lastDroppedBadge = heldBadge;
        showBadgeTimer = 120;

        badges = badges.filter(b => b !== heldBadge);
        heldBadge = null;
      }

      droppingBadge = false;
      returningToStart = true;
    }
  }

  if (showBadgeTimer > 0) {
    showBadgeTimer--;
    if (showBadgeTimer <= 0) {
      lastDroppedBadge = null;
    }
  }
}

function drawTopBar() {
  ctx.save();

  // 半透明グレー
  ctx.fillStyle = "rgba(70, 80, 90, 0.75)";
  ctx.fillRect(0, 0, WIDTH, TOP_BAR_HEIGHT);

  // 下の境界ライン（薄く）
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, TOP_BAR_HEIGHT);
  ctx.lineTo(WIDTH, TOP_BAR_HEIGHT);
  ctx.stroke();

  ctx.restore();
}


// --- 戻るボタン ---
const backButton = { x: 20, y: 20, width: 120, height: 50, text: "← 戻る" };
canvas.addEventListener("click", e => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  if (mouseX >= backButton.x && mouseX <= backButton.x + backButton.width &&
      mouseY >= backButton.y && mouseY <= backButton.y + backButton.height) {
    window.location.href = 'home.php?fromGame=true&mode=collection';
  }
});

// --- 戻るボタン描画 ---
function drawBackButton() {
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "24px sans-serif";

  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(backButton.x, backButton.y, backButton.width, backButton.height);
  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;
  ctx.strokeRect(backButton.x, backButton.y, backButton.width, backButton.height);

  ctx.fillStyle = "white";
  ctx.fillText(backButton.text, backButton.x + backButton.width/2, backButton.y + backButton.height/2);
  ctx.restore();
}

// --- 描画 ---
function draw() {
  // --- 背景 ---
  if (backgroundImg.complete) {
    ctx.drawImage(backgroundImg, 0, 0, WIDTH, HEIGHT);
  } else {
    ctx.fillStyle = "#002";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  // ★ 地面はここ！！！
  drawGroundFill();
  drawGround();

  // --- 上部UI ---
  drawTopBar();

  // --- バッジ ---
  for (let b of badges) {
    if (b !== heldBadge) {
      if (b.img.complete) ctx.drawImage(b.img, b.x, b.y, b.size, b.size);
      else {
        ctx.fillStyle = "#666";
        ctx.fillRect(b.x, b.y, b.size, b.size);
      }
    }
  }

  // --- 掴んでいるバッジ ---
  if (heldBadge && heldBadge.img.complete) {
    ctx.drawImage(heldBadge.img, heldBadge.x, heldBadge.y, heldBadge.size, heldBadge.size);
  }

  // --- ドロップゾーン ---
  drawDropZone();

  // --- クレーン ---
  drawCrane(craneX, clawY);

  // --- 残り回数 ---
  ctx.fillStyle = "white";
  ctx.font = "40px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`残り回数: ${maxPlay - playCount}`, WIDTH / 2, 60);

  drawBackButton();

  // --- GET演出 ---
  if (lastDroppedBadge && showBadgeTimer > 0) {
    const size = Math.min(WIDTH, HEIGHT) * 0.4;
    const x = WIDTH / 2 - size / 2;
    const y = HEIGHT / 2 - size / 2;

    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    if (lastDroppedBadge.img.complete) {
      ctx.drawImage(lastDroppedBadge.img, x, y, size, size);
    }

    ctx.fillStyle = "white";
    ctx.font = "48px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("GET!", WIDTH / 2, y + size + 60);
  }
}


// --- ゲームループ ---
function gameLoop(time) {
  if (!lastTime) lastTime = time;
  const delta = time - lastTime;
  lastTime = time;

  update(delta);
  updateBadges();   // ← ★ 追加
  draw();

  if (!gameOver) requestAnimationFrame(gameLoop);
}


// --- 前回のバッジ記録を消す ---
localStorage.removeItem("collectedBadges");

// 初期セットアップ
resizeCanvas();
requestAnimationFrame(gameLoop);
