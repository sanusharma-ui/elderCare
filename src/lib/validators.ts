import {
  AppointmentStatus,
  FoodRelation,
  MedicineForm,
  MedicineStatus,
  Role,
} from "@prisma/client";
import { z } from "zod";

/**
 * Normalizes phone numbers to standard international format (default +91 for Indian numbers).
 */
export function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");
  if (cleaned.startsWith("+")) {
    return cleaned;
  }
  if (cleaned.startsWith("0")) {
    return "+91" + cleaned.slice(1);
  }
  if (/^\d{10}$/.test(cleaned)) {
    return "+91" + cleaned;
  }
  return cleaned;
}

/**
 * Generates an internal auth email for phone-only users (not shown to clients).
 */
export function generateInternalAuthEmail(normalizedPhone: string): string {
  const digits = normalizedPhone.replace(/\D/g, "");
  return `p${digits}@users.smriti.app`;
}

// -----------------------------------------------------------------------------
// Common / Primitive Schemas
// -----------------------------------------------------------------------------

export const RoleEnum = z.nativeEnum(Role);
export const MedicineFormEnum = z.nativeEnum(MedicineForm);
export const MedicineStatusEnum = z.nativeEnum(MedicineStatus);
export const FoodRelationEnum = z.nativeEnum(FoodRelation);
export const AppointmentStatusEnum = z.nativeEnum(AppointmentStatus);

export const PhoneSchema = z
  .string()
  .min(7, "Phone number is too short")
  .max(20, "Phone number is too long")
  .transform((val) => normalizePhone(val))
  .refine(
    (val) => /^\+[1-9]\d{6,14}$/.test(val),
    "Invalid phone number format. Must include valid country code or 10-digit number."
  );

export const EmailSchema = z
  .string()
  .email("Invalid email address")
  .transform((val) => val.trim().toLowerCase());

export const SupportedLanguageSchema = z.enum(["en", "hi", "mr"]).default("en");

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
});

// -----------------------------------------------------------------------------
// Auth Schemas
// -----------------------------------------------------------------------------

export const RegisterSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    email: EmailSchema.optional(),
    phone: PhoneSchema.optional(),
    password: z.string().min(8, "Password must be at least 8 characters").max(128, "Password cannot exceed 128 characters"),
    role: RoleEnum,
    language: SupportedLanguageSchema,

    // Doctor profile fields
    specialization: z.string().min(2).optional(),
    registrationNumber: z.string().min(2).optional(),
    clinicName: z.string().min(2).optional(),

    // Elder profile fields
    dateOfBirth: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
    gender: z.string().optional(),
    bloodGroup: z.string().optional(),
    medicalConditions: z.string().optional(),
    allergies: z.string().optional(),
    emergencyContactName: z.string().optional(),
    emergencyContactPhone: PhoneSchema.optional(),
    timezone: z.string().default("Asia/Kolkata"),
    largeTextMode: z.boolean().default(true),
    voiceReminders: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    if (!data.email && !data.phone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one of email or phone number is required",
        path: ["email"],
      });
    }

    if (data.role === Role.DOCTOR) {
      if (!data.specialization) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "specialization is required for Doctor registration",
          path: ["specialization"],
        });
      }
      if (!data.registrationNumber) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "registrationNumber is required for Doctor registration",
          path: ["registrationNumber"],
        });
      }
      if (!data.clinicName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "clinicName is required for Doctor registration",
          path: ["clinicName"],
        });
      }
    }
  });

export const LoginSchema = z.object({
  identifier: z.string().min(1, "Email or phone is required").max(255, "Identifier is too long"),
  password: z.string().min(1, "Password is required").max(128, "Password is too long"),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required").max(128),
  newPassword: z.string().min(8, "New password must be at least 8 characters").max(128),
});

export const UpdateMeSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: PhoneSchema.optional(),
  language: SupportedLanguageSchema.optional(),

  // Doctor profile fields
  specialization: z.string().min(2).optional(),
  registrationNumber: z.string().min(2).optional(),
  clinicName: z.string().min(2).optional(),

  // Elder profile fields
  dateOfBirth: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  gender: z.string().optional(),
  bloodGroup: z.string().optional(),
  medicalConditions: z.string().optional(),
  allergies: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: PhoneSchema.optional(),
  timezone: z.string().optional(),
  largeTextMode: z.boolean().optional(),
  voiceReminders: z.boolean().optional(),
});

