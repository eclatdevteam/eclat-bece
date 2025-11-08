import { useState, useEffect } from "react";
import { BookOpen } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export default function StudentPractice() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("subject");
  const [subjectCounts, setSubjectCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchQuestionCounts = async () => {
      if (!user) return;

      const { data: studentData } = await supabase
        .from("students")
        .select("class_year")
        .eq("user_id", user.id)
        .single();

      if (!studentData?.class_year) return;

      const tableName = studentData.class_year === 'year_6' 
        ? 'quiz_questions_year6' 
        : 'quiz_questions_year9';

      const { data, error } = await supabase
        .from(tableName as any)
        .select("subject");

      if (data && !error) {
        const counts = data.reduce((acc: Record<string, number>, curr: any) => {
          acc[curr.subject] = (acc[curr.subject] || 0) + 1;
          return acc;
        }, {});
        setSubjectCounts(counts);
      }
    };

    fetchQuestionCounts();
  }, [user]);

  const subjects = [
    { name: "Mathematics", icon: "📐", difficulty: "Core Subject", questions: subjectCounts["Mathematics"] || 0 },
    { name: "English Language", icon: "📚", difficulty: "Core Subject", questions: subjectCounts["English Language"] || 0 },
    { name: "Basic Science", icon: "🔬", difficulty: "Core Subject", questions: subjectCounts["Basic Science"] || 0 },
    { name: "Social Studies", icon: "🌍", difficulty: "Core Subject", questions: subjectCounts["Social Studies"] || 0 },
  ];

  const topics = [
    { name: "Number & Numeration", subject: "Mathematics", icon: "➗", questions: 420 },
    { name: "Comprehension Passages", subject: "English", icon: "📖", questions: 380 },
    { name: "Living Things", subject: "Basic Science", icon: "🦋", questions: 325 },
    { name: "Grammar & Composition", subject: "English", icon: "✍️", questions: 290 },
    { name: "Algebraic Processes", subject: "Mathematics", icon: "📐", questions: 285 },
    { name: "Nigerian History", subject: "Social Studies", icon: "📜", questions: 245 },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 animate-fade-in">
        <h2 className="text-3xl font-bold text-foreground mb-2">Practice Zone</h2>
        <p className="text-muted-foreground">Choose your learning path and start practicing</p>
      </div>

      <Card className="border-2 animate-scale-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="text-primary" size={24} />
            Practice Options
          </CardTitle>
          <CardDescription>Select a subject or topic to begin</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="subject">By Subject</TabsTrigger>
              <TabsTrigger value="topic">By Topic</TabsTrigger>
            </TabsList>
            <TabsContent value="subject" className="space-y-3">
              {subjects.map((subject, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border-2 rounded-lg hover:border-primary hover:shadow-soft transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{subject.icon}</span>
                    <div>
                      <h4 className="font-semibold text-foreground">{subject.name}</h4>
                      <p className="text-sm text-muted-foreground">{subject.questions} questions</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2 py-1 rounded-full bg-primary-light text-primary font-medium">
                      {subject.difficulty}
                    </span>
                    <Button 
                      variant="hero" 
                      size="sm" 
                      onClick={() => navigate(`/quiz?subject=${encodeURIComponent(subject.name)}`)}
                    >
                      Start Practice
                    </Button>
                  </div>
                </div>
              ))}
            </TabsContent>
            <TabsContent value="topic" className="space-y-3">
              {topics.map((topic, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border-2 rounded-lg hover:border-primary hover:shadow-soft transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{topic.icon}</span>
                    <div>
                      <h4 className="font-semibold text-foreground">{topic.name}</h4>
                      <p className="text-sm text-muted-foreground">{topic.subject} • {topic.questions} questions</p>
                    </div>
                  </div>
                  <Button variant="hero" size="sm" onClick={() => navigate("/quiz")}>Start Practice</Button>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
