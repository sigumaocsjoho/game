<?php
$dsn = 'mysql:host=localhost;dbname=game_login;charset=utf8mb4';
$user = 'root';
$pass = ''; // phpMyAdminで設定しているパスワードに合わせる

try {
  $pdo = new PDO($dsn, $user, $pass);
  $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
  exit('DB接続エラー: ' . $e->getMessage());
}
?>
