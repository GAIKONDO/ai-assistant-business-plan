# メタデータ生成の具体例

## 例1: 概要ページ（overview）

### 入力データ
```typescript
{
  id: "page-1703123456789",
  pageNumber: 1,
  title: "AIファーストカンパニーとは",
  content: "<p>AIファーストカンパニーとは、アルゴリズムとネットワークを中核とした組織です。</p>",
  createdAt: "2024-01-15T10:30:00.000Z",
  subMenuId: "overview",
  totalPages: 10
}
```

### 生成されるメタデータ
```typescript
{
  id: "page-1703123456789",
  pageNumber: 1,
  title: "AIファーストカンパニーとは",
  content: "<p>AIファーストカンパニーとは、アルゴリズムとネットワークを中核とした組織です。</p>",
  createdAt: "2024-01-15T10:30:00.000Z",
  
  // 自動生成されたメタデータ
  tags: [
    "overview",           // サブメニューID
    "text",               // コンテンツタイプ
    "ai",                 // キーワードから抽出
    "business",           // キーワードから抽出
    "アルゴリズム",       // キーワードから抽出
    "ネットワーク"        // キーワードから抽出
  ],
  contentType: "text",   // テキスト中心のコンテンツ
  semanticCategory: "overview-overview",  // 概要セクションの概要
  keywords: [
    "aiファーストカンパニー",
    "アルゴリズム",
    "ネットワーク",
    "組織",
    "中核"
  ],
  sectionType: "introduction",  // 最初のページなので導入
  importance: "high"     // 最初のページなので重要度が高い
}
```

## 例2: Mermaid図を含むページ

### 入力データ
```typescript
{
  id: "page-1703123456790",
  pageNumber: 2,
  title: "事業モデルの構造",
  content: `
    <div class="mermaid-diagram-container">
      <div class="mermaid" data-mermaid-diagram="business-model">
        graph TB
          A[データ] --> B[アルゴリズム]
          B --> C[サービス]
          C --> D[利用]
          D --> A
      </div>
    </div>
  `,
  createdAt: "2024-01-15T10:35:00.000Z",
  subMenuId: "business-model",
  totalPages: 10
}
```

### 生成されるメタデータ
```typescript
{
  id: "page-1703123456790",
  pageNumber: 2,
  title: "事業モデルの構造",
  content: "...",
  createdAt: "2024-01-15T10:35:00.000Z",
  
  // 自動生成されたメタデータ
  tags: [
    "business-model",     // サブメニューID
    "diagram",            // Mermaid図が検出されたため
    "事業モデル",         // キーワードから抽出
    "構造",               // キーワードから抽出
    "データ",             // キーワードから抽出
    "アルゴリズム"        // キーワードから抽出
  ],
  contentType: "diagram",  // 図表中心のコンテンツ
  semanticCategory: "business-model-planning",  // 事業モデルの計画
  keywords: [
    "事業モデル",
    "構造",
    "データ",
    "アルゴリズム",
    "サービス",
    "利用"
  ],
  sectionType: "main-content",  // 中間のページなのでメインコンテンツ
  importance: "medium"    // 中間の重要度
}
```

## 例3: 表を含むページ

### 入力データ
```typescript
{
  id: "page-1703123456791",
  pageNumber: 5,
  title: "市場規模の比較",
  content: `
    <table>
      <tr>
        <th>市場</th>
        <th>規模（億円）</th>
      </tr>
      <tr>
        <td>国内市場</td>
        <td>1,000</td>
      </tr>
      <tr>
        <td>海外市場</td>
        <td>5,000</td>
      </tr>
    </table>
  `,
  createdAt: "2024-01-15T11:00:00.000Z",
  subMenuId: "market-size",
  totalPages: 10
}
```

### 生成されるメタデータ
```typescript
{
  id: "page-1703123456791",
  pageNumber: 5,
  title: "市場規模の比較",
  content: "...",
  createdAt: "2024-01-15T11:00:00.000Z",
  
  // 自動生成されたメタデータ
  tags: [
    "market-size",        // サブメニューID
    "comparison",         // 比較表が検出されたため
    "市場",               // キーワードから抽出
    "規模",               // キーワードから抽出
    "比較"                // キーワードから抽出
  ],
  contentType: "comparison",  // 比較表として検出
  semanticCategory: "market-analysis-market",  // 市場分析の市場
  keywords: [
    "市場規模",
    "比較",
    "国内市場",
    "海外市場",
    "億円"
  ],
  sectionType: "main-content",  // 中間のページなのでメインコンテンツ
  importance: "medium"    // 中間の重要度
}
```

