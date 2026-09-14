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

      // 1. Fetch subject counts efficiently using count: 'exact' and head: true
      const subjectsToFetch = ["Mathematics", "English Language", "Basic Science", "Social Studies"];
      const counts: Record<string, number> = {};
      
      await Promise.all(
        subjectsToFetch.map(async (subject) => {
          const { count, error } = await supabase
            .from(tableName)
            .select("*", { count: 'exact', head: true })
            .eq("subject", subject);
          
          if (!error && count !== null) {
            counts[subject] = count;
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

  const subjects = [
    { name: "Mathematics", icon: "📐", difficulty: "Core Subject", questions: subjectCounts["Mathematics"] || 0 },
    { name: "English Language", icon: "📚", difficulty: "Core Subject", questions: subjectCounts["English Language"] || 0 },
    { name: "Basic Science", icon: "🔬", difficulty: "Core Subject", questions: subjectCounts["Basic Science"] || 0 },
    { name: "Social Studies", icon: "🌍", difficulty: "Core Subject", questions: subjectCounts["Social Studies"] || 0 },
  ];

  const filteredSubjects = subjects.filter((subject) => subject.name.toLowerCase().includes(search.toLowerCase()));
  const filteredTopics = topics.filter((topic) => `${topic.name} ${topic.subject}`.toLowerCase().includes(search.toLowerCase()));


  return (
    <div className="mx-auto max-w-6xl px-5 py-8 text-slate-100 sm:px-8">
      <div className="mb-7"><h1 className="text-3xl font-bold tracking-tight">Practice Zone<span className="text-[#71c9ed]">.</span></h1><p className="mt-1 text-sm text-slate-400">Choose your learning path and start practicing</p></div>
      <div className="mb-7 grid gap-3 md:grid-cols-[1fr_180px_180px_110px]"><label className="flex items-center gap-3 rounded-md border border-[#2b3a54] bg-[#111d32] px-4"><Search className="h-4 w-4 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search subjects or topics..." className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-slate-500" /></label><select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className="rounded-md border border-[#2b3a54] bg-[#111d32] px-3 text-sm text-slate-200 outline-none"><option value="all">All Subjects</option><option value="core">Core Subjects</option></select><select className="rounded-md border border-[#2b3a54] bg-[#111d32] px-3 text-sm text-slate-200 outline-none"><option>All Difficulties</option><option>Beginner</option><option>Advanced</option></select><button className="flex items-center justify-center gap-2 rounded-md border border-[#2b3a54] bg-[#111d32] text-sm text-slate-200"><SlidersHorizontal size={15} />Sort</button></div>
      <div className="mb-7 rounded-md border border-[#2b3a54] bg-[#111d32] p-1"><Tabs value={activeTab} onValueChange={setActiveTab}><TabsList className="grid w-full grid-cols-2 bg-transparent"><TabsTrigger value="subject" className="text-slate-400 data-[state=active]:bg-[#2d3a53] data-[state=active]:text-white">By Subject</TabsTrigger><TabsTrigger value="topic" className="text-slate-400 data-[state=active]:bg-[#2d3a53] data-[state=active]:text-white">By Topic</TabsTrigger></TabsList></Tabs></div>
      <Card className="border-[#2b3a54] bg-transparent shadow-none p-4">
        <CardHeader className="px-0"><CardTitle className="flex items-center gap-2 text-lg">Recommended for You <span className="text-[#71c9ed]">·</span></CardTitle><CardDescription className="text-slate-400">Build momentum with a focused practice session.</CardDescription></CardHeader>
        <CardContent className="px-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="hidden"><TabsTrigger value="subject">By Subject</TabsTrigger><TabsTrigger value="topic">By Topic</TabsTrigger></TabsList>
            <TabsContent value="subject" className="space-y-3">
              {filteredSubjects.filter((subject) => difficulty === "all" || subject.difficulty === "Core Subject").map((subject, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-4 rounded-lg border border-[#2b3a54] bg-[#111d32] p-4 transition hover:border-[#159dca] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="rounded-md bg-[#1b2e47] p-3 text-2xl">{subject.icon}</span>
                    <div>
                      <h4 className="font-semibold text-slate-100">{subject.name}</h4>
                      <p className="text-sm text-slate-400">{subject.questions} questions</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-[#26344d] px-3 py-1 text-xs font-medium text-slate-300">
                      {subject.difficulty}
                    </span>
                    <Button 
                      variant="default"
                      size="sm" 
                      onClick={() => navigate(`/quiz?subject=${encodeURIComponent(subject.name)}`)}
                    >
                      Start Practice <span className="ml-1 text-[#71c9ed]">→</span>
                    </Button>
                  </div>
                </div>
              ))}
            </TabsContent>
            <TabsContent value="topic" className="space-y-3">
              {filteredTopics.map((topic, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-[#2b3a54] bg-[#111d32] p-4 transition hover:border-[#159dca]"
                >
                  <div className="flex items-center gap-3">
                    <span className="rounded-md bg-[#1b2e47] p-3 text-2xl">{topic.icon}</span>
                    <div>
                      <h4 className="font-semibold text-slate-100">{topic.name}</h4>
                      <p className="text-sm text-slate-400">{topic.subject} · {topic.questions} questions</p>
                    </div>
                  </div>
                  <Button 
                    variant="default"
                    size="sm" 
                    onClick={() => navigate(`/quiz?topic=${encodeURIComponent(topic.name)}&subject=${encodeURIComponent(topic.subject)}`)}
                  >
                    Start Practice <span className="ml-1 text-[#71c9ed]">→</span>
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
