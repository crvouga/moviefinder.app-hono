import { useState } from 'hono/jsx/dom'
import { authClient } from '../client'

type Step = 'phone' | 'code'

const inputClass =
  'w-full px-4 py-3 rounded-xl bg-neutral-800 border border-neutral-700 focus:outline-none focus:border-neutral-500 text-lg'
const buttonClass =
  'w-full px-4 py-3 rounded-xl bg-neutral-100 text-neutral-900 font-medium disabled:opacity-50 transition-opacity'

export function LoginForm() {
  const [step, setStep] = useState<Step>('phone')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function sendCode(e: Event) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await authClient.phoneNumber.sendOtp({ phoneNumber })
    setLoading(false)
    if (error) {
      setError(error.message ?? 'Failed to send code')
      return
    }
    setStep('code')
  }

  async function verifyCode(e: Event) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await authClient.phoneNumber.verify({ phoneNumber, code })
    setLoading(false)
    if (error) {
      setError(error.message ?? 'Invalid or expired code')
      return
    }
    window.location.href = '/'
  }

  return (
    <div class="max-w-sm">
      {step === 'phone' ? (
        <form onSubmit={sendCode} class="flex flex-col gap-4">
          <label class="text-sm text-neutral-400" for="phone">
            Enter your phone number (include country code, e.g. +15551234567)
          </label>
          <input
            id="phone"
            type="tel"
            value={phoneNumber}
            onInput={(e) =>
              setPhoneNumber((e.target as HTMLInputElement).value)
            }
            placeholder="+15551234567"
            class={inputClass}
            autocomplete="tel"
            required
          />
          <button
            type="submit"
            disabled={loading || !phoneNumber.trim()}
            class={buttonClass}
          >
            {loading ? 'Sending...' : 'Send code'}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyCode} class="flex flex-col gap-4">
          <label class="text-sm text-neutral-400" for="code">
            Enter the code sent to {phoneNumber}
          </label>
          <input
            id="code"
            type="text"
            inputmode="numeric"
            value={code}
            onInput={(e) => setCode((e.target as HTMLInputElement).value)}
            placeholder="123456"
            class={inputClass}
            autocomplete="one-time-code"
            required
          />
          <button
            type="submit"
            disabled={loading || !code.trim()}
            class={buttonClass}
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep('phone')
              setCode('')
              setError(null)
            }}
            class="text-sm text-neutral-400 hover:text-neutral-100 transition-colors"
          >
            Use a different number
          </button>
        </form>
      )}
      {error && <p class="mt-4 text-sm text-red-400">{error}</p>}
    </div>
  )
}
