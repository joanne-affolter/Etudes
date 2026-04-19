import { prisma } from "../../../../lib/prisma";

export const PUT = async (req, { params }) => {
  const { id } = params;
  const data = await req.json();
  const prenom = data?.prenom?.trim();
  const nom = data?.nom?.trim();

  try {
    const updated = await prisma.personnel.update({
      where: { id: Number(id) },
      data: { ...(prenom && { prenom }), ...(nom && { nom }) },
    });
    return new Response(JSON.stringify(updated), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error in PUT /api/personnel/[id]:", err);
    return new Response(JSON.stringify({ error: "Erreur lors de la mise à jour" }), { status: 500 });
  }
};

export const DELETE = async (req, { params }) => {
  const { id } = params;

  try {
    await prisma.personnel.delete({ where: { id: Number(id) } });
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error in DELETE /api/personnel/[id]:", err);
    return new Response(JSON.stringify({ error: "Erreur lors de la suppression" }), { status: 500 });
  }
};
