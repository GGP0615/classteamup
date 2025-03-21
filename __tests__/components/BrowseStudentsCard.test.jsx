import { render, screen } from '@testing-library/react'
import BrowseStudentsCard from '@/components/dashboard/BrowseStudentsCard'
import { useRouter } from 'next/navigation'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}))

describe('BrowseStudentsCard', () => {
  const mockPush = jest.fn()
  
  beforeEach(() => {
    useRouter.mockReturnValue({
      push: mockPush
    })
  })

  test('renders with incomplete profile', () => {
    render(<BrowseStudentsCard completionPercentage={50} />)
    
    expect(screen.getByRole('heading', { name: /Browse Students/i })).toBeInTheDocument()
    expect(screen.getByText('Complete your profile to browse available students')).toBeInTheDocument()
  })

  test('renders with complete profile', () => {
    render(<BrowseStudentsCard completionPercentage={100} />)
    
    expect(screen.getByRole('heading', { name: /Browse Students/i })).toBeInTheDocument()
    expect(screen.getByText('Find other students with complementary skills')).toBeInTheDocument()
  })

  test('applies disabled state when profile is incomplete', () => {
    render(<BrowseStudentsCard completionPercentage={50} />)
    
    const card = screen.getByTestId('browse-students-card')
    expect(card).toHaveClass('opacity-50')
    expect(card).toHaveClass('cursor-not-allowed')
  })

  test('applies active state when profile is complete', () => {
    render(<BrowseStudentsCard completionPercentage={100} />)
    
    const card = screen.getByTestId('browse-students-card')
    expect(card).not.toHaveClass('opacity-50')
    expect(card).not.toHaveClass('cursor-not-allowed')
  })
}) 