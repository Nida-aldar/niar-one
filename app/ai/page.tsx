import type { Metadata } from "next";
import { AIWorkspace } from "@/components/AIWorkspace";

export const metadata: Metadata = { title: "NIAR AI | NIAR One" };
export default function AIPage() { return <AIWorkspace />; }
