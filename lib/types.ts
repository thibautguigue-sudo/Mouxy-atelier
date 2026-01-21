// Types pour l'application atelier nom de liste

export type Phase = 'lobby' | 'phase1' | 'phase2' | 'vote1' | 'vote2' | 'done';

export type WordTag = 'Rassembler' | 'Apaiser' | 'Dynamiser' | 'Proximité' | 'Autre';

export const WORD_TAGS: WordTag[] = ['Rassembler', 'Apaiser', 'Dynamiser', 'Proximité', 'Autre'];

export type FormType = 
  | 'ensemble' // Ensemble/Unis/Réunis pour X
  | 'commun'   // X en commun / X, le lien
  | 'mouvement' // X en mouvement / Élan pour X
  | 'identite'  // Les Moussards pour X
  | 'appel';    // Interjection/appel

export const FORM_TYPES: { value: FormType; label: string; examples: string }[] = [
  { value: 'ensemble', label: 'Ensemble / Unis / Réunis', examples: 'Ex: "Ensemble pour Mouxy", "Unis pour demain"' },
  { value: 'commun', label: 'Mouxy + commun / lien', examples: 'Ex: "Mouxy en commun", "Mouxy, le lien"' },
  { value: 'mouvement', label: 'Mouxy + mouvement / élan', examples: 'Ex: "Mouxy en mouvement", "Élan pour Mouxy"' },
  { value: 'identite', label: 'Identité / Gentilé', examples: 'Ex: "Les Moussards pour Mouxy", "Fierté Moussarde"' },
  { value: 'appel', label: 'Interjection / Appel', examples: 'Ex: "Osons Mouxy !", "Demain Mouxy"' },
];

export interface Word {
  word: string;
  tag: WordTag;
  count: number;
}

export interface Proposal {
  id: string;
  name: string;
  justification: string;
  subtitle?: string;
  groupId: number;
  form: FormType;
  participantId: string;
  createdAt: number;
  // Champs ajoutés par l'admin
  mergedInto?: string; // ID de la proposition dans laquelle elle a été fusionnée
  isShortlisted?: boolean;
}

export interface ShortlistItem {
  id: string;
  name: string;
  justification: string;
  subtitle?: string;
  groupId: number;
  form: FormType;
  votesR1?: number;
  votesR2?: number;
  // Champs finaux
  finalSubtitle?: string;
  risk?: string;
}

export interface Session {
  code: string;
  adminKey: string;
  phase: Phase;
  createdAt: number;
  gentile: string; // "Moussards"
  communeName: string; // "Mouxy"
}

export interface VoteResult {
  proposalId: string;
  count: number;
}

export interface Participant {
  id: string;
  name: string;
  groupId?: number;
  joinedAt: number;
}

// Redis keys helper
export const getRedisKeys = (sessionCode: string) => ({
  session: `session:${sessionCode}:info`,
  phase: `session:${sessionCode}:phase`,
  words: `session:${sessionCode}:words`,
  proposals: `session:${sessionCode}:proposals`,
  shortlist: `session:${sessionCode}:shortlist`,
  votesR1: `session:${sessionCode}:votes:r1`,
  votesR2: `session:${sessionCode}:votes:r2`,
  votersR1: `session:${sessionCode}:voters:r1`,
  votersR2: `session:${sessionCode}:voters:r2`,
  participants: `session:${sessionCode}:participants`,
  finalResults: `session:${sessionCode}:final`,
});

export interface FinalResults {
  top1: ShortlistItem;
  alt1: ShortlistItem;
  alt2: ShortlistItem;
  wordsCloud: Word[];
  allProposals: Proposal[];
  sessionInfo: Session;
  completedAt: number;
}
