// Global data storage for trends (survives between requests in same instance)
global.trendsData = global.trendsData || null;

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
      
      // Try to save to persistent file
      try {
        const fs = require('fs');
        const path = require('path');
        const dataPath = path.join(process.cwd(), 'public', 'trends', 'live-data.json');
        
        // Ensure directory exists
        const dir = path.dirname(dataPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(dataPath, JSON.stringify(req.body, null, 2));
        console.log('💾 Saved trends to persistent file:', req.body?.trends?.length || 0, 'trends');
      } catch (saveError) {
        console.error('⚠️ Failed to save to file:', saveError.message);
      }
      
      // Also store in memory for this instance
      global.trendsData = req.body;
      
      return res.status(200).json({ 
        success: true, 
        message: 'Trends updated',
        receivedTrends: req.body?.trends?.length || 0,
        receivedKeys: Object.keys(req.body || {}),
        saved: 'persistent file + memory'
      });
    } catch (error) {
      console.error('❌ Error updating trends:', error);
      return res.status(500).json({ error: 'Failed to update trends' });
    }
  }

  if (req.method === 'GET') {
    // Dashboard fetches trends data here
    try {
      const fs = require('fs');
      const path = require('path');
      
      // Try to load from live data file first
      const liveDataPath = path.join(process.cwd(), 'public', 'trends', 'live-data.json');
      if (fs.existsSync(liveDataPath)) {
        const liveData = JSON.parse(fs.readFileSync(liveDataPath, 'utf8'));
        console.log('✅ Loaded live N8N data with', liveData?.trends?.length || 0, 'trends');
        return res.status(200).json(liveData);
      }
      
      console.log('⚠️ No live data file found, checking memory...');
      
      // Check memory as backup
      if (global.trendsData) {
        console.log('✅ Using memory data with', global.trendsData?.trends?.length || 0, 'trends');
        return res.status(200).json(global.trendsData);
      }
      
      console.log('⚠️ No memory data, trying fallback file...');
      
      // Try fallback to demo data
      const fallbackPath = path.join(process.cwd(), 'public', 'trends', 'latest.json');
      if (fs.existsSync(fallbackPath)) {
        const fallbackData = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
        console.log('🔄 Using fallback data with', fallbackData?.trends?.length || 0, 'trends');
        return res.status(200).json(fallbackData);
      }
      
      console.log('❌ No data available anywhere');
      return res.status(404).json({ 
        error: 'No trends data available',
        debug: {
          liveFileExists: fs.existsSync(liveDataPath),
          memoryExists: !!global.trendsData,
          fallbackExists: fs.existsSync(fallbackPath)
        }
      });
    } catch (error) {
      console.error('❌ Error loading trends data:', error);
      return res.status(500).json({ error: 'Failed to load trends data' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}