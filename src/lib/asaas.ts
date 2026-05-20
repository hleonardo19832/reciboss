// Asaas API helper
// Sandbox: https://sandbox.asaas.com/api/v3
// Production: https://api.asaas.com/v3

const ASAAS_SANDBOX_URL = 'https://sandbox.asaas.com/api/v3'
const ASAAS_PROD_URL = 'https://api.asaas.com/v3'

function getBaseUrl() {
  return process.env.ASAAS_SANDBOX === 'true' ? ASAAS_SANDBOX_URL : ASAAS_PROD_URL
}

function getApiKey() {
  return process.env.ASAAS_API_KEY || ''
}

async function asaasRequest(path: string, method = 'GET', body?: object) {
  const baseUrl = getBaseUrl()
  const apiKey = getApiKey()

  // Diagnostic logging (key length only, never log the full key)
  console.log(`[Asaas] ${method} ${baseUrl}${path} | keyLength=${apiKey.length} | sandbox=${process.env.ASAAS_SANDBOX}`)

  if (!apiKey) {
    throw new Error('ASAAS_API_KEY não configurada no servidor. Configure a variável de ambiente.')
  }

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'access_token': apiKey,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  // Read raw text first to avoid "Unexpected end of JSON input"
  const rawText = await res.text()
  console.log(`[Asaas] Response status=${res.status} bodyLength=${rawText.length}`)

  if (!rawText || rawText.trim() === '') {
    if (!res.ok) {
      throw new Error(`Asaas retornou erro HTTP ${res.status} sem corpo de resposta`)
    }
    return {}
  }

  let data: any
  try {
    data = JSON.parse(rawText)
  } catch (e) {
    console.error('[Asaas] Resposta não é JSON válido:', rawText.substring(0, 500))
    throw new Error(`Asaas retornou resposta inválida (HTTP ${res.status}): ${rawText.substring(0, 200)}`)
  }

  if (!res.ok) {
    console.error('[Asaas] Erro da API:', data)
    const errMsg = data?.errors?.[0]?.description || data?.message || `Erro HTTP ${res.status}`
    throw new Error(errMsg)
  }

  return data
}

// ─── Customer ───────────────────────────────────────────

export async function createOrGetCustomer(params: {
  name: string
  email: string
  externalReference: string // user_id
  cpfCnpj?: string
}) {
  // Check if customer already exists by externalReference
  const existing = await asaasRequest(`/customers?externalReference=${params.externalReference}`)
  if (existing?.data?.length > 0) {
    const customer = existing.data[0]
    // If the existing customer doesn't have a CPF/CNPJ but we have one now, update it
    if (!customer.cpfCnpj && params.cpfCnpj) {
      try {
        return await asaasRequest(`/customers/${customer.id}`, 'PUT', { cpfCnpj: params.cpfCnpj })
      } catch (err) {
        console.warn('Failed to update existing customer CPF/CNPJ:', err)
      }
    }
    return customer
  }

  // Create new customer
  const payload: Record<string, any> = {
    name: params.name,
    email: params.email,
    externalReference: params.externalReference,
    notificationDisabled: false,
  }

  if (params.cpfCnpj) {
    payload.cpfCnpj = params.cpfCnpj
  }

  return await asaasRequest('/customers', 'POST', payload)
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
