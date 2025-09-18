import { NextResponse } from 'next/server';
import { prisma } from "../../../lib/prisma";

export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const { projectId, section, entries } = await req.json();

    if (!projectId || !section || !Array.isArray(entries)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }


    // Upsert each entry (title + parking_idx unique per projectId+section)
    const results = [];
    for (const e of entries) {
      const { title, parking_idx, description, fileUrls } = e || {};
      if (!title || typeof parking_idx !== 'number') continue;

      const row = await prisma.imageUpload.upsert({
        where: {
          projectId_section_title_parking_idx: {
            projectId,
            section,
            title,
            parking_idx,
          },
        },
        update: { description: description ?? '', fileUrls: fileUrls ?? '' },
        create: {
          projectId,
          section,
          title,
          parking_idx,
          description: description ?? '',
          fileUrls: fileUrls ?? '',
        },
      });

      results.push(row);
    }

    return NextResponse.json({ ok: true, count: results.length, items: results });
  } catch (err) {
    console.error('[image-uploads POST] error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to save' }, { status: 500 });
  }
}

export async function GET(req) {
    try {
      const { searchParams } = new URL(req.url);
      const projectId = Number(searchParams.get('projectId'));
      const section   = searchParams.get('section') || 'avant';
  
      if (!projectId) {
        return NextResponse.json({ error: 'projectId required' }, { status: 400 });
      }
  
      const rows = await prisma.imageUpload.findMany({
        where: { projectId, section },
        orderBy: [{ parking_idx: 'asc' }, { id: 'asc' }],
      });
  
      // fileUrls is stored as a STRING in DB — keep as-is;
      // the client will parse (JSON.parse or split).
      return NextResponse.json({ items: rows });
    } catch (e) {
      console.error('[image-uploads GET] error:', e);
      return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
    }
  }