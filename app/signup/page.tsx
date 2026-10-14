import type { Metadata } from "next";
import { SignupForm } from "@/components/AuthForms";

export const metadata: Metadata = { title: "Create an account | NIAR One" };
export default function SignupPage() { return <SignupForm />; }
