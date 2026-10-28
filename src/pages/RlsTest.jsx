import { useState, useEffect } from 'preact/hooks'
import { supabase } from '../lib/supabase.js'

export function RlsTest() {
  const [results, setResults] = useState({
    ordersSelect: 'pending',
    plansSelect: 'pending',
    listingsSelect: 'pending',
    ordersInsert: 'pending',
  })

  useEffect(() => {
    async function runChecks() {
      const res = {}

      // 1. orders select must return nothing (empty array) for anon
      try {
        const { data, error } = await supabase.from('orders').select('*')
        if (!error && Array.isArray(data) && data.length === 0) {
          res.ordersSelect = 'PASS: returned 0 rows for unauthenticated client'
        } else if (error) {
          res.ordersSelect = `FAIL/ERROR: ${error.message}`
        } else {
          res.ordersSelect = `FAIL: returned ${data.length} rows`
        }
      } catch (e) {
        res.ordersSelect = `ERROR: ${e.message}`
      }

      // 2. plans must be readable
      try {
        const { data, error } = await supabase.from('plans').select('*')
        if (!error && Array.isArray(data) && data.length > 0) {
          res.plansSelect = `PASS: successfully read ${data.length} plans (${data.map(p => p.name).join(', ')})`
        } else if (error) {
          res.plansSelect = `FAIL/ERROR: ${error.message}`
        } else {
          res.plansSelect = 'FAIL: 0 plans returned'
        }
      } catch (e) {
        res.plansSelect = `ERROR: ${e.message}`
      }

      // 3. active listings must be readable
      try {
        const { data, error } = await supabase.from('listings').select('*').eq('active', true)
        if (!error && Array.isArray(data)) {
          res.listingsSelect = `PASS: listings readable (${data.length} active listings)`
        } else if (error) {
          res.listingsSelect = `FAIL/ERROR: ${error.message}`
        }
      } catch (e) {
        res.listingsSelect = `ERROR: ${e.message}`
      }

      // 4. inserting into orders from browser client must fail
      try {
        const { error } = await supabase.from('orders').insert({
          delivery_city: 'Enugu',
          delivery_state: 'Enugu',
          needed_by: '2026-11-01',
          total_kobo: 500000,
        })
        if (error) {
          res.ordersInsert = `PASS: insert rejected by RLS/grants as expected (${error.message})`
        } else {
          res.ordersInsert = 'FAIL: insert succeeded unexpectedly!'
        }
      } catch (e) {
        res.ordersInsert = `PASS: exception caught (${e.message})`
      }

      setResults(res)
    }

    runChecks()
  }, [])

  return (
    <div className="p-8 max-w-2xl mx-auto font-mono text-sm bg-card border border-outline rounded-2xl my-8">
      <h1 className="text-xl font-bold font-heading mb-4">RLS Verification (Section 7)</h1>
      <pre id="rls-results">{JSON.stringify(results, null, 2)}</pre>
    </div>
  )
}
