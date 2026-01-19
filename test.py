import pygame
import random
 
# 初期設定
pygame.init()
WIDTH, HEIGHT = 1550, 800
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("イラストレ～ルセンター")
clock = pygame.time.Clock()

# 🎨 背景画像を読み込み
background_img = pygame.image.load("haikei/haikei2.jpg").convert()
background_img = pygame.transform.scale(background_img, (WIDTH, HEIGHT))  # サイズ調整

# クレーン画像（開／閉）
crane_open_img = pygame.image.load("crane/crane_open.png").convert_alpha()
crane_close_img = pygame.image.load("crane/crane_close.png").convert_alpha()
crane_open_img = pygame.transform.scale(crane_open_img, (120, 120))
crane_close_img = pygame.transform.scale(crane_close_img, (120, 120))

# 色
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
RED = (255, 0, 0)
GOLD = (255, 215, 0)
 
# クレーン設定
crane_x = WIDTH // 2
crane_y = 100
claw_y = crane_y
crane_speed = 5
claw_down_speed = 7
claw_up_speed = 5
claw_open = True
claw_anim_progress = 0
claw_anim_speed = 0.1
 
# 状態フラグ
claw_moving_down = False
claw_moving_up = False
moving_to_drop_zone = False
dropping_badge = False
returning_to_start = False
 
# 取り出し口座標
drop_zone_x = WIDTH - 80
drop_zone_y = HEIGHT - 80
 
# バッジ設定
badges = []
held_badge = None
 
# バッジ画像を読み込む（複数）
badge_images = [
    pygame.image.load("bajji/present_hanataba_flower_girl.jpg").convert_alpha(),
    pygame.image.load("bajji/present_hanataba_flower_boy.jpg").convert_alpha(),
    pygame.image.load("bajji/present_hoshii_man.jpg").convert_alpha()
]
 
# ランダムにバッジを配置
for i in range(10):
    x = random.randint(50, WIDTH - 90)
    y = random.randint(HEIGHT // 2, HEIGHT - 100)
    size = random.randint(30, 50)
    image = pygame.transform.scale(random.choice(badge_images), (size, size))
    rect = pygame.Rect(x, y, size, size)
    is_rare = random.random() < 0.2
    badges.append({
        "rect": rect,
        "image": image,
        "size": size,
        "is_rare": is_rare
    })
 
# クレーン描画
def draw_crane(x, y, claw_progress):
    pygame.draw.line(screen, BLACK, (x, 0), (x, y - 20), 5)

    if claw_progress < 0.5:
        current_img = crane_open_img
    else:
        current_img = crane_close_img

    rect = current_img.get_rect(center=(x, y))
    screen.blit(current_img, rect)

# メインループ
running = True
while running:
    clock.tick(60)

    # 🎨 背景を描画（fillの代わりに）
    screen.blit(background_img, (0, 0))
 
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

    # 入力処理（操作可能時のみ）
    keys = pygame.key.get_pressed()
    if not (claw_moving_down or claw_moving_up or moving_to_drop_zone or dropping_badge or returning_to_start):
        if keys[pygame.K_LEFT] and crane_x > 30:
            crane_x -= crane_speed
        if keys[pygame.K_RIGHT] and crane_x < WIDTH - 30:
            crane_x += crane_speed
        if keys[pygame.K_SPACE]:
            claw_open = True
            claw_moving_down = True

    # 爪アニメーション進行
    if claw_open and claw_anim_progress > 0:
        claw_anim_progress -= claw_anim_speed
    elif not claw_open and claw_anim_progress < 1:
        claw_anim_progress += claw_anim_speed
    claw_anim_progress = max(0, min(1, claw_anim_progress))
 
    if claw_moving_down:
        claw_y += claw_down_speed
        claw_rect = pygame.Rect(crane_x - 15, claw_y, 30, 20)
 
        if held_badge is None:
            for badge in badges:
                if claw_rect.colliderect(badge["rect"]):
                    claw_open = False
                    success_rate = 0.3 if badge["is_rare"] else 0.6
                    if random.random() < success_rate:
                        held_badge = badge
                        print("キャッチ成功！")
                    else:
                        print("キャッチ失敗…")
                    claw_moving_down = False
                    claw_moving_up = True
                    break
 
        if claw_y >= HEIGHT - 100 and not claw_moving_up:
            claw_open = False
            claw_moving_down = False
            claw_moving_up = True
 
    if claw_moving_up:
        claw_y -= claw_up_speed
        if held_badge:
            held_badge["rect"].x = crane_x - held_badge["size"] // 2
            held_badge["rect"].y = claw_y + 20
        if claw_y <= crane_y:
            claw_y = crane_y
            claw_moving_up = False
            if held_badge:
                moving_to_drop_zone = True
            else:
                returning_to_start = True
 
    if returning_to_start:
        if crane_x < WIDTH - 30:
            crane_x += crane_speed
        else:
            returning_to_start = False
            claw_open = True
 
    if moving_to_drop_zone:
        if crane_x < drop_zone_x:
            crane_x += crane_speed
            if held_badge:
                held_badge["rect"].x = crane_x - held_badge["size"] // 2
                held_badge["rect"].y = claw_y + 20
        else:
            moving_to_drop_zone = False
            dropping_badge = True
            claw_open = True  # ✅ 落とす前に開く
 
    if dropping_badge and held_badge:
        held_badge["rect"].y += 10
        if held_badge["rect"].y >= drop_zone_y:
            badges.remove(held_badge)
            print("バッジゲット！（取り出し口）")
            held_badge = None
            dropping_badge = False
            returning_to_start = True
 
    for badge in badges:
        offset_y = random.randint(-1, 1)
        draw_rect = badge["rect"].copy()
        draw_rect.y += offset_y
 
        if badge["is_rare"]:
            pygame.draw.rect(screen, GOLD, draw_rect.inflate(6, 6))
 
        screen.blit(badge["image"], draw_rect)
 
    pygame.draw.rect(screen, (200, 200, 200), (drop_zone_x - 20, drop_zone_y, 60, 20))
 
    draw_crane(crane_x, claw_y, claw_anim_progress)
 
    pygame.display.flip()
 
pygame.quit()
