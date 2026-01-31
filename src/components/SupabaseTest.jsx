/**
 * SupabaseTest Component
 * Comprehensive test for all Supabase connections and services
 * D-KRAFT ERP System
 */

import { useState, useCallback } from 'react';
import { supabase, auth } from '../lib/supabase';
import {
    clientsService,
    suppliersService,
    materialsService,
    productsService,
    projectsService,
    quotationsService,
    requisitionsService,
    operationsService,
    bomService,
    warehousesService,
    categoriesService,
    unitsService,
    profilesService,
    attendanceService
} from '../lib/supabase';

// Tables to test
const TABLES_TO_TEST = [
    { name: 'clients', service: clientsService, displayName: 'Clients' },
    { name: 'suppliers', service: suppliersService, displayName: 'Suppliers' },
    { name: 'materials', service: materialsService, displayName: 'Materials' },
    { name: 'products', service: productsService, displayName: 'Products' },
    { name: 'projects', service: projectsService, displayName: 'Projects' },
    { name: 'quotations', service: quotationsService, displayName: 'Quotations' },
    { name: 'requisitions', service: requisitionsService, displayName: 'Requisitions' },
    { name: 'operations', service: operationsService, displayName: 'Operations' },
    { name: 'bom', service: bomService, displayName: 'BOM' },
    { name: 'warehouses', service: warehousesService, displayName: 'Warehouses' },
    { name: 'categories', service: categoriesService, displayName: 'Categories' },
    { name: 'units', service: unitsService, displayName: 'Units' },
    { name: 'profiles', service: profilesService, displayName: 'Profiles' },
    { name: 'attendance', service: attendanceService, displayName: 'Attendance' }
];

