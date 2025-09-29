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


import { NextRequest, NextResponse } from "next/server";

export async function POST(req) {
  const data = await req.json();

  const res = await fetch(`https://render.carbone.io/render/ff0632a0108820464cd0ba2239347f4c42d140b138187a46cd2c8ae4bab6355b?download=true`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer eyJhbGciOiJFUzUxMiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiIxMjU1ODI5NjMwNDA1NDIxMDMzIiwiYXVkIjoiY2FyYm9uZSIsImV4cCI6MjQyMTQyODI1MywiZGF0YSI6eyJ0eXBlIjoicHJvZCJ9fQ.AN_vxx4VxdPzRIaTKk9C2O5OTjD77JNxlODABH5a5RUdqc9IVU7X7MRfpRhyjdAiYGvfP3Rak0EIdpLVRj6QI8aJAZTSyL4C1wecRXgJPOEs_w5DvYCIxbn2ZVQxM8nm5qdpCokqqnoYBfHie35XcnPn9v--DGogTyNeqN_Oqj3IXspQ`,
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