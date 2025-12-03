import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export const useDashboardStats = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    notesPerWeek: [],
    timePerCustomer: [],
    notesByType: [],
    activityByDay: [],
  })

  const fetchStats = useCallback(async () => {
    if (!user) return

    setLoading(true)

    try {
      // Datum před 8 týdny
      const eightWeeksAgo = new Date()
      eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56)

      // Paralelní načtení dat
      const [notesRes, timeEntriesRes] = await Promise.all([
        // Poznámky za posledních 8 týdnů
        supabase
          .from('notes')
          .select('id, created_at, meeting_type, customer:customers(id, name)')
          .eq('user_id', user.id)
          .gte('created_at', eightWeeksAgo.toISOString())
          .order('created_at', { ascending: true }),

        // Časové záznamy za posledních 8 týdnů
        supabase
          .from('note_time_entries')
          .select(`
            id,
            duration_minutes,
            entry_date,
            note:notes(
              id,
              customer:customers(id, name)
            )
          `)
          .eq('user_id', user.id)
          .gte('entry_date', eightWeeksAgo.toISOString())
          .order('entry_date', { ascending: true }),
      ])

      const notes = notesRes.data || []
      const timeEntries = timeEntriesRes.data || []

      // Zpracování dat pro grafy
      const processedStats = processStats(notes, timeEntries)
      setStats(processedStats)
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return { loading, stats, refetch: fetchStats }
}

// Pomocná funkce pro zpracování statistik
function processStats(notes, timeEntries) {
  // 1. Poznámky za týden (posledních 8 týdnů)
  const notesPerWeek = getNotesPerWeek(notes)

  // 2. Čas strávený s zákazníky
  const timePerCustomer = getTimePerCustomer(timeEntries)

  // 3. Poznámky podle typu schůzky
  const notesByType = getNotesByType(notes)

  // 4. Aktivita podle dne v týdnu
  const activityByDay = getActivityByDay(notes)

  return { notesPerWeek, timePerCustomer, notesByType, activityByDay }
}

function getNotesPerWeek(notes) {
  const weeks = []
  const now = new Date()

  // Vytvořit posledních 8 týdnů
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(now)
    weekStart.setDate(weekStart.getDate() - (i * 7) - weekStart.getDay() + 1)
    weekStart.setHours(0, 0, 0, 0)

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    const count = notes.filter((note) => {
      const noteDate = new Date(note.created_at)
      return noteDate >= weekStart && noteDate <= weekEnd
    }).length

    // Formát: "1.12" (den.měsíc)
    const label = `${weekStart.getDate()}.${weekStart.getMonth() + 1}`

    weeks.push({ label, count })
  }

  return weeks
}

function getTimePerCustomer(timeEntries) {
  const customerTime = {}

  timeEntries.forEach((entry) => {
    const customerName = entry.note?.customer?.name || 'Neznámý'
    if (!customerTime[customerName]) {
      customerTime[customerName] = 0
    }
    customerTime[customerName] += entry.duration_minutes
  })

  // Převést na pole a seřadit podle času
  return Object.entries(customerTime)
    .map(([name, minutes]) => ({
      name: name.length > 15 ? name.substring(0, 15) + '...' : name,
      hours: Math.round((minutes / 60) * 10) / 10, // Zaokrouhleno na 1 desetinné místo
    }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 5) // Top 5 zákazníků
}

function getNotesByType(notes) {
  const typeLabels = {
    meeting: 'Schůzka',
    phone: 'Telefon',
    email: 'Email',
    other: 'Ostatní',
  }

  const typeCounts = {
    meeting: 0,
    phone: 0,
    email: 0,
    other: 0,
  }

  notes.forEach((note) => {
    const type = note.meeting_type || 'other'
    if (typeCounts[type] !== undefined) {
      typeCounts[type]++
    } else {
      typeCounts.other++
    }
  })

  return Object.entries(typeCounts)
    .filter(([_, count]) => count > 0)
    .map(([type, count]) => ({
      type,
      label: typeLabels[type] || type,
      count,
    }))
}

function getActivityByDay(notes) {
  const dayLabels = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So']
  const dayCounts = [0, 0, 0, 0, 0, 0, 0]

  notes.forEach((note) => {
    const day = new Date(note.created_at).getDay()
    dayCounts[day]++
  })

  return dayLabels.map((label, index) => ({
    day: label,
    count: dayCounts[index],
  }))
}
