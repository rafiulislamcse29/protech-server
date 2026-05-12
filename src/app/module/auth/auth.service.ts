import AppError from "../../errorHelpers/AppError.js";
import { prisma } from "../../lib/index.js";
import {
  hashPassword,
  comparePassword,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  addDays,
} from "../../utils/index.js";
import {
  RegisterInput,
  LoginInput,
  ChangePasswordInput,
  SeedAdminInput,
} from "./auth.validation.js";

export const seedSuperAdmin = async (data: SeedAdminInput) => {
  if (data.seedSecret !== process.env["ADMIN_SEED_SECRET"]) {
    throw new AppError("Invalid seed secret", 403);
  }

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new AppError("User already exists", 409);

  const hashed = await hashPassword(data.password);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashed,
        role: "SUPER_ADMIN",
      },
    });

    const admin = await tx.admin.create({
      data: {
        userId: user.id,
        name: data.name,
        email: data.email,
        department: data.department ?? "Management",
        accessLevel: 5,
        permissions: ["ALL"],
      },
    });

    return { user, admin };
  });

  return result;
};

export const registerUser = async (data: RegisterInput) => {
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existing) throw new AppError("Email already in use", 409);

  const hashed = await hashPassword(data.password);

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashed,
        role: data.role,
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    
    if (data.role === "AGENT") {
      await tx.agent.create({
        data: {
          userId: created.id,
          name: data.name,
          email: data.email,
          licenseNumber: `PENDING-${created.id.slice(0, 8).toUpperCase()}`,
          specialties: [],
        },
      });
    }

    return created;
  });

  return user;
};

export const loginUser = async (
  data: LoginInput,
  ipAddress?: string,
  userAgent?: string,
) => {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) throw new AppError("Invalid email or password", 401);
  if (!user.isActive) throw new AppError("Account is deactivated", 403);

  const valid = await comparePassword(data.password, user.password);
  if (!valid) throw new AppError("Invalid email or password", 401);

  const payload = { userId: user.id, email: user.email, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await prisma.session.create({
    data: {
      userId: user.id,
      token: refreshToken,
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
      expiresAt: addDays(7),
    },
  });

  const { password: _pw, ...safeUser } = user;
  return { accessToken, refreshToken, user: safeUser };
};

export const refreshAccessToken = async (refreshToken: string) => {
  const session = await prisma.session.findUnique({
    where: { token: refreshToken },
  });
  if (!session || session.expiresAt < new Date()) {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  const payload = verifyRefreshToken(refreshToken);

  await prisma.session.delete({
    where: { token: refreshToken },
  });

  const cleanPayload = {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  };

  const accessToken = signAccessToken(cleanPayload);
  const generateRefreshToken = signRefreshToken(cleanPayload);

  await prisma.session.create({
    data: {
      userId: cleanPayload.userId,
      token: generateRefreshToken,
      ipAddress: null,
      userAgent: null,
      expiresAt: addDays(7),
    },
  });

  return { accessToken, refreshToken: generateRefreshToken };
};

export const logoutUser = async (refreshToken: string) => {
  await prisma.session.deleteMany({ where: { token: refreshToken } });
};

export const logoutAllSessions = async (userId: string) => {
  await prisma.session.deleteMany({ where: { userId } });
};

export const changePassword = async (
  userId: string,
  data: ChangePasswordInput,
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError("User not found", 404);

  const valid = await comparePassword(data.currentPassword, user.password);
  if (!valid) throw new AppError("Current password is incorrect", 400);

  const hashed = await hashPassword(data.newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed },
  });
  await prisma.session.deleteMany({ where: { userId } });
};

export const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      agent: {
        select: {
          id: true,
          licenseNumber: true,
          specialties: true,
          bio: true,
          phone: true,
          rating: true,
          experienceYears: true,
        },
      },
    },
  });
  if (!user) throw new AppError("User not found", 404);
  return user;
};
