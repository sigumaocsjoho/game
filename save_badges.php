<?php
session_start(); // セッション開始

// 1. ログインチェック
if (!isset($_SESSION['user_id'])) {
    // 未ログインの場合は403を返す
    http_response_code(403);
    exit("Not logged in");
}

$user_id = $_SESSION['user_id']; // ログイン中のユーザーID取得

// 2. JSON形式で送られてきたデータを取得
$data = json_decode(file_get_contents("php://input"), true);
if (!$data) {
    exit("No data"); // データがなければ処理を終了
}

// 3. データベース接続
require "db_config.php";  // db_config.php 内で $pdo (PDO) を用意しておく

// 4. バッジ情報を1つずつ処理
foreach ($data as $badge) {
    $src = $badge["src"];                     // バッジ画像のパス
    $isRare = !empty($badge["isRare"]) ? 1 : 0; // レアかどうかを1/0に変換

    // 4-1. 既に取得済みかチェック
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM user_badges WHERE user_id=? AND badge_src=?");
    $stmt->execute([$user_id, $src]);
    
    if ($stmt->fetchColumn() > 0) {
        // 既に登録済みならスキップ
        continue;
    }

    // 4-2. 新規バッジを登録
    $stmt = $pdo->prepare(
        "INSERT INTO user_badges (user_id, badge_src, is_rare) VALUES (?, ?, ?)"
    );
    $stmt->execute([$user_id, $src, $isRare]);
}

// 5. 終了レスポンス
echo "saved";
