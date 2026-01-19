<?php
require_once 'db_config.php';

if ($_SERVER["REQUEST_METHOD"] === "POST") {
  $username = trim($_POST['username']);
  $password = trim($_POST['password']);

  if (empty($username) || empty($password)) {
    echo "<script>alert('すべての項目を入力してください');history.back();</script>";
    exit;
  }

  // 同名ユーザー確認
  $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
  $stmt->execute([$username]);
  $existing = $stmt->fetch();

  if ($existing) {
    echo "<script>alert('このユーザー名はすでに使われています');history.back();</script>";
    exit;
  }

  // パスワードハッシュ化（安全）
  $hashed = hash('sha256', $password);

  // DB登録
  $stmt = $pdo->prepare("INSERT INTO users (username, password) VALUES (?, ?)");
  $stmt->execute([$username, $hashed]);

  echo "<script>alert('登録が完了しました！ログインしてください。');window.location.href='login.html';</script>";
}
?>
