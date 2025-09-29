import { NextResponse } from "next/server";


function bustCache(url) {
  const u = new URL(url);
  u.searchParams.set("_cb", Date.now().toString());
  return u.toString();
}

// If your payload (param) contains image URLs, rewrite them:
function rewriteImageUrls(obj) {
  if (obj == null) return obj;
  if (typeof obj === "string") {
    // crude test: looks like an http(s) image
    if (/^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(obj)) {
      return bustCache(obj);
    }
    return obj;
  }
  if (Array.isArray(obj)) return obj.map(rewriteImageUrls);
  if (typeof obj === "object") {
    const out = Array.isArray(obj) ? [] : {};
    for (const k of Object.keys(obj)) out[k] = rewriteImageUrls(obj[k]);
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
    const paramNoCache = rewriteImageUrls(param);


    const requestBody = {
      template_id: "61077b239be18a0c",
      data: paramNoCache, //JSON.stringify(param), 
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
