// Asaas API helper
// Sandbox: https://sandbox.asaas.com/api/v3
// Production: https://api.asaas.com/v3

const ASAAS_SANDBOX_URL = 'https://sandbox.asaas.com/api/v3'
const ASAAS_PROD_URL = 'https://api.asaas.com/v3'

function getBaseUrl() {
  return process.env.ASAAS_SANDBOX === 'true' ? ASAAS_SANDBOX_URL : ASAAS_PROD_URL
}

function getApiKey() {
  const key = process.env.ASAAS_API_KEY || ''
  return key.startsWith('$') ? key : `$${key}`
}

async function asaasRequest(path: string, method = 'GET', body?: object) {
  const res = await fetch(`${getBaseUrl()}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'access_token': getApiKey(),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await res.json()

  if (!res.ok) {
    console.error('Asaas error:', data)
    throw new Error(data?.errors?.[0]?.description || 'Asaas API error')
  }

  return data
}

// ─── Customer ───────────────────────────────────────────

export async function createOrGetCustomer(params: {
  name: string
  email: string
  cpfCnpj: string
  externalReference: string // user_id
}) {
  // Check if customer already exists by externalReference
  const existing = await asaasRequest(`/customers?externalReference=${params.externalReference}`)
  if (existing?.data?.length > 0) {
    const customer = existing.data[0]
    // Update customer data (ensures CPF is always up to date)
    if (params.cpfCnpj) {
      await asaasRequest(`/customers/${customer.id}`, 'PUT', {
        name: params.name,
        cpfCnpj: params.cpfCnpj,
      })
    }
    return { ...customer, cpfCnpj: params.cpfCnpj }
  }

  // Create new customer
  return await asaasRequest('/customers', 'POST', {
    name: params.name,
    email: params.email,
    cpfCnpj: params.cpfCnpj,
    externalReference: params.externalReference,
    notificationDisabled: false,
  })
}

// ─── Subscription ────────────────────────────────────────

export async function createSubscription(params: {
  customerId: string
  planId: string
  planName: string
  value: number
  billingType: 'CREDIT_CARD' | 'BOLETO' | 'PIX'
  externalReference: string // userId|planId
  creditCard?: {
    holderName: string
    number: string
    expiryMonth: string
    expiryYear: string
    ccv: string
  }
  creditCardHolderInfo?: {
    name: string
    email: string
    cpfCnpj: string
    postalCode: string
    addressNumber: string
    phone: string
  }
}) {
  const today = new Date()
  const nextMonth = new Date(today)
  nextMonth.setMonth(nextMonth.getMonth() + 1)
  const nextDue = nextMonth.toISOString().split('T')[0]

  const payload: Record<string, unknown> = {
    customer: params.customerId,
    billingType: params.billingType,
    value: params.value,
    nextDueDate: nextDue,
    cycle: 'MONTHLY',
    description: `ReciboFácil — Plano ${params.planName}`,
    externalReference: params.externalReference,
  }

  if (params.billingType === 'CREDIT_CARD' && params.creditCard) {
    payload.creditCard = params.creditCard
    payload.creditCardHolderInfo = params.creditCardHolderInfo
  }

  return await asaasRequest('/subscriptions', 'POST', payload)
}

export async function cancelSubscription(subscriptionId: string) {
  return await asaasRequest(`/subscriptions/${subscriptionId}`, 'DELETE')
}

export async function getSubscription(subscriptionId: string) {
  return await asaasRequest(`/subscriptions/${subscriptionId}`)
}

// ─── Payment link (for PIX/Boleto without card) ─────────

export async function getSubscriptionPaymentLink(subscriptionId: string) {
  const payments = await asaasRequest(`/subscriptions/${subscriptionId}/payments`)
  const lastPayment = payments?.data?.[0]
  if (!lastPayment) return null

  if (lastPayment.billingType === 'PIX') {
    const pix = await asaasRequest(`/payments/${lastPayment.id}/pixQrCode`)
    return { type: 'pix', payload: pix.payload, encodedImage: pix.encodedImage, expirationDate: pix.expirationDate }
  }

  if (lastPayment.billingType === 'BOLETO') {
    return { type: 'boleto', bankSlipUrl: lastPayment.bankSlipUrl, dueDate: lastPayment.dueDate }
  }

  return { type: 'link', invoiceUrl: lastPayment.invoiceUrl }
}
