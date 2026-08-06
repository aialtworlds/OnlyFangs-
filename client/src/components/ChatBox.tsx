import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2, Lock, X } from 'lucide-react';

interface ChatBoxProps {
  onSendMessage: (
    content: string,
    price?: number,
    mediaUrl?: string,
    mediaType?: "image" | "photo" | "music" | "video" | "book"
  ) => Promise<void>;
  onTyping?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  isCreator?: boolean; // If true, shows PPV option
}

export function ChatBox({ onSendMessage, onTyping, disabled = false, isLoading = false, isCreator = false }: ChatBoxProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showPPVPanel, setShowPPVPanel] = useState(false);
  
  // PPV states
  const [price, setPrice] = useState<string>('');
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [mediaType, setMediaType] = useState<"image" | "photo" | "music" | "video" | "book">('image');

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Send typing indicator
    onTyping?.();
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleSend = async () => {
    if (!message.trim() || isSending || disabled) return;

    setIsSending(true);
    try {
      const parsedPrice = price ? parseFloat(price) : undefined;
      const finalMediaUrl = mediaUrl.trim() || undefined;
      
      await onSendMessage(
        message.trim(),
        parsedPrice,
        finalMediaUrl,
        finalMediaUrl ? mediaType : undefined
      );
      
      setMessage('');
      setPrice('');
      setMediaUrl('');
      setShowPPVPanel(false);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-border bg-background p-4 space-y-3">
      {/* PPV Panel */}
      {showPPVPanel && isCreator && (
        <div className="p-3 border border-yellow-500/30 rounded-md bg-yellow-500/5 space-y-3 animate-modal-reveal">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-yellow-500 flex items-center gap-1">
              <Lock size={12} /> Pay-Per-View Attachment Setup
            </span>
            <Button
              onClick={() => setShowPPVPanel(false)}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-yellow-500/10 text-muted-foreground"
            >
              <X size={14} />
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground block mb-1">Price (USD)</label>
              <input
                type="number"
                placeholder="e.g. 15.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full text-xs p-2 bg-black/40 border border-border rounded-md text-foreground focus:outline-none focus:border-yellow-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground block mb-1">Attachment URL</label>
              <input
                type="text"
                placeholder="https://..."
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                className="w-full text-xs p-2 bg-black/40 border border-border rounded-md text-foreground focus:outline-none focus:border-yellow-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground block mb-1">Type</label>
              <select
                value={mediaType}
                onChange={(e) => setMediaType(e.target.value as any)}
                className="w-full text-xs p-2 bg-black/40 border border-border rounded-md text-foreground focus:outline-none focus:border-yellow-500"
              >
                <option value="image">Image</option>
                <option value="photo">Photo</option>
                <option value="music">Music</option>
                <option value="video">Video</option>
                <option value="book">Book/PDF</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <Textarea
        placeholder="Type a message... (Shift+Enter for new line)"
        value={message}
        onChange={handleTyping}
        onKeyDown={handleKeyDown}
        disabled={disabled || isSending || isLoading}
        className="resize-none min-h-[80px] max-h-[200px]"
      />
      <div className="flex justify-between items-center">
        {/* Creator Tools */}
        {isCreator ? (
          <Button
            onClick={() => setShowPPVPanel(!showPPVPanel)}
            variant="outline"
            size="sm"
            className={`gap-1.5 ${showPPVPanel ? 'border-yellow-500 text-yellow-500 bg-yellow-500/10' : ''}`}
          >
            <Lock size={14} />
            PPV Anexo
          </Button>
        ) : (
          <div />
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleSend}
            disabled={!message.trim() || isSending || disabled || isLoading}
            className="gap-2"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
