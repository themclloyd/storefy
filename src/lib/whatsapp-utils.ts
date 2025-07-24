import { formatCurrency } from './taxUtils';

export interface WhatsAppOrderData {
  orderCode: string;
  customerName: string;
  customerPhone: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    variants?: Record<string, string>;
  }>;
  subtotal: number;
  taxAmount: number;
  total: number;
  storeName: string;
  currency: string;
}

/**
 * Generate WhatsApp message for order notification
 */
export function generateOrderWhatsAppMessage(orderData: WhatsAppOrderData): string {
  const formatPrice = (price: number) => formatCurrency(price, orderData.currency);
  
  let message = `🛍️ *NEW ORDER RECEIVED*\n\n`;
  message += `📋 *Order Code:* ${orderData.orderCode}\n`;
  message += `🏪 *Store:* ${orderData.storeName}\n\n`;
  
  // Customer Information
  message += `👤 *Customer Details:*\n`;
  message += `• Name: ${orderData.customerName}\n`;
  message += `• Phone: ${orderData.customerPhone}\n`;
  message += `\n`;
  
  // Order Items
  message += `📦 *Order Items:*\n`;
  orderData.items.forEach((item, index) => {
    message += `${index + 1}. ${item.name}\n`;
    message += `   Qty: ${item.quantity} × ${formatPrice(item.price)}\n`;
    
    // Add variants if any
    if (item.variants && Object.keys(item.variants).length > 0) {
      const variantText = Object.entries(item.variants)
        .map(([type, value]) => `${type}: ${value}`)
        .join(', ');
      message += `   Options: ${variantText}\n`;
    }
    
    message += `   Total: ${formatPrice(item.price * item.quantity)}\n\n`;
  });
  
  // Order Summary
  message += `💰 *Order Summary:*\n`;
  message += `• Subtotal: ${formatPrice(orderData.subtotal)}\n`;
  if (orderData.taxAmount > 0) {
    message += `• Tax: ${formatPrice(orderData.taxAmount)}\n`;
  }
  message += `• *Total: ${formatPrice(orderData.total)}*\n\n`;
  
  message += `⏰ Order placed: ${new Date().toLocaleString()}\n\n`;
  message += `Please confirm this order and contact the customer for payment and delivery arrangements.\n\n`;
  message += `Reply with the order code *${orderData.orderCode}* to confirm.`;
  
  return message;
}

/**
 * Generate WhatsApp message for customer inquiry
 */
export function generateCustomerInquiryMessage(data: {
  customerName: string;
  orderCode: string;
  storeName: string;
  total: number;
  currency: string;
}): string {
  const formatPrice = (price: number) => formatCurrency(price, data.currency);
  
  let message = `Hi! I've placed an order on your showcase:\n\n`;
  message += `Order Code: *${data.orderCode}*\n`;
  message += `Total: ${formatPrice(data.total)}\n\n`;
  message += `Please confirm my order. Thank you!`;
  
  return message;
}

/**
 * Generate WhatsApp message for product inquiry
 */
export function generateProductInquiryMessage(data: {
  productName: string;
  storeName: string;
  price?: number;
  currency: string;
  customerMessage?: string;
}): string {
  let message = `Hi! I'm interested in "${data.productName}"`;
  
  if (data.price) {
    const formatPrice = (price: number) => formatCurrency(price, data.currency);
    message += ` (${formatPrice(data.price)})`;
  }
  
  message += ` from ${data.storeName}.\n\n`;
  
  if (data.customerMessage) {
    message += `${data.customerMessage}\n\n`;
  }
  
  message += `Is this item available?`;
  
  return message;
}

/**
 * Generate WhatsApp message for cart inquiry
 */
export function generateCartInquiryMessage(data: {
  storeName: string;
  itemCount: number;
  total: number;
  currency: string;
}): string {
  const formatPrice = (price: number) => formatCurrency(price, data.currency);
  
  let message = `Hi! I'm interested in ordering from ${data.storeName}.\n\n`;
  message += `I have ${data.itemCount} item${data.itemCount !== 1 ? 's' : ''} in my cart `;
  message += `totaling ${formatPrice(data.total)}.\n\n`;
  message += `Can you help me place an order?`;
  
  return message;
}

/**
 * Clean and format phone number for WhatsApp
 */
export function cleanPhoneNumber(phone: string): string {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');
  
  // Add country code if missing (assuming international format)
  if (cleaned.length === 10 && !cleaned.startsWith('1')) {
    // Assuming US/Canada if 10 digits
    return `1${cleaned}`;
  }
  
  return cleaned;
}

/**
 * Generate WhatsApp URL
 */
export function generateWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = cleanPhoneNumber(phone);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

/**
 * Open WhatsApp with message
 */
export function openWhatsApp(phone: string, message: string): void {
  const url = generateWhatsAppUrl(phone, message);
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Check if WhatsApp is available (basic check)
 */
export function isWhatsAppAvailable(): boolean {
  // Basic check - in a real app you might want more sophisticated detection
  return typeof window !== 'undefined' && 'navigator' in window;
}

/**
 * Format order items for display
 */
export function formatOrderItemsText(items: WhatsAppOrderData['items'], currency: string): string {
  return items.map((item, index) => {
    let text = `${index + 1}. ${item.name} (${item.quantity}x)`;
    
    if (item.variants && Object.keys(item.variants).length > 0) {
      const variants = Object.entries(item.variants)
        .map(([type, value]) => `${type}: ${value}`)
        .join(', ');
      text += ` - ${variants}`;
    }
    
    return text;
  }).join('\n');
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phone: string): boolean {
  const cleaned = cleanPhoneNumber(phone);
  // Basic validation - should be at least 10 digits
  return cleaned.length >= 10 && cleaned.length <= 15;
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = cleanPhoneNumber(phone);
  
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    // US/Canada format: +1 (XXX) XXX-XXXX
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length === 10) {
    // US format without country code: (XXX) XXX-XXXX
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  // International format: +XXX XXXX XXXX
  return `+${cleaned}`;
}
