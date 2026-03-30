import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useApiKey } from "@/hooks/use-api-key";

interface ApiKeyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApiKeyModal({ open, onOpenChange }: ApiKeyModalProps) {
  const { apiKey, setApiKey } = useApiKey();
  const [inputValue, setInputValue] = useState(apiKey || "");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!inputValue.trim()) {
      toast({
        variant: "destructive",
        title: "API Key Required",
        description: "Please enter your DeepSeek API key.",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Validate the API key
      const token = localStorage.getItem("authToken");
      const response = await fetch('/api/validate-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ apiKey: inputValue }),
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          // Redirect to login if unauthorized
          localStorage.removeItem("authToken");
          window.location.href = "/";
          return;
        }
        throw new Error('Failed to validate API key');
      }
      
      const data = await response.json();
      
      if (data.valid) {
        setApiKey(inputValue);
        onOpenChange(false);
        toast({
          title: "API Key Saved",
          description: "Your DeepSeek API key has been saved successfully.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Invalid API Key",
          description: data.error || "The provided API key is invalid. Please check and try again.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Validation Failed",
        description: "Failed to validate API key. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setApiKey(null);
    setInputValue("");
    toast({
      title: "API Key Cleared",
      description: "Your API key has been removed.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>DeepSeek API Key</DialogTitle>
          <DialogDescription>
            Enter your DeepSeek API key to enable AI-powered data analysis.
            You can get one from{" "}
            <a 
              href="https://platform.deepseek.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              DeepSeek Platform
            </a>
            .
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="api-key">API Key</Label>
            <Input
              id="api-key"
              type="password"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClear}>
            Clear
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Validating..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}