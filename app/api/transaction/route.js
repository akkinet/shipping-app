import { transaction } from "../../../lib/shippo";

export async function POST(req) {
  const { rate } = await req.json();
  try {
    const res = await transaction(rate);
    return Response.json(res, { status: 200 });
  } catch (error) {
    return Response.json(
      { error: "Failed to track shipment" },
      { status: 500 }
    );
  }
}
