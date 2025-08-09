// Simple data storage for trends
let trendsData = null;

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
      
      // Store data in memory
      trendsData = req.body;
      console.log('✅ Trends data updated:', trendsData?.trends?.length || 0, 'trends');
      console.log('🔍 trendsData is now:', !!trendsData ? 'truthy' : 'falsy');
      
      return res.status(200).json({ 
        success: true, 
        message: 'Trends updated',
        receivedTrends: trendsData?.trends?.length || 0,
        receivedKeys: Object.keys(trendsData || {})
      });
    } catch (error) {
      console.error('❌ Error updating trends:', error);
      return res.status(500).json({ error: 'Failed to update trends' });
    }
  }

  if (req.method === 'GET') {
    // Dashboard fetches trends data here
    console.log('🔍 GET request - trendsData check:', !!trendsData ? 'truthy' : 'falsy');
    console.log('🔍 trendsData type:', typeof trendsData);
    console.log('🔍 trendsData keys:', trendsData ? Object.keys(trendsData) : 'null/undefined');
    
    if (!trendsData) {
      console.log('❌ No trends data available');
      
      // Try to load from fallback file
      try {
        const fs = require('fs');
        const path = require('path');
        const fallbackPath = path.join(process.cwd(), 'public', 'trends', 'latest.json');
        if (fs.existsSync(fallbackPath)) {
          const fallbackData = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
          console.log('🔄 Using fallback data with', fallbackData?.trends?.length || 0, 'trends');
          return res.status(200).json(fallbackData);
        }
      } catch (fallbackError) {
        console.log('⚠️ Fallback failed:', fallbackError.message);
      }
      
      return res.status(404).json({ 
        error: 'No trends data available',
        debug: {
          trendsDataExists: !!trendsData,
          trendsDataType: typeof trendsData
        }
      });
    }
    
    console.log('✅ Returning trends data with', trendsData.trends?.length || 0, 'trends');
    return res.status(200).json(trendsData);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}