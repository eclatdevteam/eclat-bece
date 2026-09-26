import { useState, useRef, useEffect, useCallback } from "react";
import {
  Download,
  Copy,
  Check,
  Share2,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ShareCardConfig,
  generateSocialShareText,
  sanitizeShareNarrative,
} from "@/services/gamification/shareEngine";

interface SocialShareModalProps {
  open: boolean;
  onClose: () => void;
  config: ShareCardConfig;
}

export function SocialShareModal({ open, onClose, config }: SocialShareModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copiedImage, setCopiedImage] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 1200;
    const height = 630;
    canvas.width = width;
    canvas.height = height;

    // 1. Background Gradient
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, "#071023");
    bgGradient.addColorStop(0.5, "#0d1b33");
    bgGradient.addColorStop(1, "#071023");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Radial Glow Highlights
    const radialGlow = ctx.createRadialGradient(width / 2, 220, 20, width / 2, 220, 400);
    radialGlow.addColorStop(0, "rgba(114, 201, 237, 0.18)");
    radialGlow.addColorStop(0.5, "rgba(147, 51, 234, 0.12)");
    radialGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = radialGlow;
    ctx.fillRect(0, 0, width, height);

    // Border Frame
    ctx.strokeStyle = "rgba(114, 201, 237, 0.35)";
    ctx.lineWidth = 4;
    ctx.strokeRect(24, 24, width - 48, height - 48);

    // Inner subtle border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1;
    ctx.strokeRect(36, 36, width - 72, height - 72);

    // 2. Header Brand
    ctx.textAlign = "center";
    ctx.fillStyle = "#72c9ed";
    ctx.font = "bold 20px 'Segoe UI', system-ui, sans-serif";
    ctx.fillText("ÉCLAT ACADEMIC EXCELLENCE", width / 2, 80);

    // 3. Student Name Tagline
    const studentName = (config.studentName || "Scholar").toUpperCase();
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 48px 'Segoe UI', system-ui, sans-serif";
    ctx.fillText(studentName, width / 2, 145);

    // 4. Centerpiece Badge / Icon Emblem
    const emblemY = 240;
    ctx.save();
    // Circular Glow
    ctx.beginPath();
    ctx.arc(width / 2, emblemY, 60, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(114, 201, 237, 0.15)";
    ctx.fill();
    ctx.strokeStyle = "rgba(244, 210, 31, 0.6)";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Emblem Emoji or Icon text
    const icon = config.badgeIcon || config.leagueBadge || "🏆";
    ctx.font = "60px 'Segoe UI Emoji', sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillText(icon, width / 2, emblemY + 4);
    ctx.restore();

    // 5. Headline / Achievement Title
    const title = config.headline || config.badgeTitle || "ACADEMIC MILESTONE";
    ctx.fillStyle = "#f4d21f";
    ctx.font = "bold 32px 'Segoe UI', system-ui, sans-serif";
    ctx.fillText(title.toUpperCase(), width / 2, 360);

    // 6. Narrative Copy (Word Wrapped & Sanitized for Privacy)
    const sanitized = sanitizeShareNarrative(config.narrative);
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "normal 22px 'Segoe UI', system-ui, sans-serif";

    const wrapText = (text: string, maxWidth: number) => {
      const words = text.split(" ");
      const lines: string[] = [];
      let currentLine = words[0];

      for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const measure = ctx.measureText(currentLine + " " + word);
        if (measure.width < maxWidth) {
          currentLine += " " + word;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      lines.push(currentLine);
      return lines;
    };

    const lines = wrapText(`"${sanitized}"`, 800);
    lines.forEach((line, idx) => {
      ctx.fillText(line, width / 2, 420 + idx * 32);
    });

    // 7. Footer Bar
    ctx.fillStyle = "#64748b";
    ctx.font = "bold 16px 'Segoe UI', system-ui, sans-serif";
    ctx.fillText(
      "BECE & Common Entrance Mastery Platform • eclat-bece.com",
      width / 2,
      height - 60
    );

    try {
      setDataUrl(canvas.toDataURL("image/png"));
    } catch (e) {
      console.warn("Could not extract data URL from canvas:", e);
    }
  }, [config]);

  useEffect(() => {
    if (open) {
      setTimeout(renderCanvas, 100);
    }
  }, [open, renderCanvas]);

  const { whatsAppText, twitterText } = generateSocialShareText(config);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `eclat-${config.type}-achievement.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
    toast.success("Achievement card downloaded! 🎉");
  };

  const handleCopyImage = async () => {
    if (!canvasRef.current) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        if (navigator.clipboard && (window as any).ClipboardItem) {
          const item = new (window as any).ClipboardItem({ "image/png": blob });
          await navigator.clipboard.write([item]);
          setCopiedImage(true);
          toast.success("Achievement card copied to clipboard!");
          setTimeout(() => setCopiedImage(false), 2500);
        } else {
          handleDownload();
        }
      });
    } catch (err) {
      console.warn("ClipboardItem write failed, downloading instead:", err);
      handleDownload();
    }
  };

  const handleShareWhatsApp = () => {
    const encoded = encodeURIComponent(whatsAppText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, "_blank");
  };

  const handleShareTwitter = () => {
    const encoded = encodeURIComponent(twitterText);
    window.open(`https://twitter.com/intent/tweet?text=${encoded}`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-5 sm:p-6 bg-[#071023] border border-border/80 text-white rounded-2xl shadow-2xl">
        <DialogHeader className="text-left">
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/20 text-primary border border-primary/30">
              <Sparkles size={14} />
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-primary">
              Social Achievement Card
            </span>
          </div>
          <DialogTitle className="text-xl font-bold">
            Share Your Triumph
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-400">
            Export a high-resolution branded card formatted for WhatsApp status, Instagram, or direct messaging.
          </DialogDescription>
        </DialogHeader>

        {/* Live Canvas Preview */}
        <div className="relative rounded-xl overflow-hidden border border-border/60 bg-black/40 shadow-inner my-2 aspect-[1200/630] flex items-center justify-center">
          <canvas
            ref={canvasRef}
            className="w-full h-full object-contain"
          />
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Download */}
            <Button
              onClick={handleDownload}
              variant="outline"
              size="sm"
              className="border-[#2b3a54] bg-[#0e192b] text-white hover:bg-[#162744] text-xs h-9 gap-1.5 font-semibold"
            >
              <Download className="w-3.5 h-3.5 text-primary" />
              Download
            </Button>

            {/* Copy Image */}
            <Button
              onClick={handleCopyImage}
              variant="outline"
              size="sm"
              className="border-[#2b3a54] bg-[#0e192b] text-white hover:bg-[#162744] text-xs h-9 gap-1.5 font-semibold"
            >
              {copiedImage ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-sky-400" />}
              {copiedImage ? "Copied!" : "Copy Card"}
            </Button>

            {/* WhatsApp */}
            <Button
              onClick={handleShareWhatsApp}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-9 gap-1.5 font-semibold shadow-sm"
            >
              <Share2 className="w-3.5 h-3.5" />
              WhatsApp
            </Button>

            {/* Twitter / X */}
            <Button
              onClick={handleShareTwitter}
              size="sm"
              className="bg-slate-800 hover:bg-slate-700 text-white text-xs h-9 gap-1.5 font-semibold border border-slate-700 shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              X / Twitter
            </Button>
          </div>

          <p className="text-[11px] text-slate-500 text-center">
            Privacy protected: Sensitive scores and individual answers are automatically omitted from public share cards.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
