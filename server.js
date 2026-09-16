const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.m4v': 'video/mp4',
  '.mov': 'video/quicktime',
  '.webm': 'video/webm',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
  // CORS & Media streaming headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Accept-Ranges', 'bytes');

  req.on('error', () => {});
  res.on('error', () => {});

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method Not Allowed');
    return;
  }

  let reqPath = decodeURIComponent(req.url.split('?')[0]);
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  const filePath = path.join(PUBLIC_DIR, reqPath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const fileSize = stats.size;
    const isVideo = ext === '.mp4' || ext === '.mov' || ext === '.webm' || ext === '.m4v';
    const rangeHeader = req.headers.range;

    // Handle Range Requests for mobile iOS Safari / Chrome / AVFoundation
    if (rangeHeader && rangeHeader.startsWith('bytes=')) {
      const match = rangeHeader.match(/bytes=([0-9]*)-([0-9]*)/);
      if (!match) {
        res.writeHead(416, {
          'Content-Range': `bytes */${fileSize}`,
          'Content-Type': contentType,
          'Accept-Ranges': 'bytes'
        });
        res.end();
        return;
      }

      let start;
      let end;

      if (match[1] === '' && match[2] !== '') {
        // Suffix range: bytes=-500 -> last 500 bytes (e.g. iOS Safari probing trailer/moov)
        const suffixLength = parseInt(match[2], 10);
        start = Math.max(0, fileSize - suffixLength);
        end = fileSize - 1;
      } else if (match[1] !== '' && match[2] === '') {
        // Open range: bytes=100- -> from byte 100 to end
        start = parseInt(match[1], 10);
        end = fileSize - 1;
      } else {
        // Explicit range: bytes=0-1000
        start = parseInt(match[1], 10);
        end = parseInt(match[2], 10);
      }

      if (isNaN(start) || isNaN(end) || start > end || start >= fileSize || end >= fileSize) {
        res.writeHead(416, {
          'Content-Range': `bytes */${fileSize}`,
          'Content-Type': contentType,
          'Accept-Ranges': 'bytes'
        });
        res.end();
        return;
      }

      const chunkSize = end - start + 1;
      const headers = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType,
        'Content-Disposition': 'inline',
        'Cache-Control': isVideo ? 'public, max-age=31536000, immutable' : 'public, max-age=3600'
      };

      if (req.method === 'HEAD') {
        res.writeHead(206, headers);
        res.end();
        return;
      }

      res.writeHead(206, headers);
      const stream = fs.createReadStream(filePath, { start, end });
      stream.on('error', () => {
        if (!res.destroyed) res.destroy();
      });
      stream.pipe(res);
    } else {
      // Standard full-file response (HTTP 200)
      const headers = {
        'Content-Length': fileSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Content-Disposition': 'inline',
        'Cache-Control': ext === '.html' ? 'no-cache, no-store, must-revalidate' : (isVideo ? 'public, max-age=31536000' : 'public, max-age=3600')
      };

      if (req.method === 'HEAD') {
        res.writeHead(200, headers);
        res.end();
        return;
      }

      res.writeHead(200, headers);
      const stream = fs.createReadStream(filePath);
      stream.on('error', () => {
        if (!res.destroyed) res.destroy();
      });
      stream.pipe(res);
    }
  });
});

let currentPort = Number(process.env.PORT) || 3000;

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`Port ${currentPort} is in use, trying port ${currentPort + 1}...`);
    currentPort += 1;
    server.listen(currentPort, '0.0.0.0');
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});

server.listen(currentPort, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${currentPort}`);
});

