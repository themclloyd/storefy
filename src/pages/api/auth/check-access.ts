import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { subscriptionService } from '@/services/subscription';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Create authenticated Supabase client
    const supabaseServer = createServerSupabaseClient({ req, res });
    
    // Get the current user
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check user access status
    const accessStatus = await subscriptionService.checkUserAccess(user.id);
    
    return res.status(200).json(accessStatus);
    
  } catch (error) {
    console.error('Error checking user access:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      has_access: false,
      status: 'error',
      plan_name: 'Unknown',
      is_trial: false
    });
  }
}
