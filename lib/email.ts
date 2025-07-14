import nodemailer from 'nodemailer'

// Create transporter with Gmail
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD ,
  },
  tls: {
    rejectUnauthorized: false
  }
})

export async function sendPaymentConfirmation(
  buyerEmail: string,
  sellerEmail: string,
  productName: string,
  amountUSD: number,
  amountCrypto: number,
  currency: string,
  transactionHash: string,
  invoicePDF?: string
) {
  const attachments = invoicePDF ? [{
    filename: 'invoice.pdf',
    content: invoicePDF.split(',')[1], // Remove data:application/pdf;base64, prefix
    encoding: 'base64'
  }] : undefined

  try {
    // Email to buyer
   
    await transporter.sendMail({
      from: `"CryptoPayLink" <${process.env.GMAIL_USER}>`,
      to: buyerEmail,
      subject: `Payment Confirmed - ${productName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">Payment Confirmed!</h2>
          <p>Your payment for <strong>${productName}</strong> has been successfully verified.</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Payment Details</h3>
            <p><strong>Product:</strong> ${productName}</p>
            <p><strong>Amount:</strong> $${amountUSD} USD (${amountCrypto} ${currency})</p>
            <p><strong>Transaction Hash:</strong> <code>${transactionHash}</code></p>
          </div>
          
          <p>Your invoice is attached to this email.</p>
          <p>Thank you for your purchase!</p>
        </div>
      `,
      attachments
    })

    // Email to seller
    await transporter.sendMail({
      from: `"CryptoPayLink" <${process.env.GMAIL_USER}>`,
      to: sellerEmail,
      subject: `New Payment Received - ${productName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">New Payment Received!</h2>
          <p>You've received a payment for <strong>${productName}</strong>.</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Payment Details</h3>
            <p><strong>Product:</strong> ${productName}</p>
            <p><strong>Amount:</strong> $${amountUSD} USD (${amountCrypto} ${currency})</p>
            <p><strong>Buyer:</strong> ${buyerEmail}</p>
            <p><strong>Transaction Hash:</strong> <code>${transactionHash}</code></p>
          </div>
          
          <p>Login to your dashboard to view more details.</p>
        </div>
      `,
      attachments
    })

    console.log('Emails sent successfully!')
  } catch (error) {
    console.error('Error sending emails:', error)
    throw error
  }
}