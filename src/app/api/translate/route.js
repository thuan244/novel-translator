import { NextResponse } from 'next/server';

export async function POST(req) {
  const { text, lang } = await req.json();
  const apiKey = process.env.GEMINI_API_KEY;

  const prompt = lang === 'vi'
    ? `Đoạn trích dưới đây được dịch từ công cụ dịch tự động lỗi thời, hãy viết lại lời văn cho tự nhiên hơn bằng tiếng Việt, không thay đổi nội dung, giữ nguyên định dạng markup:\n\n${text}`
    : `Rewrite the following translated excerpt into natural English, preserving the content and HTML markup:\n\n${text}`;

  const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  const data = await geminiRes.json();
  const translated = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  return NextResponse.json({ translated: translated || text });
}
