<?php
session_start();
require "db_config.php";

if (!isset($_SESSION['user_id'])) {
  http_response_code(403);
  exit;
}

$user_id = $_SESSION['user_id'];

$stmt = $pdo->prepare(
  "UPDATE users SET secret_stage_unlocked = 1 WHERE id = ?"
);
$stmt->execute([$user_id]);

$_SESSION['secret_stage_unlocked'] = 1;
$_SESSION['secret_stage_first_view'] = 1;
