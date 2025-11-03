import axios from 'axios'

// Simple axios-based fetcher for SWR that uses cookie-based authentication
export const fetcher = async <T>(url: string): Promise<T> => {
  try {
    const response = await axios.get<T>(url)
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const err = new Error('An error occurred while fetching the data.') as Error & { status?: number }
      err.status = error.response?.status
      throw err
    }
    throw error
  }
}
