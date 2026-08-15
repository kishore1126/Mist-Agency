import http from 'http';

async function testApi() {
  console.log('Testing GET http://localhost:5000/api/template ...');
  const templateRes = await fetch('http://localhost:5000/api/template');
  const template = await templateRes.json();
  console.log('Template fetched successfully:', template.companyName, template.gstin);

  console.log('Testing GET http://localhost:5000/api/invoices ...');
  const invoicesRes = await fetch('http://localhost:5000/api/invoices');
  const invoices = await invoicesRes.json();
  console.log(`Invoices fetched: ${invoices.length} records.`);

  if (invoices.length > 0) {
    const inv = invoices[0];
    console.log('Ref Invoice Number:', inv.invoiceNumber);
    console.log('Total Taxable:', inv.summary.totalTaxableAmount);
    console.log('Total Tax / IGST:', inv.summary.totalTax);
    console.log('Grand Total:', inv.summary.totalAmountAfterTax);
    console.log('Amount in words:', inv.summary.amountInWords);
  }
}

testApi().catch(console.error);
