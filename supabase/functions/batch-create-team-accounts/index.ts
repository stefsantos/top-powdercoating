import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Create Supabase admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify the requester is an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: userRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !userRole) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all team members without user_id
    const { data: teamMembers, error: fetchError } = await supabaseAdmin
      .from('team_members')
      .select('id, name')
      .is('user_id', null);

    if (fetchError) {
      console.error('Error fetching team members:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch team members', details: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!teamMembers || teamMembers.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No team members without accounts found', created: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${teamMembers.length} team members without accounts`);

    // Create accounts for each team member
    const results = [];
    let counter = 1;

    for (const member of teamMembers) {
      try {
        // Generate email and password
        const email = member.name.toLowerCase().replace(/\s+/g, '.') + '@toppowdercoating.com';
        const password = 'member' + counter;
        
        console.log(`Creating account for ${member.name}: ${email}`);

        // Create the user account
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: member.name,
          },
        });

        if (createError) {
          console.error(`Error creating user for ${member.name}:`, createError);
          results.push({
            name: member.name,
            success: false,
            error: createError.message,
          });
          continue;
        }

        // Assign team_member role
        const { error: roleInsertError } = await supabaseAdmin
          .from('user_roles')
          .insert({
            user_id: newUser.user.id,
            role: 'team_member',
          });

        if (roleInsertError) {
          console.error(`Error assigning role for ${member.name}:`, roleInsertError);
        }

        // Update team_members table
        const { error: updateError } = await supabaseAdmin
          .from('team_members')
          .update({
            user_id: newUser.user.id,
            email: email,
          })
          .eq('id', member.id);

        if (updateError) {
          console.error(`Error updating team member ${member.name}:`, updateError);
          results.push({
            name: member.name,
            success: false,
            error: updateError.message,
          });
          continue;
        }

        results.push({
          name: member.name,
          email: email,
          password: password,
          success: true,
        });

        counter++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error processing ${member.name}:`, error);
        results.push({
          name: member.name,
          success: false,
          error: errorMessage,
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: `Processed ${results.length} team members`,
        results: results,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in batch-create-team-accounts:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
