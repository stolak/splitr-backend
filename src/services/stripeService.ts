import Stripe from "stripe";
import { DocumentStatus, MerchantStatus, Prisma, StripeMandateStatus } from "@prisma/client";
import prisma from "../utils/prisma";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_DEFAULT_CURRENCY = process.env.STRIPE_DEFAULT_CURRENCY || "cad";
const STRIPE_CONNECT_COUNTRY = process.env.STRIPE_CONNECT_COUNTRY || "CA";
const STRIPE_CONNECT_REFRESH_URL = process.env.FRONTEND_URL + "/merchant/onboarding";
const STRIPE_CONNECT_RETURN_URL = process.env.FRONTEND_URL + "/merchant/onboarding";

let stripeClient: Stripe | null = null;

function getStripe(): Stripe {
  if (!STRIPE_SECRET_KEY || STRIPE_SECRET_KEY.trim().length === 0) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  if (!stripeClient) {
    stripeClient = new Stripe(STRIPE_SECRET_KEY);
  }
  return stripeClient;
}

export interface CreateCustomerInput {
  name?: string;
  email?: string;
}

export interface CreateSetupIntentInput {
  name?: string;
  email?: string;
  customerId?: string;
}

export interface CreateInvoiceSetupIntentInput {
  invoiceId: string;
  buyerId: string;
}

export interface CompleteMandateInput {
  customerId: string;
  paymentMethodId?: string;
  setupIntentId?: string;
  signed?: boolean;
  name?: string;
  email?: string;
}

export interface ChargeMandateInput {
  mandateId: string;
  amount: number;
  currency?: string;
  description?: string;
}

export interface CreatePaymentIntentInput {
  amount: number;
  currency?: string;
  description?: string;
}

export interface ConfirmPaymentIntentInput {
  paymentIntentId: string;
  paymentMethodId?: string;
  returnUrl?: string;
}

export interface ListPaymentIntentsInput {
  limit?: number;
  startingAfter?: string;
  customerId?: string;
}

export interface CreateConnectAccountInput {
  merchantId: string;
  country?: string;
}

export interface CreateConnectAccountLinkInput {
  accountId: string;
  refreshUrl?: string;
  returnUrl?: string;
  type?: "account_onboarding" | "account_update";
}

export interface CreateMerchantConnectOnboardingInput {
  merchantId: string;
  country?: string;
  refreshUrl?: string;
  returnUrl?: string;
}

export interface ListConnectAccountsInput {
  limit?: number;
  startingAfter?: string;
}

export interface SyncMerchantConnectAccountInput {
  merchantId: string;
  accountId: string;
}

export interface CreatePayoutInput {
  connectedAccountId?: string;
  merchantId?: string;
  amount: number;
  currency?: string;
  description?: string;
}

export interface CreateTransferInput {
  connectedAccountId?: string;
  merchantId?: string;
  amount: number;
  currency?: string;
  description?: string;
}

export interface GetBalanceInput {
  connectedAccountId?: string;
  merchantId?: string;
}

export interface CreateVirtualCardInput {
  buyerId: string;
  amountCents: number;
  currency?: string;
  billing?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
}

export class StripeService {
  /**
   * Create a Stripe customer
   */
  async createCustomer(input: CreateCustomerInput) {
    const customer = await getStripe().customers.create({
      name: input.name,
      email: input.email,
    });

    return { customerId: customer.id, customer };
  }

  async getCustomer(customerId: string) {
    if (!customerId) {
      throw new Error("customerId is required");
    }

    const customer = await getStripe().customers.retrieve(customerId);

    return { customer };
  }

