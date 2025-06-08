import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Kiểm tra URL hợp lệ
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Connection': 'keep-alive',
        'Referer': 'https://www.google.com/'
      },
      signal: AbortSignal.timeout(10000), // Timeout sau 10 giây
    });

    if (!res.ok) {
      return NextResponse.json({ 
        error: 'Failed to fetch URL', 
        status: res.status, 
        statusText: res.statusText 
      }, { status: 500 });
    }

    const html = await res.text();
    const $ = cheerio.load(html);
    const paragraphs = $('#bookContentBody p').toArray();

    const chunks: string[] = [];
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
  } catch (error: unknown) {
    console.error('Error in fetch API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: errorMessage 
    }, { status: 500 });
  }
}

async function getNextChapterHref(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;

    const html = await res.text();
    const $ = cheerio.load(html);

    const nextHref = $('#btnNextChapter').attr('href');
    if (!nextHref) return null;

    const base = new URL(url);
    const fullUrl = new URL(nextHref, base.origin).href;

    return fullUrl;
  } catch (err) {
    console.error('Error fetching next chapter:', err);
    return null;
  }
}