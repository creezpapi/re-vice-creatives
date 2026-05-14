'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { WeeklyBrief, WeeklyBriefDay, DeliverableType, TeamMember, WeekDayIndex } from '@/lib/types';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  return supabase;
}

/** Fetch (or create) the WeeklyBrief row for the given Monday, including its days. */
export async function getBriefForWeek(weekStart: string): Promise<WeeklyBrief> {
  const supabase = await requireAdmin();

  const { data: brief, error: bErr } = await supabase
    .from('weekly_briefs')
    .upsert({ week_start: weekStart }, { onConflict: 'week_start' })
    .select('*')
    .single();
  if (bErr || !brief) throw bErr ?? new Error('Could not fetch brief');

  const { data: days } = await supabase
    .from('weekly_brief_days')
    .select('*')
    .eq('brief_id', brief.id)
    .order('day_index', { ascending: true });

  return { ...brief, days: (days ?? []) as WeeklyBriefDay[] };
}

/** Save (upsert) a single day entry. Creates the brief header if needed. */
export async function upsertBriefDay(
  weekStart: string,
  dayIndex: WeekDayIndex,
  fields: {
    deliverable_types: DeliverableType[];
    team_members: TeamMember[];
    product_ids: string[];
    reference_url: string | null;
    notes: string | null;
  }
): Promise<void> {
  const supabase = await requireAdmin();

  const { data: brief, error: bErr } = await supabase
    .from('weekly_briefs')
    .upsert({ week_start: weekStart }, { onConflict: 'week_start' })
    .select('id')
    .single();
  if (bErr || !brief) throw bErr ?? new Error('Could not upsert brief');

  const { error } = await supabase
    .from('weekly_brief_days')
    .upsert(
      {
        brief_id: brief.id,
        day_index: dayIndex,
        deliverable_types: fields.deliverable_types,
        team_members: fields.team_members,
        product_ids: fields.product_ids,
        reference_url: fields.reference_url || null,
        notes: fields.notes || null,
      },
      { onConflict: 'brief_id,day_index' }
    );
  if (error) throw error;

  revalidatePath('/admin/content');
}
