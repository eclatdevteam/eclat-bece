import { useState, useEffect } from "react";
import { BookOpen, Search, SlidersHorizontal } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface TopicCount {
  subject: string;
  topic: string;
  questions_count: number;
}

export default function StudentPractice() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("subject");
  const [subjectCounts, setSubjectCounts] = useState<Record<string, number>>({});
  const [topics, setTopics] = useState<Array<{name: string; subject: string; icon: string; questions: number}>>([]);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("all");

  const [cohortSubjects, setCohortSubjects] = useState<Array<{ name: string; icon: string; category: string }>>([]);

  useEffect(() => {
    const fetchQuestionData = async () => {
      if (!user) return;

      const { data: studentData } = await supabase
        .from("students")
        .select("class_year")
        .eq("user_id", user.id)
        .single();

      if (!studentData?.class_year) return;

      const classYear = studentData.class_year;
      const tableName: "quiz_questions_year6" | "quiz_questions_year9" = classYear === 'year_6'
        ? 'quiz_questions_year6' 
        : 'quiz_questions_year9';

      const viewName: "topic_question_counts_year6" | "topic_question_counts_year9" = classYear === 'year_6'
        ? 'topic_question_counts_year6'
        : 'topic_question_counts_year9';

      // 1. Fetch active subjects configured for this student's cohort
      const { data: dbSubjects } = await supabase.from("subjects")
        .select("name, icon, category")
        .eq(classYear === "year_6" ? "available_year_6" : "available_year_9", true)
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .order("name", { ascending: true });

      const activeSubjectList = (dbSubjects as Array<{ name: string; icon: string; category: string }>) || [];
      setCohortSubjects(activeSubjectList);

      const counts: Record<string, number> = {};
      await Promise.all(
        activeSubjectList.map(async (sub) => {
          const { count, error } = await supabase
            .from(tableName)
            .select("*", { count: 'exact', head: true })
            .eq("subject", sub.name);
          
          if (!error && count !== null) {
            counts[sub.name] = count;
          }
        })
      );
      setSubjectCounts(counts);

      // 2. Fetch topic counts from the pre-aggregated database view
      const { data: topicsData, error: topicsError } = await supabase
        .from(viewName as never)
        .select("subject, topic, questions_count");

      if (topicsData && !topicsError) {
        const topicIcons: Record<string, string> = {
          "Number & Numeration": "➗",
          "Comprehension Passages": "📖",
          "Living Things": "🦋",
          "Grammar & Composition": "✍️",
          "Algebraic Processes": "📐",
          "Nigerian History": "📜",
          "default": "📚"
        };

        const topicsArray = (topicsData as unknown as TopicCount[]).map((item) => ({
          name: item.topic,
          subject: item.subject,
          icon: topicIcons[item.topic] || topicIcons.default,
          questions: item.questions_count
        }));

        setTopics(topicsArray);
      }
    };

    fetchQuestionData();
  }, [user]);

  const subjects = cohortSubjects.map((sub) => ({
    name: sub.name,
    icon: sub.icon || "📚",
    difficulty: sub.category === "core" ? "Core Subject" : "Elective",
    questions: subjectCounts[sub.name] || 0,
  }));

  const filteredSubjects = subjects.filter((subject) => subject.name.toLowerCase().includes(search.toLowerCase()));
  const filteredTopics = topics.filter((topic) => `${topic.name} ${topic.subject}`.toLowerCase().includes(search.toLowerCase()));


  return (
    <div className="w-full px-5 py-8 text-foreground sm:px-8">
      <div className="mb-7">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Practice Zone<span className="text-primary">.</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Choose your learning path and start practicing</p>
      </div>

      <div className="mb-7 grid gap-3 md:grid-cols-[1fr_180px_180px_110px]">
        <label className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 shadow-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search subjects or topics..."
            className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-muted-foreground text-foreground"
          />
        </label>
        <select
          value={difficulty}
          onChange={(event) => setDifficulty(event.target.value)}
          className="rounded-xl border border-border bg-card px-3 text-sm text-foreground outline-none shadow-sm cursor-pointer"
        >
          <option value="all">All Subjects</option>
          <option value="core">Core Subjects</option>
        </select>
        <select className="rounded-xl border border-border bg-card px-3 text-sm text-foreground outline-none shadow-sm cursor-pointer">
          <option>All Difficulties</option>
          <option>Beginner</option>
          <option>Advanced</option>
        </select>
        <button className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card text-sm text-foreground shadow-sm hover:bg-muted transition-colors">
          <SlidersHorizontal size={15} />
          Sort
        </button>
      </div>

      <div className="mb-7 rounded-xl border border-border bg-card p-1 shadow-sm">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 bg-transparent">
            <TabsTrigger value="subject" className="text-muted-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground font-semibold rounded-lg">
              By Subject
            </TabsTrigger>
            <TabsTrigger value="topic" className="text-muted-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground font-semibold rounded-lg">
              By Topic
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card className="border-border bg-card text-card-foreground shadow-sm p-4 rounded-xl">
        <CardHeader className="px-0">
          <CardTitle className="flex items-center gap-2 text-lg text-foreground">
            Recommended for You <span className="text-primary">·</span>
          </CardTitle>
          <CardDescription className="text-muted-foreground">Build momentum with a focused practice session.</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="hidden"><TabsTrigger value="subject">By Subject</TabsTrigger><TabsTrigger value="topic">By Topic</TabsTrigger></TabsList>
            <TabsContent value="subject" className="space-y-3">
              {filteredSubjects.filter((subject) => difficulty === "all" || subject.difficulty === "Core Subject").map((subject, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 transition hover:border-primary/50 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="rounded-xl bg-muted p-3 text-2xl">{subject.icon}</span>
                    <div>
                      <h4 className="font-semibold text-foreground">{subject.name}</h4>
                      <p className="text-sm text-muted-foreground">{subject.questions} questions</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
                      {subject.difficulty}
                    </span>
                    <Button 
                      variant="default"
                      size="sm" 
                      onClick={() => navigate(`/quiz?subject=${encodeURIComponent(subject.name)}`)}
                      className="shadow-sm"
                    >
                      Start Practice <span className="ml-1 text-primary-foreground">→</span>
                    </Button>
                  </div>
                </div>
              ))}
            </TabsContent>
            <TabsContent value="topic" className="space-y-3">
              {filteredTopics.map((topic, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition hover:border-primary/50 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="rounded-xl bg-muted p-3 text-2xl">{topic.icon}</span>
                    <div>
                      <h4 className="font-semibold text-foreground">{topic.name}</h4>
                      <p className="text-sm text-muted-foreground">{topic.subject} · {topic.questions} questions</p>
                    </div>
                  </div>
                  <Button 
                    variant="default"
                    size="sm" 
                    onClick={() => navigate(`/quiz?topic=${encodeURIComponent(topic.name)}&subject=${encodeURIComponent(topic.subject)}`)}
                    className="shadow-sm"
                  >
                    Start Practice <span className="ml-1 text-primary-foreground">→</span>
                  </Button>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
