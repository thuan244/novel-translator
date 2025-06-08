import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch URL' }, { status: 500 });
    }

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
  } catch (error) {
    console.error('Error in fetch API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function getNextChapterHref(url: string) {
  try {
    const res = await fetch(url);
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