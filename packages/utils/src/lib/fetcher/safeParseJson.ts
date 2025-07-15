/**
 * Parses the input JSON string and returns the parsed JSON object, or returns the input string if parsing fails.
 *
 * @param {string} json - The JSON string to be parsed
 * @return {any} The parsed JSON object, or the input string if parsing fails
 */
export const safeParseJson = (json: string) => {
  try {
    return JSON.parse(json);
  } catch (error) {
    return json;
  }
};
