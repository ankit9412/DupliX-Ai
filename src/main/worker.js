import { parentPort } from 'worker_threads';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function processFile(filePath) {
  return new Promise((resolve, reject) => {
    try {
      const ext = path.extname(filePath).toLowerCase();
      const isImage = ['.jpg', '.jpeg', '.png', '.webp', '.bmp'].includes(ext);

      let phash = null;

      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);
      
      stream.on('data', (data) => hash.update(data));
      stream.on('end', async () => {
        const sha256 = hash.digest('hex');
        
        if (isImage) {
           try {
             const { data } = await sharp(filePath)
               .resize(8, 8, { fit: 'fill' })
               .greyscale()
               .raw()
               .toBuffer({ resolveWithObject: true });
             
             const avg = data.reduce((a, b) => a + b, 0) / data.length;
             let bits = '';
             for (let i = 0; i < data.length; i++) {
               bits += data[i] >= avg ? '1' : '0';
             }
             phash = BigInt('0b' + bits).toString(16);
           } catch(e) {
             // Ignore sharp errors (e.g. unsupported or corrupted image)
           }
        }
        resolve({ sha256, phash });
      });
      stream.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
}

parentPort.on('message', async (job) => {
  try {
    const result = await processFile(job.filePath);
    parentPort.postMessage({ id: job.id, ...result });
  } catch (err) {
    parentPort.postMessage({ id: job.id, error: err.message });
  }
});
