import { calculateTeamCompatibility, findOptimalTeam } from '@/lib/utils/teamFormation'

describe('Team Formation', () => {
  const mockStudents = [
    {
      id: '1',
      skills: [
        { skill_id: 'js', proficiency_level: 4 },
        { skill_id: 'react', proficiency_level: 3 }
      ]
    },
    {
      id: '2',
      skills: [
        { skill_id: 'python', proficiency_level: 4 },
        { skill_id: 'django', proficiency_level: 3 }
      ]
    },
    {
      id: '3',
      skills: [
        { skill_id: 'js', proficiency_level: 2 },
        { skill_id: 'python', proficiency_level: 5 }
      ]
    }
  ]

  describe('calculateTeamCompatibility', () => {
    test('calculates skill coverage score', () => {
      const team = [mockStudents[0], mockStudents[1]]
      const score = calculateTeamCompatibility(team)
      
      expect(score.skillCoverage).toBeGreaterThan(0)
      expect(score.skillCoverage).toBeLessThanOrEqual(1)
    })

    test('considers skill proficiency levels', () => {
      const team = [mockStudents[0], mockStudents[2]]
      const score = calculateTeamCompatibility(team)
      
      // Team has overlapping skills but different proficiency levels
      expect(score.skillBalance).toBeGreaterThan(0.5)
    })

    test('penalizes duplicate skills with similar proficiency', () => {
      const duplicateTeam = [
        {
          id: '4',
          skills: [
            { skill_id: 'js', proficiency_level: 4 }
          ]
        },
        {
          id: '5',
          skills: [
            { skill_id: 'js', proficiency_level: 4 }
          ]
        }
      ]
      
      const score = calculateTeamCompatibility(duplicateTeam)
      expect(score.skillDiversity).toBeLessThan(0.5)
    })
  })

  describe('findOptimalTeam', () => {
    test('finds team with complementary skills', () => {
      const targetStudent = mockStudents[0]
      const availableStudents = [mockStudents[1], mockStudents[2]]
      
      const optimalTeam = findOptimalTeam(targetStudent, availableStudents, 3)
      
      expect(optimalTeam).toHaveLength(2)
      expect(optimalTeam[0]).toBe(mockStudents[1]) // Student with different skills
    })

    test('respects maximum team size', () => {
      const targetStudent = mockStudents[0]
      const availableStudents = [
        mockStudents[1],
        mockStudents[2],
        {
          id: '4',
          skills: [
            { skill_id: 'java', proficiency_level: 4 }
          ]
        }
      ]

      const maxSize = 2
      const optimalTeam = findOptimalTeam(targetStudent, availableStudents, maxSize)
      
      expect(optimalTeam.length).toBeLessThanOrEqual(maxSize - 1) // -1 because target student is not included
    })

    test('returns empty array if no compatible students found', () => {
      const targetStudent = mockStudents[0]
      const availableStudents = []
      
      const optimalTeam = findOptimalTeam(targetStudent, availableStudents, 3)
      
      expect(optimalTeam).toHaveLength(0)
    })
  })
}) 