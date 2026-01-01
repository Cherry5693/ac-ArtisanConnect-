const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const routes = require('./routes/route');
const recRoutes = require('./routes/recoRoutes');
const path = require('path');

// Load env vars
dotenv.config({ path: './backend/.env' }); // Specify the path to .env
console.log('MONGO_URI:', process.env.MONGO_URI); // Add this line for debugging

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());
// Enable CORS - reflect incoming origin so credentials can be used safely
// Note: in production set FRONTEND_URL to your allowed origin (e.g. https://your-site.com)
app.use(cors({
	origin: true, // reflect request origin
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
	allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
	credentials: true,
}));

// Ensure preflight requests are handled explicitly without registering a route
// Some path patterns like '*' or '/*' can break path-to-regexp in certain router versions,
// so handle OPTIONS generically here and let the cors middleware set the appropriate headers.
app.use((req, res, next) => {
	if (req.method === 'OPTIONS') {
		// CORS middleware already sets the correct headers when origin is present.
		// Send a minimal successful preflight response.
		return res.sendStatus(204);
	}
	next();
});

// Log incoming requests and effective CORS behavior to help debug deployed env
app.use((req, res, next) => {
	console.log('Incoming request:', req.method, req.path, 'Origin:', req.headers.origin);
	next();
});

// Mount routers
app.use('/api', routes);
app.use('/api',recRoutes)

// Serve static assets in production and let client-side routing handle routes
if (process.env.NODE_ENV === 'production') {
	const frontendPath = path.join(__dirname, '..', 'frontend', 'dist');
	app.use(express.static(frontendPath));

	// For any GET request that isn't an API route, serve index.html so React Router can handle it.
	// Use a regex route to avoid path-to-regexp issues with wildcard route strings and explicitly exclude `/api` paths.
	app.get(/^\/(!?api).*|^\/(?!api).*$/, (req, res) => {
		res.sendFile(path.join(frontendPath, 'index.html'));
	});
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
