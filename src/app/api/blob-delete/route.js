// src/app/api/blob-delete/route.js
import { del } from '@vercel/blob';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs'; // 👈 ensure Node runtime (not Edge)

export async function POST(request) {
  try {
    const { url, pathname } = await request.json();
    if (!url && !pathname) {
      return NextResponse.json({ error: 'url or pathname required' }, { status: 400 });
    }

    // Prefer the pathname (key). If missing, derive from url.
    const target =
      pathname ||
      (url ? new URL(url).pathname.replace(/^\/+/, '') : null);

    if (!target) {
      return NextResponse.json({ error: 'Could not derive pathname from URL' }, { status: 400 });
    }

    // Debug info (visible in server logs)
    console.log('[blob-delete] token? ', !!process.env.BLOB_READ_WRITE_TOKEN);
    console.log('[blob-delete] target:', target, 'url:', url);

    // Try delete by pathname first; if it throws AND we had a url, try the url form.
    try {
      await del(target); // pathname form
    } catch (err1) {
      console.warn('[blob-delete] pathname delete failed, will try url:', err1?.message);
      if (url) {
        await del(url); // full URL form
      } else {
        throw err1;
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[blob-delete] error:', err);
    return NextResponse.json({ error: err?.message || 'Delete failed' }, { status: 400 });
  }
}
