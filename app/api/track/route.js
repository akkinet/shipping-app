import { trackShipment } from '../../../lib/shippo';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const carrier = searchParams.get('carrier');
  const trackingNumber = searchParams.get('tracking');

  if (!carrier || !trackingNumber) {
    return Response.json({ error: 'Carrier and tracking number are required' }, { status: 400 });
  }

  try {
    const tracking = await trackShipment(carrier, trackingNumber);
    return Response.json(tracking, { status: 200 });
  } catch (error) {
    return Response.json({ error: 'Failed to track shipment' }, { status: 500 });
  }
}
