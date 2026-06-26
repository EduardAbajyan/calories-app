"use server";
import { createUser } from "@/lib/auth";
import {
  ChangePasswordSchema,
  ForgotPasswordSchema,
  LoginSchema,
  ResetPasswordSchema,
  SignupSchema,
  VerifyEmailSchema,
  ResendVerificationSchema,
} from "@/schemas/auth";
import {
  generateVerificationToken,
  verifyToken,
} from "@/lib/verification-token";
import { sendPasswordResetEmail, sendVerificationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { auth, signIn } from "@/auth";
import { randomUUID } from "crypto";

const PASSWORD_RESET_TOKEN_EXPIRY = 30 * 60 * 1000;

function getResetIdentifier(email: string) {
  return `reset:${email.toLowerCase()}`;
}

// Consistent type for all action states
export type ActionState = {
  success: boolean;
  error?: string;
  message?: string;
  needsVerification?: boolean;
  email?: string;
};

async function login(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const validatedData = LoginSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    try {
      const result = await signIn("credentials", {
        email: validatedData.email,
        password: validatedData.password,
        redirect: false,
      });

      if (!result || result.error) {
        return { success: false, error: "Invalid credentials" };
      }

      return { success: true, message: "Login successful" };
    } catch (authError: any) {
      if (authError?.cause?.err?.message?.includes("EMAIL_NOT_VERIFIED")) {
        return {
          success: false,
          error:
            "Please verify your email before signing in. Check your inbox for a verification link.",
          needsVerification: true,
          email: validatedData.email,
        };
      }
      throw authError;
    }
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      error: "Invalid credentials format or login error",
    };
  }
}
async function signUp(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  console.log("Sign up with:", { email, password });
  try {
    const validatedData = SignupSchema.parse({ email, password });
    console.log("Validated signup data:", validatedData);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      if (existingUser.emailVerified) {
        if (existingUser.password) {
          return {
            success: false,
            error: "User with this email already exists",
          };
        } else {
          const salt = bcrypt.genSaltSync(10);
          const hash = await bcrypt.hash(password, salt);
          await prisma.user.update({
            where: { id: existingUser.id }, // 👈 which row
            data: { password: hash }, // 👈 what to change
          });
          return {
            success: true,
            message: "Password set successfully! You can now log in.",
          };
        }
      } else {
        // User exists but not verified - resend verification email
        const token = await generateVerificationToken(validatedData.email);
        await sendVerificationEmail({
          to: validatedData.email,
          token,
        });
        return {
          success: true,
          error: undefined,
          message: "Verification email sent. Please check your inbox.",
        };
      }
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = await bcrypt.hash(password, salt);

    try {
      const result = await createUser(validatedData.email, hash);
      console.log("User created in database:", result);

      // Generate verification token and send email
      const token = await generateVerificationToken(validatedData.email);
      await sendVerificationEmail({
        to: validatedData.email,
        token,
      });

      return {
        success: true,
        error: undefined,
        message:
          "Account created! Please check your email to verify your account.",
      };
    } catch (dbError: any) {
      console.error("Database error during signup:", dbError);
      if (dbError.message.includes("already exists")) {
        return { success: false, error: "User with this email already exists" };
      }
      return { success: false, error: "Failed to create user account" };
    }
  } catch (error) {
    console.error("Signup validation error:", error);
    return { success: false, error: "Invalid credentials format" };
  }
}
export async function AuthAction(
  mode: "login" | "signup",
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  console.log("Auth action called with mode:", mode);
  if (mode === "login") return await login(prevState, formData);
  else return await signUp(prevState, formData);
}

export async function verifyEmailAction(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const validatedData = VerifyEmailSchema.parse({
      token: formData.get("token"),
      email: formData.get("email"),
    });

    const isValid = await verifyToken(validatedData.token, validatedData.email);

    if (!isValid) {
      return {
        success: false,
        error:
          "Invalid or expired verification token. Please request a new verification email.",
      };
    }

    return {
      success: true,
      message: "Email verified successfully! You can now sign in.",
    };
  } catch (error) {
    console.error("Email verification error:", error);
    return {
      success: false,
      error: "Invalid verification data. Please try again.",
    };
  }
}

