<?php
session_start();
require "db_config.php";

if (!isset($_SESSION['user_id'])) {
    header('HTTP/1.1 401 Unauthorized');
    exit;
}

$user_id = $_SESSION['user_id'];

// ▼ユーザー基本情報
$stmt = $pdo->prepare("SELECT nickname, icon, created_at FROM users WHERE id = ?");
$stmt->execute([$user_id]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

// ▼ステージ別ベスト（stage1〜stage6）
$stageBest = [];
for ($i = 1; $i <= 6; $i++) {
    $stmt = $pdo->prepare("SELECT MAX(score) AS best_score FROM user_scores WHERE user_id = ? AND stage = ?");
    $stmt->execute([$user_id, "stage$i"]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $stageBest["stage$i"] = $row['best_score'] ?? 0;
}

// ▼全体最高スコア
$best_score_all = max($stageBest);

// ▼総プレイ回数
$stmt = $pdo->prepare("SELECT COUNT(*) AS total_play FROM user_scores WHERE user_id = ?");
$stmt->execute([$user_id]);
$total_play = $stmt->fetch(PDO::FETCH_ASSOC)['total_play'] ?? 0;

// ▼取得バッジ
$stmt = $pdo->prepare("SELECT COUNT(*) AS total, SUM(is_rare) AS rare_count FROM user_badges WHERE user_id = ?");
$stmt->execute([$user_id]);
$badges = $stmt->fetch(PDO::FETCH_ASSOC);

// ▼最近のスコア履歴
$stmt = $pdo->prepare("SELECT score, stage, achieved_at FROM user_scores WHERE user_id = ? ORDER BY achieved_at DESC LIMIT 10");
$stmt->execute([$user_id]);
$history = $stmt->fetchAll(PDO::FETCH_ASSOC);

// ▼ユーザーアチーブメント
$stmt = $pdo->prepare("
    SELECT a.name, a.description, a.icon, a.is_rare, ua.achieved_at 
    FROM achievements a
    LEFT JOIN user_achievements ua 
    ON a.id = ua.achievement_id AND ua.user_id = ?
");
$stmt->execute([$user_id]);
$achievements = $stmt->fetchAll(PDO::FETCH_ASSOC);

// JSON返却
echo json_encode([
    'user' => $user,
    'stage_best' => $stageBest,
    'best_score_all' => $best_score_all,
    'total_play' => $total_play,
    'badges' => $badges,
    'history' => $history,
    'achievements' => $achievements
], JSON_UNESCAPED_UNICODE);
