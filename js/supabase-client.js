// Supabase light-weight client - no external dependencies required
// Implemented using native fetch

(function(window) {
    'use strict';

    class SupabaseClient {
        constructor(url, key) {
            this.url = url.replace(/\/$/, ''); // Remove trailing slash
            this.key = key;
            this.headers = {
                'apikey': key,
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json'
            };
        }

        // Build URL
        _buildUrl(table, queryString = '') {
            return `${this.url}/rest/v1/${table}${queryString}`;
        }

        // Query records
        async query(table, options = {}) {
            const params = new URLSearchParams();
            
            // Handle filters
            if (options.eq) {
                Object.entries(options.eq).forEach(([key, value]) => {
                    params.append(key, `eq.${value}`);
                });
            }
            
            // Handle select
            params.append('select', options.select || '*');
            
            // Handle order
            if (options.order) {
                params.append('order', `${options.order.column}.${options.order.ascending ? 'asc' : 'desc'}`);
            }
            
            // Handle limit
            if (options.limit) {
                params.append('limit', options.limit);
            }

            const url = this._buildUrl(table, '?' + params.toString());
            
            try {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: this.headers
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || `HTTP ${response.status}`);
                }

                const data = await response.json();
                return { data, error: null };
            } catch (error) {
                return { data: null, error };
            }
        }

        // Get by ID
        async getById(table, id) {
            return this.query(table, { eq: { id } });
        }

        // Insert record
        async insert(table, data) {
            const url = this._buildUrl(table);
            
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        ...this.headers,
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(data)
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || 'Insert failed');
                }

                const result = await response.json();
                return { data: result, error: null };
            } catch (error) {
                return { data: null, error };
            }
        }

        // Update record
        async update(table, id, data) {
            const url = this._buildUrl(table) + '?id=eq.' + id;
            
            try {
                const response = await fetch(url, {
                    method: 'PATCH',
                    headers: this.headers,
                    body: JSON.stringify(data)
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || 'Update failed');
                }

                const result = await response.json();
                return { data: result, error: null };
            } catch (error) {
                return { data: null, error };
            }
        }

        // Delete record
        async delete(table, id) {
            const url = this._buildUrl(table) + '?id=eq.' + id;
            
            try {
                const response = await fetch(url, {
                    method: 'DELETE',
                    headers: this.headers
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || 'Delete failed');
                }

                return { data: true, error: null };
            } catch (error) {
                return { data: null, error };
            }
        }

        // Delete with filters
        async deleteAll(table, filters) {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                params.append(key, `eq.${value}`);
            });

            const url = this._buildUrl(table, '?' + params.toString());
            
            try {
                const response = await fetch(url, {
                    method: 'DELETE',
                    headers: this.headers
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || 'Delete failed');
                }

                return { data: true, error: null };
            } catch (error) {
                return { data: null, error };
            }
        }
    }

    // Global client instance
    let supabaseInstance = null;

    // Initialize Supabase client
    window.initSupabase = function(url, key) {
        if (!url || !key) {
            console.error('❌ Supabase URL or Key is missing');
            return null;
        }
        
        supabaseInstance = new SupabaseClient(url, key);
        console.log('✅ Supabase client initialized');
        return supabaseInstance;
    };

    // Get Supabase client
    window.getSupabase = function() {
        if (!supabaseInstance) {
            console.error('❌ Supabase not initialized. Call initSupabase() first.');
            throw new Error('Supabase not initialized. Call initSupabase() first.');
        }
        return supabaseInstance;
    };

    // Check if initialized
    window.isSupabaseInitialized = function() {
        return supabaseInstance !== null;
    };

})(window);