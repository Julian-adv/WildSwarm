export type SlotValue = string | [string, string]

export function process_wildcards(template: string, wildcards: { [key: string]: SlotValue[] }, settings: any): string {
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
      const randomValue = values[Math.floor(Math.random() * values.length)]
      if (typeof randomValue === 'string') {
        value = randomValue
      } else if (Array.isArray(randomValue)) {
        value = randomValue[0]
        const disabled = (randomValue as [string, string])[1].split(',').filter((v) => v)
        for (const d of disabled) {
          temp_selection[d] = 'disabled'
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
