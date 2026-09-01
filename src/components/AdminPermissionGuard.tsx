import React from "react";
import { useNavigate } from "react-router-dom";
import { useAdminPermissions, AdminPermissions } from "@/hooks/useAdminPermissions";
import { ShieldAlert, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AdminPermissionGuardProps {
  children: React.ReactNode;
  requiredPermission?: keyof AdminPermissions;
  requiresSuperAdmin?: boolean;
  resourceName?: string;
}

export const AdminPermissionGuard: React.FC<AdminPermissionGuardProps> = ({
  children,
  requiredPermission,
  requiresSuperAdmin = false,
  resourceName = "this module",
}) => {
  const { loading, isSuperAdmin, hasPermission } = useAdminPermissions();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span>Verifying access permissions...</span>
        </div>
      </div>
    );
  }

  // Check authorization
  let isAuthorized = false;

  if (isSuperAdmin) {
    isAuthorized = true;
  } else if (requiresSuperAdmin) {
    isAuthorized = false;
  } else if (requiredPermission) {
    isAuthorized = hasPermission(requiredPermission);
  } else {
    isAuthorized = true;
  }

  if (!isAuthorized) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 animate-fade-in">
        <Card className="rounded-3xl border-2 border-border shadow-lg p-6 text-center">
          <CardHeader className="space-y-3 pb-4">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-center">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl font-black text-foreground">
              Access Restricted
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground leading-relaxed">
              Your staff account does not have permission to access {resourceName}.
              {requiresSuperAdmin
                ? " This area is restricted exclusively to Super Administrators."
                : " Please contact a Super Administrator if you require elevated privileges."}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <Button
              variant="hero"
              onClick={() => navigate("/admin")}
              className="font-bold text-xs rounded-xl h-10 px-5 gap-2"
            >
              <ArrowLeft size={14} /> Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
