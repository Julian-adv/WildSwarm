function choose_value(values: string[]): string {
  let actualCount = 1
  let itemsToChooseFrom = values

  // Check if the first value has the pattern m~n (number~number)
  const rangeMatch = values[0]?.match(/^(\d+)~(\d+)$/)
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1])
    const max = parseInt(rangeMatch[2])

    // Validate the range
    if (min <= max && min >= 0 && values.length > 1) {
      // Remove the range pattern from values
      itemsToChooseFrom = values.slice(1)

      // Determine how many items to select (between min and max)
      const count = min + Math.floor(Math.random() * (max - min + 1))

      // Ensure we don't try to select more items than available
      actualCount = Math.min(count, itemsToChooseFrom.length)

      if (actualCount === 0) return ''
    }
  }

  // Use the weighted selection logic to select multiple items
  const selectedItems = []
  const usedIndices = new Set<number>()

  for (let i = 0; i < actualCount; i++) {
    // First pass: Calculate total explicit weights and count items without weights
    let totalExplicitWeight = 0
    let itemsWithoutWeight = 0
    const parsedValues = itemsToChooseFrom
      .filter((_, index) => !usedIndices.has(index))
      .map((v) => {
        const parts = v.split(',', 2)
        const hasExplicitWeight = parts.length > 1 && /^\d+$/.test(parts[0])
        if (hasExplicitWeight) {
          totalExplicitWeight += parseInt(parts[0])
        } else {
          itemsWithoutWeight++
        }
        return { hasExplicitWeight, parts, originalIndex: itemsToChooseFrom.indexOf(v) }
      })

    // Calculate weight for items without explicit weight
    const remainingWeight = Math.max(0, 100 - totalExplicitWeight)
    const defaultWeight = itemsWithoutWeight > 0 ? remainingWeight / itemsWithoutWeight : 0

    // Second pass: Prepare weighted values with calculated weights
    let totalWeight = 0
    const weightedValues = parsedValues.map(({ hasExplicitWeight, parts, originalIndex }) => {
      const weight = hasExplicitWeight ? parseInt(parts[0]) : defaultWeight
      totalWeight += weight
      return {
        weight,
        value: hasExplicitWeight ? parts[1] : itemsToChooseFrom[originalIndex],
        originalIndex
      }
    })

    // Select random value based on weights
    let random = Math.random() * totalWeight
    let selectedValue = weightedValues[weightedValues.length - 1].value
    let selectedIndex = weightedValues[weightedValues.length - 1].originalIndex

    for (const { weight, value, originalIndex } of weightedValues) {
      if (random < weight) {
        selectedValue = value
        selectedIndex = originalIndex
        break
      }
      random -= weight
    }

    selectedItems.push(selectedValue)
    usedIndices.add(selectedIndex)
  }

  // Return the selected items as a comma-separated string
  return selectedItems.join(',')
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

function process_switch(text: string, selections: { [key: string]: string }): string {
  const parts = text.split('<switch>', 2)
  let value = parts[0].trim()
  if (parts.length > 1) {
    const slots = parts[1]
      .trim()
      .split(',')
      .filter((s) => s.trim())
    for (const slot of slots) {
      if (slot[0] === '-') {
        selections[slot.slice(1)] = 'disabled'
      } else if (slot[0] === '+') {
        selections[slot.slice(1)] = 'notempty'
      } else {
        selections[slot] = slot
      }
    }
  }
  value = choose_value_from(value)
  return value
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
    } else if (selection === 'random' || selection === 'notempty') {
      const chosenValue =
        selection === 'notempty'
          ? choose_value(values.filter((v) => v.trim() !== '' && v.split(',', 2)?.[1] !== ''))
          : choose_value(values)
      value = process_switch(chosenValue, selections)
      selections[key] = value
    } else if (selection === undefined) {
      value = ''
    } else {
      value = process_switch(selection, selections)
      selections[key] = value
    }
    const pattern = new RegExp(`__${key}__`, 'g')
    prompt = prompt.replace(pattern, value)
  }
  return { prompt, selections }
}
