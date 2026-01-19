// game_score.js


import { ItemBox, getRandomEffect } from "./itembox.js";

// --- 初期設定 ---
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ---- 先に変数だけ宣言しておく（中身は後で入る） ----
let WIDTH = 0;
let HEIGHT = 0;

// --- ゲームオーバーフラグ・タイマー・スコア ---
let gameOver = false;
let totalTimeSec = 90;               // ★ 制限時間（秒）
let remainingTime = totalTimeSec;    // 残り時間（秒）
let score = 0;                        // 取得バッジ数（スコア）

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
  clawY = craneY; // craneY は定数なので位置合わせ
  dropZoneX = WIDTH - 80;
  dropZoneY = HEIGHT - 120; // 少し上に設定

  // バッジが未生成なら生成（リサイズ時に再生成はしない）
  if (badges.length === 0) generateBadges();

  if (itemBoxes.length === 0) generateItemBoxes();
}

window.addEventListener("resize", resizeCanvas);

// --- 画像読み込み ---
const backgroundImg = new Image();
backgroundImg.src = "haikei/68641fcc-b612-4aab-92b5-35a7de155c6e_base_resized.jpg";

const craneOpenImg = new Image();
craneOpenImg.src = "crane/crane_open.png";

const craneCloseImg = new Image();
craneCloseImg.src = "crane/crane_close.png";

// --- バッジ画像パス配列（Imageオブジェクトは generateBadges 内で設定） ---
const badgeSrcList = [
  "bajji/J2SA/aomusi.png",
  "bajji/J2SA/asai.png",
  "bajji/J2SA/baba.png",
  "bajji/J2SA/be.png",
  "bajji/J2SA/gomi.png",
  "bajji/J2SA/gura.png",
  "bajji/J2SA/ha.png",
  "bajji/J2SA/hosoda.png",
  "bajji/J2SA/imo.png",
  "bajji/J2SA/inoue.png",
  "bajji/J2SA/koba.png",
  "bajji/J2SA/ma.png",
  "bajji/J2SA/sennsei.png",
  "bajji/J2SA/siota.png",
  "bajji/J2SA/suika.png",
  "bajji/J2SA/ta.png",
  "bajji/J2SA/tori.png",
  "bajji/J2SA/wada.png",
  "bajji/J2SA/yamada.png",
  "bajji/J2SA/yamamoto.png",
  "bajji/J2SA/muri.png",
  "bajji/J2SA/oo.png"
];

//アイテムボックス配列
let itemBoxes = [];

// --- アイテム表示用 ---
let currentItemIcon = null; // アイコン画像
let currentItemName = "";   // アイテム名テキスト
let itemIconTimer = 0;    

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
let craneSpeed = 5;
let clawDownSpeed = 7;
let clawUpSpeed = 5;
let clawOpen = true;
let clawAnimProgress = 0;
// --- ドロップゾーン定数 ---
const DROP_TUBE_W = 150;
const DROP_TUBE_H = 160;
const DROP_WALL_MARGIN = 10;

// 状態フラグ
let clawMovingDown = false;
let clawMovingUp = false;
let movingToDropZone = false;
let droppingBadge = false;
let returningToStart = false;

// ドロップゾーン（resizeCanvasで更新）
let dropZoneX = 0;
let dropZoneY = 0;

// --- バッジ設定 ---
let badges = [];
let heldBadge = null;
let lastDroppedBadge = null;
let showBadgeTimer = 0;
let showingBadge = false;
let shownBadge = null;

// 【NEW】滑り落ち設定
const SLIP_CHANCE_COMMON = 0.005; // コモンの上昇中のドロップ率（毎フレーム）
const SLIP_CHANCE_RARE = 0.01;
const SLIP_FALL_SPEED = 10; // 落下速度

let lastTime = 0;

const currentStageName = (() => {
  // ファイル名を取得（クエリも除去）
  let filename = location.pathname.split("/").pop().split("?")[0];

  // score_stage1.html → stage1
  const match = filename.match(/^score_(stage\d+)\./);

  return match ? match[1] : "unknown";
})();



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


