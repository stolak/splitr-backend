import prisma from "../utils/prisma";

export interface CreatePlaidAccountInput {
  userId: string;
  buyerId?: string;
  linkToken?: string;
  expiration?: Date | string;
  publicToken?: string;
  itemId?: string;
  requestId?: string;
}

export interface UpdatePlaidAccountInput {
  buyerId?: string;
  linkToken?: string;
  expiration?: Date | string | null;
  publicToken?: string;
  itemId?: string;
  requestId?: string;
}

const plaidAccountSelect = {
  id: true,
  userId: true,
  buyerId: true,
  expiration: true,
  itemId: true,
  requestId: true,
  createdAt: true,
  updatedAt: true,
  buyer: {
    select: {
      id: true,
      splitrId: true,
      firstName: true,
      lastName: true,
      email: true,
      phoneNumber: true,
    },
  },
} as const;

export class PlaidAccountService {
  async createPlaidAccount(input: CreatePlaidAccountInput) {
    try {
      if (!input.userId) {
        throw new Error("userId is required");
      }

      if (input.buyerId) {
        const buyer = await prisma.buyer.findUnique({
          where: { id: input.buyerId },
        });

        if (!buyer) {
          throw new Error("Buyer not found");
        }
      }

      const plaidAccount = await prisma.plaidAccount.create({
        data: {
          userId: input.userId,
          buyerId: input.buyerId,
          linkToken: input.linkToken,
          expiration: input.expiration ? new Date(input.expiration) : undefined,
          publicToken: input.publicToken,
          itemId: input.itemId,
          requestId: input.requestId,
        },
        select: plaidAccountSelect,
      });

      return { success: true, data: plaidAccount };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getPlaidAccountById(id: string) {
    try {
      const plaidAccount = await prisma.plaidAccount.findUnique({
        where: { id },
        select: plaidAccountSelect,
      });

      if (!plaidAccount) {
        throw new Error("Plaid account not found");
      }

      return { success: true, data: plaidAccount };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getPlaidAccountsByUserId(userId: string) {
    try {
      const plaidAccounts = await prisma.plaidAccount.findMany({
        where: { userId },
        select: plaidAccountSelect,
        orderBy: { createdAt: "desc" },
      });

      return { success: true, data: plaidAccounts };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getPlaidAccountsByBuyerId(buyerId: string) {
    try {
      const plaidAccounts = await prisma.plaidAccount.findMany({
        where: { buyerId },
        select: plaidAccountSelect,
        orderBy: { createdAt: "desc" },
      });

      return { success: true, data: plaidAccounts };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async listPlaidAccounts(filters?: { userId?: string; buyerId?: string }) {
    try {
      const plaidAccounts = await prisma.plaidAccount.findMany({
        where: {
          ...(filters?.userId ? { userId: filters.userId } : {}),
          ...(filters?.buyerId ? { buyerId: filters.buyerId } : {}),
        },
        select: plaidAccountSelect,
        orderBy: { createdAt: "desc" },
      });

      return { success: true, data: plaidAccounts };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async updatePlaidAccount(id: string, input: UpdatePlaidAccountInput) {
    try {
      const existing = await prisma.plaidAccount.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new Error("Plaid account not found");
      }

      if (input.buyerId) {
        const buyer = await prisma.buyer.findUnique({
          where: { id: input.buyerId },
        });

        if (!buyer) {
          throw new Error("Buyer not found");
        }
      }

      const plaidAccount = await prisma.plaidAccount.update({
        where: { id },
        data: {
          buyerId: input.buyerId,
          linkToken: input.linkToken,
          expiration:
            input.expiration === null
              ? null
              : input.expiration
                ? new Date(input.expiration)
                : undefined,
          publicToken: input.publicToken,
          itemId: input.itemId,
          requestId: input.requestId,
        },
        select: plaidAccountSelect,
      });

      return { success: true, data: plaidAccount };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async deletePlaidAccount(id: string) {
    try {
      const existing = await prisma.plaidAccount.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new Error("Plaid account not found");
      }

      await prisma.plaidAccount.delete({
        where: { id },
      });

      return { success: true, message: "Plaid account deleted successfully" };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async saveLinkToken(input: {
    userId: string;
    buyerId?: string;
    linkToken: string;
    expiration: string;
  }) {
    return this.createPlaidAccount({
      userId: input.userId,
      buyerId: input.buyerId,
      linkToken: input.linkToken,
      expiration: input.expiration,
    });
  }

  async completePublicTokenExchange(input: {
    userId: string;
    publicToken: string;
    plaidAccountId?: string;
    itemId: string;
    requestId: string;
  }) {
    try {
      let plaidAccount = input.plaidAccountId
        ? await prisma.plaidAccount.findUnique({
            where: { id: input.plaidAccountId },
          })
        : await prisma.plaidAccount.findFirst({
            where: {
              userId: input.userId,
              itemId: null,
            },
            orderBy: { createdAt: "desc" },
          });

      if (!plaidAccount) {
        throw new Error("Plaid account not found");
      }

      if (plaidAccount.userId !== input.userId) {
        throw new Error("Unauthorized access to Plaid account");
      }

      const updated = await prisma.plaidAccount.update({
        where: { id: plaidAccount.id },
        data: {
          publicToken: input.publicToken,
          itemId: input.itemId,
          requestId: input.requestId,
        },
        select: plaidAccountSelect,
      });

      return { success: true, data: updated };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export const plaidAccountService = new PlaidAccountService();
