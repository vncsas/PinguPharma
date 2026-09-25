import { prisma } from "../../infrastructure/database/prisma-client.js";
import { PrismaUserRepository } from "../../infrastructure/database/repositories/PrismaUserRepository.js";
import { PrismaProductRepository } from "../../infrastructure/database/repositories/PrismaProductRepository.js";
import { PrismaSaleRepository } from "../../infrastructure/database/repositories/PrismaSaleRepository.js";
import { PrismaCustomerRepository } from "../../infrastructure/database/repositories/PrismaCustomerRepository.js";
import { PrismaActivityLogRepository } from "../../infrastructure/database/repositories/PrismaActivityLogRepository.js";
import { PrismaBatchRepository } from "../../infrastructure/database/repositories/PrismaBatchRepository.js";
import { BcryptHasher } from "../../infrastructure/security/BcryptHasher.js";
import { JwtTokenService } from "../../infrastructure/security/JwtTokenService.js";
import { OtpTwoFactorService } from "../../infrastructure/security/OtpTwoFactorService.js";
import { ActivityLoggerAdapter } from "../../infrastructure/audit/ActivityLoggerAdapter.js";
import { ConsoleMailer } from "../../infrastructure/mail/ConsoleMailer.js";
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
import { CreateSaleUseCase } from "../../application/use-cases/sales/CreateSaleUseCase.js";
import { CancelSaleUseCase } from "../../application/use-cases/sales/CancelSaleUseCase.js";
import { ListSalesUseCase } from "../../application/use-cases/sales/ListSalesUseCase.js";
import { GetSaleUseCase } from "../../application/use-cases/sales/GetSaleUseCase.js";
import { ListCustomersUseCase } from "../../application/use-cases/customers/ListCustomersUseCase.js";
import { CreateCustomerUseCase } from "../../application/use-cases/customers/CreateCustomerUseCase.js";
import { UpdateCustomerUseCase } from "../../application/use-cases/customers/UpdateCustomerUseCase.js";
import { DeleteCustomerUseCase } from "../../application/use-cases/customers/DeleteCustomerUseCase.js";
import { ListUsersUseCase } from "../../application/use-cases/users/ListUsersUseCase.js";
import { CreateUserUseCase } from "../../application/use-cases/users/CreateUserUseCase.js";
import { UpdateUserUseCase } from "../../application/use-cases/users/UpdateUserUseCase.js";
import { ResetPasswordUseCase } from "../../application/use-cases/users/ResetPasswordUseCase.js";
import { DeleteUserUseCase } from "../../application/use-cases/users/DeleteUserUseCase.js";
import { ListActivityLogsUseCase } from "../../application/use-cases/audit/ListActivityLogsUseCase.js";
import { GetFinancialReportUseCase } from "../../application/use-cases/reports/GetFinancialReportUseCase.js";
import { CreateBatchUseCase } from "../../application/use-cases/batches/CreateBatchUseCase.js";
import { ListBatchesUseCase } from "../../application/use-cases/batches/ListBatchesUseCase.js";
import { DeleteBatchUseCase } from "../../application/use-cases/batches/DeleteBatchUseCase.js";
import { CheckExpirationAlertsUseCase } from "../../application/use-cases/alerts/CheckExpirationAlertsUseCase.js";

export function buildContainer() {
  const userRepo = new PrismaUserRepository(prisma);
  const productRepo = new PrismaProductRepository(prisma);
  const saleRepo = new PrismaSaleRepository(prisma);
  const customerRepo = new PrismaCustomerRepository(prisma);
  const activityLogRepo = new PrismaActivityLogRepository(prisma);
  const batchRepo = new PrismaBatchRepository(prisma);

  const hasher = new BcryptHasher();
  const tokenService = new JwtTokenService(env.JWT_SECRET, env.JWT_ACCESS_TTL, env.JWT_REFRESH_TTL);
  const twofa = new OtpTwoFactorService(env.TWOFA_ISSUER);
  const activityLogger = new ActivityLoggerAdapter(activityLogRepo);
  const mailer = new ConsoleMailer();
  const webBaseUrl = env.CORS_ORIGIN.split(",")[0];

  return {
    repos: { userRepo, productRepo, saleRepo, customerRepo, activityLogRepo, batchRepo },
    services: { hasher, tokenService, twofa, activityLogger, mailer },
    useCases: {
      login: new LoginUseCase(userRepo, hasher, tokenService),
      refresh: new RefreshTokenUseCase(userRepo, tokenService),
      verify2fa: new Verify2FAUseCase(userRepo, tokenService, twofa),
      enable2fa: new Enable2FAUseCase(userRepo, twofa),
      requestPasswordReset: new RequestPasswordResetUseCase(
        userRepo,
        tokenService,
        mailer,
        webBaseUrl,
        env.NODE_ENV !== "production",
      ),
      confirmPasswordReset: new ConfirmPasswordResetUseCase(userRepo, tokenService, hasher),
      updateProfile: new UpdateProfileUseCase(userRepo),
      changePassword: new ChangePasswordUseCase(userRepo, hasher),
      listProducts: new ListProductsUseCase(productRepo),
      getProduct: new GetProductUseCase(productRepo),
      createProduct: new CreateProductUseCase(productRepo),
      updateProduct: new UpdateProductUseCase(productRepo),
      deleteProduct: new DeleteProductUseCase(productRepo),
      dashboardMetrics: new GetDashboardMetricsUseCase(saleRepo, productRepo),
      createSale: new CreateSaleUseCase(saleRepo),
      cancelSale: new CancelSaleUseCase(saleRepo),
      listSales: new ListSalesUseCase(saleRepo),
      getSale: new GetSaleUseCase(saleRepo),
      listCustomers: new ListCustomersUseCase(customerRepo),
      createCustomer: new CreateCustomerUseCase(customerRepo),
      updateCustomer: new UpdateCustomerUseCase(customerRepo),
      deleteCustomer: new DeleteCustomerUseCase(customerRepo),
      listUsers: new ListUsersUseCase(userRepo),
      createUser: new CreateUserUseCase(userRepo, hasher),
      updateUser: new UpdateUserUseCase(userRepo),
      resetPassword: new ResetPasswordUseCase(userRepo, hasher),
      deleteUser: new DeleteUserUseCase(userRepo),
      listActivityLogs: new ListActivityLogsUseCase(activityLogRepo),
      financialReport: new GetFinancialReportUseCase(prisma),
      createBatch: new CreateBatchUseCase(batchRepo, productRepo),
      listBatches: new ListBatchesUseCase(batchRepo),
      deleteBatch: new DeleteBatchUseCase(batchRepo),
      checkExpirationAlerts: new CheckExpirationAlertsUseCase(batchRepo, productRepo, userRepo, mailer, 30),
    },
  };
}

export type Container = ReturnType<typeof buildContainer>;
