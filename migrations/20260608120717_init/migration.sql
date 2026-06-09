-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NULL,
    `lastName` VARCHAR(191) NULL,
    `profileImageUrl` VARCHAR(191) NULL,
    `phoneNumber` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `userType` ENUM('Admin', 'Merchant', 'Buyer') NOT NULL DEFAULT 'Buyer',
    `role` ENUM('Visitor', 'Admin', 'Merchant', 'Buyer', 'SuperAdmin', 'CustomerSupport') NOT NULL DEFAULT 'Visitor',
    `isActive` BOOLEAN NOT NULL DEFAULT false,
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `isEmailVerified` BOOLEAN NOT NULL DEFAULT false,
    `isPhoneVerified` BOOLEAN NOT NULL DEFAULT false,
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    `createdById` VARCHAR(191) NULL,
    `approvedById` VARCHAR(191) NULL,
    `modifiedById` VARCHAR(191) NULL,
    `merchantId` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `referralCode` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `linked_user` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `provider` ENUM('Google', 'Facebook', 'Twitter', 'LinkedIn', 'Instagram', 'Pinterest', 'Apple', 'Microsoft', 'Yahoo', 'AOL', 'GitHub', 'Bitbucket', 'GitLab', 'StackOverflow', 'Reddit') NOT NULL,
    `providerUserId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `linked_user_userId_idx`(`userId`),
    UNIQUE INDEX `linked_user_userId_provider_key`(`userId`, `provider`),
    UNIQUE INDEX `linked_user_provider_providerUserId_key`(`provider`, `providerUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PasswordResetToken` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `used` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PasswordResetToken_token_key`(`token`),
    INDEX `PasswordResetToken_userId_idx`(`userId`),
    INDEX `PasswordResetToken_token_idx`(`token`),
    INDEX `PasswordResetToken_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Buyer` (
    `id` VARCHAR(191) NOT NULL,
    `splitrId` VARCHAR(30) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NULL,
    `lastName` VARCHAR(191) NULL,
    `DOB` VARCHAR(191) NULL,
    `phoneNumber` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NULL,
    `gender` VARCHAR(191) NULL,
    `idType` VARCHAR(191) NULL,
    `idNumber` VARCHAR(191) NULL,
    `nin` VARCHAR(191) NULL,
    `bvn` VARCHAR(191) NULL,
    `photo` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `LGA` VARCHAR(191) NULL,
    `streetName` VARCHAR(191) NULL,
    `houseNo` VARCHAR(191) NULL,
    `zipCode` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT false,
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `isEmailVerified` BOOLEAN NOT NULL DEFAULT true,
    `isPhoneVerified` BOOLEAN NOT NULL DEFAULT true,
    `createdById` VARCHAR(191) NULL,
    `approvedById` VARCHAR(191) NULL,
    `modifiedById` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `IsSalaried` BOOLEAN NOT NULL DEFAULT false,
    `SalariedDate` DATETIME(3) NULL,
    `IsTermsAndConditionAccepted` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Buyer_splitrId_key`(`splitrId`),
    UNIQUE INDEX `Buyer_userId_key`(`userId`),
    UNIQUE INDEX `Buyer_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Merchant` (
    `id` VARCHAR(191) NOT NULL,
    `splitrId` VARCHAR(30) NOT NULL,
    `logoUrl` VARCHAR(191) NULL,
    `businessName` VARCHAR(191) NOT NULL,
    `businessEmail` VARCHAR(191) NOT NULL,
    `authorizedPerson` VARCHAR(191) NULL,
    `authorizedDesignation` VARCHAR(191) NULL,
    `authorizedPhoneNo` VARCHAR(191) NULL,
    `authorizedEmail` VARCHAR(191) NULL,
    `typeOfServiceOrProducts` VARCHAR(191) NULL,
    `cacNumber` VARCHAR(191) NULL,
    `dateOfIncorporation` VARCHAR(191) NULL,
    `tin` VARCHAR(191) NULL,
    `registrationAddress` VARCHAR(191) NULL,
    `businessDescription` VARCHAR(30000) NULL,
    `businessCategory` VARCHAR(191) NULL,
    `businessType` VARCHAR(191) NULL,
    `businessTypes` JSON NULL,
    `businessPhone` VARCHAR(191) NULL,
    `officeWebsite` VARCHAR(191) NULL,
    `IsTermsAndConditionAccepted` BOOLEAN NOT NULL DEFAULT false,
    `isBusinessInfoVerified` ENUM('Pending', 'Approved', 'Rejected') NULL DEFAULT 'Pending',
    `isAuthorizedPersonVerified` ENUM('Pending', 'Approved', 'Rejected') NULL DEFAULT 'Pending',
    `isDirectorsVerified` ENUM('Pending', 'Approved', 'Rejected') NULL DEFAULT 'Pending',
    `isShareholdersVerified` ENUM('Pending', 'Approved', 'Rejected') NULL DEFAULT 'Pending',
    `isAuthorisersVerified` ENUM('Pending', 'Approved', 'Rejected') NULL DEFAULT 'Pending',
    `isBankAccountVerified` ENUM('Pending', 'Approved', 'Rejected') NULL DEFAULT 'Pending',
    `cacCertificate` VARCHAR(191) NULL,
    `isCACCertificateVerified` ENUM('Pending', 'Approved', 'Rejected') NULL DEFAULT 'Pending',
    `memart` VARCHAR(191) NULL,
    `isMEMERTCertificateVerified` ENUM('Pending', 'Approved', 'Rejected') NULL DEFAULT 'Pending',
    `cac2Form` VARCHAR(191) NULL,
    `isCAC2CAC7FormVerified` ENUM('Pending', 'Approved', 'Rejected') NULL DEFAULT 'Pending',
    `utilityBill` VARCHAR(191) NULL,
    `utilityBillVerified` ENUM('Pending', 'Approved', 'Rejected') NULL DEFAULT 'Pending',
    `boardResolution` VARCHAR(191) NULL,
    `boardResolutionVerified` ENUM('Pending', 'Approved', 'Rejected') NULL DEFAULT 'Pending',
    `documentStatus` ENUM('Pending', 'Approved', 'Rejected') NULL DEFAULT 'Pending',
    `applicationStatus` ENUM('Pending', 'Approved', 'Rejected', 'Inactive', 'Active', 'Suspended', 'Deleted') NULL DEFAULT 'Pending',
    `verificationStatus` ENUM('Pending', 'Approved', 'Rejected', 'Inactive', 'Active', 'Suspended', 'Deleted') NULL DEFAULT 'Pending',
    `bankAccount` VARCHAR(191) NULL,
    `accountName` VARCHAR(191) NULL,
    `walletId` BIGINT NULL,
    `bankName` VARCHAR(191) NULL,
    `bankCode` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `isDeleted` BOOLEAN NULL DEFAULT false,
    `merchantCharge` DECIMAL(65, 30) NULL DEFAULT 0,
    `isAgreedToTerms` BOOLEAN NULL DEFAULT false,
    `agreedToTermsAt` DATETIME(3) NULL,
    `agreedToTermsBy` VARCHAR(191) NULL,

    UNIQUE INDEX `Merchant_splitrId_key`(`splitrId`),
    UNIQUE INDEX `Merchant_businessEmail_key`(`businessEmail`),
    UNIQUE INDEX `Merchant_authorizedEmail_key`(`authorizedEmail`),
    UNIQUE INDEX `Merchant_cacNumber_key`(`cacNumber`),
    UNIQUE INDEX `Merchant_tin_key`(`tin`),
    UNIQUE INDEX `Merchant_businessPhone_key`(`businessPhone`),
    UNIQUE INDEX `Merchant_officeWebsite_key`(`officeWebsite`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MerchantShareHolder` (
    `id` VARCHAR(191) NOT NULL,
    `merchantId` VARCHAR(191) NOT NULL,
    `shareholder` VARCHAR(191) NULL,
    `holding` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MerchantDirector` (
    `id` VARCHAR(191) NOT NULL,
    `merchantId` VARCHAR(191) NOT NULL,
    `director` VARCHAR(191) NULL,
    `position` VARCHAR(191) NULL,
    `doc` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BankAccount` (
    `id` VARCHAR(191) NOT NULL,
    `bankId` VARCHAR(191) NOT NULL,
    `merchantId` VARCHAR(191) NOT NULL,
    `accountName` VARCHAR(191) NOT NULL,
    `accountNumber` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Bank` (
    `id` VARCHAR(191) NOT NULL,
    `bankCode` VARCHAR(191) NOT NULL,
    `bankName` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Bank_bankCode_key`(`bankCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MerchantAuthoriser` (
    `id` VARCHAR(191) NOT NULL,
    `merchantId` VARCHAR(191) NOT NULL,
    `authoriserName` VARCHAR(191) NOT NULL,
    `designation` VARCHAR(191) NOT NULL,
    `authoriserEmail` VARCHAR(191) NOT NULL,
    `authoriserPhone` VARCHAR(191) NOT NULL,
    `bvn` VARCHAR(191) NULL,
    `nin` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RejectionReason` (
    `id` VARCHAR(191) NOT NULL,
    `merchantId` VARCHAR(191) NOT NULL,
    `rejectionReason` VARCHAR(10000) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdById` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LoanSetting` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'default',
    `loanInterestRate` DECIMAL(65, 30) NOT NULL,
    `maxLoanAmount` DECIMAL(65, 30) NULL,
    `minLoanAmount` DECIMAL(65, 30) NULL,
    `maxLoanTenure` INTEGER NULL DEFAULT 12,
    `minLoanTenure` INTEGER NULL DEFAULT 1,
    `incomeRatio` DECIMAL(65, 30) NULL,
    `minDownPayment` DECIMAL(65, 30) NULL,
    `insuranceRate` DECIMAL(65, 30) NULL,
    `adminFeeBase1To3` DECIMAL(65, 30) NULL,
    `adminFeeBase4To12` DECIMAL(65, 30) NULL,
    `adminFeePercentage` DECIMAL(65, 30) NULL,
    `adminFeeThreshold` DECIMAL(65, 30) NULL,
    `upfrontFeePercentage` DECIMAL(65, 30) NULL,
    `upfrontFeeCap` DECIMAL(65, 30) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SettlementSetting` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'default',
    `merchantFeeRate` DECIMAL(65, 30) NOT NULL,
    `autoSettlementCharge` DECIMAL(65, 30) NOT NULL,
    `manualSettlementCharge` DECIMAL(65, 30) NOT NULL,
    `Tx` INTEGER NOT NULL DEFAULT 0,
    `timeOfAutoSettlement` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TimeOutSetting` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'default',
    `accountlinkingTimeout` INTEGER NOT NULL DEFAULT 5,
    `directPayTimeout` INTEGER NOT NULL DEFAULT 5,
    `scoringTimeout` INTEGER NOT NULL DEFAULT 5,
    `merchantCreationTimeout` INTEGER NOT NULL DEFAULT 5,
    `planselectionTimeout` INTEGER NOT NULL DEFAULT 5,
    `upfrontPaymentTimeout` INTEGER NOT NULL DEFAULT 5,
    `maxLinkAttempts` INTEGER NOT NULL DEFAULT 2,
    `periodBetweenAttempts` INTEGER NOT NULL DEFAULT 6,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Loan` (
    `id` VARCHAR(191) NOT NULL,
    `splitrId` VARCHAR(30) NOT NULL,
    `buyerId` VARCHAR(191) NOT NULL,
    `invoiceId` VARCHAR(191) NULL,
    `loanAmount` DECIMAL(65, 30) NOT NULL,
    `purchaseAmount` DECIMAL(65, 30) NULL,
    `downPaymentAmount` DECIMAL(65, 30) NULL,
    `merchantId` VARCHAR(191) NULL,
    `referenceNumber` VARCHAR(191) NULL,
    `adminCharge` DECIMAL(65, 30) NULL,
    `insurance` DECIMAL(65, 30) NULL,
    `monthlyRepayment` DECIMAL(65, 30) NULL,
    `loanTenure` INTEGER NOT NULL,
    `loanInterestRate` DECIMAL(65, 30) NOT NULL,
    `loanStartDate` DATETIME(3) NOT NULL,
    `loanEndDate` DATETIME(3) NULL,
    `loanStatus` ENUM('Pending', 'Approved', 'Active', 'Cancel', 'Complete', 'Pause', 'Default') NOT NULL,
    `loanType` ENUM('Personal', 'Corporate') NOT NULL,
    `returnStatus` ENUM('Active', 'Approved', 'Rejected', 'Refunded', 'Pending') NULL DEFAULT 'Active',
    `returnAmount` DECIMAL(65, 30) NULL,
    `returnReason` VARCHAR(191) NULL,
    `returnNote` VARCHAR(191) NULL,
    `returnReference` VARCHAR(191) NULL,
    `returnInitiatedDate` DATETIME(3) NULL,
    `returnInitiatedBy` VARCHAR(191) NULL,
    `returnApprovedBy` VARCHAR(191) NULL,
    `returnApprovedDate` DATETIME(3) NULL,
    `loanPurpose` VARCHAR(191) NOT NULL,
    `loanDocument` VARCHAR(191) NULL,
    `loanDocumentVerified` ENUM('Pending', 'Approved', 'Rejected') NULL DEFAULT 'Pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Loan_splitrId_key`(`splitrId`),
    UNIQUE INDEX `Loan_invoiceId_key`(`invoiceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LoanSchedule` (
    `id` VARCHAR(191) NOT NULL,
    `loanId` VARCHAR(191) NOT NULL,
    `start` DATETIME(3) NOT NULL,
    `end` DATETIME(3) NOT NULL,
    `status` ENUM('Open', 'Closed', 'Cancelled') NOT NULL DEFAULT 'Open',
    `expectedPayment` DECIMAL(65, 30) NOT NULL,
    `expectedBalance` DECIMAL(65, 30) NULL DEFAULT 0,
    `expectedClosingBalance` DECIMAL(65, 30) NULL DEFAULT 0,
    `actualPayment` DECIMAL(65, 30) NULL,
    `openingBalance` DECIMAL(65, 30) NULL DEFAULT 0,
    `isExecuted` BOOLEAN NOT NULL DEFAULT false,
    `executedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LoanPenaltySchedule` (
    `id` VARCHAR(191) NOT NULL,
    `loanScheduleId` VARCHAR(191) NOT NULL,
    `start` DATETIME(3) NOT NULL,
    `end` DATETIME(3) NOT NULL,
    `percentage` DECIMAL(65, 30) NOT NULL,
    `isExecuted` BOOLEAN NOT NULL DEFAULT false,
    `executedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LoanDebitTrialSchedule` (
    `id` VARCHAR(191) NOT NULL,
    `loanScheduleId` VARCHAR(191) NOT NULL,
    `start` DATETIME(3) NOT NULL,
    `end` DATETIME(3) NOT NULL,
    `isExecuted` BOOLEAN NOT NULL DEFAULT false,
    `executedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LoanPenalty` (
    `id` VARCHAR(191) NOT NULL,
    `dayAfter` INTEGER NOT NULL,
    `percentage` DECIMAL(65, 30) NOT NULL,
    `status` ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Inactive',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LoanDebitTrial` (
    `id` VARCHAR(191) NOT NULL,
    `dayAfter` INTEGER NOT NULL,
    `status` ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Inactive',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LoanTransaction` (
    `id` VARCHAR(191) NOT NULL,
    `splitrId` VARCHAR(30) NOT NULL,
    `loanId` VARCHAR(191) NOT NULL,
    `transactionType` ENUM('principal', 'interest', 'penalty', 'other') NOT NULL,
    `transactionStatus` ENUM('Pending', 'Completed', 'Failed') NOT NULL DEFAULT 'Pending',
    `scheduleId` VARCHAR(191) NULL,
    `creditAmount` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `debitAmount` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `description` VARCHAR(191) NOT NULL,
    `referenceNumber` VARCHAR(191) NULL,
    `transactionDate` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `LoanTransaction_splitrId_key`(`splitrId`),
    UNIQUE INDEX `LoanTransaction_referenceNumber_key`(`referenceNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MerchantTransaction` (
    `id` VARCHAR(191) NOT NULL,
    `splitrId` VARCHAR(30) NOT NULL,
    `merchantId` VARCHAR(191) NOT NULL,
    `invoiceRef` VARCHAR(191) NULL,
    `credit` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `debit` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `transactionType` ENUM('Credit', 'Debit', 'Refund', 'Payment', 'Withdrawal', 'AutoSettlement', 'ManualSettlement', 'MerchantCharge', 'PayoutCharge', 'Other') NOT NULL,
    `transactionDate` DATETIME(3) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `status` ENUM('Pending', 'Completed', 'Failed') NOT NULL DEFAULT 'Pending',
    `isSettled` BOOLEAN NOT NULL DEFAULT false,
    `groupReference` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `MerchantTransaction_splitrId_key`(`splitrId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EligibilityAndScore` (
    `id` VARCHAR(191) NOT NULL,
    `buyerId` VARCHAR(191) NOT NULL,
    `approved` BOOLEAN NOT NULL DEFAULT false,
    `eligibility` DECIMAL(65, 30) NOT NULL,
    `score` DECIMAL(65, 30) NOT NULL,
    `dtiScore` DECIMAL(65, 30) NULL DEFAULT 0,
    `employmentDurationScore` DECIMAL(65, 30) NULL DEFAULT 0,
    `creditHistoryScore` DECIMAL(65, 30) NULL DEFAULT 0,
    `averageBalanceScore` DECIMAL(65, 30) NULL DEFAULT 0,
    `employmentStatusScore` DECIMAL(65, 30) NULL DEFAULT 0,
    `overdraftScore` DECIMAL(65, 30) NULL DEFAULT 0,
    `message` VARCHAR(191) NOT NULL,
    `finalApprovedLoan` DECIMAL(65, 30) NOT NULL,
    `maxEligibleLoan` DECIMAL(65, 30) NOT NULL,
    `monthlyRepayment` DECIMAL(65, 30) NOT NULL,
    `approvedPurchaseAmount` DECIMAL(65, 30) NOT NULL,
    `requiredDownPayment` DECIMAL(65, 30) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ScoringInputSnapshot` (
    `id` VARCHAR(191) NOT NULL,
    `buyerId` VARCHAR(191) NULL,
    `accountDetailsId` VARCHAR(191) NULL,
    `incomeMonths` INTEGER NOT NULL,
    `dominantSourceCount` INTEGER NOT NULL,
    `isFiftMonth` BOOLEAN NOT NULL,
    `isSixtMonth` BOOLEAN NOT NULL,
    `averageIncome` DECIMAL(15, 2) NOT NULL,
    `monthlyIncomes` JSON NOT NULL,
    `netCashFlowPositiveCount` INTEGER NOT NULL,
    `liquidityBuffer` JSON NOT NULL,
    `creditHistory` INTEGER NOT NULL,
    `riskFactor` JSON NOT NULL,
    `riskFlags` JSON NULL,
    `overdraftEvents` INTEGER NULL,
    `overdraftDeepestNegativeBalance` DECIMAL(15, 2) NULL,
    `overdraftNegativeDays` INTEGER NULL,
    `overdraftRecent` BOOLEAN NOT NULL,
    `existingLoanRepayment` DECIMAL(15, 2) NOT NULL,
    `incomeClassification` VARCHAR(191) NULL,
    `cashFlow` JSON NULL,
    `loanRepayment` JSON NULL,
    `numberOfUniquesNegativeBalances` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ScoringInputSnapshot_buyerId_idx`(`buyerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Invoice` (
    `id` VARCHAR(191) NOT NULL,
    `splitrId` VARCHAR(30) NOT NULL,
    `customerName` VARCHAR(191) NOT NULL,
    `customerEmail` VARCHAR(191) NOT NULL,
    `customerPhoneNumber` VARCHAR(191) NOT NULL,
    `dueDate` DATETIME(3) NOT NULL,
    `note` VARCHAR(191) NULL,
    `amount` DECIMAL(65, 30) NOT NULL,
    `buyerId` VARCHAR(191) NULL,
    `merchantId` VARCHAR(191) NOT NULL,
    `status` ENUM('Pending', 'Paid', 'Cancelled', 'Refunded', 'Expired') NOT NULL DEFAULT 'Pending',
    `type` ENUM('Purchase', 'Ecommerce', 'Shopping', 'Services', 'Invoice') NOT NULL DEFAULT 'Purchase',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `returnStatus` ENUM('Active', 'Approved', 'Rejected', 'Refunded', 'Pending') NULL DEFAULT 'Active',
    `returnAmount` DECIMAL(65, 30) NULL,
    `returnReason` VARCHAR(191) NULL,
    `returnNote` VARCHAR(191) NULL,
    `returnReference` VARCHAR(191) NULL,
    `returnInitiatedDate` DATETIME(3) NULL,
    `returnInitiatedBy` VARCHAR(191) NULL,
    `returnApprovedBy` VARCHAR(191) NULL,
    `returnApprovedDate` DATETIME(3) NULL,

    UNIQUE INDEX `Invoice_splitrId_key`(`splitrId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MandateDebit` (
    `id` VARCHAR(191) NOT NULL,
    `invoiceId` VARCHAR(191) NULL,
    `loanId` VARCHAR(191) NULL,
    `mandateId` VARCHAR(64) NOT NULL,
    `reference` VARCHAR(64) NOT NULL,
    `amount` DECIMAL(65, 30) NOT NULL,
    `transactionDate` DATETIME(3) NOT NULL,
    `status` ENUM('Pending', 'Completed', 'Failed') NOT NULL DEFAULT 'Pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `MandateDebit_invoiceId_idx`(`invoiceId`),
    INDEX `MandateDebit_loanId_idx`(`loanId`),
    INDEX `MandateDebit_mandateId_idx`(`mandateId`),
    UNIQUE INDEX `MandateDebit_mandateId_reference_key`(`mandateId`, `reference`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InvoiceMandate` (
    `id` VARCHAR(191) NOT NULL,
    `invoiceId` VARCHAR(191) NOT NULL,
    `loanId` VARCHAR(191) NULL,
    `monoMandateId` VARCHAR(191) NULL,
    `monoAccountId` VARCHAR(191) NOT NULL,
    `monoCustomerId` VARCHAR(191) NOT NULL,
    `buyerId` VARCHAR(191) NOT NULL,
    `referenceId` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(65, 30) NOT NULL,
    `updateMandateUrl` VARCHAR(191) NULL,
    `tenure` INTEGER NULL,
    `downPayment` DECIMAL(65, 30) NULL,
    `status` ENUM('Pending', 'Active', 'Completed', 'Failed', 'Cancelled') NOT NULL DEFAULT 'Pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DirectPay` (
    `id` VARCHAR(191) NOT NULL,
    `invoiceId` VARCHAR(191) NOT NULL,
    `mandateId` VARCHAR(191) NULL,
    `type` ENUM('LoanRepayment', 'DownPayment', 'Other') NOT NULL DEFAULT 'Other',
    `amount` DECIMAL(65, 30) NOT NULL,
    `status` ENUM('Pending', 'Processing', 'Completed', 'Failed', 'Cancelled') NOT NULL DEFAULT 'Pending',
    `buyerId` VARCHAR(191) NOT NULL,
    `reference` VARCHAR(191) NOT NULL,
    `monoUrl` VARCHAR(191) NULL,
    `monoAccountId` VARCHAR(191) NOT NULL,
    `monoCustomerId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `DirectPay_reference_key`(`reference`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Item` (
    `id` VARCHAR(191) NOT NULL,
    `invoiceId` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `amount` DECIMAL(65, 30) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Tier` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `from` DECIMAL(65, 30) NOT NULL,
    `to` DECIMAL(65, 30) NOT NULL,
    `status` ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
    `discounted` DECIMAL(65, 30) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Revenue` (
    `id` VARCHAR(191) NOT NULL,
    `splitrId` VARCHAR(30) NOT NULL,
    `credit` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `debit` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `description` VARCHAR(191) NOT NULL,
    `parentTable` VARCHAR(191) NULL,
    `type` ENUM('Repayment', 'Settlement', 'DownPayment', 'Refund') NOT NULL,
    `status` ENUM('Pending', 'Completed', 'Failed', 'Cancelled') NOT NULL DEFAULT 'Pending',
    `referenceIds` TEXT NOT NULL,
    `detail` TEXT NULL,
    `buyerId` VARCHAR(191) NULL,
    `merchantId` VARCHAR(191) NULL,
    `loanId` VARCHAR(191) NULL,
    `invoiceId` VARCHAR(191) NULL,
    `transactionDate` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Revenue_splitrId_key`(`splitrId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MonoConnect` (
    `id` VARCHAR(191) NOT NULL,
    `buyerId` VARCHAR(191) NOT NULL,
    `accountId` VARCHAR(50) NOT NULL,
    `status` ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `MonoConnect_buyerId_accountId_key`(`buyerId`, `accountId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AccountDetails` (
    `id` VARCHAR(191) NOT NULL,
    `accountId` VARCHAR(191) NULL,
    `exchangeMonoCode` VARCHAR(191) NULL,
    `buyerId` VARCHAR(191) NOT NULL,
    `bankStatement` JSON NULL,
    `BankName` VARCHAR(191) NULL,
    `AccountName` VARCHAR(191) NULL,
    `AccountNumber` VARCHAR(191) NULL,
    `customerId` VARCHAR(191) NULL,
    `employmentType` VARCHAR(191) NULL,
    `monthlyIncome` DECIMAL(15, 2) NULL,
    `overdraft` DECIMAL(15, 2) NULL,
    `existingLoanRepayment` DECIMAL(15, 2) NULL,
    `creditHistory` TEXT NULL,
    `employmentDuration` INTEGER NULL,
    `averageBalance` DECIMAL(15, 2) NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PaystackMerchantTransferRecipient` (
    `id` VARCHAR(191) NOT NULL,
    `merchantId` VARCHAR(191) NULL,
    `buyerId` VARCHAR(191) NULL,
    `recipientId` VARCHAR(191) NULL,
    `recipientCode` VARCHAR(191) NOT NULL,
    `bankCode` VARCHAR(191) NOT NULL,
    `bankName` VARCHAR(191) NOT NULL,
    `accountNumber` VARCHAR(191) NOT NULL,
    `accountName` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PaystackMerchantTransferRecipient_recipientCode_key`(`recipientCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PaystackTransfer` (
    `id` VARCHAR(191) NOT NULL,
    `referenceId` VARCHAR(191) NOT NULL,
    `merchantId` VARCHAR(191) NULL,
    `buyerId` VARCHAR(191) NULL,
    `amount` DECIMAL(65, 30) NOT NULL,
    `recipientCode` VARCHAR(191) NOT NULL,
    `status` ENUM('Pending', 'Processing', 'Success', 'Failed', 'Cancelled') NOT NULL DEFAULT 'Pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PaystackTransfer_referenceId_key`(`referenceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_approvedById_fkey` FOREIGN KEY (`approvedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_modifiedById_fkey` FOREIGN KEY (`modifiedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_merchantId_fkey` FOREIGN KEY (`merchantId`) REFERENCES `Merchant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `linked_user` ADD CONSTRAINT `linked_user_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PasswordResetToken` ADD CONSTRAINT `PasswordResetToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Buyer` ADD CONSTRAINT `Buyer_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Buyer` ADD CONSTRAINT `Buyer_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Buyer` ADD CONSTRAINT `Buyer_approvedById_fkey` FOREIGN KEY (`approvedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Buyer` ADD CONSTRAINT `Buyer_modifiedById_fkey` FOREIGN KEY (`modifiedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Merchant` ADD CONSTRAINT `Merchant_agreedToTermsBy_fkey` FOREIGN KEY (`agreedToTermsBy`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MerchantShareHolder` ADD CONSTRAINT `MerchantShareHolder_merchantId_fkey` FOREIGN KEY (`merchantId`) REFERENCES `Merchant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MerchantDirector` ADD CONSTRAINT `MerchantDirector_merchantId_fkey` FOREIGN KEY (`merchantId`) REFERENCES `Merchant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BankAccount` ADD CONSTRAINT `BankAccount_merchantId_fkey` FOREIGN KEY (`merchantId`) REFERENCES `Merchant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BankAccount` ADD CONSTRAINT `BankAccount_bankId_fkey` FOREIGN KEY (`bankId`) REFERENCES `Bank`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MerchantAuthoriser` ADD CONSTRAINT `MerchantAuthoriser_merchantId_fkey` FOREIGN KEY (`merchantId`) REFERENCES `Merchant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RejectionReason` ADD CONSTRAINT `RejectionReason_merchantId_fkey` FOREIGN KEY (`merchantId`) REFERENCES `Merchant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Loan` ADD CONSTRAINT `Loan_buyerId_fkey` FOREIGN KEY (`buyerId`) REFERENCES `Buyer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Loan` ADD CONSTRAINT `Loan_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `Invoice`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Loan` ADD CONSTRAINT `Loan_merchantId_fkey` FOREIGN KEY (`merchantId`) REFERENCES `Merchant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LoanSchedule` ADD CONSTRAINT `LoanSchedule_loanId_fkey` FOREIGN KEY (`loanId`) REFERENCES `Loan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LoanPenaltySchedule` ADD CONSTRAINT `LoanPenaltySchedule_loanScheduleId_fkey` FOREIGN KEY (`loanScheduleId`) REFERENCES `LoanSchedule`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LoanDebitTrialSchedule` ADD CONSTRAINT `LoanDebitTrialSchedule_loanScheduleId_fkey` FOREIGN KEY (`loanScheduleId`) REFERENCES `LoanSchedule`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LoanTransaction` ADD CONSTRAINT `LoanTransaction_loanId_fkey` FOREIGN KEY (`loanId`) REFERENCES `Loan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LoanTransaction` ADD CONSTRAINT `LoanTransaction_scheduleId_fkey` FOREIGN KEY (`scheduleId`) REFERENCES `LoanSchedule`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MerchantTransaction` ADD CONSTRAINT `MerchantTransaction_merchantId_fkey` FOREIGN KEY (`merchantId`) REFERENCES `Merchant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MerchantTransaction` ADD CONSTRAINT `MerchantTransaction_invoiceRef_fkey` FOREIGN KEY (`invoiceRef`) REFERENCES `Invoice`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EligibilityAndScore` ADD CONSTRAINT `EligibilityAndScore_buyerId_fkey` FOREIGN KEY (`buyerId`) REFERENCES `Buyer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ScoringInputSnapshot` ADD CONSTRAINT `ScoringInputSnapshot_buyerId_fkey` FOREIGN KEY (`buyerId`) REFERENCES `Buyer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ScoringInputSnapshot` ADD CONSTRAINT `ScoringInputSnapshot_accountDetailsId_fkey` FOREIGN KEY (`accountDetailsId`) REFERENCES `AccountDetails`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Invoice` ADD CONSTRAINT `Invoice_buyerId_fkey` FOREIGN KEY (`buyerId`) REFERENCES `Buyer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Invoice` ADD CONSTRAINT `Invoice_merchantId_fkey` FOREIGN KEY (`merchantId`) REFERENCES `Merchant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MandateDebit` ADD CONSTRAINT `MandateDebit_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `Invoice`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MandateDebit` ADD CONSTRAINT `MandateDebit_loanId_fkey` FOREIGN KEY (`loanId`) REFERENCES `Loan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InvoiceMandate` ADD CONSTRAINT `InvoiceMandate_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `Invoice`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InvoiceMandate` ADD CONSTRAINT `InvoiceMandate_loanId_fkey` FOREIGN KEY (`loanId`) REFERENCES `Loan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InvoiceMandate` ADD CONSTRAINT `InvoiceMandate_buyerId_fkey` FOREIGN KEY (`buyerId`) REFERENCES `Buyer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DirectPay` ADD CONSTRAINT `DirectPay_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `Invoice`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DirectPay` ADD CONSTRAINT `DirectPay_mandateId_fkey` FOREIGN KEY (`mandateId`) REFERENCES `InvoiceMandate`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DirectPay` ADD CONSTRAINT `DirectPay_buyerId_fkey` FOREIGN KEY (`buyerId`) REFERENCES `Buyer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Item` ADD CONSTRAINT `Item_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `Invoice`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Revenue` ADD CONSTRAINT `Revenue_buyerId_fkey` FOREIGN KEY (`buyerId`) REFERENCES `Buyer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Revenue` ADD CONSTRAINT `Revenue_merchantId_fkey` FOREIGN KEY (`merchantId`) REFERENCES `Merchant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Revenue` ADD CONSTRAINT `Revenue_loanId_fkey` FOREIGN KEY (`loanId`) REFERENCES `Loan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Revenue` ADD CONSTRAINT `Revenue_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `Invoice`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MonoConnect` ADD CONSTRAINT `MonoConnect_buyerId_fkey` FOREIGN KEY (`buyerId`) REFERENCES `Buyer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AccountDetails` ADD CONSTRAINT `AccountDetails_buyerId_fkey` FOREIGN KEY (`buyerId`) REFERENCES `Buyer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaystackMerchantTransferRecipient` ADD CONSTRAINT `PaystackMerchantTransferRecipient_merchantId_fkey` FOREIGN KEY (`merchantId`) REFERENCES `Merchant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaystackMerchantTransferRecipient` ADD CONSTRAINT `PaystackMerchantTransferRecipient_buyerId_fkey` FOREIGN KEY (`buyerId`) REFERENCES `Buyer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaystackTransfer` ADD CONSTRAINT `PaystackTransfer_merchantId_fkey` FOREIGN KEY (`merchantId`) REFERENCES `Merchant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaystackTransfer` ADD CONSTRAINT `PaystackTransfer_buyerId_fkey` FOREIGN KEY (`buyerId`) REFERENCES `Buyer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
