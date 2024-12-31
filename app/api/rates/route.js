import { getShipmentRates } from '../../../lib/shippo';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const shipmentId = searchParams.get('id');

  if (!shipmentId) {
    return Response.json({ error: 'Shipment ID is required' }, { status: 400 });
  }

  try {
    const rates = await getShipmentRates(shipmentId);
    return Response.json(rates, { status: 200 });
  } catch (error) {
    return Response.json({ error: 'Failed to fetch rates' }, { status: 500 });
  }
}