  /**
   * Create a Stripe Connect Express account for a merchant.
   */
  async createConnectAccount(input: CreateConnectAccountInput) {
    if (!input.merchantId) {
      throw new Error("merchantId is required");
    }

    const merchant = await prisma.merchant.findUnique({
      where: { id: input.merchantId },
    });

    if (!merchant) {
      throw new Error("Merchant not found");
    }

    if (merchant.stripeConnectAccountId) {
      const account = await getStripe().accounts.retrieve(merchant.stripeConnectAccountId);
      return {
        accountId: account.id,
        account,
        existing: true,
      };
    }

    const email = merchant.businessEmail || merchant.authorizedEmail;
    if (!email) {
      throw new Error("Merchant email is required");
    }

    const account = await getStripe().accounts.create({
      type: "express",
      country: input.country || STRIPE_CONNECT_COUNTRY,
      email,
    });

    await prisma.merchant.update({
      where: { id: merchant.id },
      data: { stripeConnectAccountId: account.id },
    });

    return {
      accountId: account.id,
      account,
      existing: false,
    };
  }

  /**
   * Create a Stripe Connect account onboarding or update link.
   */
  async createConnectAccountLink(input: CreateConnectAccountLinkInput) {
    if (!input.accountId) {
      throw new Error("accountId is required");
    }

    const refreshUrl = input.refreshUrl || STRIPE_CONNECT_REFRESH_URL;
    const returnUrl = input.returnUrl || STRIPE_CONNECT_RETURN_URL;

    if (!refreshUrl || !returnUrl) {
      throw new Error("refreshUrl and returnUrl are required");
    }

    const accountLink = await getStripe().accountLinks.create({
      account: input.accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: input.type || "account_onboarding",
    });

    return {
      url: accountLink.url,
      expiresAt: accountLink.expires_at,
    };
  }

  /**
   * Create a Connect account (if needed) and return an onboarding link URL.
   */
  async createMerchantConnectOnboarding(input: CreateMerchantConnectOnboardingInput) {
    const accountResult = await this.createConnectAccount({
      merchantId: input.merchantId,
      country: input.country,
    });

    const merchantId = input.merchantId;
    const stripeAccount = accountResult.accountId;

    const params = new URLSearchParams({
      merchantId,
      stripeAccount,
    });

    const linkResult = await this.createConnectAccountLink({
      accountId: accountResult.accountId,
      refreshUrl: input.refreshUrl ?? STRIPE_CONNECT_REFRESH_URL + "?" + params.toString(),
      returnUrl: input.returnUrl ?? STRIPE_CONNECT_RETURN_URL + "?" + params.toString(),
    });

    return {
      accountId: accountResult.accountId,
      existingAccount: accountResult.existing,
      url: linkResult.url,
      expiresAt: linkResult.expiresAt,
    };
  }

  /**
   * List Stripe Connect accounts.
   */
  async listConnectAccounts(input: ListConnectAccountsInput = {}) {
    const limit = input.limit ?? 10;

    if (limit < 1 || limit > 100) {
      throw new Error("limit must be between 1 and 100");
    }

    const accounts = await getStripe().accounts.list({
      limit,
      ...(input.startingAfter ? { starting_after: input.startingAfter } : {}),
    });

    return {
      data: accounts.data,
      hasMore: accounts.has_more,
    };
  }

  /**
   * Retrieve a Stripe Connect account by ID.
   */
  async getConnectAccount(accountId: string) {
    if (!accountId) {
      throw new Error("accountId is required");
    }

    const account = await getStripe().accounts.retrieve(accountId);

    return {
      accountId: account.id,
      account,
    };
  }

