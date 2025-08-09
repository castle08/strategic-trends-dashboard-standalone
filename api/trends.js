// Persistent data storage for trends using filesystem
const fs = require('fs');
const path = require('path');

const TRENDS_FILE = path.join('/tmp', 'trends-data.json');

function loadTrendsData() {
  try {
    if (fs.existsSync(TRENDS_FILE)) {
      const data = JSON.parse(fs.readFileSync(TRENDS_FILE, 'utf8'));
      console.log('🔄 Loaded trends data from tmp file:', data?.trends?.length || 0, 'trends');
      return data;
    }
    
    // Fallback to public file
    const publicPath = path.join(process.cwd(), 'public', 'trends', 'latest.json');
    if (fs.existsSync(publicPath)) {
      const data = JSON.parse(fs.readFileSync(publicPath, 'utf8'));
      console.log('🔄 Loaded trends data from public file:', data?.trends?.length || 0, 'trends');
      return data;
    }
    
    return null;
  } catch (error) {
    console.log('⚠️ Could not load trends data:', error.message);
    return null;
  }
}

function saveTrendsData(data) {
  try {
    fs.writeFileSync(TRENDS_FILE, JSON.stringify(data, null, 2));
    console.log('💾 Saved trends data to tmp file:', data?.trends?.length || 0, 'trends');
    return true;
  } catch (error) {
    console.error('❌ Failed to save trends data:', error.message);
    return false;
  }
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
      console.log('📥 Received POST data:', JSON.stringify(req.body, null, 2));
      console.log('📊 Data type:', typeof req.body);
      console.log('📊 Data keys:', Object.keys(req.body || {}));
      
      // Save data to persistent storage
      const saved = saveTrendsData(req.body);
      if (!saved) {
        return res.status(500).json({ error: 'Failed to save trends data' });
      }
      
      console.log('✅ Trends data updated and saved:', req.body?.trends?.length || 0, 'trends');
      return res.status(200).json({ success: true, message: 'Trends updated' });
    } catch (error) {
      console.error('❌ Error updating trends:', error);
      return res.status(500).json({ error: 'Failed to update trends' });
    }
  }

  if (req.method === 'GET') {
    // Dashboard fetches trends data here
    try {
      const trendsData = loadTrendsData();
      console.log('🔍 GET request - loaded trendsData:', !!trendsData ? 'truthy' : 'falsy');
      console.log('🔍 trendsData type:', typeof trendsData);
      console.log('🔍 trendsData keys:', trendsData ? Object.keys(trendsData) : 'null/undefined');
      
      if (!trendsData) {
        console.log('❌ No trends data available');
        return res.status(404).json({ error: 'No trends data available' });
      }
      
      console.log('✅ Returning trends data with', trendsData.trends?.length || 0, 'trends');
      return res.status(200).json(trendsData);
    } catch (error) {
      console.error('❌ Error loading trends data:', error);
      return res.status(500).json({ error: 'Failed to load trends data' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}