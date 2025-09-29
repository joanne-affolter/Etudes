import { NextResponse } from "next/server";


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
      data: paramWithProxy, //JSON.stringify(param), 
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
