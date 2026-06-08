import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { getJwtSecret } from '../utils/env';
import { verifyFirebaseIdToken } from '../utils/firebase';
import { extractFirebaseProviderLinks, FirebaseProviderLink } from '../utils/linkedProviderMapper';
import prisma from '../utils/prisma';
import { emailService } from './emailService';

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      email: string;
      profileImageUrl?: string;
      name: string;
      userType: 'buyer' | 'merchant' | 'admin';
      isVerified: boolean;
      isTermsAndConditionAccepted: boolean;
      merchantId?: string;
      merchantName?: string;
      buyerId?: string;
      merchantCharge?: number;
      logoUrl?: string;
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    };
  };
}

export interface UserRegistrationInput {
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  profileImageUrl?: string;
  merchantId?: string;
  role?: 'Visitor' | 'Admin' | 'Merchant' | 'Buyer' | 'SuperAdmin' | 'CustomerSupport';
  userType?: 'Admin' | 'Merchant' | 'Buyer';
  isVerified?: boolean;
  isPhoneVerified?: boolean;
  isEmailVerified?: boolean;
  isActive?: boolean;
  address?: string;
}

function mapUserType(userType?: 'Admin' | 'Merchant' | 'Buyer'): 'buyer' | 'merchant' | 'admin' {
  switch (userType) {
    case 'Admin':
      return 'admin';
    case 'Merchant':
      return 'merchant';
    case 'Buyer':
    default:
      return 'buyer';
  }
}

function buildTokens(user: any) {
  const accessExpiresInSeconds = 60 * 60 * 24 * 7; // 7 DAYS
  const refreshExpiresInSeconds = 60 * 60 * 24 * 7; // 7 days

  const accessToken = jwt.sign({ user }, getJwtSecret(), {
    expiresIn: accessExpiresInSeconds,
  });
  const refreshToken = jwt.sign({ ...user, type: 'refresh' }, getJwtSecret(), {
    expiresIn: refreshExpiresInSeconds,
  });

  return { accessToken, refreshToken, expiresIn: accessExpiresInSeconds };
}

const authUserSelect = {
  id: true,
  email: true,
  password: true,
  firstName: true,
  lastName: true,
  userType: true,
  isVerified: true,
  profileImageUrl: true,
  merchantId: true,
  merchant: {
    select: {
      isAgreedToTerms: true,
      businessName: true,
      id: true,
      splitrId: true,
      merchantCharge: true,
      logoUrl: true,
    },
  },
  buyer: {
    select: {
      id: true,
    },
  },
} as const;

function buildAuthResponseFromUser(user: {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  userType: string;
  isVerified: boolean;
  profileImageUrl: string | null;
  merchantId: string | null;
  merchant: {
    isAgreedToTerms: boolean | null;
    businessName: string;
    merchantCharge: unknown;
    logoUrl: string | null;
  } | null;
  buyer: { id: string } | null;
}, message: string): AuthResponse {
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || '';
  const tokens = buildTokens({
    id: user.id,
    email: user.email,
    name,
    profileImageUrl: user.profileImageUrl ?? undefined,
    merchantId: user.merchantId,
    userType: mapUserType(user.userType as any),
    isVerified: user.isVerified ?? false,
    isTermsAndConditionAccepted: user.merchant?.isAgreedToTerms ?? false,
    buyerId: user.buyer?.id ?? undefined,
    merchantCharge: user.merchant?.merchantCharge,
    logoUrl: user.merchant?.logoUrl ?? undefined,
  });

  return {
    success: true,
    message,
    data: {
      user: {
        id: user.id,
        email: user.email,
        name,
        profileImageUrl: user.profileImageUrl ?? undefined,
        userType: mapUserType(user.userType as any),
        isVerified: user.isVerified ?? false,
        isTermsAndConditionAccepted: user.merchant?.isAgreedToTerms ?? false,
        merchantId: user.merchantId ?? undefined,
        merchantName: user.merchant?.businessName ?? undefined,
        buyerId: user.buyer?.id ?? undefined,
        merchantCharge: user.merchant?.merchantCharge ? Number(user.merchant.merchantCharge) : 0,
        logoUrl: user.merchant?.logoUrl ?? undefined,
      },
      tokens,
    },
  };
}

async function syncLinkedUsers(userId: string, providerLinks: FirebaseProviderLink[]) {
  for (const link of providerLinks) {
    await prisma.linkedUser.upsert({
      where: {
        provider_providerUserId: {
          provider: link.provider,
          providerUserId: link.providerUserId,
        },
      },
      update: { userId },
      create: {
        userId,
        provider: link.provider,
        providerUserId: link.providerUserId,
      },
    });
  }
}

