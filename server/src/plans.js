const scheduleTemplates = [
  ['Mon 5:30 PM - Sprint Drills', 'Wed 5:30 PM - Passing Patterns', 'Fri 6:00 PM - Match Simulation'],
  ['Tue 6:00 PM - Ball Control', 'Thu 5:00 PM - Finishing Practice', 'Sat 7:00 AM - Conditioning'],
  ['Mon 6:00 PM - Agility Work', 'Wed 6:30 PM - Tactical Positioning', 'Sun 8:00 AM - Recovery Session'],
]

const practiceTemplates = [
  ['50 short passes', '20 shooting reps', 'Core workout (15 min)'],
  ['30 cone dribbles', '15 long passes', 'Mobility routine (20 min)'],
  ['10 sprint intervals', '25 first-touch controls', 'Stretching + cooldown'],
]

export function buildDefaultPlan(studentName, studentEmail, index = 0) {
  const templateIndex = index % scheduleTemplates.length
  const matchesPlayed = 6 + index * 2
  const matchesToPlay = Math.max(12 - matchesPlayed, 2)

  return {
    studentEmail,
    studentName,
    matchesPlayed,
    matchesToPlay,
    schedule: scheduleTemplates[templateIndex],
    practicePlan: practiceTemplates[templateIndex],
  }
}
