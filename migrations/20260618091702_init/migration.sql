-- DropIndex
DROP INDEX `account_details_buyerId_fkey` ON `account_details`;

-- DropIndex
DROP INDEX `bank_account_bankId_fkey` ON `bank_account`;

-- DropIndex
DROP INDEX `bank_account_merchantId_fkey` ON `bank_account`;

-- DropIndex
DROP INDEX `direct_pay_buyerId_fkey` ON `direct_pay`;

-- DropIndex
DROP INDEX `direct_pay_invoiceId_fkey` ON `direct_pay`;

-- DropIndex
DROP INDEX `direct_pay_mandateId_fkey` ON `direct_pay`;

-- DropIndex
DROP INDEX `eligibility_and_score_buyerId_fkey` ON `eligibility_and_score`;

-- DropIndex
DROP INDEX `invoice_buyerId_fkey` ON `invoice`;

-- DropIndex
DROP INDEX `invoice_merchantId_fkey` ON `invoice`;

-- DropIndex
DROP INDEX `invoice_mandate_buyerId_fkey` ON `invoice_mandate`;

-- DropIndex
DROP INDEX `invoice_mandate_invoiceId_fkey` ON `invoice_mandate`;

-- DropIndex
DROP INDEX `invoice_mandate_loanId_fkey` ON `invoice_mandate`;

-- DropIndex
DROP INDEX `item_invoiceId_fkey` ON `item`;

-- DropIndex
DROP INDEX `loan_buyerId_fkey` ON `loan`;

-- DropIndex
DROP INDEX `loan_merchantId_fkey` ON `loan`;

-- DropIndex
DROP INDEX `loan_debit_trial_schedule_loanScheduleId_fkey` ON `loan_debit_trial_schedule`;

-- DropIndex
DROP INDEX `loan_penalty_schedule_loanScheduleId_fkey` ON `loan_penalty_schedule`;

-- DropIndex
DROP INDEX `loan_schedule_loanId_fkey` ON `loan_schedule`;

-- DropIndex
DROP INDEX `loan_transaction_loanId_fkey` ON `loan_transaction`;

-- DropIndex
DROP INDEX `loan_transaction_scheduleId_fkey` ON `loan_transaction`;

-- DropIndex
DROP INDEX `merchant_agreedToTermsBy_fkey` ON `merchant`;

-- DropIndex
DROP INDEX `merchant_authoriser_merchantId_fkey` ON `merchant_authoriser`;

-- DropIndex
DROP INDEX `merchant_director_merchantId_fkey` ON `merchant_director`;

-- DropIndex
DROP INDEX `merchant_share_holder_merchantId_fkey` ON `merchant_share_holder`;

-- DropIndex
DROP INDEX `merchant_transaction_invoiceRef_fkey` ON `merchant_transaction`;

-- DropIndex
DROP INDEX `merchant_transaction_merchantId_fkey` ON `merchant_transaction`;

-- DropIndex
DROP INDEX `paystack_merchant_transfer_recipient_buyerId_fkey` ON `paystack_merchant_transfer_recipient`;

-- DropIndex
DROP INDEX `paystack_merchant_transfer_recipient_merchantId_fkey` ON `paystack_merchant_transfer_recipient`;

-- DropIndex
DROP INDEX `paystack_transfer_buyerId_fkey` ON `paystack_transfer`;

-- DropIndex
DROP INDEX `paystack_transfer_merchantId_fkey` ON `paystack_transfer`;

-- DropIndex
DROP INDEX `persona_inquiry_buyerId_fkey` ON `persona_inquiry`;

-- DropIndex
DROP INDEX `rejection_reason_merchantId_fkey` ON `rejection_reason`;

-- DropIndex
DROP INDEX `revenue_buyerId_fkey` ON `revenue`;

-- DropIndex
DROP INDEX `revenue_invoiceId_fkey` ON `revenue`;

-- DropIndex
DROP INDEX `revenue_loanId_fkey` ON `revenue`;

-- DropIndex
DROP INDEX `revenue_merchantId_fkey` ON `revenue`;

-- DropIndex
DROP INDEX `scoring_input_snapshot_accountDetailsId_fkey` ON `scoring_input_snapshot`;

-- DropIndex
DROP INDEX `user_approvedById_fkey` ON `user`;

-- DropIndex
DROP INDEX `user_createdById_fkey` ON `user`;

-- DropIndex
DROP INDEX `user_merchantId_fkey` ON `user`;

-- DropIndex
DROP INDEX `user_modifiedById_fkey` ON `user`;

-- AlterTable
ALTER TABLE `merchant` MODIFY `businessDescription` VARCHAR(30000) NULL;

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

-- AddForeignKey
ALTER TABLE `persona_inquiry` ADD CONSTRAINT `persona_inquiry_buyerId_fkey` FOREIGN KEY (`buyerId`) REFERENCES `buyer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
