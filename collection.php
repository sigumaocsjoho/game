<?php
session_start();

// ▼ログインチェック
if (!isset($_SESSION['user_id'])) {
    header("Location: login.html");
    exit;
}

require "db_config.php";

$user_id = $_SESSION['user_id'];

// ▼取得済みバッジ
$stmt = $pdo->prepare("SELECT badge_src FROM user_badges WHERE user_id = ?");
$stmt->execute([$user_id]);
$user_badges_raw = $stmt->fetchAll(PDO::FETCH_COLUMN);
$user_badges = array_map(fn($v) => basename($v), $user_badges_raw);


// ▼全バッジ
$all = $pdo->query("SELECT * FROM badges ORDER BY stage, id")->fetchAll(PDO::FETCH_ASSOC);

// ▼ステージごとに整理
$stages = [];
foreach ($all as $badge) {
    $stageName = $badge['stage'];
    $stages[$stageName][] = $badge;
}

// ▼JSに渡す配列
$stages_js = [];
foreach ($stages as $stageName => $badges) {
    $stages_js[] = [
        'stageName' => $stageName,
        'badges' => $badges
    ];
}

// ▼コンプリート進行状況
$obtained_count = count($user_badges);
$total_count = count($all);
$remaining = $total_count - $obtained_count;
?>
<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<title>コレクションルーム</title>
<style>
  body {
    margin: 0; padding: 0;
    background: url('haikei/OIP.webp') no-repeat center center fixed;
    background-size: cover;
    color: black; text-align: center;
    font-family: Arial, sans-serif;
  }

  h1 { margin-top: 30px; font-size: 36px; text-shadow: 1px 1px 3px rgba(255,255,255,0.7); }

  h2.stage-title { 
    margin-top: 20px; 
    margin-bottom: 20px; 
    font-size: 28px; 
    text-decoration: underline; 
    text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
  }

  .collection-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 20px;
    width: 80%; margin: 0 auto;
  }

  .item {
    background-color: rgba(255,255,255,0.15);
    border: 2px solid rgba(255,255,255,0.5);
    border-radius: 10px;
    padding: 10px;
    width: 150px;
    height: 200px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    transition: transform 0.2s;
  }
  .item:hover { transform: scale(1.05); }
  .item img { width: 120px; height: 120px; object-fit: contain; border-radius: 10px; }
  .locked { filter: brightness(0); }
  .rare-border { border-color: gold !important; box-shadow: 0 0 12px gold; }

  /* ▼ステージ切替矢印 */
  .arrow-btn {
    font-size: 40px;
    background: rgba(0,0,0,0.3);
    border: none;
    color: white;
    cursor: pointer;
    padding: 10px 20px;
    border-radius: 10px;
    transition: transform 0.2s, background 0.2s;
  }
  .arrow-btn:hover { transform: scale(1.1); background: rgba(0,0,0,0.6); }

  .stage-nav {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 20px 0;
  }

  .big-button {
    padding: 15px 30px;
    font-size: 20px;
    border-radius: 10px;
    border: none;
    background-color: #580404ff;
    color: white;
    cursor: pointer;
    transition: transform 0.2s, background-color 0.2s;
    margin: 30px 0 60px;
  }
  .big-button:hover { background-color: #bbda2fff; transform: scale(1.05); }

/* ▼モーダル背景 */
.modal {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: none;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

/* ▼モーダル中身 */
.modal-content {
  background: white;
  padding: 20px;
  border-radius: 15px;
  text-align: center;
  width: 80%;
  max-width: 400px;
}

.modal-content img {
  width: 80%;
  max-width: 300px;
}

.close-btn {
  margin-top: 15px;
  padding: 10px 20px;
  background: #333;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
}

</style>
</head>
<body>

<h1>🎨 コレクションルーム 🎨</h1>
<h2>コンプリートまで：<?= $remaining ?> 個（<?= $obtained_count ?>/<?= $total_count ?>）</h2>

<div class="stage-nav">
    <button class="arrow-btn" id="prevStage">◀</button>
    <div id="stageContainer" style="width:80%"></div>
    <button class="arrow-btn" id="nextStage">▶</button>
</div>

<button class="big-button" onclick="location.href='home.php'">ホームへ戻る</button>

<script>
const stages = <?= json_encode($stages_js) ?>;
const userBadges = <?= json_encode($user_badges) ?>;
let currentStage = 0;

function renderStage(index) {
    const stage = stages[index];
    const container = document.getElementById('stageContainer');
    container.innerHTML = `<h2 class="stage-title">${stage.stageName}</h2>
        <div class="collection-grid">
            ${stage.badges.map(badge => {
                const fileName = badge.badge_src.split('/').pop();
                const hasBadge = userBadges.includes(fileName);
                const rareClass = badge.is_rare ? 'rare-border' : '';
                const lockedClass = hasBadge ? '' : 'locked';
                return `<div class="item ${rareClass}" 
                            onclick='openModal(${JSON.stringify(badge)} , ${hasBadge})'>
                    <img src="${badge.badge_src}" class="${lockedClass}">
                    <p>${hasBadge ? '取得済み' : '未取得'}</p>
                </div>`;
            }).join('')}
        </div>`;
}


document.getElementById('prevStage').onclick = () => {
    currentStage = (currentStage - 1 + stages.length) % stages.length;
    renderStage(currentStage);
};

document.getElementById('nextStage').onclick = () => {
    currentStage = (currentStage + 1) % stages.length;
    renderStage(currentStage);
};

// 初期表示
renderStage(currentStage);
</script>

    <audio autoplay loop>
  <source src="bgm/Breezy_Boulevard.mp3" type="audio/mpeg">
  <!-- ブラウザが音声をサポートしていない場合のメッセージ -->
  お使いのブラウザはaudio要素をサポートしていません。
</audio>

<!-- ▼バッジ詳細モーダル -->
<div class="modal" id="badgeModal">
  <div class="modal-content">
    <img id="modalImage" src="">
    <h3 id="modalName"></h3> <!-- 名前を追加 -->
    <p id="modalScore"></p>  <!-- スコア追加 -->
    <p id="modalText"></p>
    <button class="close-btn" onclick="closeModal()">閉じる</button>
  </div>
</div>

<script>
function openModal(badge, hasBadge) {
    const modal = document.getElementById("badgeModal");
    const img = document.getElementById("modalImage");
    const name = document.getElementById("modalName"); // 追加
    const text = document.getElementById("modalText");
    const score = document.getElementById("modalScore"); 

    img.src = badge.badge_src;
    name.textContent = badge.name || "名前不明"; // バッジ名を表示

    if (hasBadge) {
        text.textContent = badge.description || "説明文はありません。";
        score.textContent = "スコア: " + (badge.score ?? "未設定"); // スコアを表示
    } else {
        text.textContent = "未取得のため説明文は見れません。";
        score.textContent = "";
    }

    modal.style.display = "flex";
}

function closeModal() {
    document.getElementById("badgeModal").style.display = "none";
}
</script>



</body>
</html>