export async function resendVerificationAction(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const validatedData = ResendVerificationSchema.parse({
      email: formData.get("email"),
    });

    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (!user) {
      return {
        success: false,
        error: "No account found with this email address.",
      };
    }

    if (user.emailVerified) {
      return {
        success: false,
        error: "This email is already verified. You can sign in normally.",
      };
    }

    const token = await generateVerificationToken(validatedData.email);
    await sendVerificationEmail({
      to: validatedData.email,
      token,
    });

    return {
      success: true,
      message: "Verification email sent! Please check your inbox.",
    };
  } catch (error) {
    console.error("Resend verification error:", error);
    return {
      success: false,
      error: "Failed to send verification email. Please try again.",
    };
  }
}

export async function forgotPasswordAction(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const validatedData = ForgotPasswordSchema.parse({
      email: formData.get("email"),
    });

    const email = validatedData.email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });

    // Do not reveal whether account exists.
    if (user) {
      const token = randomUUID();
      const expires = new Date(Date.now() + PASSWORD_RESET_TOKEN_EXPIRY);

      await prisma.verificationToken.deleteMany({
        where: { identifier: getResetIdentifier(email) },
      });

      await prisma.verificationToken.create({
        data: {
          identifier: getResetIdentifier(email),
          token,
          expires,
        },
      });

      await sendPasswordResetEmail({ to: email, token });
    }

    return {
      success: true,
      message:
        "If an account exists for this email, a password reset link has been sent.",
    };
  } catch (error) {
    console.error("Forgot password error:", error);
    return {
      success: false,
      error: "Failed to process password reset request.",
    };
  }
}

export async function resetPasswordAction(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const validatedData = ResetPasswordSchema.parse({
      email: formData.get("email"),
      token: formData.get("token"),
      password: formData.get("password"),
    });

    const email = validatedData.email.toLowerCase();
    const tokenRecord = await prisma.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier: getResetIdentifier(email),
          token: validatedData.token,
        },
      },
    });

    if (!tokenRecord || tokenRecord.expires < new Date()) {
      if (tokenRecord) {
        await prisma.verificationToken.delete({
          where: {
            identifier_token: {
              identifier: getResetIdentifier(email),
              token: validatedData.token,
            },
          },
        });
      }

      return {
        success: false,
        error: "Invalid or expired reset link.",
      };
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return {
        success: false,
        error: "Invalid reset request.",
      };
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = await bcrypt.hash(validatedData.password, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hash },
    });

    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: getResetIdentifier(email),
          token: validatedData.token,
        },
      },
    });

    return {
      success: true,
      message: "Password updated successfully. You can now sign in.",
    };
  } catch (error) {
    console.error("Reset password error:", error);
    return {
      success: false,
      error: "Failed to reset password.",
    };
  }
}

export async function changePasswordAction(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be signed in.",
      };
    }

    const validatedData = ChangePasswordSchema.parse({
      currentPassword: formData.get("currentPassword"),
      newPassword: formData.get("newPassword"),
      confirmPassword: formData.get("confirmPassword"),
    });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, password: true },
    });

    if (!user?.password) {
      return {
        success: false,
        error:
          "Password change is unavailable for this account. Use your provider login.",
      };
    }

    const isValidCurrentPassword = await bcrypt.compare(
      validatedData.currentPassword,
      user.password,
    );

    if (!isValidCurrentPassword) {
      return {
        success: false,
        error: "Current password is incorrect.",
      };
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = await bcrypt.hash(validatedData.newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hash },
    });

    return {
      success: true,
      message: "Password changed successfully.",
    };
  } catch (error) {
    console.error("Change password error:", error);
    return {
      success: false,
      error: "Failed to change password.",
    };
  }
}
