export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    // Store RSS data for podcast generation
    try {
      const rssData = req.body;
      
      console.log('Received RSS data for podcast generation');
      console.log('Data type:', typeof rssData);
      console.log('Data keys:', Object.keys(rssData || {}));
      
      if (!rssData) {
        return res.status(400).json({ error: 'No RSS data provided' });
      }

      // Store the data temporarily (in production, you'd use a database)
      // For now, we'll just validate and return it for webhook trigger
      const response = {
        success: true,
        message: 'RSS data received and ready for podcast generation',
        timestamp: new Date().toISOString(),
        dataReceived: {
          hasData: !!rssData,
          type: typeof rssData,
          keys: Object.keys(rssData || {})
        },
        // Return the data for immediate use
        rssData: rssData
      };

      console.log('RSS data processed successfully');
      res.status(200).json(response);

    } catch (error) {
      console.error('Error processing RSS data:', error);
      res.status(500).json({ 
        error: 'Failed to process RSS data', 
        details: error.message 
      });
    }
  } 
  else if (req.method === 'GET') {
    // Health check endpoint
    res.status(200).json({
      status: 'active',
      message: 'RSS data endpoint ready to receive data',
      timestamp: new Date().toISOString(),
      usage: {
        post: 'Send RSS data from main trends workflow',
        webhook: 'Use as webhook trigger in podcast workflow'
      }
    });
  }
  else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}