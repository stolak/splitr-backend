import { authService } from './authService';
import prisma from '../utils/prisma';

export interface CreateBuyerInput {
  userId: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  phoneNumber: string;
  email: string;
  address?: string;
  gender?: string;
  idType?: string;
  idNumber?: string;
  sinNumber?: string;
  sinExpiryDate?: string;
  photo?: string;
  profileImageUrl?: string;
  state?: string;
  province?: string;
  city?: string;
  houseNo?: string;
  postalCode?: string;
  password: string;
}

export interface UpdateBuyerInput {
  firstName?: string;
  lastName?: string;
  DOB?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  gender?: string;
  idType?: string;
  idNumber?: string;
  sinNumber?: string;
  sinExpiryDate?: string;
  photo?: string;
  profileImageUrl?: string;
  state?: string;
  province?: string;
  city?: string;
  houseNo?: string;
  postalCode?: string;
}

const buyerSelect = {
  splitrId: true,
  id: true,
  userId: true,
  firstName: true,
  lastName: true,
  phoneNumber: true,
  email: true,
  isVerified: true,
  createdAt: true,
  updatedAt: true,
  idType: true,
  idNumber: true,
  sinNumber: true,
  sinExpiryDate: true,
  address: true,
  gender: true,
  DOB: true,
  photo: true,
  state: true,
  province: true,
  city: true,
  houseNo: true,
  postalCode: true,
  isActive: true,
  isEmailVerified: true,
  isPhoneVerified: true,
  status: true,
  IsTermsAndConditionAccepted: true,
} as const;

export class BuyerService {
  async createBuyer(input: CreateBuyerInput) {
    const { email, phoneNumber } = input;

    if (!email) {
      throw new Error('Email is required');
    }

    const existingByContact = await prisma.buyer.findFirst({
      where: { OR: [{ email }] },
    });
    if (existingByContact) {
      throw new Error('Buyer with provided email already exists');
    }

    if (input.sinNumber) {
      const existingSin = await prisma.buyer.findFirst({
        where: { sinNumber: input.sinNumber },
      });
      if (existingSin) {
        throw new Error('Buyer with provided SIN number already exists');
      }
    }

    const newUser = await authService.create({
      email: input.email,
      password: input.password,
      firstName: input.firstName,
      lastName: input.lastName,
      phoneNumber: input.phoneNumber,
      role: 'Buyer',
      userType: 'Buyer',
      isVerified: false,
      isPhoneVerified: true,
      isEmailVerified: true,
      isActive: true,
      profileImageUrl: input.profileImageUrl,
    });
    if (!newUser) {
      throw new Error('User not created');
    }
    input.userId = newUser.data.user.id;
    const buyer = await prisma.buyer.create({
      data: {
        splitrId: '',
        userId: input.userId,
        firstName: input.firstName,
        lastName: input.lastName,
        DOB: input.dateOfBirth,
        phoneNumber,
        email,
        address: input.address,
        gender: input.gender,
        idType: input.idType,
        idNumber: input.idNumber,
        sinNumber: input.sinNumber,
        sinExpiryDate: input.sinExpiryDate,
        photo: input.photo,
        state: input.state,
        province: input.province,
        city: input.city,
        houseNo: input.houseNo,
        postalCode: input.postalCode,
        isVerified: true,
        isPhoneVerified: true,
        isEmailVerified: true,
        isActive: true,
      },
      select: buyerSelect,
    });

    return buyer;
  }

  async getBuyerById(id: string) {
    const buyer = await prisma.buyer.findUnique({
      where: { id },
      select: buyerSelect,
    });
    if (!buyer) {
      throw new Error('Buyer not found');
    }
    return buyer;
  }

  async getBuyerByUserId(userId: string) {
    const buyer = await prisma.buyer.findUnique({
      where: { userId },
      select: buyerSelect,
    });
    if (!buyer) {
      throw new Error('Buyer not found');
    }
    return buyer;
  }

  async listBuyers() {
    const buyers = await prisma.buyer.findMany({
      select: buyerSelect,
      orderBy: { createdAt: 'desc' },
    });
    return buyers;
  }

