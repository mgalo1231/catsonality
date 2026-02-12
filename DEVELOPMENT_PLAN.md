# Catsonality 開発計画

## プロジェクト概要

Catsonalityは猫の性格診断サイトです。ユーザーが15の質問に答えることで、8種類の猫性格タイプのうち1つの診断結果を得られます。

### 完成済み機能
- ✅ トップページとナビゲーション
- ✅ 15問テストページ（5ページ + プロフィールページ）
- ✅ 結果ページ（レーダーチャート、次元分析、詳細説明）
- ✅ シェア画像生成（html2canvas + QRコード）
- ✅ GitHub Pages デプロイ：https://mgalo1231.github.io/catsonality/

### 開発予定機能
- 🔲 ユーザー認証システム（登録/ログイン）
- 🔲 コミュニティ機能（投稿/いいね/コメント）
- 🔲 マイページ
- 🔲 同タイプユーザー表示

---

## 技術構成

### バックエンドサービス：Supabase
- **認証**：Email/Password ログイン
- **データベース**：PostgreSQL
- **ストレージ**：ユーザーアバター、シェア画像
- **リアルタイム**：新規投稿通知（オプション）

### フロントエンド
- 静的 HTML/CSS/JavaScript
- Supabase JS SDK
- GitHub Pages でホスティング

---

## データベース設計

### 1. profiles（ユーザープロフィール）
| フィールド | タイプ | 説明 |
|-----------|--------|------|
| id | UUID | 主キー、auth.users と連携 |
| username | TEXT | ユーザー名（ユニーク、デフォルトは猫の名前） |
| avatar_url | TEXT | アバターURL |
| primary_cat_type | TEXT | 表示する猫タイプラベル |
| created_at | TIMESTAMP | 登録日時 |
| updated_at | TIMESTAMP | 更新日時 |

### 2. results（診断結果）
| フィールド | タイプ | 説明 |
|-----------|--------|------|
| id | UUID | 主キー |
| user_id | UUID | 外部キー → profiles.id（匿名時はnull） |
| session_id | TEXT | 匿名ユーザーのセッション識別子 |
| cat_type | TEXT | 診断結果タイプ |
| cat_name | TEXT | 猫の名前 |
| cat_avatar | TEXT | 猫のアバター |
| scores | JSONB | 5次元スコア |
| created_at | TIMESTAMP | 診断日時 |

### 3. posts（投稿）
| フィールド | タイプ | 説明 |
|-----------|--------|------|
| id | UUID | 主キー |
| user_id | UUID | 外部キー → profiles.id |
| result_id | UUID | 外部キー → results.id |
| caption | TEXT | 投稿内容（編集可能） |
| share_image_url | TEXT | シェア画像URL |
| likes_count | INTEGER | いいね数 |
| comments_count | INTEGER | コメント数 |
| created_at | TIMESTAMP | 投稿日時 |
| updated_at | TIMESTAMP | 編集日時 |

### 4. likes（いいね）
| フィールド | タイプ | 説明 |
|-----------|--------|------|
| id | UUID | 主キー |
| post_id | UUID | 外部キー → posts.id |
| user_id | UUID | 外部キー → profiles.id |
| created_at | TIMESTAMP | いいね日時 |

### 5. comments（コメント）
| フィールド | タイプ | 説明 |
|-----------|--------|------|
| id | UUID | 主キー |
| post_id | UUID | 外部キー → posts.id |
| user_id | UUID | 外部キー → profiles.id |
| parent_id | UUID | 外部キー → comments.id（返信用） |
| content | TEXT | コメント内容 |
| likes_count | INTEGER | コメントいいね数 |
| created_at | TIMESTAMP | コメント日時 |

### 6. comment_likes（コメントいいね）
| フィールド | タイプ | 説明 |
|-----------|--------|------|
| id | UUID | 主キー |
| comment_id | UUID | 外部キー → comments.id |
| user_id | UUID | 外部キー → profiles.id |
| created_at | TIMESTAMP | いいね日時 |

---

## ページ構成

### 新規作成ページ
| ファイル | 機能 |
|----------|------|
| community.html | コミュニティ一覧（ウォーターフォール） |
| mypage.html | マイページ |

### 修正が必要なページ
| ファイル | 修正内容 |
|----------|---------|
| index.html | コミュニティプレビュー追加 |
| result.html | 「コミュニティに投稿」ボタン追加、同タイプユーザー表示 |
| login.html | 実際のログイン/登録機能 |
| 全ページ | ナビゲーション統一 |

### JS ファイル構成
| ファイル | 機能 |
|----------|------|
| js/supabase.js | Supabase 初期化 |
| js/auth.js | 認証関連 |
| js/community.js | コミュニティ機能 |
| js/mypage.js | マイページ機能 |

### CSS ファイル構成
| ファイル | 機能 |
|----------|------|
| css/community.css | コミュニティページスタイル |
| css/mypage.css | マイページスタイル |

---

## 権限制御

