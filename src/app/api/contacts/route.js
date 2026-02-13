import { prisma } from "../../../lib/prisma";


export const GET = async (request) => {
  const { searchParams } = new URL(request.url);
  const id = parseInt(searchParams.get("id"), 10);

  const contacts = await prisma.contact.findUnique({
      where: { id },
  });

  return new Response(JSON.stringify(contacts), {
    headers: { "Content-Type": "application/json" },
  });
};

export const POST = async (req) => {
  const data = await req.json();

  // Validate required fields
  if (!data.id || typeof data.id !== 'number') {
    return new Response(JSON.stringify({ error: "ID is required and must be a number" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const updated = await prisma.contact.upsert({
      where: { id: data.id },
      update: data,
      create: data,
    });
    return new Response(JSON.stringify(updated), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error in POST api/contacts:", err);
    return new Response(JSON.stringify({ error: "Failed to save contact data", details: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
