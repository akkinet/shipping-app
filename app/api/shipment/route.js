import { createShipment } from '../../../lib/shippo';

export async function POST(req) {
  try {
    const shipmentData = await req.json();
    const shipment = await createShipment(shipmentData);
    return Response.json(shipment, { status: 200 });
  } catch (error) {
    return Response.json({ error: 'Failed to create shipment' }, { status: 500 });
  }
}
