import { PostOffice } from "../models/PostOffice";
import Joi from "joi";
import Hapi from "@hapi/hapi";
import {handleRouteError} from "../utils/error-handler";
import {Shipment} from "../models/Shipment";
import {ShipmentStatuses} from "../utils/types/shipment.model";

export const postOfficeRoutes: Hapi.ServerRoute[] = [
    /**
     * Create a new post office
     */
    {
        method: "POST",
        path: "/postoffices",
        handler: async (request, h) => {
            try {
                const { zipCode } = request.payload as { zipCode: string };
                const postOfficeExists = await PostOffice.findOne({"zipCode": zipCode});
                if (postOfficeExists) {
                    return h.response({ error: "Post Office already exist" }).code(400);
                }

                const postOffice = await PostOffice.create({ zipCode });
                return h.response(postOffice).code(201);
            } catch (error) {
                return handleRouteError(error, h);
            }
        },
        options: {
            validate: {
                payload: Joi.object({
                    zipCode: Joi.string().required(),
                }),
            },
        },
    },

    /**
     * Get all post offices
     */

    {
        method: 'GET',
        path: '/postoffices',
        handler: async (request, h) => {
            try {
                const postOffices = await PostOffice.find();
                return h.response(postOffices).code(200);
            } catch (error) {
                return handleRouteError(error, h);
            }
        },
        options: {
            validate: {
                query: Joi.object().unknown(false),
            },
        },
    },

    /**
     * Get post offices by id
     */

    {
        method: 'GET',
        path: '/postoffices/{id}',
        handler: async (request, h) => {
            try {
                const { id } = request.params as {id: string};
                const postOffice = await PostOffice.findById(id);
                if (!postOffice) {
                    return h.response({ error: 'Post office not found' }).code(404);
                }
                return h.response(postOffice).code(200);
            } catch (error) {
                return handleRouteError(error, h);
            }
        },
        options: {
            validate: {
                params: Joi.object({
                    id: Joi.string().required(),
                }),
            },
        },
    },

    /**
     * Update post office details
     */
    {
        method: "PATCH",
        path: "/postoffices/{id}",
        handler: async (request, h) => {
            try{
                const { id } = request.params;
                const { zipCode } = request.payload as { zipCode: string };

                const postOffice = await PostOffice.findById(id);
                if (!postOffice) {
                    return h.response({ error: 'Post office not found' }).code(404);
                }

                const oldZipCode = postOffice.zipCode;

                // this should not pass FE
                if (zipCode !== oldZipCode) {
                    await Shipment.updateMany(
                        {
                            $or: [{ originId: oldZipCode }, { destinationId: oldZipCode }],
                        },
                        [
                            {
                                $set: {
                                    originId: {
                                        $cond: {
                                            if: { $eq: ['$originId', oldZipCode] },
                                            then: zipCode,
                                            else: '$originId',
                                        },
                                    },
                                    destinationId: {
                                        $cond: {
                                            if: { $eq: ['$destinationId', oldZipCode] },
                                            then: zipCode,
                                            else: '$destinationId',
                                        },
                                    },
                                },
                            },
                        ]
                    );
                    postOffice.zipCode = zipCode;
                }
                await postOffice.save();
                return h.response(postOffice);
            } catch (error) {
                console.error('Error fetching shipment by id:', error);
                return h.response({ error: 'Internal Server Error', details: error }).code(500);
            }
        },
        options: {
            validate: {
                params: Joi.object({
                    id: Joi.string().required(),
                }),
                payload: Joi.object({
                    zipCode: Joi.string().required(),
                }),
            },
        },
    },

    /**
     * Delete a post office
     */
    {
        method: "DELETE",
        path: "/postoffices/{id}",
        handler: async (request, h) => {
            try {
                const { id } = request.params;

                const postOffice = await PostOffice.findById(id);
                if (!postOffice) {
                    return h.response({ error: 'Post office not found' }).code(404);
                }

                const shipment = await Shipment.findOne(
                    {
                        $or:
                            [
                                { $and:
                                        [
                                            {originId: postOffice.zipCode},
                                            {status: ShipmentStatuses.originProcessed}
                                        ]
                                },
                                { $and:
                                        [
                                            {destinationId: postOffice.zipCode},
                                            {status: ShipmentStatuses.destinationProcessed}
                                        ]
                                },
                            ]
                        }
                );

                if (shipment) {
                    return h.response({ error: 'Can not delete Post Office with shipments' }).code(400);
                }

                await PostOffice.findByIdAndDelete(id);
                return h.response({ message: "Post Office deleted successfully" });
            } catch (error) {
                console.error('Error fetching shipment by id:', error);
                return h.response({ error: 'Internal Server Error', details: error }).code(500);
            }
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
