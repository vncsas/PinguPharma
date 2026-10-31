import { prisma } from "../../infrastructure/database/prisma-client.js";
import { PrismaUserRepository } from "../../infrastructure/database/repositories/PrismaUserRepository.js";
import { PrismaProductRepository } from "../../infrastructure/database/repositories/PrismaProductRepository.js";
import { PrismaDispensationRepository } from "../../infrastructure/database/repositories/PrismaDispensationRepository.js";
import { PrismaPatientRepository } from "../../infrastructure/database/repositories/PrismaPatientRepository.js";
import { PrismaPrescriptionRepository } from "../../infrastructure/database/repositories/PrismaPrescriptionRepository.js";
import { PrismaUnitRepository } from "../../infrastructure/database/repositories/PrismaUnitRepository.js";
import { PrismaSupplierRepository } from "../../infrastructure/database/repositories/PrismaSupplierRepository.js";
import { PrismaStockMovementRepository } from "../../infrastructure/database/repositories/PrismaStockMovementRepository.js";
import { PrismaTransferRepository } from "../../infrastructure/database/repositories/PrismaTransferRepository.js";
import { PrismaReportRepository } from "../../infrastructure/database/repositories/PrismaReportRepository.js";
import { PrismaActivityLogRepository } from "../../infrastructure/database/repositories/PrismaActivityLogRepository.js";
import { PrismaBatchRepository } from "../../infrastructure/database/repositories/PrismaBatchRepository.js";
import { BcryptHasher } from "../../infrastructure/security/BcryptHasher.js";
import { JwtTokenService } from "../../infrastructure/security/JwtTokenService.js";
import { CachedSessionValidator } from "../../infrastructure/security/CachedSessionValidator.js";
import { OtpTwoFactorService } from "../../infrastructure/security/OtpTwoFactorService.js";
import { ActivityLoggerAdapter } from "../../infrastructure/audit/ActivityLoggerAdapter.js";
import { ConsoleMailer } from "../../infrastructure/mail/ConsoleMailer.js";
import { SmtpMailer } from "../../infrastructure/mail/SmtpMailer.js";
import { SafeMailer } from "../../infrastructure/mail/SafeMailer.js";
import { emailTemplates } from "../../infrastructure/mail/templates/index.js";
import { PrismaNotificationRepository } from "../../infrastructure/database/repositories/PrismaNotificationRepository.js";
import { DailyScheduler } from "../../infrastructure/scheduler/DailyScheduler.js";
import { logger } from "../logger.js";
import type { IMailer } from "../../domain/services/IMailer.js";
import { NotifyUsersUseCase } from "../../application/use-cases/notifications/NotifyUsersUseCase.js";
import { ListNotificationsUseCase } from "../../application/use-cases/notifications/ListNotificationsUseCase.js";
import { MarkNotificationReadUseCase } from "../../application/use-cases/notifications/MarkNotificationReadUseCase.js";
import { MarkAllNotificationsReadUseCase } from "../../application/use-cases/notifications/MarkAllNotificationsReadUseCase.js";
import { GetNotificationPreferencesUseCase } from "../../application/use-cases/notifications/GetNotificationPreferencesUseCase.js";
import { UpdateNotificationPreferencesUseCase } from "../../application/use-cases/notifications/UpdateNotificationPreferencesUseCase.js";
import { env } from "../../config/env.js";

