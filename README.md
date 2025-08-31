# Dino RPG Runner 🦖✨

<div align="center">
  <img src="https/placehold.co/600x300?text=Gameplay+Screenshot" alt="ゲームプレイのスクリーンショット">
</div>

<p align="center">
  <strong>Chromeの恐竜ゲームにRPG要素を加えた、シンプルなJavaScript製エンドレスランナーゲーム！</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5">
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
</p>

## 🎮 ゲームの概要 (About The Game)

`Dino RPG Runner`は、おなじみの恐竜ランゲームをベースに、コイン収集や自動戦闘、商人との取引といったRPG要素を取り入れたオリジナルゲームです。障害物をジャンプで避けながら、どこまでスコアを伸ばせるかに挑戦します。

一定のスコアに到達すると、個性的な商人たちがランダムで登場し、集めたコインを使って冒険を有利に進めるアイテムを購入できます。

## ✨ 主な機能 (Features)

* **簡単な操作**: スペースキー（または画面タップ）でジャンプするだけのシンプル操作。
* **RPG要素**: 敵との自動戦闘、コイン収集、スコアシステム。
* **ランダムな商人**: スコアが一定に達すると2種類の商人がランダムで登場。
* **パワーアップアイテム**: 障害物を1度だけ防ぐ「シールド」や、敵を倒した時のスコアが倍になる「スコアブースト」など。
* **プログレッシブな難易度**: スコアが上がるにつれて、ゲームのスピードが少しずつ上昇。
* **BGMとミュート機能**: ゲームを盛り上げるBGMと、ON/OFF切り替え機能。

## 遊び方 (How To Play)

1.  **スタート**: `スタート`ボタンをクリックするか、スペースキーを押してゲームを開始します。
2.  **ジャンプ**: スペースキーまたは画面をタップして、障害物を飛び越えます。
3.  **目的**:
    * 茶色い岩（障害物）を避けてください。当たるとゲームオーバーです。
    * 黄色いコインを集めてください。
    * 赤い敵はキャラクターが自動で攻撃して倒します。
4.  **商人との取引**:
    * スコアが1000点に到達するごとに商人が現れます。
    * コインを使ってアイテムを購入し、ゲームを有利に進めましょう。

## 🛠️ 使用技術 (Technologies Used)

* **HTML5**: ゲームの基本構造
* **CSS3 (Tailwind CSS)**: UIとスタイリング
* **JavaScript (ES6+)**: ゲームのロジック全体

## 🚀 セットアップ方法 (Setup)

このゲームをローカル環境で動かすには、以下の手順に従ってください。

1.  このリポジトリをクローンします。
    ```sh
    git clone [https://github.com/YOUR_USERNAME/dino-rpg-runner.git](https://github.com/YOUR_USERNAME/dino-rpg-runner.git)
    ```
2.  クローンしたディレクトリに移動します。
    ```sh
    cd dino-rpg-runner
    ```
3.  `index.html` ファイルをブラウザで開きます。

**注意:** ゲームを正しく表示・動作させるためには、以下のファイルが `index.html` と同じ階層にある必要があります。
* `game.js`
* `dino_player.png` （プレイヤー画像）
* `merchant1.png` （商人1の画像）
* `merchant2.png` （商人2の画像）
* `background_music.mp3` （BGMファイル）

## 🤝 作者 (Author)

* **[ここにあなたの名前またはGitHubユーザー名]** - [https://github.com/YOUR_USERNAME](https://github.com/YOUR_USERNAME)

## 📜 ライセンス (License)

このプロジェクトは [MITライセンス](https://opensource.org/licenses/MIT) の下で公開されています。