function landOnGround(badge) {
  const centerX = badge.x + badge.size / 2;

  const dropLeft  = dropZoneX - DROP_TUBE_W / 2;
  const dropRight = dropZoneX + DROP_TUBE_W / 2;

  // ★ ドロップゾーン上では地面判定しない
  if (centerX > dropLeft && centerX < dropRight) {
    return false;
  }

  return badge.y + badge.size >= getGroundY(centerX);
}

// ==============================
// バッジ同士の着地判定
// ==============================
function landOnBadge(falling, base) {
  if (!falling || !base) return false;
  if (falling === base) return false;

  // 落下中のみ判定
  if (!falling.isFalling || falling.vy < 0) return false;

  const fx = falling.x + falling.size / 2;
  const bx = base.x + base.size / 2;

  // 横方向がずれすぎていたら無視
  if (Math.abs(fx - bx) > base.size * 0.9) return false;

  const fallingBottom = falling.y + falling.size;
  const baseTop = base.y;

  // 上から乗った場合のみ
  return (
    fallingBottom >= baseTop &&
    fallingBottom <= baseTop + 20
  );
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
  ctx.fillStyle = "#881414"; // 金色っぽい地面
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


function startGame() {
    gameStartTime = Date.now();  // 必ずここで初期化
    remainingTime = 60;          // ゲーム時間
    gameOver = false;
}


// --- バッジ生成（キャンバスサイズ確定後に呼ぶ） ---
function generateBadges() {
  badges = [];

  const imgs = badgeSrcList.map(src => {
    const img = new Image();
    img.src = src;
    return img;
  });

  for (let i = 0; i < 15; i++) {
    const size = rand(80, 90);

    // X を先に決める
    const x = rand(50, WIDTH - 200);
    const centerX = x + size / 2;

    // 地面の高さを取得
    const groundY = getGroundY(centerX);

    // ★ 地面より必ず上に出す（余白つき）
    const y = groundY - size - rand(40, 120);

    const img = imgs[rand(0, imgs.length)];
    const isRare = Math.random() < 0.2;

    badges.push({
      x,
      y,
      size,
      img,
      isRare,
      isFalling: false,
      onGround: false,
      vx: 0,
      vy: 0
    });
  }

  console.log("badges generated:", badges.length);
}


//アイテム配置関数
function generateItemBoxes() {
  itemBoxes = [];

  const OFFSET_Y = 170; // ← 地面からどれだけ浮かせるか（大きくすると高くなる）

  const x1 = 200;
  const y1 = getGroundY(x1) - OFFSET_Y;
  itemBoxes.push(new ItemBox(x1, y1));

  const x2 = WIDTH - 280;
  const y2 = getGroundY(x2) - OFFSET_Y;
  itemBoxes.push(new ItemBox(x2, y2));
}



// --- バッジ保存 ---
// --- バッジ取得時にスコアを取得して加算 ---
async function saveCollectedBadge(badge) {
try {
// --- 1. localStorage に保存 ---
let list = JSON.parse(localStorage.getItem("collectedBadges") || "[]");

const srcPath = badge.img.src.split("/game_login/")[1];

list.push({ src: srcPath, isRare: badge.isRare, time: Date.now() });
localStorage.setItem("collectedBadges", JSON.stringify(list));
console.log("Saved badge to localStorage:", srcPath);

// --- 2. DB からスコアを取得 ---
const res = await fetch('./get_badge_score.php', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ src: srcPath })
});

const data = await res.json();
console.log("Badge score API returned:", data);

if (data.success) {
  let badgeScore = parseInt(data.score);

  // レアバッジなら1.5倍
  if (badge.isRare) badgeScore = Math.floor(badgeScore * 1.5);

  score += badgeScore;
  console.log("Added badge score:", badgeScore, "New total score:", score);
} else {
  console.warn("Failed to get badge score:", data.msg);
}

} catch (e) {
console.error("Failed to save badge:", e);
}
}




// --- 入力 ---
let keys = {};
window.addEventListener("keydown", e => {
  // prevent default for space to avoid page scroll
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
  fetch("./save_score.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      score: score,
      stage: currentStageName
})
  })
  .then(async res => {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      console.error("サーバーが JSON を返していません\n返り値:", text);
      throw new Error("Invalid JSON");
    }
  })
  .then(data => {
    console.log("PHP 返り値:", data);

    if (data.success) {
      console.log("Score saved!");
    } else {
      console.error("Failed:", data.msg);
    }

    window.location.href = "result_score.php";
  })
  .catch(err => console.error("通信エラー:", err));
}


