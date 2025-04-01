require('dotenv').config();
const express = require('express');
const { CosmosClient } = require('@azure/cosmos');

const app = express();
const PORT = process.env.PORT || 3001;

// Validate environment variables
if (!process.env.COSMOS_DB_CONNECTION_STRING) {
  console.error('Missing COSMOS_DB_CONNECTION_STRING environment variable');
  process.exit(1);
}

// Initialize Cosmos DB with error handling
let container;
try {
  const cosmosClient = new CosmosClient(process.env.COSMOS_DB_CONNECTION_STRING);
  const database = cosmosClient.database(process.env.COSMOS_DB_NAME || 'ecommerce-db');
  container = database.container(process.env.COSMOS_DB_CONTAINER || 'products');
  console.log('Cosmos DB initialized successfully');
} catch (err) {
  console.error('Cosmos DB initialization failed:', err);
  process.exit(1);
}

// Middleware
app.use(require('cors')());
app.use(express.json());

// Health check
app.get('/', (req, res) => res.send('Product Service is running'));

// Products endpoint
app.get('/products', async (req, res) => {
  try {
    const { resources } = await container.items.query('SELECT * FROM c').fetchAll();
    res.json(resources);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single product
app.get('/products/:id', async (req, res) => {
  try {
    const { resource } = await container.item(req.params.id, req.params.id).read();
    if (!resource) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(resource);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server - MUST use 0.0.0.0 for Azure
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});