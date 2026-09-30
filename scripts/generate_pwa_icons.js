const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 implementation for PNG chunks
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[n] = c >>> 0;
}

function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
        c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(12 + len);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    const typeAndData = buf.subarray(4, 8 + len);
    buf.writeUInt32BE(crc32(typeAndData), 8 + len);
    return buf;
}

function generatePng(width, height, bgColor, drawLogo = true) {
    const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

    // IHDR
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8; // bit depth
    ihdr[9] = 6; // RGBA
    ihdr[10] = 0; // compression
    ihdr[11] = 0; // filter
    ihdr[12] = 0; // interlace

    // Generate pixels
    // Each row starts with a filter byte (0 = None), then width * 4 RGBA bytes
    const rowSize = 1 + width * 4;
    const rawData = Buffer.alloc(rowSize * height);

    const [br, bg, bb] = bgColor;
    const center = width / 2;
    const radius = width * 0.44;

    for (let y = 0; y < height; y++) {
        const rowOffset = y * rowSize;
        rawData[rowOffset] = 0; // filter type 0
        for (let x = 0; x < width; x++) {
            const pixelOffset = rowOffset + 1 + x * 4;
            
            // Rounded squircle / box with curved corners
            const dx = Math.abs(x - center);
            const dy = Math.abs(y - center);
            const cornerDist = Math.max(dx, dy);

            // Base color
            let r = br, g = bg, b = bb, a = 255;

            // Slight gradient
            const gradFactor = 1 - (y / height) * 0.25;
            r = Math.min(255, Math.floor(r * gradFactor));
            g = Math.min(255, Math.floor(g * gradFactor));
            b = Math.min(255, Math.floor(b * gradFactor));

            // Inner drawing (SpecSupport Checkmark & Orbit Dot)
            if (drawLogo) {
                // Checkmark coordinates normalized to [0..1]
                const nx = x / width;
                const ny = y / height;

                // Orbit ring around center
                const distToCenter = Math.hypot(nx - 0.5, ny - 0.5);
                if (Math.abs(distToCenter - 0.35) < 0.02) {
                    r = 255; g = 255; b = 255; a = 90;
                }

                // Checkmark line 1: (0.32, 0.52) to (0.46, 0.66)
                // Checkmark line 2: (0.46, 0.66) to (0.72, 0.34)
                const inLine1 = distToSegment(nx, ny, 0.32, 0.52, 0.46, 0.66) < 0.045;
                const inLine2 = distToSegment(nx, ny, 0.46, 0.66, 0.72, 0.34) < 0.045;
                
                // Orbit satellite green dot at (0.75, 0.30)
                const distToSatellite = Math.hypot(nx - 0.75, ny - 0.30);
                if (distToSatellite < 0.065) {
                    r = 16; g = 185; b = 129; a = 255; // Emerald Green
                } else if (inLine1 || inLine2) {
                    r = 255; g = 255; b = 255; a = 255; // Crisp White
                }
            }

            rawData[pixelOffset] = r;
            rawData[pixelOffset + 1] = g;
            rawData[pixelOffset + 2] = b;
            rawData[pixelOffset + 3] = a;
        }
    }

    const compressed = zlib.deflateSync(rawData, { level: 9 });
    const idat = makeChunk('IDAT', compressed);
    const iend = makeChunk('IEND', Buffer.alloc(0));

    return Buffer.concat([signature, makeChunk('IHDR', ihdr), idat, iend]);
}

function distToSegment(px, py, x1, y1, x2, y2) {
    const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

// Generate 192x192 and 512x512
const icon192 = generatePng(192, 192, [0, 112, 242]); // #0070F2 SAP Blue
const icon512 = generatePng(512, 512, [0, 112, 242]);

const rootDir = path.resolve(__dirname, '..');
fs.writeFileSync(path.join(rootDir, 'icon-192.png'), icon192);
fs.writeFileSync(path.join(rootDir, 'icon-512.png'), icon512);

console.log('Successfully generated icon-192.png (' + icon192.length + ' bytes) and icon-512.png (' + icon512.length + ' bytes).');
