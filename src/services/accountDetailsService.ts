import axios from 'axios';
import { analyzeBankStatementRework } from './bankStatementAnalysisService';
import { ScoringInputSnapshotService } from './scoringInputSnapshotService';
import prisma from '../utils/prisma';
import { accountLock } from './keyed-mutex';

const scoringInputSnapshotService = new ScoringInputSnapshotService();
// ==================== INTERFACES ====================

export interface CreateAccountDetailsInput {
  exchangeMonoCode?: string;
  accountId?: string;
  buyerId: string;
  bankStatement?: any;
  employmentType?: string;
  monthlyIncome?: number;
  overdraft?: number;
  existingLoanRepayment?: number;
  creditHistory?: string;
  employmentDuration?: number;
  averageBalance?: number;
  BankName?: string;
  AccountName?: string;
  AccountNumber?: string;
  customerId?: string;
}

export interface UpdateAccountDetailsInput {
  exchangeMonoCode?: string | null;
  accountId?: string | null;
  bankStatement?: any | null;
  employmentType?: string | null;
  monthlyIncome?: number | null;
  overdraft?: number | null;
  existingLoanRepayment?: number | null;
  creditHistory?: string | null;
  employmentDuration?: number | null;
  averageBalance?: number | null;
  status?: boolean | null;
}

export interface CreateMonoCustomerInput {
  identity: {
    type: 'bvn' | 'nin' | 'phone';
    number: string;
  };
  email: string;
  type: 'individual' | 'business';
  first_name: string;
  last_name: string;
  address?: string;
  phone: string;
}

export interface UpdateMonoCustomerInput {
  email?: string;
  first_name?: string;
  last_name?: string;
  address?: string;
  phone?: string;
  identification_no?: string;
  identification_type?: string;
}

const accountDetailsSelect = {
  id: true,
  status: true,
  accountId: true,
  buyerId: true,
  bankStatement: true,
  employmentType: true,
  monthlyIncome: true,
  overdraft: true,
  existingLoanRepayment: true,
  creditHistory: true,
  employmentDuration: true,
  averageBalance: true,
  createdAt: true,
  updatedAt: true,
  exchangeMonoCode: true,
  BankName: true,
  AccountName: true,
  AccountNumber: true,
  customerId: true,
  buyer: {
    select: {
      id: true,
      liftpayId: true,
      firstName: true,
      lastName: true,
      email: true,
      phoneNumber: true,
    },
  },
  scoringInputSnapshot: true,
};

export class AccountDetailsService {
  // ==================== CRUD OPERATIONS ====================

  private async ensureAnalysis(accountDetailsId: string, buyerId: string, bankStatement: any[]) {
    try {
      const existing = await scoringInputSnapshotService.getLatestSnapshotByAccountDetailsId(
        accountDetailsId,
      );
      if (existing && existing.buyerId === buyerId) {
        return existing;
      }
    } catch (_) {
      // ignore not-found and proceed to analyze
    }

    const analysis = await analyzeBankStatementRework(bankStatement);
    if (!analysis.success) {
      return null;
    }

    return scoringInputSnapshotService.upsertByAccountDetailsIdAndBuyerId({
      buyerId,
      scoringInput: analysis.data,
      accountDetailsId,
    });
  }

  private async waitForStatement(accountId: string) {
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    let statementData: any = null;
    let lastMessage: string | undefined;

    await sleep(60000);

    for (let attempt = 1; attempt <= 3; attempt++) {
      const statement = await this.getStatement(accountId);

      if (!statement.success) {
        return { success: false as const, error: statement.error };
      }

      statementData = statement.data.data;
      lastMessage = statement.data.message;

      if (Array.isArray(statementData) && statementData.length > 0) {
        return { success: true as const, data: statementData };
      }

      if (attempt < 3) {
        await sleep(60000);
      }
    }

    return {
      success: false as const,
      error: lastMessage ?? 'Statement not ready',
    };
  }

