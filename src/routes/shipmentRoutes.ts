import { Shipment } from "../models/Shipment";
import { PostOffice } from "../models/PostOffice";
import { ShipmentTypes, ShipmentWeights, ShipmentStatuses } from "../utils/types/shipment.model"
import Joi from "joi";
import Hapi from "@hapi/hapi";
import {handleRouteError} from "../utils/error-handler";

export const shipmentRoutes: Hapi.ServerRoute[] = [
    /**
     * Get shipments with pagination and filtering
     */
    {
        method: "GET",
        path: "/shipments",
        handler: async (request, h) => {
            try {
                const { status, type, weight, postOfficeId, shipmentNumber, page = 1, limit = 10 } = request.query as any;
                const filter: any = {};
                const skip = (page - 1) * limit;

                if (status) filter.status = status;
                if (type) filter.type = type;
                if (weight) filter.weight = weight;
                if (shipmentNumber) filter.shipmentNumber = shipmentNumber;
                if (postOfficeId) {
                    filter.$or = [
                        { status: ShipmentStatuses.originProcessed, originId: postOfficeId },
                        { status: ShipmentStatuses.destinationProcessed, destinationId: postOfficeId }
                    ];
                }

                const [shipments, total] = await Promise.all([
                    Shipment.find(filter).skip(skip).limit(Number(limit)),
                    Shipment.countDocuments(filter),
                ]);

                return h.response({ total, page: parseInt(page), limit: parseInt(limit), shipments });
            } catch (error) {
                return handleRouteError(error, h);
            }
        },
        options: {
            validate: {
                query: Joi.object({
                    type: Joi.string().valid(...Object.values(ShipmentTypes)).optional(),
                    status: Joi.string().valid(...Object.values(ShipmentStatuses)).optional(),
                    weight: Joi.string().valid(...Object.values(ShipmentWeights)).optional(),
                    shipmentNumber: Joi.number().optional(),
                    postOfficeId: Joi.string().optional(),
                    page: Joi.number().integer().min(1).default(1),
                    limit: Joi.number().integer().min(1).default(10),
                }),
            },
        },
    },
    /**
     * Get shipment by Id
     */

    {
        method: "GET",
        path: "/shipments/{id}",
        options: {
            validate: {
                params: Joi.object({
                    id: Joi.string().required(),
                }),
            },
        },
        handler: async (request, h) => {
            try {
            const { id } = request.params as {id: string};
            const shipment = await Shipment.findById(id);
            if (!shipment) {
                return h.response({ error: 'Shipment not found' }).code(404);
            }
            return h.response(shipment);
            } catch (err) {
                console.error('Error fetching shipment by id:', err);
                return h.response({ error: 'Internal Server Error', details: err }).code(500);
            }

        }
    },

    /**
     * Create a new shipment
     */

    {
        method: "POST",
        path: "/shipments",
        handler: async (request, h) => {
            try {
                const { shipmentNumber, type, status, weight, originId, destinationId } = request.payload as any;

                const originExists = await PostOffice.findOne({ zipCode: originId });
                if (!originExists) {
                    return h.response({ error: "Origin Post Office not found" }).code(404);
                }

                const destinationExists = await PostOffice.findOne({ zipCode: destinationId });
                if (!destinationExists) {
                    return h.response({ error: "Destination Post Office not found" }).code(404);
                }

                try {
                    const shipment = await Shipment.create({ shipmentNumber, status, type, weight, originId, destinationId });
                    return h.response(shipment).code(201);
                } catch (err) {
                    console.error('Error creating shipment:', err);
                    return h.response({ error: 'Internal Server Error', details: err }).code(500);
                }
            } catch (error) {
                return handleRouteError(error, h);
            }
        },
        options: {
            validate: {
                payload: Joi.object({
                    shipmentNumber: Joi.string().required(),
                    type: Joi.string().valid(...Object.values(ShipmentTypes)).required(),
                    // believe we should remove all statuses except for ORIGIN_PROCESSED
                    // as shipment should be created only with that status
                    status: Joi.string().valid(...Object.values(ShipmentStatuses)).required(),
                    weight: Joi.string().valid(...Object.values(ShipmentWeights)).required(),
                    originId: Joi.string().required(),
                    destinationId: Joi.string().required(),
                }),
            },
        },
    },

    /**
     * Update shipment details
     */

    {
        method: "PATCH",
        path: "/shipments/{id}",
        handler: async (request, h) => {
            try {
                const {id} = request.params;
                const {status, type, weight, destinationId, originId, shipmentNumber} = request.payload as any;

                const shipment = await Shipment.findById(id);
                if (!shipment) {
                    return h.response({error: "Shipment not found"}).code(404);
                }

                if (originId) {
                    const originExists = await PostOffice.findOne({ zipCode: originId });
                    if (!originExists) {
                        return h.response({ error: "Origin Post Office not found" }).code(404);
                    }
                }

                if(destinationId) {
                    const destinationExists = await PostOffice.findOne({ zipCode: destinationId });
                    if (!destinationExists) {
                        return h.response({ error: "Destination Post Office not found" }).code(404);
                    }
                }

                if (shipment.status !== ShipmentStatuses.originProcessed) {
                    if (status) {
                        shipment.status = status;
                        const updatedShipment = await shipment.save();
                        return h.response(updatedShipment);
                    }
                    // if shipment is in any other status then ORIGIN_PROCESSED
                    // we should not allow any update except for status
                    else {
                        return h.response({error: "Can not update shipment"}).code(400);
                    }
                }

                shipment.status = status || shipment.status;
                shipment.type = type || shipment.type;
                shipment.weight = weight || shipment.weight;
                shipment.destinationId = destinationId || shipment.destinationId;
                shipment.originId = originId || shipment.originId;
                shipment.shipmentNumber = shipmentNumber || shipment.shipmentNumber

                const updatedShipment = await shipment.save();
                return h.response(updatedShipment);
            } catch (error) {
                return handleRouteError(error, h);
            }
        },
        options: {
            validate: {
                params: Joi.object({
                    id: Joi.string().required(),
                }),
                payload: Joi.object({
                    // believe we should remove ORIGIN_PROCESSED
                    // as shipment should not ever be updated to that status
                    // only created with it
                    type: Joi.string().valid(...Object.values(ShipmentTypes)).optional(),
                    status: Joi.string().valid(...Object.values(ShipmentStatuses)).optional(),
                    weight: Joi.string().valid(...Object.values(ShipmentWeights)).optional(),
                    shipmentNumber: Joi.string().optional(),
                    destinationId: Joi.string().optional(),
                    originId: Joi.string().optional(),
                }),
            },
        },
    },

    /**
     * Delete a shipment
     */

    {
        method: "DELETE",
        path: "/shipments/{id}",
        handler: async (request, h) => {
            const { id } = request.params;

            const shipment = await Shipment.findByIdAndDelete(id);

            if (!shipment) {
                return h.response({ error: "Shipment not found" }).code(404);
            }

            return h.response({ message: "Shipment deleted successfully" });
        },
        options: {
            validate: {
                params: Joi.object({
                    id: Joi.string().required(),
                }),
            },
        },
    },
];
