import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

export const convertHTMLtoPDF = async (html: string) => {
  const browser = await puppeteer.launch({
    args: [
      ...chromium.args,
      '--hide-scrollbars',
      '--disable-web-security',
      '--font-render-hinting=none',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--single-process' // This can help with missing libraries
    ],
    executablePath: await chromium.executablePath(),
    headless: true
  });
  const page = await browser.newPage();

  await page.setContent(html);

  // Generate PDF from the page content
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: "0.5in", bottom: "0.5in" }
  });

  await browser.close();

  return pdfBuffer;
}