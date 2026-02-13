import { prisma } from "../../../lib/prisma";


export const GET = async (request) => {
  const { searchParams } = new URL(request.url);
  const id = parseInt(searchParams.get("id"), 10);

  const data = await prisma.infosGenerales.findUnique({
      where: { id },
  });

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
};


export const POST = async (req) => {
  const data = await req.json();

  // Validate required fields
  if (!data.id || typeof data.id !== 'number') {
    return new Response(JSON.stringify({ error: "ID is required and must be a number" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const updated = await prisma.infosGenerales.upsert({
      where: { id: data.id },
      update: data,
      create: data,
    });
    return new Response(JSON.stringify(updated), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error in POST api/infos-generales:", err);
    return new Response(JSON.stringify({ error: "Failed to save infos générales", details: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
