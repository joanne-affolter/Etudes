import { prisma } from "../../../../lib/prisma";

export const DELETE = async (req, { params }) => {
  const { id } = params;

  try {
    await prisma.assignation.delete({ where: { id: Number(id) } });
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error in DELETE /api/assignations/[id]:", err);
    return new Response(JSON.stringify({ error: "Erreur lors de la suppression" }), { status: 500 });
  }
};
