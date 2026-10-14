import { z } from "zod";

export const emailSchema = z.email().max(254).transform((email) => email.trim().toLowerCase());
export const passwordSchema = z.string().min(12).max(128);

const studyItemBaseSchema = z.object({
  type: z.enum(["NOTE", "TASK", "FLASHCARD"]),
  title: z.string().trim().min(1).max(160),
  content: z.string().max(20000).default(""),
  dueAt: z.iso.datetime().nullable().optional(),
  completed: z.boolean().optional(),
});

export const studyItemSchema = studyItemBaseSchema.superRefine((item, context) => {
  if (item.type === "FLASHCARD" && item.content.trim().length === 0) {
    context.addIssue({ code: "custom", path: ["content"], message: "Flashcards require an answer." });
  }
});

export const studyItemPatchSchema = studyItemBaseSchema.partial().superRefine((item, context) => {
  if (item.type === "FLASHCARD" && item.content !== undefined && item.content.trim().length === 0) {
    context.addIssue({ code: "custom", path: ["content"], message: "Flashcards require an answer." });
  }
});

export const createAccountSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});
