/**
 * Server-Side Authentication Utilities
 * 
 * These utilities are designed for use in Supabase Edge Functions
 * to validate user roles and permissions server-side.
 * 
 * IMPORTANT: Never rely solely on client-side role checks for
 * sensitive operations. Always validate on the server.
 */

import { createClient } from '@supabase/supabase-js';

export type UserRole = 'student' | 'parent' | 'school';

/**
 * Validates if a user has a specific role using server-side validation.
 * 
 * This function calls the has_role() database function which uses
 * SECURITY DEFINER to bypass RLS and safely check roles.
 * 
 * @param supabaseClient - Authenticated Supabase client instance
 * @param userId - UUID of the user to check
 * @param role - The role to validate ('student' | 'parent' | 'school')
 * @returns Promise<boolean> - True if user has the role, false otherwise
 * 
 * @example
 * // In an Edge Function:
 * const supabase = createClient(
 *   Deno.env.get('SUPABASE_URL')!,
 *   Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
 * );
 * 
 * const hasSchoolRole = await validateUserRole(supabase, userId, 'school');
 * if (!hasSchoolRole) {
 *   return new Response('Forbidden', { status: 403 });
 * }
 */
export async function validateUserRole(
  supabaseClient: any,
  userId: string,
  role: UserRole
): Promise<boolean> {
  try {
    const { data, error } = await supabaseClient.rpc('has_role', {
      _user_id: userId,
      _role: role,
    });

    if (error) {
      console.error('Error validating user role:', error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('Exception validating user role:', error);
    return false;
  }
}

/**
 * Validates if the authenticated user from a request has a specific role.
 * 
 * This is a convenience wrapper that extracts the user from the
 * Authorization header and validates their role.
 * 
 * @param request - The incoming Request object with Authorization header
 * @param supabaseUrl - Supabase project URL
 * @param supabaseAnonKey - Supabase anonymous key
 * @param requiredRole - The role required to proceed
 * @returns Promise<{authorized: boolean, userId: string | null}> - Authorization result
 * 
 * @example
 * // In an Edge Function:
 * const { authorized, userId } = await validateRequestRole(
 *   req,
 *   Deno.env.get('SUPABASE_URL')!,
 *   Deno.env.get('SUPABASE_ANON_KEY')!,
 *   'school'
 * );
 * 
 * if (!authorized) {
 *   return new Response('Forbidden', { status: 403 });
 * }
 */
export async function validateRequestRole(
  request: Request,
  supabaseUrl: string,
  supabaseAnonKey: string,
  requiredRole: UserRole
): Promise<{ authorized: boolean; userId: string | null }> {
  try {
    // Extract the JWT from the Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return { authorized: false, userId: null };
    }

    // Create client with the user's JWT to validate authentication
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader }
      }
    });

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return { authorized: false, userId: null };
    }

    // Validate the role using the security definer function
    const hasRole = await validateUserRole(supabase, user.id, requiredRole);

    return {
      authorized: hasRole,
      userId: user.id
    };
  } catch (error) {
    console.error('Exception in validateRequestRole:', error);
    return { authorized: false, userId: null };
  }
}
