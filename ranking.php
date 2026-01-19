<?php
session_start();
require "db_config.php";

header('Content-Type: application/json; charset=utf-8');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["error" => "not_logged_in"]);
    exit;
}

$user_id = $_SESSION['user_id'];

/*
---------------------------------------
  ▼ stage パラメータの統一処理
     "stage3" → 3
     "3"      → 3
---------------------------------------
*/
$stageParam = $_GET['stage'] ?? null;
$selectedStage = null;

if ($stageParam !== null) {
    if (preg_match('/stage(\d+)/', $stageParam, $m)) {
        $selectedStage = intval($m[1]);
    } elseif (ctype_digit($stageParam)) {
        $selectedStage = intval($stageParam);
    }
}

/*
---------------------------------------
  ▼ ランキング取得
---------------------------------------
*/
function getRanking($pdo, $stage = null) {
    if ($stage === null) {
        // 総合ランキング
        $sql = "
            SELECT u.username AS user_name, s.max_score AS score
            FROM (
                SELECT user_id, MAX(score) AS max_score
                FROM user_scores
                GROUP BY user_id
            ) AS s
            JOIN users u ON u.id = s.user_id
            ORDER BY s.max_score DESC
            LIMIT 50
        ";
        $stmt = $pdo->query($sql);
    } else {
        // ステージ別（stage1〜stage6 の文字列で管理）
        $sql = "
            SELECT u.username AS user_name, s.max_score AS score
            FROM (
                SELECT user_id, MAX(score) AS max_score
                FROM user_scores
                WHERE stage = ?
                GROUP BY user_id
            ) AS s
            JOIN users u ON u.id = s.user_id
            ORDER BY s.max_score DESC
            LIMIT 50
        ";
        $stmt = $pdo->prepare($sql);

        $stageValue = "stage{$stage}";
        $stmt->execute([$stageValue]);
    }

    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

/*
---------------------------------------
  ▼ 自分の順位取得
---------------------------------------
*/
function getMyRank($pdo, $user_id, $stage = null) {
    if ($stage === null) {
        // 総合
        $stmt = $pdo->prepare("SELECT MAX(score) FROM user_scores WHERE user_id = ?");
        $stmt->execute([$user_id]);
        $score = $stmt->fetchColumn();
        if ($score === null) return null;

        $stmt = $pdo->prepare("SELECT COUNT(*) + 1 FROM (
            SELECT user_id, MAX(score) AS max_score
            FROM user_scores
            GROUP BY user_id
        ) AS t WHERE t.max_score > ?");
        $stmt->execute([$score]);
        $rank = $stmt->fetchColumn();

    } else {
        // ステージ別
        $stageValue = "stage{$stage}";
        $stmt = $pdo->prepare("SELECT MAX(score) FROM user_scores WHERE user_id = ? AND stage = ?");
        $stmt->execute([$user_id, $stageValue]);
        $score = $stmt->fetchColumn();
        if ($score === null) return null;

        $stmt = $pdo->prepare("
            SELECT COUNT(*) + 1 FROM (
            SELECT user_id, MAX(score) AS max_score
            FROM user_scores
            WHERE stage = ?
            GROUP BY user_id
            ) AS t
            WHERE t.max_score > ?
        ");
        $stmt->execute([$stageValue, $score]);
        $rank = $stmt->fetchColumn();

    }

    return [
        "rank" => (int)$rank,
        "score" => (int)$score
    ];
}

/*
---------------------------------------
  ▼ JSON 作成
---------------------------------------
*/
$response = [
    "selectedStage" => $selectedStage,   // ← result_rank.php の初期表示用
    "overall" => getRanking($pdo, null),
    "myRanks" => [
        "overall" => getMyRank($pdo, $user_id, null)
    ]
];

// 各ステージランキング（1～6）
for ($stage = 1; $stage <= 6; $stage++) {
    $response["stage$stage"] = getRanking($pdo, $stage);
    $response["myRanks"]["stage$stage"] = getMyRank($pdo, $user_id, $stage);
}

echo json_encode($response, JSON_UNESCAPED_UNICODE);
?>
