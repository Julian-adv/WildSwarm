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
  for (const [key, values] of Object.entries(wildcards)) {
    const selection = settings.selection[key]
    let value = ''
    if (selection === 'disabled') {
      value = ''
    } else if (selection === 'random') {
      value = values[Math.floor(Math.random() * values.length)]
    } else {
      value = selection
    }
    const pattern = new RegExp(`__${key}__`, 'g')
    result = result.replace(pattern, value)
  }
  return result
}
