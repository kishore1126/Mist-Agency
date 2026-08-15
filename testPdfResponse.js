async function testPdfBinary() {
  console.log('Sending PDF generation request to http://localhost:5000/api/invoices/pdf ...');
  const res = await fetch('http://localhost:5000/api/invoices/pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      htmlContent: '<html><body><h1>MIST AGENCIES TEST INVOICE PDF</h1></body></html>'
    })
  });

  console.log('HTTP Status Code:', res.status);
  console.log('Content-Type Header:', res.headers.get('content-type'));

  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  console.log('PDF Output Buffer Size (bytes):', buffer.length);

  const pdfHeader = buffer.subarray(0, 8).toString('utf-8');
  console.log('First 8 bytes of output file:', JSON.stringify(pdfHeader));

  if (pdfHeader.startsWith('%PDF-')) {
    console.log('✅ PDF VALIDATION SUCCESS: Valid binary PDF file generated!');
  } else {
    console.error('❌ PDF VALIDATION FAILED: Not a valid PDF binary.');
  }
}

testPdfBinary().catch(console.error);
