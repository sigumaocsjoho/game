<?php
header("Content-Type: application/json");

try {
    $dsn = "mysql:host=" . getenv("DB_HOST") .
           ";port=" . getenv("DB_PORT") .
           ";dbname=" . getenv("DB_NAME") .
           ";charset=utf8mb4";

    $pdo = new PDO(
        $dsn,
        getenv("DB_USER"),
        getenv("DB_PASS"),
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "error" => "DB接続失敗",
        "detail" => $e->getMessage() // ← デバッグ用（後で消してOK）
    ]);
    exit;
}
