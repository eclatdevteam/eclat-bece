import { useState } from "react";
import { Sparkles, Trophy, Share2, Check, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BadgeDefinition, BadgeRarity } from "@/services/gamification/badgeEngine";
import { SocialShareModal } from "@/components/gamification/SocialShareModal";
import { useAuth } from "@/hooks/useAuth";

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
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  if (!badges || badges.length === 0) return null;

  const currentBadge = badges[currentIndex] || badges[0];
  const style = RARITY_STYLES[currentBadge.rarity] || RARITY_STYLES.common;

  const handleNext = () => {
    if (currentIndex < badges.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  };

  return (
    <>
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

          {/* Badge Icon Emblem */}
          <div className="py-5 flex justify-center">
            <div
              className={`relative w-28 h-28 rounded-3xl border-2 flex items-center justify-center text-5xl bg-gradient-to-br ${style.bg} ${style.border} ${style.glow} shadow-xl transition-transform hover:scale-105`}
            >
              <span>{currentBadge.icon}</span>
              <div className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-primary"></span>
              </div>
            </div>
          </div>

          {/* Title & Celebration narrative */}
          <div className="space-y-2 mb-6">
            <h3 className="text-xl font-black text-foreground">
              {currentBadge.title}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
              {currentBadge.celebrationCopy}
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
              onClick={() => setShareModalOpen(true)}
              className="flex items-center gap-1.5 font-bold"
            >
              <Share2 className="w-4 h-4" />
              Share Achievement
            </Button>

            <Button type="button" onClick={handleNext} className="font-bold px-6">
              {currentIndex < badges.length - 1 ? "Next Badge →" : "Awesome! ✨"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Branded Social Share Card Generator */}
      <SocialShareModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        config={{
          type: "badge",
          studentName: user?.user_metadata?.full_name || "Scholar",
          badgeTitle: currentBadge.title,
          badgeIcon: currentBadge.icon,
          badgeRarity: currentBadge.rarity,
          headline: `${currentBadge.title} Unlocked`,
          narrative: currentBadge.celebrationCopy,
          rewardEP: currentBadge.rewardEP,
        }}
      />
    </>
  );
}
