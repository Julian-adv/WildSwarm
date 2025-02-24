function choose_value(values: string[]): string {
  // First pass: Calculate total explicit weights and count items without weights
  let totalExplicitWeight = 0
  let itemsWithoutWeight = 0
  const parsedValues = values.map((v) => {
    const parts = v.split(',', 2)
    const hasExplicitWeight = parts.length > 1 && /^\d+$/.test(parts[0])
    if (hasExplicitWeight) {
      totalExplicitWeight += parseInt(parts[0])
    } else {
      itemsWithoutWeight++
    }
    return { hasExplicitWeight, parts }
  })

  // Calculate weight for items without explicit weight
  const remainingWeight = Math.max(0, 100 - totalExplicitWeight)
  const defaultWeight = itemsWithoutWeight > 0 ? remainingWeight / itemsWithoutWeight : 0

  // Second pass: Prepare weighted values with calculated weights
  let totalWeight = 0
  const weightedValues = parsedValues.map(({ hasExplicitWeight, parts }, i) => {
    const weight = hasExplicitWeight ? parseInt(parts[0]) : defaultWeight
    totalWeight += weight
    return { weight, value: hasExplicitWeight ? parts[1] : values[i] }
  })

  // Select random value based on weights
  let random = Math.random() * totalWeight
  let selectedValue = weightedValues[weightedValues.length - 1].value
  for (const { weight, value } of weightedValues) {
    if (random < weight) {
      selectedValue = value
      break
    }
    random -= weight
  }

  return selectedValue
}

function choose_value_from(text: string): string {
  // Find pattern like {abc|def|ghi}
  const matches = text.match(/\{([^}]+)\}/g)
  if (!matches) return text

  let result = text
  for (const match of matches) {
    // Extract options between { and }
    const options = match.slice(1, -1).split('|')
    // If there are consecutive |, it means there's an empty option
    const selectedOption = options[Math.floor(Math.random() * options.length)]
    result = result.replace(match, selectedOption)
  }

  return result
}

export function process_wildcards(
  template: string,
  wildcards: { [key: string]: string[] },
  settings: any
): { prompt: string; selections: { [key: string]: string } } {
  let prompt = ''
  if (settings.auto_template) {
    prompt = ''
    for (const key of Object.keys(wildcards)) {
      prompt += `__${key}__,`
    }
  } else {
    prompt = template
  }
  let selections: { [key: string]: string } = { ...settings.selection }
  for (const [key, values] of Object.entries(wildcards)) {
    const selection = selections[key]
    let value: string = ''
    if (selection === 'disabled') {
      value = ''
    } else if (selection === 'random') {
      const chosenValue = choose_value(values)
      const parts = chosenValue.split('<disable>', 2)
      value = parts[0].trim()
      if (parts.length > 1) {
        const disabledSlots = parts[1]
          .trim()
          .split(',')
          .filter((s) => s.trim())
        for (const slot of disabledSlots) {
          selections[slot] = 'disabled'
        }
      }
      value = choose_value_from(value)
      selections[key] = value
    } else {
      value = selection
    }
    const pattern = new RegExp(`__${key}__`, 'g')
    prompt = prompt.replace(pattern, value)
  }
  return { prompt, selections }
}
