// Paths to files in public/ (e.g. "images/logo.png") resolved from the app
// root. Plain relative paths break on nested routes like /table/checkout,
// where the browser would look under /table/images/.
const root = import.meta.env.BASE_URL.startsWith("/") ? import.meta.env.BASE_URL : "/";

export const asset = (path: string) => (/^(\/|[a-z]+:)/i.test(path) ? path : root + path);
