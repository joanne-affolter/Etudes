import { NextResponse } from "next/server";

const headers = {
  "Content-Type": "application/json",
  "X-API-KEY": process.env.CRAFTMYPDF_API_KEY,
};

const apiUrl = "https://api.craftmypdf.com/v1/create";

export async function POST(request) {
  try {
    const param = await request.json(); 

    const requestBody = {
      template_id: "61077b239be18a0c",
      data: JSON.stringify(param), 
      load_data_from: null,
      export_type: "json",
      expiration: 60,
      output_file: "etude_enedis.pdf",
      //image_resample_res: 600,
      direct_download: 0,
      cloud_storage: 1,
      password_protected: true,
      password: "string",
      resize_images: 0,
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
