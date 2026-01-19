<?php
header('Content-Type: application/json');
require "db_config.php";

// JSON 受信
$input = json_decode(file_get_contents('php://input'), true);
if (!isset($input['src'])) {
    echo json_encode(['success' => false, 'msg' => 'src missing']);
    exit;
}

$src = $input['src'];

try {
    $stmt = $pdo->prepare("SELECT score FROM badges WHERE badge_src = ?");
    $stmt->execute([$src]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($row) {
        echo json_encode(['success' => true, 'score' => (int)$row['score']]);
    } else {
        echo json_encode(['success' => false, 'msg' => 'Badge not found']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'msg' => $e->getMessage()]);
}
