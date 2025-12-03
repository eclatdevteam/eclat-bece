import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function AdminLoginPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            // Attempt login
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) {
                setError(authError.message);
                setLoading(false);
                return;
            }

            if (!authData.user) {
                setError("Login failed. Please try again.");
                setLoading(false);
                return;
            }

            // Check if user has admin role
            const { data: roleData } = await supabase
                .from("user_roles")
                .select("role")
                .eq("user_id", authData.user.id)
                .eq("role", "admin" as any) // Cast to any until types are regenerated
                .maybeSingle();

            if (!roleData) {
                // User is not an admin - sign them out
                await supabase.auth.signOut();
                setError("Access denied. This login is for administrators only.");
                setLoading(false);
                return;
            }

            // Check if admin account is active
            const { data: adminData } = await supabase
                .from("admins" as any) // Cast to any until types are regenerated
                .select("is_active, full_name")
                .eq("user_id", authData.user.id)
                .maybeSingle() as any;

            if (!adminData || !adminData.is_active) {
                await supabase.auth.signOut();
                setError("Your admin account has been deactivated. Please contact a super administrator.");
                setLoading(false);
                return;
            }

            // Success - redirect to admin dashboard
            toast.success(`Welcome back, ${adminData.full_name}!`);
            navigate("/admin");
        } catch (error) {
            console.error("Login error:", error);
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = () => {
        navigate("/password-reset");
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/20 to-background flex items-center justify-center p-4">
            {/* Theme Toggle - Top Right */}
            <div className="fixed top-4 right-4 z-50">
                <ThemeToggle />
            </div>

            <Card className="w-full max-w-md shadow-2xl border-2">
                <CardHeader className="space-y-4 text-center pb-8">
                    {/* Admin Badge */}
                    <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary to-primary/70 rounded-2xl flex items-center justify-center shadow-lg">
                        <Shield className="w-10 h-10 text-primary-foreground" />
                    </div>

                    {/* Title */}
                    <div>
                        <CardTitle className="text-3xl font-bold">Admin Access</CardTitle>
                        <CardDescription className="text-base mt-2">
                            Éclat Platform Administration
                        </CardDescription>
                    </div>

                    {/* Security Notice */}
                    <div className="bg-muted/50 border border-border rounded-lg p-3 flex items-start gap-3 text-left">
                        <Lock className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-muted-foreground">
                            <p className="font-semibold mb-1">Secure Admin Portal</p>
                            <p className="text-xs">This area is restricted to authorized administrators only. All login attempts are logged.</p>
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-6">
                        {/* Error Alert */}
                        {error && (
                            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-destructive">{error}</p>
                            </div>
                        )}

                        {/* Email Field */}
                        <div className="space-y-2">
                            <Label htmlFor="email">Admin Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="admin@eclat.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loading}
                                className="h-11"
                                autoComplete="username"
                            />
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                                className="h-11"
                                autoComplete="current-password"
                            />
                        </div>

                        {/* Forgot Password Link */}
                        <div className="text-right">
                            <Button
                                type="button"
                                variant="link"
                                className="text-sm h-auto p-0"
                                onClick={handleForgotPassword}
                                disabled={loading}
                            >
                                Forgot password?
                            </Button>
                        </div>

                        {/* Login Button */}
                        <Button
                            type="submit"
                            className="w-full h-11"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                <>
                                    <Shield className="mr-2 h-4 w-4" />
                                    Sign In as Admin
                                </>
                            )}
                        </Button>
                    </form>

                    {/* Footer */}
                    <div className="mt-8 pt-6 border-t text-center">
                        <p className="text-xs text-muted-foreground">
                            Not an administrator?{" "}
                            <Button
                                variant="link"
                                className="text-xs h-auto p-0"
                                onClick={() => navigate("/auth")}
                            >
                                Go to regular login
                            </Button>
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Background Elements */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -left-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-accent/5 rounded-full blur-3xl"></div>
            </div>
        </div>
    );
}
