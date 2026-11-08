import { Topbar } from "@/design-system/layout/Topbar";
import { useAuth } from "@/lib/auth-context";
import { IdentityCard } from "../components/IdentityCard";
import { UpdateProfileCard } from "../components/UpdateProfileCard";
import { ChangePasswordCard } from "../components/ChangePasswordCard";
import { TwoFactorCard } from "../components/TwoFactorCard";

export default function ProfilePage() {
  const { user, refreshMe } = useAuth();

  return (
    <div className="space-y-6">
      <Topbar title="Perfil e segurança" />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <IdentityCard user={user} />
        <UpdateProfileCard key={user?.id} user={user} refreshMe={refreshMe} />
        <ChangePasswordCard />
        <TwoFactorCard user={user} refreshMe={refreshMe} />
      </div>
    </div>
  );
}

