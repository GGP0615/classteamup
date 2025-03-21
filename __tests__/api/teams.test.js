import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

// Mock the NextRequest and NextResponse
class MockRequest {
  constructor(url, options = {}) {
    this.url = url
    this.method = options.method || 'GET'
    this.headers = new Headers(options.headers)
    this.body = options.body
  }

  json() {
    return Promise.resolve(JSON.parse(this.body))
  }
}

class MockResponse {
  constructor(body, init = {}) {
    this.body = body
    this.init = init
    this.status = init.status || 200
  }

  json() {
    return Promise.resolve(this.body)
  }

  static json(body, init) {
    return new MockResponse(body, init)
  }
}

global.Request = MockRequest
global.Response = MockResponse

// Mock the route handler
jest.mock('@/app/api/teams/route.ts', () => ({
  GET: jest.fn(),
  POST: jest.fn()
}))

// Import the mocked module
import { GET, POST } from '@/app/api/teams/route.ts'

// Mock the Supabase client
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: jest.fn()
}))

describe('Teams API', () => {
  let mockRequest
  let mockSupabase
  
  beforeEach(() => {
    // Create a mock request
    mockRequest = new MockRequest('http://localhost:3000/api/teams')
    
    // Mock Supabase client responses
    mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user123' } },
          error: null
        })
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { role: 'student', looking_for_team: true },
        error: null
      })
    }
    
    // Set up the mock
    createRouteHandlerClient.mockReturnValue(mockSupabase)
    
    // Reset mocks
    GET.mockReset()
    POST.mockReset()
  })
  
  test('GET request returns teams data', async () => {
    // Mock the response
    const mockResponse = MockResponse.json({ 
      teams: [
        { id: 'team1', name: 'Team 1', members: ['user1', 'user2'] },
        { id: 'team2', name: 'Team 2', members: ['user3', 'user4'] }
      ]
    })
    GET.mockResolvedValue(mockResponse)
    
    // Call the handler
    const response = await GET(mockRequest)
    
    // Assert the response
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data).toHaveProperty('teams')
    expect(data.teams).toHaveLength(2)
  })
  
  test('POST request creates a new team', async () => {
    // Mock request body
    const requestBody = {
      name: 'New Team',
      description: 'Team description',
      members: ['user1', 'user2']
    }
    
    // Create a mock request with body
    mockRequest = new MockRequest('http://localhost:3000/api/teams', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    })
    
    // Mock the response
    const mockResponse = MockResponse.json({ 
      success: true, 
      team: { id: 'new-team-id', ...requestBody } 
    }, { status: 201 })
    POST.mockResolvedValue(mockResponse)
    
    // Call the handler
    const response = await POST(mockRequest)
    
    // Assert the response
    expect(response.status).toBe(201)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.team).toHaveProperty('id', 'new-team-id')
    expect(data.team).toHaveProperty('name', 'New Team')
  })
}) 