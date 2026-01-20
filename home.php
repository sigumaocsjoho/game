<?php
session_start();
if (!isset($_SESSION['user'])) {
  header("Location: login.html");
  exit;
}
$username = htmlspecialchars($_SESSION['user'], ENT_QUOTES, 'UTF-8');
$secretUnlocked = $_SESSION['secret_stage_unlocked'] ?? 0;
$secretFirstView = $_SESSION['secret_stage_first_view'] ?? 1;


// ユーザーアイコンの取得（DBまたはセッション）
$user_icon = $_SESSION['user_icon'] ?? 'icon/default_icon.png';
?>

<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Game Home Screen</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <meta name="screen-orientation" content="landscape">
  <meta name="orientation" content="landscape">
<style>
body {
  margin: 0; padding: 0;
  font-family: 'Arial', sans-serif;
  background: url('haikei/gamecenter_crane01.png') no-repeat center center fixed;
  background-size: cover;
  display: flex; flex-direction: column; justify-content: center; align-items: center;
  min-height: 100vh; color: rgba(255, 80, 185, 1); text-shadow: 2px 2px 4px #000;
}

h1 {
  font-size: 60px;
  margin-bottom: 40px;
  letter-spacing: 3px;
  text-transform: uppercase;

  /* ↓ ここから追加 */
  padding: 10px 25px;
  background: rgba(0, 0, 0, 0.35); /* 半透明の黒背景 */
  backdrop-filter: blur(8px);       /* 背景ぼかし */
  -webkit-backdrop-filter: blur(8px);
  border-radius: 12px;              /* 角を丸く */
}

h2 {
  font-size: 32px;
  padding: 8px 20px;
  margin-bottom: 20px;

  background: rgba(0, 0, 0, 0.35);  /* 半透明背景 */
  backdrop-filter: blur(6px);        /* 背景ぼかし */
  -webkit-backdrop-filter: blur(6px);
  border-radius: 10px;               /* 角丸 */
  color: #ff51a8ff;
  text-shadow: 2px 2px 4px #000;      /* 読みやすくする */
}



.menu, .mode-select, .stage-select {
  display: flex; flex-direction: column; gap: 20px; align-items: center;
}

button {
  width: 280px; height: 60px; font-size: 22px;
  font-weight: bold; border: none; border-radius: 10px; cursor: pointer;
  transition: all 0.3s ease; background-color: rgba(0,0,0,0.7); color: white;
}
button:hover { background-color: rgba(255,255,255,0.9); color: black; }

.stage-grid {
  display: grid;
  grid-template-columns: repeat(3, 220px);
  gap: 30px;
  justify-content: center;
}
.stage-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(0,0,0,0.6);
  border-radius: 10px;
  padding: 10px;
  transition: transform 0.2s ease, background 0.2s ease;
  cursor: pointer;
  width: 220px;
}
.stage-card:hover {
  background: rgba(255,255,255,0.9);
  color: black;
  transform: scale(1.05);
}
.stage-thumb {
  width: 200px; height: 130px;
  object-fit: cover;
  border-radius: 10px;
  margin-bottom: 10px;
}
.stage-title {
  font-size: 18px;
  font-weight: bold;
  text-align: center;
}
.mode-select, .stage-select { display: none; }

/* 左上：ログイン中ユーザー情報 */
.user-info {
  position: fixed;     /* 常に左上に固定 */
  top: 20px;
  left: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  color: white;
  background: rgba(0,0,0,0.5);
  padding: 6px 12px;
  border-radius: 20px;
  z-index: 1000;
}

/* 左上アイコン（小さく表示） */
.user-info .user-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid white;
}

/* 右上プロフィールアイコン */
.profile-icon-top {
  position: fixed;  /* 常に右上に固定 */
  top: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
  border: 2px solid #fff;
  transition: all 0.3s ease;
  z-index: 999;
}
.profile-icon-top:hover { transform: scale(1.1); }

/* ホバー時の吹き出し */
.profile-icon-top::after {
  content: "プロフィール";
  position: absolute;
  top: -30px;
  right: 0;
  background: rgba(0,0,0,0.8);
  color: #fff;
  padding: 2px 6px;
  font-size: 12px;
  border-radius: 4px;
  opacity: 0;
  visibility: hidden;
  transition: 0.2s;
}
.profile-icon-top:hover::after {
  opacity: 1;
  visibility: visible;
}