function extractNameFromFirebaseToken(decoded: DecodedIdToken) {
  const firstName =
    (decoded as DecodedIdToken & { given_name?: string }).given_name ||
    decoded.name?.split(' ')[0] ||
    undefined;
  const lastName =
    (decoded as DecodedIdToken & { family_name?: string }).family_name ||
    decoded.name?.split(' ').slice(1).join(' ') ||
    undefined;

  return { firstName, lastName };
}

export class AuthService {
  async create(input: UserRegistrationInput): Promise<AuthResponse> {
    const { email, password, merchantId, profileImageUrl, address, ...userInput } = input;
    // Check if user already exists by email
    let existingUser;
    existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    

    // Hash password
    const validatedPassoword = password || '12345'; // auto-generated password
    const hashedPassword: string = await bcrypt.hash(validatedPassoword, 10);
    // Create user
    const user = await prisma.user.create({
      // `address` belongs to Buyer, not User (see `schema.prisma`).
      data: { ...userInput, email, password: hashedPassword, profileImageUrl },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        profileImageUrl: true,
        userType: true,
        isVerified: true,
        merchantId: true,
        merchant: {
          select: {
            isAgreedToTerms: true,
            businessName: true,
          },
        },
       
      },
    });

    const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || '';
    const tokens = buildTokens(user.id);

