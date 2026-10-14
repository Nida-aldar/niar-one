import type { Metadata } from "next";
import { DataLab } from "@/components/DataLab";

export const metadata: Metadata = { title: "Data Lab | NIAR One" };
export default function DataLabPage() { return <DataLab />; }
