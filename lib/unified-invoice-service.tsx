"use client"

import { pdf } from "@react-pdf/renderer"
import { getTemplateComponent } from "@/features/invoice-templates/templates"
import { DEFAULT_TEMPLATE } from "@/features/invoice-templates/template-registry"
import type { InvoiceData, TemplateId, InvoiceCompanyInfo } from "@/features/invoice-templates/types"
import { buildTermsString } from "@/lib/validations/company.schema"

const STORAGE_KEY = "selected-invoice-template"

// Get selected template from localStorage
function getSelectedTemplateId(): TemplateId {
  if (typeof window === "undefined") return DEFAULT_TEMPLATE
  const saved = localStorage.getItem(STORAGE_KEY)
  return (saved as TemplateId) || DEFAULT_TEMPLATE
}

// Company info interface matching what job cards store
interface CompanyInfo {
  name: string
  tagline?: string
  phone: string
  alternatePhone?: string
  email?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  gstNumber?: string
  logoUrl?: string | null
  website?: string
  selectedTerms?: string[]
  customTerms?: string[]
  termsAndConditions?: string
}

// Job card data structure
interface JobCardData {
  id: string
  customerName?: string
  phone?: string
  alternatePhone?: string
  address?: string
  deviceInfo?: {
    type: string
    brand: string
    model: string
  }
  imei?: string
  condition?: string
  accessories?: string
  problemDescription?: string
  technicianDiagnosis?: string
  requiredParts?: string[]
  costEstimate?: {
    laborCost?: number
    partsCost?: number
    serviceCost?: number
    total?: number
  }
  advanceReceived?: number
  deliveryDate?: string | Date
  status?: string
  createdAt?: string | Date
  notes?: string
  companyInfo?: CompanyInfo
}

// Helper to format full address
function formatFullAddress(company: CompanyInfo): string {
  const parts = [company.address]
  if (company.city) parts.push(company.city)
  if (company.state) parts.push(company.state)
  if (company.pincode) parts.push(`- ${company.pincode}`)
  return parts.filter(Boolean).join(", ") || ""
}

// Safe number conversion
function safeNumber(value: unknown): number {
  if (typeof value === "number" && !isNaN(value)) return value
  if (typeof value === "string") {
    const parsed = parseFloat(value)
    return isNaN(parsed) ? 0 : parsed
  }
  return 0
}

// Format currency
function formatCurrency(amount: number): string {
  return `₹${amount.toFixed(2)}`
}

// Default company info fallback
const DEFAULT_COMPANY_INFO: CompanyInfo = {
  name: "Mobile Service Center",
  tagline: "Professional Device Repair Services",
  phone: "+91 98765 43210",
  email: "info@mobileservice.com",
  address: "123, Main Street, City - 600001",
}

// Get company info with fallback
function getCompanyInfo(data: JobCardData): CompanyInfo {
  if (data.companyInfo && data.companyInfo.name) {
    return data.companyInfo
  }
  return DEFAULT_COMPANY_INFO
}

// Convert job card data to InvoiceData format for templates
function jobCardToInvoiceData(jobCard: JobCardData): InvoiceData {
  const company = getCompanyInfo(jobCard)
  const costs = jobCard.costEstimate || {}
  const laborCost = safeNumber(costs.laborCost)
  const partsCost = safeNumber(costs.partsCost)
  const serviceCost = safeNumber(costs.serviceCost)
  const subtotal = laborCost + partsCost + serviceCost
  const total = safeNumber(costs.total) || subtotal
  const advance = safeNumber(jobCard.advanceReceived)
  const balance = total - advance

  const formatDate = (date: string | Date | undefined): string => {
    if (!date) return new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    const d = new Date(date)
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
  }

  const companyData: InvoiceCompanyInfo = {
    name: company.name,
    address: formatFullAddress(company),
    phone: company.phone,
    email: company.email,
    website: company.website,
    gstNumber: company.gstNumber,
    logoUrl: company.logoUrl || undefined,
  }

  return {
    invoiceNumber: `INV-${jobCard.id.slice(0, 8).toUpperCase()}`,
    invoiceDate: formatDate(jobCard.createdAt),
    company: companyData,
    customer: {
      name: jobCard.customerName || "Customer",
      phone: jobCard.phone || "",
      alternatePhone: jobCard.alternatePhone,
      address: jobCard.address,
    },
    device: jobCard.deviceInfo ? {
      type: jobCard.deviceInfo.type,
      brand: jobCard.deviceInfo.brand,
      model: jobCard.deviceInfo.model,
      imei: jobCard.imei,
      condition: jobCard.condition,
      accessories: jobCard.accessories,
    } : undefined,
    problemDescription: jobCard.problemDescription,
    diagnosis: jobCard.technicianDiagnosis,
    costs: {
      laborCost,
      partsCost,
      serviceCost,
      subtotal,
      total,
    },
    advanceReceived: advance,
    balanceDue: balance,
    paymentStatus: advance >= total ? "paid" : advance > 0 ? "partial" : "pending",
    deliveryDate: jobCard.deliveryDate ? formatDate(jobCard.deliveryDate) : undefined,
    notes: jobCard.notes,
    // Build terms from structured data or fall back to legacy string
    termsAndConditions: (company.selectedTerms?.length || company.customTerms?.length)
      ? buildTermsString(company.selectedTerms, company.customTerms)
      : company.termsAndConditions,
  }
}

