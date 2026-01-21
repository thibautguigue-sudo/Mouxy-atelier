import { v4 as uuidv4 } from 'uuid';

// Génère un code de session (6 caractères alphanumériques)
export function generateSessionCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sans I, O, 0, 1 pour éviter confusion
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Génère un ID participant
export function generateParticipantId(): string {
  return uuidv4();
}

// Génère une clé admin
export function generateAdminKey(): string {
  return uuidv4().slice(0, 8);
}

// Génère un ID de proposition
export function generateProposalId(): string {
  return `prop_${uuidv4().slice(0, 8)}`;
}

// Valide un mot (pas vide, longueur raisonnable)
export function validateWord(word: string): { valid: boolean; error?: string } {
  const trimmed = word.trim();
  if (!trimmed) {
    return { valid: false, error: 'Le mot ne peut pas être vide' };
  }
  if (trimmed.length < 2) {
    return { valid: false, error: 'Le mot doit faire au moins 2 caractères' };
  }
  if (trimmed.length > 30) {
    return { valid: false, error: 'Le mot ne peut pas dépasser 30 caractères' };
  }
  if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(trimmed)) {
    return { valid: false, error: 'Le mot ne peut contenir que des lettres' };
  }
  return { valid: true };
}

// Valide un nom de proposition
export function validateProposalName(name: string): { valid: boolean; error?: string } {
  const trimmed = name.trim();
  if (!trimmed) {
    return { valid: false, error: 'Le nom ne peut pas être vide' };
  }
  if (trimmed.length < 3) {
    return { valid: false, error: 'Le nom doit faire au moins 3 caractères' };
  }
  if (trimmed.length > 60) {
    return { valid: false, error: 'Le nom ne peut pas dépasser 60 caractères' };
  }
  return { valid: true };
}

// Valide une justification
export function validateJustification(text: string): { valid: boolean; error?: string } {
  const trimmed = text.trim();
  if (!trimmed) {
    return { valid: false, error: 'La justification est obligatoire' };
  }
  if (trimmed.length > 140) {
    return { valid: false, error: 'La justification ne peut pas dépasser 140 caractères' };
  }
  return { valid: true };
}

// Formate une date
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Stockage local du participant ID
export const PARTICIPANT_STORAGE_KEY = 'muxila_participant_id';
export const PARTICIPANT_NAME_KEY = 'muxila_participant_name';
export const SESSION_CODE_KEY = 'muxila_session_code';

// Helper pour le localStorage côté client
export function getStoredParticipantId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(PARTICIPANT_STORAGE_KEY);
}

export function setStoredParticipantId(id: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PARTICIPANT_STORAGE_KEY, id);
}

export function getStoredParticipantName(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(PARTICIPANT_NAME_KEY);
}

export function setStoredParticipantName(name: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PARTICIPANT_NAME_KEY, name);
}

export function getStoredSessionCode(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SESSION_CODE_KEY);
}

export function setStoredSessionCode(code: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_CODE_KEY, code);
}

// Couleurs pour les tags
export const TAG_COLORS: Record<string, string> = {
  'Rassembler': 'bg-blue-100 text-blue-800 border-blue-300',
  'Apaiser': 'bg-green-100 text-green-800 border-green-300',
  'Dynamiser': 'bg-orange-100 text-orange-800 border-orange-300',
  'Proximité': 'bg-purple-100 text-purple-800 border-purple-300',
  'Autre': 'bg-gray-100 text-gray-800 border-gray-300',
};

// Couleurs pour les formes
export const FORM_COLORS: Record<string, string> = {
  'ensemble': 'bg-blue-50 border-blue-400',
  'commun': 'bg-green-50 border-green-400',
  'mouvement': 'bg-orange-50 border-orange-400',
  'identite': 'bg-purple-50 border-purple-400',
  'appel': 'bg-pink-50 border-pink-400',
};

// Noms des groupes
export const GROUP_NAMES: Record<number, string> = {
  1: 'Groupe 1',
  2: 'Groupe 2',
  3: 'Groupe 3',
  4: 'Groupe 4',
  5: 'Groupe 5',
};

// Instructions par phase
export const PHASE_INSTRUCTIONS: Record<string, { title: string; instruction: string }> = {
  'lobby': {
    title: '⏳ En attente',
    instruction: "L'atelier va bientôt commencer. Patientez..."
  },
  'phase1': {
    title: '💭 Phase 1 : Brainstorm',
    instruction: 'Proposez des mots qui représentent votre vision pour la commune.'
  },
  'phase2': {
    title: '✍️ Phase 2 : Propositions',
    instruction: 'Proposez des noms de liste en choisissant une forme.'
  },
  'vote1': {
    title: '🗳️ Vote Tour 1',
    instruction: 'Votez pour vos 3 noms préférés.'
  },
  'vote2': {
    title: '🗳️ Vote Tour 2',
    instruction: 'Votez pour votre nom préféré parmi le Top 3.'
  },
  'done': {
    title: '✅ Terminé',
    instruction: 'Merci pour votre participation !'
  },
};
