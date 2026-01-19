<?php
session_start();
require "db_config.php";

if (!isset($_SESSION['user_id'])) {
    header('HTTP/1.1 401 Unauthorized');
    exit;
}

$user_id = $_SESSION['user_id'];

// JSON 受信
$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    echo json_encode(['success'=>false,'msg'=>'No data received']);
    exit;
}

// INSERT か UPDATE（既存ユーザーなら更新）
$stmt = $pdo->prepare("
    INSERT INTO user_stats 
    (user_id, total_play, total_play_time, best_score, best_score_normal, best_score_ice, best_score_special)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
        total_play = VALUES(total_play),
        total_play_time = VALUES(total_play_time),
        best_score = VALUES(best_score),
        best_score_normal = VALUES(best_score_normal),
        best_score_ice = VALUES(best_score_ice),
        best_score_special = VALUES(best_score_special)
");

$stmt->execute([
    $user_id,
    $data['total_play'],
    $data['total_play_time'],
    $data['best_score'],
    $data['best_score_normal'],
    $data['best_score_ice'],
    $data['best_score_special']
]);

echo json_encode(['success'=>true]);
?>
