import { z } from "zod";

export const newsletterSubscriptionSchema = z.object({
  email: z
    .string()
    .email("Please provide a valid email address")
    .min(5, "Email must be at least 5 characters long")
    .max(100, "Email must be less than 100 characters long")
});

export type NewsletterSubscription = z.infer<typeof newsletterSubscriptionSchema>;