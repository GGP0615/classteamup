import { TeamFormationRule } from "./teamRules"

interface Skill {
  skill_id: string;
  proficiency_level: number;
}

interface Student {
  id: string;
  skills: Skill[];
}

interface TeamScore {
  skillCoverage: number;
  skillBalance: number;
  skillDiversity: number;
  total: number;
}

interface Team {
  members: Student[]
  skillCoverage: {
    [skillId: string]: number // Number of members with required proficiency
  }
  averageProficiency: number
}

// Add type for cached calculations
interface CachedSkillData {
  [studentId: string]: {
    skillCount: number
    skillCoverage: { [skillId: string]: number }
  }
}

// Add memoization for expensive calculations
const skillCache: CachedSkillData = {}

export function formTeams(
  students: Student[],
  rules: TeamFormationRule
): Team[] {
  // Clear cache for new formation
  Object.keys(skillCache).forEach(key => delete skillCache[key])

  // Pre-calculate skill data for all students
  students.forEach(student => {
    skillCache[student.id] = {
      skillCount: calculateStudentSkillCount(student, rules),
      skillCoverage: calculateStudentSkillCoverage(student, rules)
    }
  })

  // Sort students using cached data
  const sortedStudents = [...students].sort((a, b) => 
    skillCache[b.id].skillCount - skillCache[a.id].skillCount
  )

  const teams: Team[] = []
  const targetTeamSize = calculateTargetTeamSize(students.length, rules)

  // Batch process team creation
  while (sortedStudents.length >= rules.min_team_size) {
    const team = createOptimalTeam(
      sortedStudents,
      targetTeamSize,
      rules
    )
    teams.push(team)
  }

  // Handle remaining students
  if (sortedStudents.length > 0) {
    distributeRemainingStudents(sortedStudents, teams, rules)
  }

  return teams
}

function calculateStudentSkillCount(
  student: Student,
  rules: TeamFormationRule
): number {
  return student.skills.filter(skill =>
    rules.required_skills.some(req =>
      req.skillId === skill.skill_id &&
      skill.proficiency_level >= req.minProficiency
    )
  ).length
}

function calculateStudentSkillCoverage(
  student: Student,
  rules: TeamFormationRule
): { [skillId: string]: number } {
  const coverage: { [skillId: string]: number } = {}
  
  rules.required_skills.forEach(requirement => {
    coverage[requirement.skillId] = student.skills.some(skill =>
      skill.skill_id === requirement.skillId &&
      skill.proficiency_level >= requirement.minProficiency
    ) ? 1 : 0
  })

  return coverage
}

function calculateTargetTeamSize(
  totalStudents: number,
  rules: TeamFormationRule
): number {
  return Math.min(
    rules.max_team_size,
    Math.max(
      rules.min_team_size,
      Math.ceil(totalStudents / Math.floor(totalStudents / rules.max_team_size))
    )
  )
}

function createOptimalTeam(
  availableStudents: Student[],
  targetSize: number,
  rules: TeamFormationRule
): Team {
  const team: Team = {
    members: [availableStudents.shift()!],
    skillCoverage: {},
    averageProficiency: 0
  }

  team.skillCoverage = { ...skillCache[team.members[0].id].skillCoverage }

  while (team.members.length < targetSize && availableStudents.length > 0) {
    let bestStudentIndex = 0
    let bestScore = -1

    // Use batch processing for score calculation
    for (let i = 0; i < Math.min(availableStudents.length, 10); i++) {
      const score = calculateTeamScore(team, availableStudents[i], rules)
      if (score > bestScore) {
        bestScore = score
        bestStudentIndex = i
      }
    }

    const selectedStudent = availableStudents.splice(bestStudentIndex, 1)[0]
    team.members.push(selectedStudent)
    
    // Update team skill coverage using cached data
    Object.entries(skillCache[selectedStudent.id].skillCoverage).forEach(([skillId, count]) => {
      team.skillCoverage[skillId] = (team.skillCoverage[skillId] || 0) + count
    })
  }

  return team
}

function distributeRemainingStudents(
  remainingStudents: Student[],
  teams: Team[],
  rules: TeamFormationRule
): void {
  remainingStudents.forEach(student => {
    let bestTeam = teams[0]
    let bestScore = calculateTeamScore(bestTeam, student, rules)

    teams.forEach(team => {
      if (team.members.length >= rules.max_team_size) return
      const score = calculateTeamScore(team, student, rules)
      if (score > bestScore) {
        bestScore = score
        bestTeam = team
      }
    })

    bestTeam.members.push(student)
    Object.entries(skillCache[student.id].skillCoverage).forEach(([skillId, count]) => {
      bestTeam.skillCoverage[skillId] = (bestTeam.skillCoverage[skillId] || 0) + count
    })
  })
}

