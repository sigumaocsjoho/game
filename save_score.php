<?php
session_start();
require "db_config.php";

header("Content-Type: application/json; charset=utf-8");

// JSON データを取得
$input = json_decode(file_get_contents('php://input'), true);

if (!isset($_SESSION['user_id']) || !isset($input['score']) || !isset($input['stage'])) {
    echo json_encode(['success' => false, 'msg' => 'invalid request']);
    exit;
}

$user_id = $_SESSION['user_id'];
$score   = intval($input['score']);
$stage   = $input['stage'];  

$_SESSION['last_stage'] = $stage;   // ← 遊んだステージを保存
$_SESSION['last_score'] = $score;

try {
    // ★ ステージも保存する
    $stmt = $pdo->prepare("INSERT INTO user_scores (user_id, score, stage) VALUES (?, ?, ?)");
    $stmt->execute([$user_id, $score, $stage]);

    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'msg' => $e->getMessage()]);
}
?>
