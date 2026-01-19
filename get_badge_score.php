<?php
// get_badge_score.php
header('Content-Type: application/json; charset=utf-8');
require 'db_config.php';

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['src'])) {
    echo json_encode(['success' => false, 'msg' => 'No badge src']);
    exit;
}

$badge_src = $input['src'];

try {
    $stmt = $pdo->prepare("SELECT score FROM badges WHERE badge_src = ?");
    $stmt->execute([$badge_src]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($row) {
        echo json_encode(['success' => true, 'score' => (int)$row['score']]);
    } else {
        echo json_encode(['success' => false, 'score' => 0]);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'msg' => $e->getMessage()]);
}
