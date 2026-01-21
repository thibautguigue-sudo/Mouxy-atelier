import { Redis } from '@upstash/redis';
import { 
  Session, Phase, Word, Proposal, ShortlistItem, 
  getRedisKeys, WordTag, FinalResults, Participant 
} from './types';

// Client Redis Upstash
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// TTL par défaut : 8 heures
const DEFAULT_TTL = parseInt(process.env.SESSION_TTL_SECONDS || '28800');

// ============ SESSION ============

export async function createSession(
  code: string, 
  adminKey: string,
  gentile: string = 'Moussards',
  communeName: string = 'Mouxy'
): Promise<Session> {
  const keys = getRedisKeys(code);
  const session: Session = {
    code,
    adminKey,
    phase: 'lobby',
    createdAt: Date.now(),
    gentile,
    communeName,
  };
  
  await redis.set(keys.session, JSON.stringify(session), { ex: DEFAULT_TTL });
  await redis.set(keys.phase, 'lobby', { ex: DEFAULT_TTL });
  
  return session;
}

export async function getSession(code: string): Promise<Session | null> {
  const keys = getRedisKeys(code);
  const data = await redis.get(keys.session);
  if (!data) return null;
  return typeof data === 'string' ? JSON.parse(data) : data as Session;
}

export async function sessionExists(code: string): Promise<boolean> {
  const keys = getRedisKeys(code);
  const exists = await redis.exists(keys.session);
  return exists === 1;
}

export async function getPhase(code: string): Promise<Phase> {
  const keys = getRedisKeys(code);
  const phase = await redis.get(keys.phase);
  return (phase as Phase) || 'lobby';
}

export async function setPhase(code: string, phase: Phase): Promise<void> {
  const keys = getRedisKeys(code);
  await redis.set(keys.phase, phase, { ex: DEFAULT_TTL });
  
  // Mettre à jour aussi dans session info
  const session = await getSession(code);
  if (session) {
    session.phase = phase;
    await redis.set(keys.session, JSON.stringify(session), { ex: DEFAULT_TTL });
  }
}

// ============ PARTICIPANTS ============

export async function addParticipant(
  code: string, 
  participant: Participant
): Promise<void> {
  const keys = getRedisKeys(code);
  await redis.hset(keys.participants, { [participant.id]: JSON.stringify(participant) });
  await redis.expire(keys.participants, DEFAULT_TTL);
}

export async function getParticipants(code: string): Promise<Participant[]> {
  const keys = getRedisKeys(code);
  const data = await redis.hgetall(keys.participants);
  if (!data) return [];
  return Object.values(data).map(v => 
    typeof v === 'string' ? JSON.parse(v) : v as Participant
  );
}

// ============ WORDS (Phase 1) ============

export async function addWord(
  code: string, 
  word: string, 
  tag: WordTag
): Promise<number> {
  const keys = getRedisKeys(code);
  const field = `${tag}:${word.toLowerCase().trim()}`;
  const newCount = await redis.hincrby(keys.words, field, 1);
  await redis.expire(keys.words, DEFAULT_TTL);
  return newCount;
}

export async function getWords(code: string): Promise<Word[]> {
  const keys = getRedisKeys(code);
  const data = await redis.hgetall(keys.words);
  if (!data) return [];
  
  const words: Word[] = [];
  for (const [field, count] of Object.entries(data)) {
    const [tag, ...wordParts] = field.split(':');
    words.push({
      word: wordParts.join(':'),
      tag: tag as WordTag,
      count: typeof count === 'number' ? count : parseInt(count as string, 10),
    });
  }
  
  return words.sort((a, b) => b.count - a.count);
}

export async function getWordsByTag(code: string, tag: WordTag): Promise<Word[]> {
  const allWords = await getWords(code);
  return allWords.filter(w => w.tag === tag);
}

// ============ PROPOSALS (Phase 2) ============

export async function addProposal(code: string, proposal: Proposal): Promise<void> {
  const keys = getRedisKeys(code);
  await redis.rpush(keys.proposals, JSON.stringify(proposal));
  await redis.expire(keys.proposals, DEFAULT_TTL);
}

export async function getProposals(code: string): Promise<Proposal[]> {
  const keys = getRedisKeys(code);
  const data = await redis.lrange(keys.proposals, 0, -1);
  if (!data) return [];
  return data.map(item => 
    typeof item === 'string' ? JSON.parse(item) : item as Proposal
  );
}

