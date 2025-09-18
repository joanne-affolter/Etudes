import { prisma } from "../../../lib/prisma";


export const GET = async (request) => {
  const { searchParams } = new URL(request.url);
  const id = parseInt(searchParams.get("id"), 10);

  const contacts = await prisma.infosTechniquesMeta.findMany({
      where: { id },
  });

  return new Response(JSON.stringify(contacts), {
    headers: { "Content-Type": "application/json" },
  });
};

export const POST = async (req) => {
  const data = await req.json();

  try {
    const updated = await prisma.infosTechniquesMeta.upsert({
      where: {
        id_parking_idx: {
          id: data.id,
          parking_idx: data.parking_idx,
        },
      },
      update: { description: data.description, travees: data.travees },
      create: {
        id: data.id,
        parking_idx: data.parking_idx,
        description: data.description,
        travees: data.travees,
      },
    });
    return new Response(JSON.stringify(updated), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error in POST api/infos-techniques-meta/ :", err);
    return new Response(JSON.stringify({ error: "Failed to create or update" }), {
      status: 500,
    });
  }
};
