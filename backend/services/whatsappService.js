const twilio = require('twilio');

const sendWhatsAppMessage = async (phone, message) => {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      console.log('WhatsApp not configured. Message would be:', message);
      return { success: false, message: 'WhatsApp not configured' };
    }

    const client = twilio(accountSid, authToken);
    const result = await client.messages.create({
      body: message,
      from: fromNumber,
      to: `whatsapp:${phone}`,
    });

    return { success: true, messageId: result.sid };
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return { success: false, error: error.message };
  }
};

const sendDebtReminder = async (customer, totalDebt) => {
  const message = `Hi ${customer.name}, Your outstanding debt is Rs ${totalDebt.toFixed(0)}. Please arrange payment at your earliest convenience. Thank you!`;
  return sendWhatsAppMessage(customer.whatsappNumber, message);
};

const sendReceiptReminder = async (customer, transactionId, amount) => {
  const message = `Thank you for your purchase ${customer.name}! Transaction ID: ${transactionId}, Amount: Rs ${amount.toFixed(0)}. Download your receipt from the app.`;
  return sendWhatsAppMessage(customer.whatsappNumber, message);
};

module.exports = {
  sendWhatsAppMessage,
  sendDebtReminder,
  sendReceiptReminder,
};
