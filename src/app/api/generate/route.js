{/**import { NextResponse } from "next/server";


function rewriteImages(obj, baseUrl) {
  if (obj == null) return obj;

  if (typeof obj === "string") {
    // crude check: ends with common image extensions
    if (/^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(obj)) {
      const proxy = new URL("/api/proxy-image", baseUrl);
      proxy.searchParams.set("url", obj);
      proxy.searchParams.set("w", "1200");
      proxy.searchParams.set("q", "80");
      return proxy.toString();
    }
    return obj;
  }

  if (Array.isArray(obj)) return obj.map((v) => rewriteImages(v, baseUrl));

  if (typeof obj === "object") {
    const out = {};
    for (const k of Object.keys(obj)) {
      out[k] = rewriteImages(obj[k], baseUrl);
    }
    return out;
  }

  return obj;
}

const headers = {
  "Content-Type": "application/json",
  "X-API-KEY": "82c4MjAwMTY6MjAxMzE6QTVKMjFrak1Ga1ZCYTVRNQ=",
};

const apiUrl = "https://api.craftmypdf.com/v1/create";

export async function POST(request) {
  try {
    const param = await request.json(); 
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const paramWithProxy = rewriteImages(param, baseUrl);


    const requestBody = {
      template_id: "61077b239be18a0c",
      data: param, //JSON.stringify(param), 
      load_data_from: null,
      export_type: "json",
      expiration: 60,
      output_file: "etude_enedis.pdf",
      direct_download: 0,
      cloud_storage: 1,
      password_protected: true,
      password: "string",
      resize_images: 0,
      image_resample_res: 150 ,
    };

    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errMsg = await response.text();
      throw new Error(`HTTP error! status: ${response.status} | ${errMsg}`);
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in POST /api/generate:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

*/}

{/**
  OKKKKK
import { NextRequest, NextResponse } from "next/server";

export async function POST(req) {
  const data = await req.json();

  const res = await fetch(`https://render.carbone.io/render/6cf6d1a54de34f7562fe1c26777034008e663d481c17d95cb22a89fb84c4c7d9?download=true`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer eyJhbGciOiJFUzUxMiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiIxMjYwODk3NzM3MzMyMTUyMDU3IiwiYXVkIjoiY2FyYm9uZSIsImV4cCI6MjQyMjA4ODAyOCwiZGF0YSI6eyJ0eXBlIjoicHJvZCJ9fQ.AB6Mglcw4rPTcdD5TkrZkfgh3thv0JcXSS8gXp8VEsWfbW9V7br-NAknddvCNIS9nOu1dFiH30DOVN5R5zSMaYtJAH0t5DVaoN94R_ZepU7Lw75JLx8jSoy_HzIrVFkNQIcrg4qrUZhIBFmctaKaenr7Se6C3KSLfxk3LW0TiOLXYL50`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      data,             // ton JSON de variables
      convertTo: "pdf"  // sortie PDF
    })
  });

  if (!res.ok) {
    const error = await res.text();
    return NextResponse.json({ error }, { status: res.status });
  }

  // Retourner le PDF généré comme fichier binaire
  const pdfBuffer = Buffer.from(await res.arrayBuffer());
  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline; filename=etude_enedis.pdf"
    }
  });
}
*/}

import { NextRequest, NextResponse } from "next/server";

async function fetchWithRetry(url, options, retries = 2) {
  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);

      if (!res.ok) {
        const errorText = await res.text();
        lastError = { status: res.status, error: errorText };

        // If this was the last attempt → break
        if (attempt === retries) break;

        console.warn(`[Carbone] Attempt ${attempt + 1} failed → retrying...`);
        continue;
      }

      return res; // success!
    } catch (err) {
      lastError = { status: 500, error: err.message };

      if (attempt === retries) break;

      console.warn(`[Carbone] Network error on attempt ${attempt + 1} → retrying...`);
    }
  }

  // After all attempts: throw the final captured error
  throw lastError;
}

