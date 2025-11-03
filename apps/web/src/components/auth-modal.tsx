"use client";

import { useState } from "react";
import { useAuth } from "../contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AuthModalProps {
  showCloseButton?: boolean;
}

export function AuthModal({ showCloseButton = false }: AuthModalProps) {
  const { user, isLoading, login } = useAuth();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    if (!email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);

    try {
      await login(email);
      toast.success("Successfully authenticated!");
      // Reload the page after successful login
      window.location.reload();
    } catch (error) {
      toast.error("Authentication failed. Please try again.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't show modal if user is authenticated or still loading
  if (user || isLoading) {
    return null;
  }

  return (
    <Dialog open={true} onOpenChange={() => { }}>
      <DialogContent className="w-[95vw] sm:max-w-md" hideClose={!showCloseButton}>
        <DialogHeader className="px-3 sm:px-4 ">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            Welcome!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-1 px-3 sm:px-4 pb-3 sm:pb-4">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Please enter your email address to continue.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 mt-5">
            <div className="space-y-3">
              <Label htmlFor="email" className="text-xs sm:text-sm tracking-tight">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                autoFocus
                className="text-xs sm:text-sm h-8 sm:h-9 mt-2"
              />
            </div>

            <Button
              type="submit"
              className="w-full text-xs sm:text-sm h-8 sm:h-9"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
