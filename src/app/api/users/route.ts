import { NextRequest, NextResponse } from 'next/server'
// import connectDB from '@/lib/mongodb'
// import { User } from '@/models/user'
import { getAuthFromRequest } from '@/lib/server-auth'

export async function GET(request: NextRequest) {
  const auth = getAuthFromRequest(request)
  if (!auth.customerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Console log request data, to show node's data in use
  console.log('Request URI:', request.url)
  console.log('Request headers:', request.headers)

  // Fake getting users with properties suitable for filtering
  const users = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john.doe@example.com',
      age: 28,
      status: 'active',
      role: 'admin',
      department: 'engineering',
      createdAt: '2024-01-15T10:30:00Z',
      lastLogin: '2024-01-20T14:22:00Z',
    },
    {
      id: '2',
      name: 'Jane Doe',
      email: 'jane.doe@example.com',
      age: 32,
      status: 'active',
      role: 'user',
      department: 'marketing',
      createdAt: '2024-01-10T09:15:00Z',
      lastLogin: '2024-01-19T16:45:00Z',
    },
    {
      id: '3',
      name: 'Bob Smith',
      email: 'bob.smith@example.com',
      age: 25,
      status: 'inactive',
      role: 'user',
      department: 'sales',
      createdAt: '2024-01-05T11:20:00Z',
      lastLogin: '2024-01-15T08:30:00Z',
    },
    {
      id: '4',
      name: 'Alice Johnson',
      email: 'alice.johnson@example.com',
      age: 35,
      status: 'active',
      role: 'manager',
      department: 'engineering',
      createdAt: '2024-01-12T13:45:00Z',
      lastLogin: '2024-01-21T10:15:00Z',
    },
    {
      id: '5',
      name: 'Charlie Brown',
      email: 'charlie.brown@example.com',
      age: 22,
      status: 'pending',
      role: 'user',
      department: 'support',
      createdAt: '2024-01-18T15:30:00Z',
      lastLogin: null,
    },
  ]

  return NextResponse.json({ users }, { status: 200 })
}

// export async function GET(request: NextRequest) {
//   try {
//     // Get the customer ID from auth
//     const auth = getAuthFromRequest(request)
//     if (!auth.customerId) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
//     }

//     // await connectDB()

//     // Filter users by customerId
//     const users = await User.find({ customerId: auth.customerId })
//       .select('userId userName createdAt updatedAt')
//       .sort({ createdAt: -1 })

//     return NextResponse.json({ users }, { status: 200 })
//   } catch (error) {
//     console.error('Error fetching users:', error)
//     return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
//   }
// }
