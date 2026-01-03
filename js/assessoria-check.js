// Permission check for assessoria (limited access) users
// This script should be included in pages that are NOT accessible to assessoria users

(async function() {
    'use strict';

    // Check if user has assessoria role
    async function checkAssessoriaAccess() {
        try {
            // First check localStorage
            let userData = JSON.parse(localStorage.getItem('userData') || 'null');

            // If no userData in localStorage, try to fetch from database
            if (!userData || !userData.role) {
                const userId = localStorage.getItem('userId');
                if (!userId) {
                    // Not logged in, let the page handle it
                    return true;
                }

                // Fetch user data from Supabase
                if (window.WardApp && window.WardApp.db) {
                    const { data, error } = await window.WardApp.db
                        .from('users')
                        .select('*')
                        .eq('id', userId)
                        .single();

                    if (data && !error) {
                        userData = data;
                        localStorage.setItem('userData', JSON.stringify(data));
                    }
                }
            }

            // Now check if user is assessoria
            if (userData && userData.role === 'assessoria') {
                // Redirect to dashboard with message
                alert('Esta página está disponível apenas para membros completos da Ward Academy.\n\nPara ter acesso, você pode demonstrar interesse através do seu dashboard.');
                window.location.href = 'dashboard-assessoria-avulsa.html';
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error checking assessoria access:', error);
            return true; // Allow access on error to avoid breaking the page
        }
    }

    // Wait for WardApp to be loaded before checking
    function initCheck() {
        if (window.WardApp && window.WardApp.db) {
            checkAssessoriaAccess();
        } else {
            // Wait a bit for WardApp to load
            setTimeout(initCheck, 100);
        }
    }

    // Run check when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCheck);
    } else {
        initCheck();
    }
})();
