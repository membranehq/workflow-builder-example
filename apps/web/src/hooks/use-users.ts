import axios from 'axios'
import useSWR from 'swr'
import { UsersResponse } from '@/types/user'
import { fetcher } from '@/lib/fetch-utils'

export function useUsers() {
  const { data, error, isLoading, mutate } = useSWR<UsersResponse>('/api/users', fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  })

  const importUsers = async () => {
    try {
      await axios.post('/api/users/import')

      // Refresh the users list
      await mutate()

      return true
    } catch (error) {
      console.error('Error importing users:', error)
      throw error
    }
  }

  return {
    users: data?.users ?? [],
    isLoading,
    isError: error,
    mutate,
    importUsers,
  }
}