| 機能 | 未ログイン | ログイン済み |
|------|-----------|-------------|
| コミュニティ閲覧 | ✅ | ✅ |
| 投稿詳細閲覧 | ✅ | ✅ |
| コメント閲覧 | ✅ | ✅ |
| 投稿にいいね | ❌ ログイン促進 | ✅ |
| コメントにいいね | ❌ ログイン促進 | ✅ |
| コメント投稿 | ❌ ログイン促進 | ✅ |
| 投稿作成 | ❌ ログイン促進 | ✅ |
| 自分の投稿編集/削除 | - | ✅ |
| 診断結果保存 | localStorage | データベース |

---

## UI デザイン要点

### コミュニティ一覧ページ
- ウォーターフォールレイアウト（PC 4列 → タブレット 3列 → スマホ 2列）
- カード：画像 + タイトル + 作者アバター/ニックネーム + タイプラベル + いいね数
- フィルター：人気 / 新着 / タイプ別

### 投稿詳細
- PC：モーダル、左画像・右コンテンツ
- スマホ：フルスクリーン、上画像・下コンテンツ
- コメント欄は返信対応

### ユーザーラベル
- ニックネーム横に猫タイプラベル表示（例：🐱探検家猫）
- 投稿、コメント時に表示

### 同タイプユーザー表示
- 結果ページ下部に同タイプユーザーのアバターをスクロール表示
- 無限ループスクロール、ホバーで停止
- クリックでその投稿へ遷移

---

## 開発順序

### Phase 1：Supabase 基本設定
1. Supabase プロジェクト作成
2. SQL でテーブル作成
3. Row Level Security (RLS) 設定
4. js/supabase.js 初期化ファイル作成

### Phase 2：ユーザー認証
1. login.html で実際のログイン/登録実装
2. js/auth.js 作成
3. ナビゲーション統一（ログイン状態表示）
4. 診断結果のデータベース保存テスト

### Phase 3：コミュニティ機能
1. community.html と css/community.css 作成
2. 投稿一覧（ウォーターフォール）実装
3. 投稿詳細モーダル実装
4. いいね機能実装
5. コメント機能実装（返信対応）

### Phase 4：投稿機能
1. result.html に「コミュニティに投稿」ボタン追加
2. 投稿モーダル実装
3. シェア画像を Supabase Storage にアップロード

### Phase 5：マイページ
1. mypage.html と css/mypage.css 作成
2. ユーザープロフィール表示（編集可能）
3. 診断履歴表示
4. 投稿一覧表示（編集/削除可能）

### Phase 6：最適化と仕上げ
1. index.html にコミュニティプレビュー追加
2. result.html に同タイプユーザースクロール表示追加
3. パフォーマンス最適化
4. テストと修正

---

## Supabase 設定情報（記入欄）

```javascript
const SUPABASE_URL = ''; // 例: https://xxxxx.supabase.co
const SUPABASE_ANON_KEY = ''; // 例: eyJhbGciOiJS...
```

---

## Supabase SQL（テーブル作成用）

```sql
-- ユーザープロフィールテーブル
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  primary_cat_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 診断結果テーブル
CREATE TABLE results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_id TEXT,
  cat_type TEXT NOT NULL,
  cat_name TEXT,
  cat_avatar TEXT,
  scores JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 投稿テーブル
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  result_id UUID REFERENCES results(id) ON DELETE CASCADE NOT NULL,
  caption TEXT,
  share_image_url TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- いいねテーブル
CREATE TABLE likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- コメントテーブル
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- コメントいいねテーブル
CREATE TABLE comment_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- Row Level Security 有効化
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- RLS ポリシー：全員読み取り可能
CREATE POLICY "Public read" ON profiles FOR SELECT USING (true);
CREATE POLICY "Public read" ON results FOR SELECT USING (true);
CREATE POLICY "Public read" ON posts FOR SELECT USING (true);
CREATE POLICY "Public read" ON likes FOR SELECT USING (true);
CREATE POLICY "Public read" ON comments FOR SELECT USING (true);
CREATE POLICY "Public read" ON comment_likes FOR SELECT USING (true);

-- RLS ポリシー：自分のデータのみ操作可能
CREATE POLICY "Users can insert own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own" ON results FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can update own" ON results FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own" ON posts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own" ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own" ON likes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own" ON comments FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own" ON comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own" ON comment_likes FOR DELETE USING (auth.uid() = user_id);

-- いいね数・コメント数の自動更新用関数
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_post_likes_count
AFTER INSERT OR DELETE ON likes
FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_post_comments_count
AFTER INSERT OR DELETE ON comments
FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- コメントいいね数の自動更新用関数
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE comments SET likes_count = likes_count - 1 WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_comment_likes_count
AFTER INSERT OR DELETE ON comment_likes
FOR EACH ROW EXECUTE FUNCTION update_comment_likes_count();
```

---

## 参考リソース

- Supabase ドキュメント：https://supabase.com/docs
- Supabase JS SDK：https://supabase.com/docs/reference/javascript
- プロジェクトURL：https://mgalo1231.github.io/catsonality/

---

*最終更新：2026年1月30日*
