import puppeteer from 'puppeteer';

async function testPdf() {
  console.log('Attempting Puppeteer launch...');
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    console.log('Browser launched successfully!');
    const page = await browser.newPage();
    await page.setContent('<h1>Test PDF</h1>');
    const pdf = await page.pdf({ format: 'A4' });
    console.log('PDF generated successfully, size in bytes:', pdf.length);
    await browser.close();
  } catch (err) {
    console.error('Puppeteer Launch/PDF Error:', err);
  }
}

testPdf();
