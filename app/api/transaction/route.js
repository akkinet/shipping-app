import { transaction, getTransaction } from "../../../lib/shippo";

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

export async function GET(request){
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return Response.json({ error: 'Transaction ID is required' }, { status: 400 });
  }

  try {
    const res = await getTransaction(id);
    return Response.json(res, { status: 200 });
  } catch (error) {
    return Response.json(
      { error: "Failed to fetch transaction" },
      { status: 500 }
    );
  }
}