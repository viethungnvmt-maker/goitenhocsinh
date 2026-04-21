export interface GameProps {
  students: string[];
  onWinner: (winner: string) => void;
  onClose: () => void;
}
