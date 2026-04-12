import request from '@/utils/request'

export const getEscapeGame = async (id: string) => {
  const formData = new FormData()
  formData.append('id', id)
  await request.post('/game/escape-game', formData)
}