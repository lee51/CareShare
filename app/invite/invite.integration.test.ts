import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const useLocal =
  process.env.NEXT_PUBLIC_USE_LOCAL_DB === 'true' ||
  (Boolean(process.env.NEXT_PUBLIC_LOCAL_SUPABASE_URL) && process.env.NEXT_PUBLIC_USE_LOCAL_DB !== 'false');

const SUPABASE_URL = (useLocal ? process.env.NEXT_PUBLIC_LOCAL_SUPABASE_URL : process.env.NEXT_PUBLIC_SUPABASE_URL) ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_LOCAL_SUPABASE_URL;

const ANON_KEY = (useLocal ? process.env.NEXT_PUBLIC_LOCAL_SUPABASE_ANON_KEY : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_LOCAL_SUPABASE_ANON_KEY;

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

const missingVars: string[] = [];
if (!SUPABASE_URL) missingVars.push('NEXT_PUBLIC_SUPABASE_URL (or NEXT_PUBLIC_LOCAL_SUPABASE_URL)');
if (!ANON_KEY) missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_LOCAL_SUPABASE_ANON_KEY)');
if (!SERVICE_ROLE_KEY) missingVars.push('SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY)');

const canRunIntegration = missingVars.length === 0;

if (!canRunIntegration) {
  console.warn(
    '\n========================================================================================\n' +
    '⚠️  [SKIPPED INTEGRATION TEST] app/invite/invite.integration.test.ts\n' +
    `    Missing environment variable(s): ${missingVars.join(', ')}.\n` +
    '    To run real integration tests, add these to your .env file.\n' +
    '========================================================================================\n'
  );
}

describe.runIf(canRunIntegration)('Invitation system integration test (real local supabase)', () => {
  let adminClient: SupabaseClient;
  let anonClient: SupabaseClient;

  let testProfileId: string;
  let ownerUser: any;
  let userB: any;
  let userC: any;
  let ownerClient: SupabaseClient;
  let userBClient: SupabaseClient;
  let userCClient: SupabaseClient;
  let testInviteId: string;

  beforeAll(async () => {
    adminClient = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    });
    anonClient = createClient(SUPABASE_URL!, ANON_KEY!, {
      auth: { persistSession: false },
    });

    // Create test user A (Owner)
    const ownerEmail = `owner-${Date.now()}@example.com`;
    const { data: ownerData, error: ownerErr } = await adminClient.auth.admin.createUser({
      email: ownerEmail,
      email_confirm: true,
    });
    if (ownerErr) throw ownerErr;
    ownerUser = ownerData.user;

    // Create test user B (Recipient 1)
    const userBEmail = `userb-${Date.now()}@example.com`;
    const { data: userBData, error: userBErr } = await adminClient.auth.admin.createUser({
      email: userBEmail,
      email_confirm: true,
    });
    if (userBErr) throw userBErr;
    userB = userBData.user;

    // Create test user C (Recipient 2 - Third Person)
    const userCEmail = `userc-${Date.now()}@example.com`;
    const { data: userCData, error: userCErr } = await adminClient.auth.admin.createUser({
      email: userCEmail,
      email_confirm: true,
    });
    if (userCErr) throw userCErr;
    userC = userCData.user;

    // Authenticate ownerClient as ownerUser
    ownerClient = createClient(SUPABASE_URL!, ANON_KEY!, {
      auth: { persistSession: false },
    });
    const { data: linkA } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: ownerEmail,
    });
    if (linkA?.properties?.hashed_token) {
      await ownerClient.auth.verifyOtp({
        token_hash: linkA.properties.hashed_token,
        type: 'magiclink',
      });
    }

    // Authenticate userBClient as userB
    userBClient = createClient(SUPABASE_URL!, ANON_KEY!, {
      auth: { persistSession: false },
    });
    const { data: linkB } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: userBEmail,
    });
    if (linkB?.properties?.hashed_token) {
      await userBClient.auth.verifyOtp({
        token_hash: linkB.properties.hashed_token,
        type: 'magiclink',
      });
    }

    // Authenticate userCClient as userC
    userCClient = createClient(SUPABASE_URL!, ANON_KEY!, {
      auth: { persistSession: false },
    });
    const { data: linkC } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: userCEmail,
    });
    if (linkC?.properties?.hashed_token) {
      await userCClient.auth.verifyOtp({
        token_hash: linkC.properties.hashed_token,
        type: 'magiclink',
      });
    }

    // Create test profile using ownerClient
    const { data: profile, error: profileErr } = await ownerClient
      .from('profiles')
      .insert({ name: 'Integration Test Doggo', kind: 'dog' })
      .select()
      .single();
    if (profileErr) throw profileErr;
    testProfileId = profile.id;
  });

  afterAll(async () => {
    // Cleanup test data
    if (testProfileId) {
      await adminClient?.from('profiles').delete().eq('id', testProfileId);
    }
    if (ownerUser) await adminClient?.auth.admin.deleteUser(ownerUser.id);
    if (userB) await adminClient?.auth.admin.deleteUser(userB.id);
    if (userC) await adminClient?.auth.admin.deleteUser(userC.id);
  });

  it('allows owner to generate an invite row', async () => {
    const { data: invite, error } = await ownerClient
      .from('p_invites')
      .insert({
        p_id: testProfileId,
        created_by: ownerUser.id,
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(invite).toBeDefined();
    expect(invite.p_id).toBe(testProfileId);
    expect(invite.used_by).toBeNull();

    testInviteId = invite.id;
  });

  it('allows unauthenticated anon user to inspect invite via get_invite rpc', async () => {
    const { data, error } = await anonClient.rpc('get_invite', { invite_id: testInviteId });

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data[0].p_id).toBe(testProfileId);
    expect(data[0].profile_name).toBe('Integration Test Doggo');
    expect(data[0].used_by).toBeNull();
  });

  it('allows user b to accept the invite via accept_invite rpc', async () => {
    const { data, error } = await userBClient.rpc('accept_invite', { invite_id: testInviteId });

    expect(error).toBeNull();
    expect(data).toBe(testProfileId);

    // Verify User B was added to p_caretakers (checked via userBClient since RLS limits self)
    const { data: caretakers } = await userBClient
      .from('p_caretakers')
      .select('*')
      .eq('p_id', testProfileId)
      .eq('user_id', userB.id);

    expect(caretakers).toBeDefined();
    expect(caretakers!.length).toBeGreaterThan(0);
    expect(caretakers![0].user_id).toBe(userB.id);

    // Verify invite was marked as used
    const { data: inviteRows } = await ownerClient
      .from('p_invites')
      .select('*')
      .eq('id', testInviteId);

    expect(inviteRows).toBeDefined();
    expect(inviteRows![0].used_by).toBe(userB.id);
    expect(inviteRows![0].used_at).not.toBeNull();
  });

  it('prevents user c (third person) from using the same invite again', async () => {
    const { data, error } = await userCClient.rpc('accept_invite', { invite_id: testInviteId });

    expect(error).toBeDefined();
    expect(error?.message).toContain('This invite has already been used');

    // Verify User C was NOT added to p_caretakers
    const { data: caretakersC } = await userCClient
      .from('p_caretakers')
      .select('*')
      .eq('p_id', testProfileId)
      .eq('user_id', userC.id);

    expect(caretakersC).toEqual([]);
  });
});