import { LoginUseCase } from "../../application/use-cases/auth/LoginUseCase.js";
import { RefreshTokenUseCase } from "../../application/use-cases/auth/RefreshTokenUseCase.js";
import { Verify2FAUseCase } from "../../application/use-cases/auth/Verify2FAUseCase.js";
import { Enable2FAUseCase } from "../../application/use-cases/auth/Enable2FAUseCase.js";
import { RequestPasswordResetUseCase } from "../../application/use-cases/auth/RequestPasswordResetUseCase.js";
import { ConfirmPasswordResetUseCase } from "../../application/use-cases/auth/ConfirmPasswordResetUseCase.js";
import { UpdateProfileUseCase } from "../../application/use-cases/auth/UpdateProfileUseCase.js";
import { ChangePasswordUseCase } from "../../application/use-cases/auth/ChangePasswordUseCase.js";
import { ListProductsUseCase } from "../../application/use-cases/products/ListProductsUseCase.js";
import { GetProductUseCase } from "../../application/use-cases/products/GetProductUseCase.js";
import { CreateProductUseCase } from "../../application/use-cases/products/CreateProductUseCase.js";
import { UpdateProductUseCase } from "../../application/use-cases/products/UpdateProductUseCase.js";
import { DeleteProductUseCase } from "../../application/use-cases/products/DeleteProductUseCase.js";
import { GetDashboardMetricsUseCase } from "../../application/use-cases/dashboard/GetDashboardMetricsUseCase.js";
import {
  CancelDispensationUseCase,
  CreateDispensationUseCase,
  GetDispensationUseCase,
  ListDispensationsUseCase,
} from "../../application/use-cases/dispensations/DispensationUseCases.js";
import {
  CreatePatientUseCase,
  DeletePatientUseCase,
  GetPatientUseCase,
  ListPatientsUseCase,
  UpdatePatientUseCase,
} from "../../application/use-cases/patients/PatientUseCases.js";
import {
  CreatePrescriptionUseCase,
  GetPrescriptionUseCase,
  ListPrescriptionsUseCase,
} from "../../application/use-cases/prescriptions/PrescriptionUseCases.js";
import {
  CreateUnitUseCase,
  GetUnitUseCase,
  ListUnitsUseCase,
  UpdateUnitUseCase,
} from "../../application/use-cases/units/UnitUseCases.js";
import {
  CreateSupplierUseCase,
  ListSuppliersUseCase,
  UpdateSupplierUseCase,
} from "../../application/use-cases/suppliers/SupplierUseCases.js";
import {
  ListStockMovementsUseCase,
  RegisterAdjustmentUseCase,
  RegisterLossUseCase,
} from "../../application/use-cases/stock/StockUseCases.js";
import { ListUsersUseCase } from "../../application/use-cases/users/ListUsersUseCase.js";
import { CreateUserUseCase } from "../../application/use-cases/users/CreateUserUseCase.js";
import { UpdateUserUseCase } from "../../application/use-cases/users/UpdateUserUseCase.js";
import { ResetPasswordUseCase } from "../../application/use-cases/users/ResetPasswordUseCase.js";
import { DeleteUserUseCase } from "../../application/use-cases/users/DeleteUserUseCase.js";
import { ListActivityLogsUseCase } from "../../application/use-cases/audit/ListActivityLogsUseCase.js";
import { GetConsumptionReportUseCase } from "../../application/use-cases/reports/GetConsumptionReportUseCase.js";
import {
  GetControlledBalanceUseCase,
  GetControlledLedgerUseCase,
  GetDispensationSummaryReportUseCase,
  GetLossesReportUseCase,
  GetStockCoverageReportUseCase,
} from "../../application/use-cases/reports/ReportUseCases.js";
import {
  GetTransferUseCase,
  ListTransfersUseCase,
  RequestTransferUseCase,
  TransitionTransferUseCase,
} from "../../application/use-cases/transfers/TransferUseCases.js";
import { CreateBatchUseCase } from "../../application/use-cases/batches/CreateBatchUseCase.js";
import { ListBatchesUseCase } from "../../application/use-cases/batches/ListBatchesUseCase.js";
import { DeleteBatchUseCase } from "../../application/use-cases/batches/DeleteBatchUseCase.js";
import { CheckExpirationAlertsUseCase } from "../../application/use-cases/alerts/CheckExpirationAlertsUseCase.js";

