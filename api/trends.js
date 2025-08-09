// Simple data storage for trends
let trendsData = null;

// Initialize with current trends data if available
try {
  const fs = require('fs');
  const path = require('path');
  const initialPath = path.join(process.cwd(), 'public', 'trends', 'latest.json');
  if (fs.existsSync(initialPath)) {
    trendsData = JSON.parse(fs.readFileSync(initialPath, 'utf8'));
    console.log('🔄 Initialized with', trendsData?.trends?.length || 0, 'trends from latest.json');
  }
} catch (error) {
  console.log('⚠️ Could not load initial trends data:', error.message);
}

export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    // N8N posts trends data here
    try {
      trendsData = req.body;
      console.log('Trends data updated:', trendsData?.trends?.length || 0, 'trends');
      return res.status(200).json({ success: true, message: 'Trends updated' });
    } catch (error) {
      console.error('Error updating trends:', error);
      return res.status(500).json({ error: 'Failed to update trends' });
    }
  }

  if (req.method === 'GET') {
    // Dashboard fetches trends data here
    if (!trendsData) {
      return res.status(404).json({ error: 'No trends data available' });
    }
    return res.status(200).json(trendsData);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}