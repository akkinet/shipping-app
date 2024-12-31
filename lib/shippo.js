import axios from 'axios';

const shippoClient = axios.create({
  baseURL: 'https://api.goshippo.com/',
  headers: {
    'Authorization': `ShippoToken ${process.env.SHIPPO_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

export const createShipment = async (shipmentData) => {
  try {
    const response = await shippoClient.post('/shipments/', shipmentData);
    return response.data;
  } catch (error) {
    console.error('Error creating shipment:', error);
    throw error;
  }
};

export const getShipmentRates = async (shipmentId) => {
  try {
    const response = await shippoClient.get(`/shipments/${shipmentId}/rates/`);
    return response.data;
  } catch (error) {
    throw new Error('Failed to get rates');
  }
};

export const trackShipment = async (carrier, trackingNumber) => {
  try {
    const response = await shippoClient.get(`/tracks/${carrier}/${trackingNumber}/`);
    return response.data;
  } catch (error) {
    console.error('Error tracking shipment:', error.response?.data || error.message);
    throw error;
  }
};


export const transaction = async(rate) => {
  const response = await shippoClient.post('/transactions/', {
      rate: rate,
      label_file_type: 'PDF'
  });
  return response.data;
}