.stage-card.hidden {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.stage-card.show {
  opacity: 1;
  transform: translateY(0) scale(1);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

/* ===== 画面割れ演出 ===== */
#crackOverlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.95);
  z-index: 6000;
  display: none;
  overflow: hidden;
}

.crack {
  position: absolute;
  width: 4px;
  height: 120%;
  background: linear-gradient(to bottom, transparent, white, transparent);
  opacity: 0.8;
  animation: crackMove 0.6s ease-out forwards;
}

@keyframes crackMove {
  from { transform: scaleY(0); }
  to { transform: scaleY(1); }
}

.shatter {
  animation: shatterOut 0.8s ease-in forwards;
}

@keyframes shatterOut {
  to {
    opacity: 0;
    transform: scale(1.2);
  }
}
/* ===== 隠しステージ中央フェードイン ===== */
.stage-card.center-appear {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0.6);
  z-index: 7000;
  opacity: 0;
  pointer-events: none;
}

.stage-card.center-appear.show {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
  transition:
    opacity 0.8s ease,
    transform 0.8s cubic-bezier(.2,.8,.2,1);
}
/* ===== 隠しステージ解放表示 ===== */
#secretReveal {
  position: fixed;
  inset: 0;
  z-index: 7000;
  display: none;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  background: radial-gradient(circle at center, rgba(0,0,0,0.85), rgba(0,0,0,0.95));
  animation: fadeIn 0.6s ease;
}

#secretRevealText {
  margin-top: 24px;
  font-size: 36px;
  font-weight: bold;
  color: #fff;
  letter-spacing: 3px;
  opacity: 0;
  animation: textPop 0.6s ease forwards;
  animation-delay: 0.6s;
  text-shadow: 0 0 12px rgba(255,255,255,0.6);
}

#secretReveal .stage-card {
  width: 360px;
  transform: scale(0.6);
  opacity: 0;
  animation: cardZoom 0.8s cubic-bezier(.2,.8,.2,1) forwards;
}