  /**
   * Retrieve a Stripe Connect account and sync relevant details onto the merchant record.
   * details_submitted === true is treated as verified for now.
   */
  async syncMerchantConnectAccount(input: SyncMerchantConnectAccountInput) {
    if (!input.merchantId) {
      throw new Error("merchantId is required");
    }
    if (!input.accountId) {
      throw new Error("accountId is required");
    }

    const merchant = await prisma.merchant.findUnique({
      where: { id: input.merchantId },
    });

    if (!merchant) {
      throw new Error("Merchant not found");
    }

    if (merchant.stripeConnectAccountId && merchant.stripeConnectAccountId !== input.accountId) {
      throw new Error("accountId does not match merchant Stripe Connect account");
    }

    const account = await getStripe().accounts.retrieve(input.accountId);

    if (account.deleted) {
      throw new Error("Stripe Connect account has been deleted");
    }

    const company = account.company;
    const companyAddress = company?.address;
    const businessProfile = account.business_profile;
    const externalAccounts = account.external_accounts?.data ?? [];
    const bankAccount = externalAccounts.find(
      (item): item is Stripe.BankAccount => item.object === "bank_account"
    );

    const registrationAddress = companyAddress
      ? [
          companyAddress.line1,
          companyAddress.line2,
          companyAddress.city,
          companyAddress.state,
          companyAddress.postal_code,
          companyAddress.country,
        ]
          .filter(Boolean)
          .join(", ")
      : undefined;

    const isVerified = account.details_submitted === true;
    const verifiedStatus = isVerified ? MerchantStatus.Approved : MerchantStatus.Pending;
    const verifiedDocStatus = isVerified ? DocumentStatus.Approved : DocumentStatus.Pending;

    const updateData: Prisma.MerchantUpdateInput = {
      stripeConnectAccountId: account.id,
      ...(company?.name ? { businessName: company.name } : {}),
      ...(account.email ? { businessEmail: account.email } : {}),
      ...(company?.phone || businessProfile?.support_phone
        ? { businessPhone: company?.phone || businessProfile?.support_phone || undefined }
        : {}),
      ...(businessProfile?.url ? { officeWebsite: businessProfile.url } : {}),
      ...(registrationAddress ? { registrationAddress } : {}),
      ...(businessProfile?.name ? { authorizedPerson: businessProfile.name } : {}),
      ...(company?.phone || businessProfile?.support_phone
        ? {
            authorizedPhoneNo: company?.phone || businessProfile?.support_phone || undefined,
          }
        : {}),
      ...(bankAccount?.last4 ? { bankAccount: bankAccount.last4 } : {}),
      ...(bankAccount?.bank_name ? { bankName: bankAccount.bank_name } : {}),
      ...(bankAccount?.routing_number ? { bankCode: bankAccount.routing_number } : {}),
      ...(bankAccount?.account_holder_name
        ? { accountName: bankAccount.account_holder_name }
        : company?.name
          ? { accountName: company.name }
          : {}),
      verificationStatus: verifiedStatus,
      applicationStatus: verifiedStatus,
      documentStatus: verifiedDocStatus,
      isBusinessInfoVerified: verifiedDocStatus,
      isBankAccountVerified: bankAccount ? verifiedDocStatus : DocumentStatus.Pending,
      isAuthorizedPersonVerified: verifiedDocStatus,
    };

    const updatedMerchant = await prisma.merchant.update({
      where: { id: merchant.id },
      data: updateData,
    });

    return {
      accountId: account.id,
      account,
      merchant: updatedMerchant,
      verified: isVerified,
    };
  }

