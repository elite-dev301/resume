import chromium from '@sparticuz/chromium-min';
import puppeteer from 'puppeteer-core';

export const convertHTMLtoPDF = async (html: string) => {
  const browser = await puppeteer.launch({
    args: [...chromium.args,
      '--hide-scrollbars', '--disable-web-security', '--font-render-hinting=none', '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--single-process'],
    executablePath: await chromium.executablePath(
      `https://github.com/Sparticuz/chromium/releases/download/v138.0.2/chromium-v138.0.2-layer.x64.zip`
    ),
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