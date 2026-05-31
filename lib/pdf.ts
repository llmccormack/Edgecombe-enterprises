import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import { Invoice } from '@/types'

interface CompanyInfo {
  address: string
  phone: string
  email: string
}

export function generateInvoicePDF(invoice: Invoice, company: CompanyInfo): Buffer {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' })

  const green = [21, 128, 61] as [number, number, number]
  const earth = [107, 70, 40] as [number, number, number]
  const lightGreen = [240, 253, 244] as [number, number, number]
  const gray = [100, 100, 100] as [number, number, number]
  const darkGray = [40, 40, 40] as [number, number, number]

  const pageW = doc.internal.pageSize.getWidth()

  // Header bar
  doc.setFillColor(...green)
  doc.rect(0, 0, pageW, 80, 'F')

  // Company name
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(26)
  doc.setFont('helvetica', 'bold')
  doc.text('EDGECOMBE ENTERPRISES', 40, 38)

  // Tagline
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text('Transform Your Yard · Rochester, NY', 40, 58)

  // INVOICE label top-right
  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.text('INVOICE', pageW - 40, 38, { align: 'right' })
  doc.setFontSize(13)
  doc.setFont('helvetica', 'normal')
  doc.text(invoice.invoice_number, pageW - 40, 60, { align: 'right' })

  // Company info block (left)
  doc.setTextColor(...gray)
  doc.setFontSize(9)
  let y = 105
  if (company.address) {
    company.address.split('\n').forEach(line => {
      doc.text(line, 40, y)
      y += 13
    })
  }
  if (company.phone) { doc.text(company.phone, 40, y); y += 13 }
  if (company.email) { doc.text(company.email, 40, y) }

  // Invoice meta (right)
  doc.setTextColor(...darkGray)
  doc.setFontSize(9)
  const metaRight = pageW - 40
  const metaX = pageW - 200
  const rows: [string, string][] = [
    ['Invoice Date:', format(new Date(invoice.invoice_date), 'MMMM d, yyyy')],
    ['Due Date:', format(new Date(invoice.due_date), 'MMMM d, yyyy')],
    ['Payment Terms:', invoice.payment_terms],
    ['Status:', invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)],
  ]
  rows.forEach(([label, val], i) => {
    doc.setFont('helvetica', 'bold')
    doc.text(label, metaX, 100 + i * 16)
    doc.setFont('helvetica', 'normal')
    doc.text(val, metaRight, 100 + i * 16, { align: 'right' })
  })

  // Divider
  doc.setDrawColor(...green)
  doc.setLineWidth(1.5)
  doc.line(40, 175, pageW - 40, 175)

  // Bill To
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...green)
  doc.text('BILL TO', 40, 195)

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...darkGray)
  doc.setFontSize(11)
  doc.text(invoice.client_name, 40, 212)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...gray)
  let billY = 226
  if (invoice.service_address) {
    invoice.service_address.split('\n').forEach(line => {
      doc.text(line, 40, billY); billY += 13
    })
  }
  if (invoice.client_phone) { doc.text(invoice.client_phone, 40, billY); billY += 13 }
  if (invoice.client_email) { doc.text(invoice.client_email, 40, billY) }

  // Line items table
  const tableStartY = 290
  autoTable(doc, {
    startY: tableStartY,
    head: [['Description', 'Qty', 'Unit Price', 'Amount']],
    body: invoice.line_items.map(item => [
      item.description,
      item.quantity.toString(),
      formatCurrency(item.unit_price),
      formatCurrency(item.quantity * item.unit_price),
    ]),
    headStyles: {
      fillColor: green,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: { fontSize: 9, textColor: darkGray },
    alternateRowStyles: { fillColor: lightGreen },
    columnStyles: {
      0: { cellWidth: 260 },
      1: { cellWidth: 60, halign: 'center' },
      2: { cellWidth: 100, halign: 'right' },
      3: { cellWidth: 100, halign: 'right' },
    },
    margin: { left: 40, right: 40 },
    theme: 'grid',
    tableLineColor: [220, 220, 220],
    tableLineWidth: 0.5,
  })

  // Totals block
  const finalY = ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? 400) + 20
  const totalsX = pageW - 220
  const totalsValX = pageW - 40

  doc.setFontSize(9)
  doc.setTextColor(...gray)
  doc.setFont('helvetica', 'normal')
  doc.text('Subtotal:', totalsX, finalY)
  doc.text(formatCurrency(invoice.subtotal), totalsValX, finalY, { align: 'right' })

  if (invoice.tax_amount > 0) {
    doc.text(`Tax (${(invoice.tax_rate * 100).toFixed(1)}%):`, totalsX, finalY + 16)
    doc.text(formatCurrency(invoice.tax_amount), totalsValX, finalY + 16, { align: 'right' })
  }

  // Total highlight box
  const totalBoxY = finalY + (invoice.tax_amount > 0 ? 30 : 14)
  doc.setFillColor(...green)
  doc.roundedRect(totalsX - 10, totalBoxY - 14, totalsValX - totalsX + 20, 26, 4, 4, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('TOTAL DUE:', totalsX, totalBoxY + 2)
  doc.text(formatCurrency(invoice.total), totalsValX, totalBoxY + 2, { align: 'right' })

  // Notes
  if (invoice.notes) {
    const notesY = totalBoxY + 50
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...earth)
    doc.text('NOTES', 40, notesY)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...gray)
    doc.setFontSize(9)
    const splitNotes = doc.splitTextToSize(invoice.notes, pageW - 80)
    doc.text(splitNotes, 40, notesY + 14)
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 40
  doc.setFillColor(...lightGreen)
  doc.rect(0, footerY - 10, pageW, 50, 'F')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...gray)
  doc.text('Thank you for choosing Edgecombe Enterprises!', pageW / 2, footerY + 5, { align: 'center' })
  doc.text('Transform Your Yard · Serving Rochester, NY & Surrounding Areas · Est. 1997', pageW / 2, footerY + 18, { align: 'center' })

  return Buffer.from(doc.output('arraybuffer') as ArrayBuffer)
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}