@keyframes cardZoom {
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes textPop {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.stage-card.hidden {
  display: none; /* 空間も消す */
}

html, body {
  margin: 0;
  padding: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #000;
}

#rotateNotice {
  position: fixed;
  inset: 0;
  background: #000;
  color: #fff;
  display: none;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  z-index: 9999;
}


</style>
</head>
<body>
  <div id="rotateNotice">
  端末を横にしてください
  </div>

<!-- 左上：ログイン中ユーザー -->
<div class="user-info">
  <img src="<?php echo $user_icon; ?>" class="user-icon" alt="ユーザーアイコン">
  ログイン中: <?php echo $username; ?>
</div>

<!-- 右上プロフィールアイコン -->
<img id="profileIconTop" class="profile-icon-top" src="<?php echo $user_icon; ?>" onclick="editProfile()">

<h1 id="title">イラストレールセンター</h1>

<!-- ホームメニュー -->
<div id="homeMenu" class="menu">
  <button onclick="goToModeSelect()">スタート</button>
  <button onclick="showCollection()">コレクション</button>
  <button onclick="rankingGame()">ランキング</button>
  <button id="loginLogoutBtn" onclick="handleLoginLogout()">ログアウト</button>
</div>

<!-- モード選択 -->
<div id="modeSelect" class="mode-select">
  <h2>モードを選択してください</h2>
  <button onclick="selectMode('collection')">コレクションモード</button>
  <button onclick="selectMode('score')">スコアアタック</button>
  <button onclick="backToHome()">戻る</button>
</div>

<!-- ステージ選択 -->
<div id="stageSelect" class="stage-select">
  <h2>ステージを選択してください</h2>
  <div class="stage-grid">
    <div class="stage-card" onclick="startStage(1)">
      <img src="haikei/haikei2.jpg" alt="Stage 1" class="stage-thumb">
      <div class="stage-title">動物園</div>
    </div>
    <div class="stage-card" onclick="startStage(2)">
      <img src="haikei/images.jpg" alt="Stage 2" class="stage-thumb">
      <div class="stage-title">水族館</div>
    </div>
    <div class="stage-card" onclick="startStage(3)">
      <img src="haikei/road_douro.png" alt="Stage 3" class="stage-thumb">
      <div class="stage-title">高速道路</div>
    </div>
    <div class="stage-card" onclick="startStage(4)">
      <img src="haikei/c8a84bce905849ba608c40b81c479f7c.jpg" alt="Stage 4" class="stage-thumb">
      <div class="stage-title">ハロウィン</div>
    </div>
    <div class="stage-card" onclick="startStage(5)">
      <img src="haikei/_supermarket_1.jpg" alt="Stage 5" class="stage-thumb">
      <div class="stage-title">スーパー</div>
    </div>
    <div class="stage-card" onclick="startStage(6)">
      <img src="haikei/68641fcc-b612-4aab-92b5-35a7de155c6e_base_resized.jpg" alt="Stage 6" class="stage-thumb">
      <div class="stage-title">J2SA</div>
    </div>
    <!-- 隠しステージ -->
<div id="secretStageCard" class="stage-card hidden" onclick="startStage(7)">
  <img src="haikei/burning-village1.jpg" alt="Secret Stage" class="stage-thumb">
  <div class="stage-title">？？？</div>
</div>
  </div>
  <button onclick="backToMode()">戻る</button>
</div>

<audio autoplay loop>
  <source src="bgm/口笛ショッピング.mp3" type="audio/mpeg">
</audio>

<script>
let SECRET_STAGE_UNLOCKED = <?= json_encode((bool)$secretUnlocked) ?>;
let SECRET_STAGE_FIRST_VIEW = <?= json_encode((bool)$secretFirstView) ?>;
</script>

<script>
let selectedMode = null;

function goToModeSelect() {
  document.getElementById("homeMenu").style.display = "none";
  document.getElementById("modeSelect").style.display = "flex";
  document.getElementById("title").textContent = "モード選択";
}

function selectMode(mode) {
  selectedMode = mode;
  document.getElementById("modeSelect").style.display = "none";
  document.getElementById("stageSelect").style.display = "flex";
  document.getElementById("title").textContent =
    mode === 'collection' ? "コレクションモード" : "スコアアタック";

  // ★ここで演出判定
  if (SECRET_STAGE_UNLOCKED && SECRET_STAGE_FIRST_VIEW) {
    playSecretStageIntro();
  } else if (SECRET_STAGE_UNLOCKED) {
    showSecretStage();
  }
}


function startStage(stage) {
  // ★隠しステージの場合は解放されているかチェック
  if (stage === 7 && !SECRET_STAGE_UNLOCKED) {
    alert("このステージはまだ解放されていません");
    return;
  }

  if (selectedMode === 'collection') {
    window.location.href = `collection_stage${stage}.html`;
  } else if (selectedMode === 'score') {
    window.location.href = `score_stage${stage}.html`;
  }
}


function backToMode() {
  document.getElementById("stageSelect").style.display = "none";
  document.getElementById("modeSelect").style.display = "flex";
  document.getElementById("title").textContent = "モード選択";
}

function backToHome() {
  document.getElementById("modeSelect").style.display = "none";
  document.getElementById("homeMenu").style.display = "flex";
  document.getElementById("title").textContent = "イラストレールセンター";
}

function showCollection() { window.location.href = "collection.php"; }
function rankingGame() { window.location.href = "ranking.html"; }
function handleLoginLogout() { window.location.href = "logout.php"; }
function editProfile() { window.location.href = "profile.html"; }

window.addEventListener("load", () => {
  const params = new URLSearchParams(window.location.search);
  const fromGame = params.get("fromGame") === "true";
  const mode = params.get("mode");

  if (fromGame) {
    document.getElementById("homeMenu").style.display = "none";
    document.getElementById("modeSelect").style.display = "none";
    document.getElementById("stageSelect").style.display = "flex";
    document.getElementById("title").textContent = "ステージ選択";
    if (mode) selectedMode = mode;
  }

  // ★ 初回演出がある場合は表示しない
  if (SECRET_STAGE_UNLOCKED && !SECRET_STAGE_FIRST_VIEW) {
    showSecretStage();
  }
});



// 編集ページから戻ったときに最新アイコンを反映
async function refreshProfileIcon(){
    try {
        const res = await fetch("profile.php");
        const data = await res.json();
        document.getElementById("profileIconTop").src = data.user.icon || "icon/default_icon.png";
    } catch(e) { console.error(e); }
}
window.addEventListener("focus", refreshProfileIcon);

// ===============================
// 隠しコマンドでステージ解放
// ===============================
const secretCommand = [
  "arrowup","arrowup","arrowdown","arrowdown",
  "arrowleft","arrowright","arrowleft","arrowright",
  "b","a"
];

let secretInput = [];

document.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();
  secretInput.push(key);

  if (secretInput.length > secretCommand.length) {
    secretInput.shift();
  }

  if (secretCommand.every((k, i) => k === secretInput[i])) {
    unlockSecretStage();
  }
});


