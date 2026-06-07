-- DropIndex
DROP INDEX `AccountDetails_buyerId_fkey` ON `accountdetails`;

-- DropIndex
DROP INDEX `BankAccount_bankId_fkey` ON `bankaccount`;

-- DropIndex
DROP INDEX `BankAccount_merchantId_fkey` ON `bankaccount`;

-- DropIndex
DROP INDEX `Buyer_approvedById_fkey` ON `buyer`;

-- DropIndex
DROP INDEX `Buyer_createdById_fkey` ON `buyer`;

-- DropIndex
DROP INDEX `Buyer_modifiedById_fkey` ON `buyer`;

-- DropIndex
DROP INDEX `DirectPay_buyerId_fkey` ON `directpay`;

-- DropIndex
DROP INDEX `DirectPay_invoiceId_fkey` ON `directpay`;

-- DropIndex
DROP INDEX `DirectPay_mandateId_fkey` ON `directpay`;

-- DropIndex
DROP INDEX `EligibilityAndScore_buyerId_fkey` ON `eligibilityandscore`;

-- DropIndex
DROP INDEX `Invoice_buyerId_fkey` ON `invoice`;

-- DropIndex
DROP INDEX `Invoice_merchantId_fkey` ON `invoice`;

-- DropIndex
DROP INDEX `InvoiceMandate_buyerId_fkey` ON `invoicemandate`;

-- DropIndex
DROP INDEX `InvoiceMandate_invoiceId_fkey` ON `invoicemandate`;

-- DropIndex
DROP INDEX `InvoiceMandate_loanId_fkey` ON `invoicemandate`;

-- DropIndex
DROP INDEX `Item_invoiceId_fkey` ON `item`;

-- DropIndex
DROP INDEX `Loan_buyerId_fkey` ON `loan`;

-- DropIndex
DROP INDEX `Loan_merchantId_fkey` ON `loan`;

-- DropIndex
DROP INDEX `LoanDebitTrialSchedule_loanScheduleId_fkey` ON `loandebittrialschedule`;

-- DropIndex
DROP INDEX `LoanPenaltySchedule_loanScheduleId_fkey` ON `loanpenaltyschedule`;

-- DropIndex
DROP INDEX `LoanSchedule_loanId_fkey` ON `loanschedule`;

-- DropIndex
DROP INDEX `LoanTransaction_loanId_fkey` ON `loantransaction`;

-- DropIndex
DROP INDEX `LoanTransaction_scheduleId_fkey` ON `loantransaction`;

-- DropIndex
DROP INDEX `Merchant_agreedToTermsBy_fkey` ON `merchant`;

-- DropIndex
DROP INDEX `MerchantAuthoriser_merchantId_fkey` ON `merchantauthoriser`;

-- DropIndex
DROP INDEX `MerchantDirector_merchantId_fkey` ON `merchantdirector`;

-- DropIndex
DROP INDEX `MerchantShareHolder_merchantId_fkey` ON `merchantshareholder`;

-- DropIndex
DROP INDEX `MerchantTransaction_invoiceRef_fkey` ON `merchanttransaction`;

-- DropIndex
DROP INDEX `MerchantTransaction_merchantId_fkey` ON `merchanttransaction`;

-- DropIndex
DROP INDEX `PaystackMerchantTransferRecipient_buyerId_fkey` ON `paystackmerchanttransferrecipient`;

-- DropIndex
DROP INDEX `PaystackMerchantTransferRecipient_merchantId_fkey` ON `paystackmerchanttransferrecipient`;

-- DropIndex
DROP INDEX `PaystackTransfer_buyerId_fkey` ON `paystacktransfer`;

-- DropIndex
DROP INDEX `PaystackTransfer_merchantId_fkey` ON `paystacktransfer`;

-- DropIndex
DROP INDEX `RejectionReason_merchantId_fkey` ON `rejectionreason`;

-- DropIndex
DROP INDEX `Revenue_buyerId_fkey` ON `revenue`;

-- DropIndex
DROP INDEX `Revenue_invoiceId_fkey` ON `revenue`;

-- DropIndex
DROP INDEX `Revenue_loanId_fkey` ON `revenue`;

-- DropIndex
DROP INDEX `Revenue_merchantId_fkey` ON `revenue`;

-- DropIndex
DROP INDEX `ScoringInputSnapshot_accountDetailsId_fkey` ON `scoringinputsnapshot`;

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