  async updateBuyer(id: string, data: UpdateBuyerInput) {
    const existing = await prisma.buyer.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Buyer not found');
    }

    if (data.email || data.phoneNumber) {
      const byContact = await prisma.buyer.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                data.email ? { email: data.email } : undefined,
                data.phoneNumber ? { phoneNumber: data.phoneNumber } : undefined,
              ].filter(Boolean) as any,
            },
          ],
        },
      });
      if (byContact) {
        throw new Error('Another buyer exists with provided email or phone');
      }
    }

    if (data.sinNumber) {
      const bySin = await prisma.buyer.findFirst({
        where: {
          id: { not: id },
          sinNumber: data.sinNumber,
        },
      });
      if (bySin) {
        throw new Error('Another buyer exists with provided SIN number');
      }
    }

    const buyer = await prisma.buyer.update({
      where: { id },
      data,
      select: buyerSelect,
    });
    return buyer;
  }

  async deleteBuyer(id: string) {
    const existing = await prisma.buyer.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Buyer not found');
    }
    await prisma.buyer.delete({ where: { id } });
    return { message: 'Buyer deleted successfully' };
  }

  /**
   * Get total number of active buyers
   * Active buyers are those who are verified and not deleted
   */
  async getTotalActiveBuyers(): Promise<number> {
    try {
      const count = await prisma.buyer.count({
        where: {
          isVerified: true,
        },
      });
      return count;
    } catch (error) {
      console.error('Error getting total active buyers:', error);
      throw new Error('Failed to get total active buyers');
    }
  }

  /**
   * Get buyers created within a date range
   */
  async getBuyersCreatedByDateRange(startDate: Date, endDate: Date) {
    try {
      if (!startDate || !endDate) {
        throw new Error('Start date and end date are required');
      }

      if (startDate > endDate) {
        throw new Error('Start date must be before or equal to end date');
      }

      const where: any = {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      };

      const totalCount = await prisma.buyer.count({ where });

      const verifiedCount = await prisma.buyer.count({
        where: { ...where, isVerified: true },
      });

      const unverifiedCount = await prisma.buyer.count({
        where: { ...where, isVerified: false },
      });

      const activeCount = await prisma.buyer.count({
        where: { ...where, isActive: true },
      });

      const buyers = await prisma.buyer.findMany({
        where,
        select: {
          id: true,
          splitrId: true,
          firstName: true,
          lastName: true,
          email: true,
          phoneNumber: true,
          isVerified: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return {
        success: true,
        data: {
          dateRange: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
          totalCount,
          verifiedCount,
          unverifiedCount,
          activeCount,
          buyers,
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get buyers count grouped by day within a date range
   */
  async getBuyersCountGroupedByDay(startDate: Date, endDate: Date) {
    try {
      if (!startDate || !endDate) {
        throw new Error('Start date and end date are required');
      }

      if (startDate > endDate) {
        throw new Error('Start date must be before or equal to end date');
      }

      const buyers = await prisma.buyer.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          createdAt: true,
        },
      });

      const countsByDate = new Map<string, number>();

      const currentDate = new Date(startDate);
      currentDate.setHours(0, 0, 0, 0);
      const endDateNormalized = new Date(endDate);
      endDateNormalized.setHours(23, 59, 59, 999);

      while (currentDate <= endDateNormalized) {
        const dateKey = currentDate.toISOString().split('T')[0];
        countsByDate.set(dateKey, 0);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      buyers.forEach((buyer) => {
        const dateKey = buyer.createdAt.toISOString().split('T')[0];
        const currentCount = countsByDate.get(dateKey) || 0;
        countsByDate.set(dateKey, currentCount + 1);
      });

      const countsByDay = Array.from(countsByDate.entries()).map(([date, count]) => ({
        date,
        count,
      }));

      const totalCount = buyers.length;

      return {
        success: true,
        data: {
          dateRange: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
          totalCount,
          countsByDay,
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export const buyerService = new BuyerService();
