/**
 * Storefy Content Design System
 * 
 * Inspired by QuickBooks/Intuit Content Design principles
 * Provides guidelines for voice, tone, and messaging consistency
 * 
 * Following Intuit's proven approach to avoid common content design errors:
 * - Be clear and precise
 * - Use active voice
 * - Speak to customers as "you"
 * - Use everyday contractions
 * - Think globally
 * - Use simple verb tenses
 */

// ===== VOICE & TONE GUIDELINES =====

/**
 * Storefy Voice Characteristics
 * Inspired by QuickBooks: Expert but approachable, confident without being overwhelming
 */
export const voiceCharacteristics = {
  expert: 'We know retail inside and out, but we explain things clearly',
  approachable: 'Professional yet friendly, never intimidating',
  confident: 'Assured in our capabilities without being arrogant',
  helpful: 'Always focused on solving customer problems',
  clear: 'Direct communication, no jargon or unnecessary complexity',
  supportive: 'Encouraging and understanding of business challenges',
} as const

/**
 * Tone Variations by Context
 * Adapting voice for different situations while maintaining consistency
 */
export const toneByContext = {
  onboarding: {
    tone: 'Encouraging and supportive',
    example: "Let's get your store set up! We'll guide you through each step.",
    avoid: "Complete the mandatory configuration process.",
  },
  errors: {
    tone: 'Helpful and solution-focused',
    example: "Something went wrong, but we can fix this together. Here's what to try:",
    avoid: "Error: Invalid input detected. Process terminated.",
  },
  success: {
    tone: 'Celebratory but not overwhelming',
    example: "Great! Your inventory is now synced across all locations.",
    avoid: "Congratulations! You have successfully completed the synchronization procedure!",
  },
  help: {
    tone: 'Patient and instructional',
    example: "Here's how to add a new product to your inventory:",
    avoid: "To add products, navigate to the product management interface.",
  },
  alerts: {
    tone: 'Clear and actionable',
    example: "Low stock alert: You have 3 items running low. Reorder now?",
    avoid: "Warning: Inventory levels have reached minimum threshold parameters.",
  },
} as const

// ===== WRITING PRINCIPLES =====

/**
 * Core Writing Principles
 * Based on Intuit's proven content design principles
 */
export const writingPrinciples = {
  clarity: {
    principle: 'Be clear and precise',
    guidelines: [
      'Use simple, everyday words',
      'Avoid jargon and technical terms',
      'Be specific rather than vague',
      'One idea per sentence',
    ],
    examples: {
      good: 'Your daily sales report is ready',
      bad: 'Your comprehensive daily sales analytics compilation has been generated',
    },
  },
  activeVoice: {
    principle: 'Use active voice',
    guidelines: [
      'Subject performs the action',
      'More direct and engaging',
      'Clearer responsibility',
    ],
    examples: {
      good: 'We updated your inventory',
      bad: 'Your inventory has been updated',
    },
  },
  personalAddress: {
    principle: 'Speak to customers as "you"',
    guidelines: [
      'Direct address creates connection',
      'Avoid third person references',
      'Make it conversational',
    ],
    examples: {
      good: 'You can track your sales in real-time',
      bad: 'Users can track their sales in real-time',
    },
  },
  contractions: {
    principle: 'Use everyday contractions',
    guidelines: [
      'Sounds more natural and friendly',
      'Reduces formality barrier',
      'Common contractions only',
    ],
    examples: {
      good: "We'll send you a reminder",
      bad: "We will send you a reminder",
    },
  },
  globalThinking: {
    principle: 'Think globally',
    guidelines: [
      'Avoid cultural references',
      'Use universal concepts',
      'Consider translation needs',
      'Inclusive language',
    ],
    examples: {
      good: 'Your store is performing well',
      bad: 'Your store is hitting it out of the park',
    },
  },
  simpleVerbs: {
    principle: 'Use simple verb tenses',
    guidelines: [
      'Present tense when possible',
      'Avoid complex tenses',
      'Clear temporal relationships',
    ],
    examples: {
      good: 'Save your changes',
      bad: 'You will have been saving your changes',
    },
  },
} as const

// ===== CONTENT PATTERNS =====

/**
 * Common UI Content Patterns
 * Consistent messaging for common interface elements
 */
