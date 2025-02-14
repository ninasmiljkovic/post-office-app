import mongoose from "mongoose";
import { ShipmentTypes, ShipmentStatuses, ShipmentWeights } from "../../../shared/shipment.model";

const ShipmentSchema = new mongoose.Schema({
    shipmentNumber: { type: String, unique: true, required: true },
    type: { type: String, enum: Object.values(ShipmentTypes), required: true },
    status: { type: String, enum: Object.values(ShipmentStatuses), required: true },
    weight: { type: String, enum: Object.values(ShipmentWeights), required: true },
    originId: { type: String, required: true, index: true },
    destinationId: { type: String, required: false, index: true },
}, { timestamps: true });

export const Shipment = mongoose.model("Shipment", ShipmentSchema);
