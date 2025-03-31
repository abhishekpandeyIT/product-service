const express = require('express');
const { CosmosClient } = require('@azure/cosmos');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(require('cors')());
app.use(express.json());

// Cosmos DB Connection
const cosmosClient = new CosmosClient(process.env.COSMOS_DB_CONNECTION_STRING);
const container = cosmosClient.database(process.env.COSMOS_DB_NAME).container(process.env.COSMOS_DB_CONTAINER);

// Health Check
app.get('/', (req, res) => res.send('Product Service is running'));

// API Routes
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

// Start server
app.listen(port, () => {
  console.log(`Product service running on port ${port}`);
});