const SupabaseTest = () => {
    const [results, setResults] = useState({});
    const [testing, setTesting] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState(null);
    const [authStatus, setAuthStatus] = useState(null);
    const [currentTest, setCurrentTest] = useState('');
    const [summary, setSummary] = useState(null);

    // Test basic Supabase connection
    const testConnection = useCallback(async () => {
        try {
            setCurrentTest('Supabase Connection');
            // Simple health check - try to access the database
            const { data, error } = await supabase.from('clients').select('count', { count: 'exact', head: true });

            if (error && error.code === 'PGRST301') {
                // JWT expired or invalid - still means connection works
                return { success: true, message: 'Connected (Auth required for data)' };
            }

            if (error) {
                return { success: false, message: error.message, code: error.code };
            }

            return { success: true, message: 'Connected successfully' };
        } catch (err) {
            return { success: false, message: err.message };
        }
    }, []);

    // Test auth status
    const testAuth = useCallback(async () => {
        try {
            setCurrentTest('Auth Status');
            const session = await auth.getSession();

            if (session) {
                const user = await auth.getUser();
                return {
                    success: true,
                    authenticated: true,
                    user: user?.email || 'Unknown',
                    message: `Authenticated as ${user?.email}`
                };
            }

            return {
                success: true,
                authenticated: false,
                message: 'No active session (Anonymous mode)'
            };
        } catch (err) {
            return { success: false, message: err.message };
        }
    }, []);

    // Test a single table
    const testTable = useCallback(async (tableConfig) => {
        const { name, service, displayName } = tableConfig;

        try {
            setCurrentTest(displayName);

            // Try to fetch data
            const data = await service.getAll();

            return {
                success: true,
                table: displayName,
                count: Array.isArray(data) ? data.length : 0,
                message: `OK - ${Array.isArray(data) ? data.length : 0} records`
            };
        } catch (err) {
            // Check for specific error types
            const errorCode = err.code || err.message;

            if (errorCode === 'PGRST116' || err.message?.includes('does not exist')) {
                return {
                    success: false,
                    table: displayName,
                    status: 'missing',
                    message: 'Table does not exist'
                };
            }

            if (errorCode === 'PGRST301' || err.message?.includes('JWT')) {
                return {
                    success: false,
                    table: displayName,
                    status: 'auth_required',
                    message: 'Auth required (RLS enabled)'
                };
            }

            if (err.message?.includes('permission denied')) {
                return {
                    success: false,
                    table: displayName,
                    status: 'no_permission',
                    message: 'No read permission'
                };
            }

            return {
                success: false,
                table: displayName,
                status: 'error',
                message: err.message
            };
        }
    }, []);

    // Run all tests
    const runAllTests = async () => {
        setTesting(true);
        setResults({});
        setSummary(null);

        // Test connection
        const connResult = await testConnection();
        setConnectionStatus(connResult);

        // Test auth
        const authResult = await testAuth();
        setAuthStatus(authResult);

        // Test all tables
        const tableResults = {};
        let successCount = 0;
        let failCount = 0;
        let authRequiredCount = 0;
        let missingCount = 0;

        for (const tableConfig of TABLES_TO_TEST) {
            const result = await testTable(tableConfig);
            tableResults[tableConfig.name] = result;

            setResults(prev => ({ ...prev, [tableConfig.name]: result }));

            if (result.success) {
                successCount++;
            } else if (result.status === 'auth_required') {
                authRequiredCount++;
            } else if (result.status === 'missing') {
                missingCount++;
            } else {
                failCount++;
            }

            // Small delay for visual feedback
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        setSummary({
            total: TABLES_TO_TEST.length,
            success: successCount,
            authRequired: authRequiredCount,
            missing: missingCount,
            failed: failCount
        });

        setCurrentTest('');
        setTesting(false);
    };

    const getStatusIcon = (result) => {
        if (!result) return '⏳';
        if (result.success) return '✅';
        if (result.status === 'auth_required') return '🔒';
        if (result.status === 'missing') return '❌';
        return '⚠️';
    };

    const getStatusColor = (result) => {
        if (!result) return '#666';
        if (result.success) return '#10b981';
        if (result.status === 'auth_required') return '#f59e0b';
        if (result.status === 'missing') return '#ef4444';
        return '#f59e0b';
    };

    return (
        <div style={{
            padding: '2rem',
            maxWidth: '800px',
            margin: '2rem auto',
            backgroundColor: 'rgba(15, 30, 60, 0.9)',
            borderRadius: '16px',
            border: '1px solid rgba(100, 150, 200, 0.2)',
            backdropFilter: 'blur(10px)'
        }}>
            <h2 style={{
                marginBottom: '1.5rem',
                color: '#fff',
                fontSize: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
            }}>
                <span style={{ fontSize: '1.75rem' }}>🔌</span>
                Supabase Connection Test
            </h2>

            <button
                onClick={runAllTests}
                disabled={testing}
                style={{
                    padding: '0.875rem 2rem',
                    background: testing
                        ? 'rgba(100, 100, 100, 0.5)'
                        : 'linear-gradient(135deg, #d35400 0%, #e67e22 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: testing ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                    fontWeight: '600',
                    width: '100%',
                    marginBottom: '1.5rem',
                    boxShadow: testing ? 'none' : '0 4px 15px rgba(211, 84, 0, 0.3)',
                    transition: 'all 0.2s ease'
                }}
            >
                {testing ? `Testing ${currentTest}...` : 'Run All Tests'}
            </button>

            {/* Connection Status */}
            {connectionStatus && (
                <div style={{
                    padding: '1rem',
                    marginBottom: '1rem',
                    borderRadius: '10px',
                    background: connectionStatus.success
                        ? 'rgba(16, 185, 129, 0.15)'
                        : 'rgba(239, 68, 68, 0.15)',
                    border: `1px solid ${connectionStatus.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>{connectionStatus.success ? '✅' : '❌'}</span>
                        <strong style={{ color: '#fff' }}>Connection:</strong>
                        <span style={{ color: connectionStatus.success ? '#10b981' : '#ef4444' }}>
                            {connectionStatus.message}
                        </span>
                    </div>
                </div>
            )}

            {/* Auth Status */}
            {authStatus && (
                <div style={{
                    padding: '1rem',
                    marginBottom: '1rem',
                    borderRadius: '10px',
                    background: 'rgba(100, 150, 200, 0.1)',
                    border: '1px solid rgba(100, 150, 200, 0.2)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>{authStatus.authenticated ? '🔐' : '👤'}</span>
                        <strong style={{ color: '#fff' }}>Auth:</strong>
                        <span style={{ color: '#94a3b8' }}>
                            {authStatus.message}
                        </span>
                    </div>
                </div>
            )}

            {/* Tables Grid */}
            {Object.keys(results).length > 0 && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                    gap: '0.75rem',
                    marginTop: '1rem'
                }}>
                    {TABLES_TO_TEST.map(({ name, displayName }) => {
                        const result = results[name];
                        return (
                            <div
                                key={name}
                                style={{
                                    padding: '0.875rem',
                                    borderRadius: '10px',
                                    background: 'rgba(30, 50, 90, 0.5)',
                                    border: `1px solid ${getStatusColor(result)}40`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                <span style={{ fontSize: '1.25rem' }}>{getStatusIcon(result)}</span>
                                <div>
                                    <div style={{ color: '#fff', fontWeight: '500', fontSize: '0.9rem' }}>
                                        {displayName}
                                    </div>
                                    <div style={{
                                        color: getStatusColor(result),
                                        fontSize: '0.75rem',
                                        marginTop: '2px'
                                    }}>
                                        {result?.message || 'Pending...'}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Summary */}
            {summary && (
                <div style={{
                    marginTop: '1.5rem',
                    padding: '1.25rem',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, rgba(30, 50, 90, 0.6), rgba(20, 40, 70, 0.6))',
                    border: '1px solid rgba(100, 150, 200, 0.2)'
                }}>
                    <h3 style={{ color: '#fff', marginBottom: '1rem', fontSize: '1.1rem' }}>
                        Summary
                    </h3>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '1rem',
                        textAlign: 'center'
                    }}>
                        <div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#10b981' }}>
                                {summary.success}
                            </div>
                            <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Working</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#f59e0b' }}>
                                {summary.authRequired}
                            </div>
                            <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Auth Required</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#ef4444' }}>
                                {summary.missing}
                            </div>
                            <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Missing</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#f59e0b' }}>
                                {summary.failed}
                            </div>
                            <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Errors</div>
                        </div>
                    </div>

                    {/* Recommendations */}
                    <div style={{
                        marginTop: '1.25rem',
                        paddingTop: '1rem',
                        borderTop: '1px solid rgba(100, 150, 200, 0.2)',
                        color: '#94a3b8',
                        fontSize: '0.85rem'
                    }}>
                        <strong style={{ color: '#fff' }}>Notes:</strong>
                        <ul style={{ margin: '0.5rem 0 0 1rem', paddingLeft: '0' }}>
                            {summary.authRequired > 0 && (
                                <li>🔒 Tables with Auth Required need RLS policies or user login</li>
                            )}
                            {summary.missing > 0 && (
                                <li>❌ Missing tables need to be created in Supabase</li>
                            )}
                            {summary.success === summary.total && (
                                <li>✅ All tables are accessible and working!</li>
                            )}
                        </ul>
                    </div>
                </div>
            )}

            {/* Supabase URL Info */}
            <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                borderRadius: '8px',
                background: 'rgba(0, 0, 0, 0.2)',
                fontSize: '0.75rem',
                color: '#64748b'
            }}>
                <strong>Supabase URL:</strong> {import.meta.env.VITE_SUPABASE_URL || 'Using default'}
            </div>
        </div>
    );
};

export default SupabaseTest;
