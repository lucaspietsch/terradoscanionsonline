"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  return (
    <Button variant="secondary" size="sm" onClick={async () => { await createClient().auth.signOut(); router.replace("/"); router.refresh(); }}>
      Sair
    </Button>
  );
}
