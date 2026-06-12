-- CreateTable
CREATE TABLE `user` (
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

    UNIQUE INDEX `user_email_key`(`email`),
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
CREATE TABLE `password_reset_token` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `used` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `password_reset_token_token_key`(`token`),
    INDEX `password_reset_token_userId_idx`(`userId`),
    INDEX `password_reset_token_token_idx`(`token`),
    INDEX `password_reset_token_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `buyer` (
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
    `sinNumber` VARCHAR(191) NULL,
    `sinExpiryDate` VARCHAR(191) NULL,
    `photo` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `province` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `houseNo` VARCHAR(191) NULL,
    `postalCode` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT false,
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `isEmailVerified` BOOLEAN NOT NULL DEFAULT true,
    `isPhoneVerified` BOOLEAN NOT NULL DEFAULT true,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `IsTermsAndConditionAccepted` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `buyer_splitrId_key`(`splitrId`),
    UNIQUE INDEX `buyer_userId_key`(`userId`),
    UNIQUE INDEX `buyer_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `merchant` (
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

    UNIQUE INDEX `merchant_splitrId_key`(`splitrId`),
    UNIQUE INDEX `merchant_businessEmail_key`(`businessEmail`),
    UNIQUE INDEX `merchant_authorizedEmail_key`(`authorizedEmail`),
    UNIQUE INDEX `merchant_cacNumber_key`(`cacNumber`),
    UNIQUE INDEX `merchant_tin_key`(`tin`),
    UNIQUE INDEX `merchant_businessPhone_key`(`businessPhone`),
    UNIQUE INDEX `merchant_officeWebsite_key`(`officeWebsite`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `merchant_share_holder` (
    `id` VARCHAR(191) NOT NULL,
    `merchantId` VARCHAR(191) NOT NULL,
    `shareholder` VARCHAR(191) NULL,
    `holding` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `merchant_director` (
    `id` VARCHAR(191) NOT NULL,
    `merchantId` VARCHAR(191) NOT NULL,
    `director` VARCHAR(191) NULL,
    `position` VARCHAR(191) NULL,
    `doc` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bank_account` (
    `id` VARCHAR(191) NOT NULL,
    `bankId` VARCHAR(191) NOT NULL,
    `merchantId` VARCHAR(191) NOT NULL,
    `accountName` VARCHAR(191) NOT NULL,
    `accountNumber` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bank` (
    `id` VARCHAR(191) NOT NULL,
    `bankCode` VARCHAR(191) NOT NULL,
    `bankName` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `bank_bankCode_key`(`bankCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `merchant_authoriser` (
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
CREATE TABLE `rejection_reason` (
    `id` VARCHAR(191) NOT NULL,
    `merchantId` VARCHAR(191) NOT NULL,
    `rejectionReason` VARCHAR(10000) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdById` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `loan_setting` (
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
CREATE TABLE `settlement_setting` (
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
CREATE TABLE `time_out_setting` (
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
CREATE TABLE `loan` (
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

    UNIQUE INDEX `loan_splitrId_key`(`splitrId`),
    UNIQUE INDEX `loan_invoiceId_key`(`invoiceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `loan_schedule` (
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
CREATE TABLE `loan_penalty_schedule` (
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
CREATE TABLE `loan_debit_trial_schedule` (
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
CREATE TABLE `loan_penalty` (
    `id` VARCHAR(191) NOT NULL,
    `dayAfter` INTEGER NOT NULL,
    `percentage` DECIMAL(65, 30) NOT NULL,
    `status` ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Inactive',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `loan_debit_trial` (
    `id` VARCHAR(191) NOT NULL,
    `dayAfter` INTEGER NOT NULL,
    `status` ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Inactive',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `loan_transaction` (
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

    UNIQUE INDEX `loan_transaction_splitrId_key`(`splitrId`),
    UNIQUE INDEX `loan_transaction_referenceNumber_key`(`referenceNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `merchant_transaction` (
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

    UNIQUE INDEX `merchant_transaction_splitrId_key`(`splitrId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `eligibility_and_score` (
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
CREATE TABLE `scoring_input_snapshot` (
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

    INDEX `scoring_input_snapshot_buyerId_idx`(`buyerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoice` (
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

    UNIQUE INDEX `invoice_splitrId_key`(`splitrId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mandate_debit` (
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

    INDEX `mandate_debit_invoiceId_idx`(`invoiceId`),
    INDEX `mandate_debit_loanId_idx`(`loanId`),
    INDEX `mandate_debit_mandateId_idx`(`mandateId`),
    UNIQUE INDEX `mandate_debit_mandateId_reference_key`(`mandateId`, `reference`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoice_mandate` (
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
CREATE TABLE `direct_pay` (
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

    UNIQUE INDEX `direct_pay_reference_key`(`reference`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `item` (
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
CREATE TABLE `tier` (
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
CREATE TABLE `revenue` (
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

    UNIQUE INDEX `revenue_splitrId_key`(`splitrId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mono_connect` (
    `id` VARCHAR(191) NOT NULL,
    `buyerId` VARCHAR(191) NOT NULL,
    `accountId` VARCHAR(50) NOT NULL,
    `status` ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `mono_connect_buyerId_accountId_key`(`buyerId`, `accountId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `account_details` (
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
CREATE TABLE `paystack_merchant_transfer_recipient` (
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

    UNIQUE INDEX `paystack_merchant_transfer_recipient_recipientCode_key`(`recipientCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `paystack_transfer` (
    `id` VARCHAR(191) NOT NULL,
    `referenceId` VARCHAR(191) NOT NULL,
    `merchantId` VARCHAR(191) NULL,
    `buyerId` VARCHAR(191) NULL,
    `amount` DECIMAL(65, 30) NOT NULL,
    `recipientCode` VARCHAR(191) NOT NULL,
    `status` ENUM('Pending', 'Processing', 'Success', 'Failed', 'Cancelled') NOT NULL DEFAULT 'Pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `paystack_transfer_referenceId_key`(`referenceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `splitr_sequence` (
    `prefix` VARCHAR(10) NOT NULL,
    `year_month` CHAR(4) NOT NULL,
    `seq` INTEGER NOT NULL DEFAULT 100000,

    PRIMARY KEY (`prefix`, `year_month`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user` ADD CONSTRAINT `user_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user` ADD CONSTRAINT `user_approvedById_fkey` FOREIGN KEY (`approvedById`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user` ADD CONSTRAINT `user_modifiedById_fkey` FOREIGN KEY (`modifiedById`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user` ADD CONSTRAINT `user_merchantId_fkey` FOREIGN KEY (`merchantId`) REFERENCES `merchant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `linked_user` ADD CONSTRAINT `linked_user_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `password_reset_token` ADD CONSTRAINT `password_reset_token_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `buyer` ADD CONSTRAINT `buyer_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `merchant` ADD CONSTRAINT `merchant_agreedToTermsBy_fkey` FOREIGN KEY (`agreedToTermsBy`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `merchant_share_holder` ADD CONSTRAINT `merchant_share_holder_merchantId_fkey` FOREIGN KEY (`merchantId`) REFERENCES `merchant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `merchant_director` ADD CONSTRAINT `merchant_director_merchantId_fkey` FOREIGN KEY (`merchantId`) REFERENCES `merchant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bank_account` ADD CONSTRAINT `bank_account_merchantId_fkey` FOREIGN KEY (`merchantId`) REFERENCES `merchant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bank_account` ADD CONSTRAINT `bank_account_bankId_fkey` FOREIGN KEY (`bankId`) REFERENCES `bank`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `merchant_authoriser` ADD CONSTRAINT `merchant_authoriser_merchantId_fkey` FOREIGN KEY (`merchantId`) REFERENCES `merchant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rejection_reason` ADD CONSTRAINT `rejection_reason_merchantId_fkey` FOREIGN KEY (`merchantId`) REFERENCES `merchant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loan` ADD CONSTRAINT `loan_buyerId_fkey` FOREIGN KEY (`buyerId`) REFERENCES `buyer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loan` ADD CONSTRAINT `loan_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `invoice`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loan` ADD CONSTRAINT `loan_merchantId_fkey` FOREIGN KEY (`merchantId`) REFERENCES `merchant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loan_schedule` ADD CONSTRAINT `loan_schedule_loanId_fkey` FOREIGN KEY (`loanId`) REFERENCES `loan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loan_penalty_schedule` ADD CONSTRAINT `loan_penalty_schedule_loanScheduleId_fkey` FOREIGN KEY (`loanScheduleId`) REFERENCES `loan_schedule`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loan_debit_trial_schedule` ADD CONSTRAINT `loan_debit_trial_schedule_loanScheduleId_fkey` FOREIGN KEY (`loanScheduleId`) REFERENCES `loan_schedule`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loan_transaction` ADD CONSTRAINT `loan_transaction_loanId_fkey` FOREIGN KEY (`loanId`) REFERENCES `loan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loan_transaction` ADD CONSTRAINT `loan_transaction_scheduleId_fkey` FOREIGN KEY (`scheduleId`) REFERENCES `loan_schedule`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `merchant_transaction` ADD CONSTRAINT `merchant_transaction_merchantId_fkey` FOREIGN KEY (`merchantId`) REFERENCES `merchant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `merchant_transaction` ADD CONSTRAINT `merchant_transaction_invoiceRef_fkey` FOREIGN KEY (`invoiceRef`) REFERENCES `invoice`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `eligibility_and_score` ADD CONSTRAINT `eligibility_and_score_buyerId_fkey` FOREIGN KEY (`buyerId`) REFERENCES `buyer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `scoring_input_snapshot` ADD CONSTRAINT `scoring_input_snapshot_buyerId_fkey` FOREIGN KEY (`buyerId`) REFERENCES `buyer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `scoring_input_snapshot` ADD CONSTRAINT `scoring_input_snapshot_accountDetailsId_fkey` FOREIGN KEY (`accountDetailsId`) REFERENCES `account_details`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoice` ADD CONSTRAINT `invoice_buyerId_fkey` FOREIGN KEY (`buyerId`) REFERENCES `buyer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoice` ADD CONSTRAINT `invoice_merchantId_fkey` FOREIGN KEY (`merchantId`) REFERENCES `merchant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mandate_debit` ADD CONSTRAINT `mandate_debit_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `invoice`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mandate_debit` ADD CONSTRAINT `mandate_debit_loanId_fkey` FOREIGN KEY (`loanId`) REFERENCES `loan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoice_mandate` ADD CONSTRAINT `invoice_mandate_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `invoice`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoice_mandate` ADD CONSTRAINT `invoice_mandate_loanId_fkey` FOREIGN KEY (`loanId`) REFERENCES `loan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoice_mandate` ADD CONSTRAINT `invoice_mandate_buyerId_fkey` FOREIGN KEY (`buyerId`) REFERENCES `buyer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `direct_pay` ADD CONSTRAINT `direct_pay_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `invoice`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `direct_pay` ADD CONSTRAINT `direct_pay_mandateId_fkey` FOREIGN KEY (`mandateId`) REFERENCES `invoice_mandate`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `direct_pay` ADD CONSTRAINT `direct_pay_buyerId_fkey` FOREIGN KEY (`buyerId`) REFERENCES `buyer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item` ADD CONSTRAINT `item_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `invoice`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `revenue` ADD CONSTRAINT `revenue_buyerId_fkey` FOREIGN KEY (`buyerId`) REFERENCES `buyer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `revenue` ADD CONSTRAINT `revenue_merchantId_fkey` FOREIGN KEY (`merchantId`) REFERENCES `merchant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `revenue` ADD CONSTRAINT `revenue_loanId_fkey` FOREIGN KEY (`loanId`) REFERENCES `loan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `revenue` ADD CONSTRAINT `revenue_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `invoice`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mono_connect` ADD CONSTRAINT `mono_connect_buyerId_fkey` FOREIGN KEY (`buyerId`) REFERENCES `buyer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `account_details` ADD CONSTRAINT `account_details_buyerId_fkey` FOREIGN KEY (`buyerId`) REFERENCES `buyer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `paystack_merchant_transfer_recipient` ADD CONSTRAINT `paystack_merchant_transfer_recipient_merchantId_fkey` FOREIGN KEY (`merchantId`) REFERENCES `merchant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `paystack_merchant_transfer_recipient` ADD CONSTRAINT `paystack_merchant_transfer_recipient_buyerId_fkey` FOREIGN KEY (`buyerId`) REFERENCES `buyer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `paystack_transfer` ADD CONSTRAINT `paystack_transfer_merchantId_fkey` FOREIGN KEY (`merchantId`) REFERENCES `merchant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `paystack_transfer` ADD CONSTRAINT `paystack_transfer_buyerId_fkey` FOREIGN KEY (`buyerId`) REFERENCES `buyer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
