<?php
try {
    $dsn = "mysql:host=" . getenv('DB_HOST')
         . ";port=" . getenv('DB_PORT')
         . ";dbname=" . getenv('DB_NAME')
         . ";charset=utf8mb4";

    $pdo = new PDO(
        $dsn,
        getenv('DB_USER'),
        getenv('DB_PASS'),
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

} catch (PDOException $e) {
    exit('DB接続エラー: ' . $e->getMessage());
}
