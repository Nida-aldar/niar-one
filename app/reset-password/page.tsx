import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/AuthForms";

export const metadata: Metadata = { title: "Choose a new password | NIAR One" };
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return <ResetPasswordForm token={token || ""} />;
}
