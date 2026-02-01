const { createClient } = require('@supabase/supabase-js');

let _client = null;

function getSupabase(authToken) {
  // If auth token provided, create an authenticated client
  if (authToken) {
    return createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        global: {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      }
    );
  }
  // Otherwise reuse the anon client
  if (!_client) {
    _client = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
  }
  return _client;
}

// Tables allowed through the proxy
const ALLOWED_TABLES = [
  'users', 'questionnaire_data', 'messages', 'landmarks',
  'user_preparation_status', 'schedules', 'schedule_delays',
  'links_repository', 'blog_posts', 'blog_comments', 'blog_reactions',
  'blog_comment_likes', 'research_projects', 'research_coauthors',
  'research_stages_completed', 'research_tasks', 'research_notes',
  'study_diary', 'uworld_diary', 'daily_checkins',
  'user_basic_data', 'user_usmle_data', 'user_uworld_data',
  'user_uworld_progress', 'user_english_level', 'user_anki_data',
  'user_research_data', 'user_research_contacts', 'user_observerships',
  'user_background', 'mentor_messages', 'scheduled_calls',
  'flash_questions', 'flash_tests', 'flash_question_comments',
  'flash_question_responses', 'kanban_files', 'study_difficulties',
  'watched_lessons', 'call_reports', 'course_video_comments',
  'course_audio_comments', 'course_videos', 'course_audios',
  'self_assessment_enrollments', 'self_assessment_questions',
  'self_assessment_responses', 'self_assessment_tests',
  'mentor_settings', 'mentor_availability', 'wasa_schedules',
  'networking_specialties', 'networking_positions', 'networking_cities'
];

// RPCs allowed through the proxy
const ALLOWED_RPCS = [
  'secure_login', 'secure_register', 'change_password',
  'get_questionnaire_data', 'save_questionnaire_data', 'list_users',
  'create_user_secure', 'update_password_secure',
  'add_networking_specialty', 'add_networking_position', 'add_networking_city',
  'delete_old_archived_projects', 'get_pending_emails',
  'mark_email_sent', 'mark_email_failed'
];

module.exports = { getSupabase, ALLOWED_TABLES, ALLOWED_RPCS };