// -----------------------------------------------------------------------------
// Doctor Creating Elder
// -----------------------------------------------------------------------------

export const DoctorCreateElderSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    email: EmailSchema.optional(),
    phone: PhoneSchema.optional(),
    language: SupportedLanguageSchema,
    dateOfBirth: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
    gender: z.string().optional(),
    bloodGroup: z.string().optional(),
    medicalConditions: z.string().optional(),
    allergies: z.string().optional(),
    emergencyContactName: z.string().optional(),
    emergencyContactPhone: PhoneSchema.optional(),
    timezone: z.string().default("Asia/Kolkata"),
    largeTextMode: z.boolean().default(true),
    voiceReminders: z.boolean().default(false),
  })
  .refine((data) => data.email || data.phone, {
    message: "At least one of email or phone is required",
    path: ["email"],
  });

// -----------------------------------------------------------------------------
// Elder Profile Updates
// -----------------------------------------------------------------------------

export const UpdateElderSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: PhoneSchema.optional(),
  language: SupportedLanguageSchema.optional(),
  dateOfBirth: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  gender: z.string().optional(),
  bloodGroup: z.string().optional(),
  medicalConditions: z.string().optional(),
  allergies: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: PhoneSchema.optional(),
  timezone: z.string().optional(),
  largeTextMode: z.boolean().optional(),
  voiceReminders: z.boolean().optional(),
});

// -----------------------------------------------------------------------------
// Invites
// -----------------------------------------------------------------------------

export const CreateInviteSchema = z.object({
  intendedRole: z.enum([Role.DOCTOR, Role.CARETAKER, Role.FAMILY]),
});

export const RedeemInviteSchema = z.object({
  code: z.string().min(4, "Invalid invite code format").max(30),
});

// -----------------------------------------------------------------------------
// Medicines & Schedules
// -----------------------------------------------------------------------------

export const ScheduleItemSchema = z.object({
  timeOfDay: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be in HH:mm 24-hour format"),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).default([0, 1, 2, 3, 4, 5, 6]),
  doseQuantity: z.string().min(1).default("1 tablet"),
  graceMinutes: z.number().int().min(0).max(1440).default(30),
  isActive: z.boolean().default(true),
});

export const CreateMedicineSchema = z.object({
  name: z.string().min(1, "Medicine name is required"),
  nameLocal: z.string().optional(),
  genericName: z.string().optional(),
  dosage: z.string().min(1, "Dosage is required (e.g. '500 mg')"),
  form: MedicineFormEnum,
  foodRelation: FoodRelationEnum.default(FoodRelation.ANYTIME),
  instructions: z.string().optional(),
  warnings: z.string().optional(),
  startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  endDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().nullable(),
  stockCount: z.number().int().min(0).optional().nullable(),
  refillThreshold: z.number().int().min(0).optional().nullable(),
  schedules: z.array(ScheduleItemSchema).min(1, "At least one schedule is required"),
});

export const UpdateMedicineSchema = z.object({
  name: z.string().min(1).optional(),
  nameLocal: z.string().optional().nullable(),
  genericName: z.string().optional().nullable(),
  dosage: z.string().min(1).optional(),
  form: MedicineFormEnum.optional(),
  foodRelation: FoodRelationEnum.optional(),
  instructions: z.string().optional().nullable(),
  warnings: z.string().optional().nullable(),
  status: MedicineStatusEnum.optional(),
  startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  endDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().nullable(),
  stockCount: z.number().int().min(0).optional().nullable(),
  refillThreshold: z.number().int().min(0).optional().nullable(),
});

export const ReplaceSchedulesSchema = z.object({
  schedules: z.array(ScheduleItemSchema).min(1, "At least one schedule item is required"),
});

// -----------------------------------------------------------------------------
// Appointments
// -----------------------------------------------------------------------------

export const CreateAppointmentSchema = z.object({
  title: z.string().min(1, "Appointment title is required"),
  scheduledAt: z.string().datetime(),
  location: z.string().optional(),
  notes: z.string().optional(),
  doctorId: z.string().uuid().optional(),
});

export const UpdateAppointmentSchema = z.object({
  title: z.string().min(1).optional(),
  scheduledAt: z.string().datetime().optional(),
  location: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: AppointmentStatusEnum.optional(),
  doctorId: z.string().uuid().optional().nullable(),
});