export async function POST(req) {
  const data = await req.json();

  const url =
    "https://render.carbone.io/render/ed684518b3dc4e44e4ef17a952b3214fdef2126cb8cc66e534fd45f0bbbab8d8?download=true";

  const requestBody = {
    data,
    convertTo: "pdf"
  };

  const bodyString = JSON.stringify(requestBody);
  const bodySizeBytes = new TextEncoder().encode(bodyString).length;
  const bodySizeKB = (bodySizeBytes / 1024).toFixed(2);
  const bodySizeMB = (bodySizeBytes / (1024 * 1024)).toFixed(2);

  // Fonction pour extraire toutes les URLs d'images du payload
  function extractImageUrls(obj, urls = new Set()) {
    if (obj == null) return urls;

    if (typeof obj === "string") {
      // Détecter les URLs d'images (blob storage + extensions courantes)
      if (/^https?:\/\/.+\.(jpg|jpeg|png|webp|gif|JPG|JPEG|PNG)/.test(obj) ||
        obj.includes('.public.blob.vercel-storage.com')) {
        urls.add(obj);
      }
      return urls;
    }

    if (Array.isArray(obj)) {
      obj.forEach(item => extractImageUrls(item, urls));
      return urls;
    }

    if (typeof obj === "object") {
      Object.values(obj).forEach(value => extractImageUrls(value, urls));
      return urls;
    }

    return urls;
  }

  // Fonction pour obtenir la taille d'une image via HEAD request
  async function getImageSize(imageUrl) {
    try {
      const response = await fetch(imageUrl, { method: 'HEAD' });
      const contentLength = response.headers.get('content-length');
      return contentLength ? parseInt(contentLength, 10) : 0;
    } catch (err) {
      console.warn(`   ⚠️  Impossible de récupérer la taille de: ${imageUrl.substring(0, 60)}...`);
      return 0;
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 [Carbone.io] PAYLOAD SIZE ANALYSIS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🔸 JSON payload size: ${bodySizeBytes} bytes (${bodySizeKB} KB / ${bodySizeMB} MB)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Extraire et analyser les images
  const imageUrls = extractImageUrls(data);
  console.log(`\n🖼️  Found ${imageUrls.size} image URLs in payload`);

  if (imageUrls.size > 0) {
    console.log('\n📸 Fetching image sizes...\n');

    let totalImageSize = 0;
    let imageCount = 0;

    for (const imageUrl of imageUrls) {
      const size = await getImageSize(imageUrl);
      if (size > 0) {
        totalImageSize += size;
        imageCount++;
        const sizeKB = (size / 1024).toFixed(2);
        const shortUrl = imageUrl.length > 80 ? imageUrl.substring(0, 80) + '...' : imageUrl;
        console.log(`   ✓ ${sizeKB} KB - ${shortUrl}`);
      }
    }

    const totalImageSizeKB = (totalImageSize / 1024).toFixed(2);
    const totalImageSizeMB = (totalImageSize / (1024 * 1024)).toFixed(2);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 IMAGES SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   • Total images: ${imageCount} (${imageUrls.size - imageCount} failed)`);
    console.log(`   • Total images size: ${totalImageSize} bytes`);
    console.log(`   • Total images size: ${totalImageSizeKB} KB`);
    console.log(`   • Total images size: ${totalImageSizeMB} MB`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const grandTotalBytes = bodySizeBytes + totalImageSize;
    const grandTotalKB = (grandTotalBytes / 1024).toFixed(2);
    const grandTotalMB = (grandTotalBytes / (1024 * 1024)).toFixed(2);

    console.log('\n💰 ESTIMATED TOTAL COST');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   🔸 JSON: ${bodySizeKB} KB`);
    console.log(`   🔸 Images: ${totalImageSizeKB} KB`);
    console.log(`   🔸 TOTAL: ${grandTotalBytes} bytes (${grandTotalKB} KB / ${grandTotalMB} MB)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  const options = {
    method: "POST",
    headers: {
      "Authorization":
        `Bearer eyJhbGciOiJFUzUxMiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiIxMjg1NDk4NzI4OTUzOTcxNDA5IiwiYXVkIjoiY2FyYm9uZSIsImV4cCI6MjQyNjgzMDAxMCwiZGF0YSI6eyJ0eXBlIjoicHJvZCJ9fQ.Aa2mTE1qhAzC37a3yGZZHdnOAd78Q10S-1izwG3BrAKHoaWAymfdDJFFrpmxl3KFOJMZLajhc2T3TqjkbD1KOqwNAJyQj4j7ldDufpG2oT7NxTxMzl3gZxYGwiMrAOKp7-0p0TKwpLfDaXDO8xDwOYgJMH3uI06DdQKrHlPg7llpg6Yu`,
      "Content-Type": "application/json"
    },
    body: bodyString
  };

  try {
    // 🔁 Call with retry - TEMPORARILY COMMENTED FOR PAYLOAD SIZE TESTING

    const res = await fetchWithRetry(url, options, 2);

    // Convert to PDF buffer
    const pdfBuffer = Buffer.from(await res.arrayBuffer());

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=etude_enedis.pdf"
      }
    });


    // TEMPORARY: Return payload size info instead of PDF
    /*
    return NextResponse.json({
      message: "Carbone.io call disabled for testing",
      payloadSize: {
        bytes: bodySizeBytes,
        kb: bodySizeKB,
        mb: bodySizeMB
      }
    });
    **/

  } catch (err) {
    // 🎯 Return full error to frontend
    return NextResponse.json(
      { message: "Carbone rendering failed", details: err },
      { status: err.status || 500 }
    );
  }
}