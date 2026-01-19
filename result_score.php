<?php
session_start();

// ログイン前提
$myUserName = $_SESSION['user_name'] ?? '';
$stageName  = $_SESSION['last_stage'] ?? 'stage1'; // ★ 今回遊んだステージ
$score      = $_SESSION['last_score'] ?? 0;         // ★ 今回のスコア（任意）
?>
<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<title>リザルトランキング</title>
<style>
body {
    font-family: "Segoe UI", sans-serif;
    background: #1b1b2f;
    color: #fff;
    margin: 0;
    padding: 20px;
    text-align: center;
}

/* スコア表示 */
#scoreDisplay {
    font-size: 36px;
    margin-bottom: 20px;
    color: #ffd369;
    text-shadow: 0 0 10px #ffd369;
}

/* ボタン */
button {
    font-size: 18px;
    padding: 10px 20px;
    margin: 10px;
    cursor: pointer;
    border: none;
    border-radius: 10px;
    background: #303245;
    color: #fff;
    transition: 0.2s;
    box-shadow: 0 3px 6px rgba(0,0,0,0.3);
}
button:hover {
    background: #ff9e00;
    color: #1b1b2f;
    font-weight: bold;
}

/* タブ */
.tabs {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin-bottom: 20px;
}
.tab {
    padding: 10px 20px;
    cursor: pointer;
    background: #303245;
    color: #aaa;
    font-weight: bold;
    border-radius: 10px;
    transition: 0.2s;
    box-shadow: 0 3px 6px rgba(0,0,0,0.3);
}
.tab.active {
    background: #ff9e00;
    color: #1b1b2f;
}

/* タブ内容 */
.tab-content {
    display: none;
    min-height: 400px;
}
.tab-content.active {
    display: block;
}

/* テーブル */
table {
    width: 100%;
    border-collapse: collapse;
    background: #2d2f48;
    border-radius: 12px;
    overflow: hidden;
}
th {
    background: #ff9e00;
    padding: 12px;
    color: #1b1b2f;
}
td {
    padding: 12px;
    border-bottom: 1px solid #3c3f5c;
}
</style>
</head>

<body>

<div id="scoreDisplay">スコア: <?= (int)$score ?></div>

<div>
    <button id="homeBtn">ホームに戻る</button>
    <button id="retryBtn">もう一度プレイ</button>
</div>

<div class="tabs">
    <div class="tab active" data-target="overall">総合</div>
    <div class="tab" data-target="stage">今回のステージ</div>
</div>

<div id="overall" class="tab-content active"></div>
<div id="stage" class="tab-content"></div>

<div id="myRankOverall"></div>
<div id="myRankStage"></div>

<script>
// ★ PHP → JS へ受け渡し（URLは使わない）
const stageName = "<?= htmlspecialchars($stageName, ENT_QUOTES) ?>";
const score = <?= (int)$score ?>;

// stage番号抽出
let stageNumber = 1;
const m = stageName.match(/stage(\d+)/);
if (m) stageNumber = Number(m[1]);

// ボタン
document.getElementById("homeBtn").onclick = () => {
    location.href = "home.php";
};
document.getElementById("retryBtn").onclick = () => {
    location.href = `home.php?fromGame=true&mode=score&stage=${stageName}`;
};

// タブ切替
document.querySelectorAll(".tab").forEach(tab => {
    tab.onclick = () => {
        document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
        document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
        tab.classList.add("active");
        document.getElementById(tab.dataset.target).classList.add("active");
    };
});

// テーブル描画
function renderTable(id, title, list) {
    let html = `<h2>${title}</h2>`;
    if (!list || list.length === 0) {
        html += "<p>データがありません</p>";
    } else {
        html += `<table>
            <tr><th>順位</th><th>ユーザー</th><th>スコア</th></tr>`;
        list.forEach((r, i) => {
            html += `<tr>
                <td>${i + 1}</td>
                <td>${r.user_name}</td>
                <td>${r.score}</td>
            </tr>`;
        });
        html += "</table>";
    }
    document.getElementById(id).innerHTML = html;
}

// ランキング取得
async function fetchRanking() {
    const res = await fetch("ranking.php");
    const data = await res.json();

    renderTable("overall", "総合トップ10", data.overall);
    renderTable("stage", `${stageName} トップ10`, data[`stage${stageNumber}`]);

    if (data.myRanks?.overall) {
        document.getElementById("myRankOverall").textContent =
            `あなたの総合順位: ${data.myRanks.overall.rank}位 (スコア: ${data.myRanks.overall.score})`;
    }
    if (data.myRanks?.[`stage${stageNumber}`]) {
        const r = data.myRanks[`stage${stageNumber}`];
        document.getElementById("myRankStage").textContent =
            `あなたのステージ順位: ${r.rank}位 (スコア: ${r.score})`;
    }
}

fetchRanking();
</script>

</body>
</html>
