// Permission check for assessoria (limited access) users
// This script should be included in pages that are NOT accessible to assessoria users

(function() {
    'use strict';

    // Check if user has assessoria role
    function checkAssessoriaAccess() {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const userRole = userData.role;

        if (userRole === 'assessoria') {
            // Redirect to dashboard with message
            alert('Esta página está disponível apenas para membros completos da Ward Academy.\n\nPara ter acesso, você pode demonstrar interesse através do seu dashboard.');
            window.location.href = 'dashboard-assessoria-avulsa.html';
            return false;
        }

        return true;
    }

    // Run check when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkAssessoriaAccess);
    } else {
        checkAssessoriaAccess();
    }
})();
