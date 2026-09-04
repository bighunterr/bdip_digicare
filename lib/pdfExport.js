'use client';
export async function exportElementToPDF(elementId, filename = 'digicare-report.pdf') {
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf')
  ]);
  const el = document.getElementById(elementId);
  if (!el) throw new Error('Element not found');
  // Wait a tick for charts to fully paint
  await new Promise(r => setTimeout(r, 400));
  const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false });
  const img = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const imgW = pageW - 20;
  const imgH = (canvas.height * imgW) / canvas.width;
  // Header
  pdf.setFillColor(15, 23, 42);
  pdf.rect(0, 0, pageW, 18, 'F');
  pdf.setTextColor(255,255,255);
  pdf.setFontSize(12);
  pdf.text('DIGICARE BDIP – Executive Report', 10, 12);
  pdf.setFontSize(9);
  pdf.text(new Date().toLocaleString(), pageW - 60, 12);
  // Image
  let y = 22;
  let remaining = imgH;
  let position = 0;
  if (imgH <= pageH - y) {
    pdf.addImage(img, 'PNG', 10, y, imgW, imgH);
  } else {
    // Multi-page: slice canvas
    while (remaining > 0) {
      const sliceH = Math.min(remaining, pageH - y);
      pdf.addImage(img, 'PNG', 10, y - position, imgW, imgH);
      remaining -= (pageH - y);
      position += (pageH - y);
      if (remaining > 0) { pdf.addPage(); y = 10; }
    }
  }
  pdf.save(filename);
}
