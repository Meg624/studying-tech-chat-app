import OpenAI from 'openai';

// OpenAI クライアントの初期化
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// システムプロンプト
export const SYSTEM_PROMPT =
  'あなたは親切なチャットボットです。簡潔で分かりやすい日本語で回答してください。専門的な質問にも対応できますが、わかりやすく説明するよう心がけてください。';

// メッセージを受け取ってOpenAI APIを呼び出す関数
export async function getAIResponse(message: string) {
  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: message },
    ],
  });

  // レスポンスのテキストを返す
  return res.choices[0].message?.content ?? 'エラーが発生しました。';
}
