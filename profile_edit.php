<?php
session_start();
if (!isset($_SESSION['user'])) {
    header("Location: login.html");
    exit;
}
$username = htmlspecialchars($_SESSION['user'], ENT_QUOTES, 'UTF-8');

// データベース接続
require "db_config.php";

// 現在のユーザー情報取得
$stmt = $pdo->prepare("SELECT nickname, icon FROM users WHERE username=?");
$stmt->execute([$username]);
$user_data = $stmt->fetch(PDO::FETCH_ASSOC);
$nickname = $user_data['nickname'] ?? '';
$icon = $user_data['icon'] ?? 'icon/default_icon.png';
?>

<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<title>プロフィール編集</title>
<style>
body { font-family: "Segoe UI", sans-serif; background:#1b1b2f; color:#fff; text-align:center; }
.profile-icon { width:100px; height:100px; border-radius:50%; object-fit:cover; margin-bottom:10px; }
input[type="text"], input[type="file"] {
    padding:8px; font-size:16px; border-radius:5px; border:none; margin:5px;
}
button {
    padding:10px 20px; font-size:16px; border:none; border-radius:5px; cursor:pointer;
    background-color: rgba(0,0,0,0.7); color:white;
}
button:hover { background-color: rgba(255,255,255,0.9); color:black; }
</style>
</head>
<body>
<h1>プロフィール編集</h1>

<form action="update_profile.php" method="POST" enctype="multipart/form-data">
    <img src="<?php echo $icon; ?>" class="profile-icon" alt="アイコン"><br>
    <label>ニックネーム: </label><br>
    <input type="text" name="nickname" value="<?php echo htmlspecialchars($nickname); ?>"><br>
    <label>アイコン画像: </label><br>
    <input type="file" name="icon"><br><br>
    <button type="submit">保存</button>
</form>

<br>
<button onclick="window.location.href='profile.html'">キャンセル</button>
</body>
</html>
