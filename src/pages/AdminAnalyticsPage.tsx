import { useEffect, useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
} from "recharts";
import { Loader2, Users, BookOpen, Trophy, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export default function AdminAnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [userStats, setUserStats] = useState([
        { name: "Students", value: 0 },
        { name: "Parents", value: 0 },
        { name: "Schools", value: 0 },
    ]);
    const [quizStats, setQuizStats] = useState<any[]>([]);
    const [activityStats, setActivityStats] = useState<any[]>([]);
    const [totalQuizzes, setTotalQuizzes] = useState(0);
    const [avgScore, setAvgScore] = useState(0);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            // 1. Fetch User Counts & Total Quizzes concurrently with bounded 30-day window for recent results
            const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
            const [
                { count: studentCount },
                { count: parentCount },
                { count: schoolCount },
                { count: allTimeQuizzesCount },
                { data: recentResults }
            ] = await Promise.all([
                supabase.from("students").select("*", { count: "exact", head: true }),
                supabase.from("parents").select("*", { count: "exact", head: true }),
                supabase.from("schools").select("*", { count: "exact", head: true }),
                supabase.from("quiz_results").select("*", { count: "exact", head: true }),
                supabase
                    .from("quiz_results")
                    .select("subject, score, completed_at")
                    .gte("completed_at", thirtyDaysAgo)
            ]);

            setUserStats([
                { name: "Students", value: studentCount || 0 },
                { name: "Parents", value: parentCount || 0 },
                { name: "Schools", value: schoolCount || 0 },
            ]);

            setTotalQuizzes(allTimeQuizzesCount || 0);

            if (recentResults && recentResults.length > 0) {
                // Calculate Average Score across the active window
                const totalScore = recentResults.reduce((acc, curr) => acc + Number(curr.score), 0);
                setAvgScore(Math.round(totalScore / recentResults.length));

                // Group by Subject for Bar Chart
                const subjectMap = new Map();
                recentResults.forEach((r) => {
                    if (!subjectMap.has(r.subject)) {
                        subjectMap.set(r.subject, { count: 0, total: 0 });
                    }
                    const entry = subjectMap.get(r.subject);
                    entry.count += 1;
                    entry.total += Number(r.score);
                });

                const subjectData = Array.from(subjectMap.entries()).map(([subject, data]) => ({
                    subject,
                    score: Math.round(data.total / data.count),
                    count: data.count
                }));
                setQuizStats(subjectData);

                // Group by Date for Line Chart (Last 7 days)
                const activityMap = new Map();
                for (let i = 6; i >= 0; i--) {
                    const date = format(subDays(new Date(), i), "MMM dd");
                    activityMap.set(date, 0);
                }

                recentResults.forEach((r) => {
                    const date = format(new Date(r.completed_at), "MMM dd");
                    if (activityMap.has(date)) {
                        activityMap.set(date, activityMap.get(date) + 1);
                    }
                });

                const activityData = Array.from(activityMap.entries()).map(([date, count]) => ({
                    date,
                    quizzes: count
                }));
                setActivityStats(activityData);
            }

        } catch (error) {
            console.error("Error fetching analytics:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
                <p className="text-muted-foreground">
                    Platform performance, user growth, and engagement metrics.
                </p>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {userStats.reduce((acc, curr) => acc + curr.value, 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Across all roles
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Quizzes</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalQuizzes}</div>
                        <p className="text-xs text-muted-foreground">
                            Completed to date
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Score</CardTitle>
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{avgScore}%</div>
                        <p className="text-xs text-muted-foreground">
                            Global average
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Today</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {activityStats.length > 0 ? activityStats[activityStats.length - 1].quizzes : 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Quizzes taken today
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* User Distribution Chart */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>User Distribution</CardTitle>
                        <CardDescription>
                            Breakdown of registered users by role.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={userStats}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {userStats.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex justify-center gap-4 text-sm">
                            {userStats.map((entry, index) => (
                                <div key={entry.name} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                    <span>{entry.name} ({entry.value})</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Quiz Activity Chart */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Quiz Activity</CardTitle>
                        <CardDescription>
                            Number of quizzes taken over the last 7 days.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={activityStats}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="quizzes" stroke="#8884d8" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Subject Performance Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Subject Performance</CardTitle>
                    <CardDescription>
                        Average score per subject.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={quizStats}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="subject" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="score" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
