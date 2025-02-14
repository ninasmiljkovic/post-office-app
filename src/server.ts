import Hapi from "@hapi/hapi";
import { connectDB } from "./db";
import { shipmentRoutes } from "./routes/shipmentRoutes";
import { postOfficeRoutes } from "./routes/postOfficeRoutes";

const init = async () => {
    await connectDB(); // Connect to MongoDB

    const server = Hapi.server({
        port: process.env.PORT || 4000,
        host: "localhost",
        routes: {
            cors: {
                origin: ['*'], // Allow all origins
                headers: ['Accept', 'Content-Type', 'Authorization'],
                credentials: true, // Allow authentication headers
            },
        },
    });

    server.ext('onRequest', (request, h) => {
        console.log(`Received request: ${request.method.toUpperCase()} ${request.url.href}`);
        return h.continue;
    });


    server.route([...shipmentRoutes, ...postOfficeRoutes]);

    await server.start();
    console.log(`Server running on ${server.info.uri}`);
};

init();
