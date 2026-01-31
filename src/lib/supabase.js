/**
 * Supabase Client Configuration
 * D-KRAFT ERP System
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qalqscfrcxzzvrcvqqbp.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseAnonKey) {
    console.warn('[Supabase] No anon key found in environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
})

// ============================================
// AUTH HELPERS
// ============================================

export const auth = {
    signUp: async (email, password, metadata = {}) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: metadata }
        })
        if (error) throw error
        return data
    },

    signIn: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        })
        if (error) throw error
        return data
    },

    signOut: async () => {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
    },

    getSession: async () => {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        return session
    },

    getUser: async () => {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) throw error
        return user
    },

    onAuthStateChange: (callback) => {
        return supabase.auth.onAuthStateChange(callback)
    }
}

// ============================================
// DATABASE HELPERS
// ============================================

/**
 * Generic CRUD operations for any table
 */
export const db = {
    // Get all records with optional filters
    getAll: async (table, { filters = {}, orderBy = 'created_at', ascending = false, limit = 100 } = {}) => {
        let query = supabase
            .from(table)
            .select('*')
            .order(orderBy, { ascending })
            .limit(limit)

        // Apply filters
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                query = query.eq(key, value)
            }
        })

        const { data, error } = await query
        if (error) throw error
        return data
    },

    // Get single record by ID
    getById: async (table, id) => {
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .eq('id', id)
            .single()
        if (error) throw error
        return data
    },

    // Create new record
    create: async (table, record) => {
        const { data, error } = await supabase
            .from(table)
            .insert(record)
            .select()
            .single()
        if (error) throw error
        return data
    },

    // Update record
    update: async (table, id, updates) => {
        const { data, error } = await supabase
            .from(table)
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single()
        if (error) throw error
        return data
    },

    // Delete record
    delete: async (table, id) => {
        const { error } = await supabase
            .from(table)
            .delete()
            .eq('id', id)
        if (error) throw error
        return true
    },

    // Search records
    search: async (table, column, term, limit = 20) => {
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .ilike(column, `%${term}%`)
            .limit(limit)
        if (error) throw error
        return data
    },

    // Get records with relations
    getWithRelations: async (table, select, filters = {}) => {
        let query = supabase.from(table).select(select)

        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                query = query.eq(key, value)
            }
        })

        const { data, error } = await query
        if (error) throw error
        return data
    }
}

// ============================================
// TABLE-SPECIFIC SERVICES
// ============================================

export const clientsService = {
    getAll: (filters) => db.getAll('clients', { filters }),
    getById: (id) => db.getById('clients', id),
    create: (data) => db.create('clients', data),
    update: (id, data) => db.update('clients', id, data),
    delete: (id) => db.delete('clients', id),
    search: (term) => db.search('clients', 'name', term),

    // Get clients pending QB sync
    getPendingSync: async () => {
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .in('sync_status', ['local_only', 'pending_push', 'error'])
        if (error) throw error
        return data
    }
}

export const suppliersService = {
    getAll: (filters) => db.getAll('suppliers', { filters }),
    getById: (id) => db.getById('suppliers', id),
    create: (data) => db.create('suppliers', data),
    update: (id, data) => db.update('suppliers', id, data),
    delete: (id) => db.delete('suppliers', id),
    search: (term) => db.search('suppliers', 'name', term)
}

export const materialsService = {
    getAll: (filters) => db.getAll('materials', { filters }),
    getById: (id) => db.getById('materials', id),
    create: (data) => db.create('materials', data),
    update: (id, data) => db.update('materials', id, data),
    delete: (id) => db.delete('materials', id),
    search: (term) => db.search('materials', 'name', term),

    // Get low stock materials
    getLowStock: async () => {
        const { data, error } = await supabase
            .from('materials')
            .select('*')
            .lt('stock', supabase.raw('min_stock'))
        if (error) throw error
        return data
    },

    // Update stock
    updateStock: async (id, quantity, operation = 'set') => {
        if (operation === 'set') {
            return db.update('materials', id, { stock: quantity })
        }
        // For increment/decrement, use RPC or fetch-update pattern
        const material = await db.getById('materials', id)
        const newStock = operation === 'add'
            ? material.stock + quantity
            : material.stock - quantity
        return db.update('materials', id, { stock: Math.max(0, newStock) })
    }
}

