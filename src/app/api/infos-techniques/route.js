import { prisma } from "../../../lib/prisma";


export const GET = async (request) => {
  const { searchParams } = new URL(request.url);
  const id = parseInt(searchParams.get("id"), 10);

  const data = await prisma.materielInfoTechnique.findMany({
      where: { id },
  });

  const metas = await prisma.infosTechniquesMeta.findMany({
    where: { id: id },
  });

  return new Response(JSON.stringify({ data: data, metas: metas }), {
    headers: { "Content-Type": "application/json" },
  });
};

export const POST = async (req) => {
  const data = await req.json();

  try {
    const updated = await prisma.materielInfoTechnique.upsert({
      where: { id_parking_idx_section: {
        id: data.id,
        parking_idx: data.parking_idx,
        section: data.section,
      } },
      update: data,
      create: data,
    });
    return new Response(JSON.stringify(updated), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error in POST api/infos-techniques :", err);
    return new Response(JSON.stringify({ error: "Failed to create project" }), {
      status: 500,
    });
  }
};
