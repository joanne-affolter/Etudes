import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export async function GET(req) {
  const raw = req.nextUrl.searchParams.get("url");
  if (!raw) return new NextResponse("Missing ?url=", { status: 400 });

  try {
    const width = parseInt(req.nextUrl.searchParams.get("w") || "1200", 10);
    const quality = parseInt(req.nextUrl.searchParams.get("q") || "80", 10);

    const upstream = await fetch(raw, { cache: "no-store" });
    if (!upstream.ok) {
      return new NextResponse(`Upstream error ${upstream.status}`, { status: 502 });
    }

    const buf = Buffer.from(await upstream.arrayBuffer());
    const mime = upstream.headers.get("content-type") || "image/jpeg";

    // Resize + compress
    const resized = await sharp(buf)
      .resize({ width, withoutEnlargement: true })
      .jpeg({ quality })
      .toBuffer();

    return new NextResponse(resized, {
      status: 200,
      headers: {
        "Content-Type": mime,
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    return new NextResponse(`Proxy error: ${err.message}`, { status: 500 });
  }
}
