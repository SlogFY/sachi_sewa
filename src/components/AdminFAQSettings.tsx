import { useState, useEffect } from "react";
import { Loader2, Save, Plus, Trash2, GripVertical, Edit2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const AdminFAQSettings = () => {
  const { toast } = useToast();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ question: "", answer: "" });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newFaq, setNewFaq] = useState({ question: "", answer: "" });

  const fetchFaqs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("faqs")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setFaqs(data || []);
    } catch (error: any) {
      console.error("Fetch FAQs error:", error);
      toast({
        title: "Error",
        description: "Failed to fetch FAQs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const handleAddFaq = async () => {
    if (!newFaq.question.trim() || !newFaq.answer.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both question and answer",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const maxOrder = faqs.length > 0 ? Math.max(...faqs.map(f => f.display_order)) : 0;
      
      const { error } = await supabase.from("faqs").insert({
        question: newFaq.question.trim(),
        answer: newFaq.answer.trim(),
        display_order: maxOrder + 1,
      });

      if (error) throw error;

      toast({
        title: "FAQ Added",
        description: "New FAQ has been added successfully.",
      });
      
      setNewFaq({ question: "", answer: "" });
      setIsAddDialogOpen(false);
      fetchFaqs();
    } catch (error: any) {
      console.error("Add FAQ error:", error);
      toast({
        title: "Error",
        description: "Failed to add FAQ",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateFaq = async (id: string) => {
    if (!editForm.question.trim() || !editForm.answer.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both question and answer",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("faqs")
        .update({
          question: editForm.question.trim(),
          answer: editForm.answer.trim(),
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "FAQ Updated",
        description: "FAQ has been updated successfully.",
      });
      
      setEditingId(null);
      fetchFaqs();
    } catch (error: any) {
      console.error("Update FAQ error:", error);
      toast({
        title: "Error",
        description: "Failed to update FAQ",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) return;

    try {
      const { error } = await supabase.from("faqs").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "FAQ Deleted",
        description: "FAQ has been deleted successfully.",
      });
      
      fetchFaqs();
    } catch (error: any) {
      console.error("Delete FAQ error:", error);
      toast({
        title: "Error",
        description: "Failed to delete FAQ",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (id: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from("faqs")
        .update({ is_active: !currentState })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: currentState ? "FAQ Hidden" : "FAQ Visible",
        description: `FAQ is now ${currentState ? "hidden from" : "visible on"} the website.`,
      });
      
      fetchFaqs();
    } catch (error: any) {
      console.error("Toggle FAQ error:", error);
      toast({
        title: "Error",
        description: "Failed to update FAQ visibility",
        variant: "destructive",
      });
    }
  };

  const startEditing = (faq: FAQ) => {
    setEditingId(faq.id);
    setEditForm({ question: faq.question, answer: faq.answer });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({ question: "", answer: "" });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground">FAQs Management</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Add, edit, or delete frequently asked questions
            </p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="primary" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add FAQ
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New FAQ</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="new-question">Question</Label>
                  <Input
                    id="new-question"
                    value={newFaq.question}
                    onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                    placeholder="Enter the question..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-answer">Answer</Label>
                  <Textarea
                    id="new-answer"
                    value={newFaq.answer}
                    onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                    placeholder="Enter the answer..."
                    rows={4}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={handleAddFaq} disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Add FAQ
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {faqs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No FAQs added yet. Click "Add FAQ" to create your first one.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={faq.id}
                className={`border border-border rounded-lg p-4 ${
                  !faq.is_active ? "opacity-60 bg-muted/30" : "bg-background"
                }`}
              >
                {editingId === faq.id ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Question</Label>
                      <Input
                        value={editForm.question}
                        onChange={(e) => setEditForm({ ...editForm, question: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Answer</Label>
                      <Textarea
                        value={editForm.answer}
                        onChange={(e) => setEditForm({ ...editForm, answer: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={cancelEditing}>
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleUpdateFaq(faq.id)}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4 mr-1" />
                        )}
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="flex items-center gap-2 text-muted-foreground mt-1">
                          <GripVertical className="w-4 h-4" />
                          <span className="text-xs font-medium w-5">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground mb-2">{faq.question}</h4>
                          <p className="text-sm text-muted-foreground">{faq.answer}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {faq.is_active ? "Visible" : "Hidden"}
                          </span>
                          <Switch
                            checked={faq.is_active}
                            onCheckedChange={() => handleToggleActive(faq.id, faq.is_active)}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => startEditing(faq)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteFaq(faq.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminFAQSettings;
