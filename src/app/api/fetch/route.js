import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(req) {
    const { url } = await req.json();

    const res = await fetch(url);
    const html = await res.text();
    const $ = cheerio.load(html);
    const paragraphs = $('#bookContentBody p').toArray();

    const chunks = [];
    let buffer = '';

    for (const p of paragraphs) {
        const html = $.html(p);
        if ((buffer + html).length >= 2500) {
        chunks.push(buffer);
        buffer = html;
        } else {
        buffer += html;
        }
    }

    if (buffer) chunks.push(buffer);
  
    const nextChapterUrl = await getNextChapterHref(url);

    return NextResponse.json({ chunks, nextChapterUrl });
}

export async function getNextChapterHref(url) {
    try {
      const res = await fetch(url);
      const html = await res.text();
      const $ = cheerio.load(html);
  
      const nextHref = $('#btnNextChapter').attr('href');
      if (!nextHref) return null;
  
      // Tự động chuẩn hoá thành URL đầy đủ nếu cần
      const base = new URL(url);
      const fullUrl = new URL(nextHref, base.origin).href;
  
      return fullUrl;
    } catch (err) {
      console.error('Lỗi khi lấy chương tiếp theo:', err);
      return null;
    }
  }