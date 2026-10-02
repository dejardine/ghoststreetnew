import * as prismic from '@prismicio/client'

/** A single-paragraph rich text field as plain lines (editors use Shift+Enter for new lines). */
export const lines = (field: prismic.RichTextField | null | undefined) => prismic.asText(field ?? []).split('\n')
