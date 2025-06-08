'use client';
import { useState } from 'react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [output, setOutput] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false);
  const [nextChapterUrl, setNextChapterUrl] = useState('');

  const fetchContent = async (inputUrl = url) => {
    setLoading(true);
    setFinished(false);
    setOutput([]);

    const response = await fetch('/api/fetch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: inputUrl })
    });

    const data = await response.json();
    const chunks = data.chunks || [];

    // Lấy nextChapterUrl từ HTML
    try {
      const htmlRes = await fetch(inputUrl);
      const html = await htmlRes.text();
      const match = html.match(/<a[^>]+id="btnNextChapter"[^>]+href="([^"]+)"/);
      const nextUrl = match?.[1] ? new URL(match[1], inputUrl).href : '';
      setNextChapterUrl(nextUrl);
    } catch (err) {
      setNextChapterUrl('');
    }

    for (const chunk of chunks) {
      setOutput(prev => [...prev, `<div class='loading-animation'>Đang dịch...</div>`]);

      const viRes = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: chunk, lang: 'vi' })
      });
      const { translated: viText } = await viRes.json();

      setOutput(prev => [...prev.slice(0, -1), `<div class='translated-vi animate-fade-in'>${viText}</div>`]);
      setOutput(prev => [...prev, `<div class='loading-animation'>Đang dịch tiếng Anh...</div>`]);

      const enRes = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: chunk, lang: 'en' })
      });
      const { translated: enText } = await enRes.json();

      setOutput(prev => [...prev.slice(0, -1), `<div class='translated-en animate-fade-in'>${enText}</div>`]);
    }

    setLoading(false);
    setFinished(true);
  };

  const handleNextChapter = () => {
    if (nextChapterUrl) {
      setUrl(nextChapterUrl);
      setFinished(false);
      fetchContent(nextChapterUrl);
    }
  };

  return (
    <main className="p-6">
      <input
        type="text"
        placeholder="Nhập URL chương truyện"
        className="border p-2 w-full"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <button onClick={() => fetchContent(url)} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">
        Dịch chương
      </button>
      {loading && <p className="mt-4 text-yellow-600 animate-pulse">Đang dịch nội dung...</p>}
      <div className="mt-6 space-y-4" dangerouslySetInnerHTML={{ __html: output.join('') }} />
      {finished && (
        <div className="mt-6">
          <p className="text-green-700">✅ Đã hết nội dung chương.</p>
          {nextChapterUrl && (
            <button onClick={handleNextChapter} className="mt-2 px-4 py-2 bg-green-700 text-white rounded">
              👉 Dịch chương tiếp theo
            </button>
          )}
        </div>
      )}
    </main>
  );
}
