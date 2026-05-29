import { useState } from 'hono/jsx/dom'
import { authClient } from '../client'
import { Button, TextInput, Field, Alert } from '../../components/ui'

type Step = 'phone' | 'code'

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
    <div class="flex flex-col gap-4">
      {step === 'phone' ? (
        <form onSubmit={sendCode} class="flex flex-col gap-4">
          <Field
            label="Phone number"
            htmlFor="phone"
            hint="Include your country code, e.g. +15551234567"
          >
            <TextInput
              id="phone"
              type="tel"
              value={phoneNumber}
              onInput={(e) =>
                setPhoneNumber((e.target as HTMLInputElement).value)
              }
              placeholder="+15551234567"
              autocomplete="tel"
              required
            />
          </Field>
          <Button
            type="submit"
            variant="primary"
            block
            loading={loading}
            disabled={!phoneNumber.trim()}
          >
            {loading ? 'Sending…' : 'Send code'}
          </Button>
        </form>
      ) : (
        <form onSubmit={verifyCode} class="flex flex-col gap-4">
          <Field
            label="Verification code"
            htmlFor="code"
            hint={`Sent to ${phoneNumber}`}
          >
            <TextInput
              id="code"
              type="text"
              inputmode="numeric"
              value={code}
              onInput={(e) => setCode((e.target as HTMLInputElement).value)}
              placeholder="123456"
              autocomplete="one-time-code"
              required
            />
          </Field>
          <Button
            type="submit"
            variant="primary"
            block
            loading={loading}
            disabled={!code.trim()}
          >
            {loading ? 'Verifying…' : 'Verify'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setStep('phone')
              setCode('')
              setError(null)
            }}
          >
            Use a different number
          </Button>
        </form>
      )}
      {error ? <Alert variant="error">{error}</Alert> : null}
    </div>
  )
}
