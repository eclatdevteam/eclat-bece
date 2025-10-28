import { GraduationCap, Users, School } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";

interface RoleSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RoleSelectionDialog = ({ open, onOpenChange }: RoleSelectionDialogProps) => {
  const navigate = useNavigate();

  const roles = [
    {
      icon: GraduationCap,
      title: "Student",
      description: "Practice BECE & Common Entrance, compete on leaderboards, and win prizes",
      color: "text-primary",
      bgColor: "bg-primary-light",
      path: "/dashboard/student",
    },
    {
      icon: Users,
      title: "Parent",
      description: "Monitor your child's progress and support their learning journey",
      color: "text-accent",
      bgColor: "bg-accent-light",
      path: "/dashboard/parent",
    },
    {
      icon: School,
      title: "School",
      description: "Manage classrooms, assign work, and track student performance",
      color: "text-primary-glow",
      bgColor: "bg-primary-light",
      path: "/dashboard/school",
    },
  ];

  const handleRoleSelect = (role: string) => {
    const roleParam = role.toLowerCase().replace("/dashboard/", "");
    navigate(`/auth?role=${roleParam}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">Who are you?</DialogTitle>
          <DialogDescription className="text-center text-base">
            Select your role to get started with Éclat
          </DialogDescription>
        </DialogHeader>
        <div className="grid md:grid-cols-3 gap-4 pt-4">
          {roles.map((role, index) => {
            const Icon = role.icon;
            return (
              <Card
                key={index}
                className="cursor-pointer border-2 hover:border-primary hover:shadow-hover transition-all duration-300 group"
                onClick={() => handleRoleSelect(role.title)}
              >
                <CardContent className="p-6 text-center space-y-4">
                  <div className={`w-16 h-16 ${role.bgColor} rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform`}>
                    <Icon className={`${role.color}`} size={32} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">{role.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {role.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};
