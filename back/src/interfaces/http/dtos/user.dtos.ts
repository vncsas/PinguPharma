import { z } from "zod";

const roleEnum = z.enum(["ADMIN", "MANAGER", "SELLER"]);
const statusEnum = z.enum(["ACTIVE", "INACTIVE", "BLOCKED"]);

export const listUsersQuerySchema = z.object({
  search: z.string().optional(),
  role: roleEnum.optional(),
  status: statusEnum.optional(),
});

export const createUserBodySchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8),
  role: roleEnum,
  status: statusEnum.optional(),
});

export const updateUserBodySchema = z.object({
  name: z.string().min(2).max(120).optional(),
  email: z.string().email().optional(),
  role: roleEnum.optional(),
  status: statusEnum.optional(),
});

export const resetPasswordBodySchema = z.object({
  password: z.string().min(8),
});

export const userIdParamSchema = z.object({ id: z.string().min(5) });
