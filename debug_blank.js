import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  
  try {
    await page.goto('http://127.0.0.1:8000/admin/job-titles', { waitUntil: 'networkidle2' });
  } catch(e) {
    console.log('Nav error:', e.message);
  }
  
  await browser.close();
})();
