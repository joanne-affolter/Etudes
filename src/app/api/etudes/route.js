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
  const { reference, adresse, statut } = data;

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
