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

  const green      = [21, 128, 61]   as [number, number, number]
  const darkGreen  = [15, 90, 43]    as [number, number, number]
  const lightGreen = [240, 253, 244] as [number, number, number]
  const gray       = [120, 120, 120] as [number, number, number]
  const darkGray   = [40, 40, 40]    as [number, number, number]
  const red        = [185, 28, 28]   as [number, number, number]

  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const isOverdue = invoice.status === 'overdue'
  const isPaid    = invoice.status === 'paid'

  // ── Header bar ──────────────────────────────────────────────────────────
  doc.setFillColor(...darkGreen)
  doc.rect(0, 0, pageW, 72, 'F')

  // Thin accent line below header
  doc.setFillColor(...green)
  doc.rect(0, 72, pageW, 4, 'F')

  // Company name
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('EDGECOMBE ENTERPRISES', 40, 34)

  // Tagline
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(180, 230, 195)
  doc.text('Landscape & Hardscape · Rochester, NY · Est. 1997', 40, 52)

  // INVOICE label top-right
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('INVOICE', pageW - 40, 34, { align: 'right' })
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(180, 230, 195)
  doc.text(invoice.invoice_number, pageW - 40, 52, { align: 'right' })

  // ── Company info (left) & Invoice meta (right) ───────────────────────────
  let y = 100
  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...gray)
  if (company.address) {
    company.address.split('\n').forEach(line => { doc.text(line, 40, y); y += 12 })
  }
  if (company.phone) { doc.text(company.phone, 40, y); y += 12 }
  if (company.email) { doc.text(company.email, 40, y) }

  // Invoice meta table (right-aligned)
  const metaRight = pageW - 40
  const metaLabelX = pageW - 190
  const dueDateColor = isOverdue ? red : darkGray
  const rows: [string, string, [number,number,number]][] = [
    ['Invoice Date:',   format(new Date(invoice.invoice_date), 'MMMM d, yyyy'), darkGray],
    ['Due Date:',       format(new Date(invoice.due_date), 'MMMM d, yyyy'),     dueDateColor],
    ['Payment Terms:',  invoice.payment_terms,                                   darkGray],
  ]
  rows.forEach(([label, val, color], i) => {
    const rowY = 100 + i * 16
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(...gray)
    doc.text(label, metaLabelX, rowY)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...color)
    doc.text(val, metaRight, rowY, { align: 'right' })
  })

  // Status badge
  const badgeY = 100 + rows.length * 16 + 6
  const statusColor = isPaid ? green : isOverdue ? red : [37, 99, 235] as [number,number,number]
  doc.setFillColor(...statusColor)
  doc.roundedRect(metaLabelX, badgeY - 11, metaRight - metaLabelX, 16, 3, 3, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text(invoice.status.toUpperCase(), (metaLabelX + metaRight) / 2, badgeY, { align: 'center' })

  // ── Divider ──────────────────────────────────────────────────────────────
  doc.setDrawColor(...lightGreen)
  doc.setLineWidth(1)
  doc.line(40, 170, pageW - 40, 170)

  // ── Bill To ──────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...green)
  doc.text('BILL TO', 40, 190)

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...darkGray)
  doc.setFontSize(11)
  doc.text(invoice.client_name, 40, 206)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...gray)
  let billY = 220
  if (invoice.service_address) {
    invoice.service_address.split('\n').forEach(line => { doc.text(line, 40, billY); billY += 12 })
  }
  if (invoice.client_phone) { doc.text(invoice.client_phone, 40, billY); billY += 12 }
  if (invoice.client_email) { doc.text(invoice.client_email, 40, billY) }

  // ── Line items table ─────────────────────────────────────────────────────
  autoTable(doc, {
    startY: 278,
    head: [['Description', 'Qty', 'Unit Price', 'Amount']],
    body: invoice.line_items.map(item => [
      item.description,
      item.quantity.toString(),
      formatCurrency(item.unit_price),
      formatCurrency(item.quantity * item.unit_price),
    ]),
    headStyles: {
      fillColor: darkGreen,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      cellPadding: { top: 7, bottom: 7, left: 6, right: 6 },
    },
    bodyStyles: { fontSize: 8.5, textColor: darkGray, cellPadding: 6 },
    alternateRowStyles: { fillColor: [248, 252, 249] as [number,number,number] },
    columnStyles: {
      0: { cellWidth: 265 },
      1: { cellWidth: 55,  halign: 'center' },
      2: { cellWidth: 100, halign: 'right' },
      3: { cellWidth: 100, halign: 'right' },
    },
    margin: { left: 40, right: 40 },
    theme: 'grid',
    tableLineColor: [220, 228, 220],
    tableLineWidth: 0.4,
  })

  // ── Totals ───────────────────────────────────────────────────────────────
  const finalY = ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? 400) + 24
  const totalsX    = pageW - 210
  const totalsValX = pageW - 40

  // Subtotal row
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...gray)
  doc.text('Subtotal', totalsX, finalY)
  doc.text(formatCurrency(invoice.subtotal), totalsValX, finalY, { align: 'right' })

  // Tax row (only if applicable)
  if (invoice.tax_amount > 0) {
    doc.text(`Tax (${(invoice.tax_rate * 100).toFixed(1)}%)`, totalsX, finalY + 16)
    doc.text(formatCurrency(invoice.tax_amount), totalsValX, finalY + 16, { align: 'right' })
  }

  // Separator line
  const sepY = finalY + (invoice.tax_amount > 0 ? 28 : 12)
  doc.setDrawColor(...green)
  doc.setLineWidth(0.75)
  doc.line(totalsX, sepY, totalsValX, sepY)

  // Total row
  const totalY = sepY + 16
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...darkGreen)
  doc.text('Total Due', totalsX, totalY)
  doc.text(formatCurrency(invoice.total), totalsValX, totalY, { align: 'right' })

  // ── Notes ────────────────────────────────────────────────────────────────
  if (invoice.notes) {
    const notesY = totalY + 36
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...green)
    doc.text('NOTES', 40, notesY)
    doc.setDrawColor(...lightGreen)
    doc.setLineWidth(0.5)
    doc.line(40, notesY + 4, pageW - 40, notesY + 4)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...gray)
    doc.setFontSize(8.5)
    const splitNotes = doc.splitTextToSize(invoice.notes, pageW - 80)
    doc.text(splitNotes, 40, notesY + 16)
  }

  // ── Footer ───────────────────────────────────────────────────────────────
  doc.setDrawColor(...lightGreen)
  doc.setLineWidth(1)
  doc.line(40, pageH - 48, pageW - 40, pageH - 48)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...gray)
  doc.text('Thank you for choosing Edgecombe Enterprises!', pageW / 2, pageH - 32, { align: 'center' })
  doc.text('(585) 466-1222  ·  info@edgecombeenterprises.com  ·  edgecombeenterprises.com', pageW / 2, pageH - 18, { align: 'center' })

  // ── PAID stamp ───────────────────────────────────────────────────────────
  if (isPaid) {
    doc.saveGraphicsState()
    doc.setGState(new (doc as any).GState({ opacity: 0.12 }))
    doc.setTextColor(...green)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(110)
    ;(doc as any).text('PAID', pageW / 2, pageH / 2 + 30, {
      align: 'center',
      angle: 35,
    })
    doc.restoreGraphicsState()
  }

  return Buffer.from(doc.output('arraybuffer') as ArrayBuffer)
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}
