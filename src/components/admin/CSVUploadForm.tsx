import { useState } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface CSVRow {
    subject: string;
    topic: string;
    difficulty: string;
    question_text: string;
    explanation: string;
    option_1: string;
    option_2: string;
    option_3: string;
    option_4: string;
    correct_option: string;
}

interface ValidationError {
    row: number;
    field: string;
    message: string;
}

interface CSVUploadFormProps {
    onSuccess: () => void;
}

export function CSVUploadForm({ onSuccess }: CSVUploadFormProps) {
    const [classYear, setClassYear] = useState<"year_6" | "year_9">("year_6");
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<ValidationError[]>([]);
    const [uploadSummary, setUploadSummary] = useState<{ success: number; failed: number } | null>(null);
    const { user } = useAuth();

    const validateCSVRow = (row: CSVRow, rowIndex: number): ValidationError[] => {
        const errors: ValidationError[] = [];

        // Check required fields
        if (!row.subject?.trim()) {
            errors.push({ row: rowIndex, field: "subject", message: "Subject is required" });
        }
        if (!row.question_text?.trim()) {
            errors.push({ row: rowIndex, field: "question_text", message: "Question text is required" });
        }
        if (!row.option_1?.trim()) {
            errors.push({ row: rowIndex, field: "option_1", message: "Option 1 is required" });
        }
        if (!row.option_2?.trim()) {
            errors.push({ row: rowIndex, field: "option_2", message: "Option 2 is required" });
        }
        if (!row.option_3?.trim()) {
            errors.push({ row: rowIndex, field: "option_3", message: "Option 3 is required" });
        }
        if (!row.option_4?.trim()) {
            errors.push({ row: rowIndex, field: "option_4", message: "Option 4 is required" });
        }

        // Validate difficulty
        const validDifficulties = ["easy", "medium", "hard"];
        if (row.difficulty && !validDifficulties.includes(row.difficulty.toLowerCase())) {
            errors.push({
                row: rowIndex,
                field: "difficulty",
                message: `Difficulty must be one of: Easy, Medium, Hard (got: ${row.difficulty})`
            });
        }

        // Validate correct_option
        const correctOption = parseInt(row.correct_option);
        if (isNaN(correctOption) || correctOption < 1 || correctOption > 4) {
            errors.push({
                row: rowIndex,
                field: "correct_option",
                message: "Correct option must be a number between 1 and 4"
            });
        }

        return errors;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (!selectedFile.name.endsWith('.csv')) {
                toast.error("Please select a CSV file");
                return;
            }
            setFile(selectedFile);
            setErrors([]);
            setUploadSummary(null);
        }
    };

    const handleUpload = async () => {
        if (!file || !user) return;

        setLoading(true);
        setErrors([]);
        setUploadSummary(null);

        try {
            // Parse CSV
            Papa.parse<CSVRow>(file, {
                header: true,
                skipEmptyLines: true,
                complete: async (results) => {
                    const validationErrors: ValidationError[] = [];
                    const validRows: CSVRow[] = [];

                    // Validate all rows
                    results.data.forEach((row, index) => {
                        const rowErrors = validateCSVRow(row, index + 2); // +2 because row 1 is header
                        if (rowErrors.length > 0) {
                            validationErrors.push(...rowErrors);
                        } else {
                            validRows.push(row);
                        }
                    });

                    if (validationErrors.length > 0) {
                        setErrors(validationErrors);
                        setLoading(false);
                        toast.error(`Found ${validationErrors.length} validation error(s)`);
                        return;
                    }

                    if (validRows.length === 0) {
                        toast.error("No valid questions found in CSV");
                        setLoading(false);
                        return;
                    }

                    // Upload valid questions
                    await uploadQuestions(validRows);
                },
                error: (error) => {
                    console.error("CSV parse error:", error);
                    toast.error("Failed to parse CSV file");
                    setLoading(false);
                }
            });
        } catch (error: any) {
            console.error("Upload error:", error);
            toast.error(error.message || "Failed to upload questions");
            setLoading(false);
        }
    };

    const uploadQuestions = async (rows: CSVRow[]) => {
        const tableName = classYear === 'year_6' ? 'quiz_questions_year6' : 'quiz_questions_year9';
        const optionsTableName = classYear === 'year_6' ? 'quiz_options_year6' : 'quiz_options_year9';

        let successCount = 0;
        let failCount = 0;

        for (const row of rows) {
            try {
                // Insert question
                const { data: questionData, error: questionError } = await supabase
                    .from(tableName as any)
                    .insert({
                        subject: row.subject.trim(),
                        topic: row.topic?.trim() || null,
                        question_text: row.question_text.trim(),
                        correct_answer: row[`option_${row.correct_option}` as keyof CSVRow],
                        explanation: row.explanation?.trim() || null,
                        difficulty: row.difficulty?.toLowerCase() || "medium",
                    })
                    .select()
                    .single();

                if (questionError) throw questionError;

                // Insert options
                const options = [
                    { text: row.option_1.trim(), isCorrect: row.correct_option === "1" },
                    { text: row.option_2.trim(), isCorrect: row.correct_option === "2" },
                    { text: row.option_3.trim(), isCorrect: row.correct_option === "3" },
                    { text: row.option_4.trim(), isCorrect: row.correct_option === "4" },
                ];

                const optionsToInsert = options.map((opt, index) => ({
                    question_id: questionData.id,
                    option_text: opt.text,
                    is_correct: opt.isCorrect,
                    display_order: index,
                }));

                const { error: optionsError } = await supabase
                    .from(optionsTableName as any)
                    .insert(optionsToInsert);

                if (optionsError) throw optionsError;

                successCount++;
            } catch (error) {
                console.error("Error uploading question:", error);
                failCount++;
            }
        }

        // Log admin action
        try {
            await supabase.rpc('log_admin_action', {
                _admin_id: (await supabase.rpc('get_admin_id', { _user_id: user.id })).data,
                _action: 'bulk_create_questions',
                _resource_type: 'question',
                _resource_id: null,
                _details: {
                    class_year: classYear,
                    total_questions: rows.length,
                    success_count: successCount,
                    fail_count: failCount
                }
            });
        } catch (error) {
            console.error("Error logging admin action:", error);
        }

        setUploadSummary({ success: successCount, failed: failCount });
        setLoading(false);

        if (successCount > 0) {
            toast.success(`Successfully uploaded ${successCount} question(s)`);
            onSuccess();
        }

        if (failCount > 0) {
            toast.error(`Failed to upload ${failCount} question(s)`);
        }
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="classYear">Class Year</Label>
                <Select value={classYear} onValueChange={(v: "year_6" | "year_9") => setClassYear(v)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="year_6">Year 6 (Common Entrance)</SelectItem>
                        <SelectItem value="year_9">Year 9 (BECE)</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="csvFile">CSV File</Label>
                <div className="flex items-center gap-2">
                    <Input
                        id="csvFile"
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        disabled={loading}
                    />
                    {file && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <FileText className="h-4 w-4" />
                            <span>{file.name}</span>
                        </div>
                    )}
                </div>
                <p className="text-sm text-muted-foreground">
                    Upload a CSV file with columns: subject, topic, difficulty, question_text, explanation, option_1, option_2, option_3, option_4, correct_option
                </p>
            </div>

            {errors.length > 0 && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        <div className="font-semibold mb-2">Validation Errors:</div>
                        <ul className="list-disc list-inside space-y-1 max-h-40 overflow-y-auto">
                            {errors.slice(0, 10).map((error, index) => (
                                <li key={index} className="text-sm">
                                    Row {error.row}, {error.field}: {error.message}
                                </li>
                            ))}
                            {errors.length > 10 && (
                                <li className="text-sm font-semibold">
                                    ... and {errors.length - 10} more error(s)
                                </li>
                            )}
                        </ul>
                    </AlertDescription>
                </Alert>
            )}

            {uploadSummary && (
                <Alert variant={uploadSummary.failed > 0 ? "default" : "default"}>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                        <div className="font-semibold">Upload Summary:</div>
                        <div className="text-sm mt-1">
                            <div className="text-green-600">✓ {uploadSummary.success} question(s) uploaded successfully</div>
                            {uploadSummary.failed > 0 && (
                                <div className="text-red-600">✗ {uploadSummary.failed} question(s) failed</div>
                            )}
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            <Button
                onClick={handleUpload}
                disabled={!file || loading}
                className="w-full"
            >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Uploading..." : (
                    <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Questions
                    </>
                )}
            </Button>
        </div>
    );
}