    return {
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          profileImageUrl: user.profileImageUrl ?? undefined,
          name,
          userType: mapUserType(user.userType as any),
          isVerified: user.isVerified ?? false,
          isTermsAndConditionAccepted: user.merchant?.isAgreedToTerms || false,
          merchantId: user?.merchantId ?? undefined,
          merchantName: user?.merchant?.businessName ?? undefined,
          
        },
        tokens,
      },
    };
  }

  async login(email: string, password: string, userType?: string): Promise<AuthResponse> {
    // Find user by email
    const where: any = { email };
    if (userType) {
      where.userType = userType;
    }
    console.log(where)
    const user = await prisma.user.findFirst({
      where,
      select: authUserSelect,
    });
    if (!user) {
      throw new Error('Invalid credentials');
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    return buildAuthResponseFromUser(user, 'Login successful');
  }

  async loginWithFirebase(idToken: string): Promise<AuthResponse> {
    const decoded = await verifyFirebaseIdToken(idToken);
    const email = decoded.email;

    if (!email) {
      throw new Error('Firebase account must include an email address');
    }

    const providerLinks = extractFirebaseProviderLinks(decoded);
    if (providerLinks.length === 0) {
      throw new Error('Unsupported Firebase sign-in provider');
    }

    await this.validateFirebaseEmailAvailability(email);

    let user = await this.findUserForFirebaseAuth(email, providerLinks);
    let isNewRegistration = false;

    if (!user) {
      const buyerByEmail = await prisma.buyer.findUnique({ where: { email } });

      if (buyerByEmail) {
        user = await this.createUserForOrphanBuyer(decoded, email, buyerByEmail, providerLinks);
      } else {
        user = await this.createFirebaseUserWithBuyer(decoded, email, providerLinks);
      }
      isNewRegistration = true;
    } else {
      this.assertFirebaseBuyerUser(user);
      await this.ensureBuyerProfile(user, decoded, email);
    }

    await syncLinkedUsers(user.id, providerLinks);

    const refreshedUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: authUserSelect,
    });

    if (!refreshedUser) {
      throw new Error('User not found');
    }

    return buildAuthResponseFromUser(
      refreshedUser,
      isNewRegistration ? 'Registration successful' : 'Login successful',
    );
  }

  private async validateFirebaseEmailAvailability(email: string) {
    const [userByEmail, buyerByEmail] = await Promise.all([
      prisma.user.findUnique({
        where: { email },
        select: { id: true, userType: true },
      }),
      prisma.buyer.findUnique({
        where: { email },
        select: { id: true, userId: true },
      }),
    ]);

    console.log('userByEmail', userByEmail)
    console.log('buyerByEmail', buyerByEmail)
    if (userByEmail && userByEmail.userType !== 'Buyer') {
      throw new Error(
        'The email already exists with a non-buyer user hence it cannot be used',
      );
    }

    if (userByEmail && buyerByEmail && buyerByEmail.userId !== userByEmail.id) {
      throw new Error('Email already exists with another buyer');
    }
  }

  private async findUserForFirebaseAuth(email: string, providerLinks: FirebaseProviderLink[]) {
    for (const link of providerLinks) {
      const linkedUser = await prisma.linkedUser.findUnique({
        where: {
          provider_providerUserId: {
            provider: link.provider,
            providerUserId: link.providerUserId,
          },
        },
        include: {
          user: {
            select: authUserSelect,
          },
        },
      });

      if (linkedUser?.user) {
        return linkedUser.user;
      }
    }

    return prisma.user.findUnique({
      where: { email },
      select: authUserSelect,
    });
  }

  private async ensureBuyerProfile(
    user: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      buyer: { id: string } | null;
    },
    decoded: DecodedIdToken,
    email: string,
  ) {
    if (user.buyer) {
      return;
    }

    const buyerWithEmail = await prisma.buyer.findUnique({ where: { email } });
    if (buyerWithEmail && buyerWithEmail.userId !== user.id) {
      throw new Error('Email already exists with another buyer');
    }

    const { firstName, lastName } = extractNameFromFirebaseToken(decoded);

    await prisma.buyer.create({
      data: {
        splitrId: '',
        userId: user.id,
        email,
        firstName: firstName ?? user.firstName,
        lastName: lastName ?? user.lastName,
        isEmailVerified: decoded.email_verified ?? true,
        isPhoneVerified: true,
        isActive: true,
        isVerified: false,
      },
    });
  }

  private async createFirebaseUserWithBuyer(
    decoded: DecodedIdToken,
    email: string,
    providerLinks: FirebaseProviderLink[],
  ) {
    const existingBuyer = await prisma.buyer.findUnique({ where: { email } });
    if (existingBuyer) {
      throw new Error('Email already exists with another buyer');
    }

    const { firstName, lastName } = extractNameFromFirebaseToken(decoded);
    const randomPassword = randomBytes(32).toString('hex');
    const hashedPassword = await bcrypt.hash(randomPassword, 10);
    const profileImageUrl = (decoded as DecodedIdToken & { picture?: string }).picture;

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          profileImageUrl,
          userType: 'Buyer',
          role: 'Buyer',
          isEmailVerified: decoded.email_verified ?? true,
          isActive: true,
        },
      });

      await tx.buyer.create({
        data: {
          splitrId: '',
          userId: createdUser.id,
          email,
          firstName,
          lastName,
          isEmailVerified: decoded.email_verified ?? true,
          isPhoneVerified: true,
          isActive: true,
          isVerified: false,
        },
      });

      for (const link of providerLinks) {
        await tx.linkedUser.create({
          data: {
            userId: createdUser.id,
            provider: link.provider,
            providerUserId: link.providerUserId,
          },
        });
      }

      return tx.user.findUnique({
        where: { id: createdUser.id },
        select: authUserSelect,
      });
    });

    if (!user) {
      throw new Error('Failed to create user');
    }

    return user;
  }

  private async createUserForOrphanBuyer(
    decoded: DecodedIdToken,
    email: string,
    buyer: { id: string; userId: string },
    providerLinks: FirebaseProviderLink[],
  ) {
    const existingUserForBuyer = await prisma.user.findUnique({
      where: { id: buyer.userId },
      select: authUserSelect,
    });

    if (existingUserForBuyer) {
      this.assertFirebaseBuyerUser(existingUserForBuyer);
      await this.ensureBuyerProfile(existingUserForBuyer, decoded, email);
      return existingUserForBuyer;
    }

    const { firstName, lastName } = extractNameFromFirebaseToken(decoded);
    const randomPassword = randomBytes(32).toString('hex');
    const hashedPassword = await bcrypt.hash(randomPassword, 10);
    const profileImageUrl = (decoded as DecodedIdToken & { picture?: string }).picture;

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          profileImageUrl,
          userType: 'Buyer',
          role: 'Buyer',
          isEmailVerified: decoded.email_verified ?? true,
          isActive: true,
        },
      });

      await tx.buyer.update({
        where: { id: buyer.id },
        data: {
          userId: createdUser.id,
          firstName: firstName ?? undefined,
          lastName: lastName ?? undefined,
        },
      });

      for (const link of providerLinks) {
        await tx.linkedUser.create({
          data: {
            userId: createdUser.id,
            provider: link.provider,
            providerUserId: link.providerUserId,
          },
        });
      }

      return tx.user.findUnique({
        where: { id: createdUser.id },
        select: authUserSelect,
      });
    });

    if (!user) {
      throw new Error('Failed to create user for existing buyer');
    }

    return user;
  }

  private assertFirebaseBuyerUser(user: { userType: string }) {
    if (user.userType !== 'Buyer') {
      throw new Error(
        'The email already exists with a non-buyer user hence it cannot be used',
      );
    }
  }

  /**
   * Create a merchant user with optional outlet assignment
   */
  async createMerchantUser(input: UserRegistrationInput): Promise<AuthResponse> {
    const { email, password, phoneNumber, merchantId, address, ...userInput } = input;

    // Validate required fields for merchant user
    if (!merchantId) {
      throw new Error('merchantId is required for merchant users');
    }

    // Verify merchant exists
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
    });

    if (!merchant) {
      throw new Error('Merchant not found');
    }

    // Check if user already exists by email or phoneNumber
    let existingUser;
    existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

  
    

    // Hash password
    const validatedPassword = password || '12345'; // auto-generated password
    const hashedPassword: string = await bcrypt.hash(validatedPassword, 10);

    // Create merchant user
    const user = await prisma.user.create({
      data: {
  
        ...userInput,
        email,
        password: hashedPassword,
        userType: 'Merchant',
        role: input.role || 'Merchant',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        userType: true,
        role: true,
        isVerified: true,
        profileImageUrl: true,
        merchantId: true,

        merchant: {
          select: {
            id: true,
            splitrId: true,
            businessName: true,
            businessEmail: true,
            isAgreedToTerms: true,
            merchantCharge: true,
            logoUrl: true,
          },
        },
        
      },
    });

    const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || '';
    const tokens = buildTokens({
      id: user.id,
      email: user.email,
      name,
      profileImageUrl: user.profileImageUrl ?? undefined,
      merchantId: user.merchantId,
   
      userType: 'merchant',
      isVerified: user.isVerified ?? false,
      isTermsAndConditionAccepted: user.merchant?.isAgreedToTerms ?? false,
      merchantCharge: user.merchant?.merchantCharge,
      logoUrl: user.merchant?.logoUrl ?? undefined,
    });

    return {
      success: true,
      message: 'Merchant user created successfully',
      data: {
        user: {
          id: user.id,
          profileImageUrl: user.profileImageUrl ?? undefined,
          email: user.email,
          name,
          userType: 'merchant',
          isVerified: user.isVerified ?? false,
          isTermsAndConditionAccepted: user.merchant?.isAgreedToTerms || false,
          merchantId: user.merchantId ?? undefined,
          merchantName: user.merchant?.businessName ?? undefined,
          merchantCharge: user.merchant?.merchantCharge ? Number(user.merchant.merchantCharge) : 0,
          logoUrl: user.merchant?.logoUrl ?? undefined,
        },
        tokens,
      },
    };
  }

  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, createdAt: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  /**
   * Request password reset - generates token and sends email
   */
  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    try {
      // Verify user exists
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      });

      // Don't reveal if user exists or not for security
      if (!user) {
        return {
          success: true,
          message: 'If an account with that email exists, a password reset link has been sent.',
        };
      }

      // Generate secure random token
      const resetToken = randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes expiration

      // Delete any existing reset tokens for this user
      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      });

      // Create new reset token
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: resetToken,
          expiresAt,
          used: false,
        },
      });

      // Build reset URL
      const frontendUrl =
        process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:8080';
      const resetLink = `${frontendUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

      // Get user name
      const userName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'User';

      // Send password reset email
      await emailService.sendTemplateEmail({
        to: email,
        templateName: 'passwordReset',
        data: {
          appName: 'Lift Platform',
          userName,
          userEmail: email,
          resetLink,
          expirationTime: '10',
        },
      });

      return {
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      };
    } catch (error: any) {
      console.error('Error in forgotPassword:', error);
      // Still return success to prevent email enumeration
      return {
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      };
    }
  }

  /**
   * Reset password using token
   */
  async resetPassword(
    email: string,
    token: string,
    newPassword: string,
    confirmPassword: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Validate passwords match
      if (newPassword !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Validate password strength (minimum 6 characters)
      if (newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true },
      });

      if (!user) {
        throw new Error('Invalid reset token or email');
      }

      // Find valid reset token
      const resetToken = await prisma.passwordResetToken.findFirst({
        where: {
          userId: user.id,
          token,
          used: false,
          expiresAt: {
            gt: new Date(), // Token not expired
          },
        },
      });

      if (!resetToken) {
        throw new Error('Invalid or expired reset token');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update user password and mark token as used (transaction)
      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword },
        }),
        prisma.passwordResetToken.update({
          where: { id: resetToken.id },
          data: { used: true },
        }),
      ]);

      return {
        success: true,
        message: 'Password has been reset successfully',
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to reset password');
    }
  }

  /**
   * Change password for an authenticated user
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (!userId) {
        throw new Error('User not found');
      }

      if (!currentPassword || !newPassword || !confirmPassword) {
        throw new Error('currentPassword, newPassword, and confirmPassword are required');
      }

      if (newPassword !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, password: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        throw new Error('New password must be different from current password');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      return {
        success: true,
        message: 'Password changed successfully',
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to change password');
    }
  }
}

export const authService = new AuthService();
