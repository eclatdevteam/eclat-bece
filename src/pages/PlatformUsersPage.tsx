import { useEffect, useState } from "react";
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
    class_year: string;
    onboarding_completed: boolean;
    parent_id?: string;
    school_id?: string;
}

interface Parent extends Profile {
    // Parent specific fields if any
}

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

    useEffect(() => {
        fetchUsers();
    }, [activeTab]);

    const fetchUsers = async () => {
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
    };

    const fetchStudents = async () => {
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

        // 2. Fetch profiles for these students
        const userIds = studentsData.map(s => s.user_id);
        const { data: profilesData, error: profilesError } = await supabase
            .from("profiles")
            .select("id, email, full_name, email_verified, created_at")
            .in("id", userIds);

        if (profilesError) throw profilesError;

        // 3. Merge data
        const mergedStudents = studentsData.map(student => {
            const profile = profilesData?.find(p => p.id === student.user_id);
            return {
                ...student,
                ...(profile || {
                    email: "Unknown",
                    full_name: "Unknown",
                    email_verified: false,
                    created_at: student.created_at
                })
            };
        });

        setStudents(mergedStudents);
    };

    const fetchParents = async () => {
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
    };

    const fetchSchools = async () => {
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
    };

    const filterUsers = (users: any[]) => {
        if (!searchQuery) return users;
        const lowerQuery = searchQuery.toLowerCase();
        return users.filter(user =>
            user.full_name?.toLowerCase().includes(lowerQuery) ||
            user.email?.toLowerCase().includes(lowerQuery) ||
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
                        placeholder="Search by name, email, or school code..."
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
                                    <TableHead>Student Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Class Year</TableHead>
                                    <TableHead>Onboarding</TableHead>
                                    <TableHead>Joined</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            <div className="flex justify-center items-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Loading students...
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filterUsers(students).length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                            No students found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filterUsers(students).map((student) => (
                                        <TableRow key={student.id}>
                                            <TableCell className="font-medium">{student.full_name}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {student.email}
                                                    {student.email_verified && (
                                                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                                                    )}
                                                </div>
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
                                            <TableCell className="text-muted-foreground">
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
