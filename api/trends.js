// Simple but reliable data storage for trends
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
      console.log('📥 Received POST data keys:', Object.keys(req.body || {}));
      console.log('📊 Trends count:', req.body?.trends?.length || 0);
      
      // Store data in memory
      trendsData = req.body;
      
      console.log('✅ Trends data updated successfully');
      
      return res.status(200).json({ 
        success: true, 
        message: 'Trends updated',
        receivedTrends: req.body?.trends?.length || 0,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error updating trends:', error);
      return res.status(500).json({ error: 'Failed to update trends' });
    }
  }

  if (req.method === 'GET') {
    // Dashboard fetches trends data here
    try {
      console.log('🔍 GET request - trendsData exists:', !!trendsData);
      console.log('🔍 Trends count:', trendsData?.trends?.length || 0);
      
      if (!trendsData) {
        console.log('❌ No trends data available');
        return res.status(404).json({ 
          error: 'No trends data available',
          debug: {
            hasData: false,
            dataType: typeof trendsData
          }
        });
      }
      
      console.log('✅ Returning trends data');
      return res.status(200).json(trendsData);
    } catch (error) {
      console.error('❌ Error in GET request:', error);
      return res.status(500).json({ error: 'Failed to load trends data' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}