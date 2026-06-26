import { z } from "zod";

export const LoginSchema = z.object({
  email: z.email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(1, {
    message: "Password is required.",
  }),
});

export const SignupSchema = z.object({
  email: z.email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters long.",
  }),
});

export const VerifyEmailSchema = z.object({
  token: z.string().min(1, {
    message: "Verification token is required.",
  }),
  email: z.email({
    message: "Please enter a valid email address.",
  }),
});

export const ResendVerificationSchema = z.object({
  email: z.email({
    message: "Please enter a valid email address.",
  }),
});

export const ForgotPasswordSchema = z.object({
  email: z.email({
    message: "Please enter a valid email address.",
  }),
});

export const ResetPasswordSchema = z.object({
  email: z.email({
    message: "Please enter a valid email address.",
  }),
  token: z.string().min(1, {
    message: "Reset token is required.",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters long.",
  }),
});

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, {
      message: "Current password is required.",
    }),
    newPassword: z.string().min(8, {
      message: "New password must be at least 8 characters long.",
    }),
    confirmPassword: z.string().min(8, {
      message: "Please confirm your new password.",
    }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof LoginSchema>;
export type SignupInput = z.infer<typeof SignupSchema>;