export const productsService = {
    getAll: (filters) => db.getAll('products', { filters }),
    getById: (id) => db.getById('products', id),
    create: (data) => db.create('products', data),
    update: (id, data) => db.update('products', id, data),
    delete: (id) => db.delete('products', id),
    search: (term) => db.search('products', 'name', term),

    // Get product with BOM
    getWithBOM: async (id) => {
        const { data, error } = await supabase
            .from('products')
            .select(`
                *,
                bom (
                    *,
                    bom_components (*)
                )
            `)
            .eq('id', id)
            .single()
        if (error) throw error
        return data
    }
}

export const projectsService = {
    getAll: (filters) => db.getAll('projects', { filters }),
    getById: (id) => db.getById('projects', id),
    create: (data) => db.create('projects', data),
    update: (id, data) => db.update('projects', id, data),
    delete: (id) => db.delete('projects', id),

    // Get project with all related data
    getWithDetails: async (id) => {
        const { data, error } = await supabase
            .from('projects')
            .select(`
                *,
                clients (*),
                quotations (*),
                requisitions (*),
                operations (*)
            `)
            .eq('id', id)
            .single()
        if (error) throw error
        return data
    }
}

export const quotationsService = {
    getAll: (filters) => db.getAll('quotations', { filters }),
    getById: (id) => db.getById('quotations', id),
    create: (data) => db.create('quotations', data),
    update: (id, data) => db.update('quotations', id, data),
    delete: (id) => db.delete('quotations', id),

    // Get quotation with items
    getWithItems: async (id) => {
        const { data, error } = await supabase
            .from('quotations')
            .select(`
                *,
                quotation_items (*),
                clients (*)
            `)
            .eq('id', id)
            .single()
        if (error) throw error
        return data
    },

    // Add item to quotation
    addItem: async (quotationId, item) => {
        return db.create('quotation_items', { ...item, quotation_id: quotationId })
    },

    // Update quotation totals
    recalculateTotals: async (id) => {
        const { data: items } = await supabase
            .from('quotation_items')
            .select('total')
            .eq('quotation_id', id)

        const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0)
        const tax = subtotal * 0.16 // 16% IVA
        const total = subtotal + tax

        return db.update('quotations', id, { subtotal, tax, total })
    }
}

export const requisitionsService = {
    getAll: (filters) => db.getAll('requisitions', { filters }),
    getById: (id) => db.getById('requisitions', id),
    create: (data) => db.create('requisitions', data),
    update: (id, data) => db.update('requisitions', id, data),
    delete: (id) => db.delete('requisitions', id),

    // Workflow actions
    submit: (id) => db.update('requisitions', id, { status: 'PENDING_APPROVAL' }),
    approve: (id) => db.update('requisitions', id, { status: 'APPROVED' }),
    reject: (id, reason) => db.update('requisitions', id, { status: 'REJECTED', notes: reason }),
    cancel: (id) => db.update('requisitions', id, { status: 'CANCELLED' })
}

export const operationsService = {
    getAll: (filters) => db.getAll('operations', { filters }),
    getById: (id) => db.getById('operations', id),
    create: (data) => db.create('operations', data),
    update: (id, data) => db.update('operations', id, data),
    delete: (id) => db.delete('operations', id),

    // Get operation with stages and materials
    getWithDetails: async (id) => {
        const { data, error } = await supabase
            .from('operations')
            .select(`
                *,
                operation_stages (*),
                operation_materials (
                    *,
                    materials (*)
                ),
                projects (*)
            `)
            .eq('id', id)
            .single()
        if (error) throw error
        return data
    },

    // Update stage status
    updateStage: async (operationId, stageKey, stageData) => {
        const { data, error } = await supabase
            .from('operation_stages')
            .update(stageData)
            .eq('operation_id', operationId)
            .eq('stage_key', stageKey)
            .select()
            .single()
        if (error) throw error
        return data
    }
}

