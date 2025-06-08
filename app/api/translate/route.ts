import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text, lang } = await request.json();
    
    if (!text || !lang) {
      return NextResponse.json({ error: 'Text and language are required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const prompt = lang === 'vi'
      ? `Đoạn trích dưới đây được dịch từ công cụ dịch tự động lỗi thời, hãy viết lại lời văn cho tự nhiên hơn bằng tiếng Việt, không thay đổi nội dung, giữ nguyên định dạng markup:\n\n${text}`
      : `Rewrite the following translated excerpt into natural English, preserving the content and HTML markup:\n\n${text}`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!geminiRes.ok) {
      return NextResponse.json({ error: 'Translation API error' }, { status: 500 });
    }

    const data = await geminiRes.json();
    const translated = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    return NextResponse.json({ translated: translated || text });
  } catch (error) {
    console.error('Error in translate API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}