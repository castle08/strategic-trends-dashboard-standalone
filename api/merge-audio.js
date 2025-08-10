import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

// Set FFmpeg path for fluent-ffmpeg
ffmpeg.setFfmpegPath(ffmpegPath.path);
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);

// For Vercel, we need to use /tmp directory
const tmpDir = '/tmp';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Raw request body keys:', Object.keys(req.body));
    console.log('Request body type:', typeof req.body);
    console.log('Request body sample:', JSON.stringify(req.body).substring(0, 500));

    // Handle n8n input format (array of items directly)
    let audioSegments = req.body;
    
    // If it's wrapped in audioSegments property, extract it
    if (req.body.audioSegments) {
      audioSegments = req.body.audioSegments;
    }

    console.log('Audio segments type:', typeof audioSegments);
    console.log('Audio segments is array:', Array.isArray(audioSegments));
    console.log('Audio segments length:', audioSegments?.length);

    if (!audioSegments || !Array.isArray(audioSegments) || audioSegments.length === 0) {
      return res.status(400).json({ error: 'audioSegments array required' });
    }

    console.log(`Processing ${audioSegments.length} audio segments`);

    // Create temporary files for each audio segment
    const tempFiles = [];
    
    for (let i = 0; i < audioSegments.length; i++) {
      const segment = audioSegments[i];
      console.log(`Segment ${i} keys:`, Object.keys(segment));
      console.log(`Segment ${i} structure:`, JSON.stringify(segment).substring(0, 200));
      
      // Extract from n8n format (segment.json.segmentInfo, segment.binary.data)
      let audioData, duration;
      
      if (segment.binary && segment.binary.data) {
        // n8n format - binary data might be in different formats
        console.log(`Segment ${i}: Using n8n binary format`);
        console.log(`Segment ${i} binary data type:`, typeof segment.binary.data);
        console.log(`Segment ${i} binary data keys:`, Object.keys(segment.binary.data || {}));
        
        // Handle different n8n binary data formats
        if (Buffer.isBuffer(segment.binary.data)) {
          audioData = segment.binary.data;
        } else if (segment.binary.data.data && Buffer.isBuffer(segment.binary.data.data)) {
          audioData = segment.binary.data.data;
        } else if (typeof segment.binary.data === 'string') {
          audioData = segment.binary.data;
        } else {
          // Try to extract base64 data from object
          audioData = segment.binary.data.data || segment.binary.data;
        }
        
        duration = segment.json?.segmentInfo?.duration || 1;
      } else if (segment.audio) {
        // Direct format
        console.log(`Segment ${i}: Using direct audio format`);
        audioData = segment.audio;
        duration = segment.duration || 1;
      } else {
        console.error(`Segment ${i} structure:`, JSON.stringify(segment, null, 2));
        throw new Error(`Segment ${i} missing audio data`);
      }

      console.log(`Segment ${i} audioData type:`, typeof audioData);
      console.log(`Segment ${i} audioData is Buffer:`, Buffer.isBuffer(audioData));

      // Decode base64 audio (n8n binary data handling)
      let audioBuffer;
      if (Buffer.isBuffer(audioData)) {
        audioBuffer = audioData;
      } else if (typeof audioData === 'string') {
        audioBuffer = Buffer.from(audioData, 'base64');
      } else {
        throw new Error(`Segment ${i}: Invalid audio data format. Expected Buffer or base64 string, got ${typeof audioData}`);
      }
      const tempFilePath = path.join(tmpDir, `segment_${i}_${Date.now()}.mp3`);
      
      await writeFile(tempFilePath, audioBuffer);
      tempFiles.push(tempFilePath);
    }

    // Most basic approach - individual inputs with filter_complex concat
    const outputPath = path.join(tmpDir, `merged_${Date.now()}.mp3`);
    
    console.log('Attempting FFmpeg merge with', tempFiles.length, 'files');

    await new Promise((resolve, reject) => {
      const command = ffmpeg();
      
      // Add each file as an input
      tempFiles.forEach((file, index) => {
        console.log(`Adding input ${index}:`, file);
        command.addInput(file);
      });
      
      // Simple concat filter without video streams
      const filterString = tempFiles.map((_, i) => `[${i}:a]`).join('') + `concat=n=${tempFiles.length}:v=0:a=1[outa]`;
      
      console.log('Using filter:', filterString);
      
      command
        .complexFilter([filterString])
        .outputOptions(['-map', '[outa]'])
        .audioCodec('aac') // Use AAC instead of copy to handle any format issues
        .output(outputPath)
        .on('start', (commandLine) => {
          console.log('FFmpeg command:', commandLine);
        })
        .on('end', () => {
          console.log('FFmpeg processing completed successfully');
          resolve();
        })
        .on('error', (err, stdout, stderr) => {
          console.error('FFmpeg error:', err.message);
          console.error('FFmpeg stderr:', stderr);
          console.error('FFmpeg stdout:', stdout);
          reject(err);
        })
        .run();
    });

    // Read merged file and convert to base64
    const mergedAudio = await readFile(outputPath);
    const base64Audio = mergedAudio.toString('base64');

    // Cleanup temporary files
    tempFiles.push(outputPath);
    for (const file of tempFiles) {
      try {
        fs.unlinkSync(file);
      } catch (err) {
        console.warn(`Failed to delete temp file ${file}:`, err.message);
      }
    }

    // Calculate total duration
    const totalDuration = audioSegments.reduce((sum, segment) => {
      if (segment.json?.segmentInfo?.duration) {
        return sum + segment.json.segmentInfo.duration;
      } else if (segment.duration) {
        return sum + segment.duration;
      }
      return sum + 1; // fallback
    }, 0);

    res.json({
      success: true,
      audio: base64Audio,
      duration: totalDuration,
      segments_processed: audioSegments.length
    });

  } catch (error) {
    console.error('Audio merge error:', error);
    res.status(500).json({ 
      error: 'Failed to merge audio files', 
      details: error.message 
    });
  }
}