export const bomService = {
    getAll: (filters) => db.getAll('bom', { filters }),
    getById: (id) => db.getById('bom', id),
    create: (data) => db.create('bom', data),
    update: (id, data) => db.update('bom', id, data),
    delete: (id) => db.delete('bom', id),

    // Get BOM with components
    getWithComponents: async (id) => {
        const { data, error } = await supabase
            .from('bom')
            .select(`
                *,
                bom_components (
                    *,
                    materials (*)
                )
            `)
            .eq('id', id)
            .single()
        if (error) throw error
        return data
    },

    // Add component
    addComponent: async (bomId, component) => {
        return db.create('bom_components', { ...component, bom_id: bomId })
    },

    // Calculate costs
    calculateCosts: async (id) => {
        const bom = await bomService.getWithComponents(id)
        const totalMaterialCost = bom.bom_components.reduce(
            (sum, comp) => sum + (comp.total_cost || 0), 0
        )
        const totalCost = totalMaterialCost + (bom.labor_cost || 0) + (bom.overhead_cost || 0)
        const suggestedPrice = totalCost * (1 + (bom.margin || 30) / 100)

        return db.update('bom', id, {
            total_material_cost: totalMaterialCost,
            total_cost: totalCost,
            suggested_price: suggestedPrice
        })
    }
}

export const warehousesService = {
    getAll: (filters) => db.getAll('warehouses', { filters }),
    getById: (id) => db.getById('warehouses', id),
    create: (data) => db.create('warehouses', data),
    update: (id, data) => db.update('warehouses', id, data),
    delete: (id) => db.delete('warehouses', id)
}

export const categoriesService = {
    getAll: (filters) => db.getAll('categories', { filters }),
    getById: (id) => db.getById('categories', id),
    create: (data) => db.create('categories', data),
    update: (id, data) => db.update('categories', id, data),
    delete: (id) => db.delete('categories', id)
}

export const unitsService = {
    getAll: (filters) => db.getAll('units', { filters }),
    getById: (id) => db.getById('units', id),
    create: (data) => db.create('units', data),
    update: (id, data) => db.update('units', id, data),
    delete: (id) => db.delete('units', id)
}

export const profilesService = {
    getAll: (filters) => db.getAll('profiles', { filters }),
    getById: (id) => db.getById('profiles', id),
    update: (id, data) => db.update('profiles', id, data),

    // Get current user profile
    getCurrentProfile: async () => {
        const user = await auth.getUser()
        if (!user) return null
        return db.getById('profiles', user.id)
    }
}

export const attendanceService = {
    getAll: (filters) => db.getAll('attendance', { filters, orderBy: 'date' }),
    create: (data) => db.create('attendance', data),
    update: (id, data) => db.update('attendance', id, data),

    // Clock in
    clockIn: async (staffId) => {
        const today = new Date().toISOString().split('T')[0]
        const now = new Date().toTimeString().split(' ')[0].slice(0, 5)
        return db.create('attendance', {
            staff_id: staffId,
            date: today,
            clock_in: now,
            status: 'Present'
        })
    },

    // Clock out
    clockOut: async (attendanceId) => {
        const now = new Date().toTimeString().split(' ')[0].slice(0, 5)
        const record = await db.getById('attendance', attendanceId)
        const clockIn = record.clock_in

        // Calculate hours worked
        const [inH, inM] = clockIn.split(':').map(Number)
        const [outH, outM] = now.split(':').map(Number)
        const hoursWorked = ((outH * 60 + outM) - (inH * 60 + inM)) / 60

        return db.update('attendance', attendanceId, {
            clock_out: now,
            hours_worked: hoursWorked.toFixed(2)
        })
    }
}

export const activityLogService = {
    getAll: (filters) => db.getAll('activity_log', { filters, orderBy: 'created_at' }),

    // Log an activity
    log: async (action, entityType, entityId, oldData = null, newData = null) => {
        const user = await auth.getUser()
        return db.create('activity_log', {
            user_id: user?.id,
            action,
            entity_type: entityType,
            entity_id: entityId,
            old_data: oldData,
            new_data: newData
        })
    }
}

// ============================================
// REALTIME SUBSCRIPTIONS
// ============================================

export const realtime = {
    subscribe: (table, callback, filter = null) => {
        let channel = supabase
            .channel(`${table}_changes`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table,
                    ...(filter && { filter })
                },
                callback
            )
            .subscribe()

        return () => supabase.removeChannel(channel)
    },

    subscribeToOperations: (callback) => {
        return realtime.subscribe('operations', callback)
    },

    subscribeToMaterials: (callback) => {
        return realtime.subscribe('materials', callback)
    }
}

export default supabase