function updateUserStats() {
    if (!gameStartTime) return;


    const totalPlay = parseInt(localStorage.getItem('total_play') || 0) + 1;
    const totalPlayTime = parseInt(localStorage.getItem('total_play_time') || 0) + elapsedTime;
    const bestScore = Math.max(score, parseInt(localStorage.getItem('best_score') || 0));

    const stageScores = {
        normal: parseInt(localStorage.getItem('best_score_normal') || 0),
        ice: parseInt(localStorage.getItem('best_score_ice') || 0),
        special: parseInt(localStorage.getItem('best_score_special') || 0)
    };

    // 現在のステージのスコアと比較して更新
    stageScores[currentStageName] = Math.max(stageScores[currentStageName], score);

    fetch('update_user_stats.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            total_play: totalPlay,
            total_play_time: totalPlayTime,
            best_score: bestScore,
            best_score_normal: stageScores.normal,
            best_score_ice: stageScores.ice,
            best_score_special: stageScores.special
        })
    })
    .then(res => res.json())
    .then(data => console.log("Stats updated:", data))
    .catch(err => console.error(err));
}


// --- ゲーム終了処理（タイムアップ時） ---
// --- ゲーム終了処理 ---
function endGame() {
    if (gameOver) return;
    gameOver = true;

    // ローカルから既存値取得
    const totalPlay = parseInt(localStorage.getItem('total_play') || 0) + 1;
    const bestScore = Math.max(score, parseInt(localStorage.getItem('best_score') || 0));

    const stageScores = {
        normal: parseInt(localStorage.getItem('best_score_normal') || 0),
        ice: parseInt(localStorage.getItem('best_score_ice') || 0),
        special: parseInt(localStorage.getItem('best_score_special') || 0)
    };

    // 現在のステージスコア更新
    stageScores[currentStageName] = Math.max(stageScores[currentStageName], score);

    // ローカルストレージに反映
    localStorage.setItem('total_play', totalPlay);
    localStorage.setItem('best_score', bestScore);
    localStorage.setItem('best_score_normal', stageScores.normal);
    localStorage.setItem('best_score_ice', stageScores.ice);
    localStorage.setItem('best_score_special', stageScores.special);

    // --- DB へ送信 ---
    fetch('update_user_stats.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            total_play: totalPlay,
            best_score: bestScore,
            best_score_normal: stageScores.normal,
            best_score_ice: stageScores.ice,
            best_score_special: stageScores.special
        })
    })
    .then(res => res.json())
    .then(data => console.log("Stats updated:", data))
    .catch(err => console.error("Stats update error:", err));

    // --- リザルト表示（少し遅延） ---
    setTimeout(showResult, 800);
}

