/**
 * モックAIサーバー
 * 多段階アクセス制御ゲートウェイのテスト用に、AIモデルのエンドポイントをモックします
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');

// 設定
const PORT = process.env.PORT || 3001;
const SIMULATE_DELAY = process.env.SIMULATE_DELAY === 'true';
const MIN_DELAY_MS = parseInt(process.env.MIN_DELAY_MS || '100');
const MAX_DELAY_MS = parseInt(process.env.MAX_DELAY_MS || '500');

// モック処理の遅延をシミュレート
const simulateProcessingDelay = () => {
  if (!SIMULATE_DELAY) return Promise.resolve();
  
  const delay = Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS + 1) + MIN_DELAY_MS);
  return new Promise(resolve => setTimeout(resolve, delay));
};

// トークン使用量を計算
const calculateTokenUsage = (input) => {
  // 簡易的な計算: 文字数÷4でトークン数を概算
  const inputText = typeof input === 'string' ? input : JSON.stringify(input);
  const inputTokens = Math.ceil(inputText.length / 4);
  const outputTokens = Math.ceil(inputTokens * 1.5); // 出力は入力の1.5倍と仮定
  
  return {
    prompt_tokens: inputTokens,
    completion_tokens: outputTokens,
    total_tokens: inputTokens + outputTokens
  };
};

// アプリケーション作成
const app = express();

// ミドルウェア
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// ルート
app.get('/', (req, res) => {
  res.json({
    message: 'モックAIサーバーAPI',
    version: '1.0.0',
    endpoints: [
      '/v1/completions',
      '/v1/images/generations'
    ]
  });
});

// モックテキスト生成API
app.post('/v1/completions', async (req, res) => {
  try {
    const { model, prompt, max_tokens, temperature } = req.body;
    
    // リクエストパラメータのバリデーション
    if (!model || !prompt) {
      return res.status(400).json({ error: { message: 'model と prompt は必須パラメータです' } });
    }

    // 処理遅延をシミュレート
    await simulateProcessingDelay();
    
    // モデルによって異なる応答を生成
    let responseText = '';
    
    if (model.includes('basic')) {
      responseText = `これは基本モデル (${model}) からの応答です。プロンプト: "${prompt.substring(0, 50)}..."`;
    } else if (model.includes('advanced')) {
      responseText = `これは高度モデル (${model}) からの詳細な応答です。あなたの質問 "${prompt.substring(0, 50)}..." について、詳細に検討しました。基本モデルよりも高品質な回答を提供します。`;
    } else {
      responseText = `未知のモデル (${model}) からの一般的な応答です。`;
    }
    
    // 使用トークンを計算
    const usage = calculateTokenUsage(prompt + responseText);
    
    // レスポンス
    return res.json({
      id: `mock-completion-${uuidv4()}`,
      object: 'completion',
      created: Math.floor(Date.now() / 1000),
      model,
      choices: [
        {
          text: responseText,
          index: 0,
          logprobs: null,
          finish_reason: 'stop'
        }
      ],
      usage
    });
    
  } catch (error) {
    console.error('テキスト生成エラー:', error);
    return res.status(500).json({ error: { message: 'サーバーエラー' } });
  }
});

// モック画像生成API
app.post('/v1/images/generations', async (req, res) => {
  try {
    const { model, prompt, n, size } = req.body;
    
    // リクエストパラメータのバリデーション
    if (!prompt) {
      return res.status(400).json({ error: { message: 'prompt は必須パラメータです' } });
    }

    // 処理遅延をシミュレート
    await simulateProcessingDelay();
    
    // 生成する画像の数
    const imageCount = n || 1;
    // 画像サイズに基づいてダミー画像URLを生成
    const imageSize = size || '512x512';
    
    // モデルによって異なるプレースホルダー画像を返す
    let placeholderType = 'basic';
    if (model && model.includes('advanced')) {
      placeholderType = 'advanced';
    }
    
    // 使用トークンを計算
    const usage = calculateTokenUsage(prompt);
    
    // 画像データの生成
    const images = Array(imageCount).fill().map(() => ({
      url: `https://placehold.co/${imageSize}/webp?text=Mock+${placeholderType}+AI+Image`
    }));
    
    // レスポンス
    return res.json({
      created: Math.floor(Date.now() / 1000),
      data: images,
      usage
    });
    
  } catch (error) {
    console.error('画像生成エラー:', error);
    return res.status(500).json({ error: { message: 'サーバーエラー' } });
  }
});

// エラーハンドリング
app.use((req, res) => {
  res.status(404).json({ error: { message: '見つかりません' } });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: { message: 'サーバーエラー' } });
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`モックAIサーバーが起動しました: http://localhost:${PORT}`);
  console.log(`環境変数PORT=${process.env.PORT}, 使用中のPORT=${PORT}`);
});