## 例4: リスト形式のページ

### 入力データ
```typescript
{
  id: "page-1703123456792",
  pageNumber: 8,
  title: "主な機能一覧",
  content: `
    <ul>
      <li>機能1: データ分析</li>
      <li>機能2: レポート生成</li>
      <li>機能3: 自動化</li>
      <li>機能4: ダッシュボード</li>
    </ul>
  `,
  createdAt: "2024-01-15T11:30:00.000Z",
  subMenuId: "features",
  totalPages: 10
}
```

### 生成されるメタデータ
```typescript
{
  id: "page-1703123456792",
  pageNumber: 8,
  title: "主な機能一覧",
  content: "...",
  createdAt: "2024-01-15T11:30:00.000Z",
  
  // 自動生成されたメタデータ
  tags: [
    "features",           // サブメニューID
    "list",               // リスト形式が検出されたため
    "機能",               // キーワードから抽出
    "一覧",               // キーワードから抽出
    "technology"          // 技術関連のキーワード
  ],
  contentType: "list",   // リスト形式のコンテンツ
  semanticCategory: "product-features-technical",  // 製品機能の技術
  keywords: [
    "機能",
    "一覧",
    "データ分析",
    "レポート生成",
    "自動化",
    "ダッシュボード"
  ],
  sectionType: "main-content",  // 中間のページなのでメインコンテンツ
  importance: "medium"    // 中間の重要度
}
```

## 例5: 最後のページ（結論）

### 入力データ
```typescript
{
  id: "page-1703123456793",
  pageNumber: 10,
  title: "まとめ",
  content: "<p>本計画により、持続的な成長を実現します。</p>",
  createdAt: "2024-01-15T12:00:00.000Z",
  subMenuId: "overview",
  totalPages: 10
}
```

### 生成されるメタデータ
```typescript
{
  id: "page-1703123456793",
  pageNumber: 10,
  title: "まとめ",
  content: "...",
  createdAt: "2024-01-15T12:00:00.000Z",
  
  // 自動生成されたメタデータ
  tags: [
    "overview",           // サブメニューID
    "text",               // テキスト中心
    "まとめ",             // キーワードから抽出
    "成長",               // キーワードから抽出
    "計画"                // キーワードから抽出
  ],
  contentType: "text",   // テキスト中心のコンテンツ
  semanticCategory: "overview-overview",  // 概要セクション
  keywords: [
    "まとめ",
    "計画",
    "成長",
    "実現"
  ],
  sectionType: "conclusion",  // 最後のページなので結論
  importance: "high"     // まとめなので重要度が高い
}
```

## メタデータ生成のロジック

### 1. コンテンツタイプの判定
- `mermaid`を含む → `diagram`
- `<table>`を含む → `table`
- `<ul>`または`<ol>`が3つ以上 → `list`
- 「比較」「vs」「対比」を含む → `comparison`
- 「プロセス」「フロー」「手順」を含む → `process-flow`
- 複数のタイプを含む → `mixed`
- それ以外 → `text`

### 2. セマンティックカテゴリの判定
- サブメニューIDに基づく基本カテゴリ
- コンテンツに基づく詳細カテゴリ
- 例: `overview` + 「概要」→ `overview-overview`

### 3. キーワード抽出
- HTMLタグを除去してテキストを抽出
- ストップワードを除外
- 出現頻度の高い単語を上位10個抽出

### 4. セクションタイプの判定
- ページ番号が0 → `introduction`
- ページ番号が最後 → `conclusion`
- コンテンツに「まとめ」「結論」を含む → `summary`
- コンテンツに「付録」「参考」を含む → `appendix`
- それ以外 → `main-content`

### 5. 重要度の判定
- ページ番号が0 → `high`
- コンテンツに「重要」「核心」を含む → `high`
- コンテンツに「付録」「参考」を含む → `low`
- それ以外 → `medium`

## 実際の確認方法

1. ブラウザの開発者ツール（F12）を開く
2. コンソールタブを選択
3. ページを作成または更新すると、以下のようなログが表示されます：

```
📝 ページ作成（会社計画） - 生成されたメタデータ: {
  pageId: "page-1703123456789",
  title: "AIファーストカンパニーとは",
  metadata: {
    tags: ["overview", "text", "ai", "business", ...],
    contentType: "text",
    semanticCategory: "overview-overview",
    keywords: ["aiファーストカンパニー", "アルゴリズム", ...],
    sectionType: "introduction",
    importance: "high"
  }
}
```

4. ページ順序管理画面で📊ボタンをクリックすると、メタデータが視覚的に表示されます

