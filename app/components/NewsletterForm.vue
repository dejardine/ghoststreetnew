<script setup lang="ts">
import { site } from '~~/site.config'

/**
 * Mailchimp signup, replacing the theme's embed + mc-validate.js (jQuery). Same list, same
 * behaviour: Enter submits (the submit button is visually hidden), the response message
 * appears inline. Without JS the form posts to Mailchimp in a new tab, as before.
 */
defineProps<{ heading: string | null }>()

const email = ref('')
const status = ref<'idle' | 'sending' | 'success' | 'error'>('idle')
const message = ref('')
const inlineError = ref('')
const { action, u, id } = site.mailchimp

function jsonp(url: string): Promise<{ result: string; msg: string }> {
  return new Promise((resolve, reject) => {
    const callback = `mc_cb_${Date.now()}`
    const script = document.createElement('script')
    const cleanup = () => {
      script.remove()
      delete (window as unknown as Record<string, unknown>)[callback]
    }
    ;(window as unknown as Record<string, unknown>)[callback] = (data: { result: string; msg: string }) => {
      cleanup()
      resolve(data)
    }
    script.src = `${url}&c=${callback}`
    script.onerror = () => {
      cleanup()
      reject(new Error('Mailchimp request failed'))
    }
    document.body.appendChild(script)
  })
}

async function submit(event: Event) {
  event.preventDefault()
  inlineError.value = ''
  message.value = ''
  const value = email.value.trim()
  if (!value) {
    inlineError.value = 'This field is required.'
    return
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    inlineError.value = 'Please enter a valid email address.'
    return
  }
  status.value = 'sending'
  try {
    const params = new URLSearchParams({ u, id, EMAIL: value })
    const res = await jsonp(`${action.replace('/post', '/post-json')}?${params}`)
    status.value = res.result === 'success' ? 'success' : 'error'
    /* Mailchimp messages can contain a "0 - " field prefix and markup; show plain text. */
    message.value = res.msg.replace(/^\d+\s-\s/, '').replace(/<[^>]+>/g, '')
    if (status.value === 'success') email.value = ''
  } catch {
    status.value = 'error'
    message.value = 'Sorry, we couldn’t sign you up just now. Please try again.'
  }
}
</script>

<template>
  <div id="mc_embed_signup">
    <form :action="action" method="post" target="_blank" novalidate @submit="submit">
      <h3>{{ heading || 'Sign up' }}</h3>
      <fieldset class="mc-field-group">
        <label for="mce-EMAIL">Email Address</label>
        <input
          id="mce-EMAIL"
          v-model="email"
          type="email"
          name="EMAIL"
          placeholder="Email Address"
          autocomplete="email"
          :class="{ mce_inline_error: inlineError }"
          :aria-invalid="!!inlineError"
          :aria-describedby="inlineError ? 'mce-inline-error' : undefined"
        >
        <div v-if="inlineError" id="mce-inline-error" class="mce_inline_error">{{ inlineError }}</div>
      </fieldset>
      <fieldset id="mce-responses" aria-live="polite">
        <div v-if="message" class="response" :class="status === 'success' ? 'success' : 'error'">{{ message }}</div>
      </fieldset>
      <input type="hidden" name="u" :value="u">
      <input type="hidden" name="id" :value="id">
      <div style="position: absolute; left: -5000px" aria-hidden="true">
        <input type="text" :name="`b_${u}_${id}`" tabindex="-1" value="">
      </div>
      <fieldset>
        <input type="submit" value="Subscribe" name="subscribe" class="button" :disabled="status === 'sending'">
      </fieldset>
    </form>
  </div>
</template>

<style lang="scss">
#mc_embed_signup {
  max-width: 50%;
  margin-bottom: 2.5rem;

  @include breakpoint(mobile) {
    max-width: 100%;
  }

  h3 {
    margin: 0 0 0.5rem;
    color: var(--taupe);

    @include breakpoint(mobile) {
      font-size: 1.5rem;
      line-height: 2rem;
    }
  }

  fieldset {
    width: 100%;
    margin: 0;
    padding: 0;
    border: none;
  }

  label {
    @include visuallyHidden;
  }

  input[type='email'] {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid transparent;
    border-radius: 0;
    background: var(--white);
    box-shadow: none;
    color: var(--black);
    @include lightFont;
    font-size: 1.5rem;
    line-height: 1;
    appearance: none;

    &::placeholder {
      color: #939598;
      opacity: 1;
    }

    &:focus {
      outline: none;
      background: #eee;
    }

    &.mce_inline_error {
      border-color: var(--taupe);
    }

    @include breakpoint(mobile) {
      font-size: 1.5rem;
      line-height: 2rem;
    }
  }

  input[type='submit'] {
    position: absolute;
    opacity: 0;
    visibility: hidden;
  }

  .mce_inline_error:not(input),
  #mce-responses {
    margin: 0.5rem 0 0;
    @include smallType;
  }

  .mce_inline_error:not(input) {
    color: var(--taupe);
  }

  #mce-responses {
    color: var(--white);
  }
}
</style>
