"use client";

import { useState } from "react";

// Step 1: Component to Create Shipment
const ShipmentCreator = ({ onShipmentCreated }) => {
  const [isLoading, setIsLoading] = useState(false);

  const createShipment = async () => {
    setIsLoading(true);
    const shipmentData = {
      address_from: {
        name: "Sender",
        street1: "123 Main St",
        city: "New York",
        state: "NY",
        zip: "10001",
        country: "US",
        email: "sender@example.com",
        phone: "+15551234567",
      },
      address_to: {
        name: "Receiver",
        street1: "456 Maple Ave",
        city: "San Francisco",
        state: "CA",
        zip: "94103",
        country: "US",
        email: "receiver@example.com",
        phone: "+15559876543",
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
      carrier_accounts: null,
      shipment_date: new Date().toISOString().replace("Z", "+00:00"),
    };

    try {
      const response = await fetch("/api/shipment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(shipmentData),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      onShipmentCreated(data);
    } catch (error) {
      console.error("Failed to create shipment:", error.message);
      alert("Error creating shipment: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={createShipment}
      className={`mt-5 bg-blue-500 text-white px-4 py-2 rounded ${
        isLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-600"
      }`}
      disabled={isLoading}
    >
      {isLoading ? "Creating..." : "Create Shipment"}
    </button>
  );
};

// Step 2: Component to Display and Select Rates
const RateSelector = ({ shipment, onRateSelected, selectedRate }) => {
  if (!shipment || !shipment.rates || shipment.rates.length === 0) {
    return (
      <p className="mt-5 text-gray-500">
        {shipment ? "No rates available" : "Create a shipment first"}
      </p>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        Choose a Shipping Rate
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {shipment.rates.map((rate) => {
          const isSelected = selectedRate?.object_id === rate.object_id;
          return (
            <div
              key={rate.object_id}
              className={`border rounded-lg p-4 shadow-sm transition-all duration-200 ${
                isSelected
                  ? "border-green-500 bg-green-50 shadow-md"
                  : "border-gray-200 hover:border-blue-300 hover:shadow-md"
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p
                    className={`font-medium ${
                      isSelected ? "text-green-800" : "text-gray-900"
                    }`}
                  >
                    {rate.provider}
                  </p>
                  <p
                    className={`text-sm ${
                      isSelected ? "text-green-700" : "text-gray-600"
                    }`}
                  >
                    {rate.servicelevel?.name || "Standard Shipping"}
                  </p>
                </div>
                {isSelected && (
                  <span className="text-green-600 text-sm font-semibold">
                    ✓ Selected
                  </span>
                )}
              </div>
              <p
                className={`mt-2 text-lg font-bold ${
                  isSelected ? "text-green-900" : "text-gray-800"
                }`}
              >
                {rate.amount} {rate.currency}
              </p>
              <p
                className={`text-sm ${
                  isSelected ? "text-green-600" : "text-gray-500"
                }`}
              >
                Estimated: {rate.estimated_days || "N/A"} days
              </p>
              <button
                onClick={() => onRateSelected(rate)}
                className={`mt-3 w-full py-2 rounded text-white text-sm font-medium transition-colors ${
                  isSelected
                    ? "bg-green-600 cursor-default"
                    : "bg-blue-500 hover:bg-blue-600"
                }`}
                disabled={isSelected}
              >
                {isSelected ? "Selected" : "Select This Rate"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Step 3: Component to Buy Label and Get Tracking
const LabelPurchaser = ({ selectedRate, onTrackingReceived }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [purchaseStatus, setPurchaseStatus] = useState(null);
  const [labelUrl, setLabelUrl] = useState(null);

  const buyLabel = async () => {
    if (!selectedRate) return;
    setIsLoading(true);
    setPurchaseStatus(null); // Reset previous status
    setLabelUrl(null); // Reset previous label URL

    try {
      let transaction = await fetch("/api/transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rate: selectedRate.object_id }),
      });
      transaction = await transaction.json();

      if (transaction.tracking_number) {
        setPurchaseStatus({
          message: "Label purchased successfully!",
          trackingNumber: transaction.tracking_number,
        });
        setLabelUrl(transaction.label_url);
        onTrackingReceived(transaction.tracking_number);
      } else {
        setPurchaseStatus({
          message:
            "Label purchased, but tracking number not available yet. Checking again in 5 seconds...",
        });
        setTimeout(async () => {
          let updatedTransaction = await fetch(
            `/api/transaction?id=${transaction.object_id}`
          );
          updatedTransaction = await updatedTransaction.json();
          if (
            updatedTransaction.results &&
            updatedTransaction.results[0].tracking_number
          ) {
            setPurchaseStatus({
              message: "Label purchased successfully!",
              trackingNumber: updatedTransaction.results[0].tracking_number,
            });
            setLabelUrl(updatedTransaction.results[0].label_url);
            onTrackingReceived(updatedTransaction.results[0].tracking_number);
          } else {
            setPurchaseStatus({
              message:
                "Label purchased, but tracking number still unavailable.",
            });
          }
        }, 5000);
      }
    } catch (error) {
      console.error("Error buying label:", error);
      setPurchaseStatus({
        message: "Failed to purchase label: " + error.message,
        error: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-5">
      <button
        onClick={buyLabel}
        className={`bg-purple-500 text-white px-4 py-2 rounded ${
          isLoading || !selectedRate
            ? "opacity-50 cursor-not-allowed"
            : "hover:bg-purple-600"
        }`}
        disabled={isLoading || !selectedRate}
      >
        {isLoading ? "Processing..." : "Buy Shipping Label"}
      </button>

      {purchaseStatus && (
        <div className="mt-3 p-3 border rounded-lg">
          <p
            className={`${
              purchaseStatus.error ? "text-red-500" : "text-green-600"
            }`}
          >
            {purchaseStatus.message}
          </p>
          {purchaseStatus.trackingNumber && (
            <p className="mt-1">
              <strong>Tracking Number:</strong> {purchaseStatus.trackingNumber}
            </p>
          )}
          {labelUrl && (
            <p className="mt-1">
              <strong>Label:</strong>{" "}
              <a
                href={labelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline"
              >
                Download Shipping Label
              </a>
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// Step 4: Component to Track Shipment
const ShipmentTracker = ({ trackingNumber }) => {
  const [trackingInfo, setTrackingInfo] = useState(null);
  const [trackingError, setTrackingError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const trackShipment = async () => {
    setIsLoading(true);
    const carrier = "shippo";
    try {
      const response = await fetch(
        `/api/track?carrier=${carrier}&tracking=${trackingNumber}`
      );
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setTrackingInfo(data);
      setTrackingError("");
    } catch (error) {
      setTrackingError(error.message);
      setTrackingInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-5">
      <button
        onClick={trackShipment}
        className={`bg-green-500 text-white px-4 py-2 rounded ${
          isLoading || !trackingNumber
            ? "opacity-50 cursor-not-allowed"
            : "hover:bg-green-600"
        }`}
        disabled={isLoading || !trackingNumber}
      >
        {isLoading ? "Tracking..." : "Track Shipment"}
      </button>
      {trackingError && (
        <p className="mt-2 text-red-500">Error: {trackingError}</p>
      )}
      {trackingInfo && (
        <div className="mt-5 border p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Tracking Information</h2>
          <p>
            <strong>Status:</strong> {trackingInfo.tracking_status}
          </p>
          <p>
            <strong>Carrier:</strong> {trackingInfo.carrier}
          </p>
          {trackingInfo.tracking_history?.length > 0 && (
            <div className="mt-2">
              <strong>Latest Update:</strong>
              <p>{trackingInfo.tracking_history[0].status_details}</p>
              <p className="text-sm text-gray-600">
                {new Date(
                  trackingInfo.tracking_history[0].status_date
                ).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Main Component
export default function Home() {
  const [shipment, setShipment] = useState(null);
  const [selectedRate, setSelectedRate] = useState(null);
  const [trackingNumber, setTrackingNumber] = useState(null);

  return (
    <main className="p-10 max-w-2xl mx-auto">
      <h1 className="text-2xl text-green-500 font-bold mb-6">Shipping Label Generator</h1>

      {/* Step 1: Create Shipment */}
      <ShipmentCreator onShipmentCreated={setShipment} />

      {/* Step 2: Select Rate */}
      <RateSelector
        shipment={shipment}
        onRateSelected={setSelectedRate}
        selectedRate={selectedRate}
      />

      {/* Step 3: Buy Label */}
      <LabelPurchaser
        selectedRate={selectedRate}
        onTrackingReceived={setTrackingNumber}
      />

      {/* Step 4: Track Shipment */}
      <ShipmentTracker trackingNumber={trackingNumber} />
    </main>
  );
}
