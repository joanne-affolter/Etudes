import { prisma } from "../../../../lib/prisma";
import { NextRequest } from "next/server";

export const GET = async (
  req, { params }
) => {
  const { id } = params;

  try {
    const project = await prisma.project.findUnique({
      where: { id: Number(id) },
      select: { id: true, reference: true, adresse: true, statut: true },
    });

    if (!project) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify(project), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error fetching project:", err);
    return new Response(JSON.stringify({ error: "Failed to fetch project" }), {
      status: 500,
    });
  }
};


export const PUT = async (
  request, { params }
) => {
  const { id } = params;
  const data = await request.json();
  const { statut } = data;

  try {
    const updatedProject = await prisma.project.update({
      where: { id: Number(id) },
      data: { statut },
    });

    return new Response(JSON.stringify(updatedProject), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error updating project:", err);
    return new Response(JSON.stringify({ error: "Failed to update project" }), {
      status: 500,
    });
  }
};
