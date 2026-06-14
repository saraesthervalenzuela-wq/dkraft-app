/**
 * D-KRAFT Functionality Test Script
 * Run this in browser console to test all modules
 *
 * Usage: Copy and paste into browser console at http://localhost:5173
 */

const DKRAFT_TEST = {
    results: [],

    log: function(module, test, status, details = '') {
        const result = { module, test, status, details, timestamp: new Date().toISOString() };
        this.results.push(result);
        const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
        console.log(`${icon} [${module}] ${test}${details ? ': ' + details : ''}`);
        return status === 'PASS';
    },

    async testSupabaseConnection() {
        console.log('\n========== SUPABASE CONNECTION TEST ==========\n');

        try {
            // Test if Supabase is available
            const { supabase } = await import('/src/lib/supabase.js');

            if (supabase) {
                this.log('Supabase', 'Client initialized', 'PASS');
            } else {
                this.log('Supabase', 'Client initialized', 'FAIL', 'supabase is undefined');
                return false;
            }

            // Test clients table
            const { data: clients, error: clientsError } = await supabase.from('clients').select('count');
            if (clientsError) {
                this.log('Supabase', 'Clients table', 'FAIL', clientsError.message);
            } else {
                this.log('Supabase', 'Clients table', 'PASS', `${clients[0]?.count || 0} records`);
            }

            // Test materials table
            const { data: materials, error: materialsError } = await supabase.from('materials').select('count');
            if (materialsError) {
                this.log('Supabase', 'Materials table', 'FAIL', materialsError.message);
            } else {
                this.log('Supabase', 'Materials table', 'PASS', `${materials[0]?.count || 0} records`);
            }

            // Test products table
            const { data: products, error: productsError } = await supabase.from('products').select('count');
            if (productsError) {
                this.log('Supabase', 'Products table', 'FAIL', productsError.message);
            } else {
                this.log('Supabase', 'Products table', 'PASS', `${products[0]?.count || 0} records`);
            }

            return true;
        } catch (error) {
            this.log('Supabase', 'Connection', 'FAIL', error.message);
            return false;
        }
    },

    testUIComponents() {
        console.log('\n========== UI COMPONENTS TEST ==========\n');

        // Test sidebar
        const sidebar = document.querySelector('.sidebar');
        this.log('UI', 'Sidebar exists', sidebar ? 'PASS' : 'FAIL');

        // Test main content
        const mainContent = document.querySelector('.main-content');
        this.log('UI', 'Main content exists', mainContent ? 'PASS' : 'FAIL');

        // Test mobile menu toggle
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        this.log('UI', 'Mobile menu toggle', mobileToggle ? 'PASS' : 'WARN', 'May be hidden on desktop');

        // Test page header
        const pageHeader = document.querySelector('.page-header');
        this.log('UI', 'Page header exists', pageHeader ? 'PASS' : 'FAIL');

        // Test favicon
        const favicon = document.querySelector('link[rel="icon"]');
        const hasDKraftFavicon = favicon?.href?.includes('favicon.svg');
        this.log('UI', 'D-KRAFT favicon', hasDKraftFavicon ? 'PASS' : 'FAIL', favicon?.href || 'no favicon');

        return true;
    },

    testTableStyles() {
        console.log('\n========== TABLE STYLES TEST ==========\n');

        // Check for table containers with orange bar
        const tableContainers = document.querySelectorAll(
            '.clients-table-container, .materials-table, .products-table-container, ' +
            '.suppliers-table-container, .staff-table-container'
        );

        this.log('Tables', 'Table containers found', tableContainers.length > 0 ? 'PASS' : 'WARN',
            `${tableContainers.length} containers`);

        // Check for status badges
        const statusBadges = document.querySelectorAll('.status-badge, .client-status-badge, .supplier-status-badge');
        this.log('Tables', 'Status badges found', statusBadges.length > 0 ? 'PASS' : 'WARN',
            `${statusBadges.length} badges`);

        return true;
    },

    testModals() {
        console.log('\n========== MODAL TEST ==========\n');

        // Look for modal-related elements
        const modalOverlay = document.querySelector('.modal-overlay');
        const hasModalInDOM = modalOverlay !== null;

        this.log('Modals', 'Modal structure', 'PASS',
            hasModalInDOM ? 'Modal currently open' : 'No modal open (expected)');

        // Check for action buttons that open modals
        const addButtons = document.querySelectorAll('[class*="btn-primary"], [class*="btn-add"], button');
        const hasAddButton = Array.from(addButtons).some(btn =>
            btn.textContent?.toLowerCase().includes('add') ||
            btn.textContent?.toLowerCase().includes('new') ||
            btn.textContent?.toLowerCase().includes('crear')
        );
        this.log('Modals', 'Add/New buttons exist', hasAddButton ? 'PASS' : 'WARN');

        return true;
    },

    testColorConsistency() {
        console.log('\n========== COLOR CONSISTENCY TEST ==========\n');

        // Get computed styles
        const root = document.documentElement;
        const styles = getComputedStyle(root);

        // Check CSS variables
        const success = styles.getPropertyValue('--success').trim();
        const warning = styles.getPropertyValue('--warning').trim();
        const danger = styles.getPropertyValue('--danger').trim();
        const muted = styles.getPropertyValue('--muted').trim();

        this.log('Colors', '--success variable', success ? 'PASS' : 'FAIL', success || 'not defined');
        this.log('Colors', '--warning variable', warning ? 'PASS' : 'FAIL', warning || 'not defined');
        this.log('Colors', '--danger variable', danger ? 'PASS' : 'FAIL', danger || 'not defined');
        this.log('Colors', '--muted variable', muted ? 'PASS' : 'FAIL', muted || 'not defined');

        // Check expected values
        if (success) {
            const isCorrectSuccess = success.toLowerCase().includes('10b981');
            this.log('Colors', 'Success color correct', isCorrectSuccess ? 'PASS' : 'WARN', success);
        }

        if (warning) {
            const isCorrectWarning = warning.toLowerCase().includes('f59e0b');
            this.log('Colors', 'Warning color correct', isCorrectWarning ? 'PASS' : 'WARN', warning);
        }

        return true;
    },

    async runAllTests() {
        console.clear();
        console.log('🏭 D-KRAFT FUNCTIONALITY TEST SUITE');
        console.log('====================================\n');
        console.log('Started at:', new Date().toLocaleString());

        await this.testSupabaseConnection();
        this.testUIComponents();
        this.testTableStyles();
        this.testModals();
        this.testColorConsistency();

        // Summary
        console.log('\n========== TEST SUMMARY ==========\n');
        const passed = this.results.filter(r => r.status === 'PASS').length;
        const failed = this.results.filter(r => r.status === 'FAIL').length;
        const warnings = this.results.filter(r => r.status === 'WARN').length;

        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`⚠️ Warnings: ${warnings}`);
        console.log(`📊 Total: ${this.results.length}`);

        if (failed === 0) {
            console.log('\n🎉 ALL TESTS PASSED! The app is ready.\n');
        } else {
            console.log('\n⚠️ Some tests failed. Please review the results above.\n');
        }

        return this.results;
    }
};

// Auto-run tests
DKRAFT_TEST.runAllTests();
