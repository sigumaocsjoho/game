// item.js

// itembox.js
export class ItemBox {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 150;
    this.active = true;

    // ★ 画像追加
    this.img = new Image();
    this.img.src = "item_icon/kami.png"; // ← 好きな画像パス
  }

  checkCollision(obj) {
    if (!this.active) return false;

    return (
      obj.x < this.x + this.size &&
      obj.x + obj.size > this.x &&
      obj.y < this.y + this.size &&
      obj.y + obj.size > this.y
    );
  }

  draw(ctx) {
    if (!this.active) return;

    if (this.img.complete) {
      ctx.drawImage(
        this.img,
        this.x,
        this.y,
        this.size,
        this.size
      );
    } else {
      // 画像未ロード時の保険
      ctx.fillStyle = "#888";
      ctx.fillRect(this.x, this.y, this.size, this.size);
    }
  }
}



// --- ランダム効果 ---
export function getRandomEffect() {
    const effects = [
        {
            name: "スコア +1000",
            icon: "item_icon/scoreup.jpeg",
            duration: 5, // 表示時間
            apply(game) {
                game.score += 1000; // 直接参照オブジェクトを更新
            }
        },
{
    name: "クレーン速度UP（5秒）",
    icon: "item_icon/speadup.jpeg",
    duration: 10,
    apply(game) {
        const boost = 10;

        // 速度アップ
        game.craneSpeed += boost;

        // 外側変数へ反映する関数を登録
        if (typeof game.syncCraneSpeed === "function") {
            game.syncCraneSpeed(game.craneSpeed);
        }

        // 時間経過後に元の速度へ戻す
        setTimeout(() => {
            game.craneSpeed -= boost;

            // 戻した後も外側へ反映
            if (typeof game.syncCraneSpeed === "function") {
                game.syncCraneSpeed(game.craneSpeed);
            }

        }, this.duration * 1000);
    }
}
,
        {
            name: "残り時間 +15秒",
            icon: "item_icon/timeup.jpg",
            duration: 5,
            apply(game) {
                game.remainingTime += 15;
            }
        },
        {
            name: "一時レア化（10秒）",
            icon: "item_icon/ssr.jpg",
            duration: 10,
            apply(game) {
                game.badges.forEach(b => b._backupRare = b.isRare);
                game.badges.forEach(b => b.isRare = true);
                setTimeout(() => {
                    game.badges.forEach(b => b.isRare = b._backupRare);
                }, 10000);
            }
        }
    ];

    return effects[Math.floor(Math.random() * effects.length)];
}
