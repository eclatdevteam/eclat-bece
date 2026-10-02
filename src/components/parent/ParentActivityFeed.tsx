import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen, Award, Target, Brain, Search, PlusCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";

import { QuizResult } from "@/types/parent";

interface ParentActivityFeedProps {
    activities: QuizResult[];
    isLoading: boolean;
}

export function ParentActivityFeed({ activities, isLoading }: ParentActivityFeedProps) {
    if (isLoading) {
        return (
            <Card className="border border-border bg-card text-card-foreground shadow-sm rounded-2xl">
                <CardHeader className="border-b border-border">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-foreground">
                        <Target className="h-5 w-5 text-primary" />
                        Recent Activity
                    </CardTitle>
                    <CardDescription className="text-muted-foreground text-xs">Loading recent activities...</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse flex items-start gap-4 p-3 border border-border bg-muted/30 rounded-xl">
                            <div className="w-10 h-10 bg-muted rounded-full"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-muted rounded w-3/4"></div>
                                <div className="h-3 bg-muted rounded w-1/2"></div>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border border-border bg-card text-card-foreground shadow-sm h-full max-h-[600px] flex flex-col rounded-2xl">
            <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-foreground">
                    <Target className="h-5 w-5 text-primary" />
                    Recent Activity Timeline
                </CardTitle>
                <CardDescription className="text-muted-foreground text-xs">Latest learning milestones across all your children</CardDescription>
            </CardHeader>
            <CardContent className="overflow-y-auto pt-4 flex-1">
                {activities.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground flex flex-col items-center justify-center h-full">
                        <div className="bg-primary/10 w-14 h-14 rounded-full flex items-center justify-center mb-3">
                            <Brain className="h-7 w-7 text-primary" />
                        </div>
                        <p className="font-semibold text-foreground text-sm">No recent activity</p>
                        <p className="text-xs text-muted-foreground mt-1">Quizzes completed by your children will appear here.</p>
                    </div>
                ) : (
                    <div className="space-y-5 relative before:absolute before:inset-y-0 before:left-4 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary/40 before:via-border before:to-transparent">
                        {activities.map((activity) => (
                            <div key={activity.id} className="relative flex items-start gap-4 group">
                                {/* Timeline dot */}
                                <div className="flex items-center justify-center w-8 h-8 rounded-full border border-border bg-card text-primary shadow-sm shrink-0 z-10 transition-transform duration-300 group-hover:scale-110 mt-1">
                                    {activity.score >= 80 ? <Award className="h-4 w-4 text-emerald-500" /> : <BookOpen className="h-4 w-4 text-primary" />}
                                </div>

                                {/* Timeline card */}
                                <div className="flex-1 p-3.5 sm:p-4 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-all duration-300 min-w-0 hover:border-primary/40">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1.5">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="font-bold text-foreground text-sm truncate">{activity.student_name}</span>
                                            <Badge className={`shrink-0 text-[10px] font-bold border ${activity.score >= 80 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : 'bg-primary/10 text-primary border-primary/20'}`}>
                                                {Math.round(activity.score)}%
                                            </Badge>
                                        </div>
                                        <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">
                                            {formatDistanceToNow(new Date(activity.completed_at), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <div className="text-xs text-muted-foreground leading-relaxed">
                                        Completed a <strong className="text-foreground font-semibold">{activity.subject}</strong> quiz
                                        {" "}(<span className="font-mono text-primary font-bold">{activity.correct_answers}/{activity.total_questions}</span> correct)
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