export async function updateProposal(
  code: string, 
  proposalId: string, 
  updates: Partial<Proposal>
): Promise<void> {
  const proposals = await getProposals(code);
  const keys = getRedisKeys(code);
  
  const updatedProposals = proposals.map(p => 
    p.id === proposalId ? { ...p, ...updates } : p
  );
  
  // Remplacer toute la liste
  await redis.del(keys.proposals);
  for (const p of updatedProposals) {
    await redis.rpush(keys.proposals, JSON.stringify(p));
  }
  await redis.expire(keys.proposals, DEFAULT_TTL);
}

// ============ SHORTLIST ============

export async function setShortlist(code: string, items: ShortlistItem[]): Promise<void> {
  const keys = getRedisKeys(code);
  await redis.del(keys.shortlist);
  for (const item of items) {
    await redis.rpush(keys.shortlist, JSON.stringify(item));
  }
  await redis.expire(keys.shortlist, DEFAULT_TTL);
}

export async function getShortlist(code: string): Promise<ShortlistItem[]> {
  const keys = getRedisKeys(code);
  const data = await redis.lrange(keys.shortlist, 0, -1);
  if (!data) return [];
  return data.map(item => 
    typeof item === 'string' ? JSON.parse(item) : item as ShortlistItem
  );
}

export async function updateShortlistItem(
  code: string,
  itemId: string,
  updates: Partial<ShortlistItem>
): Promise<void> {
  const shortlist = await getShortlist(code);
  const updated = shortlist.map(item =>
    item.id === itemId ? { ...item, ...updates } : item
  );
  await setShortlist(code, updated);
}

// ============ VOTES ============

export async function hasVoted(
  code: string, 
  round: 1 | 2, 
  participantId: string
): Promise<boolean> {
  const keys = getRedisKeys(code);
  const votersKey = round === 1 ? keys.votersR1 : keys.votersR2;
  const isMember = await redis.sismember(votersKey, participantId);
  return isMember === 1;
}

export async function recordVote(
  code: string,
  round: 1 | 2,
  participantId: string,
  proposalIds: string[]
): Promise<boolean> {
  const keys = getRedisKeys(code);
  const votersKey = round === 1 ? keys.votersR1 : keys.votersR2;
  const votesKey = round === 1 ? keys.votesR1 : keys.votesR2;
  
  // Vérifier si déjà voté
  const alreadyVoted = await hasVoted(code, round, participantId);
  if (alreadyVoted) return false;
  
  // Enregistrer le votant
  await redis.sadd(votersKey, participantId);
  await redis.expire(votersKey, DEFAULT_TTL);
  
  // Incrémenter les votes
  for (const proposalId of proposalIds) {
    await redis.hincrby(votesKey, proposalId, 1);
  }
  await redis.expire(votesKey, DEFAULT_TTL);
  
  return true;
}

export async function getVoteResults(
  code: string, 
  round: 1 | 2
): Promise<Map<string, number>> {
  const keys = getRedisKeys(code);
  const votesKey = round === 1 ? keys.votesR1 : keys.votesR2;
  const data = await redis.hgetall(votesKey);
  
  const results = new Map<string, number>();
  if (data) {
    for (const [id, count] of Object.entries(data)) {
      results.set(id, typeof count === 'number' ? count : parseInt(count as string, 10));
    }
  }
  return results;
}

export async function getVoterCount(code: string, round: 1 | 2): Promise<number> {
  const keys = getRedisKeys(code);
  const votersKey = round === 1 ? keys.votersR1 : keys.votersR2;
  return await redis.scard(votersKey);
}

// ============ FINAL RESULTS ============

export async function setFinalResults(code: string, results: FinalResults): Promise<void> {
  const keys = getRedisKeys(code);
  await redis.set(keys.finalResults, JSON.stringify(results), { ex: DEFAULT_TTL });
}

export async function getFinalResults(code: string): Promise<FinalResults | null> {
  const keys = getRedisKeys(code);
  const data = await redis.get(keys.finalResults);
  if (!data) return null;
  return typeof data === 'string' ? JSON.parse(data) : data as FinalResults;
}

// ============ CLEANUP ============

export async function deleteSession(code: string): Promise<void> {
  const keys = getRedisKeys(code);
  await redis.del(
    keys.session,
    keys.phase,
    keys.words,
    keys.proposals,
    keys.shortlist,
    keys.votesR1,
    keys.votesR2,
    keys.votersR1,
    keys.votersR2,
    keys.participants,
    keys.finalResults
  );
}

export { redis };