  /**
   * Create a payout from a Stripe Connect account balance to its external bank account.
   * Accepts a connected account ID directly, or resolves it from merchantId.
   */
  async createPayout(input: CreatePayoutInput) {
    if (!input.amount || input.amount <= 0) {
      throw new Error("A positive amount is required");
    }

    let connectedAccountId = input.connectedAccountId;

    if (!connectedAccountId) {
      if (!input.merchantId) {
        throw new Error("connectedAccountId or merchantId is required");
      }

      const merchant = await prisma.merchant.findUnique({
        where: { id: input.merchantId },
        select: { id: true, stripeConnectAccountId: true },
      });

      if (!merchant) {
        throw new Error("Merchant not found");
      }

      if (!merchant.stripeConnectAccountId) {
        throw new Error("Merchant has no Stripe Connect account");
      }

      connectedAccountId = merchant.stripeConnectAccountId;
    }

    const currency = (input.currency || STRIPE_DEFAULT_CURRENCY).toLowerCase();
    const amountCents = Math.round(input.amount * 100);
    const platformBalanceResult = await this.getBalance({});

    const availableForCurrencyOnPlatform = platformBalanceResult.available
      .filter((entry) => entry.currency.toLowerCase() === currency)
      .reduce((sum, entry) => sum + entry.amount, 0);

    if (availableForCurrencyOnPlatform < amountCents) {
      throw new Error(
        `Insufficient available balance. Requested ${amountCents} ${currency} cents, available ${availableForCurrencyOnPlatform} ${currency} cents.`
      );
    }
    await getStripe().transfers.create({
      amount: amountCents,
      currency,
      destination: connectedAccountId,
      ...(input.description ? { description: input.description } : {}),
    });

    const payout = await getStripe().payouts.create(
      {
        amount: amountCents,
        currency,
        ...(input.description ? { description: input.description } : {}),
      },
      {
        stripeAccount: connectedAccountId,
      }
    );

    return {
      payoutId: payout.id,
      amount: payout.amount,
      currency: payout.currency,
      status: payout.status,
      arrivalDate: payout.arrival_date,
      connectedAccountId,
      availableBalance: availableForCurrencyOnPlatform,
      payout,
    };
  }

  /**
   * Transfer funds from the platform balance to a Connect account.
   * Amount is in the smallest currency unit (e.g. cents).
   */
  async createTransfer(input: CreateTransferInput) {
    if (!input.amount || input.amount <= 0) {
      throw new Error("A positive amount is required");
    }

    let connectedAccountId = input.connectedAccountId;

    if (!connectedAccountId) {
      if (!input.merchantId) {
        throw new Error("connectedAccountId or merchantId is required");
      }

      const merchant = await prisma.merchant.findUnique({
        where: { id: input.merchantId },
        select: { id: true, stripeConnectAccountId: true },
      });

      if (!merchant) {
        throw new Error("Merchant not found");
      }

      if (!merchant.stripeConnectAccountId) {
        throw new Error("Merchant has no Stripe Connect account");
      }

      connectedAccountId = merchant.stripeConnectAccountId;
    }

    const currency = (input.currency || STRIPE_DEFAULT_CURRENCY).toLowerCase();
    const amountCents = Math.round(input.amount);
    const platformBalanceResult = await this.getBalance({});
    const availableForCurrencyOnPlatform = platformBalanceResult.available
      .filter((entry) => entry.currency.toLowerCase() === currency)
      .reduce((sum, entry) => sum + entry.amount, 0);

    if (availableForCurrencyOnPlatform < amountCents) {
      throw new Error(
        `Insufficient available balance. Requested ${amountCents} ${currency} cents, available ${availableForCurrencyOnPlatform} ${currency} cents.`
      );
    }

    const transfer = await getStripe().transfers.create({
      amount: amountCents,
      currency,
      destination: connectedAccountId,
      ...(input.description ? { description: input.description } : {}),
    });

    return {
      transferId: transfer.id,
      amount: transfer.amount,
      currency: transfer.currency,
      destination: transfer.destination,
      description: transfer.description,
      created: transfer.created,
      availableBalance: availableForCurrencyOnPlatform,
      transfer,
    };
  }

  /**
   * Retrieve Stripe balance for the platform, or for a Connect account when provided.
   */
  async getBalance(input: GetBalanceInput = {}) {
    let connectedAccountId = input.connectedAccountId;

    if (!connectedAccountId && input.merchantId) {
      const merchant = await prisma.merchant.findUnique({
        where: { id: input.merchantId },
        select: { id: true, stripeConnectAccountId: true },
      });

      if (!merchant) {
        throw new Error("Merchant not found");
      }

      if (!merchant.stripeConnectAccountId) {
        throw new Error("Merchant has no Stripe Connect account");
      }

      connectedAccountId = merchant.stripeConnectAccountId;
    }

    const balance = connectedAccountId
      ? await getStripe().balance.retrieve({}, { stripeAccount: connectedAccountId })
      : await getStripe().balance.retrieve();

    return {
      available: balance.available,
      pending: balance.pending,
      connectReserved: balance.connect_reserved ?? [],
      instantAvailable: balance.instant_available ?? [],
      livemode: balance.livemode,
      connectedAccountId: connectedAccountId ?? null,
      balance,
    };
  }

