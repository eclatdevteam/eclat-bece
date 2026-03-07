export interface QuizResult {
    id: string;
    student_id: string;
    subject: string;
    score: number;
    correct_answers: number;
    total_questions: number;
    completed_at: string;
    student_name?: string;
}

export interface Assignment {
    id: string;
    student_id: string;
    parent_id: string;
    subject: string;
    topics: string[];
    num_questions: number;
    duration: number;
    status: 'pending' | 'completed';
    score?: number;
    created_at: string;
    completed_at?: string;
}

export interface ChildAnalytics {
    studentId: string;
    averageScore: number;
    totalQuizzes: number;
    subjectPerformance: { subject: string; avgScore: number; count: number }[];
    recentQuizzes: QuizResult[];
}

export interface LinkedChild {
    id: string;
    user_id: string;
    class_year: string | null;
    is_premium?: boolean;
    profile: {
        full_name: string | null;
        unique_id: string;
        username?: string;
    };
    assignments?: Assignment[];
}
