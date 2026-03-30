import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "login" | "signup";
  onModeChange?: (mode: "login" | "signup") => void;
}

export function AuthDialog({ open, onOpenChange, mode, onModeChange }: AuthDialogProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        if (mode === "login") {
          // Store the token in localStorage
          localStorage.setItem("authToken", data.token);
          // Close the dialog and redirect to app
          onOpenChange(false);
          setLocation("/app");
          toast({
            title: "Login successful",
            description: "Welcome back! Redirecting to your dashboard.",
          });
        } else {
          // For signup, show success message and optionally switch to login
          toast({
            title: "Account created",
            description: "Your account has been created successfully.",
          });
          // Optionally switch to login mode
          if (onModeChange) {
            onModeChange("login");
          } else {
            onOpenChange(false);
          }
        }
      } else {
        // Provide more specific error messages
        let description = data.message || "Please check your credentials and try again.";
        
        // Handle specific error cases
        if (data.message && data.message.includes("email")) {
          description = "This email is already registered. Please use a different email or try logging in.";
        } else if (data.message && data.message.includes("Username")) {
          description = "This username is already taken. Please choose a different username.";
        } else if (data.message && data.message.includes("Password")) {
          description = "Password does not meet requirements. It must be at least 6 characters long.";
        }
        
        toast({
          title: "Authentication failed",
          description,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{mode === "login" ? "Sign In" : "Create Account"}</DialogTitle>
          <DialogDescription>
            {mode === "login" 
              ? "Enter your credentials to access your account" 
              : "Create an account to get started with Lumina"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              disabled={isLoading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading 
              ? "Processing..." 
              : mode === "login" 
                ? "Sign In" 
                : "Create Account"}
          </Button>
        </form>
        <div className="text-center text-sm text-muted-foreground">
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={() => {
              if (onModeChange) {
                onModeChange(mode === "login" ? "signup" : "login");
              } else {
                onOpenChange(false);
              }
            }}
          >
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}