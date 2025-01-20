"use client";

import { useState } from "react";

export default function Home() {
  const [shipment, setShipment] = useState(null);
  const [trackingInfo, setTrackingInfo] = useState(null);
  const [trackingNumber, setTrackingNumber] = useState(null);
  const [trackingError, setTrackingError] = useState("");
  // const [carrier, setCarrier] = useState("ups");

  const handleTrackShipment = async () => {
    const carrier = "shippo"; // Replace with desired carrier (e.g., "ups", "usps", "dhl")
    const trackingNumber = "SHIPPO_TRANSIT";
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
        email: "sender@example.com", // Add email
        phone: "+15551234567", // Add phone number
      },
      address_to: {
        name: "Receiver",
        street1: "456 Maple Ave",
        city: "San Francisco",
        state: "CA",
        zip: "94103",
        country: "US",
        email: "receiver@example.com", // Add recipient email
        phone: "+15559876543", // Add recipient phone number
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
      carrier_accounts: null, // Let Shippo auto-select available carriers
      shipment_date: new Date().toISOString().replace("Z", "+00:00"), // Convert UTC to offset format
    };

    const response = await fetch("/api/shipment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(shipmentData),
    });

    const data = await response.json();
    if (data.error) {
      console.error("Failed to create shipment:", data.error);
      return;
    }
    setShipment(data);
    
    // Get the cheapest rate
    const selectedRate = data.rates[0]; // Choosing the first rate available

    if (!selectedRate) {
      console.log("No rates available for this shipment.");
      return;
    }

    console.log(
      "Rate Selected:",
      selectedRate.amount,
      selectedRate.currency,
      "Provider:",
      selectedRate.provider
    );
    // setCarrier(selectedRate.provider);

    // Buy the shipping label
    let transaction = await fetch("/api/transaction", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ rate: selectedRate.object_id }),
    });

    transaction = await transaction.json();

    if (transaction.tracking_number) {
      console.log("Tracking Number:", transaction.tracking_number);
      setTrackingNumber(transaction.tracking_number);
      console.log("Label URL:", transaction.label_url);
    } else {
      console.log("No tracking number received.");
      console.log(
        "Tracking number not available yet. Retrying in 5 seconds..."
      );
      setTimeout(async () => {
        let updatedTransaction = await fetch(
          `/api/transaction?id=${transaction.object_id}`
        );
        updatedTransaction = await updatedTransaction.json();
        console.log("Retried Transaction Response:", updatedTransaction);

        if (updatedTransaction.results) {
          setTrackingNumber(updatedTransaction.results[0].tracking_number);
          console.log(
            "Tracking Number Retrieved:",
            updatedTransaction.results[0].tracking_number
          );
        } else {
          console.log("Still no tracking number available.");
        }
      }, 5000);
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
