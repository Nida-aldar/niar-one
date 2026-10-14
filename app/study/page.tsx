import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { StudyWorkspace } from "@/components/StudyWorkspace";

export default async function StudyPage() {
  if (!(await getSessionUser())) redirect("/login?next=/study");
  return <StudyWorkspace />;
}
