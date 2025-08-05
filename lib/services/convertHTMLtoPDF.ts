import puppeteer from 'puppeteer';

export const convertHTMLtoPDF = async (html: string) => {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--hide-scrollbars',
      '--disable-web-security',
      '--font-render-hinting=none'
    ]
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