  /**
   * Create a new AccountDetails record
   */
  async createAccountDetails(input: CreateAccountDetailsInput) {
    try {
      // Verify buyer exists
      const buyer = await prisma.buyer.findUnique({
        where: { id: input.buyerId },
      });

      if (!buyer) {
        throw new Error('Buyer not found');
      }

      const accountDetails = await prisma.accountDetails.create({
        data: {
          accountId: input.accountId,
          buyerId: input.buyerId,
          exchangeMonoCode: input.exchangeMonoCode,
          bankStatement: input.bankStatement,
          employmentType: input.employmentType,
          monthlyIncome: input.monthlyIncome,
          overdraft: input.overdraft,
          existingLoanRepayment: input.existingLoanRepayment,
          creditHistory: input.creditHistory,
          employmentDuration: input.employmentDuration,
          averageBalance: input.averageBalance,
          BankName: input.BankName,
          AccountName: input.AccountName,
          AccountNumber: input.AccountNumber,
          customerId: input.customerId,
        },
        select: accountDetailsSelect,
      });

      return { success: true, data: accountDetails };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get AccountDetails by ID
   */
  async getAccountDetailsById(id: string) {
    try {
      const accountDetails = await prisma.accountDetails.findUnique({
        where: { id },
        select: accountDetailsSelect,
      });

      if (!accountDetails) {
        throw new Error('AccountDetails record not found');
      }

      return { success: true, data: accountDetails };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get AccountDetails by buyerId
   */
  async getAccountDetailsByBuyerId(buyerId: string) {
    try {
      const accountDetails = await prisma.accountDetails.findMany({
        where: { buyerId },
        select: accountDetailsSelect,
        orderBy: { createdAt: 'desc' },
      });

      return { success: true, data: accountDetails };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get latest AccountDetails by buyerId
   */
  async getLatestAccountDetailsByBuyerId(buyerId: string) {
    try {
      const accountDetails = await prisma.accountDetails.findFirst({
        where: { buyerId, status: true },
        select: accountDetailsSelect,
        orderBy: { createdAt: 'desc' },
      });

      return { success: true, data: accountDetails };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get AccountDetails by accountId
   */
  async getAccountDetailsByAccountId(accountId: string) {
    try {
      const accountDetails = await prisma.accountDetails.findFirst({
        where: { accountId, status: true },
        select: accountDetailsSelect,
      });

      if (!accountDetails) {
        throw new Error('AccountDetails record not found');
      }

      return { success: true, data: accountDetails };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all AccountDetails records with filters
   */
  async getAllAccountDetails(filters?: {
    buyerId?: string;
    employmentType?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (filters?.buyerId) where.buyerId = filters.buyerId;
      if (filters?.employmentType) where.employmentType = filters.employmentType;

      const [accountDetails, total] = await Promise.all([
        prisma.accountDetails.findMany({
          where,
          skip,
          take: limit,
          select: accountDetailsSelect,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.accountDetails.count({ where }),
      ]);

      return {
        success: true,
        data: {
          accountDetails,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get total number of accounts (AccountDetails records) associated with a buyer in the last 6 months
   */
  async getTotalAccountsAssociatedWithBuyerLastSixMonths(buyerId: string) {
    try {
      const now = new Date();
      const sixMonthsAgo = new Date(now);
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const total = await prisma.accountDetails.count({
        where: {
          buyerId,
          createdAt: {
            gte: sixMonthsAgo,
            lte: now,
          },
        },
      });

      return {
        success: true,
        data: {
          buyerId,
          total,
          from: sixMonthsAgo,
          to: now,
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update AccountDetails record
   */
  async updateAccountDetails(id: string, input: UpdateAccountDetailsInput) {
    try {
      // Verify record exists
      const existing = await prisma.accountDetails.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new Error('AccountDetails record not found');
      }
      const updateData: any = {};
      if (input.status !== undefined) updateData.status = input.status;
      if (input.bankStatement !== undefined) updateData.bankStatement = input.bankStatement;
      if (input.employmentType !== undefined) updateData.employmentType = input.employmentType;
      if (input.monthlyIncome !== undefined) updateData.monthlyIncome = input.monthlyIncome;
      if (input.overdraft !== undefined) updateData.overdraft = input.overdraft;
      if (input.existingLoanRepayment !== undefined)
        updateData.existingLoanRepayment = input.existingLoanRepayment;
      if (input.creditHistory !== undefined) updateData.creditHistory = input.creditHistory;
      if (input.employmentDuration !== undefined)
        updateData.employmentDuration = input.employmentDuration;
      if (input.averageBalance !== undefined) updateData.averageBalance = input.averageBalance;
      const accountDetails = await prisma.accountDetails.update({
        where: { id },
        data: updateData,
        select: accountDetailsSelect,
      });

      return { success: true, data: accountDetails };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Set account details status to false by buyerId
   */
  async unlinkBuyerFromAccountDetails(buyerId: string) {
    try {
      // Verify record exists
      const accountDetails = await prisma.accountDetails.findMany({
        where: { buyerId, status: true },
        select: { id: true },
      });
      if (accountDetails.length === 0) {
        throw new Error('AccountDetails record not found');
      }
      const updatedAccountDetails = await prisma.accountDetails.updateMany({
        where: { buyerId, status: true },
        data: { status: false },
      });
      return {
        success: true,
        data: updatedAccountDetails,
        message: 'AccountDetails record unlinked successfully',
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete AccountDetails record
   */
  async deleteAccountDetails(id: string) {
    try {
      const accountDetails = await prisma.accountDetails.delete({
        where: { id },
      });

      return {
        success: true,
        data: accountDetails,
        message: 'AccountDetails record deleted successfully',
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Upsert AccountDetails - Create or update based on buyerId and accountId
   */
  async upsertAccountDetails(input: CreateAccountDetailsInput) {
    try {
      // Verify buyer exists
      const buyer = await prisma.buyer.findUnique({
        where: { id: input.buyerId },
      });

      if (!buyer) {
        throw new Error('Buyer not found');
      }

      // Check if record exists for this buyer and accountId
      const existing = input.accountId
        ? await prisma.accountDetails.findFirst({
            where: {
              buyerId: input.buyerId,
              accountId: input.accountId,
              exchangeMonoCode: input.exchangeMonoCode || undefined,
            },
          })
        : null;

      let accountDetails;

      if (existing) {
        // Update existing record

        accountDetails = await prisma.accountDetails.update({
          where: { id: existing.id },
          data: {
            bankStatement: input.bankStatement || undefined,
            employmentType: input.employmentType || undefined,
            monthlyIncome: input.monthlyIncome || undefined,
            overdraft: input.overdraft || undefined,
            existingLoanRepayment: input.existingLoanRepayment || undefined,
            creditHistory: input.creditHistory || undefined,
            employmentDuration: input.employmentDuration || undefined,
            averageBalance: input.averageBalance || undefined,
            BankName: input.BankName || undefined,
            AccountName: input.AccountName || undefined,
            AccountNumber: input.AccountNumber || undefined,
            customerId: input.customerId || undefined,
          },
          select: accountDetailsSelect,
        });
      } else {
        // Create new record

        accountDetails = await prisma.accountDetails.create({
          data: {
            accountId: input.accountId,
            buyerId: input.buyerId,
            exchangeMonoCode: input.exchangeMonoCode || undefined,
            bankStatement: input.bankStatement || undefined,
            employmentType: input.employmentType || undefined,
            monthlyIncome: input.monthlyIncome || undefined,
            overdraft: input.overdraft || undefined,
            existingLoanRepayment: input.existingLoanRepayment || undefined,
            creditHistory: input.creditHistory || undefined,
            employmentDuration: input.employmentDuration || undefined,
            averageBalance: input.averageBalance || undefined,
            BankName: input.BankName || undefined,
            AccountName: input.AccountName || undefined,
            AccountNumber: input.AccountNumber || undefined,
            customerId: input.customerId || undefined,
          },
          select: accountDetailsSelect,
        });
      }

      return {
        success: true,
        data: accountDetails,
        isNew: !existing,
      };
    } catch (error: any) {
      // console.log('error.....:::upsertAccountDetails:::', error);
      return { success: false, error: error.message };
    }
  }

  //==================== MONO CODE EXCHANGE ====================
  async exchangeMonoCode(code: string, buyerId: string) {
    try {
      let accountId: string | null = null;
      // check if account details exists for this buyer and exchange mono code
      const existingAccountDetails = await prisma.accountDetails.findFirst({
        where: { buyerId, exchangeMonoCode: code },
      });
      if (existingAccountDetails) {
        accountId = existingAccountDetails.accountId;
      } else {
        const url = 'https://api.withmono.com/v2/accounts/auth';

        const response = await axios.post(
          url,
          { code },
          { headers: { 'mono-sec-key': process.env.MONO_SECRET_KEY! } },
        );

        if (response?.data?.data?.id) {
          await this.upsertAccountDetails({
            exchangeMonoCode: code,
            accountId: response.data.data.id,
            buyerId: buyerId,
          });
          accountId = response.data.data.id;
        }
      }
      if (!accountId) {
        return { success: false, error: 'Account not found' };
      }
      // const relevantData = this.extractRelevantData(statement.data);
      const accountDetails = await this.validateAndCreateAccount(accountId, buyerId);

      if (!accountDetails.success) {
        return {
          success: false,
          error:
            (accountDetails as any).error ??
            (accountDetails as any).message ??
            'Failed to validate and create account',
        };
      }
      return { success: true, data: accountDetails.data }; // Contains account ID & token
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get account details from Mono API by account ID
   */
  async getMonoAccountById(accountId: string) {
    try {
      const url = `https://api.withmono.com/v2/accounts/${accountId}`;

      const response = await axios.get(url, {
        headers: {
          'mono-sec-key': process.env.MONO_SECRET_KEY!,
          accept: 'application/json',
        },
      });

      //const { data } = response.data;
      // console.log('data', data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async getMonoAccountsByBuyerId(buyerId: string) {
    try {
      const accountDetails = await prisma.accountDetails.findFirst({
        where: { buyerId, status: true },
        select: { accountId: true },
      });
      if (!accountDetails || !accountDetails.accountId) {
        throw new Error('AccountDetails record not found');
      }
      const accountData = await this.getMonoAccountById(accountDetails.accountId);
      return accountData;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getMonoAccounts() {
    try {
      const url = `https://api.withmono.com/v2/accounts`;

      const response = await axios.get(url, {
        headers: {
          'mono-sec-key': process.env.MONO_SECRET_KEY!,
          accept: 'application/json',
        },
      });

      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }
  async getStatement(accountId: string) {
    try {
      const url = `https://api.withmono.com/v2/accounts/${accountId}/statement`;

      const response = await axios.get(url, {
        headers: {
          'mono-sec-key': process.env.MONO_SECRET_KEY!,
          accept: 'application/json',
        },
      });

      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async createVariableMandate({
    customerId,
    maxAmount,
    startDate,
    endDate,
    reference,
    description,
    name,
    email,
    phone,
  }: {
    customerId: string;
    maxAmount: number;
    startDate: string;
    endDate: string;
    reference: string;
    description?: string;
    name?: string;
    email?: string;
    phone?: string;
  }) {
    try {
      const response = await axios.post(
        'https://api.withmono.com/v2/payments/initiate',
        {
          amount: maxAmount,
          type: 'recurring-debit',
          method: 'mandate',
          mandate_type: 'emandate', //emandate, sweep
          debit_type: 'variable',
          description: description || `Repayment for ${name}`,
          reference: reference,
          redirect_url: `${process.env.FRONTEND_URL}/buyer/dashboard/sign-mandate`,
          customer: {
            id: customerId,
            type: 'individual',
            name: name || 'Samuel Olamide',
            email: email || 'SamuelOlamide@mono.o',
            phone: phone || '08012345678',
          },
          start_date: startDate,
          end_date: endDate,
          meta: {
            data_status: 'AVAILABLE',
            auth_method: 'mobile_banking',
          },
        },
        {
          headers: {
            'mono-sec-key': process.env.MONO_SECRET_KEY!,
          },
        },
      );

      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.data || error.response?.data?.message,
      };
    }
  }

  async validateAndCreateAccount(id: string, buyerId: string) {
    const lock = accountLock.get(id);

    return lock.runExclusive(async () => {
      const existingAccountDetails = await this.getAccountDetailsByAccountId(id);

      if (
        existingAccountDetails.success &&
        Array.isArray(existingAccountDetails.data?.bankStatement) &&
        existingAccountDetails.data.bankStatement.length > 0
      ) {
        await this.ensureAnalysis(
          existingAccountDetails.data.id,
          buyerId,
          existingAccountDetails.data.bankStatement,
        );

        return { success: true, data: existingAccountDetails.data };
      }

      const account = await this.getMonoAccountById(id);
      if (!account.success) {
        return { success: false, error: account.error };
      }

      await this.upsertAccountDetails({
        accountId: id,
        buyerId,
        BankName: account.data.data.account?.institution?.name,
        AccountName: account.data.data.account?.name,
        AccountNumber: account.data.data.account?.account_number,
        customerId: account.data.data.customer?.id,
      });

      const statementData = await this.waitForStatement(id);
      if (!statementData.success) {
        return statementData;
      }

      const accountDetails = await this.upsertAccountDetails({
        accountId: id,
        buyerId,
        bankStatement: statementData.data,
      });

      if (!accountDetails.success) {
        return accountDetails;
      }

      if (!accountDetails.data) {
        return { success: false, error: 'Failed to upsert account details' };
      }

      await this.ensureAnalysis(accountDetails.data.id, buyerId, statementData.data);

      return { success: true, data: accountDetails.data };
    });
  }

  // ==================== MONO CUSTOMER CRUD OPERATIONS ====================

  /**
   * Create a new Mono customer
   */
  async createMonoCustomer(input: CreateMonoCustomerInput) {
    try {
      const url = 'https://api.withmono.com/v2/customers/';

      const response = await axios.post(
        url,
        {
          identity: input.identity,
          email: input.email,
          type: input.type,
          first_name: input.first_name,
          last_name: input.last_name,
          address: input.address,
          phone: input.phone,
        },
        {
          headers: {
            'mono-sec-key': process.env.MONO_SECRET_KEY!,
            'Content-Type': 'application/json',
          },
        },
      );

      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.response?.data || error.message,
      };
    }
  }

  /**
   * Get Mono customer by ID
   */
  async getMonoCustomerById(customerId: string) {
    try {
      const url = `https://api.withmono.com/v2/customers/${customerId}`;

      const response = await axios.get(url, {
        headers: {
          'mono-sec-key': process.env.MONO_SECRET_KEY!,
          accept: 'application/json',
        },
      });

      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.response?.data || error.message,
      };
    }
  }

  /**
   * Get all Mono customers
   */
  async getAllMonoCustomers() {
    try {
      const url = 'https://api.withmono.com/v2/customers/';

      const response = await axios.get(url, {
        headers: {
          'mono-sec-key': process.env.MONO_SECRET_KEY!,
          accept: 'application/json',
        },
      });

      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.response?.data || error.message,
      };
    }
  }

  /**
   * Update Mono customer by ID (using PATCH)
   */
  async updateMonoCustomer(customerId: string, input: UpdateMonoCustomerInput) {
    try {
      const url = `https://api.withmono.com/v2/customers/${customerId}`;

      const updateData: any = {};
      if (input.email !== undefined) updateData.email = input.email;
      if (input.first_name !== undefined) updateData.first_name = input.first_name;
      if (input.last_name !== undefined) updateData.last_name = input.last_name;
      if (input.address !== undefined) updateData.address = input.address;
      if (input.phone !== undefined) updateData.phone = input.phone;

      const response = await axios.patch(url, updateData, {
        headers: {
          'mono-sec-key': process.env.MONO_SECRET_KEY!,
          'Content-Type': 'application/json',
        },
      });

      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.response?.data || error.message,
      };
    }
  }

  /**
   * Delete Mono customer by ID
   */
  async deleteMonoCustomer(customerId: string) {
    try {
      const url = `https://api.withmono.com/v2/customers/${customerId}`;

      const response = await axios.delete(url, {
        headers: {
          'mono-sec-key': process.env.MONO_SECRET_KEY!,
          accept: 'application/json',
        },
      });

      return {
        success: true,
        data: response.data,
        message: 'Customer deleted successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.response?.data || error.message,
      };
    }
  }

  /**
   * Get Mono mandate by ID
   */
  async getMonoMandateById(mandateId: string) {
    try {
      const url = `https://api.withmono.com/v3/payments/mandates/${mandateId}`;

      const response = await axios.get(url, {
        headers: {
          'mono-sec-key': process.env.MONO_SECRET_KEY!,
          accept: 'application/json',
        },
      });

      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.response?.data || error.message,
      };
    }
  }

  /**
   * Cancel Mono mandate by ID
   */
  async cancelMonoMandate(mandateId: string) {
    try {
      const url = `https://api.withmono.com/v3/payments/mandates/${mandateId}/cancel`;

      const response = await axios.patch(
        url,
        {},
        {
          headers: {
            'mono-sec-key': process.env.MONO_SECRET_KEY!,
            accept: 'application/json',
          },
        },
      );

      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.response?.data || error.message,
      };
    }
  }

  /**
   * Debit Mono mandate by ID
   */
  async debitMonoMandate(mandateId: string, amount: number, reference: string, narration: string) {
    try {
      const url = `https://api.withmono.com/v3/payments/mandates/${mandateId}/debit`;

      const response = await axios.post(
        url,
        {
          amount,
          reference,
          narration,
        },
        {
          headers: {
            'mono-sec-key': process.env.MONO_SECRET_KEY!,
            accept: 'application/json',
            'content-type': 'application/json',
          },
        },
      );

      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.response?.data || error.message,
      };
    }
  }

  /**
   * Get a specific mandate debit by reference
   *
   * GET /v3/payments/mandates/{mandateId}/debits/{reference}
   */
  async getMonoMandateDebitByReference(mandateId: string, reference: string) {
    try {
      const url = `https://api.withmono.com/v3/payments/mandates/${mandateId}/debits/${reference}`;

      const response = await axios.get(url, {
        headers: {
          'mono-sec-key': process.env.MONO_SECRET_KEY!,
          accept: 'application/json',
        },
      });

      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.response?.data || error.message,
      };
    }
  }

  /**
   * Set account details status to false by buyerId
   */
  async setAccountDetailsStatusToFalseByBuyerId(buyerId: string) {
    try {
      // Verify buyer exists
      const buyer = await prisma.buyer.findUnique({
        where: { id: buyerId },
      });

      if (!buyer) {
        throw new Error('Buyer not found');
      }

      // Update all account details for this buyer to set status to false
      const result = await prisma.accountDetails.updateMany({
        where: { buyerId, status: true },
        data: { status: false },
      });

      return {
        success: true,
        data: {
          buyerId,
          updatedCount: result.count,
          message: `Successfully set ${result.count} account detail(s) status to false`,
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
  async analyzeBankStatementbyBuyerId(buyerId: string) {
    try {
      const accountDetails = await this.getAccountDetailsByBuyerId(buyerId);
      if (!accountDetails.success) {
        return { success: false, error: accountDetails.error };
      }
      const statementData = accountDetails.data?.[0]?.bankStatement as any;
      if (!statementData) {
        return { success: false, error: 'No bank statement found' };
      }

      const analysisRework = await analyzeBankStatementRework(statementData);
      if (!analysisRework.success) {
        return { success: false, error: analysisRework.error };
      }

      await scoringInputSnapshotService.create({
        buyerId,
        scoringInput: analysisRework.data,
        accountDetailsId: accountDetails.data?.[0]?.id,
      });
      return { success: true, data: { analysis: analysisRework.data } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async accountlinkScoringStatus({
    buyerId,
    exchangeMonoCode,
  }: {
    buyerId: string;
    exchangeMonoCode: string;
  }) {
    try {
      const accountDetails = await prisma.accountDetails.findFirst({
        where: { buyerId, exchangeMonoCode },
      });
      if (!accountDetails) {
        return {
          success: true,
          data: { exchangeMonoCode, buyerId, step: 'exchangingMonoCodeToAccountId' },
        };
      }
      if (accountDetails?.exchangeMonoCode && !accountDetails?.bankStatement) {
        return { success: true, data: { exchangeMonoCode, buyerId, step: 'gettingBankStatement' } };
      }

      if (accountDetails?.exchangeMonoCode && accountDetails?.bankStatement) {
        let scoringInput: unknown = null;
        try {
          scoringInput = await scoringInputSnapshotService.getLatestSnapshotByAccountDetailsId(
            accountDetails.id,
          );
        } catch (e: any) {
          const msg = e?.message ?? '';
          // "not found" => no snapshot yet; treat as pending analysis
          if (!String(msg).toLowerCase().includes('not found')) throw e;
        }
        if (!scoringInput) {
          return {
            success: true,
            data: { exchangeMonoCode, buyerId, step: 'analyzingBankStatement' },
          };
        }
        return {
          success: true,
          data: { exchangeMonoCode, buyerId, step: 'analyzingBankStatement' },
        };
      }
      return { success: false, error: 'Unable to determine scoring status' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export const accountDetailsService = new AccountDetailsService();
