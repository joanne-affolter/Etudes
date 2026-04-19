import { prisma } from "../../../lib/prisma";

// GET /api/assignations?chantierId=X
export const GET = async (req) => {
  const { searchParams } = new URL(req.url);
  const chantierId = Number(searchParams.get("chantierId"));

  if (!chantierId) {
    return new Response(JSON.stringify({ error: "chantierId est requis" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const assignations = await prisma.assignation.findMany({
    where: { chantierId },
    include: { personnel: true },
  });

  return new Response(JSON.stringify(assignations), {
    headers: { "Content-Type": "application/json" },
  });
};

export const POST = async (req) => {
  const data = await req.json();
  const chantierId = Number(data?.chantierId);
  const personnelId = Number(data?.personnelId);

  if (!chantierId || !personnelId) {
    return new Response(JSON.stringify({ error: "chantierId et personnelId sont requis" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const created = await prisma.assignation.create({
      data: { chantierId, personnelId },
      include: { personnel: true },
    });
    return new Response(JSON.stringify(created), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    if (err.code === "P2002") {
      return new Response(JSON.stringify({ error: "Ce personnel est déjà assigné à ce chantier" }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }
    console.error("Error in POST /api/assignations:", err);
    return new Response(JSON.stringify({ error: "Erreur lors de l'assignation" }), { status: 500 });
  }
};