// --- メイン更新 ---
function update(delta) {
// --- クレーン移動判定（先に宣言） ---
let isMoving = clawMovingDown || clawMovingUp || movingToDropZone || returningToStart ||
keys["ArrowLeft"] || keys["ArrowRight"];



// --- アイテムボックス判定 ---
for (let box of itemBoxes) {
    if (box.active && box.checkCollision({ x: craneX - 15, y: clawY, size: 30 })) {
        const effect = getRandomEffect();
        console.log("アイテム発動:", effect.name);

        // プリミティブはオブジェクトにラップ
        let game = {
            score,
            craneSpeed,
            remainingTime,
            badges,
            syncCraneSpeed: (value) => {
            craneSpeed = value;  // ← 外側へ反映
            } 
        };

        // 効果を適用
        effect.apply(game);

        // 外側の変数に反映
        score = game.score;
        craneSpeed = game.craneSpeed;
        remainingTime = game.remainingTime;

        // アイコン表示
        currentItemName = effect.name;
        currentItemIcon = new Image();
        currentItemIcon.src = effect.icon;
        itemIconTimer = (effect.duration || 5) * 60; // FPS=60

        // クレーン動作を上昇へ
        clawOpen = false;
        clawMovingDown = false;
        clawMovingUp = true;

        break;
    }
}

// --- アイテムアイコンタイマー更新 ---
if (itemIconTimer > 0) itemIconTimer--;
else {
    currentItemName = null;
    currentItemIcon = null;
}

if (gameOver) {
    if (!moveSound.paused) moveSound.pause();
    return;
}

// --- 残り時間更新 ---
remainingTime -= delta / 1000;
if (remainingTime <= 0) {
    remainingTime = 0;
    endGame();
    return;
}

// --- 移動音管理 ---
if (isMoving) {
    if (moveSound.paused) moveSound.play();
} else {
    if (!moveSound.paused) moveSound.pause();
}

// --- 入力処理（操作可能なとき） ---
if (!clawMovingDown && !clawMovingUp && !movingToDropZone && !droppingBadge && !returningToStart) {
    if (!showingBadge && showBadgeTimer <= 0) {
        if (keys["ArrowLeft"] && craneX > 30) craneX -= craneSpeed;
        if (keys["ArrowRight"] && craneX < WIDTH - 30) craneX += craneSpeed;
        if (keys[" "] || keys["Spacebar"] || keys["Space"]) {
            clawOpen = true;
            clawMovingDown = true;
        }
    }
}

// --- クレーンアニメーション ---
clawAnimProgress += clawOpen ? -0.1 : 0.1;
clawAnimProgress = Math.max(0, Math.min(1, clawAnimProgress));

// --- クレーン降下処理 ---
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

// --- クレーン上昇処理 ---
if (clawMovingUp) {
    clawY -= clawUpSpeed;
    if (heldBadge) {
        heldBadge.x = craneX - heldBadge.size / 2;
        heldBadge.y = clawY + 20;

        const slipChance = heldBadge.isRare ? SLIP_CHANCE_RARE : SLIP_CHANCE_COMMON;
if (Math.random() < slipChance) {
    dropSound.currentTime = 0;
    dropSound.play();

    heldBadge.isFalling = true;
    heldBadge.onGround = false;   // ★ 追加
    heldBadge.vy = 0;
    heldBadge.vx = 0;

    heldBadge = null;
}
    }
    if (clawY <= craneY) {
        clawY = craneY;
        clawMovingUp = false;
        if (heldBadge) movingToDropZone = true;
        else returningToStart = true;
    }
}

// --- 初期位置への戻り ---
if (returningToStart) {
    if (craneX < WIDTH - 50) craneX += craneSpeed;
    else {
        returningToStart = false;
        clawOpen = true;
    }
}

// --- ドロップゾーン移動 ---
if (movingToDropZone) {
    if (craneX < dropZoneX) {
        craneX += craneSpeed;
        if (heldBadge) {
            heldBadge.x = craneX - heldBadge.size / 2;
            heldBadge.y = clawY + 20;
        }
    } else {
        movingToDropZone = false;
        droppingBadge = true;
        clawOpen = true;
    }
}

// --- ドロップ処理 ---
if (droppingBadge) {
    if (heldBadge) heldBadge.y += 10;

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

// --- GET表示タイマー ---
if (showBadgeTimer > 0) {
    showBadgeTimer--;
    if (showBadgeTimer <= 0) lastDroppedBadge = null;
}

}


// --- 戻るボタン ---
const backButton = { x: 20, y: 20, width: 120, height: 50, text: "← 戻る" };

canvas.addEventListener("click", e => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  if (mouseX >= backButton.x && mouseX <= backButton.x + backButton.width &&
      mouseY >= backButton.y && mouseY <= backButton.y + backButton.height) {
    window.location.href = 'home.php?fromGame=true&mode=score';
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
  // 背景
  if (backgroundImg.complete) {
    ctx.drawImage(backgroundImg, 0, 0, WIDTH, HEIGHT);
  } else {
    ctx.fillStyle = "#002";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  // バッジ描画
  for (let b of badges) {
    // heldBadge は別で描画する（掴まれている間はフィールド上では描かない）
    if (b !== heldBadge) {
      if (b.isRare) {
        ctx.strokeStyle = "gold";
        ctx.lineWidth = 4;
        ctx.strokeRect(b.x - 3, b.y - 3, b.size + 6, b.size + 6);
      }
      if (b.img.complete) ctx.drawImage(b.img, b.x, b.y, b.size, b.size);
      else {
        // プレースホルダ
        ctx.fillStyle = "#666";
        ctx.fillRect(b.x, b.y, b.size, b.size);
      }
    }
  }
    // --- アイテムボックス描画 ---
  itemBoxes.forEach(box => box.draw(ctx));


  // 掴んでいるバッジを描画
  if (heldBadge) {
    if (heldBadge.isRare) {
      ctx.strokeStyle = "gold";
      ctx.lineWidth = 4;
      ctx.strokeRect(heldBadge.x - 3, heldBadge.y - 3, heldBadge.size + 6, heldBadge.size + 6);
    }
    if (heldBadge.img.complete) ctx.drawImage(heldBadge.img, heldBadge.x, heldBadge.y, heldBadge.size, heldBadge.size);
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
    ctx.save();

    // ガラス
    ctx.fillStyle = "rgba(80, 140, 255, 0.12)";
    ctx.fillRect(
      dropZoneX - DROP_TUBE_W / 2,
      dropZoneY,
      DROP_TUBE_W,
      DROP_TUBE_H
    );

    // 枠
    ctx.strokeStyle = "rgba(0, 180, 255, 0.9)";
    ctx.lineWidth = 6;
    ctx.strokeRect(
      dropZoneX - DROP_TUBE_W / 2,
      dropZoneY,
      DROP_TUBE_W,
      DROP_TUBE_H
    );

    const num = 4;
    const spacing = DROP_TUBE_H / num;

    for (let i = 0; i < num; i++) {
        const y = dropZoneY + spacing * (i + 0.5);
        drawCyberArrow(dropZoneX, y);
    }

    ctx.restore();
}


  drawCrane(craneX, clawY);

// --- 画面上部に「残り時間」と「スコア」を表示（右寄せに変更） ---
ctx.fillStyle = "rgba(0,0,0,0.6)";
ctx.fillRect(0, 0, WIDTH, 80);

ctx.fillStyle = "white";
ctx.font = "28px sans-serif";
ctx.textAlign = "right";

// 表示位置を右側にまとめる
const rightX = WIDTH - 30;

// 残り時間（上段）
ctx.fillText(`残り時間: ${Math.max(0, Math.floor(remainingTime))}s`, rightX, 35);

// スコア（下段）
ctx.fillText(`スコア: ${score}`, rightX, 70);

  // --- アイテムアイコン表示 ---
if (itemIconTimer > 0) {
    itemIconTimer--;

    const iconY = 10;
    const iconSize = 50;

    if (currentItemIcon) {
        // 中央にアイコン表示
        ctx.drawImage(
            currentItemIcon,
            WIDTH / 2 - iconSize / 2,
            iconY,
            iconSize,
            iconSize
        );
    }

    // アイコンがない場合はテキストで表示
    ctx.fillStyle = "white";
    ctx.font = "24px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(currentItemName, WIDTH / 2, iconY + 70);
}

    // ドロップゾーン描画（順番に光る矢印）
  drawDropZone();

  drawBackButton();

  // バッジ拡大表示
  if (lastDroppedBadge && showBadgeTimer > 0) {
    const size = Math.min(WIDTH, HEIGHT) * 0.4;
    const x = WIDTH/2 - size/2;
    const y = HEIGHT/2 - size/2;

    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0,0,WIDTH,HEIGHT);

    if (lastDroppedBadge.img.complete) ctx.drawImage(lastDroppedBadge.img, x, y, size, size);

    if (lastDroppedBadge.isRare) {
      ctx.strokeStyle = "gold";
      ctx.lineWidth = 8;
      ctx.strokeRect(x-5, y-5, size+10, size+10);
    }

    ctx.fillStyle = "white";
    ctx.font = "48px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("GET!", WIDTH/2, y + size + 60);
  }

  // showingBadge（個別拡大表示予備）
  if (showingBadge && shownBadge) {
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0,0,WIDTH,HEIGHT);

    const size = 300;
    if (shownBadge.img.complete) ctx.drawImage(shownBadge.img, WIDTH/2 - size/2, HEIGHT/2 - size/2, size, size);

    ctx.fillStyle = "white";
    ctx.font = "48px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("GET!", WIDTH/2, HEIGHT/2 + size/2 + 60);

    drawBackButton();
  }
  drawGroundFill();
  drawGround();
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

// 初期セットアップ
resizeCanvas(); // これが generateBadges を呼ぶ
// ゲーム開始
requestAnimationFrame(gameLoop);