  /**
   * Create a one-off payment intent with automatic payment methods enabled
   */
  async createPaymentIntent(input: CreatePaymentIntentInput) {
    if (!input.amount || input.amount <= 0) {
      throw new Error("A positive amount is required");
    }
    const paymentIntent = await getStripe().paymentIntents.create({
      amount: input.amount,
      currency: input.currency || STRIPE_DEFAULT_CURRENCY,
      description: input.description,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
    };
  }

  /**
   * Confirm an existing PaymentIntent.
   */
  async confirmPaymentIntent(input: ConfirmPaymentIntentInput) {
    if (!input.paymentIntentId) {
      throw new Error("paymentIntentId is required");
    }

    const paymentIntent = await getStripe().paymentIntents.confirm(input.paymentIntentId, {
      ...(input.paymentMethodId ? { payment_method: input.paymentMethodId } : {}),
      ...(input.returnUrl ? { return_url: input.returnUrl } : {}),
    });

    return {
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      clientSecret: paymentIntent.client_secret,
      paymentIntent,
    };
  }

  /**
   * List Stripe PaymentIntents.
   */
  async listPaymentIntents(input: ListPaymentIntentsInput = {}) {
    const limit = input.limit ?? 10;

    if (limit < 1 || limit > 100) {
      throw new Error("limit must be between 1 and 100");
    }

    const paymentIntents = await getStripe().paymentIntents.list({
      limit,
      ...(input.startingAfter ? { starting_after: input.startingAfter } : {}),
      ...(input.customerId ? { customer: input.customerId } : {}),
    });

    return {
      data: paymentIntents.data,
      hasMore: paymentIntents.has_more,
    };
  }

  /**
   * Create a Stripe customer and a setup intent for collecting an off-session payment method
   */
  async createSetupIntent(input: CreateSetupIntentInput) {
    let customerId = input.customerId;

    if (!customerId) {
      const customer = await getStripe().customers.create({
        name: input.name,
        email: input.email,
      });
      customerId = customer.id;
    }
    const paymentMethodType = "acss_debit"; //"acss_debit";//"card"
    const setupIntent = await getStripe().setupIntents.create({
      customer: customerId,
      usage: "off_session",
      // payment_method_types: ["card"],
      payment_method_types: [paymentMethodType],
      payment_method_options: {
        acss_debit: {
          currency: "cad",
          mandate_options: {
            payment_schedule: "sporadic",
            transaction_type: "personal",
          },
        },
      },
    });

    return {
      customerId,
      setupIntentId: setupIntent.id,
      clientSecret: setupIntent.client_secret,
      paymentMethodType,
      paymentMethodId: setupIntent.payment_method,
    };
  }

  /**
   * Attach a buyer to an invoice, create a Stripe setup intent, and upsert a local mandate record.
   */
  async createInvoiceSetupIntent(input: CreateInvoiceSetupIntentInput) {
    if (!input.invoiceId) {
      throw new Error("invoiceId is required");
    }

    if (!input.buyerId) {
      throw new Error("buyerId is required");
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: input.invoiceId },
      include: {
        loan: {
          select: { id: true },
        },
      },
    });

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    const buyer = await prisma.buyer.findUnique({
      where: { id: input.buyerId },
    });

    if (!buyer) {
      throw new Error("Buyer not found");
    }

    const customerName =
      [buyer.firstName, buyer.lastName].filter(Boolean).join(" ").trim() || buyer.email;
    const customerEmail = buyer.email;
    const customerPhoneNumber = buyer.phoneNumber ?? invoice.customerPhoneNumber;