function showSecretStage() {
  const card = document.getElementById("secretStageCard");
  card.classList.remove("hidden"); // display:block になる
  card.classList.add("show");
}


function showStageSelect() {
  const stageSelectDiv = document.getElementById("stageSelect");
  stageSelectDiv.style.display = "flex";

  const secretCard = document.getElementById("secretStageCard");

  if (SECRET_STAGE_UNLOCKED) {
    secretCard.classList.remove("hidden");
  } else {
    secretCard.classList.add("hidden"); // 非表示にして空間も消える
  }
}



function showSecretStageCenter() {
  const card = document.getElementById("secretStageCard");
  if (!card) return;

  card.classList.remove("hidden");
  card.classList.add("center-appear");

  // レイアウト反映後に show
  requestAnimationFrame(() => {
    card.classList.add("show");
  });

  // 1.5秒後にステージ一覧へ戻す
  setTimeout(() => {
    card.classList.remove("center-appear");
  }, 1500);
}

function unlockSecretStage() {
  if (SECRET_STAGE_UNLOCKED) return;

  SECRET_STAGE_UNLOCKED = true; // ★ここで即更新

  fetch("unlock_secret_stage.php", { method: "POST" });

  const overlay = document.getElementById("secretUnlockOverlay");
  overlay.style.display = "flex";

  setTimeout(() => {
    overlay.innerHTML = `
      <div style="font-size:20px; opacity:0.7; margin-bottom:12px;">隠しステージ</div>
      <div style="font-size:42px; font-weight:bold;">？？？ 解放</div>
    `;
  }, 800);

  setTimeout(() => {
    overlay.style.display = "none";
    showSecretStage();
  }, 2500);
}

function showSecretStageReveal() {
  const reveal = document.getElementById("secretReveal");
  const cardSlot = document.getElementById("secretRevealCard");
  const originalCard = document.getElementById("secretStageCard");

  // カードを複製して中央表示
  const clone = originalCard.cloneNode(true);
  clone.classList.remove("hidden", "show");
  clone.onclick = null;

  cardSlot.innerHTML = "";
  cardSlot.appendChild(clone);

  reveal.style.display = "flex";

  // 数秒後に閉じる → ステージ選択に配置
  setTimeout(() => {
    reveal.style.display = "none";
    showSecretStage();
  }, 2600);
}

function playSecretStageIntro() {
  const overlay = document.getElementById("crackOverlay");

  overlay.style.display = "block";
  overlay.innerHTML = "";

  for (let i = 0; i < 6; i++) {
    const crack = document.createElement("div");
    crack.className = "crack";
    crack.style.left = Math.random() * 100 + "%";
    crack.style.transform = `rotate(${Math.random()*40 - 20}deg)`;
    overlay.appendChild(crack);
  }

  // 割れる
  setTimeout(() => overlay.classList.add("shatter"), 600);

  // 解放演出
  setTimeout(() => {
    overlay.style.display = "none";
    overlay.classList.remove("shatter");

    showSecretStageReveal();
  }, 1200);

  // 初回フラグ消化
  SECRET_STAGE_FIRST_VIEW = false;
  fetch("clear_secret_first_view.php", { method: "POST" });
}


</script>

<!-- 隠しステージ解放演出 -->
<div id="secretUnlockOverlay" style="
  display:none;
  position:fixed;
  inset:0;
  background:rgba(0,0,0,0.9);
  z-index:5000;
  justify-content:center;
  align-items:center;
  flex-direction:column;
  color:white;
  font-size:32px;
  letter-spacing:4px;
">
  <div style="margin-bottom:20px;">……</div>
  <div>何かが解放された</div>
</div>
<div id="crackOverlay"></div>
<!-- 隠しステージ解放表示 -->
<div id="secretReveal">
  <div id="secretRevealCard"></div>
  <div id="secretRevealText">隠しステージが解放されました</div>
</div>

</body>
</html>

