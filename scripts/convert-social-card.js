#!/usr/bin/env node
/**
 * Convert social-card.svg to social-card.png
 * Uses puppeteer for accurate SVG rendering with emoji support
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function convertSvgToPng() {
  const svgPath = path.join(__dirname, '../frontend/public/social-card.svg');
  const pngPath = path.join(__dirname, '../frontend/public/social-card.png');
  
  const svgContent = fs.readFileSync(svgPath, 'utf8');
  
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Set viewport to match SVG dimensions
  await page.setViewport({ width: 1200, height: 630 });
  
  // Create HTML with the SVG
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          * { margin: 0; padding: 0; }
          body { width: 1200px; height: 630px; }
        </style>
      </head>
      <body>${svgContent}</body>
    </html>
  `;
  
  await page.setContent(html, { waitUntil: 'networkidle0' });
  
  // Take screenshot
  await page.screenshot({
    path: pngPath,
    type: 'png',
    clip: { x: 0, y: 0, width: 1200, height: 630 }
  });
  
  await browser.close();
  
  console.log(`✓ Converted: ${pngPath}`);
}

convertSvgToPng().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