    const updatedInvoice = await prisma.invoice.update({
      where: { id: input.invoiceId },
      data: {
        buyerId: buyer.id,
        customerName,
        customerEmail,
        customerPhoneNumber,
      },
    });

    const existingMandate = await prisma.stripeMandate.findFirst({
      where: {
        invoiceId: input.invoiceId,
        buyerId: input.buyerId,
      },
      orderBy: { createdAt: "desc" },
    });

    const setupIntentResult = await this.createSetupIntent({
      name: customerName,
      email: customerEmail,
      customerId: existingMandate?.customerId,
    });

    const mandateData = {
      customerId: setupIntentResult.customerId,
      setupIntentId: setupIntentResult.setupIntentId,
      name: customerName,
      email: customerEmail,
      invoiceId: input.invoiceId,
      buyerId: input.buyerId,
      loanId: invoice.loan?.id ?? null,
      signed: false,
      status: StripeMandateStatus.Active,
      // paymentMethodId: setupIntentResult.paymentMethodId,
      paymentMethodType: setupIntentResult.paymentMethodType,
    };

    const mandate = existingMandate
      ? await prisma.stripeMandate.update({
          where: { id: existingMandate.id },
          data: mandateData,
        })
      : await prisma.stripeMandate.create({
          data: mandateData,
        });

