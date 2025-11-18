import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trophy, Medal, Award, X } from "lucide-react";

interface LeaderboardEntry {
  id: string;
  player_name: string;
  score: number;
  created_at: string;
}

interface LeaderboardProps {
  currentScore?: number;
  onClose: () => void;
}

export const Leaderboard = ({ currentScore, onClose }: LeaderboardProps) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [showSubmit, setShowSubmit] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('leaderboard-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leaderboard' },
        () => {
          fetchLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    // Check if current score qualifies for leaderboard
    if (currentScore !== undefined && currentScore > 0) {
      checkIfQualifies(currentScore);
    }
  }, [currentScore, entries]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .order('score', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching leaderboard:', error);
      toast.error('Failed to load leaderboard');
    } else if (data) {
      setEntries(data);
    }
    setLoading(false);
  };

  const checkIfQualifies = (score: number) => {
    const wouldQualify = entries.length < 100 || score > (entries[99]?.score || 0);
    if (wouldQualify && !showSubmit) {
      setShowSubmit(true);
    }
  };

  const submitScore = async () => {
    if (!playerName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    if (currentScore === undefined) return;

    const { error } = await supabase
      .from('leaderboard')
      .insert({
        player_name: playerName.trim(),
        score: currentScore,
      });

    if (error) {
      console.error('Error submitting score:', error);
      toast.error('Failed to submit score');
    } else {
      toast.success('Score submitted! 🎉');
      setShowSubmit(false);
      setPlayerName('');
      fetchLeaderboard();
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 1:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 2:
        return <Medal className="h-6 w-6 text-amber-600" />;
      default:
        return <Award className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getRankColor = (index: number) => {
    switch (index) {
      case 0:
        return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/50';
      case 1:
        return 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/50';
      case 2:
        return 'bg-gradient-to-r from-amber-600/20 to-amber-700/20 border-amber-600/50';
      default:
        return 'bg-card/50 border-border/30';
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-3xl font-black flex items-center gap-3">
              <Trophy className="h-8 w-8 text-primary animate-pulse" />
              Global Leaderboard
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        {showSubmit && currentScore !== undefined && (
          <Card className="p-6 bg-primary/10 border-primary/30 animate-scale-in">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              🎉 Congratulations! Enter your name:
            </h3>
            <div className="flex gap-3">
              <Input
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                maxLength={30}
                onKeyDown={(e) => e.key === 'Enter' && submitScore()}
                className="flex-1"
              />
              <Button onClick={submitScore} className="bg-primary hover:bg-primary/90">
                Submit Score ({currentScore})
              </Button>
            </div>
          </Card>
        )}

        <div className="overflow-y-auto flex-1 space-y-2 pr-2">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-4">Loading leaderboard...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-lg text-muted-foreground">No scores yet. Be the first!</p>
            </div>
          ) : (
            entries.map((entry, index) => (
              <Card
                key={entry.id}
                className={`p-4 transition-all hover:scale-[1.02] ${getRankColor(index)} border-2`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-background/50">
                    {getRankIcon(index)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-lg truncate">{entry.player_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground font-medium">Score</p>
                    <p className="text-3xl font-black text-primary">{entry.score}</p>
                  </div>
                  <div className="text-2xl font-bold text-muted-foreground/50 min-w-[3rem] text-right">
                    #{index + 1}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
