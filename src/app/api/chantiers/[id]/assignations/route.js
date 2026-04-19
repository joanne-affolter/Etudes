import { prisma } from "../../../../../lib/prisma";

// GET — fetch current personnel for a chantier
export const GET = async (req, { params }) => {
  const chantierId = Number(params.id);
  const assignations = await prisma.assignation.findMany({
    where: { chantierId },
    select: { personnelId: true },
  });
  return new Response(JSON.stringify(assignations.map(a => a.personnelId)), {
    headers: { "Content-Type": "application/json" },
  });
};

// PUT — sync: replace all assignations for a chantier
export const PUT = async (req, { params }) => {
  const chantierId = Number(params.id);
  const { personnelIds } = await req.json();

  try {
    await prisma.$transaction([
      prisma.assignation.deleteMany({ where: { chantierId } }),
      ...(personnelIds ?? []).map(personnelId =>
        prisma.assignation.create({ data: { chantierId, personnelId } })
      ),
    ]);
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error syncing assignations:", err);
    return new Response(JSON.stringify({ error: "Erreur lors de la synchronisation" }), { status: 500 });
  }
};