// Update score calculation to use cached data
function calculateTeamScore(
  team: Team,
  student: Student,
  rules: TeamFormationRule
): number {
  let score = 0
  const studentCoverage = skillCache[student.id].skillCoverage

  rules.required_skills.forEach(requirement => {
    const currentCoverage = team.skillCoverage[requirement.skillId] || 0
    const studentContribution = studentCoverage[requirement.skillId] || 0
    
    if (currentCoverage < requirement.minCount) {
      score += studentContribution * 10
    }
  })

  score += rules.skill_distribution_rules.diversityWeight * 
    Object.values(studentCoverage).reduce((sum, count) => sum + count, 0)

  return score
}

// Add this function back with the export
export function calculateTeamSkillCoverage(members: Student[], rules: TeamFormationRule): Record<string, number> {
  const coverage: Record<string, number> = {}
  
  rules.required_skills.forEach(requirement => {
    coverage[requirement.skillId] = members.reduce((count, member) => 
      count + (skillCache[member.id]?.skillCoverage[requirement.skillId] || 0), 0
    )
  })

  return coverage
}

// Make sure calculateTeamScore is also exported
export { calculateTeamScore }

function calculateTeamCompatibility(team: Student[]): TeamScore {
  if (!team || team.length === 0) {
    return {
      skillCoverage: 0,
      skillBalance: 0,
      skillDiversity: 0,
      total: 0
    }
  }

  // Get all unique skills in the team
  const allSkills = new Set<string>()
  const skillMap = new Map<string, number[]>()

  team.forEach(student => {
    student.skills.forEach(skill => {
      allSkills.add(skill.skill_id)
      if (!skillMap.has(skill.skill_id)) {
        skillMap.set(skill.skill_id, [])
      }
      skillMap.get(skill.skill_id)?.push(skill.proficiency_level)
    })
  })

  // Calculate skill coverage (how many different skills are covered)
  const skillCoverage = allSkills.size / (team.length * 3) // Assuming ideal is 3 unique skills per person

  // Calculate skill balance (distribution of proficiency levels)
  let skillBalance = 0
  skillMap.forEach(levels => {
    const avg = levels.reduce((a, b) => a + b, 0) / levels.length
    const variance = levels.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / levels.length
    skillBalance += 1 / (1 + variance) // Higher variance means lower balance
  })
  skillBalance = skillBalance / skillMap.size

  // Calculate skill diversity (penalize duplicate skills)
  let duplicatePenalty = 0;
  const seenSkills = new Map<string, number[]>();
  
  team.forEach(student => {
    student.skills.forEach(skill => {
      if (!seenSkills.has(skill.skill_id)) {
        seenSkills.set(skill.skill_id, [skill.proficiency_level]);
      } else {
        const existingProficiencies = seenSkills.get(skill.skill_id)!;
        // Apply a stronger penalty for similar proficiency levels
        existingProficiencies.forEach(existingProf => {
          if (Math.abs(existingProf - skill.proficiency_level) <= 1) {
            duplicatePenalty += 0.6; // Increased from 0.4 to 0.6
          }
        });
        existingProficiencies.push(skill.proficiency_level);
      }
    });
  });
  
  const skillDiversity = Math.max(0, 1 - duplicatePenalty);

  // Calculate total score with weights
  const total = (
    skillCoverage * 0.4 + // 40% weight on skill coverage
    skillBalance * 0.3 + // 30% weight on skill balance
    skillDiversity * 0.3 // 30% weight on skill diversity
  )

  return {
    skillCoverage,
    skillBalance,
    skillDiversity,
    total
  }
}

function findOptimalTeam(targetStudent: Student, availableStudents: Student[], maxSize: number): Student[] {
  if (!availableStudents || availableStudents.length === 0) {
    return []
  }

  // Sort students by compatibility score with target student
  const scoredStudents = availableStudents.map(student => ({
    student,
    score: calculateTeamCompatibility([targetStudent, student]).total
  }))

  scoredStudents.sort((a, b) => b.score - a.score)

  // Take the top N-1 students (N = maxSize)
  const selectedStudents = scoredStudents
    .slice(0, maxSize - 1)
    .map(({ student }) => student)

  // Verify the final team score
  const finalTeam = [targetStudent, ...selectedStudents]
  const finalScore = calculateTeamCompatibility(finalTeam)

  // Only return the team if the score is above a threshold
  return finalScore.total >= 0.5 ? selectedStudents : []
}

export { calculateTeamCompatibility, findOptimalTeam } 