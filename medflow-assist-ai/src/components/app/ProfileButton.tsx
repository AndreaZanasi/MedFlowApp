import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import { useAuth } from "@/hooks/useDjangoAuth";

const ProfileButton = () => {
  const { user } = useAuth();

  // Simple display - just show user indicator without profile functionality
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-3 pl-3 border-l border-border">
        <div className="hidden md:block text-right">
          <p className="text-sm font-medium text-foreground">
            {user?.username || "Doctor"}
          </p>
          <p className="text-xs text-muted-foreground">
            Medical Professional
          </p>
        </div>
        <Avatar>
          <AvatarFallback>
            <User className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
};

export default ProfileButton;