export const contentPatterns = {
  buttons: {
    primary: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      confirm: 'Confirm',
      continue: 'Continue',
      getStarted: 'Get started',
    },
    secondary: {
      learnMore: 'Learn more',
      viewDetails: 'View details',
      editItem: 'Edit',
      duplicate: 'Duplicate',
      export: 'Export',
    },
  },
  
  formFields: {
    required: 'Required',
    optional: 'Optional',
    placeholders: {
      search: 'Search...',
      email: 'Enter your email',
      password: 'Enter your password',
      storeName: 'Enter store name',
      productName: 'Enter product name',
    },
  },

  feedback: {
    loading: {
      default: 'Loading...',
      saving: 'Saving your changes...',
      processing: 'Processing...',
      syncing: 'Syncing data...',
    },
    success: {
      saved: 'Changes saved successfully',
      created: 'Item created successfully',
      updated: 'Item updated successfully',
      deleted: 'Item deleted successfully',
    },
    errors: {
      generic: 'Something went wrong. Please try again.',
      network: 'Connection issue. Check your internet and try again.',
      validation: 'Please check your information and try again.',
      permission: "You don't have permission to do this.",
    },
  },

  navigation: {
    breadcrumbs: {
      home: 'Home',
      back: 'Back',
      previous: 'Previous',
      next: 'Next',
    },
    pagination: {
      previous: 'Previous',
      next: 'Next',
      page: 'Page',
      of: 'of',
      showing: 'Showing',
      results: 'results',
    },
  },

  emptyStates: {
    noData: "You don't have any {item} yet",
    noResults: 'No results found',
    noConnection: "Can't connect right now",
    getStarted: "Let's get started by adding your first {item}",
  },
} as const

// ===== UTILITY FUNCTIONS =====

/**
 * Format content with consistent patterns
 */
export function formatContent(template: string, variables: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => variables[key] || match)
}

/**
 * Get appropriate tone for context
 */
export function getToneGuidance(context: keyof typeof toneByContext) {
  return toneByContext[context]
}

/**
 * Validate content against writing principles
 */
export function validateContent(text: string): {
  isValid: boolean
  suggestions: string[]
} {
  const suggestions: string[] = []
  
  // Check for passive voice indicators
  const passiveIndicators = ['was', 'were', 'been', 'being', 'is', 'are', 'am']
  const hasPassiveVoice = passiveIndicators.some(indicator => 
    text.toLowerCase().includes(` ${indicator} `)
  )
  
  if (hasPassiveVoice) {
    suggestions.push('Consider using active voice for clearer communication')
  }
  
  // Check for jargon/complex terms
  const jargonTerms = ['utilize', 'facilitate', 'implement', 'execute', 'parameters']
  const hasJargon = jargonTerms.some(term => 
    text.toLowerCase().includes(term.toLowerCase())
  )
  
  if (hasJargon) {
    suggestions.push('Replace technical jargon with simpler, everyday words')
  }
  
  // Check sentence length (aim for under 20 words)
  const sentences = text.split(/[.!?]+/)
  const longSentences = sentences.filter(sentence => 
    sentence.trim().split(' ').length > 20
  )
  
  if (longSentences.length > 0) {
    suggestions.push('Break up long sentences for better readability')
  }
  
  return {
    isValid: suggestions.length === 0,
    suggestions,
  }
}

// ===== WORD LIST =====

/**
 * Preferred terminology for consistency
 * Based on Intuit's word list approach
 */
export const wordList = {
  // Preferred terms
  preferred: {
    'sign in': 'not login or log in',
    'email': 'not e-mail',
    'setup': 'noun, not set up',
    'set up': 'verb, not setup',
    'website': 'not web site',
    'online': 'not on-line',
    'real-time': 'adjective, real time as noun',
    'point of sale': 'not point-of-sale or POS in user-facing content',
  },
  
  // Terms to avoid
  avoid: {
    'utilize': 'use instead',
    'facilitate': 'help or enable instead',
    'purchase': 'buy instead (in most contexts)',
    'commence': 'start or begin instead',
    'terminate': 'end or stop instead',
  },
} as const

export type ContentDesignSystem = {
  voice: typeof voiceCharacteristics
  tone: typeof toneByContext
  principles: typeof writingPrinciples
  patterns: typeof contentPatterns
  wordList: typeof wordList
}

export const contentDesign: ContentDesignSystem = {
  voice: voiceCharacteristics,
  tone: toneByContext,
  principles: writingPrinciples,
  patterns: contentPatterns,
  wordList,
}