// Generate PDF blob using selected template
export async function generateInvoiceBlob(jobCard: JobCardData): Promise<Blob> {
  const templateId = getSelectedTemplateId()
  const TemplateComponent = getTemplateComponent(templateId)
  const invoiceData = jobCardToInvoiceData(jobCard)
  
  const doc = <TemplateComponent data={invoiceData} />
  const blob = await pdf(doc).toBlob()
  return blob
}

// Download single invoice
export async function downloadInvoice(jobCard: JobCardData): Promise<void> {
  try {
    const blob = await generateInvoiceBlob(jobCard)
    const fileName = `Invoice_${jobCard.id.slice(0, 8)}_${jobCard.customerName?.replace(/\s+/g, "_") || "Customer"}.pdf`
    
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = fileName
    link.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error("Error generating invoice:", error)
    throw error
  }
}

// Download multiple invoices
export async function downloadMultipleInvoices(jobCards: JobCardData[]): Promise<void> {
  for (let i = 0; i < jobCards.length; i++) {
    await new Promise(resolve => setTimeout(resolve, i * 500)) // Stagger downloads
    await downloadInvoice(jobCards[i])
  }
}

// Generate invoice image for WhatsApp sharing
async function generateInvoiceImage(jobCard: JobCardData): Promise<Blob> {
  const pdfBlob = await generateInvoiceBlob(jobCard)
  
  // Dynamically import pdfjs-dist
  const pdfjsLib = await import("pdfjs-dist")
  
  // Set up the worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
  
  // Load the PDF
  const arrayBuffer = await pdfBlob.arrayBuffer()
  const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  
  // Get the first page
  const page = await pdfDoc.getPage(1)
  
  // Set scale for good quality image
  const scale = 2
  const viewport = page.getViewport({ scale })
  
  // Create canvas
  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d")!
  canvas.width = viewport.width
  canvas.height = viewport.height
  
  // Render the page
  await page.render({
    canvasContext: context,
    viewport,
    canvas,
  }).promise
  
  // Convert canvas to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error("Failed to create image blob"))
    }, "image/png", 0.95)
  })
}

// Share on WhatsApp with template-styled invoice
export async function shareOnWhatsApp(jobCard: JobCardData): Promise<void> {
  const company = getCompanyInfo(jobCard)
  const costs = jobCard.costEstimate || {}
  const total = safeNumber(costs.total)
  const advance = safeNumber(jobCard.advanceReceived)
  const balance = total - advance
  const status = jobCard.status || "pending"
  const statusLabel = status === "delivered" ? "DELIVERED ✅" : status === "ready-for-delivery" ? "READY 📦" : "PENDING ⏳"

  try {
    // Generate invoice image from PDF
    const imageBlob = await generateInvoiceImage(jobCard)
    
    // Try to copy image to clipboard
    let copiedToClipboard = false
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": imageBlob })
      ])
      copiedToClipboard = true
    } catch (err) {
      console.log("Clipboard copy failed, will download instead:", err)
    }

    // Download the image as backup
    const fileName = `Invoice_${jobCard.id.slice(0, 8)}.png`
    const url = URL.createObjectURL(imageBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = fileName
    link.click()
    URL.revokeObjectURL(url)

    // Prepare WhatsApp message
    const message = copiedToClipboard
      ? `*${company.name}*

📄 *SERVICE INVOICE*

*Customer:* ${jobCard.customerName || "N/A"}
*Device:* ${jobCard.deviceInfo?.brand || ""} ${jobCard.deviceInfo?.model || ""}
*Status:* ${statusLabel}

💰 *Total:* ${formatCurrency(total)}
💵 *Balance:* ${formatCurrency(balance)}

📷 *Invoice image copied!* Just press Ctrl+V (or Cmd+V) to paste it here!

📞 ${company.phone}`
      : `*${company.name}*

📄 *SERVICE INVOICE*

*Customer:* ${jobCard.customerName || "N/A"}
*Device:* ${jobCard.deviceInfo?.brand || ""} ${jobCard.deviceInfo?.model || ""}
*Status:* ${statusLabel}

💰 *Total:* ${formatCurrency(total)}
💵 *Balance:* ${formatCurrency(balance)}

📷 _Invoice image downloaded - please attach it from your downloads!_

📞 ${company.phone}`

    const encodedMessage = encodeURIComponent(message)
    const phoneNumber = jobCard.phone?.replace(/\D/g, "") || ""
    
    // Format phone number for India
    let formattedPhone = phoneNumber
    if (phoneNumber && phoneNumber.length === 10) {
      formattedPhone = "91" + phoneNumber
    }
    
    // Detect if device is mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
    
    let whatsappUrl: string
    if (isMobile) {
      whatsappUrl = formattedPhone
        ? `whatsapp://send?phone=${formattedPhone}&text=${encodedMessage}`
        : `whatsapp://send?text=${encodedMessage}`
    } else {
      whatsappUrl = formattedPhone
        ? `https://web.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMessage}`
        : `https://web.whatsapp.com/send?text=${encodedMessage}`
    }

    // Open WhatsApp after a small delay
    setTimeout(() => {
      window.open(whatsappUrl, "_blank")
    }, 500)
    
  } catch (error) {
    console.error("Error generating invoice image:", error)
    // Fallback to just opening WhatsApp with text
    const message = `Invoice for ${jobCard.customerName || "Customer"}\nTotal: ${formatCurrency(total)}\nBalance: ${formatCurrency(balance)}`
    const encodedMessage = encodeURIComponent(message)
    window.open(`https://web.whatsapp.com/send?text=${encodedMessage}`, "_blank")
  }
}
