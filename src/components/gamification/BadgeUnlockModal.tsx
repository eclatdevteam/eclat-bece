import { useState } from "react";
import { Sparkles, Trophy, Share2, Check, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BadgeDefinition, BadgeRarity } from "@/services/gamification/badgeEngine";
import { toast } from "sonner";

interface BadgeUnlockModalProps {
  badges: BadgeDefinition[];
  open: boolean;
  onClose: () => void;
}

const RARITY_STYLES: Record<
  BadgeRarity,
  {
    border: string;
    bg: string;
    text: string;
    badgeVariant: string;
    glow: string;
  }
> = {
  common: {
    border: "border-slate-400 dark:border-slate-600",
    bg: "from-slate-500/10 via-slate-500/5 to-transparent",
    text: "text-slate-700 dark:text-slate-300",
    badgeVariant: "secondary",
    glow: "shadow-slate-500/20",
  },
  uncommon: {
    border: "border-emerald-500",
    bg: "from-emerald-500/15 via-emerald-500/5 to-transparent",
    text: "text-emerald-500",
    badgeVariant: "default",
    glow: "shadow-emerald-500/30",
  },
  rare: {
    border: "border-blue-500",
    bg: "from-blue-500/15 via-blue-500/5 to-transparent",
    text: "text-blue-500",
    badgeVariant: "default",
    glow: "shadow-blue-500/30",
  },
  epic: {
    border: "border-purple-500",
    bg: "from-purple-500/20 via-purple-500/5 to-transparent",
    text: "text-purple-500",
    badgeVariant: "default",
    glow: "shadow-purple-500/40",
  },
  legendary: {
    border: "border-amber-400",
    bg: "from-amber-400/25 via-amber-400/10 to-transparent",
    text: "text-amber-500",
    badgeVariant: "default",
    glow: "shadow-amber-400/50",
  },
  mythic: {
    border: "border-cyan-400",
    bg: "from-cyan-400/25 via-fuchsia-500/20 to-transparent",
    text: "text-cyan-400",
    badgeVariant: "default",
    glow: "shadow-cyan-400/50",
  },
};

export function BadgeUnlockModal({ badges, open, onClose }: BadgeUnlockModalProps) {
  const [copied, setCopied] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!badges || badges.length === 0) return null;

  const currentBadge = badges[currentIndex] || badges[0];
  const style = RARITY_STYLES[currentBadge.rarity] || RARITY_STYLES.common;

  const handleShare = () => {
    const text = `🏆 I just unlocked the "${currentBadge.title}" badge on Éclat! ${currentBadge.celebrationCopy} (+${currentBadge.rewardEP} EP)`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Achievement copied to clipboard! Share with your friends.");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNext = () => {
    if (currentIndex < badges.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-6 text-center border-2 rounded-3xl shadow-2xl animate-scale-in">
        <DialogHeader className="items-center">
          <Badge
            className={`capitalize font-black tracking-wider text-xs px-3 py-1 mb-2 ${style.text} border ${style.border}`}
            variant="outline"
          >
            {currentBadge.rarity} Achievement
          </Badge>
          <DialogTitle className="text-2xl font-black tracking-tight text-foreground flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Badge Unlocked! 🎉
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {badges.length > 1 && `(${currentIndex + 1} of ${badges.length})`}
          </DialogDescription>
        </DialogHeader>

        {/* Badge Presentation Card */}
        <div
          className={`my-5 p-6 rounded-2xl border-2 bg-gradient-to-b ${style.bg} ${style.border} ${style.glow} flex flex-col items-center justify-center gap-3`}
        >
          <div className="w-20 h-20 rounded-full flex items-center justify-center bg-background/80 border-2 border-border shadow-inner text-4xl animate-bounce">
            {currentBadge.icon}
          </div>

          <div>
            <h4 className="text-xl font-black text-foreground">{currentBadge.title}</h4>
            <p className="text-xs text-muted-foreground mt-0.5">{currentBadge.category}</p>
          </div>

          {/* Narrative copy */}
          <p className="text-sm font-semibold text-foreground/90 max-w-xs px-2 italic">
            "{currentBadge.celebrationCopy}"
          </p>

          <Badge className="bg-primary/20 text-primary border-primary/30 font-black text-xs px-3 py-1 mt-1">
            +{currentBadge.rewardEP} Éclat Points
          </Badge>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={handleShare}
            className="flex items-center gap-1.5 font-bold"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
            {copied ? "Copied!" : "Share Achievement"}
          </Button>

          <Button type="button" onClick={handleNext} className="font-bold px-6">
            {currentIndex < badges.length - 1 ? "Next Badge →" : "Awesome! ✨"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
