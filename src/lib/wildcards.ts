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

export function process_wildcards(template: string, wildcards: { [key: string]: string[] }, settings: any): string {
  let result = ''
  if (settings.auto_template) {
    result = ''
    for (const key of Object.keys(wildcards)) {
      result += `__${key}__,`
    }
  } else {
    result = template
  }
  let temp_selection: { [key: string]: string } = { ...settings.selection }
  for (const [key, values] of Object.entries(wildcards)) {
    const selection = temp_selection[key]
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
          temp_selection[slot] = 'disabled'
        }
      }
    } else {
      value = selection
    }
    const pattern = new RegExp(`__${key}__`, 'g')
    result = result.replace(pattern, value)
  }
  return result
}
