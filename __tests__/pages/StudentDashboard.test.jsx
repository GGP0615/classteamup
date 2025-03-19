import { render, screen, waitFor } from '@testing-library/react'
import StudentDashboardPage from '@/app/student/dashboard/page'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Mock the components used by the dashboard
jest.mock('@/components/teams/TeamAvailabilityCard', () => {
  return function MockTeamAvailabilityCard({ initialLookingForTeam, isProfileComplete }) {
    return (
      <div data-testid="team-availability-card">
        Team Availability: {initialLookingForTeam ? 'Enabled' : 'Disabled'}
        Profile Complete: {isProfileComplete ? 'Yes' : 'No'}
      </div>
    )
  }
})

jest.mock('@/components/dashboard/BrowseStudentsCard', () => {
  return function MockBrowseStudentsCard({ completionPercentage }) {
    return (
      <div data-testid="browse-students-card">
        Browse Students (Completion: {completionPercentage}%)
      </div>
    )
  }
})

jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: jest.fn()
}))

describe('StudentDashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    createClientComponentClient.mockReturnValue({
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          first_name: 'John',
          last_name: 'Doe',
          completion_percentage: 100,
          looking_for_team: true
        }
      })
    })
  })

  it('renders dashboard with user data', async () => {
    render(<StudentDashboardPage />)
    
    await waitFor(() => {
      expect(screen.getByText(/welcome, john/i)).toBeInTheDocument()
      expect(screen.getByText(/100%/)).toBeInTheDocument()
    })
  })

  it('shows loading state', async () => {
    createClientComponentClient.mockReturnValueOnce({
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(() => new Promise(() => {})) // Never resolves
    })
    
    render(<StudentDashboardPage />)
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('handles error state', async () => {
    createClientComponentClient.mockReturnValueOnce({
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockRejectedValue(new Error('Failed to load'))
    })
    
    render(<StudentDashboardPage />)
    
    await waitFor(() => {
      expect(screen.getByText(/error loading dashboard/i)).toBeInTheDocument()
    })
  })
}) 