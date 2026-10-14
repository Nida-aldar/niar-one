import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/AuthForms";

export const metadata: Metadata = { title: "Reset your password | NIAR One" };
export default function ForgotPasswordPage() { return <ForgotPasswordForm />; }
