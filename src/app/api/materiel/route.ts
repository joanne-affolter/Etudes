import { prisma } from "../../../lib/prisma";


export const GET = async (request) => {
  const { searchParams } = new URL(request.url);
  const id = parseInt(searchParams.get("id"), 10);

  const data = await prisma.material.findMany({
      where: { id },
  });
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
};

export const POST = async (req) => {
  const data = await req.json();

  try {
    const updated = await prisma.material.upsert({
      where: { id_section: { id: data.id, section: data.section } },
      update: { items: data.items },
      create: {
        id: data.id,
        section: data.section,
        items: data.items,
      },
    });
    return new Response(JSON.stringify(updated), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error in POST api/materiel :", err);
    return new Response(JSON.stringify({ error: "Failed to create project" }), {
      status: 500,
    });
  }
};
