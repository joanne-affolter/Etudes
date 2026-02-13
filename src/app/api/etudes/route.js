import { prisma } from "../../../lib/prisma";


export const GET = async () => {
  const projects = await prisma.project.findMany({
    select: { id: true, reference: true, adresse: true, statut: true},
    orderBy: { createdAt: "desc" },
  });

  return new Response(JSON.stringify(projects), {
    headers: { "Content-Type": "application/json" },
  });
};

export const POST = async (req) => {
  const data = await req.json();
  const reference = data?.reference?.trim();
  const adresse = data?.adresse?.trim();
  const statut = data?.statut?.trim();

  if (!reference || !adresse || !statut) {
    return new Response(JSON.stringify({ error: "reference, adresse, and statut are required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const newProject = await prisma.project.create({
      data: { reference, adresse, statut },
    });

    return new Response(JSON.stringify(newProject), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error in POST api/etudes/ :", err);
    return new Response(JSON.stringify({ error: "Failed to create project" }), {
      status: 500,
    });
  }
};
