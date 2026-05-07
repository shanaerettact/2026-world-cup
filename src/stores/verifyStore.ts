import { defineStore } from 'pinia'
import { ref } from 'vue'
import { submitUserVerify, type SubmitUserVerifyParams } from '@/services/api/verifyApi'

export const useVerifyStore = defineStore('verify', () => {
  const isSubmitting = ref(false)

  async function submitVerification(payload: SubmitUserVerifyParams): Promise<unknown> {
    isSubmitting.value = true
    try {
      return await submitUserVerify(payload)
    } finally {
      isSubmitting.value = false
    }
  }

  return { isSubmitting, submitVerification }
})
