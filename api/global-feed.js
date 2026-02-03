const { getSupabase } = require('./_lib/supabase');
const { verifyAuth } = require('./_lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authentication check
    const auth = await verifyAuth(req);
    if (!auth) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const authToken = req.headers['x-supabase-auth'];
    const supabase = getSupabase(authToken || null);

    // Execute all queries in parallel
    const [
      linksRes,
      postsRes,
      commentsRes,
      checkinsRes,
      studyDiaryRes,
      uworldDiaryRes,
      delaysRes,
      messagesRes,
      researchRes,
      researchTasksRes,
      researchCoauthorsRes,
      researchNotesRes,
      landmarksRes,
      difficultiesRes,
      scheduledCallsRes,
      schedulesCreatedRes,
      completedSchedulesRes,
      questionnaireRes,
      flashTestsCreatedRes,
      flashTestsCompletedRes,
      flashCommentsRes,
      watchedLessonsRes,
      callReportsRes,
      audioCommentsRes,
      mentorTasksRes
    ] = await Promise.all([
      // Links - new additions
      supabase.from('links_repository').select('*, users:added_by(full_name, email)').order('created_at', { ascending: false }).limit(20),
      // Blog posts
      supabase.from('blog_posts').select('*, users:user_id(full_name, email)').order('created_at', { ascending: false }).limit(20),
      // Blog comments
      supabase.from('blog_comments').select('*, users:user_id(full_name, email)').order('created_at', { ascending: false }).limit(20),
      // Daily check-ins
      supabase.from('daily_checkins').select('*, users:user_id(full_name, email)').order('created_at', { ascending: false }).limit(30),
      // Study diary entries
      supabase.from('study_diary').select('*, users:user_id(full_name, email)').order('created_at', { ascending: false }).limit(20),
      // UWorld diary entries
      supabase.from('uworld_diary').select('*, users:user_id(full_name, email)').order('created_at', { ascending: false }).limit(20),
      // Schedule delays
      supabase.from('schedule_delays').select('*, users:user_id(full_name, email)').order('created_at', { ascending: false }).limit(20),
      // Mentor messages
      supabase.from('mentor_messages').select('*, users:user_id(full_name, email), mentor:mentor_id(full_name)').order('created_at', { ascending: false }).limit(20),
      // Research projects updates
      supabase.from('research_projects').select('*, users:created_by(full_name, email)').order('updated_at', { ascending: false }).limit(15),
      // Research tasks
      supabase.from('research_tasks').select('*, users:assigned_to(full_name, email), project:project_id(title)').order('updated_at', { ascending: false }).limit(25),
      // Research coauthors
      supabase.from('research_coauthors').select('*, users:user_id(full_name, email), project:project_id(title)').order('added_at', { ascending: false }).limit(20),
      // Research notes
      supabase.from('research_notes').select('*, users:user_id(full_name, email), project:project_id(title)').order('created_at', { ascending: false }).limit(20),
      // Completed landmarks
      supabase.from('landmarks').select('*, users:user_id(full_name, email)').eq('completed', true).order('completion_date', { ascending: false }).limit(20),
      // Study difficulties
      supabase.from('study_difficulties').select('*, users:user_id(full_name, email)').eq('resolved', false).order('created_at', { ascending: false }).limit(20),
      // Scheduled calls
      supabase.from('scheduled_calls').select('*, users:student_id(full_name, email), mentor:mentor_id(full_name), landmark:landmark_id(title)').order('created_at', { ascending: false }).limit(20),
      // Schedules - newly created
      supabase.from('schedules').select('*, users:user_id(full_name, email)').order('created_at', { ascending: false }).limit(30),
      // Schedules - completed
      supabase.from('schedules').select('*, users:user_id(full_name, email)').eq('completed', true).order('completion_date', { ascending: false }).limit(30),
      // Questionnaires completed
      supabase.from('users').select('id, full_name, email, questionnaire_step, updated_at').gte('questionnaire_step', 11).order('updated_at', { ascending: false }).limit(20),
      // Flash tests - started
      supabase.from('flash_tests').select('*, users:user_id(full_name, email)').order('started_at', { ascending: false }).limit(30),
      // Flash tests - completed
      supabase.from('flash_tests').select('*, users:user_id(full_name, email)').eq('status', 'completed').order('completed_at', { ascending: false }).limit(30),
      // Flash question comments
      supabase.from('flash_question_comments').select('*, users:user_id(full_name, email)').order('created_at', { ascending: false }).limit(30),
      // Watched lessons
      supabase.from('watched_lessons').select('*, users:user_id(full_name, email)').order('watched_at', { ascending: false }).limit(30),
      // Call reports
      supabase.from('call_reports').select('*, student:student_id(full_name, email), mentor:mentor_id(full_name, email)').order('created_at', { ascending: false }).limit(20),
      // Audio comments
      supabase.from('course_audio_comments').select('*, users:user_id(full_name, email), audio:audio_id(title)').order('created_at', { ascending: false }).limit(30),
      // Mentor student tasks (Guilherme to-do list)
      supabase.from('mentor_student_tasks').select('*, mentor:mentor_id(full_name, email), student:student_id(full_name, email)').order('updated_at', { ascending: false }).limit(30)
    ]);

    // Return raw data for client-side processing
    return res.status(200).json({
      links: linksRes.data || [],
      posts: postsRes.data || [],
      comments: commentsRes.data || [],
      checkins: checkinsRes.data || [],
      studyDiary: studyDiaryRes.data || [],
      uworldDiary: uworldDiaryRes.data || [],
      delays: delaysRes.data || [],
      messages: messagesRes.data || [],
      research: researchRes.data || [],
      researchTasks: researchTasksRes.data || [],
      researchCoauthors: researchCoauthorsRes.data || [],
      researchNotes: researchNotesRes.data || [],
      landmarks: landmarksRes.data || [],
      difficulties: difficultiesRes.data || [],
      scheduledCalls: scheduledCallsRes.data || [],
      schedulesCreated: schedulesCreatedRes.data || [],
      completedSchedules: completedSchedulesRes.data || [],
      questionnaire: questionnaireRes.data || [],
      flashTestsCreated: flashTestsCreatedRes.data || [],
      flashTestsCompleted: flashTestsCompletedRes.data || [],
      flashComments: flashCommentsRes.data || [],
      watchedLessons: watchedLessonsRes.data || [],
      callReports: callReportsRes.data || [],
      audioComments: audioCommentsRes.data || [],
      mentorTasks: mentorTasksRes.data || []
    });

  } catch (err) {
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};
