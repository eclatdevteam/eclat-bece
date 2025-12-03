import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const formSchema = z.object({
    email: z.string().email("Invalid email address"),
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    isSuperAdmin: z.boolean().default(false),
});

interface AddAdminDialogProps {
    onSuccess: () => void;
}

export function AddAdminDialog({ onSuccess }: AddAdminDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            fullName: "",
            isSuperAdmin: false,
        },
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        if (!user) return;
        setLoading(true);

        try {
            // 1. Find the user by email
            const { data: profiles, error: profileError } = await supabase
                .from("profiles")
                .select("id, email")
                .eq("email", values.email)
                .limit(1);

            if (profileError) throw profileError;

            if (!profiles || profiles.length === 0) {
                toast.error("User not found. They must register an account first.");
                setLoading(false);
                return;
            }

            const targetUserId = profiles[0].id;

            // 2. Add admin role
            const { error: roleError } = await supabase
                .from("user_roles")
                .insert({
                    user_id: targetUserId,
                    role: "admin" as any, // Cast for now
                });

            if (roleError) {
                if (roleError.code === "23505") { // Unique violation
                    // Role might already exist, which is fine, continue to admin record
                    console.log("User already has admin role");
                } else {
                    throw roleError;
                }
            }

            // 3. Create admin record
            const { data: newAdmin, error: adminError } = await supabase
                .from("admins" as any)
                .insert({
                    user_id: targetUserId,
                    full_name: values.fullName,
                    is_super_admin: values.isSuperAdmin,
                    created_by: (await supabase.rpc('get_admin_id', { _user_id: user.id })).data,
                    is_active: true,
                })
                .select('id')
                .single();

            if (adminError) throw adminError;

            // 4. Log action
            const adminRecord = newAdmin as unknown as { id: string } | null;
            if (adminRecord?.id) {
                await supabase.rpc('log_admin_action', {
                    _admin_id: (await supabase.rpc('get_admin_id', { _user_id: user.id })).data,
                    _action: 'create_admin',
                    _resource_type: 'admin',
                    _resource_id: adminRecord.id,
                    _details: {
                        target_user_email: values.email,
                        is_super_admin: values.isSuperAdmin
                    }
                });
            }

            toast.success("Admin added successfully");
            setOpen(false);
            form.reset();
            onSuccess();
        } catch (error: any) {
            console.error("Error adding admin:", error);
            toast.error(error.message || "Failed to add admin");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Admin
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Admin</DialogTitle>
                    <DialogDescription>
                        Grant admin privileges to an existing user. They must already have an account.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>User Email</FormLabel>
                                    <FormControl>
                                        <Input placeholder="user@example.com" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        The email address of the registered user.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="fullName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="John Doe" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="isSuperAdmin"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Super Admin</FormLabel>
                                        <FormDescription>
                                            Grant full access including user management.
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Admin
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
