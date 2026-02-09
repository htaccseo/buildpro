// @ts-nocheck
export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        // Fetch from assets
        let response = await env.ASSETS.fetch(request);

        // If the request results in a 404 and is a navigation request (not a file with extension), serve index.html
        if (response.status === 404 && !url.pathname.includes('.')) {
            response = await env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request));
        }

        return response;
    }
};
