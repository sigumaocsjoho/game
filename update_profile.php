<?php
session_start();
if (!isset($_SESSION['user'])) {
    header("Location: login.html");
    exit;
}
$username = $_SESSION['user'];

require "db_config.php";

// ニックネーム更新
$nickname = $_POST['nickname'] ?? '';

// アイコン更新処理
$icon_path = null;
if(isset($_FILES['icon']) && $_FILES['icon']['error'] === UPLOAD_ERR_OK){
    $upload_dir = "icon/";
    if(!is_dir($upload_dir)) mkdir($upload_dir, 0777, true);
    
    $tmp_name = $_FILES['icon']['tmp_name'];
    $ext = pathinfo($_FILES['icon']['name'], PATHINFO_EXTENSION);
    $filename = "icon_".time()."_".rand(1000,9999).".".$ext;
    $dest = $upload_dir . $filename;
    if(move_uploaded_file($tmp_name, $dest)){
        $icon_path = $dest;
    }
}

// DB更新
if($icon_path){
    $stmt = $pdo->prepare("UPDATE users SET nickname=?, icon=? WHERE username=?");
    $stmt->execute([$nickname, $icon_path, $username]);
} else {
    $stmt = $pdo->prepare("UPDATE users SET nickname=? WHERE username=?");
    $stmt->execute([$nickname, $username]);
}

// 更新完了後、プロフィールページへリダイレクト
header("Location: profile.html");
exit;
?>
