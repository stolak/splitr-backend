/*
  Warnings:

  - You are about to drop the `accountdetails` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `bankaccount` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `directpay` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `eligibilityandscore` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `invoicemandate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `loandebittrial` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `loandebittrialschedule` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `loanpenalty` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `loanpenaltyschedule` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `loanschedule` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `loansetting` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `loantransaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `mandatedebit` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `merchantauthoriser` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `merchantdirector` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `merchantshareholder` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `merchanttransaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `monoconnect` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `passwordresettoken` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `paystackmerchanttransferrecipient` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `paystacktransfer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `rejectionreason` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `scoringinputsnapshot` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `settlementsetting` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `timeoutsetting` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX `Invoice_buyerId_fkey` ON `invoice`;

-- DropIndex
DROP INDEX `Invoice_merchantId_fkey` ON `invoice`;

-- DropIndex
DROP INDEX `Item_invoiceId_fkey` ON `item`;

-- DropIndex
DROP INDEX `Loan_buyerId_fkey` ON `loan`;

-- DropIndex
DROP INDEX `Loan_merchantId_fkey` ON `loan`;

-- DropIndex
DROP INDEX `Merchant_agreedToTermsBy_fkey` ON `merchant`;

-- DropIndex
DROP INDEX `Revenue_buyerId_fkey` ON `revenue`;

-- DropIndex
DROP INDEX `Revenue_invoiceId_fkey` ON `revenue`;

-- DropIndex
DROP INDEX `Revenue_loanId_fkey` ON `revenue`;

-- DropIndex
DROP INDEX `Revenue_merchantId_fkey` ON `revenue`;

-- DropIndex
DROP INDEX `User_approvedById_fkey` ON `user`;

-- DropIndex
DROP INDEX `User_createdById_fkey` ON `user`;

-- DropIndex
DROP INDEX `User_merchantId_fkey` ON `user`;

-- DropIndex
DROP INDEX `User_modifiedById_fkey` ON `user`;

-- AlterTable
ALTER TABLE `merchant` MODIFY `businessDescription` VARCHAR(30000) NULL;

-- DropTable
DROP TABLE `accountdetails`;

-- DropTable
DROP TABLE `bankaccount`;

-- DropTable
DROP TABLE `directpay`;

-- DropTable
DROP TABLE `eligibilityandscore`;

-- DropTable
DROP TABLE `invoicemandate`;

-- DropTable
DROP TABLE `loandebittrial`;

-- DropTable
DROP TABLE `loandebittrialschedule`;

-- DropTable
DROP TABLE `loanpenalty`;

-- DropTable
DROP TABLE `loanpenaltyschedule`;

-- DropTable
DROP TABLE `loanschedule`;

-- DropTable
DROP TABLE `loansetting`;

-- DropTable
DROP TABLE `loantransaction`;

-- DropTable
DROP TABLE `mandatedebit`;

-- DropTable
DROP TABLE `merchantauthoriser`;

-- DropTable
DROP TABLE `merchantdirector`;

-- DropTable
DROP TABLE `merchantshareholder`;

-- DropTable
DROP TABLE `merchanttransaction`;

-- DropTable
DROP TABLE `monoconnect`;

-- DropTable
DROP TABLE `passwordresettoken`;

-- DropTable
DROP TABLE `paystackmerchanttransferrecipient`;

-- DropTable
DROP TABLE `paystacktransfer`;

-- DropTable
DROP TABLE `rejectionreason`;

-- DropTable
DROP TABLE `scoringinputsnapshot`;

-- DropTable
DROP TABLE `settlementsetting`;

-- DropTable
DROP TABLE `timeoutsetting`;

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

-- RenameIndex
ALTER TABLE `bank` RENAME INDEX `Bank_bankCode_key` TO `bank_bankCode_key`;

-- RenameIndex
ALTER TABLE `invoice` RENAME INDEX `Invoice_splitrId_key` TO `invoice_splitrId_key`;

-- RenameIndex
ALTER TABLE `loan` RENAME INDEX `Loan_invoiceId_key` TO `loan_invoiceId_key`;

-- RenameIndex
ALTER TABLE `loan` RENAME INDEX `Loan_splitrId_key` TO `loan_splitrId_key`;

-- RenameIndex
ALTER TABLE `merchant` RENAME INDEX `Merchant_authorizedEmail_key` TO `merchant_authorizedEmail_key`;

-- RenameIndex
ALTER TABLE `merchant` RENAME INDEX `Merchant_businessEmail_key` TO `merchant_businessEmail_key`;

-- RenameIndex
ALTER TABLE `merchant` RENAME INDEX `Merchant_businessPhone_key` TO `merchant_businessPhone_key`;

-- RenameIndex
ALTER TABLE `merchant` RENAME INDEX `Merchant_cacNumber_key` TO `merchant_cacNumber_key`;

-- RenameIndex
ALTER TABLE `merchant` RENAME INDEX `Merchant_officeWebsite_key` TO `merchant_officeWebsite_key`;

-- RenameIndex
ALTER TABLE `merchant` RENAME INDEX `Merchant_splitrId_key` TO `merchant_splitrId_key`;

-- RenameIndex
ALTER TABLE `merchant` RENAME INDEX `Merchant_tin_key` TO `merchant_tin_key`;

-- RenameIndex
ALTER TABLE `revenue` RENAME INDEX `Revenue_splitrId_key` TO `revenue_splitrId_key`;

-- RenameIndex
ALTER TABLE `user` RENAME INDEX `User_email_key` TO `user_email_key`;
