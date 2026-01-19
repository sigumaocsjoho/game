<?php
session_start();
require_once 'db_config.php';

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $username = $_POST['username'];
    $password = $_POST['password'];

    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user && hash('sha256', $password) === $user['password']) {
        // セッションにユーザー情報をセット
        $_SESSION['user_id'] = $user['id'];      // ←collection.php 用
        $_SESSION['user'] = $user['username'];  // ←表示用

        header("Location: home.php");
        exit;
    } else {
        echo "<script>alert('ユーザー名またはパスワードが違います');history.back();</script>";
    }
}
?>
