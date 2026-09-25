import { useEffect, useState, useCallback } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
    Search,
    User,
    Users,
    School,
    Loader2,
    CheckCircle2,
    XCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface Profile {
    id: string;
    email: string;
    full_name: string;
    email_verified: boolean;
    created_at: string;
}

interface Student extends Profile {
    username: string | null;
    unique_id?: string;
    class_year: string;
    onboarding_completed: boolean;
    parent_id?: string | null;
    school_id?: string | null;
    parent_name?: string | null;
    school_name?: string | null;
}

type Parent = Profile;

interface SchoolUser extends Profile {
    school_name: string;
    school_code: string;
}

export default function PlatformUsersPage() {
    const [activeTab, setActiveTab] = useState("students");
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const [students, setStudents] = useState<Student[]>([]);
    const [parents, setParents] = useState<Parent[]>([]);
    const [schools, setSchools] = useState<SchoolUser[]>([]);

    const fetchStudents = useCallback(async () => {
        // 1. Fetch students table
        const { data: studentsData, error: studentsError } = await supabase
            .from("students")
            .select("*")
            .order("created_at", { ascending: false });

        if (studentsError) throw studentsError;

        if (!studentsData || studentsData.length === 0) {
            setStudents([]);
            return;
        }

        // 2. Fetch profiles for these students (including username & unique_id)
        const userIds = studentsData.map(s => s.user_id);
        const { data: profilesData, error: profilesError } = await supabase
            .from("profiles")
            .select("id, email, full_name, username, unique_id, email_verified, created_at")
            .in("id", userIds);

        if (profilesError) throw profilesError;

        // 3. Fetch linked parents and schools for attribution
        const parentIds = Array.from(new Set(studentsData.map(s => s.parent_id).filter(Boolean))) as string[];
        const schoolIds = Array.from(new Set(studentsData.map(s => s.school_id).filter(Boolean))) as string[];

        const parentNameMap = new Map<string, string>();
        const schoolNameMap = new Map<string, string>();

        const [parentsRes, schoolsRes] = await Promise.all([
            parentIds.length > 0
                ? supabase.from("parents").select("id, user_id").in("id", parentIds)
                : Promise.resolve({ data: [] }),
            schoolIds.length > 0
                ? supabase.from("schools").select("id, school_name, school_code").in("id", schoolIds)
                : Promise.resolve({ data: [] })
        ]);

        if (schoolsRes.data) {
            schoolsRes.data.forEach((s: any) => {
                schoolNameMap.set(s.id, s.school_name || s.school_code || "School");
            });
        }

        if (parentsRes.data && parentsRes.data.length > 0) {
            const parentUserIds = (parentsRes.data as any[]).map((p: any) => p.user_id).filter(Boolean);
            if (parentUserIds.length > 0) {
                const { data: parentProfiles } = await supabase
                    .from("profiles")
                    .select("id, full_name")
                    .in("id", parentUserIds);

                if (parentProfiles) {
                    const profileMap = new Map(parentProfiles.map((p: any) => [p.id, p.full_name]));
                    (parentsRes.data as any[]).forEach((parent: any) => {
                        const name = profileMap.get(parent.user_id) || "Parent";
                        parentNameMap.set(parent.id, name);
                    });
                }
            }
        }

        // 4. Merge data
        const mergedStudents = studentsData.map(student => {
            const profile = profilesData?.find(p => p.id === student.user_id);
            return {
                ...student,
                username: profile?.username || null,
                unique_id: profile?.unique_id,
                email: profile?.email || "Unknown",
                full_name: profile?.full_name || profile?.username || "Unknown Student",
                email_verified: profile?.email_verified || false,
                created_at: profile?.created_at || student.created_at,
                parent_name: student.parent_id ? parentNameMap.get(student.parent_id) || null : null,
                school_name: student.school_id ? schoolNameMap.get(student.school_id) || null : null,
            };
        });

        setStudents(mergedStudents);
    }, []);

    const fetchParents = useCallback(async () => {
        const { data: parentsData, error: parentsError } = await supabase
            .from("parents")
            .select("*")
            .order("created_at", { ascending: false });

        if (parentsError) throw parentsError;

        if (!parentsData || parentsData.length === 0) {
            setParents([]);
            return;
        }

        const userIds = parentsData.map(p => p.user_id);
        const { data: profilesData, error: profilesError } = await supabase
            .from("profiles")
            .select("id, email, full_name, email_verified, created_at")
            .in("id", userIds);

        if (profilesError) throw profilesError;

        const mergedParents = parentsData.map(parent => {
            const profile = profilesData?.find(p => p.id === parent.user_id);
            return {
                ...parent,
                ...(profile || {
                    email: "Unknown",
                    full_name: "Unknown",
                    email_verified: false,
                    created_at: parent.created_at
                })
            };
        });

        setParents(mergedParents);
    }, []);

    const fetchSchools = useCallback(async () => {
        const { data: schoolsData, error: schoolsError } = await supabase
            .from("schools")
            .select("*")
            .order("created_at", { ascending: false });

        if (schoolsError) throw schoolsError;

        if (!schoolsData || schoolsData.length === 0) {
            setSchools([]);
            return;
        }

        const userIds = schoolsData.map(s => s.user_id);
        const { data: profilesData, error: profilesError } = await supabase
            .from("profiles")
            .select("id, email, full_name, email_verified, created_at")
            .in("id", userIds);

        if (profilesError) throw profilesError;

        const mergedSchools = schoolsData.map(school => {
            const profile = profilesData?.find(p => p.id === school.user_id);
            return {
                ...school,
                ...(profile || {
                    email: "Unknown",
                    full_name: "Unknown",
                    email_verified: false,
                    created_at: school.created_at
                })
            };
        });

        setSchools(mergedSchools);
    }, []);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            if (activeTab === "students") {
                await fetchStudents();
            } else if (activeTab === "parents") {
                await fetchParents();
            } else if (activeTab === "schools") {
                await fetchSchools();
            }
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    }, [activeTab, fetchParents, fetchSchools, fetchStudents]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const filterUsers = (users: any[]) => {
        if (!searchQuery) return users;
        const lowerQuery = searchQuery.toLowerCase();
        return users.filter(user =>
            user.full_name?.toLowerCase().includes(lowerQuery) ||
            user.username?.toLowerCase().includes(lowerQuery) ||
            user.email?.toLowerCase().includes(lowerQuery) ||
            user.parent_name?.toLowerCase().includes(lowerQuery) ||
            user.school_name?.toLowerCase().includes(lowerQuery) ||
            user.school_code?.toLowerCase().includes(lowerQuery)
        );
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Platform Users</h1>
                <p className="text-muted-foreground">
                    View and manage Students, Parents, and Schools registered on the platform.
                </p>
            </div>

            <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, username, email, parent..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <Tabs defaultValue="students" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 max-w-[400px]">
                    <TabsTrigger value="students" className="flex items-center gap-2">
                        <User size={16} />
                        Students
                    </TabsTrigger>
                    <TabsTrigger value="parents" className="flex items-center gap-2">
                        <Users size={16} />
                        Parents
                    </TabsTrigger>
                    <TabsTrigger value="schools" className="flex items-center gap-2">
                        <School size={16} />
                        Schools
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="students" className="mt-6">
                    <div className="rounded-md border bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Username</TableHead>
                                    <TableHead>Managed By</TableHead>
                                    <TableHead>Class Year</TableHead>
                                    <TableHead>Onboarding</TableHead>
                                    <TableHead>Joined</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            <div className="flex justify-center items-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Loading students...
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filterUsers(students).length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                            No students found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filterUsers(students).map((student) => (
                                        <TableRow key={student.id}>
                                            <TableCell>
                                                <div className="font-medium">{student.full_name}</div>
                                                <div className="text-xs text-muted-foreground">{student.email}</div>
                                            </TableCell>
                                            <TableCell>
                                                {student.username ? (
                                                    <Badge variant="outline" className="font-mono text-xs font-normal">
                                                        @{student.username}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {student.parent_name ? (
                                                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200">
                                                        Parent: {student.parent_name}
                                                    </Badge>
                                                ) : student.school_name ? (
                                                    <Badge variant="secondary" className="bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200">
                                                        School: {student.school_name}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">Self / Independent</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {student.class_year ? student.class_year.replace('_', ' ').toUpperCase() : 'N/A'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {student.onboarding_completed ? (
                                                    <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
                                                        Completed
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                                                        Pending
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {format(new Date(student.created_at), "MMM d, yyyy")}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                <TabsContent value="parents" className="mt-6">
                    <div className="rounded-md border bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Parent Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Verified</TableHead>
                                    <TableHead>Joined</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            <div className="flex justify-center items-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Loading parents...
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filterUsers(parents).length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                            No parents found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filterUsers(parents).map((parent) => (
                                        <TableRow key={parent.id}>
                                            <TableCell className="font-medium">{parent.full_name}</TableCell>
                                            <TableCell>{parent.email}</TableCell>
                                            <TableCell>
                                                {parent.email_verified ? (
                                                    <div className="flex items-center gap-1 text-green-600 text-sm">
                                                        <CheckCircle2 className="h-4 w-4" />
                                                        <span>Verified</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1 text-yellow-600 text-sm">
                                                        <XCircle className="h-4 w-4" />
                                                        <span>Unverified</span>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {format(new Date(parent.created_at), "MMM d, yyyy")}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                <TabsContent value="schools" className="mt-6">
                    <div className="rounded-md border bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>School Name</TableHead>
                                    <TableHead>School Code</TableHead>
                                    <TableHead>Contact Email</TableHead>
                                    <TableHead>Verified</TableHead>
                                    <TableHead>Joined</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            <div className="flex justify-center items-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Loading schools...
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filterUsers(schools).length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                            No schools found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filterUsers(schools).map((school) => (
                                        <TableRow key={school.id}>
                                            <TableCell className="font-medium">{school.school_name || "N/A"}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-mono">
                                                    {school.school_code}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{school.email}</TableCell>
                                            <TableCell>
                                                {school.email_verified ? (
                                                    <div className="flex items-center gap-1 text-green-600 text-sm">
                                                        <CheckCircle2 className="h-4 w-4" />
                                                        <span>Verified</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1 text-yellow-600 text-sm">
                                                        <XCircle className="h-4 w-4" />
                                                        <span>Unverified</span>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {format(new Date(school.created_at), "MMM d, yyyy")}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
