const crypto = require('crypto');
const axios = require('axios');

const momoConfig = {
  accessKey: process.env.MOMO_ACCESS_KEY,
  secretKey: process.env.MOMO_SECRET_KEY,
  partnerCode: process.env.MOMO_PARTNER_CODE,
  redirectUrl: process.env.MOMO_REDIRECT_URL || 'http://localhost:3000/payment-result',
  ipnUrl: process.env.MOMO_IPN_URL || 'http://localhost:5004/api/payments/momo/ipn',
  endpoint: process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create'
};

const buildSignature = (rawSignature, secretKey) => {
  return crypto
    .createHmac('sha256', secretKey)
    .update(rawSignature)
    .digest('hex');
};

const createMoMoPayment = async (amount, orderInfo, orderId, extraData = '') => {
  const requestId = `${Date.now()}_${orderId}`;
  const requestType = 'captureWallet';
  const lang = 'vi';

  // Tạo raw signature theo đúng thứ tự alphabet
  const rawSignature = `accessKey=${momoConfig.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${momoConfig.ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${momoConfig.partnerCode}&redirectUrl=${momoConfig.redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

  console.log('Raw Signature:', rawSignature);

  const signature = buildSignature(rawSignature, momoConfig.secretKey);
  console.log('Signature:', signature);

  const requestBody = {
    partnerCode: momoConfig.partnerCode,
    accessKey: momoConfig.accessKey,
    requestId: requestId,
    amount: amount.toString(),
    orderId: orderId,
    orderInfo: orderInfo,
    redirectUrl: momoConfig.redirectUrl,
    ipnUrl: momoConfig.ipnUrl,
    extraData: extraData,
    requestType: requestType,
    signature: signature,
    lang: lang
  };

  console.log('MoMo Request Body:', JSON.stringify(requestBody, null, 2));

  try {
    const response = await axios.post(momoConfig.endpoint, requestBody, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('MoMo Response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('MoMo API Error:', error.response?.data || error.message);
    throw new Error('Failed to create MoMo payment: ' + (error.response?.data?.message || error.message));
  }
};

const verifyMoMoIPN = (reqBody) => {
  const { signature, ...rest } = reqBody;
  
  // Sắp xếp keys theo alphabet
  const sortedKeys = Object.keys(rest).sort();
  const rawSignature = sortedKeys.map(key => `${key}=${rest[key]}`).join('&');
  
  console.log('IPN Raw Signature:', rawSignature);
  
  const computedSignature = buildSignature(rawSignature, momoConfig.secretKey);
  console.log('Computed Signature:', computedSignature);
  console.log('Received Signature:', signature);
  
  return computedSignature === signature;
};

module.exports = { createMoMoPayment, verifyMoMoIPN };