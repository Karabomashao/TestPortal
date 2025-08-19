import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { QuestionFormData } from "@/lib/types";

interface QuestionFormProps {
  question: QuestionFormData;
  onChange: (question: QuestionFormData) => void;
}

export default function QuestionForm({ question, onChange }: QuestionFormProps) {
  const updateQuestion = (field: keyof QuestionFormData, value: any) => {
    onChange({ ...question, [field]: value });
  };

  const updateOption = (option: keyof QuestionFormData['options'], value: string) => {
    onChange({
      ...question,
      options: { ...question.options, [option]: value }
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium text-gray-700 mb-2">Question Text</Label>
        <Textarea
          placeholder="Enter your question here"
          rows={2}
          value={question.questionText}
          onChange={(e) => updateQuestion('questionText', e.target.value)}
          className="w-full"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2">Option A</Label>
          <Input
            placeholder="First option"
            value={question.options.a}
            onChange={(e) => updateOption('a', e.target.value)}
          />
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2">Option B</Label>
          <Input
            placeholder="Second option"
            value={question.options.b}
            onChange={(e) => updateOption('b', e.target.value)}
          />
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2">Option C</Label>
          <Input
            placeholder="Third option (optional)"
            value={question.options.c || ""}
            onChange={(e) => updateOption('c', e.target.value)}
          />
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2">Option D</Label>
          <Input
            placeholder="Fourth option (optional)"
            value={question.options.d || ""}
            onChange={(e) => updateOption('d', e.target.value)}
          />
        </div>
      </div>
      
      <div className="w-full md:w-48">
        <Label className="text-sm font-medium text-gray-700 mb-2">Correct Answer</Label>
        <Select value={question.correctAnswer} onValueChange={(value) => updateQuestion('correctAnswer', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select correct answer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
            <SelectItem value="b">Option B</SelectItem>
            {question.options.c && <SelectItem value="c">Option C</SelectItem>}
            {question.options.d && <SelectItem value="d">Option D</SelectItem>}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
