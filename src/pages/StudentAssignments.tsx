import { ClipboardList } from "lucide-react";
import { PracticeAssignment } from "@/components/PracticeAssignment";
import { useNavigate } from "react-router-dom";

export default function StudentAssignments() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 animate-fade-in">
        <h2 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
          <ClipboardList className="text-primary" size={32} />
          Practice Assignments
        </h2>
        <p className="text-muted-foreground">Complete your assigned practice sessions</p>
      </div>

      <div className="animate-scale-in">
        <PracticeAssignment onStartAssignment={() => navigate("/quiz")} />
      </div>
    </div>
  );
}
