"use client";

import { useState } from "react";

export default function Home() {
  const [shipment, setShipment] = useState(null);
  const [rates, setRates] = useState([]);
  const [loadingRates, setLoadingRates] = useState(false);
  const [trackingInfo, setTrackingInfo] = useState(null);
  const [trackingError, setTrackingError] = useState("");

  const handleTrackShipment = async () => {
    const carrier = "usps";
    const trackingNumber = "123456789";

    const response = await fetch(
      `/api/track?carrier=${carrier}&tracking=${trackingNumber}`
    );
    const data = await response.json();

    if (data.error) {
      setTrackingError(data.error);
      setTrackingInfo(null);
    } else {
      setTrackingInfo(data);
      setTrackingError("");
    }
  };

  const handleCreateShipment = async () => {
    const shipmentData = {
      address_from: {
        name: "Sender",
        street1: "123 Main St",
        city: "New York",
        state: "NY",
        zip: "10001",
        country: "US",
      },
      address_to: {
        name: "Receiver",
        street1: "456 Maple Ave",
        city: "San Francisco",
        state: "CA",
        zip: "94103",
        country: "US",
      },
      parcels: [
        {
          length: "10",
          width: "5",
          height: "5",
          distance_unit: "in",
          weight: "2",
          mass_unit: "lb",
        },
      ],
    };

    const response = await fetch("/api/shipment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(shipmentData),
    });

    const data = await response.json();
    setShipment(data);

    // Fetch rates after shipment creation
    if (data.object_id) {
      setLoadingRates(true);
      const ratesResponse = await fetch(`/api/rates?id=${data.object_id}`);
      const ratesData = await ratesResponse.json();
      console.log(ratesData);
      setRates(ratesData);
      setLoadingRates(false);
    }
  };

  return (
    <main className="p-10">
      <h1 className="text-2xl font-bold">Create Shipment and Fetch Rates</h1>
      <button
        onClick={handleCreateShipment}
        className="mt-5 bg-blue-500 text-white px-4 py-2 rounded"
      >
        Create Shipment
      </button>

      {shipment && (
        <div className="mt-5">
          <p>Shipment Created:</p>
          <pre>{JSON.stringify(shipment, null, 2)}</pre>
        </div>
      )}

      {loadingRates && <p>Loading rates...</p>}

      {rates.length > 0 && (
        <div className="mt-5">
          <h2 className="text-xl font-semibold">Shipping Rates</h2>
          <ul>
            {rates.map((rate, index) => (
              <li key={index}>
                {rate.provider} - {rate.amount} {rate.currency}
              </li>
            ))}
          </ul>
        </div>
      )}
      <button
        onClick={handleTrackShipment}
        className="mt-5 bg-green-500 text-white px-4 py-2 rounded"
      >
        Track Shipment
      </button>

      {trackingError && <p className="text-red-500">{trackingError}</p>}

      {trackingInfo && (
        <div className="mt-5">
          <h2 className="text-xl font-semibold">Tracking Info</h2>
          <pre>{JSON.stringify(trackingInfo, null, 2)}</pre>
        </div>
      )}
    </main>
  );
}
