import puppeteer, { Browser } from 'puppeteer';

let browserInstance: Browser | null = null;

const getBrowser = async (): Promise<Browser> => {
  if (!browserInstance) {
    browserInstance = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--hide-scrollbars',
        '--disable-web-security',
        '--font-render-hinting=none',
        '--disable-font-subpixel-positioning', // Add this
        '--disable-lcd-text',                  // Add this
        '--force-color-profile=srgb',         // Add this
        '--single-process',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
      ]
    });

    console.log("Created new browser");
  }
  return browserInstance;
};

export const convertHTMLtoPDF = async (html: string) => {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {

    await page.setContent(html);

    // Wait for fonts to load
    await page.evaluateHandle('document.fonts.ready');

    // Generate PDF from the page content
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: "0.5in", bottom: "0.5in" },
      preferCSSPageSize: true
    });

    return pdfBuffer;
  } finally {
    await page.close();
  }
}

process.on('SIGTERM', async () => {
  if (browserInstance) {
    await browserInstance.close();
  }
});