import Hapi from '@hapi/hapi';

export const handleRouteError = (error: unknown, h: Hapi.ResponseToolkit) => {
    if (error instanceof Error) {
        console.error('🚨 Route Error:', error.message);
        return h.response({ error: 'Internal Server Error', details: error.message }).code(500);
    } else {
        console.error('🚨 Unknown Route Error:', error);
        return h.response({ error: 'Internal Server Error', details: 'Unknown error occurred' }).code(500);
    }
};