export function buildContainer() {
  const sessionValidator = new CachedSessionValidator(30_000);
  const userRepo = new PrismaUserRepository(prisma, (id) => sessionValidator.invalidate(id));
  sessionValidator.bind(userRepo);
  const productRepo = new PrismaProductRepository(prisma);
  const dispensationRepo = new PrismaDispensationRepository(prisma);
  const patientRepo = new PrismaPatientRepository(prisma);
  const prescriptionRepo = new PrismaPrescriptionRepository(prisma);
  const unitRepo = new PrismaUnitRepository(prisma);
  const supplierRepo = new PrismaSupplierRepository(prisma);
  const stockMovementRepo = new PrismaStockMovementRepository(prisma);
  const transferRepo = new PrismaTransferRepository(prisma);
  const reportRepo = new PrismaReportRepository(prisma);
  const activityLogRepo = new PrismaActivityLogRepository(prisma);
  const batchRepo = new PrismaBatchRepository(prisma);
  const notificationRepo = new PrismaNotificationRepository(prisma);

  const hasher = new BcryptHasher();
  const tokenService = new JwtTokenService(env.JWT_SECRET, env.JWT_ACCESS_TTL, env.JWT_REFRESH_TTL);
  const twofa = new OtpTwoFactorService(env.TWOFA_ISSUER);
  const activityLogger = new ActivityLoggerAdapter(activityLogRepo);
  const rawMailer: IMailer =
    env.MAIL_DRIVER === "smtp"
      ? new SmtpMailer({
          host: env.SMTP_HOST!,
          port: env.SMTP_PORT!,
          secure: env.SMTP_SECURE,
          user: env.SMTP_USER!,
          pass: env.SMTP_PASS!,
          from: env.MAIL_FROM!,
        })
      : new ConsoleMailer();
  const mailer = new SafeMailer(rawMailer, logger);
  const notifyUsers = new NotifyUsersUseCase(notificationRepo, mailer, logger);
  const webBaseUrl = env.CORS_ORIGIN.split(",")[0];

  const checkExpirationAlerts = new CheckExpirationAlertsUseCase(
    batchRepo,
    productRepo,
    userRepo,
    unitRepo,
    reportRepo,
    notifyUsers,
    mailer,
    emailTemplates,
    logger,
    webBaseUrl,
    30,
  );

  const alertsScheduler = new DailyScheduler(
    async () => {
      const summary = await checkExpirationAlerts.execute();
      await activityLogger.log(
        { userId: null },
        { action: "ALERTS_TRIGGERED", entity: "Alerts", metadata: { ...summary, source: "scheduler" } },
      );
    },
    env.ALERTS_RUN_HOUR,
    logger,
  );

  return {
    repos: {
      userRepo,
      productRepo,
      dispensationRepo,
      patientRepo,
      prescriptionRepo,
      unitRepo,
      supplierRepo,
      stockMovementRepo,
      transferRepo,
      reportRepo,
      activityLogRepo,
      batchRepo,
      notificationRepo,
    },
    services: { hasher, tokenService, sessionValidator, twofa, activityLogger, mailer, alertsScheduler },
    useCases: {
      login: new LoginUseCase(userRepo, hasher, tokenService),
      refresh: new RefreshTokenUseCase(userRepo, tokenService),
      verify2fa: new Verify2FAUseCase(userRepo, tokenService, twofa),
      enable2fa: new Enable2FAUseCase(userRepo, twofa, mailer, emailTemplates, notifyUsers, hasher),
      requestPasswordReset: new RequestPasswordResetUseCase(
        userRepo,
        tokenService,
        mailer,
        emailTemplates,
        webBaseUrl,
        env.NODE_ENV === "development" && env.EXPOSE_DEV_RESET_TOKEN,
        logger,
      ),
      confirmPasswordReset: new ConfirmPasswordResetUseCase(userRepo, tokenService, hasher),
      updateProfile: new UpdateProfileUseCase(userRepo),
      changePassword: new ChangePasswordUseCase(userRepo, hasher, mailer, emailTemplates, notifyUsers, webBaseUrl, tokenService),
      listProducts: new ListProductsUseCase(productRepo),
      getProduct: new GetProductUseCase(productRepo),
      createProduct: new CreateProductUseCase(productRepo),
      updateProduct: new UpdateProductUseCase(productRepo),
      deleteProduct: new DeleteProductUseCase(productRepo),
      dashboardMetrics: new GetDashboardMetricsUseCase(dispensationRepo, productRepo, batchRepo, transferRepo, reportRepo),
      createDispensation: new CreateDispensationUseCase(dispensationRepo, productRepo, prescriptionRepo, patientRepo, unitRepo),
      cancelDispensation: new CancelDispensationUseCase(dispensationRepo, userRepo, notifyUsers, emailTemplates, webBaseUrl),
      listDispensations: new ListDispensationsUseCase(dispensationRepo),
      getDispensation: new GetDispensationUseCase(dispensationRepo),
      listPatients: new ListPatientsUseCase(patientRepo),
      getPatient: new GetPatientUseCase(patientRepo),
      createPatient: new CreatePatientUseCase(patientRepo),
      updatePatient: new UpdatePatientUseCase(patientRepo),
      deletePatient: new DeletePatientUseCase(patientRepo, dispensationRepo, prescriptionRepo),
      createPrescription: new CreatePrescriptionUseCase(prescriptionRepo, patientRepo, unitRepo),
      listPrescriptions: new ListPrescriptionsUseCase(prescriptionRepo),
      getPrescription: new GetPrescriptionUseCase(prescriptionRepo),
      listUnits: new ListUnitsUseCase(unitRepo),
      getUnit: new GetUnitUseCase(unitRepo),
      createUnit: new CreateUnitUseCase(unitRepo),
      updateUnit: new UpdateUnitUseCase(unitRepo),
      listSuppliers: new ListSuppliersUseCase(supplierRepo),
      createSupplier: new CreateSupplierUseCase(supplierRepo),
      updateSupplier: new UpdateSupplierUseCase(supplierRepo),
      listStockMovements: new ListStockMovementsUseCase(stockMovementRepo),
      registerLoss: new RegisterLossUseCase(stockMovementRepo, batchRepo),
      registerAdjustment: new RegisterAdjustmentUseCase(stockMovementRepo, batchRepo),
      listUsers: new ListUsersUseCase(userRepo),
      createUser: new CreateUserUseCase(userRepo, hasher, tokenService, mailer, emailTemplates, webBaseUrl, unitRepo),
      updateUser: new UpdateUserUseCase(userRepo, unitRepo),
      resetPassword: new ResetPasswordUseCase(userRepo, hasher, mailer, emailTemplates, notifyUsers, webBaseUrl),
      deleteUser: new DeleteUserUseCase(userRepo),
      listActivityLogs: new ListActivityLogsUseCase(activityLogRepo),
      consumptionReport: new GetConsumptionReportUseCase(reportRepo),
      stockCoverageReport: new GetStockCoverageReportUseCase(reportRepo),
      lossesReport: new GetLossesReportUseCase(reportRepo),
      dispensationsReport: new GetDispensationSummaryReportUseCase(reportRepo),
      controlledLedger: new GetControlledLedgerUseCase(reportRepo),
      controlledBalance: new GetControlledBalanceUseCase(reportRepo),
      listTransfers: new ListTransfersUseCase(transferRepo),
      getTransfer: new GetTransferUseCase(transferRepo),
      requestTransfer: new RequestTransferUseCase(transferRepo, unitRepo, productRepo, userRepo, notifyUsers, emailTemplates, webBaseUrl),
      transitionTransfer: new TransitionTransferUseCase(transferRepo, userRepo, notifyUsers, emailTemplates, webBaseUrl),
      createBatch: new CreateBatchUseCase(batchRepo, productRepo, supplierRepo, unitRepo),
      listBatches: new ListBatchesUseCase(batchRepo),
      deleteBatch: new DeleteBatchUseCase(batchRepo),
      checkExpirationAlerts,
      notifyUsers,
      listNotifications: new ListNotificationsUseCase(notificationRepo),
      markNotificationRead: new MarkNotificationReadUseCase(notificationRepo),
      markAllNotificationsRead: new MarkAllNotificationsReadUseCase(notificationRepo),
      getNotificationPreferences: new GetNotificationPreferencesUseCase(notificationRepo),
      updateNotificationPreferences: new UpdateNotificationPreferencesUseCase(notificationRepo),
    },
  };
}

export type Container = ReturnType<typeof buildContainer>;