    return {
      customerId: setupIntentResult.customerId,
      setupIntentId: setupIntentResult.setupIntentId,
      clientSecret: setupIntentResult.clientSecret,
      mandateId: mandate.id,
      invoiceId: updatedInvoice.id,
      buyerId: buyer.id,
      paymentMethodId: setupIntentResult.paymentMethodId,
      paymentMethodType: setupIntentResult.paymentMethodType,
    };
  }

  /**
   * Complete a mandate: persist customer + payment method locally.
   * If only a setupIntentId is provided, the payment method is resolved from Stripe.
   */
  async completeMandate(input: CompleteMandateInput) {
    if (!input.customerId) {
      throw new Error("customerId is required");
    }

    let paymentMethodId = input.paymentMethodId;

    if (!paymentMethodId && input.setupIntentId) {
      const setupIntent = await getStripe().setupIntents.retrieve(input.setupIntentId);
      paymentMethodId =
        typeof setupIntent.payment_method === "string"
          ? setupIntent.payment_method
          : setupIntent.payment_method?.id;
    }

    if (!paymentMethodId) {
      throw new Error("paymentMethodId or setupIntentId is required");
    }

    const mandate = await prisma.stripeMandate.create({
      data: {
        customerId: input.customerId,
        paymentMethodId,
        setupIntentId: input.setupIntentId,
        signed: input.signed ?? false,
        name: input.name,
        email: input.email,
        status: StripeMandateStatus.Active,
      },
    });

    return mandate;
  }

  /**
   * Retrieve a stored mandate by its local ID
   */
  async getMandate(mandateId: string) {
    if (!mandateId) {
      throw new Error("mandateId is required");
    }

    const mandate = await prisma.stripeMandate.findUnique({
      where: { id: mandateId },
    });

    if (!mandate) {
      throw new Error("Mandate not found");
    }

    return mandate;
  }

  /**
   * List stored mandates, optionally filtered by customerId
   */
  async listMandates(customerId?: string) {
    return prisma.stripeMandate.findMany({
      where: customerId ? { customerId } : undefined,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Retrieve a Stripe setup intent and its resolved payment method
   */
  async getSetupIntent(setupIntentId: string) {
    if (!setupIntentId) {
      throw new Error("setupIntentId is required");
    }

    const setupIntent = await getStripe().setupIntents.retrieve(setupIntentId);
    const paymentMethodId =
      typeof setupIntent.payment_method === "string"
        ? setupIntent.payment_method
        : setupIntent.payment_method?.id;

    return { setupIntent, paymentMethodId };
  }

  /**
   * Charge a stored mandate off-session using the saved payment method
   */
  async chargeMandate(input: ChargeMandateInput) {
    if (!input.mandateId) {
      throw new Error("mandateId is required");
    }

    if (!input.amount || input.amount <= 0) {
      throw new Error("A positive amount is required");
    }

    const mandate = await prisma.stripeMandate.findUnique({
      where: { id: input.mandateId },
    });

    if (!mandate) {
      throw new Error("Mandate not found");
    }

    if (mandate.status !== StripeMandateStatus.Active) {
      throw new Error("Mandate is not active");
    }

    if (!mandate.paymentMethodId) {
      throw new Error("Mandate has no payment method attached");
    }

    const paymentIntent = await getStripe().paymentIntents.create({
      amount: input.amount,
      currency: input.currency || STRIPE_DEFAULT_CURRENCY,
      customer: mandate.customerId,
      payment_method: mandate.paymentMethodId,
      off_session: true,
      confirm: true,
      description: input.description,
    });

    return {
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      paymentIntent,
    };
  }

  /**
   * Create a Stripe Issuing virtual card for a buyer with an allocated spending limit.
   */
  async createVirtualCard(input: CreateVirtualCardInput) {
    if (!input.buyerId) {
      throw new Error("buyerId is required");
    }

    if (!input.amountCents || input.amountCents <= 0) {
      throw new Error("A positive amountCents is required");
    }

    const buyer = await prisma.buyer.findUnique({
      where: { id: input.buyerId },
    });

    if (!buyer) {
      throw new Error("Buyer not found");
    }

    const name = [buyer.firstName, buyer.lastName].filter(Boolean).join(" ").trim() || buyer.email;
    const email = buyer.email;
    const currency = (input.currency || STRIPE_DEFAULT_CURRENCY).toLowerCase();
    const country = (input.billing?.country || STRIPE_CONNECT_COUNTRY || "CA").toUpperCase();

    const line1 =
      input.billing?.line1 ||
      buyer.address ||
      [buyer.houseNo, buyer.address].filter(Boolean).join(" ").trim();
    const city = input.billing?.city || buyer.city;
    const state = input.billing?.state || buyer.province || buyer.state;
    const postalCode = input.billing?.postalCode || buyer.postalCode;

    if (!line1 || !city || !state || !postalCode) {
      throw new Error(
        "Buyer billing address is incomplete. Provide billing.line1, city, state, and postalCode."
      );
    }

    const cardholder = await getStripe().issuing.cardholders.create({
      name,
      email,
      type: "individual",
      billing: {
        address: {
          line1,
          ...(input.billing?.line2 || buyer.houseNo
            ? { line2: input.billing?.line2 || buyer.houseNo || undefined }
            : {}),
          city,
          state,
          postal_code: postalCode,
          country,
        },
      },
      ...(buyer.phoneNumber ? { phone_number: buyer.phoneNumber } : {}),
    });

    const card = await getStripe().issuing.cards.create({
      cardholder: cardholder.id,
      currency,
      type: "virtual",
      status: "active",
      spending_controls: {
        spending_limits: [
          {
            amount: Math.round(input.amountCents),
            interval: "all_time",
          },
        ],
      },
    });

    const stripeCard = await prisma.stripeCard.create({
      data: {
        stripeCardholderId: cardholder.id,
        stripeCardId: card.id,
        allocatedAmount: Math.round(input.amountCents),
        currency,
        used: false,
        buyerId: buyer.id,
      },
    });

    return {
      id: stripeCard.id,
      stripeCardholderId: cardholder.id,
      stripeCardId: card.id,
      allocatedAmount: stripeCard.allocatedAmount,
      currency: stripeCard.currency,
      used: stripeCard.used,
      buyerId: stripeCard.buyerId,
      createdAt: stripeCard.createdAt,
      cardholder,
      card,
    };
  }
}

export const stripeService = new StripeService();
