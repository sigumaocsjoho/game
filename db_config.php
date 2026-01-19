<?php
$dsn = 'mysql:host=maglev.proxy.rlwy.net;dbname=railway;port=18346;charset=utf8mb4';
$user = 'root';
$pass = 'TCYxGMGvhaPftphOaiJOAtMtbSYHePCa';

try {
    $pdo = new PDO($dsn, $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "DB接続成功";
} catch (PDOException $e) {
    exit('DB接続エラー: ' . $e->getMessage());
}
?>
